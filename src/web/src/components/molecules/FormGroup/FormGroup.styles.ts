import styled from 'styled-components';
import { colors, spacing, typography } from '../../../styles/variables.styles';

/**
 * Container component for form group with proper spacing and RTL support
 * Implements 8px grid system with responsive layout
 */
export const FormGroupContainer = styled.div<{ hasError?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: ${spacing.space.lg};
  width: 100%;
  position: relative;
  direction: ${props => props.theme.direction || 'ltr'};

  /* Add extra spacing when error is present to accommodate message */
  ${props => props.hasError && `
    margin-bottom: calc(${spacing.space.xl} + ${spacing.space.sm});
  `}

  /* Responsive adjustments for mobile */
  ${props => props.theme.breakpoints.mediaQueries.mobile} {
    margin-bottom: ${spacing.space.md};
  }
`;

/**
 * Accessible label component with proper contrast and hover states
 * Implements WCAG 2.1 Level AA color contrast requirements
 */
export const Label = styled.label<{ required?: boolean }>`
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${props => props.theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  margin-bottom: ${spacing.space.xs};
  transition: color 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  
  /* Required field indicator */
  ${props => props.required && `
    &::after {
      content: '*';
      color: ${props.theme.colors.error};
      margin-left: ${spacing.space.xs};
    }
  `}

  /* Hover state with theme-aware colors */
  &:hover {
    color: ${colors.primary};
  }

  /* Responsive typography */
  ${props => props.theme.breakpoints.mediaQueries.mobile} {
    font-size: ${typography.fontSize.xs};
  }
`;

/**
 * Error message component with high contrast and animation
 * Positioned absolutely to maintain form layout
 */
export const ErrorMessage = styled.span`
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.medium};
  color: ${props => props.theme.colors.error};
  margin-top: ${spacing.space.xs};
  opacity: 0.9;
  transition: opacity 0.2s ease;
  position: absolute;
  bottom: -${spacing.space.lg};
  
  /* RTL support for error message positioning */
  ${props => props.theme.direction === 'rtl' ? `
    right: 0;
    left: auto;
  ` : `
    left: 0;
    right: auto;
  `}

  /* Hover state for better visibility */
  &:hover {
    opacity: 1;
  }

  /* Responsive adjustments */
  ${props => props.theme.breakpoints.mediaQueries.mobile} {
    font-size: calc(${typography.fontSize.xs} - 1px);
    bottom: -${spacing.space.md};
  }

  /* High contrast mode support */
  @media (forced-colors: active) {
    color: LinkText;
  }
`;

/**
 * Helper text component for additional field information
 * Implements proper spacing and theme-aware colors
 */
export const HelperText = styled.span`
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.xs};
  color: ${props => props.theme.mode === 'dark' ? 
    `rgba(${colors.text.dark}, 0.7)` : 
    `rgba(${colors.text.light}, 0.7)`
  };
  margin-top: ${spacing.space.xs};
  transition: color 0.2s ease;

  /* Responsive typography */
  ${props => props.theme.breakpoints.mediaQueries.mobile} {
    font-size: calc(${typography.fontSize.xs} - 1px);
  }
`;