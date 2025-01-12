import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components'; // v5.3.x
import { ThemeMode } from '../types/theme.types';
import { ThemeConstants } from '../constants/theme.constants';
import {
  getStoredTheme,
  setStoredTheme,
  getThemeConfig,
  isDarkTheme,
  validateColorContrast,
  systemPrefersDark
} from '../utils/theme.util';

// Transition duration for smooth theme changes
const TRANSITION_DURATION = 200;

interface ThemeContextValue {
  theme: ReturnType<typeof getThemeConfig>;
  toggleTheme: () => void;
  isDark: boolean;
  isSystemTheme: boolean;
}

// Create theme context with undefined default value
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  useSystemTheme?: boolean;
}

/**
 * Theme provider component that manages application theming with WCAG compliance
 * @version 1.0.0
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = ThemeConstants.THEME_LIGHT,
  useSystemTheme = true
}) => {
  // Initialize theme state with stored preference or system theme
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (useSystemTheme) {
      const storedTheme = getStoredTheme();
      return storedTheme === ThemeConstants.THEME_LIGHT && systemPrefersDark()
        ? ThemeConstants.THEME_DARK
        : storedTheme;
    }
    return defaultMode;
  });

  // Track if using system theme preference
  const [isSystemTheme, setIsSystemTheme] = useState(useSystemTheme);

  // Get complete theme configuration
  const theme = useMemo(() => getThemeConfig(themeMode), [themeMode]);

  // Validate theme accessibility
  useEffect(() => {
    const { colors } = theme;
    const isValid = validateColorContrast(
      colors.text.primary,
      colors.background.main
    );

    if (!isValid) {
      console.error(
        'Theme configuration does not meet WCAG 2.1 Level AA contrast requirements'
      );
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isSystemTheme) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? ThemeConstants.THEME_DARK : ThemeConstants.THEME_LIGHT;
      setThemeMode(newTheme);
      setStoredTheme(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isSystemTheme]);

  // Toggle theme with transition support
  const toggleTheme = () => {
    setIsSystemTheme(false);
    
    // Apply transition styles
    document.documentElement.style.transition = `background-color ${TRANSITION_DURATION}ms ease`;
    
    const newTheme = themeMode === ThemeConstants.THEME_DARK
      ? ThemeConstants.THEME_LIGHT
      : ThemeConstants.THEME_DARK;

    setThemeMode(newTheme);
    setStoredTheme(newTheme);

    // Remove transition after completion
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, TRANSITION_DURATION);
  };

  // Memoize context value
  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme,
    isDark: isDarkTheme(themeMode),
    isSystemTheme
  }), [theme, themeMode, isSystemTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook for accessing theme context with type safety
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeProvider;