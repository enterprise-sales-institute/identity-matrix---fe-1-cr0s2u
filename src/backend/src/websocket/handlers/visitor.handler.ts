/**
 * @fileoverview Enhanced WebSocket handler for real-time visitor tracking and identification
 * Implements performance monitoring, security features, and scalable event processing
 * @version 1.0.0
 */

import { injectable } from 'inversify';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { CircuitBreaker } from 'opossum';
import { MetricsService } from '@nestjs/common';
import { VisitorService } from '../../services/visitor/visitor.service';
import { IVisitor, IVisitorMetadata } from '../../interfaces/visitor.interface';
import { VISITOR_STATUS, VISITOR_ACTIVITY_TYPE, isValidActivityType } from '../../constants/visitor.constants';

/**
 * Rate limiting configuration for WebSocket events
 */
interface RateLimitConfig {
  maxEvents: number;
  windowMs: number;
}

/**
 * Enhanced WebSocket handler for visitor tracking with performance monitoring
 */
@injectable()
export class VisitorHandler {
  private readonly logger = new Logger(VisitorHandler.name);
  private readonly rateLimits: Map<string, { count: number; resetTime: number }>;
  private readonly rateLimitConfig: RateLimitConfig;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    private readonly visitorService: VisitorService,
    private readonly metricsService: MetricsService
  ) {
    this.rateLimits = new Map();
    this.rateLimitConfig = {
      maxEvents: 100,
      windowMs: 60000 // 1 minute
    };

    // Initialize circuit breaker for external enrichment calls
    this.circuitBreaker = new CircuitBreaker(
      async (data: any) => this.visitorService.enrichVisitor(data),
      {
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      }
    );

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      this.logger.warn('Enrichment circuit breaker opened');
      this.metricsService.incrementCounter('enrichment_circuit_breaker_open');
    });
  }

  /**
   * Handles incoming visitor tracking events with rate limiting and monitoring
   * @param socket - WebSocket connection instance
   * @param visitorData - Incoming visitor data
   */
  async handleVisitorEvent(
    socket: Socket,
    visitorData: { metadata: IVisitorMetadata; activityType: string }
  ): Promise<void> {
    const startTime = Date.now();
    const clientId = socket.handshake.auth.companyId;

    try {
      // Validate rate limits
      if (!this.checkRateLimit(clientId)) {
        this.metricsService.incrementCounter('rate_limit_exceeded');
        throw new Error('Rate limit exceeded');
      }

      // Validate activity type
      if (!isValidActivityType(visitorData.activityType)) {
        throw new Error('Invalid activity type');
      }

      // Start performance tracking
      const timer = this.metricsService.startTimer('visitor_event_processing');

      // Process visitor data
      const visitor = await this.visitorService.createVisitor(
        clientId,
        visitorData.metadata,
        true // Assuming consent is handled at connection level
      );

      // Track activity
      await this.visitorService.trackActivity(visitor.id, {
        type: visitorData.activityType,
        timestamp: new Date(),
        data: visitorData.metadata
      });

      // Emit update to subscribed clients
      socket.to(`company:${clientId}`).emit('visitor:update', {
        id: visitor.id,
        status: visitor.status,
        metadata: visitor.metadata
      });

      // Record metrics
      timer.end();
      this.metricsService.recordValue('visitor_event_processing_time', Date.now() - startTime);

    } catch (error) {
      this.logger.error(`Error processing visitor event: ${error.message}`, error.stack);
      this.metricsService.incrementCounter('visitor_event_errors');
      socket.emit('error', { message: 'Error processing visitor event' });
    }
  }

  /**
   * Processes visitor identification events with enrichment
   * @param socket - WebSocket connection instance
   * @param identificationData - Visitor identification data
   */
  async handleIdentificationEvent(
    socket: Socket,
    identificationData: { visitorId: string; email: string }
  ): Promise<void> {
    const startTime = Date.now();
    const clientId = socket.handshake.auth.companyId;

    try {
      // Validate rate limits
      if (!this.checkRateLimit(clientId)) {
        throw new Error('Rate limit exceeded');
      }

      // Start performance tracking
      const timer = this.metricsService.startTimer('identification_processing');

      // Update visitor identification
      const visitor = await this.visitorService.identifyVisitor(
        identificationData.visitorId,
        identificationData.email
      );

      // Attempt enrichment through circuit breaker
      const enrichedData = await this.circuitBreaker.fire({
        email: identificationData.email,
        metadata: visitor.metadata
      });

      if (enrichedData) {
        await this.visitorService.updateVisitor(identificationData.visitorId, {
          status: VISITOR_STATUS.ENRICHED,
          enrichedData
        });
      }

      // Emit update to subscribed clients
      socket.to(`company:${clientId}`).emit('visitor:identified', {
        id: visitor.id,
        status: visitor.status,
        enrichedData
      });

      // Record metrics
      timer.end();
      this.metricsService.recordValue('identification_processing_time', Date.now() - startTime);
      this.metricsService.incrementCounter('visitors_identified');

    } catch (error) {
      this.logger.error(`Error processing identification: ${error.message}`, error.stack);
      this.metricsService.incrementCounter('identification_errors');
      socket.emit('error', { message: 'Error processing identification' });
    }
  }

  /**
   * Manages socket subscriptions to visitor updates
   * @param socket - WebSocket connection instance
   * @param visitorId - ID of the visitor to subscribe to
   */
  async subscribeToVisitor(socket: Socket, visitorId: string): Promise<void> {
    try {
      const clientId = socket.handshake.auth.companyId;
      const roomName = `visitor:${visitorId}`;

      // Join visitor-specific room
      socket.join(roomName);

      // Set up cleanup on disconnect
      socket.on('disconnect', () => {
        socket.leave(roomName);
        this.metricsService.decrementGauge('active_subscriptions');
      });

      // Track subscription metrics
      this.metricsService.incrementGauge('active_subscriptions');
      this.metricsService.incrementCounter('total_subscriptions');

      this.logger.debug(`Client ${clientId} subscribed to visitor ${visitorId}`);

    } catch (error) {
      this.logger.error(`Error in visitor subscription: ${error.message}`, error.stack);
      this.metricsService.incrementCounter('subscription_errors');
      socket.emit('error', { message: 'Error subscribing to visitor' });
    }
  }

  /**
   * Checks and updates rate limits for a client
   * @private
   * @param clientId - ID of the client to check
   * @returns boolean indicating if request is within rate limits
   */
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const clientLimit = this.rateLimits.get(clientId);

    if (!clientLimit || now > clientLimit.resetTime) {
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs
      });
      return true;
    }

    if (clientLimit.count >= this.rateLimitConfig.maxEvents) {
      return false;
    }

    clientLimit.count++;
    return true;
  }
}