/**
 * @fileoverview Integration Controller for Identity Matrix platform
 * Handles CRM integration HTTP endpoints with enhanced security and monitoring
 * @version 1.0.0
 */

import { injectable, inject } from 'tsyringe'; // ^4.8.x
import { Request, Response } from 'express'; // ^4.18.x
import { Logger } from 'winston'; // ^3.8.x
import { RateLimiter } from 'express-rate-limit'; // ^6.7.x

// Internal imports
import { IntegrationService } from '../../services/integration/integration.service';
import { validateIntegrationCreate, validateIntegrationUpdate } from '../validators/integration.validator';
import { createError, formatError } from '../../utils/error.util';
import { ErrorTypes, ErrorCodes } from '../../constants/error.constants';

@injectable()
export class IntegrationController {
  constructor(
    @inject('IntegrationService') private readonly integrationService: IntegrationService,
    @inject('Logger') private readonly logger: Logger,
    @inject('RateLimiter') private readonly rateLimiter: RateLimiter
  ) {}

  /**
   * Creates a new CRM integration with enhanced security and validation
   */
  public async createIntegration(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || '';

    try {
      // Apply rate limiting
      await this.rateLimiter.consume(req.ip);

      // Log incoming request
      this.logger.info('Creating new integration', {
        requestId,
        companyId: req.body.companyId,
        type: req.body.type
      });

      // Validate request data
      const validatedData = await validateIntegrationCreate(req.body);

      // Create integration
      const integration = await this.integrationService.createIntegration(validatedData);

      // Log success
      this.logger.info('Integration created successfully', {
        requestId,
        integrationId: integration.id,
        duration: Date.now() - startTime
      });

      return res.status(201).json({
        success: true,
        data: integration
      });
    } catch (error: any) {
      // Log error
      this.logger.error('Integration creation failed', {
        requestId,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      const formattedError = formatError(error);
      return res.status(formattedError.code).json(formattedError);
    }
  }

  /**
   * Updates an existing integration with security validation
   */
  public async updateIntegration(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || '';
    const { id } = req.params;
    const companyId = req.user?.companyId;

    try {
      // Apply rate limiting
      await this.rateLimiter.consume(req.ip);

      // Validate company access
      if (!companyId) {
        throw createError(
          'Company ID not found in request',
          ErrorCodes.UNAUTHORIZED,
          ErrorTypes.AUTHENTICATION_ERROR
        );
      }

      // Log incoming request
      this.logger.info('Updating integration', {
        requestId,
        integrationId: id,
        companyId
      });

      // Validate request data
      const validatedData = await validateIntegrationUpdate(req.body);

      // Update integration
      const integration = await this.integrationService.updateIntegration(
        id,
        validatedData,
        companyId
      );

      // Log success
      this.logger.info('Integration updated successfully', {
        requestId,
        integrationId: id,
        duration: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        data: integration
      });
    } catch (error: any) {
      this.logger.error('Integration update failed', {
        requestId,
        integrationId: id,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      const formattedError = formatError(error);
      return res.status(formattedError.code).json(formattedError);
    }
  }

  /**
   * Retrieves integration details with security validation
   */
  public async getIntegration(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || '';
    const { id } = req.params;
    const companyId = req.user?.companyId;

    try {
      // Apply rate limiting
      await this.rateLimiter.consume(req.ip);

      // Validate company access
      if (!companyId) {
        throw createError(
          'Company ID not found in request',
          ErrorCodes.UNAUTHORIZED,
          ErrorTypes.AUTHENTICATION_ERROR
        );
      }

      // Log request
      this.logger.info('Retrieving integration', {
        requestId,
        integrationId: id,
        companyId
      });

      // Get integration
      const integration = await this.integrationService.getIntegration(id, companyId);

      // Log success
      this.logger.info('Integration retrieved successfully', {
        requestId,
        integrationId: id,
        duration: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        data: integration
      });
    } catch (error: any) {
      this.logger.error('Integration retrieval failed', {
        requestId,
        integrationId: id,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      const formattedError = formatError(error);
      return res.status(formattedError.code).json(formattedError);
    }
  }

  /**
   * Retrieves all integrations for a company
   */
  public async getCompanyIntegrations(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || '';
    const companyId = req.user?.companyId;

    try {
      // Apply rate limiting
      await this.rateLimiter.consume(req.ip);

      // Validate company access
      if (!companyId) {
        throw createError(
          'Company ID not found in request',
          ErrorCodes.UNAUTHORIZED,
          ErrorTypes.AUTHENTICATION_ERROR
        );
      }

      // Log request
      this.logger.info('Retrieving company integrations', {
        requestId,
        companyId
      });

      // Get integrations
      const integrations = await this.integrationService.getCompanyIntegrations(companyId);

      // Log success
      this.logger.info('Company integrations retrieved successfully', {
        requestId,
        companyId,
        count: integrations.length,
        duration: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        data: integrations
      });
    } catch (error: any) {
      this.logger.error('Company integrations retrieval failed', {
        requestId,
        companyId,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      const formattedError = formatError(error);
      return res.status(formattedError.code).json(formattedError);
    }
  }

  /**
   * Triggers synchronization for an integration
   */
  public async syncIntegration(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || '';
    const { id } = req.params;
    const companyId = req.user?.companyId;

    try {
      // Apply rate limiting
      await this.rateLimiter.consume(req.ip);

      // Validate company access
      if (!companyId) {
        throw createError(
          'Company ID not found in request',
          ErrorCodes.UNAUTHORIZED,
          ErrorTypes.AUTHENTICATION_ERROR
        );
      }

      // Log sync request
      this.logger.info('Starting integration sync', {
        requestId,
        integrationId: id,
        companyId
      });

      // Trigger sync
      await this.integrationService.syncIntegration(id, companyId);

      // Log success
      this.logger.info('Integration sync completed successfully', {
        requestId,
        integrationId: id,
        duration: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        message: 'Synchronization completed successfully'
      });
    } catch (error: any) {
      this.logger.error('Integration sync failed', {
        requestId,
        integrationId: id,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      const formattedError = formatError(error);
      return res.status(formattedError.code).json(formattedError);
    }
  }
}