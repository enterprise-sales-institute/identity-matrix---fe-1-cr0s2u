/**
 * @fileoverview Date utility functions for Identity Matrix web application
 * Provides comprehensive date manipulation, formatting, and validation with timezone support
 * @version 1.0.0
 */

import dayjs from 'dayjs'; // v1.11.x
import utc from 'dayjs/plugin/utc'; // v1.11.x
import timezone from 'dayjs/plugin/timezone'; // v1.11.x
import relativeTime from 'dayjs/plugin/relativeTime'; // v1.11.x

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Global constants
const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const DEFAULT_TIMEZONE = 'UTC';
const RELATIVE_TIME_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const DATE_CACHE_SIZE = 100;

// LRU Cache for formatted dates
const formatCache = new Map<string, string>();
const cacheKeys: string[] = [];

/**
 * Formats a date into a specified format with timezone support
 * @param date - Input date (Date object, timestamp, or ISO string)
 * @param format - Output format (defaults to DEFAULT_DATETIME_FORMAT)
 * @param timezone - Target timezone (defaults to DEFAULT_TIMEZONE)
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  format: string = DEFAULT_DATETIME_FORMAT,
  timezone: string = DEFAULT_TIMEZONE
): string => {
  try {
    if (!date) return '';

    // Generate cache key
    const cacheKey = `${date}-${format}-${timezone}`;
    if (formatCache.has(cacheKey)) {
      return formatCache.get(cacheKey)!;
    }

    const formattedDate = dayjs(date).tz(timezone).format(format);

    // Cache management
    if (cacheKeys.length >= DATE_CACHE_SIZE) {
      const oldestKey = cacheKeys.shift();
      if (oldestKey) formatCache.delete(oldestKey);
    }
    formatCache.set(cacheKey, formattedDate);
    cacheKeys.push(cacheKey);

    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Gets current UTC timestamp with performance optimization
 * @returns Current UTC timestamp in milliseconds
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Converts timestamp to human-readable relative time
 * @param date - Input date to compare against current time
 * @param withThreshold - Whether to apply RELATIVE_TIME_THRESHOLD
 * @returns Localized relative time string
 */
export const getRelativeTime = (
  date: Date | string | number,
  withThreshold: boolean = true
): string => {
  try {
    const dateObj = dayjs(date);
    if (!dateObj.isValid()) {
      throw new Error('Invalid date input');
    }

    const now = dayjs();
    const diff = Math.abs(now.diff(dateObj));

    if (withThreshold && diff > RELATIVE_TIME_THRESHOLD) {
      return formatDate(date);
    }

    return dateObj.from(now);
  } catch (error) {
    console.error('Error getting relative time:', error);
    return formatDate(date);
  }
};

/**
 * Converts date between different timezones
 * @param date - Input date to convert
 * @param fromTimezone - Source timezone (IANA format)
 * @param toTimezone - Target timezone (IANA format)
 * @returns Converted Date object
 */
export const convertTimezone = (
  date: Date | string | number,
  fromTimezone: string,
  toTimezone: string
): Date => {
  try {
    const dateObj = dayjs(date).tz(fromTimezone);
    if (!dateObj.isValid()) {
      throw new Error('Invalid date input');
    }

    return dateObj.tz(toTimezone).toDate();
  } catch (error) {
    console.error('Error converting timezone:', error);
    return new Date(date);
  }
};

/**
 * Validates date input with enhanced checking
 * @param date - Input to validate
 * @param strict - Whether to apply strict validation
 * @returns Boolean indicating validity
 */
export const isValidDate = (date: any, strict: boolean = false): boolean => {
  try {
    if (!date) return false;

    const dateObj = dayjs(date);
    if (!dateObj.isValid()) return false;

    if (strict) {
      // Additional strict mode checks
      const timestamp = dateObj.valueOf();
      if (timestamp < 0 || timestamp > 8.64e15) return false; // Valid date range check
      
      if (typeof date === 'string') {
        // Check if the string matches expected format
        const parsed = dayjs(date, DEFAULT_DATETIME_FORMAT, true);
        if (!parsed.isValid()) return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating date:', error);
    return false;
  }
};

/**
 * Parses date string with custom format support
 * @param dateString - Input date string
 * @param timezone - Timezone for parsing
 * @param format - Expected date format
 * @returns Parsed Date object
 */
export const parseDate = (
  dateString: string,
  timezone: string = DEFAULT_TIMEZONE,
  format: string = DEFAULT_DATETIME_FORMAT
): Date => {
  try {
    const parsed = dayjs.tz(dateString, format, timezone);
    if (!parsed.isValid()) {
      throw new Error('Invalid date string or format');
    }
    return parsed.toDate();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date(NaN);
  }
};