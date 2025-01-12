import winston, { Logger, format } from 'winston';
import { Request, Response } from 'express';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { loggerConfig } from '../config/logger.config';
import { v4 as uuidv4 } from 'uuid';

// Constants for performance thresholds
const PERFORMANCE_THRESHOLDS = {
    WARNING_MS: 1000,  // 1 second
    CRITICAL_MS: 3000  // 3 seconds
};

// Sensitive data patterns to mask
const SENSITIVE_PATTERNS = [
    /password[^&]*/gi,
    /token[^&]*/gi,
    /auth[^&]*/gi,
    /bearer\s+[^\s]+/gi,
    /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g // email addresses
];

/**
 * Masks sensitive information in objects and strings
 * @param data - Data to mask
 * @returns Masked data
 */
const maskSensitiveData = (data: any): any => {
    if (typeof data === 'string') {
        return SENSITIVE_PATTERNS.reduce((masked, pattern) => 
            masked.replace(pattern, '[REDACTED]'), data);
    }
    if (typeof data === 'object' && data !== null) {
        const masked = { ...data };
        for (const key in masked) {
            if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
                masked[key] = '[REDACTED]';
            } else if (typeof masked[key] === 'object') {
                masked[key] = maskSensitiveData(masked[key]);
            }
        }
        return masked;
    }
    return data;
};

/**
 * Creates and configures the Winston logger instance
 * @returns Configured Winston logger instance
 */
const createLogger = (): Logger => {
    const logger = winston.createLogger({
        level: loggerConfig.level,
        format: loggerConfig.format,
        transports: loggerConfig.transports,
        exitOnError: false
    });

    // Add Elasticsearch transport in production
    if (process.env.NODE_ENV === 'production' && loggerConfig.elkConfig) {
        const esTransport = new ElasticsearchTransport({
            level: 'info',
            clientOpts: loggerConfig.elkConfig,
            bufferLimit: 100,
            flushInterval: 2000,
            index: 'identity-matrix-logs'
        });
        
        logger.add(esTransport);
    }

    return logger;
};

// Create the logger instance
const logger = createLogger();

/**
 * Logs incoming HTTP request details with correlation ID and security context
 * @param req - Express Request object
 */
const logRequest = (req: Request): void => {
    const requestId = uuidv4();
    // Attach requestId to request object for correlation
    (req as any).requestId = requestId;

    const logData = {
        requestId,
        method: req.method,
        url: req.url,
        headers: maskSensitiveData(req.headers),
        query: maskSensitiveData(req.query),
        body: maskSensitiveData(req.body),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString(),
        type: 'request'
    };

    logger.info('Incoming request', { ...logData });
};

/**
 * Logs outgoing HTTP response details with performance metrics
 * @param res - Express Response object
 * @param duration - Request duration in milliseconds
 */
const logResponse = (res: Response, duration: number): void => {
    const req = res.req as Request & { requestId?: string };
    
    const logData = {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        type: 'response'
    };

    // Add performance warning flags
    if (duration > PERFORMANCE_THRESHOLDS.CRITICAL_MS) {
        logData['performanceAlert'] = 'CRITICAL';
        logger.warn('Critical performance threshold exceeded', { ...logData });
    } else if (duration > PERFORMANCE_THRESHOLDS.WARNING_MS) {
        logData['performanceAlert'] = 'WARNING';
        logger.warn('Performance threshold exceeded', { ...logData });
    }

    logger.info('Outgoing response', { ...logData });
};

/**
 * Logs error details with context and triggers alerts for critical errors
 * @param error - Error object
 * @param context - Additional context object
 */
const logError = (error: Error, context: Record<string, any> = {}): void => {
    const errorData = {
        errorId: uuidv4(),
        message: error.message,
        stack: error.stack,
        name: error.name,
        context: maskSensitiveData(context),
        timestamp: new Date().toISOString(),
        type: 'error'
    };

    // Check for security-related errors
    const isSecurityError = error.message.toLowerCase().includes('security') || 
                           error.message.toLowerCase().includes('auth') ||
                           context.security;

    if (isSecurityError) {
        errorData['securityEvent'] = true;
        errorData['severity'] = 'HIGH';
        logger.error('Security error detected', { ...errorData });
        
        // Trigger external notifications for security events
        if (process.env.NODE_ENV === 'production') {
            // Implementation would be added here for external notification system
        }
    } else {
        logger.error('Application error', { ...errorData });
    }
};

// Export the logger instance and utility functions
export {
    logger,
    logRequest,
    logResponse,
    logError
};