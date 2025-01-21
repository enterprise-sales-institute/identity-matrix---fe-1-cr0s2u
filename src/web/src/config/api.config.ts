/**
 * API Configuration for Identity Matrix Web Application
 * @version 1.0.0
 * @description Configures API settings and defaults with secure communication protocols
 * and performance requirements enforcement
 */

// External imports
import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'; // axios@1.x

// Internal imports
import { API_ENDPOINTS, API_HEADERS } from '../constants/api.constants';

// Environment configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = 500; // 500ms timeout as per performance requirements
const API_VERSION = 'v1';

/**
 * Interface for extended Axios configuration
 */
interface ExtendedAxiosConfig extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
  metadata?: {
    startTime: number;
  };
}

/**
 * Default API configuration object
 * Implements secure defaults and performance requirements
 */
export const API_CONFIG: ExtendedAxiosConfig = {
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': API_HEADERS.CONTENT_TYPE,
    'Accept': API_HEADERS.ACCEPT,
    // Security headers
    'Strict-Transport-Security': API_HEADERS.SECURITY.STRICT_TRANSPORT,
    'Content-Security-Policy': API_HEADERS.SECURITY.CONTENT_SECURITY,
    'X-Frame-Options': API_HEADERS.SECURITY.X_FRAME_OPTIONS,
    'X-Content-Type-Options': API_HEADERS.SECURITY.X_CONTENT_TYPE,
    'Referrer-Policy': API_HEADERS.SECURITY.REFERRER_POLICY
  },
  validateStatus: (status: number) => status >= 200 && status < 500,
  retry: 2,
  retryDelay: 100,
  withCredentials: true // Enable secure cookie handling
};

/**
 * Creates a secure API instance with authentication token
 * @param token - Authentication token for secure API requests
 * @returns Configured Axios instance with security measures
 */
export const createApiConfig = (token?: string) => {
  const axiosInstance = axios.create({ ...API_CONFIG });

  // Add authentication header if token is provided
  if (token) {
    axiosInstance.defaults.headers.common[API_HEADERS.AUTHORIZATION] = `${API_HEADERS.AUTHORIZATION} ${token}`;
  }

  // Configure request interceptor for security and monitoring
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add request timestamp for performance monitoring
      config.metadata = { startTime: new Date().getTime() };
      return config;
    },
    (error: Error) => {
      return Promise.reject(error);
    }
  );

  // Configure response interceptor for monitoring and retry logic
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Calculate response time for performance monitoring
      const requestStartTime = response.config.metadata?.startTime;
      if (requestStartTime) {
        const responseTime = new Date().getTime() - requestStartTime;
        // Log if response time exceeds threshold
        if (responseTime > API_TIMEOUT) {
          console.warn(`API response time exceeded threshold: ${responseTime}ms`);
        }
      }
      return response;
    },
    async (error: Error & { config: ExtendedAxiosConfig }) => {
      const config = error.config;
      
      // Implement retry logic for failed requests
      if (config.retry && config.retry > 0) {
        config.retry--;
        const delayMs = config.retryDelay || 100;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return axios(config);
      }
      
      return Promise.reject(error);
    }
  );

  // Configure CORS settings
  axiosInstance.defaults.xsrfCookieName = 'XSRF-TOKEN';
  axiosInstance.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

  return axiosInstance;
};

/**
 * Export endpoint configurations for type safety
 */
export const ENDPOINTS = API_ENDPOINTS;

/**
 * Export response validators
 */
export const validateResponse = (status: number): boolean => {
  return status >= 200 && status < 500;
};

/**
 * Export error handlers
 */
export const handleApiError = (error: any): never => {
  // Log error details for monitoring
  console.error('API Error:', {
    status: error.response?.status,
    message: error.message,
    endpoint: error.config?.url,
    method: error.config?.method
  });
  
  throw error;
};