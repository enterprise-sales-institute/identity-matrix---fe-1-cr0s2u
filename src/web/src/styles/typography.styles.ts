import { css } from 'styled-components';
import { TypographyConstants } from '../constants/theme.constants';

// Font display and optimization constants
const FONT_DISPLAY = 'swap';
const FONT_SMOOTHING = css`
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
`;

// System font fallback stacks
const SYSTEM_FONTS = {
  heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
  code: `Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace`
};

// Fluid typography scale using clamp for responsive sizing
const FLUID_SIZES = {
  h1: 'clamp(28px, 5vw, 32px)',
  h2: 'clamp(22px, 4vw, 24px)',
  h3: 'clamp(18px, 3vw, 20px)',
  h4: 'clamp(16px, 2vw, 18px)',
  body: 'clamp(14px, 2vw, 16px)',
  small: 'clamp(12px, 1.5vw, 14px)',
  caption: 'clamp(11px, 1vw, 12px)',
  code: 'clamp(13px, 1.5vw, 14px)'
};

// Line heights for optimal readability
const LINE_HEIGHTS = {
  heading: 1.2,
  body: 1.5,
  code: 1.6
};

// Letter spacing adjustments
const LETTER_SPACING = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.02em'
} as const;

type LetterSpacingType = keyof typeof LETTER_SPACING;

interface FontStylesProps {
  family: string;
  fallback: string;
  size: string;
  lineHeight: number;
  weight?: number;
  letterSpacing?: LetterSpacingType;
  isHeading?: boolean;
}

/**
 * Creates consistent font styles with specified properties and responsive scaling
 */
const createFontStyles = ({
  family,
  fallback,
  size,
  lineHeight,
  weight = 400,
  letterSpacing = 'normal',
  isHeading = false
}: FontStylesProps) => css`
  font-family: ${family}, ${fallback};
  font-size: ${size};
  line-height: ${lineHeight};
  font-weight: ${weight};
  letter-spacing: ${LETTER_SPACING[letterSpacing]};
  font-display: ${FONT_DISPLAY};
  ${FONT_SMOOTHING}
  
  ${isHeading && css`
    margin: 0;
    color: currentColor;
  `}
`;

// Heading styles with accessibility enhancements
export const headingStyles = {
  h1: css`
    ${createFontStyles({
      family: TypographyConstants.HEADING_FONT,
      fallback: SYSTEM_FONTS.heading,
      size: FLUID_SIZES.h1,
      lineHeight: LINE_HEIGHTS.heading,
      weight: 700,
      letterSpacing: 'tight',
      isHeading: true
    })}
  `,
  h2: css`
    ${createFontStyles({
      family: TypographyConstants.HEADING_FONT,
      fallback: SYSTEM_FONTS.heading,
      size: FLUID_SIZES.h2,
      lineHeight: LINE_HEIGHTS.heading,
      weight: 700,
      letterSpacing: 'tight',
      isHeading: true
    })}
  `,
  h3: css`
    ${createFontStyles({
      family: TypographyConstants.HEADING_FONT,
      fallback: SYSTEM_FONTS.heading,
      size: FLUID_SIZES.h3,
      lineHeight: LINE_HEIGHTS.heading,
      weight: 600,
      letterSpacing: 'tight',
      isHeading: true
    })}
  `,
  h4: css`
    ${createFontStyles({
      family: TypographyConstants.HEADING_FONT,
      fallback: SYSTEM_FONTS.heading,
      size: FLUID_SIZES.h4,
      lineHeight: LINE_HEIGHTS.heading,
      weight: 600,
      letterSpacing: 'tight',
      isHeading: true
    })}
  `
};

// Body text styles with responsive scaling
export const bodyStyles = {
  regular: css`
    ${createFontStyles({
      family: TypographyConstants.BODY_FONT,
      fallback: SYSTEM_FONTS.body,
      size: FLUID_SIZES.body,
      lineHeight: LINE_HEIGHTS.body,
      weight: 400,
      letterSpacing: 'normal'
    })}
  `,
  small: css`
    ${createFontStyles({
      family: TypographyConstants.BODY_FONT,
      fallback: SYSTEM_FONTS.body,
      size: FLUID_SIZES.small,
      lineHeight: LINE_HEIGHTS.body,
      weight: 400,
      letterSpacing: 'normal'
    })}
  `,
  caption: css`
    ${createFontStyles({
      family: TypographyConstants.BODY_FONT,
      fallback: SYSTEM_FONTS.body,
      size: FLUID_SIZES.caption,
      lineHeight: LINE_HEIGHTS.body,
      weight: 400,
      letterSpacing: 'wide'
    })}
  `
};

// Code block styles with monospace optimization
export const codeStyles = {
  inline: css`
    ${createFontStyles({
      family: TypographyConstants.CODE_FONT,
      fallback: SYSTEM_FONTS.code,
      size: FLUID_SIZES.code,
      lineHeight: LINE_HEIGHTS.code,
      weight: 400,
      letterSpacing: 'normal'
    })}
    padding: 0.2em 0.4em;
    border-radius: 3px;
    background-color: rgba(0, 0, 0, 0.05);
  `,
  block: css`
    ${createFontStyles({
      family: TypographyConstants.CODE_FONT,
      fallback: SYSTEM_FONTS.code,
      size: FLUID_SIZES.code,
      lineHeight: LINE_HEIGHTS.code,
      weight: 400,
      letterSpacing: 'normal'
    })}
    padding: 1em;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    white-space: pre;
  `
};