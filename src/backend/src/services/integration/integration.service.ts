/**
 * @fileoverview Integration Service implementation for Identity Matrix platform
 * Manages CRM integration lifecycle with enhanced security, monitoring, and reliability
 * @version 1.0.0
 */

import { injectable, inject } from 'tsyringe'; // ^4.8.x
import { Logger } from 'winston'; // ^3.9.x
import { CircuitBreaker } from 'opossum'; // ^6.0.x
import { MetricsCollector } from '@opentelemetry/metrics'; // ^1.0.x

// Internal imports
import { 
  IIntegration, 
  IIntegrationCreate, 
  IIntegrationUpdate 
} from '../../interfaces/integration.interface';
import { CRMService } from './crm.service';
import { IntegrationRepository } from '../../db/repositories/integration.repository';
import { INTEGRATION_STATUS } from '../../constants/integration.constants';

@injectable()
export class IntegrationService {
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    @inject('Logger') private readonly logger: Logger,
    @inject('IntegrationRepository') private readonly integrationRepository: IntegrationRepository,
    @inject('CRMService') private readonly crmService: CRMService,
    @inject('CircuitBreaker') private readonly circuitBreakerFactory: any,
    @inject('MetricsCollector') private readonly metricsCollector: MetricsCollector
  ) {
    this.circuitBreaker = this.initializeCircuitBreaker();
  }

  /**
   * Initializes circuit breaker for integration operations
   */
  private initializeCircuitBreaker(): CircuitBreaker {
    return this.circuitBreakerFactory.create({
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      name: 'integration-service'
    });
  }

  /**
   * Creates a new CRM integration with enhanced security and monitoring
   * @param data Integration creation data
   * @returns Created integration record
   */
  public async createIntegration(data: IIntegrationCreate): Promise<IIntegration> {
    const startTime = Date.now();
    this.logger.info('Creating new integration', { 
      companyId: data.companyId, 
      type: data.type 
    });

    try {
      // Validate credentials with CRM platform
      const validatedCredentials = await this.crmService.connectCRM(
        data.type,
        data.credentials
      );

      // Create integration record with validated credentials
      const integration = await this.integrationRepository.create({
        ...data,
        credentials: validatedCredentials
      });

      this.metricsCollector.record({
        name: 'integration.create.success',
        value: Date.now() - startTime,
        attributes: { type: data.type }
      });

      return integration;
    } catch (error) {
      this.metricsCollector.record({
        name: 'integration.create.error',
        value: 1,
        attributes: { type: data.type, error: error.message }
      });
      
      this.logger.error('Integration creation failed', {
        error: error.message,
        companyId: data.companyId,
        type: data.type
      });
      
      throw error;
    }
  }

  /**
   * Updates an existing integration with security checks
   * @param id Integration ID
   * @param data Update data
   * @param companyId Company ID for security validation
   * @returns Updated integration record
   */
  public async updateIntegration(
    id: string,
    data: IIntegrationUpdate,
    companyId: string
  ): Promise<IIntegration> {
    const startTime = Date.now();
    this.logger.info('Updating integration', { id, companyId });

    try {
      // Validate existing integration
      const existing = await this.integrationRepository.findById(id, companyId);
      if (!existing) {
        throw new Error('Integration not found');
      }

      // If credentials are being updated, validate with CRM
      if (data.credentials) {
        const validatedCredentials = await this.crmService.connectCRM(
          existing.type,
          {
            ...existing.credentials,
            ...data.credentials
          }
        );
        data.credentials = validatedCredentials;
      }

      // Update integration record
      const updated = await this.integrationRepository.update(
        id,
        data,
        companyId
      );

      this.metricsCollector.record({
        name: 'integration.update.success',
        value: Date.now() - startTime,
        attributes: { type: existing.type }
      });

      return updated;
    } catch (error) {
      this.metricsCollector.record({
        name: 'integration.update.error',
        value: 1,
        attributes: { id, error: error.message }
      });
      
      this.logger.error('Integration update failed', {
        error: error.message,
        id,
        companyId
      });
      
      throw error;
    }
  }

  /**
   * Retrieves integration details with security validation
   * @param id Integration ID
   * @param companyId Company ID for security validation
   * @returns Integration record
   */
  public async getIntegration(id: string, companyId: string): Promise<IIntegration> {
    this.logger.info('Retrieving integration', { id, companyId });
    
    const integration = await this.integrationRepository.findById(id, companyId);
    if (!integration) {
      throw new Error('Integration not found');
    }
    
    return integration;
  }

  /**
   * Retrieves all integrations for a company
   * @param companyId Company ID
   * @returns List of integrations
   */
  public async getCompanyIntegrations(companyId: string): Promise<IIntegration[]> {
    this.logger.info('Retrieving company integrations', { companyId });
    return this.integrationRepository.findByCompany(companyId);
  }

  /**
   * Synchronizes integration data with CRM platform
   * @param id Integration ID
   * @param companyId Company ID for security validation
   * @returns Sync result
   */
  public async syncIntegration(id: string, companyId: string): Promise<void> {
    const startTime = Date.now();
    this.logger.info('Starting integration sync', { id, companyId });

    try {
      const integration = await this.integrationRepository.findById(id, companyId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      await this.circuitBreaker.fire(async () => {
        const syncResult = await this.crmService.syncData(
          integration.type,
          integration.credentials,
          integration.config.fieldMappings
        );

        await this.integrationRepository.update(
          id,
          {
            status: INTEGRATION_STATUS.ACTIVE,
            lastSyncAt: new Date()
          },
          companyId
        );

        this.metricsCollector.record({
          name: 'integration.sync.success',
          value: Date.now() - startTime,
          attributes: { 
            type: integration.type,
            recordsProcessed: syncResult.success + syncResult.failed
          }
        });
      });
    } catch (error) {
      this.metricsCollector.record({
        name: 'integration.sync.error',
        value: 1,
        attributes: { id, error: error.message }
      });
      
      this.logger.error('Integration sync failed', {
        error: error.message,
        id,
        companyId
      });

      await this.integrationRepository.updateStatus(
        id,
        INTEGRATION_STATUS.ERROR,
        companyId
      );
      
      throw error;
    }
  }

  /**
   * Processes pending synchronizations for all active integrations
   * @param companyId Optional company ID filter
   */
  public async processPendingSync(companyId?: string): Promise<void> {
    this.logger.info('Processing pending syncs', { companyId });
    
    const pendingIntegrations = await this.integrationRepository.findPendingSync(companyId);
    
    for (const integration of pendingIntegrations) {
      try {
        await this.syncIntegration(integration.id, integration.companyId);
      } catch (error) {
        this.logger.error('Failed to process pending sync', {
          error: error.message,
          integrationId: integration.id,
          companyId: integration.companyId
        });
      }
    }
  }
}