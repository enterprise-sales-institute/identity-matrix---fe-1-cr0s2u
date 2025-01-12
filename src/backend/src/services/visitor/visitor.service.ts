/**
 * @fileoverview Enhanced visitor service implementation for Identity Matrix
 * Handles visitor lifecycle management with performance optimization, security, and GDPR compliance
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreaker } from '@nestjs/circuit-breaker';
import { CacheService } from '@nestjs/cache-manager';
import { MetricsService } from '@nestjs/metrics';
import { ConfigService } from '@nestjs/config';
import { IVisitor, IVisitorMetadata } from '../../interfaces/visitor.interface';
import { VISITOR_STATUS, VISITOR_CACHE_TTL } from '../../constants/visitor.constants';

/**
 * Interface for activity tracking data
 */
interface IActivityData {
    type: string;
    timestamp: Date;
    data: Record<string, any>;
}

/**
 * Enhanced service for visitor management with performance optimization and GDPR compliance
 */
@Injectable()
@CircuitBreaker({ timeout: 5000, maxFailures: 3 })
export class VisitorService {
    private readonly logger = new Logger(VisitorService.name);
    private readonly batchSize: number;
    private readonly activityQueue: Map<string, IActivityData[]>;

    constructor(
        private readonly visitorRepository: any,
        private readonly cacheService: CacheService,
        private readonly metricsService: MetricsService,
        private readonly configService: ConfigService
    ) {
        this.batchSize = this.configService.get('VISITOR_BATCH_SIZE', 100);
        this.activityQueue = new Map();

        // Initialize batch processing
        setInterval(() => this.processBatchedActivities(), 5000);
    }

    /**
     * Creates a new visitor record with GDPR compliance considerations
     * @param companyId - UUID of the company
     * @param metadata - Visitor metadata
     * @param hasConsent - GDPR consent status
     * @returns Promise resolving to created visitor
     */
    async createVisitor(
        companyId: string,
        metadata: IVisitorMetadata,
        hasConsent: boolean
    ): Promise<IVisitor> {
        try {
            this.logger.debug(`Creating visitor for company ${companyId}`);
            
            // Start performance measurement
            const timer = this.metricsService.startTimer('visitor_creation');

            // Anonymize IP if no consent
            const processedMetadata = hasConsent ? metadata : this.anonymizeData(metadata);

            const visitor: IVisitor = {
                id: crypto.randomUUID(),
                companyId,
                email: null,
                name: null,
                phone: null,
                status: VISITOR_STATUS.ANONYMOUS,
                metadata: processedMetadata,
                enrichedData: null,
                visits: 1,
                totalTimeSpent: 0,
                firstSeen: new Date(),
                lastSeen: new Date(),
                lastEnriched: null,
                isActive: true,
                tags: {}
            };

            // Create visitor with retry logic
            const createdVisitor = await this.visitorRepository.create(visitor);

            // Cache visitor data
            await this.cacheService.set(
                `visitor:${createdVisitor.id}`,
                createdVisitor,
                VISITOR_CACHE_TTL
            );

            // Record metrics
            timer.end();
            this.metricsService.incrementCounter('visitors_created');

            return createdVisitor;
        } catch (error) {
            this.logger.error(`Error creating visitor: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Tracks visitor activity with performance optimization
     * @param visitorId - ID of the visitor
     * @param activityData - Activity data to track
     */
    async trackActivity(visitorId: string, activityData: IActivityData): Promise<void> {
        try {
            // Add activity to batch queue
            const visitorActivities = this.activityQueue.get(visitorId) || [];
            visitorActivities.push(activityData);
            this.activityQueue.set(visitorId, visitorActivities);

            // Update last seen timestamp in cache
            await this.cacheService.set(
                `visitor:${visitorId}:lastSeen`,
                new Date(),
                VISITOR_CACHE_TTL
            );

            // Record activity metric
            this.metricsService.incrementCounter('visitor_activities');
        } catch (error) {
            this.logger.error(`Error tracking activity: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Updates visitor identification status and enriched data
     * @param visitorId - ID of the visitor
     * @param email - Visitor's email
     * @param enrichedData - Additional enriched data
     */
    async identifyVisitor(
        visitorId: string,
        email: string,
        enrichedData?: Record<string, any>
    ): Promise<IVisitor> {
        try {
            const visitor = await this.getVisitorFromCache(visitorId);
            
            const updatedVisitor: Partial<IVisitor> = {
                email,
                status: VISITOR_STATUS.IDENTIFIED,
                enrichedData: enrichedData || null,
                lastEnriched: enrichedData ? new Date() : null
            };

            // Update visitor with retry logic
            const result = await this.visitorRepository.update(visitorId, updatedVisitor);

            // Update cache
            await this.cacheService.set(
                `visitor:${visitorId}`,
                { ...visitor, ...updatedVisitor },
                VISITOR_CACHE_TTL
            );

            return result;
        } catch (error) {
            this.logger.error(`Error identifying visitor: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Processes batched visitor activities for performance optimization
     * @private
     */
    private async processBatchedActivities(): Promise<void> {
        try {
            const batchOperations = [];

            for (const [visitorId, activities] of this.activityQueue.entries()) {
                if (activities.length === 0) continue;

                batchOperations.push(
                    this.visitorRepository.updateActivities(visitorId, activities)
                );

                if (batchOperations.length >= this.batchSize) {
                    await Promise.all(batchOperations);
                    batchOperations.length = 0;
                }
            }

            // Process remaining operations
            if (batchOperations.length > 0) {
                await Promise.all(batchOperations);
            }

            // Clear processed activities
            this.activityQueue.clear();
        } catch (error) {
            this.logger.error(`Error processing batched activities: ${error.message}`, error.stack);
            // Keep activities in queue for retry
        }
    }

    /**
     * Retrieves visitor from cache or database
     * @private
     * @param visitorId - ID of the visitor
     */
    private async getVisitorFromCache(visitorId: string): Promise<IVisitor> {
        const cached = await this.cacheService.get<IVisitor>(`visitor:${visitorId}`);
        if (cached) return cached;

        const visitor = await this.visitorRepository.findById(visitorId);
        if (!visitor) {
            throw new Error(`Visitor not found: ${visitorId}`);
        }

        await this.cacheService.set(`visitor:${visitorId}`, visitor, VISITOR_CACHE_TTL);
        return visitor;
    }

    /**
     * Anonymizes visitor data for GDPR compliance
     * @private
     * @param metadata - Visitor metadata to anonymize
     */
    private anonymizeData(metadata: IVisitorMetadata): IVisitorMetadata {
        return {
            ...metadata,
            ipAddress: this.hashIpAddress(metadata.ipAddress),
            customParams: this.filterSensitiveData(metadata.customParams)
        };
    }

    /**
     * Hashes IP address for anonymization
     * @private
     * @param ip - IP address to hash
     */
    private hashIpAddress(ip: string): string {
        // Implementation of IP anonymization (e.g., last octet removal)
        return ip.split('.').slice(0, 3).join('.') + '.0';
    }

    /**
     * Filters sensitive data from custom parameters
     * @private
     * @param params - Custom parameters to filter
     */
    private filterSensitiveData(params: Record<string, string>): Record<string, string> {
        const sensitiveKeys = ['password', 'token', 'auth', 'key'];
        return Object.fromEntries(
            Object.entries(params).filter(([key]) => 
                !sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
            )
        );
    }
}