/**
 * Visitor Service for Identity Matrix web application
 * @version 1.0.0
 * @description Handles visitor-related API operations with enhanced security, caching, and performance optimizations
 */

// External imports
import { debounce } from 'lodash'; // lodash@4.x

// Internal imports
import ApiService from './api.service';
import { Visitor, VisitorFilter } from '../types/visitor.types';
import { API_ENDPOINTS } from '../constants/api.constants';

// Constants
const CACHE_DURATION = 300000; // 5 minutes
const REQUEST_TIMEOUT = 5000; // 5 seconds
const DEBOUNCE_DELAY = 300; // 300ms for search debouncing

/**
 * Interface for paginated visitor response
 */
interface VisitorResponse {
  visitors: Visitor[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Interface for visitor cache entry
 */
interface VisitorCacheEntry {
  data: Visitor[];
  timestamp: number;
}

/**
 * Enhanced Visitor Service with caching and performance optimizations
 */
class VisitorService {
  private static instance: VisitorService;
  private cache: Map<string, VisitorCacheEntry>;
  private apiInstance;

  private constructor() {
    this.cache = new Map();
    this.apiInstance = ApiService.instance;
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): VisitorService {
    if (!VisitorService.instance) {
      VisitorService.instance = new VisitorService();
    }
    return VisitorService.instance;
  }

  /**
   * Retrieve visitors with filtering, caching, and performance optimization
   * @param filter - Visitor filtering criteria
   * @param useCache - Whether to use cached data
   */
  public async getVisitors(filter: VisitorFilter, useCache: boolean = true): Promise<Visitor[]> {
    try {
      const cacheKey = this.createCacheKey(filter);

      // Check cache if enabled
      if (useCache) {
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) return cachedData;
      }

      const response = await this.apiInstance.get<VisitorResponse>(
        API_ENDPOINTS.VISITORS.BASE,
        {
          params: this.buildQueryParams(filter),
          timeout: REQUEST_TIMEOUT
        }
      );

      const visitors = response.data.visitors;
      this.cacheData(cacheKey, visitors);

      return visitors;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieve visitor by ID with enrichment data
   * @param id - Visitor identifier
   */
  public async getVisitorById(id: string): Promise<Visitor> {
    try {
      const response = await this.apiInstance.get<Visitor>(
        API_ENDPOINTS.VISITORS.BY_ID.replace(':id', id)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieve visitors by company with pagination
   * @param companyId - Company identifier
   * @param page - Page number
   * @param pageSize - Items per page
   */
  public async getVisitorsByCompany(
    companyId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<VisitorResponse> {
    try {
      const response = await this.apiInstance.get<VisitorResponse>(
        API_ENDPOINTS.VISITORS.BY_COMPANY.replace(':companyId', companyId),
        {
          params: { page, pageSize }
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Retrieve visitor activity history
   * @param visitorId - Visitor identifier
   */
  public async getVisitorActivity(visitorId: string): Promise<any[]> {
    try {
      const response = await this.apiInstance.get(
        API_ENDPOINTS.VISITORS.ACTIVITY.replace(':id', visitorId)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search visitors with debouncing
   */
  public searchVisitors = debounce(
    async (query: string): Promise<Visitor[]> => {
      try {
        const response = await this.apiInstance.get<VisitorResponse>(
          API_ENDPOINTS.VISITORS.SEARCH,
          {
            params: { query }
          }
        );
        return response.data.visitors;
      } catch (error) {
        throw this.handleError(error);
      }
    },
    DEBOUNCE_DELAY
  );

  /**
   * Export visitor data
   * @param filter - Export filter criteria
   * @param format - Export format (csv/xlsx)
   */
  public async exportVisitors(filter: VisitorFilter, format: 'csv' | 'xlsx'): Promise<Blob> {
    try {
      const response = await this.apiInstance.get(
        API_ENDPOINTS.VISITORS.EXPORT,
        {
          params: { ...this.buildQueryParams(filter), format },
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create cache key from filter
   */
  private createCacheKey(filter: VisitorFilter): string {
    return JSON.stringify({
      status: filter.status,
      dateRange: filter.dateRange,
      search: filter.search
    });
  }

  /**
   * Get cached visitor data
   */
  private getCachedData(key: string): Visitor[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache visitor data
   */
  private cacheData(key: string, data: Visitor[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Build query parameters from filter
   */
  private buildQueryParams(filter: VisitorFilter): Record<string, any> {
    return {
      status: filter.status.join(','),
      startDate: filter.dateRange.start,
      endDate: filter.dateRange.end,
      search: filter.search
    };
  }

  /**
   * Handle and transform API errors
   */
  private handleError(error: any): never {
    console.error('Visitor Service Error:', {
      message: error.message,
      status: error.response?.status,
      endpoint: error.config?.url
    });
    throw error;
  }
}

// Export singleton instance
export default VisitorService.getInstance();