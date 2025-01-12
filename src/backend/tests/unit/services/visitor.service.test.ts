import { Test, TestingModule } from '@nestjs/testing';
import { VisitorService } from '../../../src/services/visitor/visitor.service';
import { IVisitor, IVisitorMetadata } from '../../../src/interfaces/visitor.interface';
import { VISITOR_STATUS, VISITOR_CACHE_TTL } from '../../../src/constants/visitor.constants';

describe('VisitorService', () => {
  let visitorService: VisitorService;
  let mockVisitorRepository: jest.Mocked<any>;
  let mockCacheService: jest.Mocked<any>;
  let mockMetricsService: jest.Mocked<any>;
  let mockConfigService: jest.Mocked<any>;

  const testCompanyId = 'test-company-uuid';
  const testVisitorId = 'test-visitor-uuid';

  beforeAll(() => {
    jest.setTimeout(10000); // Set timeout for performance tests
  });

  beforeEach(async () => {
    // Initialize comprehensive mocks
    mockVisitorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCompanyId: jest.fn(),
      update: jest.fn(),
      updateActivities: jest.fn(),
      delete: jest.fn(),
      batchCreate: jest.fn(),
      batchUpdate: jest.fn()
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn()
    };

    mockMetricsService = {
      startTimer: jest.fn(() => ({ end: jest.fn() })),
      incrementCounter: jest.fn(),
      recordLatency: jest.fn(),
      recordGauge: jest.fn()
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(100) // Default batch size
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitorService,
        { provide: 'VisitorRepository', useValue: mockVisitorRepository },
        { provide: 'CacheService', useValue: mockCacheService },
        { provide: 'MetricsService', useValue: mockMetricsService },
        { provide: 'ConfigService', useValue: mockConfigService }
      ],
    }).compile();

    visitorService = module.get<VisitorService>(VisitorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVisitor', () => {
    const testMetadata: IVisitorMetadata = {
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent',
      referrer: 'test-referrer',
      currentPage: '/test',
      previousPages: [],
      customParams: {},
      location: {
        country: 'US',
        city: 'Test City',
        region: 'Test Region',
        postalCode: '12345',
        timezone: 'UTC'
      },
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows'
    };

    it('should create a visitor with GDPR consent', async () => {
      const expectedVisitor: Partial<IVisitor> = {
        id: expect.any(String),
        companyId: testCompanyId,
        status: VISITOR_STATUS.ANONYMOUS,
        metadata: testMetadata
      };

      mockVisitorRepository.create.mockResolvedValue(expectedVisitor);

      const result = await visitorService.createVisitor(testCompanyId, testMetadata, true);

      expect(result).toMatchObject(expectedVisitor);
      expect(mockMetricsService.startTimer).toHaveBeenCalledWith('visitor_creation');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `visitor:${result.id}`,
        result,
        VISITOR_CACHE_TTL
      );
      expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith('visitors_created');
    });

    it('should create a visitor with anonymized data when no GDPR consent', async () => {
      const result = await visitorService.createVisitor(testCompanyId, testMetadata, false);

      expect(result.metadata.ipAddress).toMatch(/\d+\.\d+\.\d+\.0/);
      expect(mockVisitorRepository.create).toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      mockVisitorRepository.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        visitorService.createVisitor(testCompanyId, testMetadata, true)
      ).rejects.toThrow('DB Error');
    });

    it('should complete creation within performance SLA', async () => {
      const startTime = Date.now();
      await visitorService.createVisitor(testCompanyId, testMetadata, true);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500); // 500ms SLA
    });
  });

  describe('trackActivity', () => {
    const testActivity = {
      type: 'PAGE_VIEW',
      timestamp: new Date(),
      data: { page: '/test' }
    };

    it('should queue activity for batch processing', async () => {
      await visitorService.trackActivity(testVisitorId, testActivity);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `visitor:${testVisitorId}:lastSeen`,
        expect.any(Date),
        VISITOR_CACHE_TTL
      );
      expect(mockMetricsService.incrementCounter).toHaveBeenCalledWith('visitor_activities');
    });

    it('should handle multiple activities for the same visitor', async () => {
      await visitorService.trackActivity(testVisitorId, testActivity);
      await visitorService.trackActivity(testVisitorId, testActivity);

      expect(mockMetricsService.incrementCounter).toHaveBeenCalledTimes(2);
    });
  });

  describe('identifyVisitor', () => {
    const testEmail = 'test@example.com';
    const testEnrichedData = {
      company: 'Test Corp',
      title: 'Test Title'
    };

    beforeEach(() => {
      mockCacheService.get.mockResolvedValue({
        id: testVisitorId,
        status: VISITOR_STATUS.ANONYMOUS
      });
    });

    it('should update visitor identification status', async () => {
      mockVisitorRepository.update.mockResolvedValue({
        id: testVisitorId,
        email: testEmail,
        status: VISITOR_STATUS.IDENTIFIED
      });

      const result = await visitorService.identifyVisitor(testVisitorId, testEmail);

      expect(result.status).toBe(VISITOR_STATUS.IDENTIFIED);
      expect(result.email).toBe(testEmail);
    });

    it('should handle enriched data when provided', async () => {
      const result = await visitorService.identifyVisitor(
        testVisitorId,
        testEmail,
        testEnrichedData
      );

      expect(result.enrichedData).toEqual(testEnrichedData);
      expect(result.lastEnriched).toBeInstanceOf(Date);
    });
  });

  describe('processBatchedActivities', () => {
    it('should process activities in batches', async () => {
      // Add test activities
      const activities = Array(150).fill({
        type: 'PAGE_VIEW',
        timestamp: new Date(),
        data: { page: '/test' }
      });

      for (const activity of activities) {
        await visitorService.trackActivity(testVisitorId, activity);
      }

      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 5500));

      expect(mockVisitorRepository.updateActivities).toHaveBeenCalled();
    });
  });

  describe('GDPR Compliance', () => {
    it('should properly anonymize IP addresses', async () => {
      const testMetadata: IVisitorMetadata = {
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        referrer: 'test-referrer',
        currentPage: '/test',
        previousPages: [],
        customParams: {},
        location: {
          country: 'US',
          city: 'Test City',
          region: 'Test Region',
          postalCode: '12345',
          timezone: 'UTC'
        },
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows'
      };

      const result = await visitorService.createVisitor(testCompanyId, testMetadata, false);
      expect(result.metadata.ipAddress).toBe('192.168.1.0');
    });

    it('should filter sensitive data from custom parameters', async () => {
      const testMetadata: IVisitorMetadata = {
        ...testMetadata,
        customParams: {
          password: 'secret',
          authToken: 'token',
          name: 'John'
        }
      };

      const result = await visitorService.createVisitor(testCompanyId, testMetadata, false);
      expect(result.metadata.customParams).not.toHaveProperty('password');
      expect(result.metadata.customParams).not.toHaveProperty('authToken');
      expect(result.metadata.customParams).toHaveProperty('name');
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics for all operations', async () => {
      await visitorService.createVisitor(testCompanyId, testMetadata, true);
      
      expect(mockMetricsService.startTimer).toHaveBeenCalled();
      expect(mockMetricsService.incrementCounter).toHaveBeenCalled();
    });

    it('should maintain response times within SLA', async () => {
      const operations = Array(10).fill(null).map(() => 
        visitorService.createVisitor(testCompanyId, testMetadata, true)
      );

      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      const averageTime = (endTime - startTime) / operations.length;
      expect(averageTime).toBeLessThan(500); // 500ms SLA
    });
  });
});