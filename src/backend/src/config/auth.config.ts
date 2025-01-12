/**
 * Authentication Configuration
 * Defines core authentication settings, JWT parameters, and security options
 * for the Identity Matrix platform following NIST 800-63B guidelines
 * @version 1.0.0
 */

import { config } from 'dotenv';
import { JWT_CONSTANTS } from '../constants/security.constants';

// Initialize environment variables
config();

/**
 * Validates required environment variables for authentication
 * @throws Error if required environment variables are missing or invalid
 */
const validateEnvironment = (): boolean => {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'SESSION_SECRET',
    'COOKIE_DOMAIN'
  ];

  const oauthVars = [
    'OAUTH_CLIENT_ID',
    'OAUTH_CLIENT_SECRET',
    'OAUTH_CALLBACK_URL'
  ];

  // Check required variables
  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }

  // Check OAuth variables if OAuth is enabled
  if (authConfig.oauth.enabled) {
    for (const variable of oauthVars) {
      if (!process.env[variable]) {
        throw new Error(`Missing required OAuth environment variable: ${variable}`);
      }
    }
  }

  // Validate secret lengths and complexity
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.SESSION_SECRET!.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  return true;
};

/**
 * Validates the authentication configuration
 * @throws Error if configuration validation fails
 */
const validateConfig = (): void => {
  // Validate JWT configuration
  if (!authConfig.jwt.algorithm || !authConfig.jwt.secret) {
    throw new Error('Invalid JWT configuration');
  }

  // Validate session configuration
  if (!authConfig.session.secret || !authConfig.session.domain) {
    throw new Error('Invalid session configuration');
  }

  // Validate OAuth configuration if enabled
  if (authConfig.oauth.enabled) {
    if (!authConfig.oauth.clientId || !authConfig.oauth.clientSecret) {
      throw new Error('Invalid OAuth configuration');
    }
    if (authConfig.oauth.pkce && authConfig.oauth.pkceLength < 128) {
      throw new Error('PKCE code length must be at least 128 characters');
    }
  }

  // Validate security settings
  if (authConfig.security.rateLimiting.enabled) {
    if (authConfig.security.rateLimiting.maxAttempts < 1 || 
        authConfig.security.rateLimiting.windowMs < 1) {
      throw new Error('Invalid rate limiting configuration');
    }
  }
};

/**
 * Authentication configuration object
 * Contains comprehensive settings for authentication, session management,
 * OAuth, and security features
 */
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: JWT_CONSTANTS.REFRESH_TOKEN_EXPIRY,
    algorithm: JWT_CONSTANTS.ALGORITHM,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    clockTolerance: 30, // 30 seconds clock skew tolerance
    jwtid: true // Include JWT ID for token revocation support
  },

  session: {
    name: 'identity_matrix_sid',
    secret: process.env.SESSION_SECRET,
    secure: true, // Require HTTPS
    httpOnly: true, // Prevent XSS
    maxAge: 86400000, // 24 hours in milliseconds
    sameSite: 'strict' as const,
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
    signed: true,
    rolling: true // Reset expiration on activity
  },

  oauth: {
    enabled: true,
    pkce: true, // Enable PKCE for enhanced security
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    callbackUrl: process.env.OAUTH_CALLBACK_URL,
    scopes: ['profile', 'email'],
    state: true, // Enable state parameter
    nonce: true, // Enable nonce for replay protection
    pkceLength: 128, // PKCE code verifier length
    codeChallengeMethod: 'S256' as const // SHA-256 for PKCE
  },

  security: {
    rateLimiting: {
      enabled: true,
      maxAttempts: 5, // Maximum login attempts
      windowMs: 900000 // 15 minutes window
    },
    headers: {
      hsts: true, // HTTP Strict Transport Security
      noSniff: true, // X-Content-Type-Options
      xssFilter: true, // X-XSS-Protection
      frameGuard: 'deny' as const // X-Frame-Options
    }
  }
} as const;

// Validate environment variables and configuration
validateEnvironment();
validateConfig();

export default authConfig;