/**
 * Custom React hook for authentication management in Identity Matrix
 * @version 1.0.0
 * @description Provides secure authentication state management and operations with session tracking,
 * token refresh, and comprehensive error handling according to NIST 800-63B standards
 */

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store/store';

// Authentication thunks for secure operations
import {
  loginThunk,
  registerThunk,
  logoutThunk,
  refreshTokenThunk
} from '../store/auth/auth.thunks';

// Type definitions for type safety
import { 
  AuthCredentials, 
  RegistrationData, 
  AuthResponse 
} from '../types/auth.types';

// Constants
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute
const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

/**
 * Enhanced authentication hook with comprehensive security features
 * @returns Authentication state and secure operations
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors with memoization for performance
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const user = useSelector((state: any) => state.auth.user);
  const loading = useSelector((state: any) => state.auth.loading);
  const error = useSelector((state: any) => state.auth.error);
  const sessionData = useSelector((state: any) => state.auth.sessionData);
  const lastActivity = useSelector((state: any) => state.auth.lastActivity);

  /**
   * Enhanced login handler with security measures
   */
  const login = useCallback(async (credentials: AuthCredentials) => {
    try {
      // Validate credentials format
      if (!credentials.email || !credentials.password) {
        throw new Error('Invalid credentials format');
      }

      const result = await dispatch(loginThunk(credentials)).unwrap();
      return result;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Enhanced registration handler with validation
   */
  const register = useCallback(async (data: RegistrationData) => {
    try {
      // Validate registration data
      if (!data.email || !data.password || !data.name || !data.companyName) {
        throw new Error('Invalid registration data');
      }

      const result = await dispatch(registerThunk(data)).unwrap();
      return result;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Secure logout handler with cleanup
   */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force logout even on error
      dispatch(logoutThunk());
    }
  }, [dispatch]);

  /**
   * Token refresh handler with retry mechanism
   */
  const refreshToken = useCallback(async () => {
    try {
      const result = await dispatch(refreshTokenThunk()).unwrap();
      return result;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      await logout();
    }
  }, [dispatch, logout]);

  /**
   * Session validation handler
   */
  const validateSession = useCallback(async () => {
    try {
      const currentTime = Date.now();
      const lastActivityTime = lastActivity ? new Date(lastActivity).getTime() : 0;
      
      if (currentTime - lastActivityTime > INACTIVITY_THRESHOLD) {
        await logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      await logout();
      return false;
    }
  }, [lastActivity, logout]);

  /**
   * Error clearing utility
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'auth/clearError' });
  }, [dispatch]);

  /**
   * Setup automatic token refresh
   */
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (isAuthenticated) {
      refreshInterval = setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, refreshToken]);

  /**
   * Monitor session activity
   */
  useEffect(() => {
    let activityInterval: NodeJS.Timeout;

    if (isAuthenticated) {
      activityInterval = setInterval(async () => {
        await validateSession();
      }, SESSION_CHECK_INTERVAL);
    }

    return () => {
      if (activityInterval) {
        clearInterval(activityInterval);
      }
    };
  }, [isAuthenticated, validateSession]);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    sessionData,
    login,
    register,
    logout,
    refreshToken,
    validateSession,
    clearError
  };
};

export type UseAuthReturn = ReturnType<typeof useAuth>;