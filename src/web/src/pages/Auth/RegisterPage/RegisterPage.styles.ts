import styled from 'styled-components'; // v5.x
import { colors, spacing, breakpoints, typography } from '../../../styles/variables.styles';

// Spacing constants for consistent layout
const FORM_SPACING = parseInt(spacing.baseUnit) * 3;
const FIELD_SPACING = parseInt(spacing.baseUnit) * 2;
const TRANSITION_DURATION = '0.2s';
const MOBILE_PADDING = parseInt(spacing.baseUnit) * 2;

/**
 * Main container for registration form with responsive layout
 * Implements mobile-first design with proper spacing and theme support
 */
export const RegisterFormContainer = styled.form`
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: ${MOBILE_PADDING}px;
  display: flex;
  flex-direction: column;
  gap: ${FORM_SPACING}px;
  background: ${({ theme }) => theme.colors.background[theme.mode === 'dark' ? 'dark' : 'light']};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background ${TRANSITION_DURATION} ease;

  @media (min-width: ${breakpoints.tablet}) {
    padding: ${FORM_SPACING}px;
    max-width: 560px;
  }

  @media (min-width: ${breakpoints.desktop}) {
    max-width: 640px;
  }
`;

/**
 * Title component with responsive typography and theme-aware colors
 * Uses Inter font for headings with proper font scaling
 */
export const RegisterFormTitle = styled.h1`
  font-family: ${typography.fontFamilyHeading};
  font-size: ${typography.fontSize.xl};
  line-height: ${typography.lineHeight.tight};
  font-weight: ${typography.fontWeight.semibold};
  text-align: center;
  color: ${({ theme }) => theme.colors.text[theme.mode === 'dark' ? 'dark' : 'light']};
  margin-bottom: ${FORM_SPACING}px;
  transition: color ${TRANSITION_DURATION} ease;

  @media (min-width: ${breakpoints.tablet}) {
    font-size: ${typography.fontSize['2xl']};
  }
`;

/**
 * Container for form fields with accessibility enhancements
 * Implements consistent spacing and focus states
 */
export const RegisterFormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${FIELD_SPACING}px;

  & label {
    font-family: ${typography.fontFamilyBody};
    font-size: ${typography.fontSize.sm};
    color: ${({ theme }) => theme.colors.text[theme.mode === 'dark' ? 'dark' : 'light']};
    margin-bottom: 4px;
    transition: color ${TRANSITION_DURATION} ease;
  }

  & input {
    width: 100%;
    padding: ${spacing.space.sm} ${spacing.space.md};
    background: ${({ theme }) => theme.colors.inputBackground[theme.mode === 'dark' ? 'dark' : 'light']};
    border: 1px solid ${({ theme }) => theme.colors.border[theme.mode === 'dark' ? 'dark' : 'light']};
    border-radius: 4px;
    font-family: ${typography.fontFamilyBody};
    font-size: ${typography.fontSize.base};
    color: ${({ theme }) => theme.colors.text[theme.mode === 'dark' ? 'dark' : 'light']};
    transition: all ${TRANSITION_DURATION} ease;

    &:focus-visible {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
      border-color: ${colors.primary};
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.text[theme.mode === 'dark' ? 'dark' : 'light']}80;
    }
  }
`;

/**
 * Container for form actions with enhanced button styles
 * Implements proper spacing and interactive states
 */
export const RegisterFormActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.baseUnit}px;
  margin-top: ${FIELD_SPACING}px;

  & button {
    width: 100%;
    padding: ${spacing.space.md};
    background: ${colors.primary};
    border: none;
    border-radius: 4px;
    color: #ffffff;
    font-family: ${typography.fontFamilyBody};
    font-size: ${typography.fontSize.base};
    font-weight: ${typography.fontWeight.medium};
    cursor: pointer;
    transition: all ${TRANSITION_DURATION} ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      background: ${({ theme }) => theme.colors.hover[theme.mode === 'dark' ? 'dark' : 'light']};
    }

    &:focus-visible {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

/**
 * Footer section with enhanced link accessibility
 * Implements proper spacing and interactive states for links
 */
export const RegisterFormFooter = styled.div`
  text-align: center;
  margin-top: ${FORM_SPACING}px;
  font-family: ${typography.fontFamilyBody};
  color: ${({ theme }) => theme.colors.text[theme.mode === 'dark' ? 'dark' : 'light']};
  font-size: ${typography.fontSize.sm};
  transition: color ${TRANSITION_DURATION} ease;

  a {
    color: ${colors.primary};
    text-decoration: none;
    margin-left: ${spacing.space.xs};
    transition: all ${TRANSITION_DURATION} ease;

    &:hover {
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid ${colors.primary};
      outline-offset: 2px;
      border-radius: 2px;
    }
  }
`;