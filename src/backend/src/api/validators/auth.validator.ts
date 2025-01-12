/**
 * @fileoverview Authentication request validation module implementing secure validation schemas
 * and middleware for login, registration, and token refresh requests with NIST compliance
 * @version 1.0.0
 */

import { object, string } from 'yup'; // v1.0.0
import { 
  IAuthCredentials, 
  IRegistrationData, 
  IValidationResult 
} from '../../interfaces/auth.interface';
import { 
  validateEmail, 
  validatePassword, 
  validateSchema, 
  sanitizeInput, 
  checkRateLimit 
} from '../../utils/validation.util';

// Validation constants following NIST 800-63B guidelines
const EMAIL_MIN_LENGTH = 5;
const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const COMPANY_NAME_MIN_LENGTH = 2;
const COMPANY_NAME_MAX_LENGTH = 100;
const DOMAIN_MIN_LENGTH = 4;
const DOMAIN_MAX_LENGTH = 255;
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_REGISTRATION_ATTEMPTS = 3;
const MAX_REFRESH_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW = 300000; // 5 minutes in milliseconds

/**
 * Enhanced Yup validation schema for login requests with security rules
 */
export const loginSchema = object({
  email: string()
    .required('Email is required')
    .min(EMAIL_MIN_LENGTH, `Email must be at least ${EMAIL_MIN_LENGTH} characters`)
    .max(EMAIL_MAX_LENGTH, `Email cannot exceed ${EMAIL_MAX_LENGTH} characters`)
    .test('email', 'Invalid email format', validateEmail)
    .trim(),

  password: string()
    .required('Password is required')
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`)
});

/**
 * Enhanced Yup validation schema for registration with comprehensive security checks
 */
export const registrationSchema = object({
  email: string()
    .required('Email is required')
    .min(EMAIL_MIN_LENGTH, `Email must be at least ${EMAIL_MIN_LENGTH} characters`)
    .max(EMAIL_MAX_LENGTH, `Email cannot exceed ${EMAIL_MAX_LENGTH} characters`)
    .test('email', 'Invalid email format', validateEmail)
    .trim(),

  password: string()
    .required('Password is required')
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`),

  name: string()
    .required('Name is required')
    .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`)
    .max(NAME_MAX_LENGTH, `Name cannot exceed ${NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),

  companyName: string()
    .required('Company name is required')
    .min(COMPANY_NAME_MIN_LENGTH, `Company name must be at least ${COMPANY_NAME_MIN_LENGTH} characters`)
    .max(COMPANY_NAME_MAX_LENGTH, `Company name cannot exceed ${COMPANY_NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z0-9\s-'&.]+$/, 'Company name contains invalid characters')
    .trim(),

  companyDomain: string()
    .required('Company domain is required')
    .min(DOMAIN_MIN_LENGTH, `Domain must be at least ${DOMAIN_MIN_LENGTH} characters`)
    .max(DOMAIN_MAX_LENGTH, `Domain cannot exceed ${DOMAIN_MAX_LENGTH} characters`)
    .matches(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/, 'Invalid domain format')
    .lowercase()
    .trim()
});

/**
 * Enhanced Yup validation schema for refresh tokens with integrity checks
 */
export const refreshTokenSchema = object({
  refreshToken: string()
    .required('Refresh token is required')
    .matches(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/, 'Invalid token format')
});

/**
 * Validates and sanitizes login request data with rate limiting and security checks
 * @param data - Login request data
 * @returns Validated and sanitized login credentials with potential validation errors
 */
export async function validateLoginRequest(data: unknown): Promise<IValidationResult<IAuthCredentials>> {
  // Check rate limiting
  const rateLimitResult = await checkRateLimit('login', MAX_LOGIN_ATTEMPTS, RATE_LIMIT_WINDOW);
  if (!rateLimitResult.allowed) {
    return {
      isValid: false,
      validationErrors: ['Too many login attempts. Please try again later.']
    };
  }

  // Sanitize input data
  const sanitizedData = sanitizeInput(data);

  // Validate against schema
  const validationResult = await validateSchema(loginSchema, sanitizedData);
  if (!validationResult.isValid) {
    return validationResult;
  }

  // Additional security checks
  const emailValid = await validateEmail(sanitizedData.email);
  if (!emailValid) {
    return {
      isValid: false,
      validationErrors: ['Invalid email format']
    };
  }

  const passwordValid = await validatePassword(sanitizedData.password);
  if (!passwordValid.isValid) {
    return {
      isValid: false,
      validationErrors: passwordValid.errors
    };
  }

  return {
    isValid: true,
    validationErrors: [],
    data: sanitizedData as IAuthCredentials
  };
}

/**
 * Validates and sanitizes registration request data with enhanced security checks
 * @param data - Registration request data
 * @returns Validated and sanitized registration data with potential validation errors
 */
export async function validateRegistrationRequest(data: unknown): Promise<IValidationResult<IRegistrationData>> {
  // Check rate limiting
  const rateLimitResult = await checkRateLimit('registration', MAX_REGISTRATION_ATTEMPTS, RATE_LIMIT_WINDOW);
  if (!rateLimitResult.allowed) {
    return {
      isValid: false,
      validationErrors: ['Too many registration attempts. Please try again later.']
    };
  }

  // Sanitize input data
  const sanitizedData = sanitizeInput(data);

  // Validate against schema
  const validationResult = await validateSchema(registrationSchema, sanitizedData);
  if (!validationResult.isValid) {
    return validationResult;
  }

  // Additional security checks
  const emailValid = await validateEmail(sanitizedData.email);
  if (!emailValid) {
    return {
      isValid: false,
      validationErrors: ['Invalid email format']
    };
  }

  const passwordValid = await validatePassword(sanitizedData.password);
  if (!passwordValid.isValid) {
    return {
      isValid: false,
      validationErrors: passwordValid.errors
    };
  }

  return {
    isValid: true,
    validationErrors: [],
    data: sanitizedData as IRegistrationData
  };
}

/**
 * Validates refresh token request with token integrity checks
 * @param data - Refresh token request data
 * @returns Validated refresh token with validation status
 */
export async function validateRefreshTokenRequest(data: unknown): Promise<IValidationResult<{ refreshToken: string }>> {
  // Check rate limiting
  const rateLimitResult = await checkRateLimit('refresh', MAX_REFRESH_ATTEMPTS, RATE_LIMIT_WINDOW);
  if (!rateLimitResult.allowed) {
    return {
      isValid: false,
      validationErrors: ['Too many refresh attempts. Please try again later.']
    };
  }

  // Sanitize input data
  const sanitizedData = sanitizeInput(data);

  // Validate against schema
  const validationResult = await validateSchema(refreshTokenSchema, sanitizedData);
  if (!validationResult.isValid) {
    return validationResult;
  }

  return {
    isValid: true,
    validationErrors: [],
    data: sanitizedData as { refreshToken: string }
  };
}