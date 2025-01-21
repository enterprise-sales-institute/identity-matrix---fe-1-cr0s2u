/**
 * Integration Service for Identity Matrix web application
 * @version 1.0.0
 * @description Handles CRM integration operations with secure credential management and real-time sync
 */

// External imports
import { AxiosResponse } from 'axios'; // axios@1.x

// Internal imports
import ApiService from './api.service';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  Integration,
  IntegrationType,
  IntegrationStatus,
  IntegrationCreatePayload,
  IntegrationUpdatePayload,
  IntegrationConfig,
  FieldMapping
} from '../types/integration.types';

/**
 * Interface for sync operation options
 */
interface SyncOptions {
  force?: boolean;
  fields?: string[];
  batchSize?: number;
}

/**
 * Interface for sync operation result
 */
interface SyncResult {
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  errors?: Array<{ record: string; error: string }>;
  timestamp: Date;
}

/**
 * Service class for managing CRM integrations with comprehensive error handling
 */
export class IntegrationService {
  private readonly apiInstance = ApiService.instance;
  private readonly syncStatus: Map<string, IntegrationStatus>;
  private readonly cache: Map<string, { data: Integration[]; timestamp: number }>;
  private readonly CACHE_DURATION = 300000; // 5 minutes

  constructor() {
    this.syncStatus = new Map();
    this.cache = new Map();
  }

  /**
   * Retrieves all integrations for a company with caching
   */
  public async getIntegrations(companyId: string, forceRefresh: boolean = false): Promise<Integration[]> {
    const cacheKey = `integrations_${companyId}`;
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response: AxiosResponse<Integration[]> = await this.apiInstance.get(
        `${API_ENDPOINTS.INTEGRATIONS.BASE}?companyId=${companyId}`
      );

      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      throw error;
    }
  }

  /**
   * Retrieves a single integration by ID
   */
  public async getIntegrationById(integrationId: string): Promise<Integration> {
    try {
      const response: AxiosResponse<Integration> = await this.apiInstance.get(
        API_ENDPOINTS.INTEGRATIONS.BY_ID.replace(':id', integrationId)
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch integration:', error);
      throw error;
    }
  }

  /**
   * Creates a new CRM integration
   */
  public async createIntegration(payload: IntegrationCreatePayload): Promise<Integration> {
    try {
      const response: AxiosResponse<Integration> = await this.apiInstance.post(
        API_ENDPOINTS.INTEGRATIONS.BASE,
        payload
      );
      this.invalidateCache(payload.companyId);
      return response.data;
    } catch (error) {
      console.error('Failed to create integration:', error);
      throw error;
    }
  }

  /**
   * Updates an existing integration configuration
   */
  public async updateIntegration(
    integrationId: string,
    payload: IntegrationUpdatePayload
  ): Promise<Integration> {
    try {
      const response: AxiosResponse<Integration> = await this.apiInstance.put(
        `${API_ENDPOINTS.INTEGRATIONS.BY_ID.replace(':id', integrationId)}`,
        payload
      );
      this.invalidateCache(response.data.companyId);
      return response.data;
    } catch (error) {
      console.error('Failed to update integration:', error);
      throw error;
    }
  }

  /**
   * Deletes an integration by ID
   */
  public async deleteIntegration(integrationId: string): Promise<void> {
    try {
      await this.apiInstance.delete(
        API_ENDPOINTS.INTEGRATIONS.BY_ID.replace(':id', integrationId)
      );
    } catch (error) {
      console.error('Failed to delete integration:', error);
      throw error;
    }
  }

  /**
   * Tests integration connectivity with enhanced error handling
   */
  public async testIntegrationConnection(integrationId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ success: boolean }> = await this.apiInstance.post(
        `${API_ENDPOINTS.INTEGRATIONS.CONNECT}/${integrationId}/test`
      );
      return response.data.success;
    } catch (error) {
      console.error('Integration connection test failed:', error);
      throw error;
    }
  }

  /**
   * Triggers manual sync for an integration with progress tracking
   */
  public async syncIntegration(
    integrationId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    try {
      if (this.syncStatus.get(integrationId) === IntegrationStatus.PENDING) {
        throw new Error('Sync already in progress');
      }

      this.syncStatus.set(integrationId, IntegrationStatus.PENDING);

      const response: AxiosResponse<SyncResult> = await this.apiInstance.post(
        `${API_ENDPOINTS.INTEGRATIONS.SYNC.replace(':id', integrationId)}`,
        options
      );

      this.syncStatus.set(integrationId, IntegrationStatus.ACTIVE);
      return response.data;
    } catch (error) {
      this.syncStatus.set(integrationId, IntegrationStatus.ERROR);
      console.error('Integration sync failed:', error);
      throw error;
    }
  }

  /**
   * Retries a failed operation with exponential backoff
   */
  public async retryOperation(integrationId: string, operationType: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ success: boolean }> = await this.apiInstance.post(
        `${API_ENDPOINTS.INTEGRATIONS.BY_ID.replace(':id', integrationId)}/retry`,
        { operationType }
      );
      return response.data.success;
    } catch (error) {
      console.error('Retry operation failed:', error);
      throw error;
    }
  }

  /**
   * Verifies integration connection and credentials
   */
  public async verifyIntegration(integrationId: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ valid: boolean }> = await this.apiInstance.post(
        `${API_ENDPOINTS.INTEGRATIONS.VERIFY.replace(':id', integrationId)}`
      );
      return response.data.valid;
    } catch (error) {
      console.error('Integration verification failed:', error);
      throw error;
    }
  }

  /**
   * Retrieves available field mappings for an integration
   */
  public async getFieldMappings(integrationId: string): Promise<FieldMapping[]> {
    try {
      const response: AxiosResponse<FieldMapping[]> = await this.apiInstance.get(
        `${API_ENDPOINTS.INTEGRATIONS.FIELDS.replace(':id', integrationId)}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch field mappings:', error);
      throw error;
    }
  }

  /**
   * Updates field mappings for an integration
   */
  public async updateFieldMappings(
    integrationId: string,
    mappings: FieldMapping[]
  ): Promise<IntegrationConfig> {
    try {
      const response: AxiosResponse<IntegrationConfig> = await this.apiInstance.put(
        `${API_ENDPOINTS.INTEGRATIONS.MAPPING.replace(':id', integrationId)}`,
        { fieldMappings: mappings }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update field mappings:', error);
      throw error;
    }
  }

  /**
   * Retrieves available CRM providers
   */
  public async getProviders(): Promise<IntegrationType[]> {
    try {
      const response: AxiosResponse<IntegrationType[]> = await this.apiInstance.get(
        API_ENDPOINTS.INTEGRATIONS.PROVIDERS
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      throw error;
    }
  }

  /**
   * Invalidates the cache for a company's integrations
   */
  private invalidateCache(companyId: string): void {
    const cacheKey = `integrations_${companyId}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Gets the current sync status for an integration
   */
  public getSyncStatus(integrationId: string): IntegrationStatus {
    return this.syncStatus.get(integrationId) || IntegrationStatus.INACTIVE;
  }
}

// Export singleton instance
export default new IntegrationService();