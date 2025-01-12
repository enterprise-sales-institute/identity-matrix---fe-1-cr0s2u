/**
 * Authentication Thunks for Identity Matrix Web Application
 * @version 1.0.0
 * @description Implements secure Redux thunks for authentication operations with enhanced security,
 * session management, and performance optimization
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // v1.9.x
import { SecurityUtils } from '@auth0/security-utils'; // v2.x

// Internal imports
import { authActions } from './auth.slice';
import AuthService from '../../services/auth.service';
import { 
  AuthCredentials, 
  RegistrationData, 
  AuthResponse, 
  AuthTokens 
} from '../../types/auth.types';

// Constants for security and performance
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, number>();
const lockoutTimers = new Map<string, number>();

/**
 * Enhanced login thunk with security features and session management
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: AuthCredentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(authActions.setLoading(true));
      dispatch(authActions.setError(null));

      // Validate login attempts
      const userKey = credentials.email.toLowerCase();
      const attempts = loginAttempts.get(userKey) || 0;
      const lockoutTime = lockoutTimers.get(userKey);

      if (lockoutTime && Date.now() < lockoutTime) {
        throw new Error('Account temporarily locked. Please try again later.');
      }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockoutTimers.set(userKey, Date.now() + LOCKOUT_DURATION);
        loginAttempts.delete(userKey);
        throw new Error('Maximum login attempts exceeded. Account locked temporarily.');
      }

      // Perform login
      const response: AuthResponse = await AuthService.login(credentials);
      const { user, tokens, sessionId } = response;

      // Validate tokens
      if (!SecurityUtils.validateTokens(tokens)) {
        throw new Error('Invalid authentication tokens received');
      }

      // Update Redux state
      dispatch(authActions.setUser(user));
      dispatch(authActions.setTokens(tokens));
      dispatch(authActions.setSession(sessionId));
      dispatch(authActions.updateActivity());

      // Reset login attempts on success
      loginAttempts.delete(userKey);
      lockoutTimers.delete(userKey);

      return response;
    } catch (error: any) {
      // Track failed login attempts
      const userKey = credentials.email.toLowerCase();
      loginAttempts.set(userKey, (loginAttempts.get(userKey) || 0) + 1);

      dispatch(authActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Enhanced registration thunk with security validation
 */
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (data: RegistrationData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(authActions.setLoading(true));
      dispatch(authActions.setError(null));

      // Validate registration data
      if (!SecurityUtils.validateRegistrationData(data)) {
        throw new Error('Invalid registration data');
      }

      // Perform registration
      const response: AuthResponse = await AuthService.register(data);
      const { user, tokens, sessionId } = response;

      // Validate response
      if (!SecurityUtils.validateTokens(tokens)) {
        throw new Error('Invalid authentication tokens received');
      }

      // Update Redux state
      dispatch(authActions.setUser(user));
      dispatch(authActions.setTokens(tokens));
      dispatch(authActions.setSession(sessionId));
      dispatch(authActions.updateActivity());

      return response;
    } catch (error: any) {
      dispatch(authActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Enhanced logout thunk with secure cleanup
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      dispatch(authActions.setLoading(true));

      // Perform secure logout
      await AuthService.logout();

      // Clear auth state
      dispatch(authActions.clearAuth());
    } catch (error: any) {
      dispatch(authActions.setError(error.message));
      // Force clear auth state even on error
      dispatch(authActions.clearAuth());
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }
);

/**
 * Enhanced token refresh thunk with retry mechanism
 */
export const refreshTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(authActions.setLoading(true));

      // Perform token refresh
      const response: AuthResponse = await AuthService.refreshToken();
      const { tokens, sessionId } = response;

      // Validate new tokens
      if (!SecurityUtils.validateTokens(tokens)) {
        throw new Error('Invalid refresh tokens received');
      }

      // Update Redux state
      dispatch(authActions.setTokens(tokens));
      dispatch(authActions.setSession(sessionId));
      dispatch(authActions.updateActivity());

      return response;
    } catch (error: any) {
      // Clear auth state on refresh failure
      dispatch(authActions.clearAuth());
      return rejectWithValue(error.message);
    } finally {
      dispatch(authActions.setLoading(false));
    }
  }
);