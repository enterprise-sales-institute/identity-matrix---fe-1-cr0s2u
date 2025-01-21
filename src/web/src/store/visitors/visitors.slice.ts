// @reduxjs/toolkit version 1.9.x
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Visitor, VisitorFilter } from '../../types/visitor.types';

/**
 * Interface defining the complete state structure for the visitors slice
 * @interface VisitorsState
 */
interface VisitorsState {
    visitors: Visitor[];
    selectedVisitor: Visitor | null;
    total: number;
    loading: boolean;
    error: string | null;
    filter: VisitorFilter;
    currentPage: number;
    pageSize: number;
    isUpdating: boolean;
    optimisticUpdates: Record<string, Visitor>;
}

/**
 * Initial state for the visitors slice with default values
 */
const initialState: VisitorsState = {
    visitors: [],
    selectedVisitor: null,
    total: 0,
    loading: false,
    error: null,
    filter: {
        status: [],
        dateRange: {
            start: '',
            end: ''
        },
        search: ''
    },
    currentPage: 1,
    pageSize: 25,
    isUpdating: false,
    optimisticUpdates: {}
};

/**
 * Redux slice for managing visitor state with comprehensive actions and reducers
 */
export const visitorsSlice = createSlice({
    name: 'visitors',
    initialState,
    reducers: {
        setVisitors: (state, action: PayloadAction<{ visitors: Visitor[]; total: number }>) => {
            state.visitors = action.payload.visitors;
            state.total = action.payload.total;
            state.loading = false;
            state.error = null;
        },

        setFilter: (state, action: PayloadAction<VisitorFilter>) => {
            state.filter = action.payload;
            state.currentPage = 1;
            state.loading = true;
            state.error = null;
        },

        setSelectedVisitor: (state, action: PayloadAction<Visitor | null>) => {
            const visitor = action.payload;
            if (visitor && visitor.id in state.optimisticUpdates) {
                state.selectedVisitor = state.optimisticUpdates[visitor.id];
            } else {
                state.selectedVisitor = visitor;
            }
            state.error = null;
        },

        updateVisitor: (state, action: PayloadAction<Visitor>) => {
            const updatedVisitor = action.payload;
            state.optimisticUpdates[updatedVisitor.id] = updatedVisitor;
            state.isUpdating = true;

            // Update in visitors array
            const index = state.visitors.findIndex(v => v.id === updatedVisitor.id);
            if (index !== -1) {
                state.visitors[index] = updatedVisitor;
            }

            // Update selected visitor if it matches
            if (state.selectedVisitor?.id === updatedVisitor.id) {
                state.selectedVisitor = updatedVisitor;
            }
        },

        updateVisitorSuccess: (state, action: PayloadAction<string>) => {
            const visitorId = action.payload;
            delete state.optimisticUpdates[visitorId];
            state.isUpdating = false;
            state.error = null;
        },

        updateVisitorFailure: (state, action: PayloadAction<{ visitorId: string; error: string }>) => {
            const { visitorId, error } = action.payload;
            const originalVisitor = state.visitors.find(v => v.id === visitorId);
            
            if (originalVisitor) {
                // Rollback changes
                const index = state.visitors.findIndex(v => v.id === visitorId);
                if (index !== -1) {
                    state.visitors[index] = originalVisitor;
                }
                
                if (state.selectedVisitor?.id === visitorId) {
                    state.selectedVisitor = originalVisitor;
                }
            }

            delete state.optimisticUpdates[visitorId];
            state.isUpdating = false;
            state.error = error;
        },

        setPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
            state.loading = true;
            state.error = null;
        },

        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
            state.currentPage = 1;
            state.loading = true;
            state.error = null;
        },

        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

// Export actions
export const {
    setVisitors,
    setFilter,
    setSelectedVisitor,
    updateVisitor,
    updateVisitorSuccess,
    updateVisitorFailure,
    setPage,
    setPageSize,
    setLoading,
    setError
} = visitorsSlice.actions;

// Memoized selectors
export const selectVisitors = (state: { visitors: VisitorsState }) => state.visitors.visitors;
export const selectSelectedVisitor = (state: { visitors: VisitorsState }) => state.visitors.selectedVisitor;
export const selectVisitorsTotal = (state: { visitors: VisitorsState }) => state.visitors.total;
export const selectVisitorsLoading = (state: { visitors: VisitorsState }) => state.visitors.loading;
export const selectVisitorsError = (state: { visitors: VisitorsState }) => state.visitors.error;
export const selectVisitorsFilter = (state: { visitors: VisitorsState }) => state.visitors.filter;
export const selectVisitorsPage = (state: { visitors: VisitorsState }) => state.visitors.currentPage;
export const selectVisitorsPageSize = (state: { visitors: VisitorsState }) => state.visitors.pageSize;
export const selectVisitorsIsUpdating = (state: { visitors: VisitorsState }) => state.visitors.isUpdating;

// Export reducer
export default visitorsSlice.reducer;