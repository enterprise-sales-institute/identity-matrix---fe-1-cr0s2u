/**
 * Styled components for the VisitorCard component
 * Implements theme-aware styling, responsive design, and accessibility features
 * @version 1.0.0
 */

import styled from 'styled-components'; // v5.x
import { CardContainer as BaseCard } from '../../atoms/Card/Card';
import { colors, typography, spacing, breakpoints } from '../../../styles/variables.styles';

// Constants for component styling
const CARD_PADDING = 'var(--spacing-base, 8px)';
const CARD_BORDER_RADIUS = '8px';
const STATUS_INDICATOR_SIZE = '8px';
const HOVER_TRANSITION = 'all 0.2s ease-in-out';
const FOCUS_OUTLINE = '2px solid var(--color-primary)';

/**
 * Enhanced card container with visitor-specific styling
 * Extends base Card component with additional interactive features
 */
export const CardContainer = styled(BaseCard)`
  position: relative;
  cursor: pointer;
  transition: ${HOVER_TRANSITION};
  border-radius: ${CARD_BORDER_RADIUS};
  padding: calc(${CARD_PADDING} * 2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => 
      theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  }

  &:focus-visible {
    outline: ${FOCUS_OUTLINE};
    outline-offset: 2px;
  }

  @media (min-width: ${breakpoints.tablet}) {
    padding: calc(${CARD_PADDING} * 3);
  }
`;

/**
 * Card header with visitor name and status indicator
 * Implements proper spacing and alignment for header content
 */
export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${CARD_PADDING};
  font-family: ${typography.fontFamilyHeading};
  font-weight: ${typography.fontWeight.medium};
  font-size: ${typography.fontSize.lg};

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }
`;

/**
 * Main content area for visitor information
 * Supports responsive layout and proper text wrapping
 */
export const CardContent = styled.div`
  display: grid;
  gap: calc(${CARD_PADDING} * 1.5);
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.base};
  line-height: ${typography.lineHeight.relaxed};

  @media (min-width: ${breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
    gap: calc(${CARD_PADDING} * 2);
  }
`;

/**
 * Status indicator with proper ARIA attributes
 * Implements theme-aware colors for different visitor statuses
 */
export const StatusIndicator = styled.span<{ status: 'active' | 'inactive' | 'new' }>`
  display: inline-block;
  width: ${STATUS_INDICATOR_SIZE};
  height: ${STATUS_INDICATOR_SIZE};
  border-radius: 50%;
  margin-right: ${CARD_PADDING};
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'active':
        return 'var(--color-success, #4CAF50)';
      case 'new':
        return colors.primary;
      default:
        return theme.mode === 'dark' ? '#666666' : '#cccccc';
    }
  }};

  [dir='rtl'] & {
    margin-right: 0;
    margin-left: ${CARD_PADDING};
  }
`;

/**
 * Visitor information container with responsive layout
 * Supports proper text alignment and RTL languages
 */
export const VisitorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: calc(${CARD_PADDING} / 2);

  label {
    color: ${({ theme }) => 
      theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'};
    font-size: ${typography.fontSize.sm};
    font-weight: ${typography.fontWeight.medium};
  }

  span {
    color: ${({ theme }) => 
      theme.mode === 'dark' ? colors.text.dark : colors.text.light};
    font-size: ${typography.fontSize.base};
  }

  [dir='rtl'] & {
    text-align: right;
  }
`;

/**
 * Last seen timestamp with proper formatting
 * Implements high contrast ratio for accessibility
 */
export const LastSeen = styled.time`
  display: block;
  color: ${({ theme }) => 
    theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'};
  font-size: ${typography.fontSize.sm};
  font-family: ${typography.fontFamilyBody};
  margin-top: auto;

  @media (min-width: ${breakpoints.tablet}) {
    text-align: right;
  }

  [dir='rtl'] & {
    text-align: left;
  }
`;