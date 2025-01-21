import styled from 'styled-components'; // v5.x
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Constants for consistent spacing and styling
const MOBILE_PADDING = 'var(--im-spacing-base, 8px)';
const DESKTOP_PADDING = 'calc(var(--im-spacing-base, 8px) * 2)';
const BORDER_COLOR = 'var(--im-color-border, #333333)';
const HOVER_COLOR = 'var(--im-color-hover, #813efb20)';

export const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  border-radius: ${spacing.space.sm};
  background-color: ${({ theme }) => theme.colors.background.paper};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  /* Accessibility improvements */
  outline: none;
  &:focus-within {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.focus};
  }

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.main};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.main};
    border-radius: 4px;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fontFamilies.body};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  
  /* Responsive adjustments */
  ${breakpoints.mediaQueries.mobile} {
    min-width: 600px;
  }
`;

export const TableHeader = styled.thead`
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-bottom: 1px solid ${BORDER_COLOR};
`;

export const TableBody = styled.tbody`
  /* Virtual scrolling support */
  position: relative;
  height: 100%;
`;

export const TableRow = styled.tr<{ isClickable?: boolean }>`
  transition: background-color 0.2s ease;

  /* Interactive states */
  ${({ isClickable }) => isClickable && `
    cursor: pointer;
    
    &:hover {
      background-color: ${HOVER_COLOR};
    }

    &:focus-within {
      outline: none;
      background-color: ${HOVER_COLOR};
    }
  `}

  /* Zebra striping for better readability */
  &:nth-child(even) {
    background-color: ${({ theme }) => 
      theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
  }
`;

export const TableCell = styled.td`
  padding: ${MOBILE_PADDING};
  vertical-align: middle;
  border-bottom: 1px solid ${BORDER_COLOR};
  
  /* Text truncation */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  /* Responsive padding */
  ${breakpoints.mediaQueries.tablet} {
    padding: ${DESKTOP_PADDING};
  }
`;

export const TableHeaderCell = styled.th<{ sortable?: boolean }>`
  padding: ${MOBILE_PADDING};
  text-align: left;
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  white-space: nowrap;
  user-select: none;
  
  /* Sort indicators and interactive states */
  ${({ sortable }) => sortable && `
    cursor: pointer;
    
    &:hover {
      color: ${colors.primary};
    }

    &:focus {
      outline: none;
      color: ${colors.primary};
    }

    /* Sort direction indicators */
    &[aria-sort='ascending']::after {
      content: ' ↑';
    }

    &[aria-sort='descending']::after {
      content: ' ↓';
    }
  `}

  /* Responsive padding */
  ${breakpoints.mediaQueries.tablet} {
    padding: ${DESKTOP_PADDING};
  }
`;

// Empty state styling
export const EmptyStateContainer = styled.tr`
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const EmptyStateCell = styled.td`
  padding: ${spacing.space.xl};
  font-size: ${({ theme }) => theme.typography.fontSizes.body};
  
  /* Center content vertically and horizontally */
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

// Loading state styling
export const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => `${theme.colors.background.main}80`};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;