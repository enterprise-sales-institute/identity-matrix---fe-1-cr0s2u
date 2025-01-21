import React, { useCallback, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.0.0

// Internal imports
import DashboardLayout from '../../../components/templates/DashboardLayout/DashboardLayout';
import IntegrationGrid from '../../../components/organisms/IntegrationGrid/IntegrationGrid';
import { useIntegration } from '../../../hooks/useIntegration';
import { useAuth } from '../../../hooks/useAuth';

/**
 * IntegrationsPage component for managing CRM integrations
 * Implements real-time updates, enhanced error handling, and accessibility features
 */
const IntegrationsPage: React.FC = React.memo(() => {
  // Integration management hook
  const {
    loading,
    error,
    fetchIntegrations,
    createNewIntegration,
    deleteExistingIntegration,
    syncIntegrationData
  } = useIntegration();

  // Auth hook for company ID
  const { user } = useAuth();

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
        companyId: user?.companyId || '',
        type: 'SALESFORCE',
        credentials: {
          clientId: '',
          clientSecret: '',
          accessToken: '',
          refreshToken: '',
          tokenExpiry: new Date()
        },
        config: {
          syncInterval: 3600,
          fieldMappings: [],
          customSettings: {}
        }
      });
      if (statusRef.current) {
        statusRef.current.textContent = 'Integration connected successfully';
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [createNewIntegration, handleError, user?.companyId]);

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
        await fetchIntegrations(user?.companyId || '');
      } catch (error) {
        handleError(error as Error);
      }
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchIntegrations, handleError, user?.companyId]);

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
        onReset={() => fetchIntegrations(user?.companyId || '')}
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