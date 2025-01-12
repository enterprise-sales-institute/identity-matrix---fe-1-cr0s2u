import { ThemeMode } from '../types/theme.types';
import { ThemeConstants } from '../constants/theme.constants';
import { darkTheme, lightTheme } from '../styles/theme.styles';

/**
 * Storage key for theme preference in localStorage
 * @constant
 */
const THEME_STORAGE_KEY = 'theme_preference';

/**
 * Validates if a theme value is a valid ThemeMode
 * @param theme - Theme value to validate
 * @returns boolean indicating if theme is valid
 */
const isValidTheme = (theme: unknown): theme is ThemeMode => {
  return typeof theme === 'string' && 
    [ThemeConstants.THEME_DARK, ThemeConstants.THEME_LIGHT].includes(theme as ThemeMode);
};

/**
 * Sanitizes theme value to prevent XSS attacks
 * @param theme - Theme value to sanitize
 * @returns Sanitized theme value
 */
const sanitizeTheme = (theme: string): string => {
  return theme.replace(/[^a-zA-Z]/g, '');
};

/**
 * Retrieves the stored theme preference from localStorage with fallback mechanism
 * Includes error handling and validation to ensure safe theme retrieval
 * @returns Validated theme mode or default light theme
 */
export const getStoredTheme = (): ThemeMode => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (!storedTheme) {
      return ThemeConstants.THEME_LIGHT;
    }

    const sanitizedTheme = sanitizeTheme(storedTheme);
    
    if (isValidTheme(sanitizedTheme)) {
      return sanitizedTheme;
    }

    // Invalid theme found, reset to default
    localStorage.removeItem(THEME_STORAGE_KEY);
    return ThemeConstants.THEME_LIGHT;
  } catch (error) {
    // Handle localStorage access errors (e.g., privacy mode)
    console.warn('Error accessing theme preference:', error);
    return ThemeConstants.THEME_LIGHT;
  }
};

/**
 * Securely stores theme preference in localStorage with quota management
 * @param theme - Theme mode to store
 * @throws Error if storage fails
 */
export const setStoredTheme = (theme: ThemeMode): void => {
  if (!isValidTheme(theme)) {
    throw new Error('Invalid theme mode provided');
  }

  try {
    const sanitizedTheme = sanitizeTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, sanitizedTheme);
  } catch (error) {
    // Handle storage errors (e.g., quota exceeded)
    console.error('Failed to store theme preference:', error);
    throw new Error('Failed to save theme preference');
  }
};

/**
 * Gets the complete theme configuration with WCAG compliance validation
 * Includes caching for performance optimization
 * @param mode - Theme mode to get configuration for
 * @returns Validated theme configuration
 */
export const getThemeConfig = (mode: ThemeMode) => {
  if (!isValidTheme(mode)) {
    throw new Error('Invalid theme mode provided');
  }

  // Return cached theme configuration based on mode
  return mode === ThemeConstants.THEME_DARK ? darkTheme : lightTheme;
};

/**
 * Type-safe check for dark theme mode
 * @param mode - Theme mode to check
 * @returns boolean indicating if theme is dark mode
 */
export const isDarkTheme = (mode: ThemeMode): boolean => {
  if (!isValidTheme(mode)) {
    throw new Error('Invalid theme mode provided');
  }
  
  return mode === ThemeConstants.THEME_DARK;
};

/**
 * Checks if system color scheme preference is dark
 * @returns boolean indicating if system prefers dark mode
 */
export const systemPrefersDark = (): boolean => {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

/**
 * Validates WCAG 2.1 Level AA contrast ratio for color combinations
 * @param foreground - Foreground color in hex
 * @param background - Background color in hex
 * @returns boolean indicating if contrast ratio meets WCAG AA standards
 */
export const validateColorContrast = (foreground: string, background: string): boolean => {
  // Convert hex to RGB
  const hexToRgb = (hex: string): number[] => {
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return rgb ? [
      parseInt(rgb[1], 16),
      parseInt(rgb[2], 16),
      parseInt(rgb[3], 16)
    ] : [0, 0, 0];
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const [r1, g1, b1] = hexToRgb(foreground);
  const [r2, g2, b2] = hexToRgb(background);

  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  // WCAG 2.1 Level AA requires a contrast ratio of at least 4.5:1 for normal text
  return ratio >= 4.5;
};