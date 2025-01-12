/**
 * Core CSS variables and design tokens for Identity Matrix application
 * Implements design system specifications for colors, typography, spacing and breakpoints
 * @version 1.0.0
 */

import { 
  ColorConstants, 
  SpacingConstants, 
  BreakpointConstants 
} from '../constants/theme.constants';

/**
 * Theme-aware color variables with semantic naming and proper scoping
 * Uses CSS custom properties with fallback values
 */
export const colors = {
  // Primary brand color
  primary: `var(--im-color-primary, ${ColorConstants.PRIMARY})`,

  // Theme-aware background colors
  background: {
    dark: `var(--im-color-background-dark, ${ColorConstants.DARK_BACKGROUND})`,
    light: `var(--im-color-background-light, ${ColorConstants.LIGHT_BACKGROUND})`
  },

  // Theme-aware text colors
  text: {
    dark: `var(--im-color-text-dark, ${ColorConstants.DARK_TEXT})`,
    light: `var(--im-color-text-light, ${ColorConstants.LIGHT_TEXT})`
  },

  // Theme-aware border colors
  border: {
    dark: `var(--im-color-border-dark, ${ColorConstants.DARK_BORDER})`,
    light: `var(--im-color-border-light, ${ColorConstants.LIGHT_BORDER})`
  },

  // Theme-aware input background colors
  inputBackground: {
    dark: `var(--im-color-input-dark, ${ColorConstants.DARK_INPUT})`,
    light: `var(--im-color-input-light, ${ColorConstants.LIGHT_INPUT})`
  },

  // Theme-aware hover state colors
  hover: {
    dark: `var(--im-color-hover-dark, ${ColorConstants.PRIMARY_HOVER_DARK})`,
    light: `var(--im-color-hover-light, ${ColorConstants.PRIMARY_HOVER_LIGHT})`
  }
};

/**
 * Typography system variables including font families, sizes and line heights
 * Uses system font stack fallbacks for optimal performance
 */
export const typography = {
  // Font families with fallback stacks
  fontFamilyHeading: "var(--im-font-family-heading, 'Inter', system-ui, sans-serif)",
  fontFamilyBody: "var(--im-font-family-body, 'Roboto', system-ui, sans-serif)",
  fontFamilyCode: "var(--im-font-family-code, 'Fira Code', monospace)",

  // Font weights
  fontWeight: {
    regular: 'var(--im-font-weight-regular, 400)',
    medium: 'var(--im-font-weight-medium, 500)',
    semibold: 'var(--im-font-weight-semibold, 600)',
    bold: 'var(--im-font-weight-bold, 700)'
  },

  // Font sizes with rem units for accessibility
  fontSize: {
    xs: 'var(--im-font-size-xs, 0.75rem)',
    sm: 'var(--im-font-size-sm, 0.875rem)',
    base: 'var(--im-font-size-base, 1rem)',
    lg: 'var(--im-font-size-lg, 1.125rem)',
    xl: 'var(--im-font-size-xl, 1.25rem)',
    '2xl': 'var(--im-font-size-2xl, 1.5rem)',
    '3xl': 'var(--im-font-size-3xl, 1.875rem)',
    '4xl': 'var(--im-font-size-4xl, 2.25rem)'
  },

  // Line heights for optimal readability
  lineHeight: {
    tight: 'var(--im-line-height-tight, 1.25)',
    base: 'var(--im-line-height-base, 1.5)',
    relaxed: 'var(--im-line-height-relaxed, 1.75)'
  }
};

/**
 * Spacing and layout variables based on 8px grid system
 * Uses CSS custom properties with px/rem units
 */
export const spacing = {
  // Base unit for consistent spacing
  baseUnit: `var(--im-spacing-base, ${SpacingConstants.BASE_UNIT})`,
  
  // Grid system configuration
  grid: {
    columns: `var(--im-grid-columns, ${SpacingConstants.GRID_COLUMNS})`,
    gutter: 'var(--im-grid-gutter, 1rem)'
  },

  // Spacing scale
  space: {
    xs: 'var(--im-space-xs, 0.25rem)',
    sm: 'var(--im-space-sm, 0.5rem)',
    md: 'var(--im-space-md, 1rem)',
    lg: 'var(--im-space-lg, 1.5rem)',
    xl: 'var(--im-space-xl, 2rem)',
    '2xl': 'var(--im-space-2xl, 3rem)'
  },

  // Container widths
  container: {
    sm: 'var(--im-container-sm, 640px)',
    md: 'var(--im-container-md, 768px)',
    lg: 'var(--im-container-lg, 1024px)',
    xl: 'var(--im-container-xl, 1280px)'
  }
};

/**
 * Responsive breakpoint variables for mobile-first design
 * Uses min-width queries with px units
 */
export const breakpoints = {
  // Core breakpoints
  mobile: `var(--im-bp-mobile, ${BreakpointConstants.MOBILE})`,
  tablet: `var(--im-bp-tablet, ${BreakpointConstants.TABLET})`,
  desktop: `var(--im-bp-desktop, ${BreakpointConstants.DESKTOP})`,

  // Media query helpers
  mediaQueries: {
    mobile: `@media (min-width: ${BreakpointConstants.MOBILE})`,
    tablet: `@media (min-width: ${BreakpointConstants.TABLET})`,
    desktop: `@media (min-width: ${BreakpointConstants.DESKTOP})`
  }
};

/**
 * Helper function to calculate spacing values based on base unit
 * @param multiplier - Number to multiply base unit by
 * @returns Calculated spacing value with CSS variable and fallback
 */
export const createSpacing = (multiplier: number): string => {
  const baseValue = parseInt(SpacingConstants.BASE_UNIT);
  const calculatedValue = baseValue * multiplier;
  return `var(--im-spacing-${multiplier}, ${calculatedValue}px)`;
};