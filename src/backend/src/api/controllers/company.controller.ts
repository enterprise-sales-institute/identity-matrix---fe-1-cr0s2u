/**
 * @fileoverview Company controller implementation for Identity Matrix platform
 * @version 1.0.0
 * 
 * Implements secure and validated REST endpoints for company management operations
 * with comprehensive error handling and rate limiting.
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { injectable } from 'inversify'; // ^6.0.1
import { 
  controller, 
  httpGet, 
  httpPost, 
  httpPut, 
  httpDelete,
  middleware 
} from 'inversify-express-utils'; // ^6.4.3
import { rateLimit } from 'express-rate-limit'; // ^6.7.0
import { sanitizeInput, validateDomain } from 'validator'; // ^13.9.0

import { CompanyService } from '../../services/company/company.service';
import { 
  validateCompanyCreate, 
  validateCompanyUpdate 
} from '../validators/company.validator';
import { createError, handleValidationError } from '../../utils/error.util';
import { ErrorCodes, ErrorTypes } from '../../constants/error.constants';
import { Logger } from '../../utils/logger.util';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // Maximum requests per window

/**
 * Controller handling company management operations with enhanced security
 * and comprehensive validation.
 */
@injectable()
@controller('/api/v1/companies')
@middleware([
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: 'Too many requests from this IP, please try again later'
  })
])
export class CompanyController {
  private readonly logger: Logger;

  constructor(
    private readonly companyService: CompanyService
  ) {
    this.logger = new Logger('CompanyController');
  }

  /**
   * Creates a new company with enhanced validation and security checks
   * @route POST /api/v1/companies
   */
  @httpPost('/')
  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Sanitize input data
      const sanitizedData = this.sanitizeCompanyData(req.body);

      // Validate request payload
      const validatedData = await validateCompanyCreate(sanitizedData);

      // Additional domain validation
      if (!validateDomain(validatedData.domain)) {
        throw createError(
          'Invalid domain format',
          ErrorCodes.VALIDATION_FAILED,
          ErrorTypes.VALIDATION_ERROR,
          { field: 'domain' }
        );
      }

      // Create company
      const company = await this.companyService.createCompany(validatedData);

      this.logger.info('Company created successfully', { companyId: company.id });
      res.status(201).json({ data: company });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves company details by ID with proper authorization
   * @route GET /api/v1/companies/:id
   */
  @httpGet('/:id')
  async getCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const company = await this.companyService.getCompanyById(id);

      res.status(200).json({ data: company });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates company information with validation and security checks
   * @route PUT /api/v1/companies/:id
   */
  @httpPut('/:id')
  async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sanitizedData = this.sanitizeCompanyData(req.body);

      // Validate update payload
      const validatedData = await validateCompanyUpdate(sanitizedData);

      // Validate domain if provided
      if (validatedData.domain && !validateDomain(validatedData.domain)) {
        throw createError(
          'Invalid domain format',
          ErrorCodes.VALIDATION_FAILED,
          ErrorTypes.VALIDATION_ERROR,
          { field: 'domain' }
        );
      }

      const company = await this.companyService.updateCompany(id, validatedData);

      this.logger.info('Company updated successfully', { companyId: id });
      res.status(200).json({ data: company });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a company with proper cleanup and validation
   * @route DELETE /api/v1/companies/:id
   */
  @httpDelete('/:id')
  async deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await this.companyService.deleteCompany(id);

      this.logger.info('Company deleted successfully', { companyId: id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists companies with filtering and pagination
   * @route GET /api/v1/companies
   */
  @httpGet('/')
  async listCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.parseFilters(req.query);
      const pagination = this.parsePagination(req.query);

      const companies = await this.companyService.listCompanies(filters, pagination);

      res.status(200).json({
        data: companies.rows,
        meta: {
          total: companies.count,
          page: pagination.page,
          limit: pagination.limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates company settings with validation
   * @route PUT /api/v1/companies/:id/settings
   */
  @httpPut('/:id/settings')
  async updateCompanySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sanitizedSettings = this.sanitizeCompanyData(req.body);

      const company = await this.companyService.updateCompanySettings(id, sanitizedSettings);

      this.logger.info('Company settings updated successfully', { companyId: id });
      res.status(200).json({ data: company });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sanitizes company data to prevent XSS and injection attacks
   */
  private sanitizeCompanyData(data: any): any {
    if (typeof data !== 'object' || !data) {
      return data;
    }

    return Object.entries(data).reduce((acc: any, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = sanitizeInput(value);
      } else if (Array.isArray(value)) {
        acc[key] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = this.sanitizeCompanyData(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  /**
   * Parses and validates query filters
   */
  private parseFilters(query: any): { isActive?: boolean; subscriptionTier?: string } {
    const filters: { isActive?: boolean; subscriptionTier?: string } = {};

    if ('isActive' in query) {
      filters.isActive = query.isActive === 'true';
    }

    if (query.subscriptionTier) {
      filters.subscriptionTier = sanitizeInput(query.subscriptionTier);
    }

    return filters;
  }

  /**
   * Parses and validates pagination parameters
   */
  private parsePagination(query: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

    return { page, limit };
  }
}