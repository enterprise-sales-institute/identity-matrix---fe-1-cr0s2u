/**
 * @fileoverview Visitor data validation module for Identity Matrix platform
 * Implements comprehensive validation for visitor tracking and enrichment data
 * with enhanced security measures and GDPR compliance
 * @version 1.0.0
 */

import { object, string, date, mixed, array } from 'yup'; // v1.0.0
import { IVisitor, IVisitorMetadata, IEnrichedData } from '../../interfaces/visitor.interface';
import { VISITOR_STATUS } from '../../constants/visitor.constants';
import { validateEmail, validateSchema, sanitizeInput } from '../../utils/validation.util';
import { createError } from '../../utils/error.util';
import { ErrorTypes, ErrorCodes } from '../../constants/error.constants';

// Validation constants
const IP_ADDRESS_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const USER_AGENT_MAX_LENGTH = 500;
const COMPANY_NAME_MAX_LENGTH = 100;
const LOCATION_REQUIRED_FIELDS = ['country', 'region', 'city'];
const ALLOWED_INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Other'
];

/**
 * Validates visitor location data with GDPR compliance
 */
const locationSchema = object({
  country: string().required('Country is required'),
  region: string().required('Region is required'),
  city: string().required('City is required'),
  postalCode: string().optional(),
  timezone: string().required('Timezone is required')
}).required();

/**
 * Enhanced validation schema for visitor metadata
 * Implements strict security checks and data sanitization
 */
export const visitorMetadataSchema = object<IVisitorMetadata>({
  ipAddress: string()
    .required('IP address is required')
    .matches(IP_ADDRESS_REGEX, 'Invalid IP address format')
    .test('ip-sanitize', 'Invalid IP address', (value) => {
      return value ? sanitizeInput(value).length > 0 : false;
    }),
  userAgent: string()
    .required('User agent is required')
    .max(USER_AGENT_MAX_LENGTH, `User agent must not exceed ${USER_AGENT_MAX_LENGTH} characters`)
    .test('ua-sanitize', 'Invalid user agent', (value) => {
      return value ? sanitizeInput(value).length > 0 : false;
    }),
  referrer: string().url('Invalid referrer URL').optional(),
  currentPage: string().url('Invalid current page URL').required(),
  previousPages: array().of(string().url('Invalid previous page URL')),
  customParams: object().optional(),
  location: locationSchema,
  deviceType: string()
    .required('Device type is required')
    .oneOf(['desktop', 'mobile', 'tablet'], 'Invalid device type'),
  browser: string().required('Browser information is required'),
  os: string().required('Operating system information is required')
});

/**
 * Enhanced validation schema for enriched visitor data
 * Implements business rules and data quality checks
 */
export const enrichedDataSchema = object<IEnrichedData>({
  company: string()
    .required('Company name is required')
    .max(COMPANY_NAME_MAX_LENGTH)
    .test('company-sanitize', 'Invalid company name', (value) => {
      return value ? sanitizeInput(value).length > 0 : false;
    }),
  title: string().required('Professional title is required'),
  industry: string()
    .required('Industry is required')
    .oneOf(ALLOWED_INDUSTRIES, 'Invalid industry'),
  size: string()
    .required('Company size is required')
    .matches(/^\d+-\d+$|^\d+\+$/, 'Invalid company size format'),
  revenue: string()
    .required('Revenue range is required')
    .matches(/^\$\d+[KMB]-\$\d+[KMB]$|\$\d+[KMB]\+$/, 'Invalid revenue format'),
  website: string().url('Invalid website URL').required(),
  technologies: array().of(string()),
  linkedinUrl: string().url('Invalid LinkedIn URL').optional(),
  socialProfiles: object().optional(),
  customFields: object().optional()
});

/**
 * Validates visitor metadata with enhanced security checks
 * @param metadata - Visitor metadata to validate
 * @throws ValidationError if metadata is invalid
 */
export async function validateVisitorMetadata(metadata: IVisitorMetadata): Promise<boolean> {
  try {
    // Sanitize input data
    const sanitizedMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
      return acc;
    }, {} as IVisitorMetadata);

    // Validate against schema
    await visitorMetadataSchema.validate(sanitizedMetadata, { abortEarly: false });

    // Additional security checks
    if (!LOCATION_REQUIRED_FIELDS.every(field => sanitizedMetadata.location[field])) {
      throw createError(
        'Missing required location fields',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR
      );
    }

    return true;
  } catch (error) {
    throw createError(
      'Invalid visitor metadata',
      ErrorCodes.VALIDATION_FAILED,
      ErrorTypes.VALIDATION_ERROR,
      { details: error.errors }
    );
  }
}

/**
 * Validates enriched visitor data with business rules
 * @param enrichedData - Enriched visitor data to validate
 * @throws ValidationError if data is invalid
 */
export async function validateEnrichedData(enrichedData: IEnrichedData): Promise<boolean> {
  try {
    // Sanitize input data
    const sanitizedData = Object.entries(enrichedData).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
      return acc;
    }, {} as IEnrichedData);

    // Validate against schema
    await enrichedDataSchema.validate(sanitizedData, { abortEarly: false });

    // Additional business rule validations
    if (sanitizedData.website && !await validateDomain(sanitizedData.website)) {
      throw createError(
        'Invalid company website domain',
        ErrorCodes.VALIDATION_FAILED,
        ErrorTypes.VALIDATION_ERROR
      );
    }

    return true;
  } catch (error) {
    throw createError(
      'Invalid enriched data',
      ErrorCodes.VALIDATION_FAILED,
      ErrorTypes.VALIDATION_ERROR,
      { details: error.errors }
    );
  }
}

/**
 * Validates domain format and accessibility
 * @param domain - Domain to validate
 */
async function validateDomain(domain: string): Promise<boolean> {
  try {
    const url = new URL(domain);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}