/**
 * @fileoverview Formatting utility functions for Identity Matrix web application
 * Provides comprehensive data formatting with validation, memoization, and i18n support
 * @version 1.0.0
 */

import numeral from 'numeral'; // v2.0.x
import { memoize } from 'lodash'; // v4.17.x
import { VisitorLocation } from '../types/visitor.types';
import { formatDate } from './date.util';

// Global constants for formatting patterns
const DEFAULT_NUMBER_FORMAT = '0,0';
const DEFAULT_CURRENCY_FORMAT = '$0,0.00';
const DEFAULT_PERCENTAGE_FORMAT = '0.0%';
const DEFAULT_TRUNCATE_LENGTH = 50;
const FORMAT_CACHE_SIZE = 100;

// Type guards
const isValidNumber = (value: any): value is number => 
  typeof value === 'number' && !isNaN(value) && isFinite(value);

const isValidString = (value: any): value is string =>
  typeof value === 'string' && value.length > 0;

/**
 * Formats a number using specified format pattern with memoization
 * @param value - Number to format
 * @param format - Numeral.js format pattern
 * @returns Formatted number string with proper accessibility attributes
 */
export const formatNumber = memoize(
  (value: number | null | undefined, format: string = DEFAULT_NUMBER_FORMAT): string => {
    try {
      if (!isValidNumber(value)) return '—';
      
      const formatted = numeral(value).format(format);
      return `<span aria-label="${value} formatted as ${formatted}">${formatted}</span>`;
    } catch (error) {
      console.error('Error formatting number:', error);
      return '—';
    }
  },
  (value, format) => `${value}-${format}`
);

/**
 * Formats a number as currency with localization support
 * @param value - Amount to format
 * @param currencySymbol - Currency symbol to use
 * @param locale - Locale for formatting
 * @returns Formatted currency string with proper accessibility
 */
export const formatCurrency = memoize(
  (
    value: number | null | undefined,
    currencySymbol: string = '$',
    locale: string = 'en-US'
  ): string => {
    try {
      if (!isValidNumber(value)) return '—';

      const format = value < 0 ? `-${currencySymbol}0,0.00` : `${currencySymbol}0,0.00`;
      const formatted = numeral(Math.abs(value)).format(format);
      
      return `<span aria-label="${value} ${locale} currency">${formatted}</span>`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '—';
    }
  },
  (value, symbol, locale) => `${value}-${symbol}-${locale}`
);

/**
 * Formats a decimal number as percentage with precision control
 * @param value - Decimal value to format as percentage
 * @param precision - Number of decimal places
 * @returns Formatted percentage string with proper accessibility
 */
export const formatPercentage = memoize(
  (value: number | null | undefined, precision: number = 1): string => {
    try {
      if (!isValidNumber(value)) return '—';

      const format = `0,0.${'0'.repeat(precision)}%`;
      const percentage = value * 100;
      const formatted = numeral(percentage).format(format);

      return `<span aria-label="${percentage} percent">${formatted}</span>`;
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return '—';
    }
  },
  (value, precision) => `${value}-${precision}`
);

/**
 * Formats location data into readable address string with localization
 * @param location - Visitor location object
 * @param locale - Locale for formatting
 * @returns Formatted address string according to locale conventions
 */
export const formatAddress = memoize(
  (location: VisitorLocation | null | undefined, locale: string = 'en-US'): string => {
    try {
      if (!location) return '—';
      const { city, region, country } = location;

      // Handle missing components
      const components = [
        isValidString(city) ? city : null,
        isValidString(region) ? region : null,
        isValidString(country) ? country : null
      ].filter(Boolean);

      if (components.length === 0) return '—';

      // Format based on locale
      const formatted = new Intl.ListFormat(locale, { 
        style: 'long', 
        type: 'unit' 
      }).format(components);

      return `<span aria-label="Location: ${formatted}">${formatted}</span>`;
    } catch (error) {
      console.error('Error formatting address:', error);
      return '—';
    }
  },
  (location, locale) => `${JSON.stringify(location)}-${locale}`
);

/**
 * Truncates string to specified length with word boundary respect
 * @param value - String to truncate
 * @param maxLength - Maximum length
 * @param respectWordBoundary - Whether to respect word boundaries
 * @returns Truncated string with proper word boundaries
 */
export const truncateString = memoize(
  (
    value: string | null | undefined,
    maxLength: number = DEFAULT_TRUNCATE_LENGTH,
    respectWordBoundary: boolean = true
  ): string => {
    try {
      if (!isValidString(value)) return '';
      if (value.length <= maxLength) return value;

      let truncated = value.slice(0, maxLength);

      if (respectWordBoundary) {
        // Find last word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0) {
          truncated = truncated.slice(0, lastSpace);
        }
      }

      return `${truncated}...`;
    } catch (error) {
      console.error('Error truncating string:', error);
      return value || '';
    }
  },
  (value, maxLength, respectWordBoundary) => 
    `${value}-${maxLength}-${respectWordBoundary}`
);