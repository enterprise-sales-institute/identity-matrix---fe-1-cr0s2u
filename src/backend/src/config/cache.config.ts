import { Redis } from 'ioredis'; // v5.3.x - Redis client type definitions

// Environment variables with defaults
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_TLS_ENABLED = process.env.REDIS_TLS_ENABLED === 'true';

/**
 * Interface defining the structure of Redis cache configuration
 * Used for type-safety and configuration validation throughout the application
 */
export interface ICacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    retryStrategy: (times: number) => number | void;
    enableReadyCheck: boolean;
    maxRetriesPerRequest: number;
    connectTimeout: number;
    disconnectTimeout: number;
    commandTimeout: number;
    keepAlive: number;
    family: number;
    tls?: object;
  };
  keyPrefixes: {
    session: string;
    visitor: string;
    company: string;
    integration: string;
    realtime: string;
    analytics: string;
    rateLimit: string;
  };
  ttl: {
    session: number;
    visitor: number;
    company: number;
    integration: number;
    realtime: number;
    analytics: number;
    rateLimit: number;
  };
}

/**
 * Redis cache configuration for Identity Matrix application
 * Provides centralized configuration for all Redis-related settings
 */
export const cacheConfig: ICacheConfig = {
  redis: {
    // Connection settings
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: 0,
    keyPrefix: 'identity-matrix:',

    // Retry strategy with exponential backoff
    retryStrategy: (times: number) => {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 200, 1000); // Exponential backoff with max 1s delay
    },

    // Connection behavior settings
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000, // 10s
    disconnectTimeout: 5000, // 5s
    commandTimeout: 5000, // 5s
    keepAlive: 30000, // 30s
    family: 4, // IPv4

    // TLS configuration
    tls: REDIS_TLS_ENABLED ? {} : undefined,
  },

  // Key prefixes for different data types
  keyPrefixes: {
    session: 'sess:', // User session data
    visitor: 'visitor:', // Visitor tracking data
    company: 'company:', // Company-related cache
    integration: 'integration:', // Integration settings
    realtime: 'realtime:', // Real-time updates
    analytics: 'analytics:', // Analytics data
    rateLimit: 'rate:', // Rate limiting data
  },

  // TTL (Time To Live) values in seconds
  ttl: {
    session: 86400, // 24 hours
    visitor: 3600, // 1 hour
    company: 3600, // 1 hour
    integration: 3600, // 1 hour
    realtime: 300, // 5 minutes
    analytics: 7200, // 2 hours
    rateLimit: 60, // 1 minute
  },
};