import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Constants for component styling
const CONTAINER_PADDING = parseInt(spacing.baseUnit) * 3;
const HEADER_HEIGHT = 64;
const TABLE_MIN_HEIGHT = 400;
const BORDER_RADIUS = 8;

/**
 * Utility function to generate responsive styles
 * @param styles - Object containing styles for different breakpoints
 */
const createResponsiveStyles = (styles: Record<string, string>) => {
  return Object.entries(styles)
    .map(([breakpoint, value]) => {
      switch (breakpoint) {
        case 'mobile':
          return `${breakpoints.mediaQueries.mobile} { ${value} }`;
        case 'tablet':
          return `${breakpoints.mediaQueries.tablet} { ${value} }`;
        case 'desktop':
          return `${breakpoints.mediaQueries.desktop} { ${value} }`;
        default:
          return value;
      }
    })
    .join('\n');
};

/**
 * Main container for the pulse page with responsive padding and theme support
 */
export const Container = styled.div`
  padding: ${CONTAINER_PADDING}px;
  min-height: 100vh;
  background-color: ${({ theme }) =>
    theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  color: ${({ theme }) =>
    theme.mode === 'dark' ? colors.text.dark : colors.text.light};

  ${createResponsiveStyles({
    mobile: `padding: ${spacing.space.md}`,
    tablet: `padding: ${spacing.space.lg}`,
    desktop: `padding: ${spacing.space.xl}`
  })}
`;

/**
 * Header component with flex layout and consistent height
 */
export const Header = styled.div`
  height: ${HEADER_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${spacing.space.md};
  margin-bottom: ${spacing.space.lg};
  border-bottom: 1px solid ${({ theme }) =>
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};

  ${breakpoints.mediaQueries.tablet} {
    padding: 0 ${spacing.space.lg};
  }
`;

/**
 * Container for search and filter elements with responsive layout
 */
export const SearchContainer = styled.div`
  margin-bottom: ${spacing.space.lg};
  display: flex;
  flex-direction: column;
  gap: ${spacing.space.md};

  ${breakpoints.mediaQueries.tablet} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  ${breakpoints.mediaQueries.desktop} {
    gap: ${spacing.space.lg};
  }
`;

/**
 * Container for visitor data table with overflow handling
 */
export const TableContainer = styled.div`
  min-height: ${TABLE_MIN_HEIGHT}px;
  overflow: auto;
  border-radius: ${BORDER_RADIUS}px;
  border: 1px solid ${({ theme }) =>
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  background-color: ${({ theme }) =>
    theme.mode === 'dark' ? colors.inputBackground.dark : colors.inputBackground.light};

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${colors.primary}40;
    border-radius: ${BORDER_RADIUS}px;
  }

  ${breakpoints.mediaQueries.tablet} {
    min-height: ${TABLE_MIN_HEIGHT * 1.5}px;
  }
`;

/**
 * Export action button container
 */
export const ActionContainer = styled.div`
  display: flex;
  gap: ${spacing.space.sm};
  margin-left: auto;

  ${breakpoints.mediaQueries.mobile} {
    gap: ${spacing.space.md};
  }
`;

/**
 * Empty state container with centered content
 */
export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${spacing.space.xl};
  text-align: center;
  min-height: ${TABLE_MIN_HEIGHT / 2}px;
  color: ${({ theme }) =>
    theme.mode === 'dark' ? colors.text.dark : colors.text.light}80;
`;

/**
 * Loading state overlay container
 */
export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${TABLE_MIN_HEIGHT}px;
  background-color: ${({ theme }) =>
    theme.mode === 'dark' ? `${colors.background.dark}80` : `${colors.background.light}80`};
`;