import { Dialect } from 'sequelize';
import { ConnectOptions } from 'mongoose';

// Environment variables for PostgreSQL configuration
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const POSTGRES_DB = process.env.POSTGRES_DB || 'identity_matrix';
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;

// Environment variables for MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/identity_matrix';

// Environment variables for Redis configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

/**
 * Comprehensive interface for all database configurations including
 * PostgreSQL, MongoDB, and Redis with their respective options
 */
export interface IDatabaseConfig {
  postgresql: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string | undefined;
    dialect: Dialect;
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
      evict: number;
    };
    ssl: {
      enabled: boolean;
      rejectUnauthorized: boolean;
      ca?: string;
      key?: string;
      cert?: string;
    };
    logging: boolean | ((sql: string) => void);
    retry: {
      max: number;
      timeout: number;
    };
  };
  mongodb: {
    uri: string;
    options: ConnectOptions & {
      useNewUrlParser: boolean;
      useUnifiedTopology: boolean;
      maxPoolSize: number;
      minPoolSize: number;
      serverSelectionTimeoutMS: number;
      heartbeatFrequencyMS: number;
      socketTimeoutMS: number;
      retryWrites: boolean;
      ssl: boolean;
      writeConcern: {
        w: string | number;
        j: boolean;
        wtimeout: number;
      };
    };
  };
  redis: {
    host: string;
    port: number;
    password: string | undefined;
    db: number;
    tls: {
      enabled: boolean;
      rejectUnauthorized: boolean;
    };
    retryStrategy: (retries: number) => number | null;
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    keepAlive: number;
  };
}

/**
 * Production-ready database configuration object implementing the IDatabaseConfig interface
 * with comprehensive settings for PostgreSQL, MongoDB, and Redis
 */
export const databaseConfig: IDatabaseConfig = {
  postgresql: {
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    database: POSTGRES_DB,
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    dialect: 'postgres',
    pool: {
      max: 20, // Maximum number of connection in pool
      min: 5,  // Minimum number of connection in pool
      acquire: 30000, // Maximum time (ms) to acquire a connection
      idle: 10000,    // Maximum time (ms) that a connection can be idle
      evict: 1000     // Time between eviction runs
    },
    ssl: {
      enabled: process.env.NODE_ENV === 'production',
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    logging: process.env.NODE_ENV !== 'production',
    retry: {
      max: 3,      // Maximum number of connection retries
      timeout: 5000 // Timeout between retries in milliseconds
    }
  },
  mongodb: {
    uri: MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      ssl: process.env.NODE_ENV === 'production',
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      }
    }
  },
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: 0,
    tls: {
      enabled: process.env.NODE_ENV === 'production',
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    retryStrategy: (retries: number) => {
      if (retries > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(retries * 1000, 3000); // Exponential backoff with max 3s
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 30000 // Keepalive timeout in milliseconds
  }
};