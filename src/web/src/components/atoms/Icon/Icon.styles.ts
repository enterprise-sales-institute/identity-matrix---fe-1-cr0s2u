import styled from 'styled-components';
import { ThemeConfig } from '../../../types/theme.types';

/**
 * Icon size variants with corresponding dimensions
 * @version 1.0.0
 */
const ICON_SIZES = {
  small: '16px',
  medium: '24px',
  large: '32px'
} as const;

/**
 * Opacity values for different icon states
 */
const OPACITY = {
  disabled: 0.5,
  enabled: 1
} as const;

/**
 * Animation transition configuration
 */
const TRANSITIONS = {
  duration: '0.2s',
  timing: 'ease-in-out'
} as const;

/**
 * Props interface for the IconWrapper component
 */
interface IconWrapperProps {
  size?: keyof typeof ICON_SIZES | string;
  color?: string;
  disabled?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  ariaLabel?: string;
}

/**
 * Determines the final size of the icon based on predefined variants or custom value
 * @param size - Icon size variant or custom size value
 * @returns CSS size value with unit
 */
const getIconSize = (size?: IconWrapperProps['size']): string => {
  if (!size) return ICON_SIZES.medium;
  if (size in ICON_SIZES) return ICON_SIZES[size as keyof typeof ICON_SIZES];
  return size.includes('px') ? size : `${size}px`;
};

/**
 * Determines the final color of the icon with theme integration
 * @param theme - Current theme configuration
 * @param color - Custom color override
 * @param disabled - Disabled state flag
 * @returns CSS color value with opacity
 */
const getIconColor = (
  theme: ThemeConfig,
  color?: string,
  disabled?: boolean
): string => {
  const baseColor = color || theme.colors.text.primary;
  const opacity = disabled ? OPACITY.disabled : OPACITY.enabled;
  return `${baseColor}${Math.round(opacity * 100)}`; // Converts opacity to hex
};

/**
 * Styled wrapper component for icons with enhanced accessibility and theme integration
 */
export const IconWrapper = styled.span<IconWrapperProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
  width: ${props => getIconSize(props.size)};
  height: ${props => getIconSize(props.size)};
  color: ${props => getIconColor(props.theme, props.color, props.disabled)};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all ${TRANSITIONS.duration} ${TRANSITIONS.timing};

  /* Interactive states */
  &:hover {
    opacity: ${props => props.disabled ? OPACITY.disabled : 0.8};
  }

  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.border.focus};
    outline-offset: 2px;
  }

  &:active {
    transform: ${props => props.disabled ? 'none' : 'scale(0.95)'};
  }

  /* SVG styling */
  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  /* Accessibility enhancements */
  &[role="button"] {
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  }

  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;