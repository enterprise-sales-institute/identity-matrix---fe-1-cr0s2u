/**
 * WebSocket Service Implementation
 * Version: 1.0.0
 * 
 * Provides secure, performant, and reliable real-time communication between
 * the Identity Matrix frontend and backend with comprehensive error handling
 * and connection management.
 */

import { io, Socket } from 'socket.io-client'; // v4.7.2
import { EventEmitter } from 'events'; // v3.3.0
import { WEBSOCKET_CONFIG, WEBSOCKET_EVENTS } from '../config/websocket.config';
import { Visitor } from '../types/visitor.types';

/**
 * Interface for WebSocket error handling with typed error categories
 */
interface WebSocketError extends Error {
  code: string;
  type: 'connection' | 'authentication' | 'subscription' | 'message';
  context?: any;
}

/**
 * Interface for company subscription options with event batching
 */
interface SubscriptionOptions {
  batchSize?: number;
  batchInterval?: number;
  includeEnrichment?: boolean;
}

/**
 * WebSocket service class implementing real-time communication with
 * enhanced security, performance optimization, and error handling
 */
export class WebSocketService {
  private socket: Socket | null = null;
  private eventEmitter: EventEmitter;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]>;
  private batchedEvents: Map<string, any[]>;
  private batchTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(20); // Prevent memory leaks
    this.eventListeners = new Map();
    this.batchedEvents = new Map();
    this.batchTimeouts = new Map();
  }

  /**
   * Establishes secure WebSocket connection with token-based authentication
   * @param token - JWT authentication token
   */
  public async connect(token: string): Promise<void> {
    if (this.isConnected) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Initialize socket with secure configuration
        this.socket = io(WEBSOCKET_CONFIG.url, {
          ...WEBSOCKET_CONFIG.options,
          auth: { token },
          secure: true,
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        });

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          this.handleError({
            name: 'ConnectionTimeout',
            message: 'WebSocket connection timeout',
            code: 'TIMEOUT',
            type: 'connection'
          });
          reject(new Error('Connection timeout'));
        }, WEBSOCKET_CONFIG.options.timeout);

        // Set up event listeners
        this.setupEventListeners();

        this.socket.on(WEBSOCKET_EVENTS.CONNECT, () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
          }
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on(WEBSOCKET_EVENTS.ERROR, (error: any) => {
          this.handleError({
            name: 'WebSocketError',
            message: error.message || 'WebSocket error',
            code: error.code || 'ERROR',
            type: 'connection',
            context: error
          });
          reject(error);
        });

      } catch (error) {
        this.handleError({
          name: 'ConnectionError',
          message: 'Failed to initialize WebSocket connection',
          code: 'INIT_ERROR',
          type: 'connection',
          context: error
        });
        reject(error);
      }
    });
  }

  /**
   * Safely disconnects WebSocket connection with cleanup
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected || !this.socket) {
      return;
    }

    return new Promise((resolve) => {
      // Clear all batched events and timeouts
      this.batchedEvents.clear();
      this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
      this.batchTimeouts.clear();

      // Remove all event listeners
      this.eventListeners.forEach((listeners, event) => {
        listeners.forEach(listener => {
          this.socket?.off(event, listener);
        });
      });
      this.eventListeners.clear();

      this.socket?.once(WEBSOCKET_EVENTS.DISCONNECT, () => {
        this.isConnected = false;
        this.socket = null;
        resolve();
      });

      this.socket?.disconnect();
    });
  }

  /**
   * Subscribes to company-specific visitor events with batching optimization
   * @param companyId - Company identifier
   * @param options - Subscription configuration options
   */
  public async subscribeToCompany(
    companyId: string,
    options: SubscriptionOptions = {}
  ): Promise<void> {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    const {
      batchSize = 10,
      batchInterval = 100,
      includeEnrichment = true
    } = options;

    return new Promise((resolve, reject) => {
      try {
        // Subscribe to company events
        this.socket?.emit(WEBSOCKET_EVENTS.SUBSCRIBE_COMPANY, {
          companyId,
          includeEnrichment
        });

        // Set up batched event handling
        const handleVisitorActivity = (data: any) => {
          const batchKey = `${companyId}:activity`;
          let batch = this.batchedEvents.get(batchKey) || [];
          batch.push(data);

          if (batch.length >= batchSize) {
            this.emitBatchedEvents(batchKey, batch);
            this.batchedEvents.set(batchKey, []);
          } else {
            this.batchedEvents.set(batchKey, batch);
            // Set/reset batch timeout
            if (this.batchTimeouts.has(batchKey)) {
              clearTimeout(this.batchTimeouts.get(batchKey));
            }
            this.batchTimeouts.set(batchKey, setTimeout(() => {
              this.emitBatchedEvents(batchKey, this.batchedEvents.get(batchKey) || []);
              this.batchedEvents.set(batchKey, []);
            }, batchInterval));
          }
        };

        // Register event listeners
        this.socket?.on(WEBSOCKET_EVENTS.VISITOR_ACTIVITY, handleVisitorActivity);
        this.socket?.on(WEBSOCKET_EVENTS.VISITOR_UPDATE, (visitor: Visitor) => {
          this.eventEmitter.emit('visitor:update', visitor);
        });

        // Store listeners for cleanup
        this.eventListeners.set(WEBSOCKET_EVENTS.VISITOR_ACTIVITY, [handleVisitorActivity]);

        resolve();
      } catch (error) {
        this.handleError({
          name: 'SubscriptionError',
          message: 'Failed to subscribe to company events',
          code: 'SUB_ERROR',
          type: 'subscription',
          context: { companyId, error }
        });
        reject(error);
      }
    });
  }

  /**
   * Handles WebSocket errors with recovery strategies
   * @param error - WebSocket error object
   */
  private async handleError(error: WebSocketError): Promise<void> {
    console.error('[WebSocket Error]', {
      type: error.type,
      code: error.code,
      message: error.message,
      context: error.context
    });

    switch (error.type) {
      case 'connection':
        if (this.reconnectAttempts < WEBSOCKET_CONFIG.options.reconnectionAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectAttempts * WEBSOCKET_CONFIG.options.reconnectionDelay;
          setTimeout(() => {
            this.socket?.connect();
          }, delay);
        } else {
          this.eventEmitter.emit('error', {
            code: 'MAX_RECONNECT',
            message: 'Maximum reconnection attempts reached'
          });
        }
        break;

      case 'authentication':
        this.eventEmitter.emit('error', {
          code: 'AUTH_ERROR',
          message: 'Authentication failed'
        });
        break;

      default:
        this.eventEmitter.emit('error', error);
    }
  }

  /**
   * Sets up WebSocket event listeners with error handling
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection health monitoring
    this.socket.on('connect_error', (error) => {
      this.handleError({
        name: 'ConnectionError',
        message: 'Connection error occurred',
        code: 'CONN_ERROR',
        type: 'connection',
        context: error
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        this.eventEmitter.emit('disconnect', { reason });
      } else {
        // Attempt reconnection for other disconnect reasons
        this.handleError({
          name: 'DisconnectError',
          message: `Disconnected: ${reason}`,
          code: 'DISCONNECT',
          type: 'connection',
          context: { reason }
        });
      }
    });

    // Ping/Pong monitoring
    this.socket.on('pong', () => {
      this.eventEmitter.emit('latency', this.socket?.conn.transport.pingTimeout);
    });
  }

  /**
   * Emits batched events to event emitter
   * @param batchKey - Batch identifier
   * @param events - Array of batched events
   */
  private emitBatchedEvents(batchKey: string, events: any[]): void {
    if (events.length > 0) {
      this.eventEmitter.emit('batch:complete', {
        type: batchKey,
        events,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Returns the event emitter instance for external event handling
   */
  public getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
}