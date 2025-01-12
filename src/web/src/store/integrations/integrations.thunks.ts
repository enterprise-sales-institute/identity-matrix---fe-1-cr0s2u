/**
 * Redux thunk actions for CRM integration operations
 * @version 1.0.0
 */

// External imports
import { createAsyncThunk } from '@reduxjs/toolkit'; // @version 1.9.x
import retry from 'axios-retry'; // @version 3.x

// Internal imports
import IntegrationService from '../../services/integration.service';
import { 
  setIntegrations, 
  addIntegration, 
  updateIntegration, 
  removeIntegration, 
  setError, 
  setLoading, 
  clearError 
} from './integrations.slice';
import { 
  Integration, 
  IntegrationCreatePayload, 
  IntegrationUpdatePayload, 
  IntegrationStatus 
} from '../../types/integration.types';
import { UserRole } from '../../types/auth.types';

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Fetch all integrations for a company
 */
export const fetchIntegrations = createAsyncThunk(
  'integrations/fetchIntegrations',
  async (companyId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      // Configure retry strategy
      retry(IntegrationService.instance, {
        retries: MAX_RETRIES,
        retryDelay: (retryCount) => retryCount * RETRY_DELAY,
        retryCondition: (error) => {
          return retry.isNetworkOrIdempotentRequestError(error) || 
                 error.response?.status === 429;
        }
      });

      const integrations = await IntegrationService.getIntegrations(companyId);
      dispatch(setIntegrations(integrations));
      return integrations;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        details: error.response?.data
      }));
      return rejectWithValue(error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Create new CRM integration
 */
export const createIntegration = createAsyncThunk(
  'integrations/createIntegration',
  async (payload: IntegrationCreatePayload, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      const integration = await IntegrationService.createIntegration(payload);
      dispatch(addIntegration(integration));
      return integration;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        details: error.response?.data
      }));
      return rejectWithValue(error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Update existing integration
 */
export const updateIntegrationThunk = createAsyncThunk(
  'integrations/updateIntegration',
  async ({ 
    integrationId, 
    payload 
  }: { 
    integrationId: string; 
    payload: IntegrationUpdatePayload 
  }, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      const integration = await IntegrationService.updateIntegration(
        integrationId,
        payload
      );
      dispatch(updateIntegration(integration));
      return integration;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        integrationId,
        details: error.response?.data
      }));
      return rejectWithValue(error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Delete integration
 */
export const deleteIntegration = createAsyncThunk(
  'integrations/deleteIntegration',
  async (integrationId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      await IntegrationService.deleteIntegration(integrationId);
      dispatch(removeIntegration(integrationId));
      return integrationId;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        integrationId,
        details: error.response?.data
      }));
      return rejectWithValue(error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Sync integration data
 */
export const syncIntegration = createAsyncThunk(
  'integrations/syncIntegration',
  async ({ 
    integrationId, 
    force = false 
  }: { 
    integrationId: string; 
    force?: boolean 
  }, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      const result = await IntegrationService.syncIntegration(integrationId, { force });
      
      // Update integration status based on sync result
      dispatch(updateIntegration({
        ...getState().integrations.integrations[integrationId],
        status: result.status === 'success' ? 
          IntegrationStatus.ACTIVE : 
          IntegrationStatus.ERROR,
        lastSyncAt: new Date()
      }));

      return result;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        integrationId,
        details: error.response?.data
      }));
      return rejectWithValue(error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Verify integration connection
 */
export const verifyIntegration = createAsyncThunk(
  'integrations/verifyIntegration',
  async (integrationId: string, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(clearError());
      dispatch(setLoading(true));

      const isValid = await IntegrationService.verifyIntegration(integrationId);
      
      if (isValid) {
        dispatch(updateIntegration({
          ...getState().integrations.integrations[integrationId],
          status: IntegrationStatus.ACTIVE
        }));
      }

      return isValid;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        integrationId,
        details: error.response?.data
      }));
      return rejectWithValue(error.response?.data);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Retry failed integration operation
 */
export const retryIntegrationOperation = createAsyncThunk(
  'integrations/retryOperation',
  async ({ 
    integrationId, 
    operationType 
  }: { 
    integrationId: string; 
    operationType: string 
  }, { dispatch }) => {
    try {
      dispatch(clearError());
      const result = await IntegrationService.retryOperation(
        integrationId, 
        operationType
      );
      return result;
    } catch (error: any) {
      dispatch(setError({
        code: error.response?.status || 'UNKNOWN',
        message: error.message,
        integrationId,
        details: error.response?.data
      }));
      throw error;
    }
  }
);