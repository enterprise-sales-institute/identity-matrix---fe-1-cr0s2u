/**
 * @fileoverview Integration tests for visitor tracking and management functionality
 * Covers performance benchmarks, GDPR compliance, and real-time updates
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { performance } from 'perf_hooks';
import { WebSocketGateway } from '@nestjs/websockets';
import { VisitorService } from '../../src/services/visitor/visitor.service';
import { IVisitor, IVisitorMetadata } from '../../src/interfaces/visitor.interface';
import { VISITOR_STATUS, VISITOR_ACTIVITY_TYPE } from '../../src/constants/visitor.constants';

// Performance thresholds in milliseconds
const PERFORMANCE_THRESHOLDS = {
  VISITOR_CREATION: 200,
  WEBSOCKET_UPDATE: 50,
  BATCH_PROCESSING: 500
};

// Mock visitor metadata for testing
const mockVisitorMetadata: IVisitorMetadata = {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
  referrer: 'https://example.com',
  currentPage: '/products',
  previousPages: ['/home'],
  customParams: { utm_source: 'google' },
  location: {
    country: 'US',
    city: 'San Francisco',
    region: 'CA',
    postalCode: '94105',
    timezone: 'America/Los_Angeles'
  },
  deviceType: 'desktop',
  browser: 'Chrome 91.0',
  os: 'Windows 10'
};

/**
 * Helper function to measure operation performance
 * @param operation - Async operation to measure
 * @returns Tuple of operation result and execution time
 */
async function measurePerformance<T>(operation: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const result = await operation();
  const executionTime = performance.now() - start;
  return [result, executionTime];
}

/**
 * Helper function to create test visitor with configurable options
 */
async function createTestVisitor(
  visitorService: VisitorService,
  companyId: string,
  metadata: Partial<IVisitorMetadata> = {},
  gdprConsent: boolean = true
): Promise<IVisitor> {
  return visitorService.createVisitor(
    companyId,
    { ...mockVisitorMetadata, ...metadata },
    gdprConsent
  );
}

describe('Visitor Integration Tests', () => {
  let module: TestingModule;
  let visitorService: VisitorService;
  let mongod: MongoMemoryServer;
  let webSocketGateway: WebSocketGateway;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();

    // Create test module with real implementations
    module = await Test.createTestingModule({
      providers: [
        VisitorService,
        WebSocketGateway,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mongoUri
        }
      ]
    }).compile();

    visitorService = module.get<VisitorService>(VisitorService);
    webSocketGateway = module.get<WebSocketGateway>(WebSocketGateway);
  });

  afterAll(async () => {
    await mongod.stop();
    await module.close();
  });

  describe('Visitor Creation and Performance', () => {
    const companyId = '550e8400-e29b-41d4-a716-446655440000';

    it('should create a new visitor within performance threshold', async () => {
      const [visitor, executionTime] = await measurePerformance(() =>
        createTestVisitor(visitorService, companyId)
      );

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.VISITOR_CREATION);
      expect(visitor).toHaveProperty('id');
      expect(visitor.status).toBe(VISITOR_STATUS.ANONYMOUS);
    });

    it('should handle concurrent visitor creation efficiently', async () => {
      const concurrentCreations = 10;
      const startTime = performance.now();

      const creationPromises = Array(concurrentCreations)
        .fill(null)
        .map(() => createTestVisitor(visitorService, companyId));

      const visitors = await Promise.all(creationPromises);
      const totalTime = performance.now() - startTime;

      expect(visitors).toHaveLength(concurrentCreations);
      expect(totalTime / concurrentCreations).toBeLessThan(PERFORMANCE_THRESHOLDS.VISITOR_CREATION);
    });
  });

  describe('Real-time Updates', () => {
    let testVisitor: IVisitor;
    const companyId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(async () => {
      testVisitor = await createTestVisitor(visitorService, companyId);
    });

    it('should emit WebSocket updates within latency threshold', async () => {
      const [, executionTime] = await measurePerformance(async () => {
        await visitorService.trackActivity(testVisitor.id, {
          type: VISITOR_ACTIVITY_TYPE.PAGE_VIEW,
          timestamp: new Date(),
          data: { page: '/products' }
        });
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.WEBSOCKET_UPDATE);
    });

    it('should process batched activities efficiently', async () => {
      const activities = Array(50).fill(null).map(() => ({
        type: VISITOR_ACTIVITY_TYPE.PAGE_VIEW,
        timestamp: new Date(),
        data: { page: '/products' }
      }));

      const [, executionTime] = await measurePerformance(async () => {
        await Promise.all(
          activities.map(activity => visitorService.trackActivity(testVisitor.id, activity))
        );
      });

      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_PROCESSING);
    });
  });

  describe('GDPR Compliance', () => {
    const companyId = '550e8400-e29b-41d4-a716-446655440000';

    it('should properly anonymize visitor data without consent', async () => {
      const visitor = await createTestVisitor(visitorService, companyId, {}, false);

      expect(visitor.metadata.ipAddress).toMatch(/\d+\.\d+\.\d+\.0/);
      expect(visitor.metadata.customParams).not.toHaveProperty('auth');
      expect(visitor.metadata.customParams).not.toHaveProperty('token');
    });

    it('should handle data export requests', async () => {
      const visitor = await createTestVisitor(visitorService, companyId);
      const exportedData = await visitorService.exportVisitorData(visitor.id);

      expect(exportedData).toHaveProperty('personalData');
      expect(exportedData).toHaveProperty('activityLog');
      expect(exportedData).toHaveProperty('metadata');
    });

    it('should enforce data retention policies', async () => {
      const visitor = await createTestVisitor(visitorService, companyId);
      const retentionPeriod = new Date();
      retentionPeriod.setMonth(retentionPeriod.getMonth() - 13); // 13 months ago

      visitor.firstSeen = retentionPeriod;
      await visitorService.updateVisitor(visitor.id, { firstSeen: retentionPeriod });

      const anonymizedVisitor = await visitorService.getVisitor(visitor.id);
      expect(anonymizedVisitor.metadata.ipAddress).toBe('0.0.0.0');
      expect(anonymizedVisitor.email).toBeNull();
    });
  });

  describe('Visitor Identification', () => {
    const companyId = '550e8400-e29b-41d4-a716-446655440000';

    it('should properly transition visitor status during identification', async () => {
      const visitor = await createTestVisitor(visitorService, companyId);
      
      const identifiedVisitor = await visitorService.identifyVisitor(
        visitor.id,
        'test@example.com',
        {
          company: 'Test Corp',
          industry: 'Technology'
        }
      );

      expect(identifiedVisitor.status).toBe(VISITOR_STATUS.IDENTIFIED);
      expect(identifiedVisitor.email).toBe('test@example.com');
      expect(identifiedVisitor.enrichedData).toBeDefined();
    });
  });
});