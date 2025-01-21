import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.x
import { useVirtualizer } from '@tanstack/react-virtual'; // v2.x

import {
  GridContainer
} from './IntegrationGrid.styles';
import { IntegrationCard } from '../../molecules/IntegrationCard/IntegrationCard';
import { useIntegration } from '../../../hooks/useIntegration';
import { useTheme } from '../../../hooks/useTheme';
import { IntegrationStatus } from '../../../types/integration.types';

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
  const { theme } = useTheme();
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    updateExistingIntegration,
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
    <div role="alert" aria-live="assertive" className="error-message">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary} className="retry-button">
        Try again
      </button>
    </div>
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
          <div
            aria-hidden="true"
            data-testid="loading-overlay"
            className="loading-overlay"
          />
        )}

        {error && (
          <div role="alert" aria-live="polite" className="error-message">
            {error.message}
            <button onClick={() => fetchIntegrations('', true)} className="retry-button">
              Retry
            </button>
          </div>
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