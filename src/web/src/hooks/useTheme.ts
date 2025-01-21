import { useState, useEffect, useCallback, useMemo } from 'react'; // v18.x
import debounce from 'lodash/debounce'; // v4.x

import { ThemeMode, ThemeConfig } from '../types/theme.types';
import { ThemeConstants } from '../constants/theme.constants';
import {
  getStoredTheme,
  setStoredTheme,
  getThemeConfig,
  isDarkTheme,
  validateColorContrast
} from '../utils/theme.util';

// Constants for theme management
const THEME_TRANSITION_DURATION = 300; // milliseconds
const STORAGE_QUOTA_THRESHOLD = 5242880; // 5MB

/**
 * Custom hook for managing application theme with enhanced features
 * Includes error handling, performance optimization, and WCAG compliance
 * @returns Theme management object with state and operations
 */
export const useTheme = () => {
  // Theme state with error handling
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const storedMode = getStoredTheme();
      return getThemeConfig(storedMode);
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      return getThemeConfig(ThemeConstants.THEME_LIGHT);
    }
  });

  // Error state for theme operations
  const [themeError, setThemeError] = useState<Error | null>(null);

  // Performance optimization with memoized theme values
  const isDark = useMemo(() => isDarkTheme(theme.mode), [theme.mode]);

  // Theme transition management
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--theme-transition',
      `all ${THEME_TRANSITION_DURATION}ms ease-in-out`
    );
    
    // Apply theme-specific CSS variables
    Object.entries(theme.colors).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, colorValue]) => {
        document.documentElement.style.setProperty(
          `--color-${category}-${key}`,
          String(colorValue)
        );
      });
    });

    // Validate contrast ratios for accessibility
    const contrastValid = validateColorContrast(
      theme.colors.text.primary,
      theme.colors.background.main
    );

    if (!contrastValid) {
      console.warn('Theme colors do not meet WCAG 2.1 Level AA contrast requirements');
    }

    return () => {
      document.documentElement.style.removeProperty('--theme-transition');
    };
  }, [theme]);

  // System theme preference listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) { // Only apply if no user preference is stored
        const newMode = e.matches ? ThemeConstants.THEME_DARK : ThemeConstants.THEME_LIGHT;
        handleThemeChange(newMode);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Theme change handler with storage management and error handling
  const handleThemeChange = useCallback(async (newMode: ThemeMode) => {
    try {
      // Check storage quota before saving
      if (navigator.storage && navigator.storage.estimate) {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate();
        if (usage >= quota || quota <= STORAGE_QUOTA_THRESHOLD) {
          throw new Error('Insufficient storage quota for theme preference');
        }
      }

      setStoredTheme(newMode);
      const newTheme = getThemeConfig(newMode);
      
      setTheme(newTheme);
      setThemeError(null);

      // Track theme change analytics
      const gtagFunction = (window as any).gtag;
      if (gtagFunction) {
        gtagFunction('event', 'theme_change', {
          theme_mode: newMode,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Theme change failed:', error);
      setThemeError(error instanceof Error ? error : new Error('Failed to change theme'));
    }
  }, []);

  // Debounced theme toggle for performance
  const toggleTheme = useMemo(
    () => debounce(
      () => handleThemeChange(isDark ? ThemeConstants.THEME_LIGHT : ThemeConstants.THEME_DARK),
      100,
      { leading: true, trailing: false }
    ),
    [handleThemeChange, isDark]
  );

  // Clean up debounced function
  useEffect(() => {
    return () => {
      toggleTheme.cancel();
    };
  }, [toggleTheme]);

  return {
    theme,
    toggleTheme,
    isDark,
    themeError
  };
};