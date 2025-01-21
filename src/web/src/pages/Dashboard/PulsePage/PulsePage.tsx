import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { debounce } from 'lodash'; // v4.17.21
import { ErrorBoundary } from 'react-error-boundary'; // v4.0.11

// Internal imports
import DashboardLayout from '../../../components/templates/DashboardLayout/DashboardLayout';
import VisitorTable from '../../../components/organisms/VisitorTable/VisitorTable';
import { useVisitorData } from '../../../hooks/useVisitorData';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { Visitor, VisitorFilter } from '../../../types/visitor.types';

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: any) => void;
  }
}

/**
 * PulsePage component for real-time visitor tracking and lead generation
 * Implements WCAG 2.1 Level AA compliance with performance optimizations
 * @version 1.0.0
 */
const PulsePage: React.FC = React.memo(() => {
  // State management
  const [filter, setFilter] = useState<VisitorFilter>({
    status: [],
    dateRange: {
      start: '',
      end: ''
    },
    search: ''
  });

  // Custom hooks for data management
  const {
    connectionStatus,
    fetchVisitors,
    selectVisitor,
    updateFilter,
    clearError
  } = useVisitorData(filter);

  const { subscribe, unsubscribe } = useWebSocket();

  /**
   * Debounced filter handler for performance optimization
   */
  const handleFilterChange = useMemo(
    () => debounce((newFilter: VisitorFilter) => {
      setFilter(newFilter);
      updateFilter(newFilter);
    }, 300),
    [updateFilter]
  );

  /**
   * Handle visitor selection with analytics tracking
   */
  const handleVisitorSelect = useCallback((visitor: Visitor) => {
    selectVisitor(visitor.id);
    // Track selection in analytics
    if (window.gtag) {
      window.gtag('event', 'visitor_select', {
        visitor_id: visitor.id,
        visitor_status: visitor.status
      });
    }
  }, [selectVisitor]);

  /**
   * Handle data export with progress tracking
   */
  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/visitors/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filter })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitors-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Track export in analytics
      if (window.gtag) {
        window.gtag('event', 'visitor_export', {
          filter_criteria: JSON.stringify(filter),
          total_records: 0
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [filter]);

  /**
   * Setup real-time updates subscription
   */
  useEffect(() => {
    const handleVisitorActivity = (data: any) => {
      if (data.type === 'visitor_update') {
        fetchVisitors();
      }
    };

    subscribe('visitor:activity', handleVisitorActivity, {
      batchSize: 10,
      batchInterval: 300
    });

    return () => {
      unsubscribe('visitor:activity', handleVisitorActivity);
    };
  }, [subscribe, unsubscribe, fetchVisitors]);

  /**
   * Error fallback component
   */
  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div 
      role="alert"
      className="error-container"
      aria-live="polite"
    >
      <h3>Something went wrong:</h3>
      <pre>{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="retry-button"
      >
        Try again
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={clearError}
      >
        <div 
          className="pulse-page"
          role="main"
          aria-label="Visitor tracking dashboard"
        >
          <header className="pulse-header">
            <h1>Pulse</h1>
            <div 
              className="connection-status"
              aria-live="polite"
            >
              {connectionStatus === 'connected' ? (
                <span className="status-connected">Real-time updates active</span>
              ) : (
                <span className="status-disconnected">Connecting...</span>
              )}
            </div>
          </header>

          <main className="pulse-content">
            <VisitorTable
              filter={filter}
              onVisitorSelect={handleVisitorSelect}
              onExport={handleExport}
              pageSize={25}
              enableRealtime={true}
              showConnectionStatus={true}
              virtualization={true}
            />
          </main>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
});

// Display name for debugging
PulsePage.displayName = 'PulsePage';

export default PulsePage;