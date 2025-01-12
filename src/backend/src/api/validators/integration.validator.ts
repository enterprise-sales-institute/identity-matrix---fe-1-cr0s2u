/**
 * @file Integration validator module for Identity Matrix platform
 * @version 1.0.0
 * 
 * Implements comprehensive validation for CRM integration requests with
 * enhanced security measures and data sanitization.
 */

import { object, string, number, array, boolean } from 'yup'; // v1.0.0
import { CRM_TYPES, INTEGRATION_STATUS, SYNC_INTERVALS } from '../../constants/integration.constants';
import { 
  IIntegrationCreate, 
  IIntegrationUpdate, 
  IIntegrationCredentials, 
  IIntegrationConfig 
} from '../../interfaces/integration.interface';
import { validateSchema, sanitizeInput } from '../../utils/validation.util';

// Validation error messages
const REQUIRED_FIELD_MESSAGE = 'This field is required';
const INVALID_CRM_TYPE_MESSAGE = 'Invalid CRM type';
const INVALID_STATUS_MESSAGE = 'Invalid integration status';
const INVALID_WEBHOOK_URL = 'Invalid webhook URL format or not in allowlist';
const INVALID_OAUTH_FORMAT = 'Invalid OAuth2 credentials format';
const INVALID_SYNC_INTERVAL = 'Invalid synchronization interval';
const INVALID_FIELD_MAPPING = 'Invalid field mapping configuration';

// Allowed webhook domains for security
const ALLOWED_WEBHOOK_DOMAINS = [
  'api.salesforce.com',
  'api.hubspot.com',
  'api.pipedrive.com',
  'api.zoho.com'
];

/**
 * Schema for OAuth2 credentials validation with enhanced security checks
 */
const credentialsSchema = object({
  clientId: string().required(REQUIRED_FIELD_MESSAGE).min(10),
  clientSecret: string().required(REQUIRED_FIELD_MESSAGE).min(20),
  accessToken: string().required(REQUIRED_FIELD_MESSAGE),
  refreshToken: string().required(REQUIRED_FIELD_MESSAGE),
  tokenExpiry: string().required(REQUIRED_FIELD_MESSAGE).matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
  scope: array().of(string()).required(REQUIRED_FIELD_MESSAGE),
  instanceUrl: string().required(REQUIRED_FIELD_MESSAGE).url()
});

/**
 * Schema for field mapping validation with data transformation rules
 */
const fieldMappingSchema = object({
  sourceField: string().required(REQUIRED_FIELD_MESSAGE),
  targetField: string().required(REQUIRED_FIELD_MESSAGE),
  transformFunction: string().optional(),
  required: boolean().required(REQUIRED_FIELD_MESSAGE),
  validation: object().optional()
});

/**
 * Schema for integration configuration with comprehensive validation
 */
const configSchema = object({
  syncInterval: number()
    .required(REQUIRED_FIELD_MESSAGE)
    .oneOf(Object.values(SYNC_INTERVALS), INVALID_SYNC_INTERVAL),
  fieldMappings: array()
    .of(fieldMappingSchema)
    .required(REQUIRED_FIELD_MESSAGE)
    .min(1, 'At least one field mapping is required'),
  webhookUrl: string()
    .url()
    .test('webhook-domain', INVALID_WEBHOOK_URL, (value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return ALLOWED_WEBHOOK_DOMAINS.includes(url.hostname);
      } catch {
        return false;
      }
    })
    .optional(),
  webhookSecret: string().when('webhookUrl', {
    is: (val: string) => !!val,
    then: string().required('Webhook secret is required when webhook URL is provided'),
    otherwise: string().optional()
  }),
  customSettings: object().default({}),
  retryPolicy: object({
    maxAttempts: number().required().min(1).max(10),
    backoffInterval: number().required().min(1000),
    timeoutMs: number().required().min(5000)
  }).required()
});

/**
 * Schema for integration creation with strict validation and security measures
 */
export const integrationCreateSchema = object({
  companyId: string()
    .required(REQUIRED_FIELD_MESSAGE)
    .uuid('Invalid company ID format'),
  type: string()
    .required(REQUIRED_FIELD_MESSAGE)
    .oneOf(Object.values(CRM_TYPES), INVALID_CRM_TYPE_MESSAGE),
  credentials: credentialsSchema.required(),
  config: configSchema.required()
});

/**
 * Schema for integration updates with partial field validation
 */
export const integrationUpdateSchema = object({
  credentials: credentialsSchema.optional(),
  config: configSchema.optional(),
  status: string()
    .optional()
    .oneOf(Object.values(INTEGRATION_STATUS), INVALID_STATUS_MESSAGE),
  webhookUrl: string().url().optional(),
  fieldMapping: array().of(fieldMappingSchema).optional(),
  version: string().optional()
});

/**
 * Validates and sanitizes integration creation request data
 * @param data Integration creation request data
 * @returns Validated and sanitized integration data
 */
export async function validateIntegrationCreate(data: any): Promise<IIntegrationCreate> {
  // Sanitize input data
  const sanitizedData = sanitizeInput(data);

  // Validate against schema
  const validatedData = await validateSchema(integrationCreateSchema, sanitizedData);

  // Additional security checks for OAuth credentials
  if (validatedData.credentials) {
    validateOAuthCredentials(validatedData.credentials);
  }

  // Validate webhook configuration if present
  if (validatedData.config?.webhookUrl) {
    validateWebhookConfig(validatedData.config);
  }

  return validatedData as IIntegrationCreate;
}

/**
 * Validates and sanitizes integration update request data
 * @param data Integration update request data
 * @returns Validated and sanitized update data
 */
export async function validateIntegrationUpdate(data: any): Promise<IIntegrationUpdate> {
  // Sanitize input data
  const sanitizedData = sanitizeInput(data);

  // Validate against schema
  const validatedData = await validateSchema(integrationUpdateSchema, sanitizedData);

  // Validate credentials if included in update
  if (validatedData.credentials) {
    validateOAuthCredentials(validatedData.credentials);
  }

  // Validate webhook changes if included
  if (validatedData.config?.webhookUrl) {
    validateWebhookConfig(validatedData.config);
  }

  return validatedData as IIntegrationUpdate;
}

/**
 * Validates OAuth2 credentials format and security requirements
 */
function validateOAuthCredentials(credentials: Partial<IIntegrationCredentials>): void {
  // Validate token format
  if (credentials.accessToken && !/^[a-zA-Z0-9._-]+$/.test(credentials.accessToken)) {
    throw new Error('Invalid access token format');
  }

  // Validate refresh token format
  if (credentials.refreshToken && !/^[a-zA-Z0-9._-]+$/.test(credentials.refreshToken)) {
    throw new Error('Invalid refresh token format');
  }

  // Validate instance URL security
  if (credentials.instanceUrl) {
    const url = new URL(credentials.instanceUrl);
    if (!url.protocol.startsWith('https')) {
      throw new Error('Instance URL must use HTTPS protocol');
    }
  }
}

/**
 * Validates webhook configuration security requirements
 */
function validateWebhookConfig(config: Partial<IIntegrationConfig>): void {
  if (!config.webhookUrl) return;

  const url = new URL(config.webhookUrl);
  
  // Enforce HTTPS
  if (url.protocol !== 'https:') {
    throw new Error('Webhook URL must use HTTPS protocol');
  }

  // Validate against allowed domains
  if (!ALLOWED_WEBHOOK_DOMAINS.includes(url.hostname)) {
    throw new Error('Webhook domain not in allowlist');
  }

  // Validate webhook secret strength
  if (config.webhookSecret && config.webhookSecret.length < 32) {
    throw new Error('Webhook secret must be at least 32 characters long');
  }
}