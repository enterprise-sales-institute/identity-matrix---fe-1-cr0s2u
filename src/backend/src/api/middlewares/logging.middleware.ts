import { Request, Response, NextFunction } from 'express'; // v4.18.x
import { logger, logRequest, logResponse, logError } from '../../utils/logger.util';
import { formatError } from '../../utils/error.util';

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const PERFORMANCE_THRESHOLD = parseInt(process.env.PERFORMANCE_THRESHOLD || '1000', 10);
const ENABLE_LOG_SAMPLING = process.env.ENABLE_LOG_SAMPLING === 'true';

// Log sampling rate (if enabled)
const LOG_SAMPLE_RATE = 0.1; // 10% of requests

/**
 * Advanced request logging middleware with performance tracking and security monitoring
 */
export const requestLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip logging based on sampling rate if enabled
  if (ENABLE_LOG_SAMPLING && Math.random() > LOG_SAMPLE_RATE) {
    return next();
  }

  // Record request start time
  const startTime = process.hrtime.bigint();

  // Log incoming request
  logRequest(req);

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to capture response data
  res.end = function(chunk?: any, encoding?: string | (() => void), cb?: () => void): Response {
    // Calculate request duration
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    // Log response with performance metrics
    logResponse(res, duration);

    // Check performance thresholds
    if (duration > PERFORMANCE_THRESHOLD) {
      logger.warn('Request exceeded performance threshold', {
        duration,
        threshold: PERFORMANCE_THRESHOLD,
        path: req.path,
        method: req.method,
        requestId: (req as any).requestId
      });
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding as string, cb);
  };

  next();
};

/**
 * Comprehensive error logging middleware with security event detection
 */
export const errorLoggingMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Format error with security context
  const formattedError = formatError(error);
  
  // Extract security context
  const securityContext = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    requestId: (req as any).requestId
  };

  // Check for potential security events
  const potentialSecurityEvent = 
    error.message.toLowerCase().includes('auth') ||
    error.message.toLowerCase().includes('token') ||
    error.message.toLowerCase().includes('permission') ||
    res.statusCode === 401 ||
    res.statusCode === 403;

  // Add security context to error details
  if (potentialSecurityEvent) {
    formattedError.details = {
      ...formattedError.details,
      security: true,
      securityContext
    };
  }

  // Log error with full context
  logError(error, {
    ...formattedError,
    securityContext,
    requestId: (req as any).requestId
  });

  // Forward error to next error handler
  next(error);
};

/**
 * Helper function to determine if request should be sampled
 */
const shouldSampleRequest = (req: Request): boolean => {
  if (!ENABLE_LOG_SAMPLING) {
    return true;
  }

  // Always log errors and security-sensitive endpoints
  if (
    req.path.includes('/auth') ||
    req.path.includes('/security') ||
    req.method !== 'GET'
  ) {
    return true;
  }

  return Math.random() < LOG_SAMPLE_RATE;
};

/**
 * Helper function to extract and sanitize request context
 */
const getRequestContext = (req: Request): Record<string, any> => {
  return {
    path: req.path,
    method: req.method,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.get('user-agent'),
      'x-forwarded-for': req.get('x-forwarded-for'),
      'x-request-id': (req as any).requestId
    },
    timestamp: new Date().toISOString()
  };
};