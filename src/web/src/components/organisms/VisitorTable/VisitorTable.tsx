import React, { useState, useCallback, useMemo } from 'react';
import MaterialTable, { Column } from '@material-table/core'; // v5.x
import dayjs from 'dayjs'; // v1.11.x
import { debounce } from 'lodash'; // v4.x
import { ErrorBoundary } from 'react-error-boundary'; // v4.x

// Internal imports
import { Button } from '../../atoms/Button/Button';
import { useVisitorData } from '../../../hooks/useVisitorData';
import { Visitor, VisitorStatus, VisitorFilter } from '../../../types/visitor.types';

/**
 * Interface for VisitorTable component props
 */
interface VisitorTableProps {
  filter?: VisitorFilter;
  onVisitorSelect?: (visitor: Visitor) => void;
  onExport?: () => Promise<void>;
  pageSize?: number;
  showConnectionStatus?: boolean;
  virtualization?: boolean;
}

/**
 * Enhanced visitor table component with real-time updates and performance optimizations
 */
export const VisitorTable = React.memo<VisitorTableProps>(({
  filter,
  onVisitorSelect = () => {},
  onExport = async () => {},
  pageSize = 25,
  showConnectionStatus = true,
  virtualization = true
}) => {
  // Local state
  const [exportLoading, setExportLoading] = useState(false);

  // Hook for visitor data management
  const {
    visitors,
    loading,
    error,
    connectionStatus,
    fetchVisitors,
    selectVisitor,
    updateFilter,
    clearError
  } = useVisitorData(filter);

  /**
   * Table columns configuration with sorting and filtering
   */
  const columns = useMemo<Column<Visitor>[]>(() => [
    {
      title: 'Email',
      field: 'email',
      render: (rowData: Visitor) => rowData.email || 'Anonymous',
      width: '20%'
    },
    {
      title: 'Company',
      field: 'enrichedData.company',
      render: (rowData: Visitor) => rowData.enrichedData?.company || '-',
      width: '20%'
    },
    {
      title: 'Status',
      field: 'status',
      render: (rowData: Visitor) => (
        <span className={`status-badge status-${rowData.status.toLowerCase()}`}>
          {rowData.status}
        </span>
      ),
      width: '10%'
    },
    {
      title: 'Location',
      field: 'metadata.location',
      render: (rowData: Visitor) => (
        `${rowData.metadata.location.city}, ${rowData.metadata.location.country}`
      ),
      width: '15%'
    },
    {
      title: 'First Seen',
      field: 'firstSeen',
      render: (rowData: Visitor) => dayjs(rowData.firstSeen).format('MMM D, YYYY HH:mm'),
      defaultSort: 'desc',
      width: '15%'
    },
    {
      title: 'Last Seen',
      field: 'lastSeen',
      render: (rowData: Visitor) => dayjs(rowData.lastSeen).format('MMM D, YYYY HH:mm'),
      width: '15%'
    }
  ], []);

  /**
   * Debounced search handler for performance
   */
  const handleSearch = useMemo(
    () => debounce((searchText: string) => {
      updateFilter({ ...filter, search: searchText });
    }, 300),
    [filter, updateFilter]
  );

  /**
   * Handle row selection with callback
   */
  const handleRowClick = useCallback(((_: any, rowData: Visitor) => {
    selectVisitor(rowData.id);
    onVisitorSelect(rowData);
  }), [selectVisitor, onVisitorSelect]);

  /**
   * Handle export with loading state
   */
  const handleExport = async () => {
    try {
      setExportLoading(true);
      await onExport();
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Error fallback component
   */
  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="error-container">
      <h3>Something went wrong:</h3>
      <pre>{error.message}</pre>
      <Button variant="secondary" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={clearError}
    >
      <div className="visitor-table-container">
        {showConnectionStatus && (
          <div className={`connection-status connection-status-${connectionStatus}`}>
            {connectionStatus === 'connected' ? 'Real-time updates active' : 'Connecting...'}
          </div>
        )}

        <MaterialTable
          columns={columns}
          data={visitors}
          title="Visitors"
          isLoading={loading}
          options={{
            pageSize,
            pageSizeOptions: [10, 25, 50, 100],
            sorting: true,
            filtering: true,
            headerStyle: {
              fontWeight: 'bold'
            },
            rowStyle: (rowData: Visitor) => ({
              backgroundColor: rowData.status === VisitorStatus.IDENTIFIED ? '#f3f9ff' : 'inherit'
            }),
            maxBodyHeight: 'calc(100vh - 300px)',
            virtualScroll: virtualization,
            debounceInterval: 500,
            searchAutoFocus: false
          }}
          onRowClick={handleRowClick}
          onSearchChange={handleSearch}
          actions={[
            {
              icon: 'refresh',
              tooltip: 'Refresh Data',
              isFreeAction: true,
              onClick: fetchVisitors
            },
            {
              icon: 'download',
              tooltip: 'Export Data',
              isFreeAction: true,
              disabled: exportLoading,
              onClick: handleExport
            }
          ]}
          localization={{
            body: {
              emptyDataSourceMessage: 'No visitors to display',
              filterRow: {
                filterPlaceHolder: 'Filter',
                filterTooltip: 'Filter'
              }
            },
            toolbar: {
              searchPlaceholder: 'Search visitors...',
              exportTitle: 'Export'
            }
          }}
        />

        {error && (
          <div className="error-message">
            {error}
            <Button variant="text" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

VisitorTable.displayName = 'VisitorTable';

export default VisitorTable;