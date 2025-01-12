import React, { useCallback, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.0.0

// Internal imports
import DashboardLayout from '../../components/templates/DashboardLayout/DashboardLayout';
import IntegrationGrid from '../../components/organisms/IntegrationGrid/IntegrationGrid';
import { useIntegration } from '../../../hooks/useIntegration';

/**
 * IntegrationsPage component for managing CRM integrations
 * Implements real-time updates, enhanced error handling, and accessibility features
 */
const IntegrationsPage: React.FC = React.memo(() => {
  // Integration management hook
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    createNewIntegration,
    updateExistingIntegration,
    deleteExistingIntegration,
    syncIntegrationData
  } = useIntegration();

  // Ref for tracking component mount state
  const isMounted = useRef(true);

  // Status announcement ref for screen readers
  const statusRef = useRef<HTMLDivElement>(null);

  /**
   * Error handler for integration operations
   */
  const handleError = useCallback((error: Error) => {
    if (statusRef.current) {
      statusRef.current.textContent = `Error: ${error.message}`;
    }
    console.error('Integration operation failed:', error);
  }, []);

  /**
   * Connect integration handler with optimistic updates
   */
  const handleConnect = useCallback(async (integrationId: string) => {
    try {
      await createNewIntegration({
        id: integrationId,
        status: 'ACTIVE'
      });
      if (statusRef.current) {
        statusRef.current.textContent = 'Integration connected successfully';
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [createNewIntegration, handleError]);

  /**
   * Disconnect integration handler with confirmation
   */
  const handleDisconnect = useCallback(async (integrationId: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to disconnect this integration?');
      if (confirmed) {
        await deleteExistingIntegration(integrationId);
        if (statusRef.current) {
          statusRef.current.textContent = 'Integration disconnected successfully';
        }
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [deleteExistingIntegration, handleError]);

  /**
   * Configure integration handler with sync support
   */
  const handleConfigure = useCallback(async (integrationId: string) => {
    try {
      await syncIntegrationData(integrationId, { force: true });
      if (statusRef.current) {
        statusRef.current.textContent = 'Integration configuration updated';
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [syncIntegrationData, handleError]);

  /**
   * Initialize integrations data and cleanup
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchIntegrations();
      } catch (error) {
        handleError(error as Error);
      }
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchIntegrations, handleError]);

  /**
   * Error boundary fallback component
   */
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div role="alert" className="error-container">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );

  return (
    <DashboardLayout>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => fetchIntegrations()}
        onError={handleError}
      >
        <div
          role="main"
          aria-label="Integrations Management"
          className="integrations-page"
        >
          <div
            ref={statusRef}
            className="sr-only"
            role="status"
            aria-live="polite"
          />

          <header className="page-header">
            <h1>Integrations</h1>
            <p className="description">
              Manage your CRM integrations and data synchronization
            </p>
          </header>

          <IntegrationGrid
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onConfigure={handleConfigure}
            onError={handleError}
          />

          {loading && (
            <div
              role="progressbar"
              aria-busy="true"
              aria-label="Loading integrations"
              className="loading-indicator"
            />
          )}

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="error-message"
            >
              {error.message}
            </div>
          )}
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
});

// Display name for debugging
IntegrationsPage.displayName = 'IntegrationsPage';

export default IntegrationsPage;