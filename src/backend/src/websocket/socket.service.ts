/**
 * @fileoverview Enhanced WebSocket service implementation with production-grade features
 * Implements secure real-time communication with connection pooling, circuit breakers,
 * and comprehensive monitoring for the Identity Matrix platform.
 * @version 1.0.0
 */

import { Server, Socket } from 'socket.io'; // v4.7.1
import { createAdapter } from '@socket.io/redis-adapter'; // v8.2.1
import { injectable } from 'inversify'; // v6.0.1
import { Logger } from '@nestjs/common'; // v9.x
import { CircuitBreaker } from 'opossum'; // v7.1.0
import { RateLimiterRedis } from 'rate-limiter-flexible'; // v3.0.0

import { ActivityHandler } from './handlers/activity.handler';
import { VisitorHandler } from './handlers/visitor.handler';
import { JwtService } from '../services/auth/jwt.service';
import { ErrorTypes } from '../constants/error.constants';
import { VISITOR_STATUS } from '../constants/visitor.constants';

/**
 * Configuration interface for WebSocket server
 */
interface ConnectionConfig {
  cors: {
    origin: string[];
    credentials: boolean;
  };
  pingTimeout: number;
  pingInterval: number;
}

/**
 * Enhanced WebSocket service with production features
 */
@injectable()
export class WebSocketService {
  private server: Server;
  private readonly logger = new Logger('WebSocketService');
  private readonly connectionPool: Map<string, Socket[]> = new Map();
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimiter: RateLimiterRedis;
  private readonly healthMetrics: Map<string, number> = new Map();

  constructor(
    private readonly activityHandler: ActivityHandler,
    private readonly visitorHandler: VisitorHandler,
    private readonly jwtService: JwtService,
    private readonly redisClient: any,
    private readonly metricsCollector: any
  ) {
    // Initialize circuit breaker for external dependencies
    this.circuitBreaker = new CircuitBreaker(this.handleExternalCall, {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    });

    // Initialize rate limiter
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'websocket_limit',
      points: 100,
      duration: 60
    });

    // Set up circuit breaker event handlers
    this.setupCircuitBreakerEvents();
  }

  /**
   * Initializes the WebSocket server with enhanced production features
   */
  public async initialize(port: number, config: ConnectionConfig): Promise<void> {
    try {
      this.server = new Server({
        cors: config.cors,
        pingTimeout: config.pingTimeout,
        pingInterval: config.pingInterval,
        transports: ['websocket', 'polling']
      });

      // Set up Redis adapter for horizontal scaling
      const pubClient = this.redisClient.duplicate();
      const subClient = this.redisClient.duplicate();
      this.server.adapter(createAdapter(pubClient, subClient));

      // Set up connection handling
      this.server.on('connection', (socket: Socket) => this.handleConnection(socket));

      // Set up health check endpoint
      this.server.of('/health').on('connection', (socket) => {
        socket.emit('status', { status: 'healthy', timestamp: new Date() });
      });

      // Start server
      await this.server.listen(port);
      this.logger.log(`WebSocket server initialized on port ${port}`);

      // Start metrics collection
      this.startMetricsCollection();
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket server', error.stack);
      throw error;
    }
  }

  /**
   * Handles new socket connections with enhanced security and monitoring
   */
  private async handleConnection(socket: Socket): Promise<void> {
    try {
      const clientId = socket.handshake.auth.companyId;
      const token = socket.handshake.auth.token;

      // Validate rate limits
      await this.checkRateLimit(socket.id);

      // Authenticate connection
      const authResult = await this.authenticateConnection(token);
      if (!authResult.valid) {
        throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
      }

      // Set up socket metadata
      socket.data.companyId = clientId;
      socket.data.userId = authResult.userId;
      socket.data.correlationId = crypto.randomUUID();

      // Add to connection pool
      this.addToConnectionPool(clientId, socket);

      // Set up event listeners
      this.setupEventListeners(socket);

      // Initialize heartbeat monitoring
      this.initializeHeartbeat(socket);

      // Update metrics
      this.updateConnectionMetrics('increment');

      this.logger.debug('Client connected', {
        socketId: socket.id,
        companyId: clientId,
        correlationId: socket.data.correlationId
      });
    } catch (error) {
      this.logger.error('Connection handling failed', {
        socketId: socket.id,
        error: error.message
      });
      socket.emit('error', { message: 'Connection failed', code: error.message });
      socket.disconnect(true);
    }
  }

  /**
   * Sets up event listeners for socket with error handling
   */
  private setupEventListeners(socket: Socket): void {
    // Visitor activity events
    socket.on('visitor:activity', async (data) => {
      try {
        await this.circuitBreaker.fire(() =>
          this.activityHandler.handleActivityEvent(socket, data)
        );
      } catch (error) {
        this.handleEventError(socket, 'visitor:activity', error);
      }
    });

    // Visitor identification events
    socket.on('visitor:identify', async (data) => {
      try {
        await this.circuitBreaker.fire(() =>
          this.visitorHandler.handleIdentificationEvent(socket, data)
        );
      } catch (error) {
        this.handleEventError(socket, 'visitor:identify', error);
      }
    });

    // Subscription events
    socket.on('subscribe:visitor', async (visitorId) => {
      try {
        await this.visitorHandler.subscribeToVisitor(socket, visitorId);
      } catch (error) {
        this.handleEventError(socket, 'subscribe:visitor', error);
      }
    });

    // Disconnection handling
    socket.on('disconnect', () => this.handleDisconnection(socket));
  }

  /**
   * Handles socket disconnection with cleanup
   */
  private handleDisconnection(socket: Socket): void {
    try {
      const { companyId, correlationId } = socket.data;

      // Remove from connection pool
      this.removeFromConnectionPool(companyId, socket);

      // Update metrics
      this.updateConnectionMetrics('decrement');

      this.logger.debug('Client disconnected', {
        socketId: socket.id,
        companyId,
        correlationId
      });
    } catch (error) {
      this.logger.error('Error handling disconnection', {
        socketId: socket.id,
        error: error.message
      });
    }
  }

  /**
   * Manages connection pool with load balancing
   */
  private addToConnectionPool(companyId: string, socket: Socket): void {
    if (!this.connectionPool.has(companyId)) {
      this.connectionPool.set(companyId, []);
    }
    this.connectionPool.get(companyId)?.push(socket);
  }

  /**
   * Removes socket from connection pool
   */
  private removeFromConnectionPool(companyId: string, socket: Socket): void {
    const connections = this.connectionPool.get(companyId);
    if (connections) {
      const index = connections.findIndex(s => s.id === socket.id);
      if (index !== -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.connectionPool.delete(companyId);
      }
    }
  }

  /**
   * Validates JWT token and extracts user information
   */
  private async authenticateConnection(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const payload = this.jwtService.verifyAccessToken(token);
      return { valid: true, userId: payload.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Checks rate limits for connections
   */
  private async checkRateLimit(socketId: string): Promise<void> {
    try {
      await this.rateLimiter.consume(socketId);
    } catch (error) {
      throw new Error(ErrorTypes.RATE_LIMIT_ERROR);
    }
  }

  /**
   * Sets up circuit breaker event handlers
   */
  private setupCircuitBreakerEvents(): void {
    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker opened');
      this.metricsCollector.incrementCounter('circuit_breaker_open');
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.warn('Circuit breaker half-open');
      this.metricsCollector.incrementCounter('circuit_breaker_half_open');
    });

    this.circuitBreaker.on('close', () => {
      this.logger.log('Circuit breaker closed');
      this.metricsCollector.incrementCounter('circuit_breaker_close');
    });
  }

  /**
   * Initializes heartbeat monitoring for connection health
   */
  private initializeHeartbeat(socket: Socket): void {
    const interval = setInterval(() => {
      socket.emit('ping');
    }, 30000);

    socket.on('pong', () => {
      socket.data.lastHeartbeat = Date.now();
    });

    socket.on('disconnect', () => {
      clearInterval(interval);
    });
  }

  /**
   * Updates connection metrics
   */
  private updateConnectionMetrics(action: 'increment' | 'decrement'): void {
    const currentCount = this.healthMetrics.get('activeConnections') || 0;
    this.healthMetrics.set('activeConnections', 
      action === 'increment' ? currentCount + 1 : currentCount - 1
    );
    this.metricsCollector.gaugeUpdate('active_connections', 
      this.healthMetrics.get('activeConnections') || 0
    );
  }

  /**
   * Starts metrics collection interval
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.metricsCollector.gauge('connection_pool_size', this.connectionPool.size);
      this.metricsCollector.gauge('active_connections', 
        this.healthMetrics.get('activeConnections') || 0
      );
    }, 5000);
  }

  /**
   * Handles external service calls through circuit breaker
   */
  private async handleExternalCall(callback: Function): Promise<any> {
    return callback();
  }

  /**
   * Handles event errors with logging and metrics
   */
  private handleEventError(socket: Socket, event: string, error: Error): void {
    this.logger.error(`Error handling event ${event}`, {
      socketId: socket.id,
      correlationId: socket.data.correlationId,
      error: error.message
    });
    this.metricsCollector.incrementCounter('websocket_event_errors');
    socket.emit('error', {
      event,
      message: 'Event processing failed',
      code: error.message
    });
  }
}