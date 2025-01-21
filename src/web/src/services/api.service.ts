/**
 * Core API service for Identity Matrix web application
 * @version 1.0.0
 * @description Provides centralized interface for making HTTP requests with enhanced security and performance features
 */

// External imports
import axios, { AxiosInstance, AxiosError } from 'axios'; // axios@1.x
import axiosRetry from 'axios-retry'; // axios-retry@3.x
import { generateChallenge } from 'pkce-challenge'; // pkce-challenge@2.x

// Internal imports
import { API_CONFIG } from '../config/api.config';
import { API_ENDPOINTS } from '../constants/api.constants';
import { AuthResponse, PKCEChallenge } from '../types/auth.types';

// Constants
const TOKEN_REFRESH_INTERVAL_MS = 300000; // 5 minutes
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds
const MAX_RETRIES = 3;

/**
 * Interface for enhanced error tracking
 */
interface ApiErrorMetadata {
  requestId: string;
  timestamp: number;
  endpoint: string;
  responseTime?: number;
}

/**
 * Singleton API service class with enhanced security and performance features
 */
class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private refreshTokenTimeout?: NodeJS.Timeout;
  private currentRequestId: string = '';
  private requestTimestamps: Map<string, number> = new Map();

  private constructor() {
    // Initialize Axios instance with secure defaults
    this.axiosInstance = axios.create({
      ...API_CONFIG,
      timeout: REQUEST_TIMEOUT_MS,
      withCredentials: true // Enable secure cookie handling
    });

    // Configure retry mechanism
    axiosRetry(this.axiosInstance, {
      retries: MAX_RETRIES,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status === 429); // Retry on rate limit
      }
    });

    this.initializeInterceptors();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Initialize request/response interceptors with enhanced security and monitoring
   */
  private initializeInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Generate unique request ID
        this.currentRequestId = crypto.randomUUID();
        this.requestTimestamps.set(this.currentRequestId, Date.now());

        // Add security headers
        const headers = {
          'X-Request-ID': this.currentRequestId,
          'X-Content-Type-Options': 'nosniff',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        };
        config.headers = { ...config.headers, ...headers };

        return config;
      },
      (error) => Promise.reject(this.handleRequestError(error))
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const requestTime = this.getRequestTime(this.currentRequestId);
        this.requestTimestamps.delete(this.currentRequestId);

        // Validate response time
        if (requestTime > REQUEST_TIMEOUT_MS) {
          console.warn(`Request exceeded timeout threshold: ${requestTime}ms`);
        }

        return response;
      },
      (error) => Promise.reject(this.handleRequestError(error))
    );
  }

  /**
   * Set authentication token with enhanced security
   */
  public setAuthToken(token: string, refreshToken: string): void {
    if (!token || !refreshToken) {
      throw new Error('Invalid authentication tokens');
    }

    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.setupTokenRefresh(refreshToken);
  }

  /**
   * Remove authentication token and clear refresh timer
   */
  public removeAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  /**
   * Setup token refresh mechanism
   */
  private setupTokenRefresh(refreshToken: string): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    this.refreshTokenTimeout = setInterval(
      async () => {
        try {
          await this.refreshAuthToken(refreshToken);
        } catch (error) {
          console.error('Token refresh failed:', error);
          this.removeAuthToken();
        }
      },
      TOKEN_REFRESH_INTERVAL_MS
    );
  }

  /**
   * Refresh authentication token using PKCE
   */
  private async refreshAuthToken(refreshToken: string): Promise<boolean> {
    try {
      const verifier = crypto.randomUUID();
      const challenge = generateChallenge(verifier);

      const response = await this.axiosInstance.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        {
          refreshToken,
          codeChallenge: challenge,
          codeChallengeMethod: 'S256'
        }
      );

      const { tokens } = response.data;
      this.setAuthToken(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch (error) {
      throw this.handleRequestError(error);
    }
  }

  /**
   * Enhanced error handling with detailed tracking
   */
  private handleRequestError(error: any): never {
    const errorMetadata: ApiErrorMetadata = {
      requestId: this.currentRequestId,
      timestamp: Date.now(),
      endpoint: error.config?.url || 'unknown',
      responseTime: this.getRequestTime(this.currentRequestId)
    };

    // Handle specific error types
    if (error.response?.status === 401) {
      this.removeAuthToken();
    }

    // Log error with metadata
    console.error('API Error:', {
      ...errorMetadata,
      status: error.response?.status,
      message: error.message
    });

    throw error;
  }

  /**
   * Calculate request time
   */
  private getRequestTime(requestId: string): number {
    const startTime = this.requestTimestamps.get(requestId);
    return startTime ? Date.now() - startTime : 0;
  }

  /**
   * Get configured axios instance
   */
  public get instance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export default ApiService.getInstance();