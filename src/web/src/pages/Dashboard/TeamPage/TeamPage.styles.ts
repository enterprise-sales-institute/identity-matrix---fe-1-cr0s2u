import styled from 'styled-components';
import { colors, spacing, breakpoints, typography } from '../../../styles/variables.styles';

// Constants for layout measurements and transitions
const MOBILE_PADDING = spacing.space.md;
const TABLET_PADDING = spacing.space.lg;
const DESKTOP_PADDING = spacing.space.xl;
const HEADER_HEIGHT = '64px';
const ACTION_BAR_HEIGHT = '56px';
const MAX_CONTENT_WIDTH = '1440px';
const GRID_GAP = spacing.space.lg;
const THEME_TRANSITION = 'all 0.3s ease-in-out';

// Main container for the team page with responsive padding and max-width
export const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  max-width: ${MAX_CONTENT_WIDTH};
  margin: 0 auto;
  padding: ${MOBILE_PADDING};
  background-color: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  transition: ${THEME_TRANSITION};

  ${breakpoints.mediaQueries.tablet} {
    padding: ${TABLET_PADDING};
  }

  ${breakpoints.mediaQueries.desktop} {
    padding: ${DESKTOP_PADDING};
  }
`;

// Header section with flex layout and theme-aware borders
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ${HEADER_HEIGHT};
  margin-bottom: ${spacing.space.lg};
  border-bottom: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  transition: ${THEME_TRANSITION};

  h1 {
    font-family: ${typography.fontFamilyHeading};
    font-size: ${typography.fontSize['2xl']};
    font-weight: ${typography.fontWeight.semibold};
    margin: 0;
  }

  ${breakpoints.mediaQueries.mobile} {
    flex-direction: column;
    height: auto;
    padding-bottom: ${spacing.space.md};
  }

  ${breakpoints.mediaQueries.tablet} {
    flex-direction: row;
    height: ${HEADER_HEIGHT};
  }
`;

// Main content area with grid system and scroll behavior
export const Content = styled.div`
  display: grid;
  grid-gap: ${GRID_GAP};
  margin-bottom: ${ACTION_BAR_HEIGHT};
  min-height: calc(100vh - ${HEADER_HEIGHT} - ${ACTION_BAR_HEIGHT});
  overflow-y: auto;

  // Mobile: single column
  grid-template-columns: 1fr;

  ${breakpoints.mediaQueries.tablet} {
    // Tablet: two columns
    grid-template-columns: repeat(2, 1fr);
  }

  ${breakpoints.mediaQueries.desktop} {
    // Desktop: three columns
    grid-template-columns: repeat(3, 1fr);
  }

  // Improved scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => 
      theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => 
      theme.mode === 'dark' ? colors.border.dark : colors.border.light};
    border-radius: 4px;
  }
`;

// Sticky action bar with responsive behavior
export const ActionBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${ACTION_BAR_HEIGHT};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 ${MOBILE_PADDING};
  background-color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  border-top: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  transition: ${THEME_TRANSITION};
  z-index: 100;

  // Ensure buttons have proper spacing
  button + button {
    margin-left: ${spacing.space.md};
  }

  ${breakpoints.mediaQueries.tablet} {
    padding: 0 ${TABLET_PADDING};
  }

  ${breakpoints.mediaQueries.desktop} {
    padding: 0 ${DESKTOP_PADDING};
    max-width: ${MAX_CONTENT_WIDTH};
    margin: 0 auto;
  }
`;

// Section container for team members and invitations
export const Section = styled.section`
  background-color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.inputBackground.dark : colors.inputBackground.light};
  border-radius: 8px;
  padding: ${spacing.space.lg};
  border: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  transition: ${THEME_TRANSITION};

  h2 {
    font-family: ${typography.fontFamilyHeading};
    font-size: ${typography.fontSize.xl};
    font-weight: ${typography.fontWeight.medium};
    margin: 0 0 ${spacing.space.lg} 0;
  }
`;

// Empty state container with centered content
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${spacing.space.xl};
  text-align: center;
  color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.text.dark : colors.text.light};

  p {
    font-size: ${typography.fontSize.lg};
    margin: ${spacing.space.md} 0;
  }
`;