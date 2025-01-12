import express from 'express'; // ^4.18.x
import compression from 'compression'; // ^1.7.x
import morgan from 'morgan'; // ^1.10.x
import helmet from 'helmet'; // ^7.0.x
import rateLimit from 'express-rate-limit'; // ^6.8.x
import os from 'os';

import { databaseConfig } from './database.config';
import { securityConfig } from './security.config';
import { loggerConfig } from './logger.config';

/**
 * Enhanced interface defining server configuration structure
 * with comprehensive settings for security, performance, and monitoring
 */
export interface IServerConfig {
  port: number;
  host: string;
  env: 'development' | 'staging' | 'production';
  apiVersion: string;
  bodyLimit: string;
  corsEnabled: boolean;
  compressionEnabled: boolean;
  requestLogging: boolean;
  apiPrefix: string;
  cluster: {
    enabled: boolean;
    workers: number;
  };
  security: {
    rateLimiting: {
      windowMs: number;
      max: number;
    };
    helmet: {
      contentSecurityPolicy: boolean;
      hsts: boolean;
    };
    cors: {
      origins: string[];
      methods: string[];
    };
  };
  performance: {
    compression: {
      level: number;
      threshold: string;
    };
    timeout: {
      server: number;
      keepAlive: number;
    };
  };
  monitoring: {
    logging: {
      level: string;
      format: string;
    };
    metrics: {
      enabled: boolean;
      interval: number;
    };
  };
}

/**
 * Validates server configuration settings and environment variables
 * @param config Server configuration object
 * @throws Error if validation fails
 */
export const validateServerConfig = (config: IServerConfig): void => {
  // Validate port number
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Invalid port number. Must be between 1 and 65535');
  }

  // Validate host
  const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
  if (!hostRegex.test(config.host) && config.host !== '0.0.0.0' && config.host !== 'localhost') {
    throw new Error('Invalid host format');
  }

  // Validate environment
  if (!['development', 'staging', 'production'].includes(config.env)) {
    throw new Error('Invalid environment specified');
  }

  // Validate API version format
  const versionRegex = /^v\d+$/;
  if (!versionRegex.test(config.apiVersion)) {
    throw new Error('Invalid API version format. Must be in format "v1", "v2", etc.');
  }

  // Validate cluster configuration
  if (config.cluster.enabled && config.cluster.workers < 1) {
    throw new Error('Invalid number of workers specified for cluster mode');
  }
};

/**
 * Returns array of configured middleware with enhanced security and performance settings
 * @param config Server configuration object
 * @returns Array of configured middleware functions
 */
export const getServerMiddleware = (config: IServerConfig): any[] => {
  const middleware = [];

  // Security middleware
  middleware.push(helmet(securityConfig.helmet));
  
  if (config.security.rateLimiting) {
    middleware.push(rateLimit({
      windowMs: config.security.rateLimiting.windowMs,
      max: config.security.rateLimiting.max,
      standardHeaders: true,
      legacyHeaders: false
    }));
  }

  // Performance middleware
  if (config.compressionEnabled) {
    middleware.push(compression({
      level: config.performance.compression.level,
      threshold: parseInt(config.performance.compression.threshold),
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
    }));
  }

  // Logging middleware
  if (config.requestLogging) {
    const morganFormat = config.env === 'development' ? 'dev' : 'combined';
    middleware.push(morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          loggerConfig.transports[0].log('info', message.trim());
        }
      }
    }));
  }

  return middleware;
};

/**
 * Production-ready server configuration implementing IServerConfig interface
 * with comprehensive settings for security, performance, and monitoring
 */
export const serverConfig: IServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  env: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  bodyLimit: '10mb',
  corsEnabled: true,
  compressionEnabled: true,
  requestLogging: true,
  apiPrefix: '/api',
  cluster: {
    enabled: process.env.CLUSTER_ENABLED === 'true',
    workers: parseInt(process.env.MAX_WORKERS || String(os.cpus().length), 10)
  },
  security: {
    rateLimiting: {
      windowMs: 900000, // 15 minutes
      max: 100 // max 100 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: true,
      hsts: true
    },
    cors: {
      origins: securityConfig.cors.origin ? [securityConfig.cors.origin] : [],
      methods: securityConfig.cors.methods
    }
  },
  performance: {
    compression: {
      level: 6,
      threshold: '1kb'
    },
    timeout: {
      server: 30000, // 30 seconds
      keepAlive: 65000 // 65 seconds
    }
  },
  monitoring: {
    logging: {
      level: loggerConfig.level,
      format: 'json'
    },
    metrics: {
      enabled: true,
      interval: 60000 // 1 minute
    }
  }
};

// Validate configuration on initialization
validateServerConfig(serverConfig);

export default serverConfig;