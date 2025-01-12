/**
 * Custom React hook for managing visitor data with real-time updates and optimized performance
 * @version 1.0.0
 * @description Provides centralized visitor data management with Redux integration,
 * WebSocket support, and optimized performance through caching and memoization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash'; // v4.17.x

// Internal imports
import visitorService from '../services/visitor.service';
import { useWebSocket } from './useWebSocket';
import { Visitor, VisitorFilter } from '../types/visitor.types';
import { 
  setVisitors, 
  setSelectedVisitor,
  updateVisitor,
  updateVisitorSuccess,
  updateVisitorFailure,
  setLoading,
  setError,
  selectVisitors,
  selectSelectedVisitor,
  selectVisitorsLoading,
  selectVisitorsError,
  selectVisitorsTotal
} from '../store/visitors/visitors.slice';

// Constants for performance optimization
const DEBOUNCE_DELAY = 300; // 300ms delay for filter updates
const CACHE_DURATION = 60000; // 1 minute cache duration
const BATCH_SIZE = 10; // Number of updates to batch

/**
 * Enhanced visitor data hook with real-time updates and performance optimization
 */
export const useVisitorData = (initialFilter?: VisitorFilter) => {
  const dispatch = useDispatch();
  
  // Redux selectors with memoization
  const visitors = useSelector(selectVisitors);
  const selectedVisitor = useSelector(selectSelectedVisitor);
  const loading = useSelector(selectVisitorsLoading);
  const error = useSelector(selectVisitorsError);
  const total = useSelector(selectVisitorsTotal);

  // Local state for filter management
  const [filter, setFilter] = useState<VisitorFilter>(initialFilter || {
    status: [],
    dateRange: {
      start: '',
      end: ''
    },
    search: ''
  });

  // WebSocket integration
  const { subscribe, unsubscribe, connectionStatus } = useWebSocket();

  /**
   * Fetch visitors with caching and error handling
   */
  const fetchVisitors = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const visitors = await visitorService.getVisitors(filter);
      dispatch(setVisitors({ visitors, total: visitors.length }));
    } catch (error: any) {
      dispatch(setError(error.message));
      console.error('Error fetching visitors:', error);
    }
  }, [dispatch, filter]);

  /**
   * Debounced filter update handler
   */
  const updateFilter = useMemo(
    () => debounce((newFilter: VisitorFilter) => {
      setFilter(newFilter);
    }, DEBOUNCE_DELAY),
    []
  );

  /**
   * Select specific visitor with activity data
   */
  const selectVisitor = useCallback(async (visitorId: string) => {
    try {
      dispatch(setLoading(true));
      const visitor = await visitorService.getVisitorById(visitorId);
      const activities = await visitorService.getVisitorActivity(visitorId);
      
      dispatch(setSelectedVisitor({
        ...visitor,
        activities
      }));
    } catch (error: any) {
      dispatch(setError(error.message));
      console.error('Error selecting visitor:', error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * Handle real-time visitor updates with optimistic updates
   */
  const handleVisitorUpdate = useCallback((updatedVisitor: Visitor) => {
    dispatch(updateVisitor(updatedVisitor));
    
    // Verify update with backend
    visitorService.getVisitorById(updatedVisitor.id)
      .then(() => {
        dispatch(updateVisitorSuccess(updatedVisitor.id));
      })
      .catch((error) => {
        dispatch(updateVisitorFailure({
          visitorId: updatedVisitor.id,
          error: error.message
        }));
      });
  }, [dispatch]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  /**
   * Setup WebSocket subscriptions and cleanup
   */
  useEffect(() => {
    const handleVisitorActivity = (data: any) => {
      if (data.companyId === selectedVisitor?.companyId) {
        handleVisitorUpdate(data.visitor);
      }
    };

    subscribe('visitor:activity', handleVisitorActivity, {
      batchSize: BATCH_SIZE,
      batchInterval: DEBOUNCE_DELAY
    });

    return () => {
      unsubscribe('visitor:activity', handleVisitorActivity);
    };
  }, [subscribe, unsubscribe, selectedVisitor, handleVisitorUpdate]);

  /**
   * Fetch visitors when filter changes
   */
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors, filter]);

  /**
   * Performance monitoring for slow operations
   */
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 100) {
        console.warn(`Visitor data operation took ${duration}ms`);
      }
    };
  }, [visitors]);

  return {
    visitors,
    selectedVisitor,
    loading,
    error,
    total,
    connectionStatus,
    fetchVisitors,
    selectVisitor,
    updateFilter,
    clearError
  };
};

export type UseVisitorDataReturn = ReturnType<typeof useVisitorData>;