import { Request, Response, NextFunction } from 'express'; // v4.18.x
import { RedisService } from '../../services/cache/redis.service';
import { securityConfig } from '../../config/security.config';
import { ErrorCodes } from '../../constants/error.constants';
import { logger } from '../../utils/logger.util';
import { createError } from '../../utils/error.util';
import crypto from 'crypto';

// Constants for rate limiting
const RATE_LIMIT_PREFIX = 'rate_limit:';
const RATE_LIMIT_WINDOW = 900; // 15 minutes in seconds
const ABUSE_THRESHOLD = 5; // Number of consecutive limit hits before triggering abuse detection

/**
 * Interface for rate limit configuration by role
 */
interface RateLimitTier {
  windowMs: number;
  maxRequests: number;
}

/**
 * Rate limit tiers by user role
 */
const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  admin: {
    windowMs: 900000, // 15 minutes
    maxRequests: 1000
  },
  user: {
    windowMs: 900000,
    maxRequests: 100
  },
  anonymous: {
    windowMs: 900000,
    maxRequests: 50
  }
};

/**
 * Redis service instance for distributed rate limiting
 */
const redisService = new RedisService();

/**
 * Generates a unique rate limit key incorporating multiple identifiers
 */
const generateRateLimitKey = (
  ip: string,
  companyId?: string,
  userId?: string,
  endpoint?: string
): string => {
  const identifiers = [
    RATE_LIMIT_PREFIX,
    ip,
    companyId || 'anonymous',
    userId || 'anonymous',
    endpoint || 'global'
  ];

  // Create a composite key and hash it for security
  const compositeKey = identifiers.join(':');
  return crypto
    .createHash('sha256')
    .update(compositeKey)
    .digest('hex');
};

/**
 * Advanced rate limiting middleware with distributed counting, role-based limits,
 * and comprehensive monitoring
 */
export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = req.ip;
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.companyId;
    const userRole = (req as any).user?.role || 'anonymous';
    const endpoint = `${req.method}:${req.baseUrl}${req.path}`;

    // Check bypass list for whitelisted IPs/endpoints
    if (securityConfig.rateLimit.bypassList?.includes(ip)) {
      return next();
    }

    // Generate rate limit key
    const rateLimitKey = generateRateLimitKey(ip, companyId, userId, endpoint);

    // Get current request count with high availability
    let requestCount: number;
    try {
      const count = await redisService.get<number>(rateLimitKey, 'rateLimit');
      requestCount = count || 0;
    } catch (error) {
      logger.error('Rate limit Redis error', { error, ip, userId });
      // Fallback to allow request in case of Redis failure
      return next();
    }

    // Get appropriate rate limit tier
    const limitTier = RATE_LIMIT_TIERS[userRole];
    const { maxRequests, windowMs } = limitTier;

    // Increment request count
    requestCount++;

    // Check if limit exceeded
    if (requestCount > maxRequests) {
      // Log potential abuse if threshold exceeded
      if (requestCount >= maxRequests + ABUSE_THRESHOLD) {
        logger.warn('Rate limit abuse detected', {
          ip,
          userId,
          companyId,
          requestCount,
          endpoint
        });
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + (windowMs / 1000));
      res.setHeader('Retry-After', windowMs / 1000);

      throw createError(
        'Rate limit exceeded. Please try again later.',
        ErrorCodes.TOO_MANY_REQUESTS,
        'RATE_LIMIT_ERROR',
        {
          limit: maxRequests,
          windowMs,
          retryAfter: windowMs / 1000
        }
      );
    }

    // Update request count in Redis
    await redisService.set(
      rateLimitKey,
      requestCount,
      'rateLimit',
      Math.floor(windowMs / 1000)
    );

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - requestCount);
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + (windowMs / 1000));

    next();
  } catch (error) {
    next(error);
  }
};