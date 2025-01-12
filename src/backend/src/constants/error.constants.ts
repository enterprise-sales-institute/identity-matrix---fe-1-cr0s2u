/**
 * @file Error constants and types for Identity Matrix backend
 * @version 1.0.0
 * 
 * Centralized error handling constants, types and interfaces for standardized
 * error management across the Identity Matrix platform.
 */

/**
 * HTTP status codes for different error scenarios
 */
export enum ErrorCodes {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500,
  VALIDATION_FAILED = 422,
  CONFLICT = 409,
  SERVICE_UNAVAILABLE = 503
}

/**
 * Detailed categorization of error types for precise error handling
 */
export enum ErrorTypes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_ERROR = 'RESOURCE_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  DATA_ERROR = 'DATA_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

/**
 * Default error messages for each error type
 */
export const ErrorMessages = {
  DEFAULT_MESSAGES: {
    [ErrorTypes.VALIDATION_ERROR]: 'Invalid input data provided',
    [ErrorTypes.AUTHENTICATION_ERROR]: 'Authentication failed',
    [ErrorTypes.AUTHORIZATION_ERROR]: 'Insufficient permissions to perform this action',
    [ErrorTypes.RESOURCE_ERROR]: 'Requested resource not found',
    [ErrorTypes.SYSTEM_ERROR]: 'Internal server error occurred',
    [ErrorTypes.INTEGRATION_ERROR]: 'External service integration failed',
    [ErrorTypes.DATA_ERROR]: 'Data operation failed',
    [ErrorTypes.RATE_LIMIT_ERROR]: 'Rate limit exceeded'
  },

  VALIDATION_TEMPLATES: {
    REQUIRED_FIELD: 'Field "{field}" is required',
    INVALID_FORMAT: 'Invalid format for field "{field}"',
    MIN_LENGTH: 'Field "{field}" must be at least {min} characters long',
    MAX_LENGTH: 'Field "{field}" must not exceed {max} characters',
    INVALID_EMAIL: 'Invalid email address format',
    INVALID_PASSWORD: 'Password does not meet security requirements',
    INVALID_DATE: 'Invalid date format for field "{field}"',
    DUPLICATE_ENTRY: 'A record with this {field} already exists'
  },

  SECURITY_MESSAGES: {
    INVALID_TOKEN: 'Invalid or expired authentication token',
    SESSION_EXPIRED: 'Your session has expired, please login again',
    ACCOUNT_LOCKED: 'Account has been locked due to multiple failed attempts',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to access this resource',
    CSRF_TOKEN_INVALID: 'Invalid or missing CSRF token',
    RATE_LIMIT_REACHED: 'Too many requests, please try again later',
    IP_BLOCKED: 'Access denied from your IP address'
  }
} as const;

/**
 * Comprehensive interface for structured error responses
 */
export interface ErrorResponseFormat {
  /**
   * Brief error description
   */
  error: string;

  /**
   * Error code for client reference
   */
  code: string;

  /**
   * Categorized error type
   */
  type: ErrorTypes;

  /**
   * Detailed error message
   */
  message: string;

  /**
   * Additional error context and data
   */
  details?: Record<string, unknown>;

  /**
   * Error occurrence timestamp
   */
  timestamp: string;

  /**
   * Unique request identifier for tracking
   */
  requestId: string;

  /**
   * Error stack trace (only in development)
   */
  stack?: string;
}