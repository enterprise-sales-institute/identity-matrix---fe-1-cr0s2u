import styled from 'styled-components';
import { colors, spacing, typography } from '../../styles/variables.styles';

/**
 * Interface for styled button component props
 * @version 1.0.0
 */
interface ButtonStyleProps {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}

/**
 * Button size configurations based on 8px grid system
 * Ensures proper touch targets for mobile accessibility
 */
const buttonSizes = {
  small: `
    padding: ${spacing.space.sm} ${spacing.space.md};
    min-height: ${spacing.baseUnit * 4}px;
    font-size: ${spacing.space.sm};
  `,
  medium: `
    padding: ${spacing.space.md} ${spacing.space.lg};
    min-height: ${spacing.baseUnit * 5}px;
    font-size: ${spacing.space.md};
  `,
  large: `
    padding: ${spacing.space.lg} ${spacing.space.xl};
    min-height: ${spacing.baseUnit * 6}px;
    font-size: ${spacing.space.lg};
  `
};

/**
 * Theme-aware button variant styles with proper state handling
 * Implements WCAG 2.1 Level AA contrast requirements
 */
const buttonVariants = {
  primary: {
    background: `var(--button-primary-bg, ${colors.primary})`,
    color: `var(--button-primary-text, #ffffff)`,
    border: 'none',
    '&:hover': {
      background: `var(--button-primary-hover-bg, ${colors.hover.dark})`,
      transform: 'translateY(-1px)'
    },
    '&:focus-visible': {
      outline: `2px solid var(--button-focus-ring, ${colors.primary})`,
      outlineOffset: '2px'
    },
    '&:active': {
      transform: 'translateY(1px)'
    }
  },
  secondary: {
    background: 'transparent',
    color: `var(--button-secondary-text, ${colors.primary})`,
    border: `1px solid var(--button-secondary-border, ${colors.primary})`,
    '&:hover': {
      background: `var(--button-secondary-hover-bg, ${colors.hover.light})`,
      transform: 'translateY(-1px)'
    },
    '&:focus-visible': {
      outline: `2px solid var(--button-focus-ring, ${colors.primary})`,
      outlineOffset: '2px'
    },
    '&:active': {
      transform: 'translateY(1px)'
    }
  },
  text: {
    background: 'transparent',
    color: `var(--button-text-color, ${colors.primary})`,
    border: 'none',
    padding: `${spacing.space.xs} ${spacing.space.sm}`,
    '&:hover': {
      background: `var(--button-text-hover-bg, ${colors.hover.light})`,
      transform: 'translateY(-1px)'
    },
    '&:focus-visible': {
      outline: `2px solid var(--button-focus-ring, ${colors.primary})`,
      outlineOffset: '2px'
    },
    '&:active': {
      transform: 'translateY(1px)'
    }
  }
};

/**
 * Helper function to get button size styles
 */
const getButtonSize = (props: ButtonStyleProps) => buttonSizes[props.size || 'medium'];

/**
 * Helper function to get button variant styles
 */
const getButtonVariant = (props: ButtonStyleProps) => buttonVariants[props.variant || 'primary'];

/**
 * Styled button component with comprehensive theme support and accessibility features
 * Implements WCAG 2.1 Level AA compliance
 */
export const StyledButton = styled.button<ButtonStyleProps>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-family: ${props => props.theme.typography?.fontFamily || typography.fontFamilyBody};
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease-in-out;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  position: relative;
  user-select: none;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;

  /* Size styles */
  ${getButtonSize}

  /* Variant styles */
  ${getButtonVariant}

  /* Accessibility enhancements */
  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 2px;
  }

  /* Touch device optimizations */
  @media (hover: none) {
    &:hover {
      transform: none;
    }
  }

  /* Disabled state styles */
  ${props => props.disabled && `
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  `}
`;

export default StyledButton;