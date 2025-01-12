/**
 * @fileoverview Authentication interfaces for Identity Matrix platform implementing OAuth 2.0 + PKCE with JWT standards
 * @version 1.0.0
 */

// External imports
import { UUID } from 'crypto'; // v18.x

// Internal imports
import { ICompany } from './company.interface';

/**
 * User role enumeration for role-based access control
 * Defines granular permission levels across the platform
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

/**
 * User account status tracking enumeration
 * Manages different states of user accounts for security
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

/**
 * Interface for authentication credentials following NIST 800-63B guidelines
 * Used for login requests with email/password combination
 */
export interface IAuthCredentials {
  /** User email address */
  email: string;
  /** Password following NIST complexity requirements */
  password: string;
}

/**
 * Interface for new user and company registration
 * Includes validation requirements for all fields
 */
export interface IRegistrationData {
  /** User email address for authentication */
  email: string;
  /** Password following NIST complexity requirements */
  password: string;
  /** User's full name */
  name: string;
  /** Company name for organization setup */
  companyName: string;
  /** Company domain for verification */
  companyDomain: string;
}

/**
 * Comprehensive user profile interface with security features
 * Includes role-based access control and MFA support
 */
export interface IUserProfile {
  /** Unique identifier for the user */
  id: UUID;
  /** User email address */
  email: string;
  /** User's full name */
  name: string;
  /** User's role for access control */
  role: UserRole;
  /** Associated company identifier */
  companyId: UUID;
  /** Associated company details */
  company: ICompany;
  /** Timestamp of last successful login */
  lastLoginAt: Date;
  /** Multi-factor authentication status */
  mfaEnabled: boolean;
  /** Current account status */
  status: UserStatus;
}

/**
 * JWT payload interface with enhanced security tracking
 * Implements OAuth 2.0 standards with additional security measures
 */
export interface IJwtPayload {
  /** User identifier for token association */
  userId: UUID;
  /** User email for token validation */
  email: string;
  /** User role for permission verification */
  role: UserRole;
  /** Company identifier for scope limitation */
  companyId: UUID;
  /** Token version for invalidation support */
  tokenVersion: number;
  /** Token issuance timestamp */
  issuedAt: number;
  /** Token expiration timestamp */
  expiresAt: number;
}

/**
 * OAuth 2.0 compliant token response interface
 * Implements standard OAuth token structure with refresh support
 */
export interface IAuthTokens {
  /** JWT access token */
  accessToken: string;
  /** JWT refresh token for token renewal */
  refreshToken: string;
  /** Token type (Bearer) */
  tokenType: string;
  /** Token expiration time in seconds */
  expiresIn: number;
}