import styled from 'styled-components';
import { colors, spacing, breakpoints, typography } from '../../../styles/variables.styles';

// Constants for consistent spacing and styling
const SECTION_SPACING = spacing.space.xl; // 2rem
const FORM_GROUP_SPACING = spacing.space.md; // 1rem
const LABEL_SPACING = spacing.space.sm; // 0.5rem
const BORDER_RADIUS = '8px';
const TRANSITION_DURATION = '0.3s';

/**
 * Main container for the settings page with responsive padding and theme transitions
 */
export const SettingsContainer = styled.div`
  max-width: ${spacing.container.md};
  margin: 0 auto;
  padding: ${spacing.space.md};
  background-color: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  transition: background-color ${TRANSITION_DURATION} ease, color ${TRANSITION_DURATION} ease;

  ${breakpoints.mediaQueries.tablet} {
    padding: ${spacing.space.lg};
  }

  ${breakpoints.mediaQueries.desktop} {
    padding: ${spacing.space.xl};
  }
`;

/**
 * Section wrapper with enhanced spacing and theme-aware borders
 */
export const SettingsSection = styled.section`
  margin-bottom: ${SECTION_SPACING};
  padding-bottom: ${SECTION_SPACING};
  border-bottom: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

/**
 * Section title with consistent typography and theme-aware colors
 */
export const SectionTitle = styled.h2`
  font-family: ${typography.fontFamilyHeading};
  font-size: ${typography.fontSize['2xl']};
  font-weight: ${typography.fontWeight.semibold};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  margin-bottom: ${spacing.space.lg};
  line-height: ${typography.lineHeight.tight};
`;

/**
 * Form group container with responsive spacing and layout
 */
export const FormGroup = styled.div`
  margin-bottom: ${FORM_GROUP_SPACING};
  display: flex;
  flex-direction: column;

  ${breakpoints.mediaQueries.tablet} {
    flex-direction: row;
    align-items: center;
    gap: ${spacing.space.lg};
  }
`;

/**
 * Form label with improved typography and theme support
 */
export const Label = styled.label`
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.base};
  font-weight: ${typography.fontWeight.medium};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  margin-bottom: ${LABEL_SPACING};

  ${breakpoints.mediaQueries.tablet} {
    flex: 0 0 120px;
    margin-bottom: 0;
  }
`;

/**
 * Input field with theme-aware styling and transitions
 */
export const Input = styled.input`
  width: 100%;
  padding: ${spacing.space.sm} ${spacing.space.md};
  border-radius: ${BORDER_RADIUS};
  border: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  background-color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.inputBackground.dark : colors.inputBackground.light};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.base};
  transition: border-color ${TRANSITION_DURATION} ease, background-color ${TRANSITION_DURATION} ease;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }

  ${breakpoints.mediaQueries.tablet} {
    flex: 1;
  }
`;

/**
 * Theme toggle group with improved layout and spacing
 */
export const ThemeToggleGroup = styled.div`
  display: flex;
  gap: ${spacing.space.md};
  align-items: center;
  flex-wrap: wrap;

  ${breakpoints.mediaQueries.tablet} {
    flex-wrap: nowrap;
  }
`;

/**
 * Action button container with right alignment
 */
export const ActionContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${spacing.space.lg};
`;

/**
 * Save button with theme-aware styling
 */
export const SaveButton = styled.button`
  background-color: ${colors.primary};
  color: ${colors.text.light};
  padding: ${spacing.space.sm} ${spacing.space.lg};
  border-radius: ${BORDER_RADIUS};
  border: none;
  font-family: ${typography.fontFamilyBody};
  font-weight: ${typography.fontWeight.medium};
  font-size: ${typography.fontSize.base};
  cursor: pointer;
  transition: background-color ${TRANSITION_DURATION} ease;

  &:hover {
    background-color: ${({ theme }) => 
      theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
  }
`;