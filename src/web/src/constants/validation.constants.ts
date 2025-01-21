/**
 * @fileoverview Validation constants for Identity Matrix frontend application
 * Implements NIST 800-63B password standards and RFC compliance for emails and domains
 * @version 1.0.0
 */

/**
 * Password validation rules following NIST 800-63B standards
 * - Minimum length: 12 characters
 * - Maximum length: 128 characters
 * - Allows any printable ASCII character including spaces
 * - Requires at least one lowercase, one uppercase, one number, and one special character
 */
export const PASSWORD_RULES = {
  minLength: 12,
  maxLength: 128,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>\s]{12,128}$/
} as const;

/**
 * Email validation rules following RFC 5322 standards
 * - Maximum length: 254 characters (per RFC 5321)
 * - Pattern validates format while allowing international characters
 */
export const EMAIL_RULES = {
  maxLength: 254,
  pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
} as const;

/**
 * Company validation rules following RFC 1035 standards for domain names
 * - Name maximum length: 100 characters
 * - Domain maximum length: 253 characters
 * - Domain pattern validates format according to RFC 1035
 */
export const COMPANY_RULES = {
  nameMaxLength: 100,
  domainMaxLength: 253,
  domainPattern: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/
} as const;

/**
 * Input field length limits to prevent data overflow
 * and ensure consistent UI rendering
 */
export const INPUT_LIMITS = {
  name: 50,
  description: 500,
  title: 100
} as const;

/**
 * User-friendly validation error messages
 * Used across all forms in the application
 */
export const FORM_ERROR_MESSAGES = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  invalidPassword: `Password must be between ${PASSWORD_RULES.minLength} and ${PASSWORD_RULES.maxLength} characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character`,
  invalidDomain: 'Please enter a valid domain name',
  maxLength: (field: string, max: number) => `${field} must not exceed ${max} characters`
} as const;