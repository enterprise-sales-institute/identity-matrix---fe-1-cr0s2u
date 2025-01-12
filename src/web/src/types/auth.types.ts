/**
 * @fileoverview Authentication type definitions for Identity Matrix web application
 * @version 1.0.0
 * @license MIT
 */

// External imports
import { UUID } from 'crypto'; // v18.x - Type definition for UUID fields

/**
 * Interface defining user login credentials with validation requirements
 * @interface AuthCredentials
 */
export interface AuthCredentials {
  email: string;    // Email address in valid format
  password: string; // Password meeting NIST 800-63B requirements
}

/**
 * Interface for complete user and company registration data
 * @interface RegistrationData
 */
export interface RegistrationData {
  email: string;        // Email address in valid format
  password: string;     // Password meeting NIST 800-63B requirements
  name: string;         // Full name of the user
  companyName: string;  // Company display name
  companyDomain: string;// Company website domain
}

/**
 * Interface for company information with tracking metadata
 * @interface Company
 */
export interface Company {
  id: UUID;           // Unique company identifier
  name: string;       // Company display name
  domain: string;     // Company website domain
  createdAt: Date;    // Company registration timestamp
}

/**
 * Enum defining available user roles with corresponding access levels
 * @enum UserRole
 */
export enum UserRole {
  ADMIN = 'ADMIN',       // Full system access
  MANAGER = 'MANAGER',   // Team and integration management
  MEMBER = 'MEMBER',     // Standard user access
  VIEWER = 'VIEWER'      // Read-only access
}

/**
 * Interface for user interface preferences
 * @interface UserPreferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  defaultView: string;
}

/**
 * Interface for complete user profile information including preferences and metadata
 * @interface UserProfile
 */
export interface UserProfile {
  id: UUID;                     // Unique user identifier
  email: string;                // User email address
  name: string;                 // User display name
  role: UserRole;               // User access role
  companyId: UUID;              // Associated company identifier
  company: Company;             // Company information
  lastLoginAt: Date;            // Last successful login timestamp
  preferences: UserPreferences; // User interface preferences
}

/**
 * Interface for JWT authentication tokens with expiration tracking
 * @interface AuthTokens
 */
export interface AuthTokens {
  accessToken: string;   // JWT access token
  refreshToken: string;  // JWT refresh token
  expiresIn: number;     // Token expiration time in seconds
  tokenType: string;     // Token type (e.g., 'Bearer')
}

/**
 * Interface for complete authentication state in Redux store with activity tracking
 * @interface AuthState
 */
export interface AuthState {
  isAuthenticated: boolean;         // Current authentication status
  user: UserProfile | null;         // Current user profile
  tokens: AuthTokens | null;        // Current authentication tokens
  loading: boolean;                 // Authentication operation status
  error: string | null;             // Authentication error message
  lastActivity: Date;               // Last user activity timestamp
}

/**
 * Interface for complete authentication response with session tracking
 * @interface AuthResponse
 */
export interface AuthResponse {
  user: UserProfile;     // Authenticated user profile
  tokens: AuthTokens;    // Authentication tokens
  sessionId: string;     // Unique session identifier
}

/**
 * Type for OAuth PKCE code verifier
 * @typedef {string} PKCEVerifier
 */
export type PKCEVerifier = string;

/**
 * Type for OAuth PKCE code challenge
 * @typedef {string} PKCEChallenge
 */
export type PKCEChallenge = string;

/**
 * Interface for OAuth state parameters
 * @interface OAuthState
 */
export interface OAuthState {
  verifier: PKCEVerifier;
  challenge: PKCEChallenge;
  redirectUri: string;
}