/**
 * @fileoverview Unit tests for IntegrationService class
 * Verifies CRM integration management, security, and monitoring capabilities
 * @version 1.0.0
 */

import { Logger } from 'winston'; // ^3.8.x
import { MetricsCollector } from '@opentelemetry/metrics'; // ^1.0.x
import { CircuitBreaker } from 'opossum'; // ^6.0.x
import { v4 as uuidv4 } from 'uuid'; // ^9.0.x

import { IntegrationService } from '../../src/services/integration/integration.service';
import { CRMService } from '../../src/services/integration/crm.service';
import { IntegrationRepository } from '../../src/db/repositories/integration.repository';
import { CRM_TYPES, INTEGRATION_STATUS } from '../../src/constants/integration.constants';

// Mock dependencies
jest.mock('../../src/services/integration/crm.service');
jest.mock('../../src/db/repositories/integration.repository');
jest.mock('winston');
jest.mock('@opentelemetry/metrics');

describe('IntegrationService', () => {
  let integrationService: IntegrationService;
  let mockLogger: jest.Mocked<Logger>;
  let mockCRMService: jest.Mocked<CRMService>;
  let mockIntegrationRepository: jest.Mocked<IntegrationRepository>;
  let mockMetricsCollector: jest.Mocked<MetricsCollector>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;

  const mockCompanyId = uuidv4();
  const mockIntegrationId = uuidv4();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Initialize mocks
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockCRMService = {
      connectCRM: jest.fn(),
      syncData: jest.fn(),
      validateCredentials: jest.fn(),
      refreshToken: jest.fn(),
    } as any;

    mockIntegrationRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByCompany: jest.fn(),
      findPendingSync: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    mockMetricsCollector = {
      record: jest.fn(),
    } as any;

    mockCircuitBreaker = {
      fire: jest.fn(),
    } as any;

    // Initialize service with mocks
    integrationService = new IntegrationService(
      mockLogger,
      mockIntegrationRepository,
      mockCRMService,
      { create: () => mockCircuitBreaker },
      mockMetricsCollector
    );
  });

  describe('createIntegration', () => {
    const mockCreateData = {
      companyId: mockCompanyId,
      type: CRM_TYPES.SALESFORCE,
      credentials: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        tokenExpiry: new Date(Date.now() + 3600000),
        scope: ['read', 'write'],
        instanceUrl: 'https://test.salesforce.com'
      },
      config: {
        syncInterval: 3600000,
        fieldMappings: [],
        retryPolicy: {
          maxAttempts: 3,
          backoffInterval: 1000,
          timeoutMs: 5000
        }
      }
    };

    it('should create integration successfully with validated credentials', async () => {
      const validatedCreds = { ...mockCreateData.credentials, accessToken: 'new-token' };
      const mockIntegration = { ...mockCreateData, id: mockIntegrationId };

      mockCRMService.connectCRM.mockResolvedValue(validatedCreds);
      mockIntegrationRepository.create.mockResolvedValue(mockIntegration);

      const result = await integrationService.createIntegration(mockCreateData);

      expect(result).toEqual(mockIntegration);
      expect(mockCRMService.connectCRM).toHaveBeenCalledWith(
        mockCreateData.type,
        mockCreateData.credentials
      );
      expect(mockIntegrationRepository.create).toHaveBeenCalledWith({
        ...mockCreateData,
        credentials: validatedCreds
      });
      expect(mockMetricsCollector.record).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'integration.create.success'
        })
      );
    });

    it('should handle credential validation failure', async () => {
      const error = new Error('Invalid credentials');
      mockCRMService.connectCRM.mockRejectedValue(error);

      await expect(integrationService.createIntegration(mockCreateData))
        .rejects.toThrow('Invalid credentials');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Integration creation failed',
        expect.objectContaining({
          error: error.message,
          companyId: mockCreateData.companyId,
          type: mockCreateData.type
        })
      );
      expect(mockMetricsCollector.record).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'integration.create.error'
        })
      );
    });
  });

  describe('updateIntegration', () => {
    const mockUpdateData = {
      credentials: {
        accessToken: 'updated-token',
        refreshToken: 'updated-refresh-token',
        tokenExpiry: new Date(Date.now() + 3600000)
      },
      config: {
        syncInterval: 7200000
      }
    };

    it('should update integration successfully with security validation', async () => {
      const existingIntegration = {
        id: mockIntegrationId,
        companyId: mockCompanyId,
        type: CRM_TYPES.SALESFORCE,
        credentials: mockCreateData.credentials
      };

      mockIntegrationRepository.findById.mockResolvedValue(existingIntegration);
      mockCRMService.connectCRM.mockResolvedValue({
        ...existingIntegration.credentials,
        ...mockUpdateData.credentials
      });
      mockIntegrationRepository.update.mockResolvedValue({
        ...existingIntegration,
        ...mockUpdateData
      });

      const result = await integrationService.updateIntegration(
        mockIntegrationId,
        mockUpdateData,
        mockCompanyId
      );

      expect(result).toBeDefined();
      expect(mockIntegrationRepository.findById).toHaveBeenCalledWith(
        mockIntegrationId,
        mockCompanyId
      );
      expect(mockMetricsCollector.record).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'integration.update.success'
        })
      );
    });

    it('should reject update for non-existent integration', async () => {
      mockIntegrationRepository.findById.mockResolvedValue(null);

      await expect(integrationService.updateIntegration(
        mockIntegrationId,
        mockUpdateData,
        mockCompanyId
      )).rejects.toThrow('Integration not found');

      expect(mockMetricsCollector.record).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'integration.update.error'
        })
      );
    });
  });

  describe('syncIntegration', () => {
    const mockIntegration = {
      id: mockIntegrationId,
      companyId: mockCompanyId,
      type: CRM_TYPES.SALESFORCE,
      credentials: mockCreateData.credentials,
      config: {
        fieldMappings: []
      }
    };

    it('should sync integration data successfully with circuit breaker', async () => {
      mockIntegrationRepository.findById.mockResolvedValue(mockIntegration);
      mockCircuitBreaker.fire.mockImplementation(async (fn) => await fn());
      mockCRMService.syncData.mockResolvedValue({ success: 10, failed: 0 });

      await integrationService.syncIntegration(mockIntegrationId, mockCompanyId);

      expect(mockCircuitBreaker.fire).toHaveBeenCalled();
      expect(mockIntegrationRepository.update).toHaveBeenCalledWith(
        mockIntegrationId,
        expect.objectContaining({
          status: INTEGRATION_STATUS.ACTIVE
        }),
        mockCompanyId
      );
      expect(mockMetricsCollector.record).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'integration.sync.success'
        })
      );
    });

    it('should handle sync failure and update status', async () => {
      const error = new Error('Sync failed');
      mockIntegrationRepository.findById.mockResolvedValue(mockIntegration);
      mockCircuitBreaker.fire.mockRejectedValue(error);

      await expect(integrationService.syncIntegration(
        mockIntegrationId,
        mockCompanyId
      )).rejects.toThrow('Sync failed');

      expect(mockIntegrationRepository.updateStatus).toHaveBeenCalledWith(
        mockIntegrationId,
        INTEGRATION_STATUS.ERROR,
        mockCompanyId
      );
      expect(mockMetricsCollector.record).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'integration.sync.error'
        })
      );
    });
  });

  describe('processPendingSync', () => {
    it('should process all pending integrations', async () => {
      const mockPendingIntegrations = [
        { id: uuidv4(), companyId: mockCompanyId },
        { id: uuidv4(), companyId: mockCompanyId }
      ];

      mockIntegrationRepository.findPendingSync.mockResolvedValue(mockPendingIntegrations);
      const syncIntegrationSpy = jest.spyOn(integrationService, 'syncIntegration')
        .mockResolvedValue();

      await integrationService.processPendingSync(mockCompanyId);

      expect(mockIntegrationRepository.findPendingSync).toHaveBeenCalledWith(mockCompanyId);
      expect(syncIntegrationSpy).toHaveBeenCalledTimes(mockPendingIntegrations.length);
      mockPendingIntegrations.forEach(integration => {
        expect(syncIntegrationSpy).toHaveBeenCalledWith(
          integration.id,
          integration.companyId
        );
      });
    });

    it('should continue processing on individual sync failures', async () => {
      const mockPendingIntegrations = [
        { id: uuidv4(), companyId: mockCompanyId },
        { id: uuidv4(), companyId: mockCompanyId }
      ];

      mockIntegrationRepository.findPendingSync.mockResolvedValue(mockPendingIntegrations);
      jest.spyOn(integrationService, 'syncIntegration')
        .mockRejectedValueOnce(new Error('Sync failed'))
        .mockResolvedValueOnce();

      await integrationService.processPendingSync(mockCompanyId);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process pending sync',
        expect.any(Object)
      );
      expect(mockIntegrationRepository.findPendingSync).toHaveBeenCalledWith(mockCompanyId);
    });
  });
});