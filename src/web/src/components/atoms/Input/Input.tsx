import React, { forwardRef, ForwardedRef, useId } from 'react'; // v18.x
import { InputWrapper, StyledInput } from './Input.styles';

/**
 * Props interface for Input component extending HTML input attributes
 * Includes custom props for error handling, helper text, and accessibility
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  label?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/**
 * Theme-aware input component with comprehensive form support and accessibility features
 * Implements WCAG 2.1 Level AA compliance with proper ARIA attributes
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error,
      helperText,
      label,
      id: providedId,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      className,
      disabled,
      required,
      ...restProps
    }: InputProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    // Generate unique IDs for input-label association
    const uniqueId = useId();
    const inputId = providedId || `input-${uniqueId}`;
    const helperId = `helper-${uniqueId}`;
    
    // Combine aria-describedby with helper text ID when present
    const combinedAriaDescribedBy = helperText
      ? `${helperId} ${ariaDescribedBy || ''}`
      : ariaDescribedBy;

    // Validate that either label or aria-label is provided
    if (!label && !ariaLabel) {
      console.warn('Input: Either label or aria-label prop must be provided for accessibility');
    }

    return (
      <InputWrapper className={className}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: 'block',
              marginBottom: '8px',
              color: 'inherit',
              cursor: disabled ? 'not-allowed' : 'default'
            }}
          >
            {label}
            {required && (
              <span
                aria-hidden="true"
                style={{ color: 'var(--im-color-error, #ff3b3b)', marginLeft: '4px' }}
              >
                *
              </span>
            )}
          </label>
        )}

        <StyledInput
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={combinedAriaDescribedBy}
          aria-label={!label ? ariaLabel : undefined}
          aria-required={required ? 'true' : 'false'}
          disabled={disabled}
          error={error}
          required={required}
          {...restProps}
        />

        {helperText && (
          <div
            id={helperId}
            role={error ? 'alert' : 'status'}
            style={{
              marginTop: '4px',
              fontSize: '0.875rem',
              color: error
                ? 'var(--im-color-error, #ff3b3b)'
                : 'inherit',
              opacity: disabled ? 0.6 : 1
            }}
          >
            {helperText}
          </div>
        )}
      </InputWrapper>
    );
  }
);

// Default props
Input.defaultProps = {
  type: 'text',
  error: false,
  spellCheck: false
};

// Display name for debugging
Input.displayName = 'Input';

export default Input;