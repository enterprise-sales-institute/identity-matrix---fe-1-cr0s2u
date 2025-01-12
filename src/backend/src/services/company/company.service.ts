/**
 * @fileoverview Company service implementation for Identity Matrix platform
 * @version 1.0.0
 */

import { injectable } from 'inversify'; // ^6.0.1
import { Transaction } from 'sequelize'; // ^6.32.x
import { CompanyRepository } from '../../db/repositories/company.repository';
import { ICompany, ICompanyCreate, ICompanyUpdate, ICompanySettings } from '../../interfaces/company.interface';
import { createError } from '../../utils/error.util';
import { ErrorTypes, ErrorCodes } from '../../constants/error.constants';
import { Logger } from '../../utils/logger.util';

/**
 * Service class implementing comprehensive company management functionality
 * with transaction support, validation, and error handling
 */
@injectable()
export class CompanyService {
  private readonly logger: Logger;

  constructor(private readonly companyRepository: CompanyRepository) {
    this.logger = new Logger('CompanyService');
  }

  /**
   * Creates a new company with validation and initialization
   * @param data Company creation data
   * @param transaction Optional transaction instance
   * @returns Created company record
   */
  async createCompany(data: ICompanyCreate, transaction?: Transaction): Promise<ICompany> {
    try {
      // Validate required fields
      this.validateCompanyData(data);

      // Initialize default settings if not provided
      data.settings = this.initializeCompanySettings(data.settings);

      // Create company with transaction support
      const company = await this.companyRepository.create(data, transaction);

      this.logger.info('Company created successfully', { companyId: company.id });
      return company;
    } catch (error) {
      this.logger.error('Company creation failed', { error });
      throw error;
    }
  }

  /**
   * Retrieves company by ID with validation
   * @param id Company ID
   * @returns Found company or null
   */
  async getCompanyById(id: string): Promise<ICompany> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw createError(
        'Company not found',
        ErrorCodes.NOT_FOUND,
        ErrorTypes.RESOURCE_ERROR,
        { id }
      );
    }
    return company;
  }

  /**
   * Retrieves company by domain with validation
   * @param domain Company domain
   * @returns Found company or null
   */
  async getCompanyByDomain(domain: string): Promise<ICompany> {
    const company = await this.companyRepository.findByDomain(domain);
    if (!company) {
      throw createError(
        'Company not found',
        ErrorCodes.NOT_FOUND,
        ErrorTypes.RESOURCE_ERROR,
        { domain }
      );
    }
    return company;
  }

  /**
   * Updates company information with validation
   * @param id Company ID
   * @param data Update data
   * @param transaction Optional transaction instance
   * @returns Updated company record
   */
  async updateCompany(
    id: string,
    data: ICompanyUpdate,
    transaction?: Transaction
  ): Promise<ICompany> {
    try {
      // Validate update data
      if (data.settings) {
        this.validateCompanySettings(data.settings);
      }

      // Perform update with transaction support
      const company = await this.companyRepository.update(id, data, transaction);

      this.logger.info('Company updated successfully', { companyId: id });
      return company;
    } catch (error) {
      this.logger.error('Company update failed', { error, companyId: id });
      throw error;
    }
  }

  /**
   * Updates company settings with validation
   * @param id Company ID
   * @param settings New settings
   * @param transaction Optional transaction instance
   * @returns Updated company record
   */
  async updateCompanySettings(
    id: string,
    settings: Partial<ICompanySettings>,
    transaction?: Transaction
  ): Promise<ICompany> {
    try {
      const company = await this.getCompanyById(id);
      
      // Merge existing settings with updates
      const updatedSettings = {
        ...company.settings,
        ...settings
      };

      // Validate merged settings
      this.validateCompanySettings(updatedSettings);

      // Update company with new settings
      return await this.companyRepository.update(
        id,
        { settings: updatedSettings },
        transaction
      );
    } catch (error) {
      this.logger.error('Company settings update failed', { error, companyId: id });
      throw error;
    }
  }

  /**
   * Deletes company with proper cleanup
   * @param id Company ID
   * @param transaction Optional transaction instance
   */
  async deleteCompany(id: string, transaction?: Transaction): Promise<void> {
    try {
      await this.companyRepository.delete(id, transaction);
      this.logger.info('Company deleted successfully', { companyId: id });
    } catch (error) {
      this.logger.error('Company deletion failed', { error, companyId: id });
      throw error;
    }
  }

  /**
   * Lists companies with filtering and pagination
   * @param filters Filter conditions
   * @param pagination Pagination options
   * @returns Paginated company list
   */
  async listCompanies(
    filters: { isActive?: boolean; subscriptionTier?: string } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ rows: ICompany[]; count: number }> {
    return await this.companyRepository.list(filters, pagination);
  }

  /**
   * Validates company creation/update data
   * @param data Company data to validate
   * @throws {AppError} If validation fails
   */
  private validateCompanyData(data: ICompanyCreate | ICompanyUpdate): void {
    if ('name' in data && (!data.name || data.name.length < 2)) {
      throw createError(
        'Invalid company name',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR,
        { field: 'name' }
      );
    }

    if ('domain' in data && (!data.domain || !this.isValidDomain(data.domain))) {
      throw createError(
        'Invalid domain format',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR,
        { field: 'domain' }
      );
    }

    if ('billingEmail' in data && (!data.billingEmail || !this.isValidEmail(data.billingEmail))) {
      throw createError(
        'Invalid billing email',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR,
        { field: 'billingEmail' }
      );
    }

    if ('technicalContacts' in data) {
      this.validateTechnicalContacts(data.technicalContacts);
    }
  }

  /**
   * Validates company settings structure
   * @param settings Settings to validate
   * @throws {AppError} If validation fails
   */
  private validateCompanySettings(settings: Partial<ICompanySettings>): void {
    if (settings.timezone && !this.isValidTimezone(settings.timezone)) {
      throw createError(
        'Invalid timezone',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR,
        { field: 'timezone' }
      );
    }

    if (settings.visitorTrackingSettings?.retentionDays) {
      const { retentionDays } = settings.visitorTrackingSettings;
      if (retentionDays < 1 || retentionDays > 730) {
        throw createError(
          'Invalid retention period',
          ErrorCodes.VALIDATION_FAILED,
          ErrorTypes.VALIDATION_ERROR,
          { field: 'retentionDays', min: 1, max: 730 }
        );
      }
    }
  }

  /**
   * Initializes default company settings
   * @param settings Partial settings to merge with defaults
   * @returns Complete settings object
   */
  private initializeCompanySettings(settings: Partial<ICompanySettings> = {}): ICompanySettings {
    return {
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
      },
      ...settings
    };
  }

  /**
   * Validates technical contact email addresses
   * @param contacts List of technical contacts
   * @throws {AppError} If validation fails
   */
  private validateTechnicalContacts(contacts: string[]): void {
    if (!Array.isArray(contacts)) {
      throw createError(
        'Technical contacts must be an array',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR
      );
    }

    contacts.forEach(email => {
      if (!this.isValidEmail(email)) {
        throw createError(
          'Invalid technical contact email',
          ErrorCodes.VALIDATION_FAILED,
          ErrorTypes.VALIDATION_ERROR,
          { email }
        );
      }
    });
  }

  /**
   * Validates email format
   * @param email Email to validate
   * @returns Validation result
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validates domain format
   * @param domain Domain to validate
   * @returns Validation result
   */
  private isValidDomain(domain: string): boolean {
    return /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/.test(domain);
  }

  /**
   * Validates timezone format
   * @param timezone Timezone to validate
   * @returns Validation result
   */
  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }
}