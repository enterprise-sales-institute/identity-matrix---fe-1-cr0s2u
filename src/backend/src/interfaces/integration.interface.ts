/**
 * @fileoverview TypeScript interfaces for CRM integration functionality
 * Defines interfaces for integration configuration, credentials, mapping and sync status
 * @version 1.0.0
 */

// External imports
import { UUID } from 'crypto'; // v20.0.0+

// Internal imports
import { CRM_TYPES, INTEGRATION_STATUS, SYNC_INTERVALS } from '../constants/integration.constants';
import { ICompany } from './company.interface';

/**
 * Interface defining OAuth2 credentials structure for CRM integrations
 * with comprehensive security features and token management
 */
export interface IIntegrationCredentials {
  /** OAuth client identifier */
  clientId: string;

  /** OAuth client secret */
  clientSecret: string;

  /** Current access token */
  accessToken: string;

  /** Refresh token for token renewal */
  refreshToken: string;

  /** Token expiration timestamp */
  tokenExpiry: Date;

  /** OAuth scopes granted */
  scope: string[];

  /** CRM instance URL */
  instanceUrl: string;
}

/**
 * Interface defining field mapping configuration between systems
 * with validation and transformation capabilities
 */
export interface IFieldMapping {
  /** Source field name */
  sourceField: string;

  /** Target field name in CRM */
  targetField: string;

  /** Optional transformation function name */
  transformFunction?: string;

  /** Whether field is required */
  required: boolean;

  /** Field-level validation rules */
  validation: Record<string, any>;
}

/**
 * Interface defining comprehensive integration configuration
 * with advanced options for sync behavior and webhooks
 */
export interface IIntegrationConfig {
  /** Synchronization interval */
  syncInterval: SYNC_INTERVALS;

  /** Field mappings configuration */
  fieldMappings: IFieldMapping[];

  /** Optional webhook URL for real-time updates */
  webhookUrl?: string;

  /** Webhook secret for signature verification */
  webhookSecret?: string;

  /** Custom integration-specific settings */
  customSettings: Record<string, any>;

  /** Retry configuration for failed operations */
  retryPolicy: {
    maxAttempts: number;
    backoffInterval: number;
    timeoutMs: number;
  };
}

/**
 * Main integration interface defining complete integration entity
 * with comprehensive error handling and tracking
 */
export interface IIntegration {
  /** Unique integration identifier */
  id: UUID;

  /** Associated company identifier */
  companyId: UUID;

  /** CRM platform type */
  type: CRM_TYPES;

  /** OAuth credentials */
  credentials: IIntegrationCredentials;

  /** Integration configuration */
  config: IIntegrationConfig;

  /** Current integration status */
  status: INTEGRATION_STATUS;

  /** Last successful sync timestamp */
  lastSyncAt: Date;

  /** Last error timestamp */
  lastErrorAt?: Date;

  /** Detailed error information */
  errorDetails?: {
    code: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
  };

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Interface for integration creation with required fields
 */
export interface IIntegrationCreate {
  /** Associated company identifier */
  companyId: UUID;

  /** CRM platform type */
  type: CRM_TYPES;

  /** OAuth credentials */
  credentials: IIntegrationCredentials;

  /** Integration configuration */
  config: IIntegrationConfig;
}

/**
 * Interface for integration updates with partial fields
 */
export interface IIntegrationUpdate {
  /** Updated credentials */
  credentials?: Partial<IIntegrationCredentials>;

  /** Updated configuration */
  config?: Partial<IIntegrationConfig>;

  /** Updated status */
  status?: INTEGRATION_STATUS;
}