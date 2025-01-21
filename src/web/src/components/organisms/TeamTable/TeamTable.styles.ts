import styled from 'styled-components';
import { colors, spacing, breakpoints } from '../../../styles/variables.styles';

// Constants for responsive design and layout
const MOBILE_PADDING = parseInt(spacing.baseUnit) / 2;
const TABLET_PADDING = parseInt(spacing.baseUnit);
const DESKTOP_PADDING = parseInt(spacing.baseUnit) * 1.5;
const BORDER_RADIUS = '4px';
const MAX_TABLE_WIDTH = '1200px';
const HEADER_HEIGHT = '56px';

// Helper function for responsive padding
const getResponsivePadding = () => `
  padding: ${MOBILE_PADDING}px;
  
  ${breakpoints.mediaQueries.tablet} {
    padding: ${TABLET_PADDING}px;
  }
  
  ${breakpoints.mediaQueries.desktop} {
    padding: ${DESKTOP_PADDING}px;
  }
`;

export const TableContainer = styled.div`
  width: 100%;
  max-width: ${MAX_TABLE_WIDTH};
  margin: 0 auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  /* Improved scrollbar styling */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
    border-radius: ${BORDER_RADIUS};
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: ${BORDER_RADIUS};
  background: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  /* Ensure proper border radius with overflow */
  overflow: hidden;
  position: relative;
`;

export const TableHeader = styled.thead`
  position: sticky;
  top: 0;
  z-index: 1;
  backdrop-filter: blur(8px);
  
  th {
    ${getResponsivePadding}
    height: ${HEADER_HEIGHT};
    text-align: left;
    font-weight: 600;
    color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
    background: ${({ theme }) => theme.mode === 'dark' ? colors.background.dark : colors.background.light};
    border-bottom: 2px solid ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
    white-space: nowrap;
    
    /* Sort indicator styles */
    &[aria-sort] {
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background: ${({ theme }) => theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
      }
    }
  }
`;

export const TableRow = styled.tr`
  &:hover {
    background: ${({ theme }) => theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
  }

  &:focus-within {
    outline: 2px solid ${colors.primary};
    outline-offset: -2px;
  }
`;

export const TableCell = styled.td`
  ${getResponsivePadding}
  color: ${({ theme }) => theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  border-bottom: 1px solid ${({ theme }) => theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  
  /* Responsive text handling */
  @media (max-width: ${breakpoints.tablet}) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  
  /* Status indicator styles */
  &[data-status] {
    &::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
    }
    
    &[data-status="active"]::before {
      background: #4CAF50;
    }
    
    &[data-status="pending"]::before {
      background: #FFC107;
    }
  }
`;

export const ActionCell = styled.td`
  ${getResponsivePadding}
  text-align: right;
  white-space: nowrap;
  
  /* Action buttons container */
  display: flex;
  gap: ${spacing.space.sm};
  justify-content: flex-end;
  align-items: center;
  
  /* Ensure proper touch targets on mobile */
  @media (max-width: ${breakpoints.mobile}) {
    gap: ${spacing.space.md};
    
    button {
      padding: ${spacing.space.sm};
    }
  }
`;