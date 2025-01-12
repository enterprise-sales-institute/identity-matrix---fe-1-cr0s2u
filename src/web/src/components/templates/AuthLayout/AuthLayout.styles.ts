import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Constants for layout measurements and spacing
const CONTAINER_PADDING = spacing.baseUnit * 2;
const CONTENT_MAX_WIDTH = '480px';
const LOGO_SIZE = '48px';

/**
 * Main container for authentication layout with theme support
 * Implements responsive behavior and performance optimizations
 */
export const AuthLayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${CONTAINER_PADDING}px;
  background-color: ${({ theme }) => theme.mode === 'dark' 
    ? colors.background.dark 
    : colors.background.light};
  color: ${({ theme }) => theme.mode === 'dark' 
    ? colors.text.dark 
    : colors.text.light};
  
  /* Performance optimizations */
  contain: layout;
  will-change: background-color;
  transition: background-color 0.2s ease-in-out;

  /* Responsive adjustments */
  ${breakpoints.mediaQueries.mobile} {
    padding: ${CONTAINER_PADDING * 1.5}px;
  }

  ${breakpoints.mediaQueries.tablet} {
    padding: ${CONTAINER_PADDING * 2}px;
  }
`;

/**
 * Content wrapper for authentication forms
 * Provides theme-aware styling and responsive behavior
 */
export const AuthLayoutContent = styled.main`
  width: 100%;
  max-width: ${CONTENT_MAX_WIDTH};
  margin: 0 auto;
  padding: ${spacing.baseUnit * 3}px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.mode === 'dark' 
    ? colors.inputBackground.dark 
    : colors.inputBackground.light};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  /* Border styling based on theme */
  border: 1px solid ${({ theme }) => theme.mode === 'dark' 
    ? colors.border.dark 
    : colors.border.light};

  /* Responsive padding adjustments */
  ${breakpoints.mediaQueries.mobile} {
    padding: ${spacing.baseUnit * 2}px;
  }

  /* Animation for smooth transitions */
  transition: padding 0.2s ease-in-out,
              background-color 0.2s ease-in-out,
              border-color 0.2s ease-in-out;

  /* Accessibility focus outline */
  &:focus-within {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

/**
 * Logo container component with optimized image handling
 * Includes hover effects and responsive sizing
 */
export const AuthLayoutLogo = styled.div`
  width: ${LOGO_SIZE};
  height: ${LOGO_SIZE};
  margin-bottom: ${spacing.baseUnit * 4}px;
  
  /* Image optimization styles */
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    will-change: transform;
    transition: transform 0.2s ease-in-out;
  }

  /* Hover effect only for devices with hover capability */
  @media (hover: hover) {
    img:hover {
      transform: scale(1.05);
    }
  }

  /* Responsive adjustments */
  ${breakpoints.mediaQueries.tablet} {
    width: ${parseInt(LOGO_SIZE) * 1.25}px;
    height: ${parseInt(LOGO_SIZE) * 1.25}px;
  }
`;

/**
 * Form container with enhanced accessibility and spacing
 */
export const AuthLayoutForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${spacing.baseUnit * 2}px;

  /* Ensure proper spacing between form elements */
  > * + * {
    margin-top: ${spacing.baseUnit}px;
  }

  /* Focus management for form elements */
  input:focus, 
  button:focus {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

/**
 * Helper text container with theme-aware styling
 */
export const AuthLayoutText = styled.p`
  text-align: center;
  margin-top: ${spacing.baseUnit * 2}px;
  color: ${({ theme }) => theme.mode === 'dark' 
    ? colors.text.dark 
    : colors.text.light};
  
  /* Link styling within helper text */
  a {
    color: ${colors.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
    
    &:focus {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
    }
  }
`;