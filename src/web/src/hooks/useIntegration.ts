/**
 * Advanced React hook for managing CRM integrations with comprehensive error handling and optimistic updates
 * @version 1.0.0
 */

// External imports - version controlled
import { useCallback } from 'react'; // react@18.x
import { useDispatch, useSelector } from 'react-redux'; // react-redux@8.x

// Internal imports
import integrationService from '../services/integration.service';
import { IntegrationCreatePayload, IntegrationUpdatePayload } from '../types/integration.types';
import {
  setLoading,
  setIntegrations,
  addIntegration,
  updateIntegration,
  removeIntegration,
  setError,
  clearError,
  integrationsSelectors
} from '../store/integrations/integrations.slice';

/**
 * Custom hook for managing CRM integrations with enhanced error handling and optimistic updates
 */
export const useIntegration = () => {
  const dispatch = useDispatch();
  
  // Selectors with memoization
  const integrations = useSelector(integrationsSelectors.selectAllIntegrations);
  const loading = useSelector(integrationsSelectors.selectIsLoading);
  const error = useSelector(integrationsSelectors.selectIntegrationError);
  const lastSync = useSelector(integrationsSelectors.selectLastSync);
  const hasPendingOperations = useSelector(integrationsSelectors.selectHasPendingOperations);

  /**
   * Fetches all integrations for the company
   */
  const fetchIntegrations = useCallback(async (companyId: string, forceRefresh = false) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const data = await integrationService.getIntegrations(companyId, forceRefresh);
      dispatch(setIntegrations(data));
    } catch (error: any) {
      dispatch(setError({
        code: 'FETCH_ERROR',
        message: error.message,
        details: { companyId }
      }));
    }
  }, [dispatch]);

  /**
   * Fetches a single integration by ID
   */
  const fetchIntegrationById = useCallback(async (integrationId: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const integration = await integrationService.getIntegrationById(integrationId);
      dispatch(updateIntegration(integration));
      return integration;
    } catch (error: any) {
      dispatch(setError({
        code: 'FETCH_BY_ID_ERROR',
        message: error.message,
        integrationId,
        details: { integrationId }
      }));
      return null;
    }
  }, [dispatch]);

  /**
   * Creates a new integration with optimistic update
   */
  const createNewIntegration = useCallback(async (payload: IntegrationCreatePayload) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const integration = await integrationService.createIntegration(payload);
      dispatch(addIntegration(integration));
      return integration;
    } catch (error: any) {
      dispatch(setError({
        code: 'CREATE_ERROR',
        message: error.message,
        details: { payload }
      }));
      return null;
    }
  }, [dispatch]);

  /**
   * Updates an existing integration with optimistic update
   */
  const updateExistingIntegration = useCallback(async (
    integrationId: string,
    payload: IntegrationUpdatePayload
  ) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const integration = await integrationService.updateIntegration(integrationId, payload);
      dispatch(updateIntegration(integration));
      return integration;
    } catch (error: any) {
      dispatch(setError({
        code: 'UPDATE_ERROR',
        message: error.message,
        integrationId,
        details: { payload }
      }));
      return null;
    }
  }, [dispatch]);

  /**
   * Deletes an integration with optimistic update
   */
  const deleteExistingIntegration = useCallback(async (integrationId: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      dispatch(removeIntegration(integrationId)); // Optimistic update
      await integrationService.deleteIntegration(integrationId);
      return true;
    } catch (error: any) {
      dispatch(setError({
        code: 'DELETE_ERROR',
        message: error.message,
        integrationId,
        details: { integrationId }
      }));
      return false;
    }
  }, [dispatch]);

  /**
   * Tests integration connection with error handling
   */
  const testConnection = useCallback(async (integrationId: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const isValid = await integrationService.testIntegrationConnection(integrationId);
      return isValid;
    } catch (error: any) {
      dispatch(setError({
        code: 'TEST_CONNECTION_ERROR',
        message: error.message,
        integrationId,
        details: { integrationId }
      }));
      return false;
    }
  }, [dispatch]);

  /**
   * Triggers integration sync with progress tracking
   */
  const syncIntegrationData = useCallback(async (
    integrationId: string,
    options = { force: false }
  ) => {
    try {
      dispatch(setLoading(true));
      dispatch(clearError());
      
      const result = await integrationService.syncIntegration(integrationId, options);
      if (result.status === 'success') {
        const updatedIntegration = await integrationService.getIntegrationById(integrationId);
        dispatch(updateIntegration(updatedIntegration));
      }
      return result;
    } catch (error: any) {
      dispatch(setError({
        code: 'SYNC_ERROR',
        message: error.message,
        integrationId,
        details: { options }
      }));
      return null;
    }
  }, [dispatch]);

  return {
    // State
    integrations,
    loading,
    error,
    lastSync,
    hasPendingOperations,
    
    // Methods
    fetchIntegrations,
    fetchIntegrationById,
    createNewIntegration,
    updateExistingIntegration,
    deleteExistingIntegration,
    testConnection,
    syncIntegrationData
  };
};

export default useIntegration;