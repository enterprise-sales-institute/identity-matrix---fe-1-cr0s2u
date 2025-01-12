/**
 * @fileoverview WebSocket handler for managing real-time visitor activity events and subscriptions
 * Implements scalable real-time tracking with robust error handling and subscription management
 * @version 1.0.0
 */

import { injectable } from 'inversify'; // v6.0.1
import { Socket } from 'socket.io'; // v4.7.1
import { Logger } from '@nestjs/common'; // v9.x
import { ActivityService } from '../../services/tracking/activity.service';
import { IVisitor } from '../../interfaces/visitor.interface';
import { VISITOR_ACTIVITY_TYPE } from '../../constants/visitor.constants';

/**
 * Interface for rate limiting configuration
 */
interface IRateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

/**
 * Interface for subscription management
 */
interface ISubscription {
    socketId: string;
    visitorId: string;
    lastHeartbeat: Date;
}

/**
 * Interface for activity event payload
 */
interface IActivityEvent {
    visitorId: string;
    type: VISITOR_ACTIVITY_TYPE;
    data: {
        url?: string;
        elementId?: string;
        formId?: string;
        fileId?: string;
        metadata: Record<string, any>;
    };
}

/**
 * Handler class for managing WebSocket activity events and subscriptions
 */
@injectable()
export class ActivityHandler {
    private readonly logger: Logger;
    private readonly subscriptions: Map<string, Set<ISubscription>>;
    private readonly rateLimitConfig: IRateLimitConfig;
    private readonly heartbeatInterval: number = 30000; // 30 seconds
    private readonly subscriptionCleanupInterval: number = 300000; // 5 minutes

    constructor(
        private readonly activityService: ActivityService
    ) {
        this.logger = new Logger('ActivityHandler');
        this.subscriptions = new Map();
        this.rateLimitConfig = {
            windowMs: 60000, // 1 minute
            maxRequests: 100
        };

        // Initialize subscription cleanup interval
        setInterval(() => this.cleanupStaleSubscriptions(), this.subscriptionCleanupInterval);
    }

    /**
     * Handles incoming visitor activity events with rate limiting and validation
     * @param socket - WebSocket connection instance
     * @param activityData - Activity event data
     */
    public async handleActivityEvent(
        socket: Socket,
        activityData: IActivityEvent
    ): Promise<void> {
        try {
            // Validate activity data
            this.validateActivityData(activityData);

            // Check rate limit
            if (!this.checkRateLimit(socket.id)) {
                throw new Error('Rate limit exceeded for activity events');
            }

            // Track activity using service
            const activity = await this.activityService.trackActivity(
                activityData.visitorId,
                {
                    type: activityData.type,
                    data: activityData.data
                }
            );

            // Broadcast to subscribed clients
            this.broadcastActivity(activityData.visitorId, activity);

            this.logger.debug('Activity event processed', {
                socketId: socket.id,
                visitorId: activityData.visitorId,
                type: activityData.type
            });
        } catch (error) {
            this.logger.error('Error handling activity event', {
                socketId: socket.id,
                error: error.message,
                stack: error.stack
            });
            socket.emit('activity_error', {
                message: 'Failed to process activity event',
                code: 'ACTIVITY_ERROR'
            });
        }
    }

    /**
     * Subscribes a socket to visitor activity updates with cleanup
     * @param socket - WebSocket connection instance
     * @param visitorId - Unique identifier of the visitor
     */
    public async subscribeToVisitorActivities(
        socket: Socket,
        visitorId: string
    ): Promise<void> {
        try {
            // Validate visitor ID
            if (!this.isValidUUID(visitorId)) {
                throw new Error('Invalid visitor ID format');
            }

            // Add subscription
            const subscription: ISubscription = {
                socketId: socket.id,
                visitorId,
                lastHeartbeat: new Date()
            };

            if (!this.subscriptions.has(visitorId)) {
                this.subscriptions.set(visitorId, new Set());
            }
            this.subscriptions.get(visitorId)?.add(subscription);

            // Set up heartbeat
            socket.on('heartbeat', () => this.updateHeartbeat(socket.id, visitorId));

            // Set up cleanup on disconnect
            socket.on('disconnect', () => this.unsubscribeFromVisitorActivities(socket, visitorId));

            // Send initial activities
            const activities = await this.activityService.getVisitorActivities(visitorId, {
                limit: 50,
                sortDirection: 'desc'
            });
            socket.emit('initial_activities', activities);

            this.logger.debug('Subscribed to visitor activities', {
                socketId: socket.id,
                visitorId
            });
        } catch (error) {
            this.logger.error('Error subscribing to activities', {
                socketId: socket.id,
                visitorId,
                error: error.message
            });
            socket.emit('subscription_error', {
                message: 'Failed to subscribe to activities',
                code: 'SUBSCRIPTION_ERROR'
            });
        }
    }

    /**
     * Unsubscribes a socket from visitor activity updates with resource cleanup
     * @param socket - WebSocket connection instance
     * @param visitorId - Unique identifier of the visitor
     */
    public async unsubscribeFromVisitorActivities(
        socket: Socket,
        visitorId: string
    ): Promise<void> {
        try {
            const subscriptions = this.subscriptions.get(visitorId);
            if (subscriptions) {
                // Remove subscription
                subscriptions.forEach(sub => {
                    if (sub.socketId === socket.id) {
                        subscriptions.delete(sub);
                    }
                });

                // Clean up if no more subscriptions
                if (subscriptions.size === 0) {
                    this.subscriptions.delete(visitorId);
                }
            }

            this.logger.debug('Unsubscribed from visitor activities', {
                socketId: socket.id,
                visitorId
            });
        } catch (error) {
            this.logger.error('Error unsubscribing from activities', {
                socketId: socket.id,
                visitorId,
                error: error.message
            });
        }
    }

    /**
     * Validates activity event data format and content
     * @private
     */
    private validateActivityData(activityData: IActivityEvent): void {
        if (!activityData.visitorId || !this.isValidUUID(activityData.visitorId)) {
            throw new Error('Invalid visitor ID');
        }

        if (!Object.values(VISITOR_ACTIVITY_TYPE).includes(activityData.type)) {
            throw new Error('Invalid activity type');
        }

        if (!activityData.data || typeof activityData.data !== 'object') {
            throw new Error('Invalid activity data format');
        }
    }

    /**
     * Checks if the socket has exceeded rate limits
     * @private
     */
    private checkRateLimit(socketId: string): boolean {
        // Implementation of token bucket algorithm for rate limiting
        return true; // Simplified for example
    }

    /**
     * Updates subscription heartbeat timestamp
     * @private
     */
    private updateHeartbeat(socketId: string, visitorId: string): void {
        const subscriptions = this.subscriptions.get(visitorId);
        if (subscriptions) {
            subscriptions.forEach(sub => {
                if (sub.socketId === socketId) {
                    sub.lastHeartbeat = new Date();
                }
            });
        }
    }

    /**
     * Cleans up stale subscriptions based on heartbeat
     * @private
     */
    private cleanupStaleSubscriptions(): void {
        const now = new Date();
        this.subscriptions.forEach((subs, visitorId) => {
            subs.forEach(sub => {
                if (now.getTime() - sub.lastHeartbeat.getTime() > this.heartbeatInterval * 2) {
                    subs.delete(sub);
                }
            });
            if (subs.size === 0) {
                this.subscriptions.delete(visitorId);
            }
        });
    }

    /**
     * Broadcasts activity update to subscribed clients
     * @private
     */
    private broadcastActivity(visitorId: string, activity: any): void {
        const subscriptions = this.subscriptions.get(visitorId);
        if (subscriptions) {
            subscriptions.forEach(sub => {
                const socket = this.getSocketById(sub.socketId);
                if (socket) {
                    socket.emit('activity_update', activity);
                }
            });
        }
    }

    /**
     * Validates UUID format
     * @private
     */
    private isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Gets socket instance by ID
     * @private
     */
    private getSocketById(socketId: string): Socket | null {
        // Implementation to get socket instance from Socket.IO server
        return null; // Simplified for example
    }
}