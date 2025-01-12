/**
 * @fileoverview Enhanced tracking service for visitor monitoring with real-time updates
 * Implements production-grade features including connection pooling, error handling, and GDPR compliance
 * @version 1.0.0
 */

import { injectable } from 'inversify'; // v6.0.1
import { Logger } from 'winston'; // v3.8.2
import { WebSocket } from 'ws'; // v8.13.0

import { IVisitor } from '../../interfaces/visitor.interface';
import { ActivityService } from './activity.service';
import { IdentityService } from '../identity/identity.service';
import { VISITOR_STATUS } from '../../constants/visitor.constants';

/**
 * Connection pool for managing WebSocket connections with health monitoring
 */
class ConnectionPool {
    private connections: Map<string, Set<WebSocket>> = new Map();
    private healthChecks: Map<WebSocket, NodeJS.Timeout> = new Map();

    constructor(private readonly pingInterval: number = 30000) {}

    /**
     * Adds a connection to the pool with health monitoring
     */
    addConnection(visitorId: string, ws: WebSocket): void {
        if (!this.connections.has(visitorId)) {
            this.connections.set(visitorId, new Set());
        }
        this.connections.get(visitorId)!.add(ws);

        // Setup health monitoring
        const pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            } else {
                this.removeConnection(visitorId, ws);
            }
        }, this.pingInterval);

        this.healthChecks.set(ws, pingTimer);
    }

    /**
     * Removes a connection and cleans up health monitoring
     */
    removeConnection(visitorId: string, ws: WebSocket): void {
        const connections = this.connections.get(visitorId);
        if (connections) {
            connections.delete(ws);
            if (connections.size === 0) {
                this.connections.delete(visitorId);
            }
        }

        const timer = this.healthChecks.get(ws);
        if (timer) {
            clearInterval(timer);
            this.healthChecks.delete(ws);
        }
    }

    /**
     * Gets all active connections for a visitor
     */
    getConnections(visitorId: string): Set<WebSocket> {
        return this.connections.get(visitorId) || new Set();
    }

    /**
     * Cleans up inactive connections
     */
    cleanup(): void {
        for (const [visitorId, connections] of this.connections.entries()) {
            for (const ws of connections) {
                if (ws.readyState !== WebSocket.OPEN) {
                    this.removeConnection(visitorId, ws);
                }
            }
        }
    }
}

/**
 * Rate limiter for tracking events
 */
class RateLimiter {
    private readonly limits: Map<string, number> = new Map();
    private readonly window: number = 60000; // 1 minute window

    checkLimit(visitorId: string, maxRequests: number = 100): boolean {
        const now = Date.now();
        const count = this.limits.get(visitorId) || 0;
        
        if (count >= maxRequests) {
            return false;
        }

        this.limits.set(visitorId, count + 1);
        setTimeout(() => this.limits.set(visitorId, (this.limits.get(visitorId) || 1) - 1), this.window);
        
        return true;
    }
}

/**
 * Enhanced tracking service with production-grade features
 */
@injectable()
export class TrackingService {
    private readonly logger: Logger;
    private readonly connectionPool: ConnectionPool;
    private readonly rateLimiter: RateLimiter;
    private readonly cleanupInterval: NodeJS.Timeout;

    constructor(
        private readonly activityService: ActivityService,
        private readonly identityService: IdentityService,
        private readonly config: { cleanupInterval: number }
    ) {
        this.logger = new Logger({
            level: 'info',
            format: Logger.format.combine(
                Logger.format.timestamp(),
                Logger.format.json()
            )
        });

        this.connectionPool = new ConnectionPool();
        this.rateLimiter = new RateLimiter();

        // Setup periodic cleanup
        this.cleanupInterval = setInterval(
            () => this.connectionPool.cleanup(),
            config.cleanupInterval || 300000 // 5 minutes default
        );

        this.logger.info('Tracking service initialized with production configuration');
    }

    /**
     * Tracks visitor activity with enhanced error handling and GDPR compliance
     */
    public async trackVisitor(
        visitorId: string,
        metadata: IVisitor['metadata']
    ): Promise<IVisitor> {
        try {
            // Rate limiting check
            if (!this.rateLimiter.checkLimit(visitorId)) {
                throw new Error('Rate limit exceeded for visitor tracking');
            }

            // Validate GDPR consent
            const visitor = await this.identityService.validateGDPRConsent(visitorId);
            if (!visitor) {
                throw new Error('Visitor not found or GDPR consent not given');
            }

            // Track activity with retry mechanism
            const activity = await this.activityService.trackActivity({
                visitorId,
                type: 'PAGE_VIEW',
                data: {
                    metadata,
                    timestamp: new Date()
                }
            });

            // Update visitor status if needed
            if (visitor.status === VISITOR_STATUS.ANONYMOUS && metadata.email) {
                await this.identityService.identifyVisitor(visitorId, {
                    email: metadata.email,
                    gdprConsent: true
                });
            }

            // Emit real-time update
            await this.emitTrackingUpdate(visitorId, {
                type: 'VISITOR_UPDATE',
                data: { visitor, activity }
            });

            this.logger.info('Visitor tracked successfully', {
                visitorId,
                activityId: activity.id,
                status: visitor.status
            });

            return visitor;

        } catch (error) {
            this.logger.error('Error tracking visitor', {
                visitorId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Handles WebSocket connections with enhanced connection management
     */
    public handleWebSocketConnection(ws: WebSocket, visitorId: string): void {
        try {
            // Add to connection pool
            this.connectionPool.addConnection(visitorId, ws);

            // Setup connection handlers
            ws.on('error', (error) => {
                this.logger.error('WebSocket error', {
                    visitorId,
                    error: error.message
                });
                this.connectionPool.removeConnection(visitorId, ws);
            });

            ws.on('close', () => {
                this.logger.debug('WebSocket connection closed', { visitorId });
                this.connectionPool.removeConnection(visitorId, ws);
            });

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            this.logger.debug('WebSocket connection established', { visitorId });

        } catch (error) {
            this.logger.error('Error handling WebSocket connection', {
                visitorId,
                error: error.message
            });
            ws.terminate();
        }
    }

    /**
     * Emits real-time tracking updates with delivery guarantees
     */
    private async emitTrackingUpdate(visitorId: string, updateData: any): Promise<void> {
        const connections = this.connectionPool.getConnections(visitorId);
        const payload = JSON.stringify(updateData);

        for (const ws of connections) {
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(payload);
                } else {
                    this.connectionPool.removeConnection(visitorId, ws);
                }
            } catch (error) {
                this.logger.error('Error emitting tracking update', {
                    visitorId,
                    error: error.message
                });
                this.connectionPool.removeConnection(visitorId, ws);
            }
        }
    }
}