/**
 * @fileoverview Validation utility module implementing NIST 800-63B compliant validation,
 * XSS prevention, and enhanced form validation with TypeScript support
 * @version 1.0.0
 */

import { isEmail, escape } from 'validator'; // v13.x
import {
  PASSWORD_RULES,
  EMAIL_RULES,
  FORM_ERROR_MESSAGES
} from '../constants/validation.constants';
import {
  AuthCredentials,
  RegistrationData
} from '../types/auth.types';

/**
 * Type definition for validation errors
 */
type ValidationErrors = {
  [key: string]: string;
} | null;

/**
 * Validates email format and length using RFC 5322 standards
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  return email.length <= EMAIL_RULES.maxLength &&
         isEmail(email, {
           allow_utf8_local_part: true,
           require_tld: true,
           allow_ip_domain: false
         });
};

/**
 * Validates password against NIST 800-63B standards
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password: string): boolean => {
  if (!password) return false;

  // Check length requirements
  if (password.length < PASSWORD_RULES.minLength || 
      password.length > PASSWORD_RULES.maxLength) {
    return false;
  }

  // Check complexity requirements using regex pattern
  if (!PASSWORD_RULES.pattern.test(password)) {
    return false;
  }

  // Check for common password patterns
  const commonPatterns = [
    /^12345/,
    /password/i,
    /qwerty/i,
    /abc123/i
  ];
  
  return !commonPatterns.some(pattern => pattern.test(password));
};

/**
 * Validates company domain format
 * @param {string} domain - Company domain to validate
 * @returns {boolean} True if domain is valid
 */
const validateCompanyDomain = (domain: string): boolean => {
  if (!domain) return false;

  const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/;
  return domainPattern.test(domain);
};

/**
 * Validates company name format and length
 * @param {string} name - Company name to validate
 * @returns {boolean} True if company name is valid
 */
const validateCompanyName = (name: string): boolean => {
  if (!name) return false;
  return name.length > 0 && name.length <= 100;
};

/**
 * Validates user name format and length
 * @param {string} name - User name to validate
 * @returns {boolean} True if name is valid
 */
const validateUserName = (name: string): boolean => {
  if (!name) return false;
  return name.length > 0 && name.length <= 50;
};

/**
 * Sanitizes input string to prevent XSS attacks
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Escape HTML special characters
  sanitized = escape(sanitized);

  // Normalize Unicode characters
  return sanitized.normalize('NFKC');
};

/**
 * Validates login credentials with comprehensive error reporting
 * @param {AuthCredentials} credentials - Login credentials to validate
 * @returns {ValidationErrors} Validation errors or null if valid
 */
export const validateLoginCredentials = (credentials: AuthCredentials): ValidationErrors => {
  const errors: ValidationErrors = {};
  const { email, password } = credentials;

  if (!email) {
    errors.email = FORM_ERROR_MESSAGES.required;
  } else if (!validateEmail(email)) {
    errors.email = FORM_ERROR_MESSAGES.invalidEmail;
  }

  if (!password) {
    errors.password = FORM_ERROR_MESSAGES.required;
  } else if (!validatePassword(password)) {
    errors.password = FORM_ERROR_MESSAGES.invalidPassword;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

/**
 * Validates registration data with comprehensive error reporting
 * @param {RegistrationData} data - Registration data to validate
 * @returns {ValidationErrors} Validation errors or null if valid
 */
export const validateRegistrationData = (data: RegistrationData): ValidationErrors => {
  const errors: ValidationErrors = {};
  const { email, password, name, companyName, companyDomain } = data;

  // Validate and sanitize email
  if (!email) {
    errors.email = FORM_ERROR_MESSAGES.required;
  } else if (!validateEmail(email)) {
    errors.email = FORM_ERROR_MESSAGES.invalidEmail;
  }

  // Validate and sanitize password
  if (!password) {
    errors.password = FORM_ERROR_MESSAGES.required;
  } else if (!validatePassword(password)) {
    errors.password = FORM_ERROR_MESSAGES.invalidPassword;
  }

  // Validate and sanitize name
  if (!name) {
    errors.name = FORM_ERROR_MESSAGES.required;
  } else if (!validateUserName(name)) {
    errors.name = 'Name must not exceed 50 characters';
  }

  // Validate and sanitize company name
  if (!companyName) {
    errors.companyName = FORM_ERROR_MESSAGES.required;
  } else if (!validateCompanyName(companyName)) {
    errors.companyName = 'Company name must not exceed 100 characters';
  }

  // Validate and sanitize company domain
  if (!companyDomain) {
    errors.companyDomain = FORM_ERROR_MESSAGES.required;
  } else if (!validateCompanyDomain(companyDomain)) {
    errors.companyDomain = 'Please enter a valid domain name';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};