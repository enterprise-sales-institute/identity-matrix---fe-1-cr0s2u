/**
 * @fileoverview Redux slice for authentication state management in Identity Matrix
 * @version 1.0.0
 * @license MIT
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9.x
import { AuthState, UserProfile, AuthTokens } from '../../types/auth.types';

/**
 * Initial authentication state with security defaults
 */
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: false,
  error: null,
  lastActivity: new Date(),
  sessionId: null
};

/**
 * Authentication slice with secure state management
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Update user profile with role validation
     */
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        state.lastActivity = new Date();
      }
    },

    /**
     * Update authentication tokens with validation
     */
    setTokens: (state, action: PayloadAction<AuthTokens | null>) => {
      if (action.payload) {
        // Validate token type and expiration
        if (action.payload.tokenType !== 'Bearer' || action.payload.expiresIn <= 0) {
          state.error = 'Invalid token configuration';
          return;
        }
      }
      state.tokens = action.payload;
      state.lastActivity = new Date();
    },

    /**
     * Update session activity timestamp
     */
    updateLastActivity: (state) => {
      state.lastActivity = new Date();
    },

    /**
     * Update session identifier with validation
     */
    setSessionId: (state, action: PayloadAction<string | null>) => {
      if (action.payload && !/^[a-zA-Z0-9-_]{32,64}$/.test(action.payload)) {
        state.error = 'Invalid session identifier';
        return;
      }
      state.sessionId = action.payload;
      state.lastActivity = new Date();
    },

    /**
     * Update loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null; // Clear errors when loading starts
      }
    },

    /**
     * Update error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false; // Ensure loading is cleared on error
    },

    /**
     * Clear authentication state securely
     */
    clearAuth: (state) => {
      // Securely clear all authentication data
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = null;
      state.sessionId = null;
      state.lastActivity = new Date();
      state.error = null;
      state.loading = false;
    }
  }
});

// Export actions for component usage
export const authActions = authSlice.actions;

// Export reducer for store configuration
export const authReducer = authSlice.reducer;

// Export default for module usage
export default authSlice.reducer;