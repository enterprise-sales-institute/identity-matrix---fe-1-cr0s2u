/**
 * Styled components for the Card atomic component
 * Implements theme-aware styles, elevation, spacing and responsive behavior
 * @version 1.0.0
 */

import styled from 'styled-components'; // v5.x
import { colors, spacing, breakpoints, typography } from '../../../styles/variables.styles';

// Card style constants
const CARD_PADDING = parseInt(spacing.baseUnit) * 2;
const CARD_BORDER_RADIUS = 4;
const CARD_TRANSITION = 'all 0.3s ease';
const CARD_Z_INDEX = 1;
const CARD_MIN_WIDTH = 280;
const CARD_MAX_WIDTH = '100%';

// Elevation levels for box-shadow
const elevation = {
  low: '0 2px 4px rgba(0, 0, 0, 0.1)',
  medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
  high: '0 8px 16px rgba(0, 0, 0, 0.2)'
};

/**
 * Main card container with enhanced theme-aware styling and accessibility
 * Implements WCAG 2.1 Level AA compliant focus states and color contrast
 */
export const CardContainer = styled.div`
  position: relative;
  z-index: ${CARD_Z_INDEX};
  min-width: ${CARD_MIN_WIDTH}px;
  max-width: ${CARD_MAX_WIDTH};
  background-color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.background.dark : colors.background.light};
  color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.text.dark : colors.text.light};
  border: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  border-radius: ${CARD_BORDER_RADIUS}px;
  box-shadow: ${elevation.low};
  transition: ${CARD_TRANSITION};
  margin-bottom: ${spacing.baseUnit}px;
  padding: ${CARD_PADDING}px;
  overflow: hidden;
  contain: content;

  /* Responsive padding adjustments */
  @media (min-width: ${breakpoints.tablet}) {
    padding: ${CARD_PADDING * 1.5}px;
  }

  /* Interactive states */
  &:hover {
    box-shadow: ${elevation.medium};
  }

  &:focus-within {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  /* RTL support */
  [dir='rtl'] & {
    text-align: right;
  }
`;

/**
 * Card header section with enhanced layout and typography
 * Implements consistent spacing and flexible layout for actions
 */
export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${spacing.baseUnit}px;
  border-bottom: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  margin-bottom: ${spacing.baseUnit}px;
  font-family: ${typography.fontFamilyHeading};
  font-weight: ${typography.fontWeight.medium};
  font-size: ${typography.fontSize.lg};
  line-height: ${typography.lineHeight.base};

  /* Header action alignment */
  .card-header-action {
    margin-left: auto;
  }

  /* RTL support for header actions */
  [dir='rtl'] & .card-header-action {
    margin-left: 0;
    margin-right: auto;
  }
`;

/**
 * Main content area with improved layout control
 * Supports configurable max height with smooth scrolling
 */
export const CardContent = styled.div<{ maxHeight?: string }>`
  padding: ${spacing.baseUnit}px 0;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: ${({ maxHeight }) => maxHeight || 'none'};
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.base};
  line-height: ${typography.lineHeight.relaxed};
  -webkit-overflow-scrolling: touch;
`;

/**
 * Card footer with enhanced action layout
 * Supports configurable alignment for action buttons
 */
export const CardFooter = styled.div<{ alignment?: string }>`
  display: flex;
  align-items: center;
  justify-content: ${({ alignment }) => alignment || 'flex-start'};
  gap: ${spacing.baseUnit}px;
  padding-top: ${spacing.baseUnit}px;
  border-top: 1px solid ${({ theme }) => 
    theme.mode === 'dark' ? colors.border.dark : colors.border.light};
  margin-top: ${spacing.baseUnit}px;
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.sm};

  /* RTL support for footer actions */
  [dir='rtl'] & {
    flex-direction: row-reverse;
  }
`;