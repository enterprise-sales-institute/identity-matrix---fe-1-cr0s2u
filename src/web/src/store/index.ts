/**
 * @fileoverview Root Redux store configuration with enhanced type safety and performance monitoring
 * @version 1.0.0
 * @license MIT
 */

// External imports - Redux core and type definitions
import { configureStore } from '@reduxjs/toolkit'; // v1.9.x
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'; // v8.x

// Feature slice reducers
import authReducer from './auth/auth.slice';
import integrationsReducer from './integrations/integrations.slice';
import teamReducer from './team/team.slice';
import visitorsReducer from './visitors/visitors.slice';

/**
 * Configure Redux store with performance monitoring and enhanced type safety
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    integrations: integrationsReducer,
    team: teamReducer,
    visitors: visitorsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Enable runtime checks for better development experience
      serializableCheck: {
        // Ignore specific action types that may contain non-serializable data
        ignoredActions: ['auth/setTokens', 'visitors/setFilter'],
        // Ignore specific paths in the state that may contain non-serializable data
        ignoredPaths: [
          'auth.lastActivity',
          'integrations.lastSync',
          'team.members.lastActiveAt',
          'visitors.filter.dateRange'
        ]
      },
      // Enable immutability checks in development
      immutableCheck: {
        // Ignore specific paths that are intentionally mutable
        ignoredPaths: ['visitors.optimisticUpdates']
      }
    }),
  devTools: {
    // Enhanced Redux DevTools configuration
    name: 'Identity Matrix',
    trace: true,
    traceLimit: 25,
    // Ensure sensitive data is not logged
    actionSanitizer: (action) => {
      if (action.type === 'auth/setTokens') {
        return { ...action, payload: '<<SENSITIVE_DATA>>' };
      }
      return action;
    },
    // Sanitize state before logging
    stateSanitizer: (state) => {
      if (state.auth?.tokens) {
        return {
          ...state,
          auth: {
            ...state.auth,
            tokens: '<<SENSITIVE_DATA>>'
          }
        };
      }
      return state;
    }
  }
});

/**
 * Type definitions for enhanced type safety
 */

// Root state type derived from store
export type RootState = ReturnType<typeof store.getState>;

// Dispatch type with thunk support
export type AppDispatch = typeof store.dispatch;

/**
 * Typed versions of useDispatch and useSelector hooks
 */

// Pre-typed dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Pre-typed selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;