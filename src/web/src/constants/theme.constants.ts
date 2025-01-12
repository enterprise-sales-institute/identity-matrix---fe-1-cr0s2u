/**
 * Theme constants for Identity Matrix application
 * Defines theme modes, color schemes, typography, spacing and breakpoints
 * @version 1.0.0
 */

/**
 * Theme mode constants for application-wide theme switching
 */
export const enum ThemeConstants {
  THEME_DARK = 'dark',
  THEME_LIGHT = 'light'
}

/**
 * Color scheme constants for both dark and light themes
 * Primary color: #813efb (Brand color)
 * Hover states with opacity variations
 */
export const enum ColorConstants {
  PRIMARY = '#813efb',
  PRIMARY_HOVER_DARK = '#813efb20',
  PRIMARY_HOVER_LIGHT = '#813efb10',
  
  // Dark theme colors
  DARK_BACKGROUND = '#1a1a1a',
  DARK_TEXT = '#ffffff',
  DARK_BORDER = '#333333',
  DARK_INPUT = '#2d2d2d',
  
  // Light theme colors
  LIGHT_BACKGROUND = '#ffffff',
  LIGHT_TEXT = '#000000',
  LIGHT_BORDER = '#e0e0e0',
  LIGHT_INPUT = '#f5f5f5'
}

/**
 * Typography constants including fonts, weights, sizes, and line heights
 * Font stack: Inter (headings), Roboto (body), Fira Code (code)
 */
export const enum TypographyConstants {
  HEADING_FONT = 'Inter',
  BODY_FONT = 'Roboto',
  CODE_FONT = 'Fira Code',
  
  // Font weights
  FONT_WEIGHTS = {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  // Font sizes using rem units for accessibility
  FONT_SIZES = {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem'  // 36px
  },
  
  // Line heights for optimal readability
  LINE_HEIGHTS = {
    tight: 1.25,
    base: 1.5,
    relaxed: 1.75
  }
}

/**
 * Spacing and grid system constants
 * Base unit of 8px with a 12-column grid
 */
export const enum SpacingConstants {
  BASE_UNIT = '8px',
  GRID_COLUMNS = 12,
  
  // Spacing scale using rem units
  SPACING_UNITS = {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem'   // 48px
  },
  
  // Container maximum widths
  CONTAINER_WIDTHS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px'
  }
}

/**
 * Responsive breakpoint constants and media queries
 * Mobile-first approach with min-width breakpoints
 */
export const enum BreakpointConstants {
  MOBILE = '320px',
  TABLET = '768px',
  DESKTOP = '1024px',
  
  // Media query strings for responsive design
  MEDIA_QUERIES = {
    mobile: '@media (min-width: 320px)',
    tablet: '@media (min-width: 768px)',
    desktop: '@media (min-width: 1024px)'
  }
}