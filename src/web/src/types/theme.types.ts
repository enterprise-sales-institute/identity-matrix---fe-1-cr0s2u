import { ThemeConstants } from '../constants/theme.constants';

/**
 * Type-safe theme mode definition
 * @version 1.0.0
 */
export type ThemeMode = typeof ThemeConstants.THEME_DARK | typeof ThemeConstants.THEME_LIGHT;

/**
 * Color scheme interface with WCAG 2.1 Level AA compliant color combinations
 */
export interface Colors {
  primary: {
    main: string; // #813efb
    hover: string; // 20% opacity for dark, 10% for light
    active: string; // Pressed state color
  };
  background: {
    main: string; // #1a1a1a dark, #ffffff light
    paper: string; // Elevated surface color
    input: string; // #2d2d2d dark, #f5f5f5 light
  };
  text: {
    primary: string; // #ffffff dark, #000000 light
    secondary: string; // 70% opacity of primary
    disabled: string; // 50% opacity of primary
  };
  border: {
    main: string; // #333333 dark, #e0e0e0 light
    light: string; // 10% opacity version of main
    focus: string; // Primary color for focus states
  };
}

/**
 * Typography system interface with comprehensive font controls
 */
export interface Typography {
  fontFamilies: {
    heading: string; // Inter
    body: string; // Roboto
    code: string; // Fira Code
  };
  fontSizes: {
    h1: string; // 2.25rem (36px)
    h2: string; // 1.875rem (30px)
    h3: string; // 1.5rem (24px)
    body: string; // 1rem (16px)
    small: string; // 0.875rem (14px)
  };
  fontWeights: {
    light: number; // 300
    regular: number; // 400
    medium: number; // 500
    bold: number; // 700
  };
  lineHeights: {
    tight: number; // 1.25
    normal: number; // 1.5
    relaxed: number; // 1.75
  };
}

/**
 * Spacing and grid system interface with 8px base unit
 */
export interface Spacing {
  baseUnit: number; // 8
  grid: {
    columns: number; // 12
    gap: string; // 1rem (16px)
    container: {
      sm: string; // 640px
      md: string; // 768px
      lg: string; // 1024px
    };
  };
  scale: {
    xs: string; // 0.25rem (4px)
    sm: string; // 0.5rem (8px)
    md: string; // 1rem (16px)
    lg: string; // 1.5rem (24px)
    xl: string; // 2rem (32px)
  };
}

/**
 * Breakpoint system with mobile-first approach
 */
export interface Breakpoints {
  values: {
    mobile: number; // 320
    tablet: number; // 768
    desktop: number; // 1024
  };
  up: {
    mobile: string; // @media (min-width: 320px)
    tablet: string; // @media (min-width: 768px)
    desktop: string; // @media (min-width: 1024px)
  };
  down: {
    mobile: string; // @media (max-width: 319px)
    tablet: string; // @media (max-width: 767px)
    desktop: string; // @media (max-width: 1023px)
  };
}

/**
 * Complete theme configuration interface combining all theme aspects
 * Ensures type safety and comprehensive theming support
 */
export interface ThemeConfig {
  mode: ThemeMode;
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  breakpoints: Breakpoints;
}