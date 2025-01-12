/**
 * @fileoverview Redux selectors for authentication state management with enhanced security and type safety
 * @version 1.0.0
 * @license MIT
 */

import { createSelector } from '@reduxjs/toolkit'; // v1.9.x
import type { RootState } from '../index';
import type { AuthState } from '../../types/auth.types';

/**
 * Base selector to access the auth slice from root state
 * Provides type-safe access to complete auth state
 */
export const selectAuthState = (state: RootState): AuthState => state.auth;

/**
 * Memoized selector for authentication status
 * Validates auth state integrity before returning status
 */
export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth): boolean => {
    // Ensure both user and tokens exist for valid authentication
    return !!(auth.isAuthenticated && auth.user && auth.tokens);
  }
);

/**
 * Memoized selector for user profile with role validation
 * Performs security checks on user object before returning
 */
export const selectUser = createSelector(
  [selectAuthState],
  (auth) => {
    if (!auth.user) return null;

    // Validate user object has required security properties
    const { id, email, role, companyId } = auth.user;
    if (!id || !email || !role || !companyId) {
      console.error('Invalid user profile structure detected');
      return null;
    }

    return auth.user;
  }
);

/**
 * Memoized selector for authentication tokens with validation
 * Performs token validation and expiration checks
 */
export const selectAuthTokens = createSelector(
  [selectAuthState],
  (auth) => {
    if (!auth.tokens) return null;

    // Validate token structure and type
    const { accessToken, refreshToken, tokenType, expiresIn } = auth.tokens;
    if (!accessToken || !refreshToken || tokenType !== 'Bearer' || !expiresIn) {
      console.error('Invalid token structure detected');
      return null;
    }

    // Check token expiration
    if (expiresIn <= 0) {
      console.warn('Token expiration detected');
      return null;
    }

    return auth.tokens;
  }
);

/**
 * Memoized selector for authentication loading state
 * Provides type-safe access to loading indicator
 */
export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth): boolean => auth.loading
);

/**
 * Memoized selector for authentication error state
 * Provides sanitized error messages with type safety
 */
export const selectAuthError = createSelector(
  [selectAuthState],
  (auth): string | null => {
    if (!auth.error) return null;

    // Sanitize error message to prevent XSS
    return auth.error.replace(/[<>]/g, '');
  }
);

/**
 * Memoized selector for last activity timestamp
 * Provides type-safe access to session activity tracking
 */
export const selectLastActivity = createSelector(
  [selectAuthState],
  (auth) => auth.lastActivity
);

/**
 * Memoized selector for session validation
 * Checks both authentication status and session validity
 */
export const selectIsValidSession = createSelector(
  [selectAuthState],
  (auth): boolean => {
    if (!auth.isAuthenticated || !auth.lastActivity) return false;

    // Validate session hasn't expired (30 minute timeout)
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    const now = Date.now();
    const lastActivity = new Date(auth.lastActivity).getTime();

    return (now - lastActivity) < SESSION_TIMEOUT;
  }
);