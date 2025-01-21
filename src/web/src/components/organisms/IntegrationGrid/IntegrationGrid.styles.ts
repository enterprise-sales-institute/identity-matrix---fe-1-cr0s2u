import styled from 'styled-components'; // v5.3.x

/**
 * Constants for grid layout and animations
 */
const GRID_GAP = '16px';
const GRID_COLUMNS = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
  wide: 4
};
const MIN_CARD_HEIGHT = '200px';
const HOVER_TRANSFORM = 'translateY(-2px)';
const TRANSITION_DURATION = '0.2s';

/**
 * Main grid container with responsive layout
 * Implements 12-column system with adaptive columns based on breakpoints
 */
export const GridContainer = styled.div`
  display: grid;
  gap: ${GRID_GAP};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.scale.md};
  
  /* Mobile: 1 column */
  grid-template-columns: repeat(${GRID_COLUMNS.mobile}, 1fr);
  
  /* Tablet: 2 columns */
  @media (min-width: ${({ theme }) => theme.breakpoints.values.tablet}px) {
    grid-template-columns: repeat(${GRID_COLUMNS.tablet}, 1fr);
  }
  
  /* Desktop: 3 columns */
  @media (min-width: ${({ theme }) => theme.breakpoints.values.desktop}px) {
    grid-template-columns: repeat(${GRID_COLUMNS.desktop}, 1fr);
  }
  
  /* Wide screens: 4 columns */
  @media (min-width: 1440px) {
    grid-template-columns: repeat(${GRID_COLUMNS.wide}, 1fr);
  }
  
  /* Print layout optimization */
  @media print {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.scale.sm};
  }
`;

/**
 * Individual grid item wrapper for integration cards
 * Implements theme-aware styling and accessibility features
 */
export const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: ${MIN_CARD_HEIGHT};
  
  /* Theme-aware background color */
  background: ${({ theme }) => 
    theme.mode === 'dark' 
      ? theme.colors.background.paper 
      : theme.colors.background.main};
  
  /* Styling */
  border-radius: ${({ theme }) => theme.spacing.scale.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  transition: transform ${TRANSITION_DURATION} ease-in-out, 
              box-shadow ${TRANSITION_DURATION} ease-in-out;
  box-shadow: 0 2px 4px ${({ theme }) => 
    theme.mode === 'dark'
      ? 'rgba(0, 0, 0, 0.2)'
      : 'rgba(0, 0, 0, 0.1)'};
  position: relative;
  overflow: hidden;
  
  /* Interactive states */
  &:hover {
    transform: ${HOVER_TRANSFORM};
    box-shadow: 0 4px 8px ${({ theme }) => 
      theme.mode === 'dark'
        ? 'rgba(0, 0, 0, 0.3)'
        : 'rgba(0, 0, 0, 0.15)'};
  }
  
  /* Keyboard focus styles */
  &:focus-within {
    transform: ${HOVER_TRANSFORM};
    outline: 2px solid ${({ theme }) => theme.colors.primary.main};
    outline-offset: 2px;
  }
  
  /* Accessibility - Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
  
  /* Print optimization */
  @media print {
    box-shadow: none;
    border: 1px solid ${({ theme }) => theme.colors.border.main};
    break-inside: avoid;
  }
`;