/**
 * @file Express error handling middleware for Identity Matrix backend
 * @version 1.0.0
 * 
 * Provides centralized error handling with enhanced security, monitoring,
 * and environment-specific error responses.
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'; // v4.18.x
import { ErrorCodes, ErrorTypes, ErrorResponseFormat } from '../../constants/error.constants';
import { formatError, isOperationalError } from '../../utils/error.util';
import { logger, logError } from '../../utils/logger.util';

// Performance monitoring thresholds for error handling
const ERROR_HANDLING_THRESHOLDS = {
  WARNING_MS: 100,  // 100ms
  CRITICAL_MS: 500  // 500ms
};

// Error sampling rates for high-volume scenarios
const ERROR_SAMPLING_RATES = {
  OPERATIONAL: 0.1,    // Sample 10% of operational errors
  CRITICAL: 1.0,       // Sample 100% of critical errors
  DEFAULT: 0.5         // Sample 50% of other errors
};

/**
 * Determines if an error should be sampled based on its type and severity
 */
const shouldSampleError = (error: Error, type: ErrorTypes): boolean => {
  const random = Math.random();
  
  if (!isOperationalError(error)) {
    return random < ERROR_SAMPLING_RATES.CRITICAL;
  }
  
  if (type === ErrorTypes.SYSTEM_ERROR) {
    return random < ERROR_SAMPLING_RATES.CRITICAL;
  }
  
  return random < (ERROR_SAMPLING_RATES.OPERATIONAL);
};

/**
 * Express error handling middleware with enhanced security, monitoring,
 * and environment-specific error responses
 */
const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || req.id || crypto.randomUUID();
  
  try {
    // Attach correlation ID to request for tracking
    req.id = correlationId;
    
    // Determine error type and severity
    const errorType = (error as any).type || ErrorTypes.SYSTEM_ERROR;
    const statusCode = (error as any).statusCode || ErrorCodes.INTERNAL_SERVER;
    
    // Sample error based on type and severity
    const shouldLog = shouldSampleError(error, errorType);
    
    if (shouldLog) {
      // Log error with enhanced context
      logError(error, {
        correlationId,
        path: req.path,
        method: req.method,
        statusCode,
        errorType,
        userId: req.user?.id,
        companyId: req.user?.companyId,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
    }
    
    // Track error handling performance
    const handlingDuration = Date.now() - startTime;
    if (handlingDuration > ERROR_HANDLING_THRESHOLDS.CRITICAL_MS) {
      logger.warn('Critical error handling performance threshold exceeded', {
        duration: handlingDuration,
        correlationId
      });
    } else if (handlingDuration > ERROR_HANDLING_THRESHOLDS.WARNING_MS) {
      logger.warn('Error handling performance threshold exceeded', {
        duration: handlingDuration,
        correlationId
      });
    }
    
    // Format error response
    const errorResponse = formatError(error);
    
    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);
    
    // Set appropriate status code
    res.status(statusCode);
    
    // Send error response
    res.json(errorResponse);
    
    // Handle cleanup for critical errors
    if (!isOperationalError(error)) {
      // Notify monitoring systems
      if (process.env.NODE_ENV === 'production') {
        // Implementation would be added here for external monitoring
        logger.error('Critical error detected', {
          correlationId,
          error: errorResponse
        });
      }
      
      // Release any held resources if needed
      if (res.locals.cleanup) {
        res.locals.cleanup();
      }
    }
  } catch (handlingError) {
    // Fallback error handling if error processing fails
    logger.error('Error handler failed', {
      originalError: error,
      handlingError,
      correlationId
    });
    
    res.status(ErrorCodes.INTERNAL_SERVER).json({
      error: 'Internal Server Error',
      code: ErrorCodes.INTERNAL_SERVER.toString(),
      type: ErrorTypes.SYSTEM_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: correlationId
    });
  }
};

export default errorHandler;