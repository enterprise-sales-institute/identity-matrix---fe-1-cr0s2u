/**
 * @file Core error handling utility module for Identity Matrix backend
 * @version 1.0.0
 * 
 * Provides standardized error creation, formatting, and classification functionality
 * with enhanced security, monitoring, and environment-specific handling.
 */

import { 
  ErrorCodes, 
  ErrorTypes, 
  ErrorMessages, 
  ErrorResponseFormat 
} from '../constants/error.constants';
import { v4 as uuidv4 } from 'uuid'; // v9.0.0

/**
 * Custom error class for application-specific errors with enhanced operational
 * error support and secure stack trace handling.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: ErrorTypes;
  public readonly details: Record<string, unknown>;
  public readonly isOperational: boolean;
  public readonly requestId: string;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = ErrorCodes.INTERNAL_SERVER,
    type: ErrorTypes = ErrorTypes.SYSTEM_ERROR,
    details: Record<string, unknown> = {}
  ) {
    // Sanitize error message for security
    const sanitizedMessage = message.replace(/[<>]/g, '');
    super(sanitizedMessage);

    // Set error name for proper instanceof checks
    Object.defineProperty(this, 'name', {
      value: 'AppError',
      enumerable: false
    });

    this.statusCode = statusCode;
    this.type = type;
    this.details = this.sanitizeErrorDetails(details);
    this.isOperational = this.determineIfOperational(type);
    this.requestId = uuidv4();
    this.timestamp = new Date();

    // Capture stack trace with proper security handling
    Error.captureStackTrace(this, this.constructor);

    // Initialize error monitoring if enabled
    if (process.env.NODE_ENV === 'production') {
      this.initializeErrorMonitoring();
    }
  }

  /**
   * Sanitizes error details to remove sensitive information
   */
  private sanitizeErrorDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    return Object.entries(details).reduce((acc, [key, value]) => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        acc[key] = '[REDACTED]';
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  }

  /**
   * Determines if error is operational based on error type
   */
  private determineIfOperational(type: ErrorTypes): boolean {
    const operationalTypes = [
      ErrorTypes.VALIDATION_ERROR,
      ErrorTypes.AUTHENTICATION_ERROR,
      ErrorTypes.AUTHORIZATION_ERROR,
      ErrorTypes.RESOURCE_ERROR,
      ErrorTypes.RATE_LIMIT_ERROR
    ];
    return operationalTypes.includes(type);
  }

  /**
   * Initializes error monitoring for production environment
   */
  private initializeErrorMonitoring(): void {
    // Implementation would depend on chosen monitoring service
    // Example: Sentry, DataDog, etc.
  }
}

/**
 * Creates a standardized application error with enhanced validation and security
 */
export function createError(
  message: string,
  statusCode: number = ErrorCodes.INTERNAL_SERVER,
  type: ErrorTypes = ErrorTypes.SYSTEM_ERROR,
  details: Record<string, unknown> = {}
): AppError {
  // Validate status code
  if (!Object.values(ErrorCodes).includes(statusCode)) {
    statusCode = ErrorCodes.INTERNAL_SERVER;
  }

  // Check for standard error message
  const defaultMessage = ErrorMessages.DEFAULT_MESSAGES[type];
  if (!message && defaultMessage) {
    message = defaultMessage;
  }

  // Create and return new AppError instance
  return new AppError(message, statusCode, type, details);
}

/**
 * Formats error objects into standardized API response format with
 * environment-aware detail exposure
 */
export function formatError(error: Error): ErrorResponseFormat {
  const isProduction = process.env.NODE_ENV === 'production';
  const appError = error instanceof AppError ? error : 
    new AppError(error.message || 'Internal Server Error');

  const errorResponse: ErrorResponseFormat = {
    error: appError.name,
    code: appError.statusCode.toString(),
    type: appError.type,
    message: isProduction && !appError.isOperational ? 
      'An unexpected error occurred' : appError.message,
    timestamp: appError.timestamp.toISOString(),
    requestId: appError.requestId
  };

  // Add details only if they exist and error is operational or in development
  if (Object.keys(appError.details).length > 0 && 
      (!isProduction || appError.isOperational)) {
    errorResponse.details = appError.details;
  }

  // Include stack trace only in development
  if (!isProduction) {
    errorResponse.stack = appError.stack;
  }

  return errorResponse;
}

/**
 * Enhanced error type checking with improved type safety and monitoring
 */
export function isOperationalError(error: Error): boolean {
  if (!(error instanceof AppError)) {
    return false;
  }

  // Verify error properties integrity
  const hasRequiredProperties = 
    'isOperational' in error &&
    'statusCode' in error &&
    'type' in error;

  if (!hasRequiredProperties) {
    return false;
  }

  return error.isOperational;
}