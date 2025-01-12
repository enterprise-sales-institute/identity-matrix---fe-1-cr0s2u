import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.x
import { useVirtualizer } from 'react-virtual'; // v2.x

import {
  GridContainer,
  LoadingOverlay,
  ErrorMessage,
  RetryButton
} from './IntegrationGrid.styles';
import { IntegrationCard } from '../../molecules/IntegrationCard/IntegrationCard';
import { useIntegration } from '../../../hooks/useIntegration';
import { useTheme } from '../../../hooks/useTheme';
import { Integration, IntegrationStatus } from '../../../types/integration.types';

interface IntegrationGridProps {
  /** Optional class name for styling */
  className?: string;
  /** Optional error callback for error tracking */
  onError?: (error: Error) => void;
  /** Optional retry interval in milliseconds */
  retryInterval?: number;
}

/**
 * A robust and accessible organism component that displays a responsive grid of CRM integration cards
 * Implements comprehensive error handling, theme support, and real-time status updates
 */
export const IntegrationGrid = React.memo<IntegrationGridProps>(({
  className,
  onError,
  retryInterval = 30000
}) => {
  // Theme and integration hooks
  const { theme } = useTheme();
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

  // Local state for virtualization
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Error handling callback
  const handleError = useCallback((error: Error) => {
    console.error('IntegrationGrid Error:', error);
    onError?.(error);
  }, [onError]);

  // Setup automatic refresh interval
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!loading) {
        fetchIntegrations('', true).catch(handleError);
      }
    }, retryInterval);

    return () => clearInterval(refreshInterval);
  }, [fetchIntegrations, loading, retryInterval, handleError]);

  // Integration action handlers
  const handleConnect = useCallback(async (integrationId: string) => {
    try {
      await updateExistingIntegration(integrationId, {
        status: IntegrationStatus.ACTIVE
      });
    } catch (error) {
      handleError(error as Error);
    }
  }, [updateExistingIntegration, handleError]);

  const handleDisconnect = useCallback(async (integrationId: string) => {
    try {
      await updateExistingIntegration(integrationId, {
        status: IntegrationStatus.INACTIVE
      });
    } catch (error) {
      handleError(error as Error);
    }
  }, [updateExistingIntegration, handleError]);

  const handleConfigure = useCallback(async (integrationId: string) => {
    try {
      await syncIntegrationData(integrationId, { force: true });
    } catch (error) {
      handleError(error as Error);
    }
  }, [syncIntegrationData, handleError]);

  // Virtualized grid setup
  const rowVirtualizer = useVirtualizer({
    count: integrations.length,
    getScrollElement: () => containerRef,
    estimateSize: () => 200, // Estimated card height
    overscan: 5
  });

  // Memoized grid items
  const virtualItems = useMemo(() => {
    return rowVirtualizer.getVirtualItems();
  }, [rowVirtualizer]);

  // Error fallback component
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <ErrorMessage role="alert" aria-live="assertive">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <RetryButton onClick={resetErrorBoundary}>
        Try again
      </RetryButton>
    </ErrorMessage>
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => fetchIntegrations('', true)}
    >
      <GridContainer
        ref={setContainerRef}
        className={className}
        role="grid"
        aria-busy={loading}
        aria-label="CRM Integrations"
        data-testid="integration-grid"
      >
        {loading && (
          <LoadingOverlay
            aria-hidden="true"
            data-testid="loading-overlay"
          />
        )}

        {error && (
          <ErrorMessage role="alert" aria-live="polite">
            {error.message}
            <RetryButton onClick={() => fetchIntegrations('', true)}>
              Retry
            </RetryButton>
          </ErrorMessage>
        )}

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualItems.map((virtualRow) => {
            const integration = integrations[virtualRow.index];
            return (
              <div
                key={integration.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <IntegrationCard
                  integration={integration}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onConfigure={handleConfigure}
                  aria-rowindex={virtualRow.index + 1}
                />
              </div>
            );
          })}
        </div>
      </GridContainer>
    </ErrorBoundary>
  );
});

IntegrationGrid.displayName = 'IntegrationGrid';

export default IntegrationGrid;