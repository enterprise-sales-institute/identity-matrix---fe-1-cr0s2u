// @reduxjs/toolkit version 1.9.x
import { createAsyncThunk } from '@reduxjs/toolkit';

// Internal imports
import { 
  setVisitors, 
  setLoading, 
  setError, 
  setSelectedVisitor,
  updateVisitor as updateVisitorAction,
  updateVisitorSuccess,
  updateVisitorFailure
} from './visitors.slice';
import VisitorService from '../../services/visitor.service';
import { Visitor, VisitorFilter } from '../../types/visitor.types';

/**
 * Async thunk for fetching visitors with filtering, caching, and real-time updates
 */
export const fetchVisitors = createAsyncThunk(
  'visitors/fetchVisitors',
  async (filter: VisitorFilter, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // Fetch visitors with caching enabled
      const visitors = await VisitorService.getVisitors(filter, true);

      // Update state with fetched visitors
      dispatch(setVisitors({
        visitors,
        total: visitors.length
      }));

      return visitors;
    } catch (error: any) {
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Async thunk for fetching a single visitor by ID with real-time updates
 */
export const fetchVisitorById = createAsyncThunk(
  'visitors/fetchVisitorById',
  async (visitorId: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // Fetch single visitor
      const visitor = await VisitorService.getVisitorById(visitorId);

      // Update selected visitor in state
      dispatch(setSelectedVisitor(visitor));

      return visitor;
    } catch (error: any) {
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Async thunk for fetching company visitors with pagination and real-time updates
 */
export const fetchVisitorsByCompany = createAsyncThunk(
  'visitors/fetchVisitorsByCompany',
  async (
    { companyId, filter }: { companyId: string; filter: VisitorFilter },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      dispatch(setLoading(true));

      // Get current page and page size from state
      const state = getState() as any;
      const currentPage = state.visitors.currentPage;
      const pageSize = state.visitors.pageSize;

      // Fetch company visitors with pagination
      const response = await VisitorService.getVisitorsByCompany(
        companyId,
        currentPage,
        pageSize
      );

      // Update state with company visitors
      dispatch(setVisitors({
        visitors: response.visitors,
        total: response.total
      }));

      return response.visitors;
    } catch (error: any) {
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Async thunk for optimistic visitor updates with rollback support
 */
export const updateVisitor = createAsyncThunk(
  'visitors/updateVisitor',
  async (visitor: Visitor, { dispatch, rejectWithValue }) => {
    try {
      // Optimistically update the visitor in state
      dispatch(updateVisitorAction(visitor));

      // Attempt to update on the server
      const updatedVisitor = await VisitorService.updateVisitor(visitor);

      // Confirm successful update
      dispatch(updateVisitorSuccess(visitor.id));

      return updatedVisitor;
    } catch (error: any) {
      // Rollback optimistic update on failure
      dispatch(updateVisitorFailure({
        visitorId: visitor.id,
        error: error.message
      }));
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Async thunk for exporting visitor data with progress tracking
 */
export const exportVisitors = createAsyncThunk(
  'visitors/exportVisitors',
  async (
    { filter, format }: { filter: VisitorFilter; format: 'csv' | 'xlsx' },
    { dispatch, rejectWithValue }
  ) => {
    try {
      dispatch(setLoading(true));

      // Export visitor data
      const blob = await VisitorService.exportVisitors(filter, format);

      // Create download URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visitors-export-${new Date().toISOString()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error: any) {
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Async thunk for searching visitors with debouncing
 */
export const searchVisitors = createAsyncThunk(
  'visitors/searchVisitors',
  async (query: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));

      // Search visitors with debouncing
      const visitors = await VisitorService.searchVisitors(query);

      // Update state with search results
      dispatch(setVisitors({
        visitors,
        total: visitors.length
      }));

      return visitors;
    } catch (error: any) {
      dispatch(setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }
);