/**
 * API Configuration for Identity Matrix Web Application
 * @version 1.0.0
 * @description Configures API settings and defaults with secure communication protocols
 * and performance requirements enforcement
 */

// External imports
import axios, { AxiosRequestConfig } from 'axios'; // axios@1.x

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
 * Creates a secure API configuration with authentication token
 * @param token - Authentication token for secure API requests
 * @returns Configured Axios instance with security measures
 */
export const createApiConfig = (token?: string): ExtendedAxiosConfig => {
  const config: ExtendedAxiosConfig = { ...API_CONFIG };

  // Add authentication header if token is provided
  if (token) {
    config.headers = {
      ...config.headers,
      [API_HEADERS.AUTHORIZATION]: `${API_HEADERS.AUTHORIZATION} ${token}`
    };
  }

  // Configure request interceptor for security and monitoring
  config.interceptors = {
    request: [
      {
        onFulfilled: (config) => {
          // Add request timestamp for performance monitoring
          config.metadata = { startTime: new Date().getTime() };
          return config;
        },
        onRejected: (error) => {
          return Promise.reject(error);
        }
      }
    ],
    response: [
      {
        onFulfilled: (response) => {
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
        onRejected: async (error) => {
          const config = error.config as ExtendedAxiosConfig;
          
          // Implement retry logic for failed requests
          if (config.retry && config.retry > 0) {
            config.retry--;
            const delayMs = config.retryDelay || 100;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return axios(config);
          }
          
          return Promise.reject(error);
        }
      }
    ]
  };

  // Configure CORS settings
  config.xsrfCookieName = 'XSRF-TOKEN';
  config.xsrfHeaderName = 'X-XSRF-TOKEN';

  return config;
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