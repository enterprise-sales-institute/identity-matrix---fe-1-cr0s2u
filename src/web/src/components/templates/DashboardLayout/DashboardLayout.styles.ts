import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Layout constants for consistent sizing
const SIDEBAR_WIDTH = '280px';
const SIDEBAR_COLLAPSED_WIDTH = '64px';
const HEADER_HEIGHT = '64px';

/**
 * Generates optimized transition properties for smooth animations
 * Uses hardware acceleration and will-change for better performance
 */
const getTransitionStyles = () => `
  width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
  transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)
`;

/**
 * Main dashboard layout container using CSS Grid
 * Implements responsive grid with theme-aware styling
 */
export const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: ${HEADER_HEIGHT} 1fr;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  contain: layout size;
  position: relative;
  isolation: isolate;
`;

/**
 * Main content area with responsive padding and overflow handling
 * Implements mobile-first design with progressive enhancement
 */
export const MainContent = styled.main`
  grid-column: 2;
  grid-row: 2;
  padding: ${spacing.baseUnit};
  overflow-y: auto;
  overscroll-behavior: contain;
  width: 100%;
  height: calc(100vh - ${HEADER_HEIGHT});
  
  @media (min-width: ${breakpoints.tablet}) {
    padding: calc(${spacing.baseUnit} * 2);
  }
  
  @media (min-width: ${breakpoints.desktop}) {
    padding: calc(${spacing.baseUnit} * 3);
  }

  /* Smooth scrolling for modern browsers */
  @media (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }
`;

/**
 * Collapsible sidebar with smooth transitions and responsive behavior
 * Implements theme-aware styling and mobile-optimized interactions
 */
export const SidebarContainer = styled.aside<{ isCollapsed: boolean }>`
  grid-column: 1;
  grid-row: 1 / span 2;
  width: ${props => props.isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH};
  height: 100vh;
  position: fixed;
  background-color: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  border-right: 1px solid ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  transition: ${getTransitionStyles()};
  will-change: transform, width;
  z-index: 10;
  overflow-x: hidden;
  overflow-y: auto;

  /* Mobile-specific styles with slide-out behavior */
  @media (max-width: ${breakpoints.tablet}) {
    transform: translateX(${props => props.isCollapsed ? '-100%' : '0'});
    box-shadow: ${props => props.isCollapsed ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'};
    width: ${SIDEBAR_WIDTH};
  }

  /* Scrollbar styling for webkit browsers */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
    border-radius: 2px;
  }

  /* Focus outline for keyboard navigation */
  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }
`;