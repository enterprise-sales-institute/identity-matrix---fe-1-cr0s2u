import { ThemeConstants } from '../constants/theme.constants';
import type { ThemeConfig } from '../types/theme.types';

/**
 * Default theme configuration for Identity Matrix application
 * Implements WCAG 2.1 Level AA compliant color schemes and comprehensive design system
 * @version 1.0.0
 */
export const defaultThemeConfig: ThemeConfig = {
  mode: ThemeConstants.THEME_LIGHT,
  colors: {
    primary: {
      main: '#813efb',
      hover: '#9665fb',
      active: '#6a32d1',
      focus: '#813efb40'
    },
    background: {
      main: '#ffffff',
      paper: '#f5f5f5',
      input: '#f5f5f5'
    },
    text: {
      primary: '#000000',
      secondary: 'rgba(0, 0, 0, 0.7)',
      disabled: 'rgba(0, 0, 0, 0.5)'
    },
    border: {
      main: '#e0e0e0',
      light: 'rgba(224, 224, 224, 0.1)',
      focus: '#813efb'
    }
  },
  typography: {
    fontFamilies: {
      heading: 'Inter, system-ui, -apple-system, sans-serif',
      body: 'Roboto, system-ui, -apple-system, sans-serif',
      code: 'Fira Code, monospace'
    },
    fontSizes: {
      h1: '2.25rem', // 36px
      h2: '1.875rem', // 30px
      h3: '1.5rem', // 24px
      body: '1rem', // 16px
      small: '0.875rem' // 14px
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  spacing: {
    baseUnit: 8,
    grid: {
      columns: 12,
      gap: '1rem',
      container: {
        sm: '640px',
        md: '768px',
        lg: '1024px'
      }
    },
    scale: {
      xs: '0.25rem', // 4px
      sm: '0.5rem', // 8px
      md: '1rem', // 16px
      lg: '1.5rem', // 24px
      xl: '2rem' // 32px
    }
  },
  breakpoints: {
    values: {
      mobile: 320,
      tablet: 768,
      desktop: 1024
    },
    up: {
      mobile: '@media (min-width: 320px)',
      tablet: '@media (min-width: 768px)',
      desktop: '@media (min-width: 1024px)'
    },
    down: {
      mobile: '@media (max-width: 319px)',
      tablet: '@media (max-width: 767px)',
      desktop: '@media (max-width: 1023px)'
    }
  }
};

/**
 * Returns theme configuration based on current mode
 * Ensures WCAG 2.1 Level AA compliant color contrast ratios
 */
export function getThemeConfig(mode: ThemeConstants): ThemeConfig {
  const darkTheme: Partial<ThemeConfig> = {
    mode: ThemeConstants.THEME_DARK,
    colors: {
      background: {
        main: '#1a1a1a',
        paper: '#2d2d2d',
        input: '#2d2d2d'
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)'
      },
      border: {
        main: '#333333',
        light: 'rgba(51, 51, 51, 0.1)',
        focus: '#813efb'
      }
    }
  };

  return mode === ThemeConstants.THEME_DARK
    ? { ...defaultThemeConfig, ...darkTheme }
    : defaultThemeConfig;
}