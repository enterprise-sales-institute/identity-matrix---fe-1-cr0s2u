import { describe, test, expect, jest, beforeEach } from '@jest/globals'; // v29.x
import { faker } from '@faker-js/faker'; // v8.x
import { Cache } from 'cache-manager'; // v5.x

import { IdentityService } from '../../../src/services/identity/identity.service';
import { EnrichmentService } from '../../../src/services/identity/enrichment.service';
import { VisitorRepository } from '../../../src/db/repositories/visitor.repository';
import { VISITOR_STATUS } from '../../../src/constants/visitor.constants';
import { IVisitor } from '../../../src/interfaces/visitor.interface';

describe('IdentityService', () => {
    let identityService: IdentityService;
    let visitorRepository: jest.Mocked<VisitorRepository>;
    let enrichmentService: jest.Mocked<EnrichmentService>;
    let cacheManager: jest.Mocked<Cache>;
    let rateLimiter: jest.Mocked<any>;

    // Test data generators
    const generateVisitor = (overrides = {}): IVisitor => ({
        id: faker.string.uuid(),
        companyId: faker.string.uuid(),
        email: null,
        name: null,
        phone: null,
        status: VISITOR_STATUS.ANONYMOUS,
        metadata: {
            ipAddress: faker.internet.ip(),
            userAgent: faker.internet.userAgent(),
            referrer: faker.internet.url(),
            currentPage: faker.internet.url(),
            previousPages: [],
            customParams: {},
            location: {
                country: faker.location.country(),
                city: faker.location.city(),
                region: faker.location.state(),
                postalCode: faker.location.zipCode(),
                timezone: 'UTC'
            },
            deviceType: 'desktop',
            browser: 'Chrome',
            os: 'Windows'
        },
        enrichedData: null,
        visits: 1,
        totalTimeSpent: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        lastEnriched: null,
        isActive: true,
        tags: {},
        ...overrides
    });

    const generateIdentificationData = (gdprConsent = true) => ({
        email: faker.internet.email(),
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        gdprConsent,
        customFields: {
            company: faker.company.name()
        }
    });

    beforeEach(() => {
        // Initialize mocks
        visitorRepository = {
            findById: jest.fn(),
            update: jest.fn(),
            deleteVisitorData: jest.fn()
        } as any;

        enrichmentService = {
            enrichVisitorData: jest.fn(),
            validateEnrichmentData: jest.fn()
        } as any;

        cacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn()
        } as any;

        rateLimiter = {
            checkLimit: jest.fn()
        };

        // Initialize service
        identityService = new IdentityService(
            visitorRepository,
            enrichmentService,
            cacheManager,
            rateLimiter
        );
    });

    describe('identifyVisitor', () => {
        test('should successfully identify an anonymous visitor with GDPR consent', async () => {
            // Arrange
            const visitor = generateVisitor();
            const identificationData = generateIdentificationData(true);
            const startTime = Date.now();

            visitorRepository.findById.mockResolvedValue(visitor);
            visitorRepository.update.mockImplementation(async (id, data) => ({
                ...visitor,
                ...data,
                status: VISITOR_STATUS.IDENTIFIED
            }));
            enrichmentService.enrichVisitorData.mockImplementation(async (v) => ({
                ...v,
                enrichedData: {
                    company: faker.company.name(),
                    title: faker.person.jobTitle(),
                    industry: faker.company.buzzPhrase(),
                    size: '50-100',
                    revenue: '$1M-$5M',
                    website: faker.internet.url(),
                    technologies: [],
                    linkedinUrl: faker.internet.url(),
                    socialProfiles: {},
                    customFields: {}
                }
            }));

            // Act
            const result = await identityService.identifyVisitor(
                visitor.id,
                identificationData,
                { priority: 'high' }
            );

            // Assert
            expect(result.status).toBe(VISITOR_STATUS.ENRICHED);
            expect(result.email).toBe(identificationData.email);
            expect(result.enrichedData).toBeDefined();
            expect(Date.now() - startTime).toBeLessThan(200); // Performance check
            expect(rateLimiter.checkLimit).toHaveBeenCalledWith(visitor.id, 100);
        });

        test('should handle cached visitor data correctly', async () => {
            // Arrange
            const visitor = generateVisitor({ status: VISITOR_STATUS.IDENTIFIED });
            const identificationData = generateIdentificationData(true);

            cacheManager.get.mockResolvedValue(visitor);

            // Act
            const result = await identityService.identifyVisitor(
                visitor.id,
                identificationData
            );

            // Assert
            expect(result).toEqual(visitor);
            expect(visitorRepository.findById).not.toHaveBeenCalled();
            expect(enrichmentService.enrichVisitorData).not.toHaveBeenCalled();
        });

        test('should reject identification without GDPR consent', async () => {
            // Arrange
            const visitor = generateVisitor();
            const identificationData = generateIdentificationData(false);

            // Act & Assert
            await expect(
                identityService.identifyVisitor(visitor.id, identificationData)
            ).rejects.toThrow('GDPR consent is required for identification');
        });

        test('should handle enrichment failures gracefully', async () => {
            // Arrange
            const visitor = generateVisitor();
            const identificationData = generateIdentificationData(true);

            visitorRepository.findById.mockResolvedValue(visitor);
            visitorRepository.update.mockImplementation(async (id, data) => ({
                ...visitor,
                ...data
            }));
            enrichmentService.enrichVisitorData.mockRejectedValue(new Error('Enrichment failed'));

            // Act
            const result = await identityService.identifyVisitor(
                visitor.id,
                identificationData,
                { skipEnrichment: true }
            );

            // Assert
            expect(result.status).toBe(VISITOR_STATUS.IDENTIFIED);
            expect(result.enrichedData).toBeNull();
        });

        test('should validate email format correctly', async () => {
            // Arrange
            const visitor = generateVisitor();
            const identificationData = {
                ...generateIdentificationData(true),
                email: 'invalid-email'
            };

            // Act & Assert
            await expect(
                identityService.identifyVisitor(visitor.id, identificationData)
            ).rejects.toThrow('Invalid email format');
        });

        test('should handle rate limiting correctly', async () => {
            // Arrange
            const visitor = generateVisitor();
            const identificationData = generateIdentificationData(true);

            rateLimiter.checkLimit.mockRejectedValue(new Error('Rate limit exceeded'));

            // Act & Assert
            await expect(
                identityService.identifyVisitor(visitor.id, identificationData)
            ).rejects.toThrow('Rate limit exceeded');
        });
    });

    describe('validateIdentificationData', () => {
        test('should validate complete identification data successfully', async () => {
            // Arrange
            const validData = generateIdentificationData(true);

            // Act & Assert
            await expect(
                identityService['validateIdentificationData'](validData)
            ).resolves.not.toThrow();
        });

        test('should reject invalid phone formats', async () => {
            // Arrange
            const invalidData = {
                ...generateIdentificationData(true),
                phone: 'invalid-phone'
            };

            // Act & Assert
            await expect(
                identityService['validateIdentificationData'](invalidData)
            ).rejects.toThrow('Invalid phone format');
        });
    });

    describe('enrichVisitorWithRetry', () => {
        test('should retry enrichment on failure', async () => {
            // Arrange
            const visitor = generateVisitor({
                email: faker.internet.email(),
                status: VISITOR_STATUS.IDENTIFIED
            });

            enrichmentService.enrichVisitorData
                .mockRejectedValueOnce(new Error('Temporary failure'))
                .mockResolvedValueOnce({
                    ...visitor,
                    status: VISITOR_STATUS.ENRICHED,
                    enrichedData: {
                        company: faker.company.name(),
                        title: faker.person.jobTitle(),
                        industry: faker.company.buzzPhrase(),
                        size: '50-100',
                        revenue: '$1M-$5M',
                        website: faker.internet.url(),
                        technologies: [],
                        linkedinUrl: faker.internet.url(),
                        socialProfiles: {},
                        customFields: {}
                    }
                });

            // Act
            const result = await identityService['enrichVisitorWithRetry'](visitor);

            // Assert
            expect(result.status).toBe(VISITOR_STATUS.ENRICHED);
            expect(enrichmentService.enrichVisitorData).toHaveBeenCalledTimes(2);
        });
    });
});