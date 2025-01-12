/**
 * Date Utility Functions
 * Version: 1.0.0
 * 
 * Provides comprehensive date manipulation, formatting, and comparison operations
 * for the Identity Matrix platform with timezone support and performance optimizations.
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
const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
const DEFAULT_TIME_FORMAT = 'HH:mm:ss.SSS';
const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
const DEFAULT_TIMEZONE = 'UTC';
const TIMEZONE_CACHE_DURATION = 300000; // 5 minutes in milliseconds

// Cache for memoization
const memoCache = new Map<string, { value: any; timestamp: number }>();

/**
 * Memoization decorator for caching function results
 * @param duration Cache duration in seconds
 */
function memoize(duration: number) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const key = `${propertyKey}-${JSON.stringify(args)}`;
            const cached = memoCache.get(key);

            if (
                cached &&
                Date.now() - cached.timestamp < duration * 1000
            ) {
                return cached.value;
            }

            const result = originalMethod.apply(this, args);
            memoCache.set(key, { value: result, timestamp: Date.now() });
            return result;
        };

        return descriptor;
    };
}

/**
 * Validates if the input is a valid date
 * @param date Input to validate
 * @returns boolean indicating if input is a valid date
 */
export function isValidDate(date: any): boolean {
    if (!date) return false;
    
    if (date instanceof Date) {
        return !isNaN(date.getTime());
    }
    
    if (typeof date === 'number') {
        return date > 0 && date < 8.64e15; // Max valid JS timestamp
    }
    
    if (typeof date === 'string') {
        const parsed = dayjs(date);
        return parsed.isValid();
    }
    
    return false;
}

/**
 * Formats a date according to specified format with timezone support
 * @param date Date to format
 * @param format Output format (defaults to DEFAULT_DATETIME_FORMAT)
 * @param timezone Target timezone (defaults to UTC)
 * @returns Formatted date string
 */
@memoize(300)
export function formatDate(
    date: Date | string | number,
    format: string = DEFAULT_DATETIME_FORMAT,
    timezone: string = DEFAULT_TIMEZONE
): string {
    try {
        if (!isValidDate(date)) {
            throw new Error('Invalid date input');
        }

        const dayjsDate = dayjs(date).tz(timezone);
        return dayjsDate.format(format);
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

/**
 * Gets current UTC timestamp with millisecond precision
 * @returns Current UTC timestamp
 */
export function getCurrentTimestamp(): number {
    return dayjs.utc().valueOf();
}

/**
 * Converts timestamp to human-readable relative time
 * @param date Date to convert
 * @param locale Locale for formatting (optional)
 * @returns Localized relative time string
 */
@memoize(60)
export function getRelativeTime(
    date: Date | string | number,
    locale?: string
): string {
    try {
        if (!isValidDate(date)) {
            throw new Error('Invalid date input');
        }

        if (locale) {
            dayjs.locale(locale);
        }

        return dayjs(date).fromNow();
    } catch (error) {
        console.error('Error getting relative time:', error);
        return '';
    }
}

/**
 * Converts date between different timezones
 * @param date Date to convert
 * @param fromTimezone Source timezone
 * @param toTimezone Target timezone
 * @returns Converted date object
 */
@memoize(300)
export function convertTimezone(
    date: Date | string | number,
    fromTimezone: string,
    toTimezone: string
): Date {
    try {
        if (!isValidDate(date)) {
            throw new Error('Invalid date input');
        }

        const dayjsDate = dayjs(date).tz(fromTimezone);
        return dayjsDate.tz(toTimezone).toDate();
    } catch (error) {
        console.error('Error converting timezone:', error);
        return new Date();
    }
}

/**
 * Adds specified duration to date
 * @param date Base date
 * @param amount Amount to add
 * @param unit Unit of duration (year, month, day, hour, minute, second)
 * @returns New date with added duration
 */
export function addDuration(
    date: Date | string | number,
    amount: number,
    unit: dayjs.ManipulateType
): Date {
    try {
        if (!isValidDate(date)) {
            throw new Error('Invalid date input');
        }

        if (typeof amount !== 'number' || isNaN(amount)) {
            throw new Error('Invalid amount');
        }

        const validUnits = [
            'year', 'month', 'day',
            'hour', 'minute', 'second',
            'millisecond'
        ];

        if (!validUnits.includes(unit)) {
            throw new Error('Invalid duration unit');
        }

        return dayjs(date).add(amount, unit).toDate();
    } catch (error) {
        console.error('Error adding duration:', error);
        return new Date();
    }
}

// Type definitions for better TypeScript support
export type DateInput = Date | string | number;
export type TimeUnit = dayjs.ManipulateType;
export type DateFormat = string;
export type Timezone = string;