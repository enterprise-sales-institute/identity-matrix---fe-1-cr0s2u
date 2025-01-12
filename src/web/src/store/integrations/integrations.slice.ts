import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'; // @version 1.9.x
import { Integration, IntegrationType, IntegrationStatus } from '../../types/integration.types';

/**
 * Interface for integration-specific errors
 */
interface IntegrationError {
  code: string;
  message: string;
  integrationId?: string;
  details?: Record<string, unknown>;
}

/**
 * Interface for the integrations state slice
 */
interface IntegrationsState {
  integrations: Record<string, Integration>;
  loading: boolean;
  error: IntegrationError | null;
  lastSync: Date | null;
  pendingOperations: Record<string, Integration>;
}

/**
 * Initial state for integrations slice
 */
const initialState: IntegrationsState = {
  integrations: {},
  loading: false,
  error: null,
  lastSync: null,
  pendingOperations: {}
};

/**
 * Redux slice for managing CRM integrations
 */
const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setIntegrations: (state, action: PayloadAction<Integration[]>) => {
      const normalizedIntegrations = action.payload.reduce((acc, integration) => {
        acc[integration.id] = integration;
        return acc;
      }, {} as Record<string, Integration>);

      state.integrations = {
        ...normalizedIntegrations,
        ...state.pendingOperations
      };
      state.lastSync = new Date();
      state.error = null;
      state.loading = false;
    },

    addIntegration: (state, action: PayloadAction<Integration>) => {
      const integration = action.payload;
      state.pendingOperations[integration.id] = integration;
      state.integrations[integration.id] = integration;
      state.error = null;
      state.lastSync = new Date();
    },

    updateIntegration: (state, action: PayloadAction<Integration>) => {
      const integration = action.payload;
      state.pendingOperations[integration.id] = state.integrations[integration.id];
      state.integrations[integration.id] = integration;
      state.error = null;
      state.lastSync = new Date();
    },

    removeIntegration: (state, action: PayloadAction<string>) => {
      const integrationId = action.payload;
      state.pendingOperations[integrationId] = state.integrations[integrationId];
      delete state.integrations[integrationId];
      state.error = null;
      state.lastSync = new Date();
    },

    setError: (state, action: PayloadAction<IntegrationError>) => {
      state.error = action.payload;
      
      // Rollback optimistic updates if there are pending operations
      if (Object.keys(state.pendingOperations).length > 0) {
        Object.entries(state.pendingOperations).forEach(([id, integration]) => {
          if (integration) {
            state.integrations[id] = integration;
          } else {
            delete state.integrations[id];
          }
        });
        state.pendingOperations = {};
      }
      
      state.loading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearPendingOperations: (state) => {
      state.pendingOperations = {};
    }
  }
});

// Export actions
export const {
  setLoading,
  setIntegrations,
  addIntegration,
  updateIntegration,
  removeIntegration,
  setError,
  clearError,
  clearPendingOperations
} = integrationsSlice.actions;

// Selectors
const selectIntegrationsState = (state: { integrations: IntegrationsState }) => state.integrations;

export const integrationsSelectors = {
  selectAllIntegrations: createSelector(
    selectIntegrationsState,
    (state) => Object.values(state.integrations)
  ),

  selectIntegrationById: createSelector(
    [selectIntegrationsState, (_, id: string) => id],
    (state, id) => state.integrations[id]
  ),

  selectIntegrationsByType: createSelector(
    [selectIntegrationsState, (_, type: IntegrationType) => type],
    (state, type) => Object.values(state.integrations).filter(
      integration => integration.type === type
    )
  ),

  selectActiveIntegrations: createSelector(
    selectIntegrationsState,
    (state) => Object.values(state.integrations).filter(
      integration => integration.status === IntegrationStatus.ACTIVE
    )
  ),

  selectIntegrationError: createSelector(
    selectIntegrationsState,
    (state) => state.error
  ),

  selectIsLoading: createSelector(
    selectIntegrationsState,
    (state) => state.loading
  ),

  selectLastSync: createSelector(
    selectIntegrationsState,
    (state) => state.lastSync
  ),

  selectHasPendingOperations: createSelector(
    selectIntegrationsState,
    (state) => Object.keys(state.pendingOperations).length > 0
  )
};

// Export reducer
export default integrationsSlice.reducer;