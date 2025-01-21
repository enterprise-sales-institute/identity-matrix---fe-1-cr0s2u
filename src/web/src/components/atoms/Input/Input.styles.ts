import styled from 'styled-components'; // v5.x
import { colors, spacing, typography } from '../../../styles/variables.styles';

// Constants for input styling
const inputHeight = '40px';
const borderRadius = '4px';
const transitionDuration = '0.2s';

/**
 * Returns theme-aware background color for input with proper contrast ratio
 * @param props - Theme props from styled-components
 * @returns Theme-appropriate background color
 */
const getInputBackground = (props: any) => {
  return props.theme.mode === 'dark' 
    ? colors.inputBackground.dark 
    : colors.inputBackground.light;
};

/**
 * Returns border color based on input state and theme
 * @param props - Theme props from styled-components
 * @param error - Error state boolean
 * @returns Theme-appropriate border color
 */
const getInputBorderColor = (props: any, error?: boolean) => {
  if (error) {
    return 'var(--im-color-error, #ff3b3b)';
  }
  return props.theme.mode === 'dark'
    ? colors.border.dark
    : colors.border.light;
};

/**
 * Container wrapper for input element with proper spacing
 * Implements flex layout for label and error message positioning
 */
export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${spacing.baseUnit};
  width: 100%;
  position: relative;
`;

/**
 * Theme-aware styled input component with comprehensive state handling
 * Implements WCAG 2.1 Level AA compliance for accessibility
 */
export const StyledInput = styled.input<{ error?: boolean }>`
  /* Base styles */
  height: ${inputHeight};
  padding: ${spacing.baseUnit};
  border-radius: ${borderRadius};
  border: 1px solid ${props => getInputBorderColor(props, props.error)};
  background: ${props => getInputBackground(props)};
  color: ${props => props.theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  font-family: ${typography.fontFamilyBody};
  font-size: 16px;
  width: 100%;

  /* Transitions for smooth state changes */
  transition: all ${transitionDuration} ease-in-out;

  /* Placeholder styling with proper contrast */
  &::placeholder {
    color: ${props => 
      props.theme.mode === 'dark' 
        ? `${colors.text.dark}80` 
        : `${colors.text.light}80`
    };
  }

  /* Focus state with visible outline for accessibility */
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.primary}20;
  }

  /* Hover state */
  &:hover:not(:disabled) {
    border-color: ${colors.primary}80;
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: ${props => 
      props.theme.mode === 'dark'
        ? `${colors.inputBackground.dark}80`
        : `${colors.inputBackground.light}80`
    };
  }

  /* Error state */
  ${props => props.error && `
    border-color: var(--im-color-error, #ff3b3b);
    &:focus {
      box-shadow: 0 0 0 2px var(--im-color-error-20, #ff3b3b20);
    }
  `}

  /* High contrast mode support */
  @media (forced-colors: active) {
    border: 2px solid ButtonText;
    &:focus {
      outline: 2px solid Highlight;
    }
  }
`;