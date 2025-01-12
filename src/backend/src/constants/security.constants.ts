/**
 * Security Constants
 * Centralized security configuration constants for the Identity Matrix platform
 * @version 1.0.0
 */

/**
 * CORS configuration constants
 * Defines allowed origins, methods, headers and other CORS settings
 */
export const CORS_CONSTANTS = {
  ALLOWED_ORIGINS: [
    'https://*.identitymatrix.com',
    'https://identitymatrix.com'
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token'
  ],
  MAX_AGE: 86400, // 24 hours in seconds
  ALLOW_CREDENTIALS: true
} as const;

/**
 * Rate limiting configuration constants
 * Defines parameters for API rate limiting and brute force prevention
 */
export const RATE_LIMIT_CONSTANTS = {
  WINDOW_MS: 900000, // 15 minutes in milliseconds
  MAX_REQUESTS: 100, // Maximum requests per window
  SKIP_SUCCESSFUL_REQUESTS: false,
  HEADERS_ENABLED: true
} as const;

/**
 * JWT configuration constants
 * Defines parameters for JSON Web Token generation and validation
 */
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: 900, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY: 604800, // 7 days in seconds
  ALGORITHM: 'HS256',
  TOKEN_ISSUER: 'identity-matrix-auth',
  TOKEN_AUDIENCE: 'identity-matrix-api'
} as const;

/**
 * Encryption configuration constants
 * Defines parameters for data encryption and hashing
 */
export const ENCRYPTION_CONSTANTS = {
  ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32, // 256 bits
  SALT_ROUNDS: 12, // For bcrypt password hashing
  IV_LENGTH: 16, // 128 bits
  AUTH_TAG_LENGTH: 16 // 128 bits
} as const;

/**
 * Content Security Policy configuration constants
 * Defines CSP directives for XSS prevention
 */
export const CSP_CONSTANTS = {
  DIRECTIVES: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'strict-dynamic'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'wss:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'none'"],
    frameSrc: ["'none'"],
    sandbox: [
      'allow-forms',
      'allow-scripts',
      'allow-same-origin'
    ]
  },
  REPORT_URI: '/api/v1/csp-report',
  REPORT_ONLY: false
} as const;

/**
 * Password policy configuration constants
 * Defines requirements for user passwords following NIST guidelines
 */
export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL: true
} as const;