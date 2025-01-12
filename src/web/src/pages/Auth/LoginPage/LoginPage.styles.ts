import styled from 'styled-components';
import { colors, spacing, breakpoints, typography } from '../../../styles/variables.styles';

// Spacing constants for consistent layout
const FORM_SPACING = parseInt(spacing.baseUnit) * 3;
const INPUT_MARGIN = parseInt(spacing.baseUnit) * 2;
const MOBILE_PADDING = parseInt(spacing.baseUnit);
const HEADER_FONT_SIZE = parseInt(typography.fontSize['2xl']);
const LINK_TRANSITION = '0.2s ease-in-out';

/**
 * Main container for login form content with responsive width and padding
 * Implements theme-aware background color and border radius
 */
export const LoginContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: ${FORM_SPACING}px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  @media (max-width: ${breakpoints.mobile}) {
    padding: ${MOBILE_PADDING}px;
    margin: ${MOBILE_PADDING}px;
    box-shadow: none;
  }
`;

/**
 * Form wrapper with flex layout and consistent spacing between elements
 * Ensures proper alignment and spacing of form inputs
 */
export const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${INPUT_MARGIN}px;
  width: 100%;
`;

/**
 * Header section with welcome text and responsive typography
 * Implements theme-aware text color and font sizing
 */
export const LoginHeader = styled.div`
  text-align: center;
  margin-bottom: ${FORM_SPACING}px;

  h1 {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${typography.fontFamilyHeading};
    font-size: ${HEADER_FONT_SIZE}px;
    font-weight: ${typography.fontWeight.semibold};
    margin-bottom: ${spacing.baseUnit}px;
  }

  @media (max-width: ${breakpoints.mobile}) {
    h1 {
      font-size: ${HEADER_FONT_SIZE * 0.875}px;
    }
  }
`;

/**
 * Container for remember me checkbox and forgot password link
 * Implements flexible layout with proper spacing and hover states
 */
export const RememberMeContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: ${spacing.baseUnit}px 0;
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.sm};

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text};
    cursor: pointer;
  }

  a {
    color: ${colors.primary};
    text-decoration: none;
    transition: all ${LINK_TRANSITION};
    
    &:hover {
      text-decoration: underline;
      opacity: 0.8;
    }
    
    &:focus {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
`;

/**
 * Container for action buttons and links with responsive spacing
 * Implements theme-aware colors and proper focus states for accessibility
 */
export const ActionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${spacing.baseUnit * 2}px;
  margin-top: ${FORM_SPACING}px;
  font-family: ${typography.fontFamilyBody};

  p {
    color: ${({ theme }) => theme.colors.text};
    margin: 0;
    font-size: ${typography.fontSize.base};
  }

  a {
    color: ${colors.primary};
    text-decoration: none;
    transition: all ${LINK_TRANSITION};
    font-size: ${typography.fontSize.base};
    
    &:hover {
      text-decoration: underline;
      opacity: 0.8;
    }
    
    &:focus {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
      border-radius: 2px;
    }

    &:active {
      transform: translateY(1px);
    }
  }

  @media (max-width: ${breakpoints.mobile}) {
    margin-top: ${FORM_SPACING * 0.75}px;
    gap: ${spacing.baseUnit}px;
  }
`;