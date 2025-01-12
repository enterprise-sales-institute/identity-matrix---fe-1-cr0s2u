import React, { useId, useMemo } from 'react';
import { FormGroupContainer, Label, ErrorMessage } from './FormGroup.styles';

/**
 * Props interface for FormGroup component
 * @interface FormGroupProps
 */
interface FormGroupProps {
  /** Label text for the form group */
  label: string;
  /** Error message to display below the input */
  error?: string;
  /** Child components (typically form inputs) to be wrapped */
  children: React.ReactNode;
  /** Indicates if the form group is required */
  required?: boolean;
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional custom ID for input-label association */
  id?: string;
  /** Text direction for RTL support */
  direction?: 'ltr' | 'rtl';
}

/**
 * FormGroup component that wraps form inputs with labels and error handling
 * Implements WCAG 2.1 Level AA accessibility standards with proper ARIA attributes
 * Supports theme-aware styling and RTL layouts
 *
 * @component
 * @example
 * <FormGroup
 *   label="Email Address"
 *   required
 *   error="Please enter a valid email"
 *   id="email-input"
 * >
 *   <input type="email" />
 * </FormGroup>
 */
const FormGroup: React.FC<FormGroupProps> = ({
  label,
  error,
  children,
  required = false,
  className,
  id: customId,
  direction = 'ltr'
}) => {
  // Generate unique IDs for accessibility attributes
  const uniqueId = useId();
  const id = customId || `form-group-${uniqueId}`;
  
  // Memoize derived IDs for performance
  const { labelId, errorId } = useMemo(() => ({
    labelId: `${id}-label`,
    errorId: `${id}-error`
  }), [id]);

  // Prepare ARIA attributes for error state
  const ariaAttributes = {
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? errorId : undefined,
    'aria-required': required
  };

  return (
    <FormGroupContainer 
      className={className}
      hasError={!!error}
      role="group"
      aria-labelledby={labelId}
      dir={direction}
    >
      <Label
        id={labelId}
        htmlFor={id}
        required={required}
      >
        {label}
      </Label>

      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            id,
            ...ariaAttributes,
            ...child.props
          });
        }
        return child;
      })}

      {error && (
        <ErrorMessage
          id={errorId}
          role="alert"
          aria-live="polite"
        >
          {error}
        </ErrorMessage>
      )}
    </FormGroupContainer>
  );
};

/**
 * Default props for FormGroup component
 */
FormGroup.defaultProps = {
  required: false,
  error: '',
  direction: 'ltr'
};

export default FormGroup;