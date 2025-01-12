import React from 'react';
import { StyledButton } from './Button.styles';

/**
 * Interface for Button component props with comprehensive accessibility support
 * @version 1.0.0
 */
interface ButtonProps {
  /** Button variant - determines visual style */
  variant?: 'primary' | 'secondary' | 'text';
  /** Button size - affects padding and font size */
  size?: 'small' | 'medium' | 'large';
  /** Whether button should take full width of container */
  fullWidth?: boolean;
  /** Disabled state of button */
  disabled?: boolean;
  /** Loading state of button */
  loading?: boolean;
  /** Button content */
  children: React.ReactNode;
  /** Click handler function */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Indicates if button controls expanded state of another element */
  ariaExpanded?: boolean;
  /** ID of element controlled by button */
  ariaControls?: string;
  /** ID of element that describes button */
  ariaDescribedBy?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Enhanced button component with comprehensive theme and accessibility support
 * Implements WCAG 2.1 Level AA compliance
 * @param props - Button component props
 */
export const Button = React.memo<ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  ariaLabel,
  ariaExpanded,
  ariaControls,
  ariaDescribedBy,
  tabIndex = 0,
  ...rest
}) => {
  /**
   * Handle button click with loading and disabled state checks
   */
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading || !onClick) return;
    onClick(event);
  };

  /**
   * Loading indicator component
   */
  const LoadingIndicator = () => (
    <span
      className="button-loading"
      role="status"
      aria-label="Loading"
      style={{
        marginRight: '8px',
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#fff',
        animation: 'spin 1s linear infinite',
      }}
    />
  );

  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      onClick={handleClick}
      type={type}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      tabIndex={disabled ? -1 : tabIndex}
      {...rest}
    >
      {loading && <LoadingIndicator />}
      {children}
    </StyledButton>
  );
});

/**
 * Display name for React DevTools
 */
Button.displayName = 'Button';

/**
 * Default export
 */
export default Button;