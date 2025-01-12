/**
 * @fileoverview Integration tests for CRM integration functionality
 * Tests end-to-end flows, security, error handling, and performance
 * @version 1.0.0
 */

import { describe, test, beforeAll, beforeEach, afterAll, expect, jest } from '@jest/globals'; // ^29.0.0
import { container } from 'tsyringe'; // ^4.8.0
import { Counter, Histogram } from 'prom-client'; // ^14.0.0
import supertest from 'supertest'; // ^6.3.0
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import { IntegrationService } from '../../src/services/integration/integration.service';
import { CRMService } from '../../src/services/integration/crm.service';
import { TestDatabase } from '@test/database';
import { CRM_TYPES, INTEGRATION_STATUS } from '../../src/constants/integration.constants';
import { IIntegrationCreate, IIntegrationCredentials } from '../../src/interfaces/integration.interface';

// Test metrics collectors
const integrationLatency = new Histogram({
  name: 'integration_test_latency',
  help: 'Integration test execution latency',
  labelNames: ['operation', 'status']
});

const integrationErrors = new Counter({
  name: 'integration_test_errors',
  help: 'Integration test error count',
  labelNames: ['operation', 'error_type']
});

describe('Integration Service Tests', () => {
  let integrationService: IntegrationService;
  let crmService: CRMService;
  let testDb: TestDatabase;
  let companyId: string;
  let testCredentials: IIntegrationCredentials;

  beforeAll(async () => {
    // Initialize test database with isolated schema
    testDb = new TestDatabase();
    await testDb.initialize();

    // Set up mock CRM service
    crmService = {
      connectCRM: jest.fn(),
      refreshToken: jest.fn(),
      syncData: jest.fn(),
      handleRateLimit: jest.fn(),
      retryOperation: jest.fn()
    } as unknown as CRMService;

    // Register mocks in container
    container.registerInstance('CRMService', crmService);
    container.registerInstance('Logger', { info: jest.fn(), error: jest.fn() });
    container.registerInstance('MetricsCollector', { record: jest.fn() });

    // Initialize service
    integrationService = container.resolve(IntegrationService);

    // Create test company
    companyId = uuidv4();
    await testDb.createCompany({
      id: companyId,
      name: 'Test Company',
      domain: 'test.com',
      subscriptionTier: 'professional'
    });

    // Set up test credentials
    testCredentials = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      tokenExpiry: new Date(Date.now() + 3600000),
      scope: ['read', 'write'],
      instanceUrl: 'https://test.salesforce.com'
    };
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await testDb.clearIntegrations();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  describe('Integration Creation', () => {
    test('should create integration with valid credentials', async () => {
      const startTime = Date.now();
      const integrationData: IIntegrationCreate = {
        companyId,
        type: CRM_TYPES.SALESFORCE,
        credentials: testCredentials,
        config: {
          syncInterval: 3600000,
          fieldMappings: [
            {
              sourceField: 'email',
              targetField: 'Email',
              required: true,
              validation: { type: 'email' }
            }
          ],
          retryPolicy: {
            maxAttempts: 3,
            backoffInterval: 1000,
            timeoutMs: 5000
          }
        }
      };

      // Mock CRM connection validation
      (crmService.connectCRM as jest.Mock).mockResolvedValueOnce(testCredentials);

      const integration = await integrationService.createIntegration(integrationData);

      expect(integration).toBeDefined();
      expect(integration.type).toBe(CRM_TYPES.SALESFORCE);
      expect(integration.status).toBe(INTEGRATION_STATUS.PENDING);
      expect(integration.companyId).toBe(companyId);

      integrationLatency.observe(
        { operation: 'create', status: 'success' },
        Date.now() - startTime
      );
    });

    test('should enforce unique integration per company and type', async () => {
      const startTime = Date.now();
      const integrationData: IIntegrationCreate = {
        companyId,
        type: CRM_TYPES.SALESFORCE,
        credentials: testCredentials,
        config: {
          syncInterval: 3600000,
          fieldMappings: []
        }
      };

      (crmService.connectCRM as jest.Mock).mockResolvedValue(testCredentials);

      // Create first integration
      await integrationService.createIntegration(integrationData);

      // Attempt to create duplicate
      try {
        await integrationService.createIntegration(integrationData);
        fail('Should not allow duplicate integration');
      } catch (error) {
        expect(error.message).toContain('already exists');
        integrationErrors.inc({ operation: 'create', error_type: 'duplicate' });
      }

      integrationLatency.observe(
        { operation: 'create_duplicate', status: 'error' },
        Date.now() - startTime
      );
    });
  });

  describe('Integration Security', () => {
    test('should validate tenant access for operations', async () => {
      const startTime = Date.now();
      const integration = await createTestIntegration();
      const wrongCompanyId = uuidv4();

      try {
        await integrationService.getIntegration(integration.id, wrongCompanyId);
        fail('Should not allow cross-tenant access');
      } catch (error) {
        expect(error.message).toBe('Integration not found');
        integrationErrors.inc({ operation: 'access', error_type: 'unauthorized' });
      }

      integrationLatency.observe(
        { operation: 'security_check', status: 'error' },
        Date.now() - startTime
      );
    });

    test('should securely handle credentials', async () => {
      const startTime = Date.now();
      const integration = await createTestIntegration();

      // Verify credentials are encrypted
      const rawIntegration = await testDb.getRawIntegration(integration.id);
      expect(rawIntegration.credentials).not.toEqual(testCredentials);
      expect(typeof rawIntegration.credentials).toBe('string');

      integrationLatency.observe(
        { operation: 'credential_check', status: 'success' },
        Date.now() - startTime
      );
    });
  });

  describe('Integration Synchronization', () => {
    test('should handle successful sync operation', async () => {
      const startTime = Date.now();
      const integration = await createTestIntegration();

      (crmService.syncData as jest.Mock).mockResolvedValueOnce({
        success: 10,
        failed: 0
      });

      await integrationService.syncIntegration(integration.id, companyId);

      const updatedIntegration = await integrationService.getIntegration(
        integration.id,
        companyId
      );

      expect(updatedIntegration.status).toBe(INTEGRATION_STATUS.ACTIVE);
      expect(updatedIntegration.lastSyncAt).toBeDefined();

      integrationLatency.observe(
        { operation: 'sync', status: 'success' },
        Date.now() - startTime
      );
    });

    test('should handle sync failures with retry', async () => {
      const startTime = Date.now();
      const integration = await createTestIntegration();

      (crmService.syncData as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ success: 10, failed: 0 });

      try {
        await integrationService.syncIntegration(integration.id, companyId);
      } catch (error) {
        expect(error.message).toContain('API Error');
      }

      const updatedIntegration = await integrationService.getIntegration(
        integration.id,
        companyId
      );
      expect(updatedIntegration.status).toBe(INTEGRATION_STATUS.ERROR);

      integrationLatency.observe(
        { operation: 'sync_retry', status: 'error' },
        Date.now() - startTime
      );
      integrationErrors.inc({ operation: 'sync', error_type: 'api_error' });
    });
  });

  describe('Performance Monitoring', () => {
    test('should track operation latency', async () => {
      const startTime = Date.now();
      const integration = await createTestIntegration();

      const operations = ['getIntegration', 'syncIntegration', 'updateIntegration'];
      for (const operation of operations) {
        const opStartTime = Date.now();
        try {
          await (integrationService as any)[operation](integration.id, companyId);
          integrationLatency.observe(
            { operation, status: 'success' },
            Date.now() - opStartTime
          );
        } catch (error) {
          integrationLatency.observe(
            { operation, status: 'error' },
            Date.now() - opStartTime
          );
        }
      }

      integrationLatency.observe(
        { operation: 'performance_test', status: 'complete' },
        Date.now() - startTime
      );
    });
  });

  // Helper function to create test integration
  async function createTestIntegration() {
    const integrationData: IIntegrationCreate = {
      companyId,
      type: CRM_TYPES.SALESFORCE,
      credentials: testCredentials,
      config: {
        syncInterval: 3600000,
        fieldMappings: [
          {
            sourceField: 'email',
            targetField: 'Email',
            required: true,
            validation: { type: 'email' }
          }
        ],
        retryPolicy: {
          maxAttempts: 3,
          backoffInterval: 1000,
          timeoutMs: 5000
        }
      }
    };

    (crmService.connectCRM as jest.Mock).mockResolvedValueOnce(testCredentials);
    return integrationService.createIntegration(integrationData);
  }
});