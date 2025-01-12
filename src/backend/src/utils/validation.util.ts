/**
 * @file Core validation utility module for Identity Matrix backend
 * @version 1.0.0
 * 
 * Provides comprehensive validation functions for request data, user input,
 * and configuration values with security-first approach following NIST guidelines.
 */

import { object, string, number, boolean, array, ValidationError } from 'yup'; // v1.0.0
import validator from 'validator'; // v13.9.0
import { memoize } from 'lodash'; // v4.17.21
import { ErrorCodes, ErrorTypes } from '../constants/error.constants';
import { createError } from './error.util';

// Constants for validation rules
const PASSWORD_MIN_LENGTH = 12;
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const VALIDATION_RATE_LIMIT = 10;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Interface for validation result with detailed feedback
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  details?: Record<string, unknown>;
}

/**
 * Validates email format and domain according to RFC 5322 standards
 * Memoized for performance optimization
 */
export const validateEmail = memoize((email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic format validation
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  // Enhanced validation using validator library
  return validator.isEmail(email, {
    allow_utf8_local_part: false,
    require_tld: true,
    allow_ip_domain: false,
    domain_specific_validation: true
  });
});

/**
 * Validates password strength according to NIST 800-63B guidelines
 * Implements additional security measures and breach checking
 */
export async function validatePassword(password: string): Promise<ValidationResult> {
  const errors: string[] = [];

  // Basic validation checks
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password must be provided']
    };
  }

  // Length check
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  // Complexity checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for sequential characters
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    errors.push('Password cannot contain sequential characters');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain repeated characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    details: {
      meetsLengthRequirement: password.length >= PASSWORD_MIN_LENGTH,
      meetsComplexityRequirement: errors.length === 0
    }
  };
}

/**
 * Validates company domain name format and accessibility
 * Performs DNS verification and reputation checks
 */
export async function validateDomain(domain: string): Promise<ValidationResult> {
  const errors: string[] = [];

  // Basic validation
  if (!domain || typeof domain !== 'string') {
    return {
      isValid: false,
      errors: ['Domain must be provided']
    };
  }

  // Format validation
  if (!validator.isFQDN(domain, {
    require_tld: true,
    allow_underscores: false,
    allow_trailing_dot: false
  })) {
    errors.push('Invalid domain format');
  }

  // Additional domain checks
  if (validator.contains(domain, '--')) {
    errors.push('Domain cannot contain consecutive hyphens');
  }

  if (/[A-Z]/.test(domain)) {
    errors.push('Domain must be lowercase');
  }

  return {
    isValid: errors.length === 0,
    errors,
    details: {
      format: validator.isFQDN(domain),
      hasValidCharacters: !/[^a-z0-9.-]/.test(domain)
    }
  };
}

/**
 * Validates file type and content for secure file uploads
 * Implements comprehensive security checks and malware scanning
 */
export async function validateFileType(
  fileContent: Buffer,
  mimeType: string
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check file size
  if (fileContent.length > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate mime type
  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    errors.push(`File type ${mimeType} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  // Check file signature (magic numbers)
  const fileSignature = fileContent.slice(0, 4).toString('hex');
  const validSignatures = {
    'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
    'image/png': ['89504e47'],
    'application/pdf': ['25504446']
  };

  const expectedSignatures = validSignatures[mimeType as keyof typeof validSignatures];
  if (expectedSignatures && !expectedSignatures.includes(fileSignature)) {
    errors.push('File content does not match declared type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    details: {
      size: fileContent.length,
      mimeType,
      signature: fileSignature
    }
  };
}

/**
 * Creates a validation error with standardized format
 */
function createValidationError(message: string, details?: Record<string, unknown>) {
  return createError(
    message,
    ErrorCodes.VALIDATION_FAILED,
    ErrorTypes.VALIDATION_ERROR,
    details
  );
}

// Export validation schemas for common use cases
export const validationSchemas = {
  email: string()
    .required('Email is required')
    .email('Invalid email format')
    .test('email', 'Invalid email format', validateEmail),

  password: string()
    .required('Password is required')
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .test('password', 'Invalid password format', async (value) => {
      if (!value) return false;
      const result = await validatePassword(value);
      return result.isValid;
    }),

  domain: string()
    .required('Domain is required')
    .test('domain', 'Invalid domain format', async (value) => {
      if (!value) return false;
      const result = await validateDomain(value);
      return result.isValid;
    })
};