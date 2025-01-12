import { describe, beforeEach, it, expect, jest } from '@jest/globals'; // ^29.0.0
import { mock, MockProxy } from 'jest-mock-extended'; // ^3.0.0

import { CompanyService } from '../../../src/services/company/company.service';
import { CompanyRepository } from '../../../src/db/repositories/company.repository';
import { ICompany, ICompanyCreate, ICompanyUpdate, ICompanySettings } from '../../../src/interfaces/company.interface';
import { ErrorTypes, ErrorCodes } from '../../../src/constants/error.constants';

describe('CompanyService', () => {
  let mockCompanyRepository: MockProxy<CompanyRepository>;
  let companyService: CompanyService;
  let testCompany: ICompany;

  beforeEach(() => {
    // Reset all mocks before each test
    mockCompanyRepository = mock<CompanyRepository>();
    companyService = new CompanyService(mockCompanyRepository);

    // Initialize test company data
    testCompany = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Company',
      domain: 'test.com',
      subscriptionTier: 'professional',
      settings: {
        emailNotifications: true,
        allowedDomains: ['test.com'],
        integrationConfig: {
          enabled: true,
          allowedIntegrations: [],
          integrationSettings: {}
        },
        visitorTrackingSettings: {
          enabled: true,
          retentionDays: 365,
          excludedPaths: [],
          captureIPAddress: true
        },
        timezone: 'UTC',
        securitySettings: {
          enforceIPRestrictions: false,
          allowedIPs: [],
          requireMFA: false
        }
      },
      isActive: true,
      billingEmail: 'billing@test.com',
      technicalContacts: ['tech@test.com'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('createCompany', () => {
    it('should create a new company with valid data', async () => {
      const createData: ICompanyCreate = {
        name: 'New Company',
        domain: 'newcompany.com',
        subscriptionTier: 'professional',
        settings: testCompany.settings,
        billingEmail: 'billing@newcompany.com',
        technicalContacts: ['tech@newcompany.com']
      };

      mockCompanyRepository.create.mockResolvedValue({ ...testCompany, ...createData });

      const result = await companyService.createCompany(createData);

      expect(mockCompanyRepository.create).toHaveBeenCalledWith(createData, undefined);
      expect(result.name).toBe(createData.name);
      expect(result.domain).toBe(createData.domain);
    });

    it('should throw error if company domain already exists', async () => {
      const createData: ICompanyCreate = {
        name: 'Duplicate Company',
        domain: 'test.com',
        subscriptionTier: 'professional',
        settings: testCompany.settings,
        billingEmail: 'billing@test.com',
        technicalContacts: ['tech@test.com']
      };

      mockCompanyRepository.create.mockRejectedValue(
        new Error('Company with this domain already exists')
      );

      await expect(companyService.createCompany(createData))
        .rejects
        .toThrow('Company with this domain already exists');
    });

    it('should set default settings for new company', async () => {
      const createData: ICompanyCreate = {
        name: 'New Company',
        domain: 'newcompany.com',
        subscriptionTier: 'professional',
        settings: {},
        billingEmail: 'billing@newcompany.com',
        technicalContacts: ['tech@newcompany.com']
      };

      mockCompanyRepository.create.mockImplementation(async (data) => ({
        ...testCompany,
        ...data
      }));

      const result = await companyService.createCompany(createData);

      expect(result.settings).toHaveProperty('emailNotifications');
      expect(result.settings).toHaveProperty('visitorTrackingSettings');
      expect(result.settings).toHaveProperty('securitySettings');
    });
  });

  describe('getCompanyById', () => {
    it('should return company when valid ID provided', async () => {
      mockCompanyRepository.findById.mockResolvedValue(testCompany);

      const result = await companyService.getCompanyById(testCompany.id);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(testCompany.id);
      expect(result).toEqual(testCompany);
    });

    it('should throw NotFoundError when company doesn\'t exist', async () => {
      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(companyService.getCompanyById('non-existent-id'))
        .rejects
        .toMatchObject({
          statusCode: ErrorCodes.NOT_FOUND,
          type: ErrorTypes.RESOURCE_ERROR
        });
    });
  });

  describe('getCompanyByDomain', () => {
    it('should return company when valid domain provided', async () => {
      mockCompanyRepository.findByDomain.mockResolvedValue(testCompany);

      const result = await companyService.getCompanyByDomain(testCompany.domain);

      expect(mockCompanyRepository.findByDomain).toHaveBeenCalledWith(testCompany.domain);
      expect(result).toEqual(testCompany);
    });

    it('should throw NotFoundError when domain doesn\'t exist', async () => {
      mockCompanyRepository.findByDomain.mockResolvedValue(null);

      await expect(companyService.getCompanyByDomain('non-existent.com'))
        .rejects
        .toMatchObject({
          statusCode: ErrorCodes.NOT_FOUND,
          type: ErrorTypes.RESOURCE_ERROR
        });
    });
  });

  describe('updateCompany', () => {
    it('should update company with valid data', async () => {
      const updateData: ICompanyUpdate = {
        name: 'Updated Company',
        subscriptionTier: 'enterprise'
      };

      mockCompanyRepository.update.mockResolvedValue({
        ...testCompany,
        ...updateData
      });

      const result = await companyService.updateCompany(testCompany.id, updateData);

      expect(mockCompanyRepository.update).toHaveBeenCalledWith(
        testCompany.id,
        updateData,
        undefined
      );
      expect(result.name).toBe(updateData.name);
      expect(result.subscriptionTier).toBe(updateData.subscriptionTier);
    });

    it('should validate domain uniqueness on update', async () => {
      const updateData: ICompanyUpdate = {
        domain: 'existing.com'
      };

      mockCompanyRepository.update.mockRejectedValue(
        new Error('Domain already in use')
      );

      await expect(companyService.updateCompany(testCompany.id, updateData))
        .rejects
        .toThrow('Domain already in use');
    });
  });

  describe('updateCompanySettings', () => {
    it('should update company settings', async () => {
      const settingsUpdate: Partial<ICompanySettings> = {
        emailNotifications: false,
        timezone: 'America/New_York'
      };

      mockCompanyRepository.findById.mockResolvedValue(testCompany);
      mockCompanyRepository.update.mockResolvedValue({
        ...testCompany,
        settings: {
          ...testCompany.settings,
          ...settingsUpdate
        }
      });

      const result = await companyService.updateCompanySettings(
        testCompany.id,
        settingsUpdate
      );

      expect(result.settings.emailNotifications).toBe(false);
      expect(result.settings.timezone).toBe('America/New_York');
    });

    it('should validate settings schema', async () => {
      const invalidSettings = {
        timezone: 'Invalid/Timezone'
      };

      mockCompanyRepository.findById.mockResolvedValue(testCompany);

      await expect(companyService.updateCompanySettings(testCompany.id, invalidSettings))
        .rejects
        .toMatchObject({
          type: ErrorTypes.VALIDATION_ERROR
        });
    });
  });

  describe('deleteCompany', () => {
    it('should delete existing company', async () => {
      mockCompanyRepository.delete.mockResolvedValue(undefined);

      await companyService.deleteCompany(testCompany.id);

      expect(mockCompanyRepository.delete).toHaveBeenCalledWith(
        testCompany.id,
        undefined
      );
    });

    it('should throw error when company not found', async () => {
      mockCompanyRepository.delete.mockRejectedValue(
        new Error('Company not found')
      );

      await expect(companyService.deleteCompany('non-existent-id'))
        .rejects
        .toThrow('Company not found');
    });
  });

  describe('listCompanies', () => {
    it('should return paginated company list', async () => {
      const mockPaginatedResponse = {
        rows: [testCompany],
        count: 1
      };

      mockCompanyRepository.list.mockResolvedValue(mockPaginatedResponse);

      const result = await companyService.listCompanies(
        { isActive: true },
        { page: 1, limit: 10 }
      );

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockCompanyRepository.list).toHaveBeenCalledWith(
        { isActive: true },
        { page: 1, limit: 10 }
      );
    });

    it('should handle empty result set', async () => {
      mockCompanyRepository.list.mockResolvedValue({
        rows: [],
        count: 0
      });

      const result = await companyService.listCompanies();

      expect(result.rows).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });
});