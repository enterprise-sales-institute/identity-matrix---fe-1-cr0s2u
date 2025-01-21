/**
 * @fileoverview Redux selectors for accessing integration state data with memoization
 * @version 1.0.0
 * @license MIT
 */

import { createSelector } from '@reduxjs/toolkit'; // v1.9.x
import type { RootState } from '../index';

/**
 * Base selector to access the integrations state slice
 * @param state Root application state
 * @returns Integrations state slice
 */
export const selectIntegrationsState = (state: RootState) => state.integrations;

/**
 * Memoized selector to get all integrations as an array
 * Performance optimized with array caching
 */
export const selectAllIntegrations = createSelector(
  [selectIntegrationsState],
  (state) => Object.values(state.integrations)
);

/**
 * Memoized selector factory for getting a specific integration by ID
 * Returns undefined if integration is not found
 */
export const selectIntegrationById = createSelector(
  [
    selectIntegrationsState,
    (_: RootState, integrationId: string) => integrationId
  ],
  (state, integrationId) => state.integrations[integrationId]
);

/**
 * Memoized selector to get integrations filtered by type
 * Caches results for each unique type value
 */
export const selectIntegrationsByType = createSelector(
  [
    selectAllIntegrations,
    (_: RootState, type: string) => type
  ],
  (integrations, type) => integrations.filter(
    integration => integration.type === type
  )
);

/**
 * Memoized selector to get integrations filtered by status
 * Caches results for each unique status value
 */
export const selectIntegrationsByStatus = createSelector(
  [
    selectAllIntegrations,
    (_: RootState, status: string) => status
  ],
  (integrations, status) => integrations.filter(
    integration => integration.status === status
  )
);

/**
 * Memoized selector for active integrations
 * Optimized for frequent status checks in UI
 */
export const selectActiveIntegrations = createSelector(
  [selectAllIntegrations],
  (integrations) => integrations.filter(
    integration => integration.status === 'ACTIVE'
  )
);

/**
 * Memoized selector for integration loading state
 */
export const selectIntegrationsLoading = createSelector(
  [selectIntegrationsState],
  (state) => state.loading
);

/**
 * Memoized selector for integration error state
 */
export const selectIntegrationsError = createSelector(
  [selectIntegrationsState],
  (state) => state.error
);

/**
 * Memoized selector for last sync timestamp
 */
export const selectLastSyncTimestamp = createSelector(
  [selectIntegrationsState],
  (state) => state.lastSync
);

/**
 * Memoized selector to check for pending operations
 */
export const selectHasPendingOperations = createSelector(
  [selectIntegrationsState],
  (state) => Object.keys(state.pendingOperations).length > 0
);

/**
 * Memoized selector to get pending operations
 */
export const selectPendingOperations = createSelector(
  [selectIntegrationsState],
  (state) => state.pendingOperations
);