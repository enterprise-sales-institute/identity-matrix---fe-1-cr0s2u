/**
 * @fileoverview Company repository implementation for Identity Matrix platform
 * @version 1.0.0
 */

import { Transaction } from 'sequelize'; // ^6.32.x
import { Company } from '../models/company.model';
import { ICompany, ICompanyCreate, ICompanyUpdate } from '../../../interfaces/company.interface';
import { createError } from '../../../utils/error.util';
import { ErrorTypes, ErrorCodes } from '../../../constants/error.constants';

/**
 * Repository class handling all company-related database operations
 * with comprehensive validation, error handling, and transaction support
 */
export class CompanyRepository {
  private companyModel: typeof Company;

  constructor() {
    this.companyModel = Company;
    this.validateModelInitialization();
  }

  /**
   * Validates proper model initialization
   * @throws {AppError} If model is not properly initialized
   */
  private validateModelInitialization(): void {
    if (!this.companyModel) {
      throw createError(
        'Company model not properly initialized',
        ErrorCodes.INTERNAL_SERVER,
        ErrorTypes.SYSTEM_ERROR
      );
    }
  }

  /**
   * Creates a new company record with validation and transaction support
   * @param data Company creation data
   * @param transaction Optional transaction instance
   * @returns Created company record
   */
  async create(data: ICompanyCreate, transaction?: Transaction): Promise<ICompany> {
    try {
      // Normalize domain format
      const normalizedDomain = this.normalizeDomain(data.domain);

      // Check for existing company with same domain
      const existingCompany = await this.findByDomain(normalizedDomain);
      if (existingCompany) {
        throw createError(
          'Company with this domain already exists',
          ErrorCodes.CONFLICT,
          ErrorTypes.VALIDATION_ERROR,
          { domain: normalizedDomain }
        );
      }

      // Create company with transaction support
      const internalTransaction = transaction || await this.companyModel.sequelize!.transaction();
      try {
        const company = await this.companyModel.create(
          {
            ...data,
            domain: normalizedDomain
          },
          { transaction: internalTransaction }
        );

        if (!transaction) {
          await internalTransaction.commit();
        }

        return company.toJSON() as ICompany;
      } catch (error) {
        if (!transaction) {
          await internalTransaction.rollback();
        }
        throw error;
      }
    } catch (error) {
      throw this.handleRepositoryError(error);
    }
  }

  /**
   * Retrieves a company by its ID with enhanced error handling
   * @param id Company ID
   * @returns Found company or null
   */
  async findById(id: string): Promise<ICompany | null> {
    try {
      const company = await this.companyModel.findByPk(id);
      return company ? company.toJSON() as ICompany : null;
    } catch (error) {
      throw this.handleRepositoryError(error);
    }
  }

  /**
   * Retrieves a company by its domain with validation
   * @param domain Company domain
   * @returns Found company or null
   */
  async findByDomain(domain: string): Promise<ICompany | null> {
    try {
      const normalizedDomain = this.normalizeDomain(domain);
      const company = await this.companyModel.findOne({
        where: { domain: normalizedDomain }
      });
      return company ? company.toJSON() as ICompany : null;
    } catch (error) {
      throw this.handleRepositoryError(error);
    }
  }

  /**
   * Updates an existing company record with validation and transaction support
   * @param id Company ID
   * @param data Update data
   * @param transaction Optional transaction instance
   * @returns Updated company record
   */
  async update(id: string, data: ICompanyUpdate, transaction?: Transaction): Promise<ICompany> {
    try {
      const company = await this.companyModel.findByPk(id);
      if (!company) {
        throw createError(
          'Company not found',
          ErrorCodes.NOT_FOUND,
          ErrorTypes.RESOURCE_ERROR,
          { id }
        );
      }

      // Check domain uniqueness if being updated
      if (data.domain) {
        const normalizedDomain = this.normalizeDomain(data.domain);
        const existingCompany = await this.findByDomain(normalizedDomain);
        if (existingCompany && existingCompany.id !== id) {
          throw createError(
            'Domain already in use by another company',
            ErrorCodes.CONFLICT,
            ErrorTypes.VALIDATION_ERROR,
            { domain: normalizedDomain }
          );
        }
        data.domain = normalizedDomain;
      }

      // Update with transaction support
      const internalTransaction = transaction || await this.companyModel.sequelize!.transaction();
      try {
        await company.update(data, { transaction: internalTransaction });

        if (!transaction) {
          await internalTransaction.commit();
        }

        return company.toJSON() as ICompany;
      } catch (error) {
        if (!transaction) {
          await internalTransaction.rollback();
        }
        throw error;
      }
    } catch (error) {
      throw this.handleRepositoryError(error);
    }
  }

  /**
   * Deletes a company record with proper cleanup
   * @param id Company ID
   * @param transaction Optional transaction instance
   */
  async delete(id: string, transaction?: Transaction): Promise<void> {
    try {
      const company = await this.companyModel.findByPk(id);
      if (!company) {
        throw createError(
          'Company not found',
          ErrorCodes.NOT_FOUND,
          ErrorTypes.RESOURCE_ERROR,
          { id }
        );
      }

      const internalTransaction = transaction || await this.companyModel.sequelize!.transaction();
      try {
        await company.destroy({ transaction: internalTransaction });

        if (!transaction) {
          await internalTransaction.commit();
        }
      } catch (error) {
        if (!transaction) {
          await internalTransaction.rollback();
        }
        throw error;
      }
    } catch (error) {
      throw this.handleRepositoryError(error);
    }
  }

  /**
   * Lists companies with pagination and filtering support
   * @param filters Filter conditions
   * @param pagination Pagination options
   * @returns Paginated company list with total count
   */
  async list(
    filters: { isActive?: boolean; subscriptionTier?: string } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ rows: ICompany[]; count: number }> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const { rows, count } = await this.companyModel.findAndCountAll({
        where: filters,
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return {
        rows: rows.map(company => company.toJSON() as ICompany),
        count
      };
    } catch (error) {
      throw this.handleRepositoryError(error);
    }
  }

  /**
   * Normalizes domain format for consistent storage
   * @param domain Domain to normalize
   * @returns Normalized domain
   */
  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  /**
   * Handles repository operation errors with proper error transformation
   * @param error Original error
   * @returns Transformed error
   */
  private handleRepositoryError(error: any): Error {
    if (error.name === 'AppError') {
      return error;
    }

    if (error.name === 'SequelizeValidationError') {
      return createError(
        'Validation error',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR,
        { details: error.errors }
      );
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return createError(
        'Duplicate entry error',
        ErrorCodes.CONFLICT,
        ErrorTypes.VALIDATION_ERROR,
        { details: error.errors }
      );
    }

    return createError(
      'Database operation failed',
      ErrorCodes.INTERNAL_SERVER,
      ErrorTypes.DATA_ERROR,
      { originalError: error.message }
    );
  }
}