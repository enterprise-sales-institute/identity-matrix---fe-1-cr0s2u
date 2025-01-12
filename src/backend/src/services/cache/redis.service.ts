import Redis from 'ioredis'; // v5.3.x
import { cacheConfig } from '../../config/cache.config';
import { logger } from '../../utils/logger.util';
import { createError } from '../../utils/error.util';
import { ErrorTypes } from '../../constants/error.constants';

/**
 * Type definitions for cache data types
 */
type CacheType = keyof typeof cacheConfig.keyPrefixes;

/**
 * Interface for cache operations monitoring
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  latency: number[];
}

/**
 * Redis cache service implementation providing centralized caching functionality
 * with enhanced error handling, monitoring, and high availability features.
 */
export class RedisService {
  private client: Redis;
  private readonly keyPrefixes: typeof cacheConfig.keyPrefixes;
  private readonly ttl: typeof cacheConfig.ttl;
  private readonly retryAttempts: number = 3;
  private isConnected: boolean = false;
  private metrics: Record<CacheType, CacheMetrics> = {} as Record<CacheType, CacheMetrics>;

  constructor() {
    // Initialize Redis client with configuration
    this.client = new Redis(cacheConfig.redis);
    this.keyPrefixes = cacheConfig.keyPrefixes;
    this.ttl = cacheConfig.ttl;

    // Initialize metrics for each cache type
    Object.keys(this.keyPrefixes).forEach((type) => {
      this.metrics[type as CacheType] = {
        hits: 0,
        misses: 0,
        errors: 0,
        latency: []
      };
    });

    // Setup connection event handlers
    this.setupConnectionHandlers();
  }

  /**
   * Sets up Redis connection event handlers and monitoring
   */
  private setupConnectionHandlers(): void {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connection established', {
        host: cacheConfig.redis.host,
        port: cacheConfig.redis.port
      });
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error', { error: error.message });
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    // Monitor Redis health
    setInterval(() => this.checkHealth(), 30000);
  }

  /**
   * Checks Redis connection health and logs metrics
   */
  private async checkHealth(): Promise<void> {
    try {
      if (this.isConnected) {
        const ping = await this.client.ping();
        if (ping === 'PONG') {
          logger.debug('Redis health check passed', { metrics: this.metrics });
        }
      }
    } catch (error) {
      logger.error('Redis health check failed', { error });
    }
  }

  /**
   * Generates a cache key with prefix based on type
   */
  private generateKey(key: string, type: CacheType): string {
    return `${this.keyPrefixes[type]}${key}`;
  }

  /**
   * Sets a value in Redis cache with optional TTL
   */
  public async set<T>(
    key: string,
    value: T,
    type: CacheType,
    customTtl?: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      if (!this.isConnected) {
        throw createError('Redis connection not available', 503, ErrorTypes.SYSTEM_ERROR);
      }

      const cacheKey = this.generateKey(key, type);
      const serializedValue = JSON.stringify(value);
      const ttl = customTtl || this.ttl[type];

      await this.client.setex(cacheKey, ttl, serializedValue);

      // Update metrics
      this.metrics[type].latency.push(Date.now() - startTime);
      if (this.metrics[type].latency.length > 100) {
        this.metrics[type].latency.shift();
      }

      logger.debug('Cache set successful', {
        key: cacheKey,
        type,
        ttl
      });
    } catch (error) {
      this.metrics[type].errors++;
      logger.error('Cache set failed', {
        key,
        type,
        error: error.message
      });
      throw createError(
        'Failed to set cache value',
        503,
        ErrorTypes.CACHE_ERROR,
        { key, type }
      );
    }
  }

  /**
   * Retrieves a value from Redis cache with type safety
   */
  public async get<T>(key: string, type: CacheType): Promise<T | null> {
    const startTime = Date.now();

    try {
      if (!this.isConnected) {
        throw createError('Redis connection not available', 503, ErrorTypes.SYSTEM_ERROR);
      }

      const cacheKey = this.generateKey(key, type);
      const value = await this.client.get(cacheKey);

      // Update metrics
      this.metrics[type].latency.push(Date.now() - startTime);
      if (this.metrics[type].latency.length > 100) {
        this.metrics[type].latency.shift();
      }

      if (value) {
        this.metrics[type].hits++;
        return JSON.parse(value) as T;
      }

      this.metrics[type].misses++;
      return null;
    } catch (error) {
      this.metrics[type].errors++;
      logger.error('Cache get failed', {
        key,
        type,
        error: error.message
      });
      throw createError(
        'Failed to get cache value',
        503,
        ErrorTypes.CACHE_ERROR,
        { key, type }
      );
    }
  }

  /**
   * Deletes a value from Redis cache
   */
  public async delete(key: string, type: CacheType): Promise<void> {
    try {
      if (!this.isConnected) {
        throw createError('Redis connection not available', 503, ErrorTypes.SYSTEM_ERROR);
      }

      const cacheKey = this.generateKey(key, type);
      await this.client.del(cacheKey);

      logger.debug('Cache delete successful', {
        key: cacheKey,
        type
      });
    } catch (error) {
      this.metrics[type].errors++;
      logger.error('Cache delete failed', {
        key,
        type,
        error: error.message
      });
      throw createError(
        'Failed to delete cache value',
        503,
        ErrorTypes.CACHE_ERROR,
        { key, type }
      );
    }
  }

  /**
   * Clears all keys of a specific type
   */
  public async clearType(type: CacheType): Promise<void> {
    try {
      if (!this.isConnected) {
        throw createError('Redis connection not available', 503, ErrorTypes.SYSTEM_ERROR);
      }

      const pattern = `${this.keyPrefixes[type]}*`;
      const stream = this.client.scanStream({
        match: pattern,
        count: 100
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          await this.client.del(...keys);
        }
      });

      stream.on('end', () => {
        logger.info('Cache type cleared successfully', { type });
      });
    } catch (error) {
      this.metrics[type].errors++;
      logger.error('Cache clear type failed', {
        type,
        error: error.message
      });
      throw createError(
        'Failed to clear cache type',
        503,
        ErrorTypes.CACHE_ERROR,
        { type }
      );
    }
  }
}