/**
 * @fileoverview Repository class for visitor data management in Identity Matrix
 * Implements GDPR-compliant data access layer with caching and performance optimizations
 * @version 1.0.0
 */

import mongoose from 'mongoose'; // v6.11.x
import { createClient } from 'redis'; // v4.6.x
import winston from 'winston'; // v3.8.x
import VisitorModel from '../models/visitor.model';
import { IVisitor, IVisitorMetadata, IEnrichedData } from '../../interfaces/visitor.interface';
import { VISITOR_STATUS, VISITOR_CACHE_TTL } from '../../constants/visitor.constants';

/**
 * Repository class handling all visitor data operations with caching and GDPR compliance
 */
export class VisitorRepository {
    private readonly Model: typeof VisitorModel;
    private readonly redisClient: ReturnType<typeof createClient>;
    private readonly logger: winston.Logger;
    private readonly cacheKeyPrefix = 'visitor:';

    /**
     * Initialize repository with required dependencies
     */
    constructor(redisClient: ReturnType<typeof createClient>, logger: winston.Logger) {
        this.Model = VisitorModel;
        this.redisClient = redisClient;
        this.logger = logger;
    }

    /**
     * Creates a new visitor record with GDPR compliance checks
     * @param visitorData - Visitor information to create
     * @param consentData - GDPR consent information
     * @returns Created visitor document
     */
    async create(visitorData: Partial<IVisitor>, consentData: { gdprConsent: boolean }): Promise<IVisitor> {
        try {
            // Set retention period based on consent
            const retentionDate = consentData.gdprConsent 
                ? new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) // 1 year
                : new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));  // 30 days

            const visitor = new this.Model({
                ...visitorData,
                gdprConsent: consentData.gdprConsent,
                retentionDate,
                status: VISITOR_STATUS.ANONYMOUS
            });

            const savedVisitor = await visitor.save();
            await this.cacheVisitor(savedVisitor);

            this.logger.info(`Created visitor: ${savedVisitor.id}`, {
                companyId: savedVisitor.companyId,
                status: savedVisitor.status
            });

            return savedVisitor;
        } catch (error) {
            this.logger.error('Error creating visitor:', error);
            throw error;
        }
    }

    /**
     * Finds visitor by ID with cache layer
     * @param id - Visitor ID to find
     * @returns Found visitor or null
     */
    async findById(id: string): Promise<IVisitor | null> {
        try {
            // Check cache first
            const cachedVisitor = await this.getCachedVisitor(id);
            if (cachedVisitor) {
                return cachedVisitor;
            }

            // Query database if cache miss
            const visitor = await this.Model.findOne({ id });
            if (visitor) {
                await this.cacheVisitor(visitor);
            }

            return visitor;
        } catch (error) {
            this.logger.error(`Error finding visitor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Updates visitor information with GDPR compliance
     * @param id - Visitor ID to update
     * @param updateData - Data to update
     * @returns Updated visitor
     */
    async update(id: string, updateData: Partial<IVisitor>): Promise<IVisitor | null> {
        try {
            const visitor = await this.Model.findOneAndUpdate(
                { id },
                { 
                    $set: updateData,
                    $inc: { visits: 1 }
                },
                { new: true, runValidators: true }
            );

            if (visitor) {
                await this.cacheVisitor(visitor);
            }

            return visitor;
        } catch (error) {
            this.logger.error(`Error updating visitor ${id}:`, error);
            throw error;
        }
    }

    /**
     * Performs bulk upsert of visitors with optimized operations
     * @param visitors - Array of visitor data to upsert
     * @returns Operation results
     */
    async bulkUpsertVisitors(visitors: Partial<IVisitor>[]): Promise<{ success: number; failed: number }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const operations = visitors.map(visitor => ({
                updateOne: {
                    filter: { id: visitor.id },
                    update: { $set: visitor },
                    upsert: true
                }
            }));

            const result = await this.Model.bulkWrite(operations, { session });
            await session.commitTransaction();

            // Update cache for affected visitors
            await Promise.all(
                visitors.map(visitor => this.invalidateCache(visitor.id!))
            );

            return {
                success: result.modifiedCount + result.upsertedCount,
                failed: visitors.length - (result.modifiedCount + result.upsertedCount)
            };
        } catch (error) {
            await session.abortTransaction();
            this.logger.error('Error in bulk upsert:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Removes visitors past retention period for GDPR compliance
     * @returns Number of removed records
     */
    async cleanupExpiredVisitors(): Promise<number> {
        try {
            const result = await this.Model.deleteMany({
                retentionDate: { $lte: new Date() }
            });

            this.logger.info(`Cleaned up ${result.deletedCount} expired visitors`);
            return result.deletedCount;
        } catch (error) {
            this.logger.error('Error cleaning up expired visitors:', error);
            throw error;
        }
    }

    /**
     * Finds visitors by company ID with pagination
     * @param companyId - Company ID to filter by
     * @param page - Page number
     * @param limit - Items per page
     * @returns Paginated visitors
     */
    async findByCompany(
        companyId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ visitors: IVisitor[]; total: number }> {
        try {
            const [visitors, total] = await Promise.all([
                this.Model.find({ companyId })
                    .sort({ lastSeen: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                this.Model.countDocuments({ companyId })
            ]);

            return { visitors, total };
        } catch (error) {
            this.logger.error(`Error finding visitors for company ${companyId}:`, error);
            throw error;
        }
    }

    /**
     * Caches visitor data in Redis
     * @param visitor - Visitor data to cache
     */
    private async cacheVisitor(visitor: IVisitor): Promise<void> {
        try {
            await this.redisClient.setEx(
                `${this.cacheKeyPrefix}${visitor.id}`,
                VISITOR_CACHE_TTL,
                JSON.stringify(visitor)
            );
        } catch (error) {
            this.logger.warn(`Cache set failed for visitor ${visitor.id}:`, error);
        }
    }

    /**
     * Retrieves cached visitor data
     * @param id - Visitor ID to retrieve
     * @returns Cached visitor or null
     */
    private async getCachedVisitor(id: string): Promise<IVisitor | null> {
        try {
            const cached = await this.redisClient.get(`${this.cacheKeyPrefix}${id}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            this.logger.warn(`Cache get failed for visitor ${id}:`, error);
            return null;
        }
    }

    /**
     * Invalidates cached visitor data
     * @param id - Visitor ID to invalidate
     */
    private async invalidateCache(id: string): Promise<void> {
        try {
            await this.redisClient.del(`${this.cacheKeyPrefix}${id}`);
        } catch (error) {
            this.logger.warn(`Cache invalidation failed for visitor ${id}:`, error);
        }
    }
}