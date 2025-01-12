/**
 * Enum representing supported CRM platform types
 * @version 1.0.0
 */
export enum IntegrationType {
    SALESFORCE = 'SALESFORCE',
    HUBSPOT = 'HUBSPOT',
    PIPEDRIVE = 'PIPEDRIVE',
    ZOHO = 'ZOHO'
}

/**
 * Enum representing integration connection status
 * @version 1.0.0
 */
export enum IntegrationStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING',
    ERROR = 'ERROR'
}

/**
 * Interface for OAuth2 credentials used in CRM integrations
 * @version 1.0.0
 */
export interface IntegrationCredentials {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    tokenExpiry: Date;
}

/**
 * Interface defining field mapping configuration between Identity Matrix and CRM
 * @version 1.0.0
 */
export interface FieldMapping {
    sourceField: string;
    targetField: string;
    transformFunction?: string;
}

/**
 * Interface for integration configuration settings
 * @version 1.0.0
 */
export interface IntegrationConfig {
    syncInterval: number;
    fieldMappings: FieldMapping[];
    webhookUrl?: string;
    customSettings: Record<string, any>;
}

/**
 * Main integration interface representing a CRM integration instance
 * @version 1.0.0
 */
export interface Integration {
    id: string;
    companyId: string;
    type: IntegrationType;
    credentials: IntegrationCredentials;
    config: IntegrationConfig;
    status: IntegrationStatus;
    lastSyncAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Interface for creating a new integration
 * @version 1.0.0
 */
export interface IntegrationCreatePayload {
    companyId: string;
    type: IntegrationType;
    credentials: IntegrationCredentials;
    config: IntegrationConfig;
}

/**
 * Interface for updating an existing integration
 * @version 1.0.0
 */
export interface IntegrationUpdatePayload {
    credentials?: Partial<IntegrationCredentials>;
    config?: Partial<IntegrationConfig>;
    status: IntegrationStatus;
}