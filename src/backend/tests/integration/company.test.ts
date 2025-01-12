/**
 * @fileoverview Integration tests for company-related operations in Identity Matrix platform
 * @version 1.0.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.3
import { Container } from 'inversify'; // ^6.0.1
import { CompanyService } from '../../src/services/company/company.service';
import { CompanyRepository } from '../../src/db/repositories/company.repository';
import { ICompany, ICompanyCreate } from '../../src/interfaces/company.interface';
import { ErrorTypes, ErrorCodes } from '../../src/constants/error.constants';

describe('Company Integration Tests', () => {
  let container: Container;
  let companyService: CompanyService;
  let companyRepository: CompanyRepository;
  let testCompanies: ICompany[] = [];

  // Test data factory
  const createTestCompanyData = (suffix: string = '1'): ICompanyCreate => ({
    name: `Test Company ${suffix}`,
    domain: `test-company-${suffix}.com`,
    subscriptionTier: 'professional',
    billingEmail: `billing-${suffix}@test-company.com`,
    technicalContacts: [`tech-${suffix}@test-company.com`],
    settings: {
      emailNotifications: true,
      allowedDomains: [],
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
    }
  });

  beforeAll(async () => {
    // Initialize container and bindings
    container = new Container();
    container.bind<CompanyService>(CompanyService).toSelf();
    container.bind<CompanyRepository>(CompanyRepository).toSelf();

    // Get service instances
    companyService = container.get<CompanyService>(CompanyService);
    companyRepository = container.get<CompanyRepository>(CompanyRepository);
  });

  afterAll(async () => {
    // Cleanup all test data
    await companyRepository.deleteAll();
    container.unbindAll();
  });

  beforeEach(async () => {
    // Clear existing test data
    await companyRepository.deleteAll();
    testCompanies = [];
  });

  describe('Company Creation Tests', () => {
    test('should create a new company with valid data', async () => {
      // Arrange
      const companyData = createTestCompanyData();
      const startTime = Date.now();

      // Act
      const company = await companyService.createCompany(companyData);
      const responseTime = Date.now() - startTime;

      // Assert
      expect(company).toBeDefined();
      expect(company.id).toBeDefined();
      expect(company.name).toBe(companyData.name);
      expect(company.domain).toBe(companyData.domain);
      expect(responseTime).toBeLessThan(500); // Performance SLA check
      
      testCompanies.push(company);
    });

    test('should reject duplicate domain creation', async () => {
      // Arrange
      const companyData = createTestCompanyData();
      await companyService.createCompany(companyData);

      // Act & Assert
      await expect(companyService.createCompany(companyData))
        .rejects
        .toThrow('Company with this domain already exists');
    });

    test('should validate company data requirements', async () => {
      // Arrange
      const invalidData = {
        ...createTestCompanyData(),
        name: '', // Invalid empty name
      };

      // Act & Assert
      await expect(companyService.createCompany(invalidData))
        .rejects
        .toMatchObject({
          type: ErrorTypes.VALIDATION_ERROR,
          statusCode: ErrorCodes.VALIDATION_FAILED
        });
    });
  });

  describe('Company Retrieval Tests', () => {
    test('should retrieve company by ID with proper isolation', async () => {
      // Arrange
      const company1 = await companyService.createCompany(createTestCompanyData('1'));
      const company2 = await companyService.createCompany(createTestCompanyData('2'));
      testCompanies.push(company1, company2);

      // Act
      const startTime = Date.now();
      const retrievedCompany = await companyService.getCompanyById(company1.id);
      const responseTime = Date.now() - startTime;

      // Assert
      expect(retrievedCompany).toBeDefined();
      expect(retrievedCompany.id).toBe(company1.id);
      expect(responseTime).toBeLessThan(500); // Performance SLA check
    });

    test('should handle non-existent company retrieval', async () => {
      // Arrange
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act & Assert
      await expect(companyService.getCompanyById(nonExistentId))
        .rejects
        .toMatchObject({
          type: ErrorTypes.RESOURCE_ERROR,
          statusCode: ErrorCodes.NOT_FOUND
        });
    });
  });

  describe('Company Update Tests', () => {
    test('should update company settings with validation', async () => {
      // Arrange
      const company = await companyService.createCompany(createTestCompanyData());
      testCompanies.push(company);

      const updateData = {
        settings: {
          ...company.settings,
          emailNotifications: false,
          visitorTrackingSettings: {
            ...company.settings.visitorTrackingSettings,
            retentionDays: 180
          }
        }
      };

      // Act
      const startTime = Date.now();
      const updatedCompany = await companyService.updateCompany(company.id, updateData);
      const responseTime = Date.now() - startTime;

      // Assert
      expect(updatedCompany.settings.emailNotifications).toBe(false);
      expect(updatedCompany.settings.visitorTrackingSettings.retentionDays).toBe(180);
      expect(responseTime).toBeLessThan(500); // Performance SLA check
    });

    test('should validate settings updates', async () => {
      // Arrange
      const company = await companyService.createCompany(createTestCompanyData());
      testCompanies.push(company);

      const invalidSettings = {
        settings: {
          visitorTrackingSettings: {
            retentionDays: 0 // Invalid retention period
          }
        }
      };

      // Act & Assert
      await expect(companyService.updateCompany(company.id, invalidSettings))
        .rejects
        .toMatchObject({
          type: ErrorTypes.VALIDATION_ERROR
        });
    });
  });

  describe('Multi-tenant Isolation Tests', () => {
    test('should maintain data isolation between companies', async () => {
      // Arrange
      const company1 = await companyService.createCompany(createTestCompanyData('1'));
      const company2 = await companyService.createCompany(createTestCompanyData('2'));
      testCompanies.push(company1, company2);

      // Act
      const companies = await companyService.listCompanies();

      // Assert
      expect(companies.rows).toHaveLength(2);
      companies.rows.forEach(company => {
        expect(company.settings.allowedDomains).not.toContain(
          company === company1 ? company2.domain : company1.domain
        );
      });
    });

    test('should enforce domain uniqueness across tenants', async () => {
      // Arrange
      const company1 = await companyService.createCompany(createTestCompanyData());
      testCompanies.push(company1);

      const conflictingData = createTestCompanyData();
      conflictingData.domain = company1.domain;

      // Act & Assert
      await expect(companyService.createCompany(conflictingData))
        .rejects
        .toMatchObject({
          type: ErrorTypes.VALIDATION_ERROR,
          statusCode: ErrorCodes.CONFLICT
        });
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk operations within SLA', async () => {
      // Arrange
      const operationCount = 10;
      const startTime = Date.now();

      // Act
      const promises = Array.from({ length: operationCount }).map((_, index) =>
        companyService.createCompany(createTestCompanyData(`bulk-${index}`))
      );
      const companies = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Assert
      expect(companies).toHaveLength(operationCount);
      expect(totalTime / operationCount).toBeLessThan(500); // Average time per operation
      testCompanies.push(...companies);
    });

    test('should maintain performance under concurrent access', async () => {
      // Arrange
      const company = await companyService.createCompany(createTestCompanyData());
      testCompanies.push(company);
      const concurrentRequests = 5;

      // Act
      const startTime = Date.now();
      const promises = Array.from({ length: concurrentRequests }).map(() =>
        companyService.getCompanyById(company.id)
      );
      await Promise.all(promises);
      const averageTime = (Date.now() - startTime) / concurrentRequests;

      // Assert
      expect(averageTime).toBeLessThan(500); // Performance SLA check
    });
  });
});