/**
 * @fileoverview Redux selectors for accessing visitor state data with memoization
 * @version 1.0.0
 * @license MIT
 */

import { createSelector } from '@reduxjs/toolkit'; // v1.9.x
import type { RootState } from '../index';
import type { Visitor, VisitorFilter } from '../../types/visitor.types';

/**
 * Base selector to access the visitors slice of the Redux store
 */
export const selectVisitorsState = (state: RootState) => state.visitors;

/**
 * Memoized selector to get the complete list of visitors with applied filters
 * Optimized for performance with memoization of filter operations
 */
export const selectVisitors = createSelector(
  [selectVisitorsState],
  (visitorsState) => {
    const { visitors, optimisticUpdates } = visitorsState;
    
    // Apply any pending optimistic updates
    return visitors.map(visitor => 
      optimisticUpdates[visitor.id] || visitor
    );
  }
);

/**
 * Memoized selector to get the currently selected visitor
 * Includes any pending optimistic updates
 */
export const selectSelectedVisitor = createSelector(
  [selectVisitorsState],
  (visitorsState) => {
    const { selectedVisitor, optimisticUpdates } = visitorsState;
    if (!selectedVisitor) return null;
    
    return optimisticUpdates[selectedVisitor.id] || selectedVisitor;
  }
);

/**
 * Memoized selector to get the current visitor filter settings
 * Ensures type safety for filter operations
 */
export const selectVisitorFilter = createSelector(
  [selectVisitorsState],
  (visitorsState): VisitorFilter => visitorsState.filter
);

/**
 * Memoized selector to get the total number of visitors
 * Used for pagination calculations
 */
export const selectVisitorsTotal = createSelector(
  [selectVisitorsState],
  (visitorsState): number => visitorsState.total
);

/**
 * Memoized selector to get the current loading state
 * Used to show loading indicators in the UI
 */
export const selectVisitorsLoading = createSelector(
  [selectVisitorsState],
  (visitorsState): boolean => visitorsState.loading
);

/**
 * Memoized selector to get any current error state
 * Used for error handling and display
 */
export const selectVisitorsError = createSelector(
  [selectVisitorsState],
  (visitorsState): string | null => visitorsState.error
);

/**
 * Memoized selector to get pagination information
 * Returns current page and page size for pagination controls
 */
export const selectVisitorsPagination = createSelector(
  [selectVisitorsState],
  (visitorsState) => ({
    currentPage: visitorsState.currentPage,
    pageSize: visitorsState.pageSize,
    total: visitorsState.total
  })
);

/**
 * Memoized selector to check if any optimistic updates are pending
 * Used to manage loading states during updates
 */
export const selectHasOptimisticUpdates = createSelector(
  [selectVisitorsState],
  (visitorsState): boolean => Object.keys(visitorsState.optimisticUpdates).length > 0
);

/**
 * Memoized selector to get filtered visitors based on current filter
 * Applies search, status, and date range filters with memoization
 */
export const selectFilteredVisitors = createSelector(
  [selectVisitors, selectVisitorFilter],
  (visitors, filter): Visitor[] => {
    return visitors.filter(visitor => {
      // Apply status filter
      if (filter.status.length && !filter.status.includes(visitor.status)) {
        return false;
      }
      
      // Apply date range filter
      if (filter.dateRange.start || filter.dateRange.end) {
        const visitorDate = new Date(visitor.lastSeen);
        if (filter.dateRange.start && visitorDate < new Date(filter.dateRange.start)) {
          return false;
        }
        if (filter.dateRange.end && visitorDate > new Date(filter.dateRange.end)) {
          return false;
        }
      }
      
      // Apply search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          visitor.email?.toLowerCase().includes(searchLower) ||
          visitor.enrichedData?.company?.toLowerCase().includes(searchLower) ||
          visitor.metadata.location.country.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }
);