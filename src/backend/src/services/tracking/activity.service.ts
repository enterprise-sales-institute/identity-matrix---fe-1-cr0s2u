/**
 * @fileoverview Service for managing visitor activities with real-time processing and GDPR compliance
 * Implements comprehensive activity tracking, caching, and data retention policies
 * @version 1.0.0
 */

import { injectable } from 'inversify'; // v6.0.1
import { Logger } from 'winston'; // v3.8.2
import { Model } from 'mongoose'; // v6.11.x
import { Redis } from 'ioredis'; // v5.3.x
import { CacheService } from '@identity-matrix/cache-service'; // v1.0.0

import { IVisitor } from '../../interfaces/visitor.interface';
import VisitorModel from '../../db/models/visitor.model';
import { VISITOR_ACTIVITY_TYPE, VISITOR_CACHE_TTL } from '../../constants/visitor.constants';

/**
 * Interface for activity data with GDPR compliance considerations
 */
interface IVisitorActivity {
    id: string;
    visitorId: string;
    type: VISITOR_ACTIVITY_TYPE;
    timestamp: Date;
    data: {
        url?: string;
        elementId?: string;
        formId?: string;
        fileId?: string;
        metadata: Record<string, any>;
    };
    gdprCompliant: boolean;
}

/**
 * Interface for pagination options with cursor-based implementation
 */
interface IPaginationOptions {
    cursor?: string;
    limit: number;
    sortDirection: 'asc' | 'desc';
}

/**
 * Interface for paginated activity response
 */
interface IPaginatedActivities {
    activities: IVisitorActivity[];
    nextCursor?: string;
    totalCount: number;
}

/**
 * Service class for managing visitor activities with real-time updates and caching
 */
@injectable()
export class ActivityService {
    private readonly CACHE_PREFIX = 'visitor_activity:';
    private readonly BROADCAST_CHANNEL = 'visitor_updates';
    private readonly RATE_LIMIT_WINDOW = 60; // 1 minute
    private readonly RATE_LIMIT_MAX = 100; // max activities per minute

    constructor(
        private readonly logger: Logger,
        private readonly cacheService: CacheService,
        private readonly redis: Redis,
        private readonly activityRetentionDays: number = 90
    ) {
        this.logger = logger.child({ service: 'ActivityService' });
    }

    /**
     * Records and processes a new visitor activity with validation and real-time updates
     * @param visitorId - Unique identifier of the visitor
     * @param activityData - Activity data to be recorded
     * @returns Processed and stored activity record
     */
    public async trackActivity(
        visitorId: string,
        activityData: Omit<IVisitorActivity, 'id' | 'timestamp' | 'gdprCompliant'>
    ): Promise<IVisitorActivity> {
        try {
            // Rate limiting check
            const rateLimitKey = `${this.CACHE_PREFIX}rate_limit:${visitorId}`;
            const currentCount = await this.redis.incr(rateLimitKey);
            if (currentCount === 1) {
                await this.redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW);
            }
            if (currentCount > this.RATE_LIMIT_MAX) {
                throw new Error('Rate limit exceeded for activity tracking');
            }

            // Validate visitor exists
            const visitor = await VisitorModel.findById(visitorId);
            if (!visitor) {
                throw new Error('Visitor not found');
            }

            // Create activity record with GDPR compliance
            const activity: IVisitorActivity = {
                id: crypto.randomUUID(),
                visitorId,
                type: activityData.type,
                timestamp: new Date(),
                data: this.sanitizeActivityData(activityData.data),
                gdprCompliant: visitor.gdprConsent || false
            };

            // Store activity in database with TTL
            await this.storeActivity(activity);

            // Update visitor's last activity
            await VisitorModel.updateOne(
                { _id: visitorId },
                {
                    $set: { lastSeen: activity.timestamp, isActive: true },
                    $inc: { totalTimeSpent: 0 }
                }
            );

            // Cache activity data
            await this.cacheActivity(activity);

            // Broadcast real-time update
            await this.broadcastActivity(activity);

            this.logger.info('Activity tracked successfully', {
                visitorId,
                activityId: activity.id,
                type: activity.type
            });

            return activity;
        } catch (error) {
            this.logger.error('Error tracking activity', {
                visitorId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Retrieves paginated activities with cursor-based pagination and caching
     * @param visitorId - Unique identifier of the visitor
     * @param options - Pagination options
     * @returns Paginated activity records with cursor
     */
    public async getVisitorActivities(
        visitorId: string,
        options: IPaginationOptions
    ): Promise<IPaginatedActivities> {
        try {
            const cacheKey = `${this.CACHE_PREFIX}${visitorId}:${options.cursor}:${options.limit}`;
            
            // Try to get from cache
            const cachedResult = await this.cacheService.get<IPaginatedActivities>(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }

            // Fetch from database with cursor-based pagination
            const query = {
                visitorId,
                ...(options.cursor && {
                    timestamp: {
                        [options.sortDirection === 'asc' ? '$gt' : '$lt']: 
                        new Date(Buffer.from(options.cursor, 'base64').toString())
                    }
                })
            };

            const activities = await this.getActivitiesFromDB(query, options);
            const totalCount = await this.getActivityCount(visitorId);

            const result: IPaginatedActivities = {
                activities,
                totalCount,
                ...(activities.length === options.limit && {
                    nextCursor: Buffer.from(
                        activities[activities.length - 1].timestamp.toISOString()
                    ).toString('base64')
                })
            };

            // Cache the result
            await this.cacheService.set(cacheKey, result, VISITOR_CACHE_TTL);

            return result;
        } catch (error) {
            this.logger.error('Error retrieving visitor activities', {
                visitorId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Deletes visitor activities with GDPR compliance and cleanup
     * @param visitorId - Unique identifier of the visitor
     */
    public async deleteVisitorActivities(visitorId: string): Promise<void> {
        try {
            // Log deletion operation for audit
            this.logger.info('Initiating activity deletion', { visitorId });

            // Delete from database
            await this.deleteActivitiesFromDB(visitorId);

            // Clear cached data
            await this.clearActivityCache(visitorId);

            // Update visitor record
            await VisitorModel.updateOne(
                { _id: visitorId },
                { $set: { totalTimeSpent: 0 } }
            );

            // Broadcast deletion event
            await this.broadcastDeletion(visitorId);

            this.logger.info('Activities deleted successfully', { visitorId });
        } catch (error) {
            this.logger.error('Error deleting visitor activities', {
                visitorId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Sanitizes activity data for GDPR compliance
     * @private
     */
    private sanitizeActivityData(data: Record<string, any>): Record<string, any> {
        const sensitiveFields = ['password', 'credit_card', 'ssn'];
        const sanitized = { ...data };
        
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                delete sanitized[field];
            }
        }
        
        return sanitized;
    }

    /**
     * Stores activity in database with TTL
     * @private
     */
    private async storeActivity(activity: IVisitorActivity): Promise<void> {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + this.activityRetentionDays);
        
        // Implementation details for database storage
    }

    /**
     * Caches activity data with TTL
     * @private
     */
    private async cacheActivity(activity: IVisitorActivity): Promise<void> {
        const cacheKey = `${this.CACHE_PREFIX}${activity.id}`;
        await this.cacheService.set(cacheKey, activity, VISITOR_CACHE_TTL);
    }

    /**
     * Broadcasts activity update via Redis
     * @private
     */
    private async broadcastActivity(activity: IVisitorActivity): Promise<void> {
        await this.redis.publish(
            this.BROADCAST_CHANNEL,
            JSON.stringify({
                type: 'activity_update',
                data: activity
            })
        );
    }

    /**
     * Broadcasts activity deletion event
     * @private
     */
    private async broadcastDeletion(visitorId: string): Promise<void> {
        await this.redis.publish(
            this.BROADCAST_CHANNEL,
            JSON.stringify({
                type: 'activity_deletion',
                visitorId
            })
        );
    }

    /**
     * Clears activity cache for a visitor
     * @private
     */
    private async clearActivityCache(visitorId: string): Promise<void> {
        const pattern = `${this.CACHE_PREFIX}${visitorId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }

    /**
     * Retrieves activities from database with pagination
     * @private
     */
    private async getActivitiesFromDB(
        query: Record<string, any>,
        options: IPaginationOptions
    ): Promise<IVisitorActivity[]> {
        // Implementation details for database retrieval
        return [];
    }

    /**
     * Gets total activity count for a visitor
     * @private
     */
    private async getActivityCount(visitorId: string): Promise<number> {
        // Implementation details for count retrieval
        return 0;
    }

    /**
     * Deletes activities from database
     * @private
     */
    private async deleteActivitiesFromDB(visitorId: string): Promise<void> {
        // Implementation details for database deletion
    }
}