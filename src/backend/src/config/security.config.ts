/**
 * Security Configuration
 * Centralizes all security-related settings for the Identity Matrix platform
 * @version 1.0.0
 */

import { config } from 'dotenv'; // v16.x
import helmet from 'helmet'; // v7.x
import {
  CORS_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  ENCRYPTION_CONSTANTS,
  CSP_CONSTANTS
} from '../constants/security.constants';

// Initialize environment variables
config();

/**
 * Validates security configuration requirements
 * @throws Error if validation fails
 */
const validateSecurityConfig = (): void => {
  if (!process.env.CORS_ORIGIN) {
    throw new Error('CORS_ORIGIN environment variable is required');
  }

  if (!process.env.ENCRYPTION_KEY || 
      Buffer.from(process.env.ENCRYPTION_KEY).length !== ENCRYPTION_CONSTANTS.KEY_LENGTH) {
    throw new Error(`Encryption key must be ${ENCRYPTION_CONSTANTS.KEY_LENGTH} bytes`);
  }

  // Validate CORS origin URL format
  try {
    new URL(process.env.CORS_ORIGIN);
  } catch {
    throw new Error('CORS_ORIGIN must be a valid URL');
  }
};

// Validate configuration on initialization
validateSecurityConfig();

/**
 * Centralized security configuration object
 */
export const securityConfig = {
  /**
   * CORS Configuration
   * Controls Cross-Origin Resource Sharing policies
   */
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: CORS_CONSTANTS.ALLOWED_METHODS,
    allowedHeaders: CORS_CONSTANTS.ALLOWED_HEADERS,
    maxAge: CORS_CONSTANTS.MAX_AGE,
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  },

  /**
   * Rate Limiting Configuration
   * Protects against brute force and DoS attacks
   */
  rateLimit: {
    windowMs: RATE_LIMIT_CONSTANTS.WINDOW_MS,
    max: RATE_LIMIT_CONSTANTS.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: any): string => req.ip
  },

  /**
   * Encryption Configuration
   * Defines parameters for data encryption
   */
  encryption: {
    algorithm: ENCRYPTION_CONSTANTS.ALGORITHM,
    keyLength: ENCRYPTION_CONSTANTS.KEY_LENGTH,
    saltRounds: ENCRYPTION_CONSTANTS.SALT_ROUNDS,
    key: process.env.ENCRYPTION_KEY,
    ivLength: 16,
    encoding: 'hex' as const
  },

  /**
   * Helmet Security Headers Configuration
   * Implements HTTP security headers
   */
  helmet: {
    contentSecurityPolicy: {
      directives: CSP_CONSTANTS.DIRECTIVES,
      reportOnly: false,
      reportUri: '/api/v1/security/csp-report'
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: {
      policy: 'same-origin' as const
    },
    crossOriginResourcePolicy: {
      policy: 'same-origin' as const
    },
    dnsPrefetchControl: {
      allow: false
    },
    frameguard: {
      action: 'deny' as const
    },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const
    },
    xssFilter: true
  }
} as const;

export default securityConfig;