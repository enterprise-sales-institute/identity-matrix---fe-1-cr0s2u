/**
 * @fileoverview Company validation schemas and functions for Identity Matrix platform
 * @version 1.0.0
 * 
 * Implements comprehensive validation for company-related operations with
 * enhanced security controls and data integrity checks.
 */

import { object, string, array, boolean, mixed } from 'yup'; // v1.0.0
import { 
  ICompany, 
  ICompanyCreate, 
  ICompanyUpdate, 
  ICompanySettings 
} from '../../interfaces/company.interface';
import { validateSchema } from '../../utils/validation.util';
import { ErrorCodes, ErrorTypes } from '../../constants/error.constants';

// Validation constants
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const SUBSCRIPTION_TIERS = ['free', 'pro', 'enterprise'] as const;
const MAX_COMPANY_NAME_LENGTH = 100;
const MIN_COMPANY_NAME_LENGTH = 2;

/**
 * Validation schema for company settings
 */
const companySettingsSchema = object({
  emailNotifications: boolean()
    .required('Email notifications setting is required'),

  allowedDomains: array()
    .of(string().matches(DOMAIN_REGEX, 'Invalid domain format'))
    .required('Allowed domains must be specified'),

  integrationConfig: object({
    enabled: boolean().required('Integration enabled flag is required'),
    allowedIntegrations: array()
      .of(string())
      .required('Allowed integrations must be specified'),
    integrationSettings: object()
      .default({})
  }).required('Integration configuration is required'),

  visitorTrackingSettings: object({
    enabled: boolean().required('Visitor tracking enabled flag is required'),
    retentionDays: mixed()
      .test('retention-days', 'Retention days must be between 1 and 365', 
        (value) => typeof value === 'number' && value >= 1 && value <= 365)
      .required('Retention days must be specified'),
    excludedPaths: array()
      .of(string())
      .required('Excluded paths must be specified'),
    captureIPAddress: boolean()
      .required('IP address capture setting is required')
  }).required('Visitor tracking settings are required'),

  timezone: string()
    .required('Timezone must be specified'),

  securitySettings: object({
    enforceIPRestrictions: boolean()
      .required('IP restrictions enforcement setting is required'),
    allowedIPs: array()
      .of(string().matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address format'))
      .required('Allowed IPs must be specified'),
    requireMFA: boolean()
      .required('MFA requirement setting is required')
  }).required('Security settings are required')
}).required('Company settings are required');

/**
 * Validation schema for company creation
 */
export const companyCreateSchema = object({
  name: string()
    .min(MIN_COMPANY_NAME_LENGTH, `Company name must be at least ${MIN_COMPANY_NAME_LENGTH} characters`)
    .max(MAX_COMPANY_NAME_LENGTH, `Company name cannot exceed ${MAX_COMPANY_NAME_LENGTH} characters`)
    .matches(/^[a-zA-Z0-9\s\-_.]+$/, 'Company name contains invalid characters')
    .required('Company name is required'),

  domain: string()
    .matches(DOMAIN_REGEX, 'Invalid domain format')
    .required('Company domain is required'),

  subscriptionTier: string()
    .oneOf(SUBSCRIPTION_TIERS, `Subscription tier must be one of: ${SUBSCRIPTION_TIERS.join(', ')}`)
    .required('Subscription tier is required'),

  settings: companySettingsSchema,

  billingEmail: string()
    .email('Invalid billing email format')
    .required('Billing email is required'),

  technicalContacts: array()
    .of(string().email('Invalid technical contact email format'))
    .min(1, 'At least one technical contact is required')
    .required('Technical contacts are required')
}).required();

/**
 * Validation schema for company updates
 */
export const companyUpdateSchema = object({
  name: string()
    .min(MIN_COMPANY_NAME_LENGTH, `Company name must be at least ${MIN_COMPANY_NAME_LENGTH} characters`)
    .max(MAX_COMPANY_NAME_LENGTH, `Company name cannot exceed ${MAX_COMPANY_NAME_LENGTH} characters`)
    .matches(/^[a-zA-Z0-9\s\-_.]+$/, 'Company name contains invalid characters')
    .optional(),

  domain: string()
    .matches(DOMAIN_REGEX, 'Invalid domain format')
    .optional(),

  subscriptionTier: string()
    .oneOf(SUBSCRIPTION_TIERS, `Subscription tier must be one of: ${SUBSCRIPTION_TIERS.join(', ')}`)
    .optional(),

  settings: companySettingsSchema.partial().optional(),

  isActive: boolean().optional(),

  billingEmail: string()
    .email('Invalid billing email format')
    .optional(),

  technicalContacts: array()
    .of(string().email('Invalid technical contact email format'))
    .min(1, 'At least one technical contact is required')
    .optional()
});

/**
 * Validates company creation data with enhanced security checks
 * @param data Company creation payload
 * @returns Validated and sanitized company data
 */
export async function validateCompanyCreate(data: unknown): Promise<ICompanyCreate> {
  try {
    const validatedData = await companyCreateSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    // Additional security checks and data sanitization
    validatedData.name = validatedData.name.trim();
    validatedData.domain = validatedData.domain.toLowerCase();
    validatedData.billingEmail = validatedData.billingEmail.toLowerCase();
    validatedData.technicalContacts = validatedData.technicalContacts.map(
      email => email.toLowerCase()
    );

    return validatedData;
  } catch (error) {
    throw createValidationError('Company creation validation failed', {
      errors: error instanceof Error ? error.message : 'Unknown validation error'
    });
  }
}

/**
 * Validates company update data with partial validation support
 * @param data Company update payload
 * @returns Validated and sanitized company update data
 */
export async function validateCompanyUpdate(data: unknown): Promise<ICompanyUpdate> {
  try {
    const validatedData = await companyUpdateSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    // Sanitize provided fields
    if (validatedData.name) {
      validatedData.name = validatedData.name.trim();
    }
    if (validatedData.domain) {
      validatedData.domain = validatedData.domain.toLowerCase();
    }
    if (validatedData.billingEmail) {
      validatedData.billingEmail = validatedData.billingEmail.toLowerCase();
    }
    if (validatedData.technicalContacts) {
      validatedData.technicalContacts = validatedData.technicalContacts.map(
        email => email.toLowerCase()
      );
    }

    return validatedData;
  } catch (error) {
    throw createValidationError('Company update validation failed', {
      errors: error instanceof Error ? error.message : 'Unknown validation error'
    });
  }
}

/**
 * Creates a validation error with standardized format
 */
function createValidationError(message: string, details?: Record<string, unknown>) {
  return {
    message,
    code: ErrorCodes.VALIDATION_FAILED,
    type: ErrorTypes.VALIDATION_ERROR,
    details
  };
}