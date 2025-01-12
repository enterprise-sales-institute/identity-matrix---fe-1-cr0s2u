import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Constants for sidebar dimensions and transitions
const SIDEBAR_EXPANDED_WIDTH = '240px';
const SIDEBAR_COLLAPSED_WIDTH = '64px';
const SIDEBAR_TRANSITION = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
const SIDEBAR_SHADOW = '0 2px 8px rgba(0, 0, 0, 0.15)';

// Helper function to calculate sidebar width based on state and viewport
const getCollapsedWidth = (isCollapsed: boolean, isMobile: boolean): string => {
  if (isMobile) return '100%';
  return isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
};

// Main sidebar container with theme and responsive support
export const SidebarContainer = styled.aside<{
  isCollapsed: boolean;
  isMobile: boolean;
}>`
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  border-right: 1px solid ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  transition: ${SIDEBAR_TRANSITION};
  width: ${({ isCollapsed, isMobile }) => getCollapsedWidth(isCollapsed, isMobile)};
  z-index: 1000;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  will-change: transform, width;
  box-shadow: ${({ theme }) => theme.mode === 'light' ? SIDEBAR_SHADOW : 'none'};

  ${breakpoints.mediaQueries.mobile} {
    position: fixed;
    transform: ${({ isCollapsed }) => isCollapsed ? 'translateX(-100%)' : 'translateX(0)'};
    width: 100%;
    max-width: 320px;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Accessibility improvements */
  &[aria-expanded="true"] {
    visibility: visible;
  }

  &[aria-expanded="false"] {
    visibility: ${({ isMobile }) => isMobile ? 'hidden' : 'visible'};
  }

  /* Improved touch targets for mobile */
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      right: 0;
      width: 20px;
      height: 100%;
      cursor: grab;
    }
  }
`;

// Logo container with theme-aware styling
export const SidebarLogo = styled.div`
  padding: ${spacing.baseUnit};
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: ${({ theme }) => theme.mode === 'dark' ? 'flex-start' : 'center'};
  transition: opacity 0.2s ease;
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};

  ${breakpoints.mediaQueries.mobile} {
    justify-content: center;
    padding-top: calc(${spacing.baseUnit} + env(safe-area-inset-top));
  }
`;

// Navigation menu container with accessibility support
export const SidebarNav = styled.nav<{ isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ isMobile }) => isMobile ? spacing.space.md : spacing.space.lg};
  padding: ${spacing.baseUnit};
  role: navigation;
  aria-label: Main navigation;

  /* Improved focus visibility for keyboard navigation */
  a:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
    border-radius: 4px;
  }

  ${breakpoints.mediaQueries.mobile} {
    padding: ${spacing.space.lg};
    gap: ${spacing.space.lg};
  }
`;

// Footer container with theme-aware styling and safe area support
export const SidebarFooter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: ${spacing.baseUnit};
  border-top: 1px solid ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  background: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  transition: border-color 0.2s ease;
  padding-bottom: calc(${spacing.baseUnit} + env(safe-area-inset-bottom));

  /* Theme-aware hover state */
  &:hover {
    background: ${({ theme }) => theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
  }

  ${breakpoints.mediaQueries.mobile} {
    position: fixed;
    padding: ${spacing.space.lg};
    padding-bottom: calc(${spacing.space.lg} + env(safe-area-inset-bottom));
  }
`;