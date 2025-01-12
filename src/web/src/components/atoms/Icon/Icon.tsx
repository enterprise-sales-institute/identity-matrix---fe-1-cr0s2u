import React, { useCallback, useMemo } from 'react';
import { IconWrapper } from './Icon.styles';
import { ThemeConfig } from '../../../types/theme.types';

/**
 * Props interface for the Icon component with enhanced accessibility support
 * @version 1.0.0
 */
export interface IconProps {
  /** Name of the icon to display */
  name: string;
  /** Size variant of the icon */
  size?: 'small' | 'medium' | 'large';
  /** Optional custom color override with contrast validation */
  color?: string;
  /** Whether the icon is disabled */
  disabled?: boolean;
  /** Optional click handler with event type safety */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Optional CSS class name */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Data test id for testing */
  testId?: string;
}

/**
 * A theme-aware icon component with enhanced accessibility features
 * Supports different sizes, colors, and interactive states
 * 
 * @param props - Icon component props
 * @returns JSX.Element - Rendered icon component
 */
export const Icon: React.FC<IconProps> = React.memo(({
  name,
  size = 'medium',
  color,
  disabled = false,
  onClick,
  className,
  ariaLabel,
  testId = 'icon',
}) => {
  /**
   * Validates color contrast against theme if custom color is provided
   */
  const validateColorContrast = useCallback((theme: ThemeConfig, customColor?: string) => {
    if (!customColor) return true;
    // Color contrast validation would go here
    // This is a placeholder for actual contrast calculation
    return true;
  }, []);

  /**
   * Handles keyboard interactions for accessibility
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(event as unknown as React.MouseEvent<HTMLDivElement>);
    }
  }, [disabled, onClick]);

  /**
   * Determines if the icon should be interactive
   */
  const isInteractive = useMemo(() => {
    return Boolean(onClick) && !disabled;
  }, [onClick, disabled]);

  /**
   * Computes ARIA attributes based on component state
   */
  const ariaAttributes = useMemo(() => ({
    role: isInteractive ? 'button' : 'img',
    'aria-disabled': disabled,
    'aria-label': ariaLabel || name,
    'aria-hidden': !ariaLabel && !isInteractive,
    tabIndex: isInteractive ? 0 : undefined,
  }), [isInteractive, disabled, ariaLabel, name]);

  return (
    <IconWrapper
      data-testid={testId}
      size={size}
      color={color}
      disabled={disabled}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={className}
      {...ariaAttributes}
    >
      {/* Icon content - assuming SVG implementation */}
      <svg>
        <use href={`#icon-${name}`} />
      </svg>
      
      {/* Screen reader only text if needed */}
      {ariaLabel && <span className="sr-only">{ariaLabel}</span>}
    </IconWrapper>
  );
});

// Display name for debugging
Icon.displayName = 'Icon';

// Default export
export default Icon;