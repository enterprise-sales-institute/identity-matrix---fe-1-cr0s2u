import { DefaultTheme } from 'styled-components'; // v5.3.x
import {
  ThemeConstants,
  ColorConstants,
  TypographyConstants,
  BreakpointConstants
} from '../constants/theme.constants';
import type {
  ThemeConfig,
  ThemeMode,
  Colors,
  Typography,
  Spacing,
  Breakpoints
} from '../types/theme.types';

/**
 * Base typography configuration with responsive scaling
 */
const baseTypography: Typography = {
  fontFamilies: {
    heading: String(TypographyConstants.HEADING_FONT),
    body: String(TypographyConstants.BODY_FONT),
    code: String(TypographyConstants.CODE_FONT)
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
};

/**
 * Base spacing system with 8px unit and 12-column grid
 */
const baseSpacing: Spacing = {
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
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem'     // 32px
  }
};

/**
 * Responsive breakpoints with mobile-first approach
 */
const baseBreakpoints: Breakpoints = {
  values: {
    mobile: 320,
    tablet: 768,
    desktop: 1024
  },
  up: {
    mobile: `@media (min-width: ${BreakpointConstants.MOBILE})`,
    tablet: `@media (min-width: ${BreakpointConstants.TABLET})`,
    desktop: `@media (min-width: ${BreakpointConstants.DESKTOP})`
  },
  down: {
    mobile: '@media (max-width: 319px)',
    tablet: '@media (max-width: 767px)',
    desktop: '@media (max-width: 1023px)'
  }
};

/**
 * Creates a WCAG 2.1 Level AA compliant theme configuration
 * @param mode - Theme mode (light/dark)
 */
const createTheme = (mode: ThemeMode): ThemeConfig => {
  const isDark = mode === ThemeConstants.THEME_DARK;

  const colors: Colors = {
    primary: {
      main: ColorConstants.PRIMARY,
      hover: isDark ? ColorConstants.PRIMARY_HOVER_DARK : ColorConstants.PRIMARY_HOVER_LIGHT,
      active: ColorConstants.PRIMARY
    },
    background: {
      main: isDark ? ColorConstants.DARK_BACKGROUND : ColorConstants.LIGHT_BACKGROUND,
      paper: isDark ? ColorConstants.DARK_INPUT : ColorConstants.LIGHT_BACKGROUND,
      input: isDark ? ColorConstants.DARK_INPUT : ColorConstants.LIGHT_INPUT
    },
    text: {
      primary: isDark ? ColorConstants.DARK_TEXT : ColorConstants.LIGHT_TEXT,
      secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      disabled: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
    },
    border: {
      main: isDark ? ColorConstants.DARK_BORDER : ColorConstants.LIGHT_BORDER,
      light: isDark ? 'rgba(51, 51, 51, 0.1)' : 'rgba(224, 224, 224, 0.1)',
      focus: ColorConstants.PRIMARY
    }
  };

  return {
    mode,
    colors,
    typography: baseTypography,
    spacing: baseSpacing,
    breakpoints: baseBreakpoints
  };
};

/**
 * Light theme configuration with WCAG 2.1 Level AA compliance
 */
export const lightTheme: DefaultTheme = createTheme(ThemeConstants.THEME_LIGHT);

/**
 * Dark theme configuration with WCAG 2.1 Level AA compliance
 */
export const darkTheme: DefaultTheme = createTheme(ThemeConstants.THEME_DARK);

// Type augmentation for styled-components DefaultTheme
declare module 'styled-components' {
  export interface DefaultTheme extends ThemeConfig {}
}