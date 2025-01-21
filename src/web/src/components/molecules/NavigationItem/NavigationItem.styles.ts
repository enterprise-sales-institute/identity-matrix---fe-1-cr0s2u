import styled from 'styled-components';
import { Link } from 'react-router-dom'; // v6.x
import { colors, spacing, breakpoints, typography } from '../../../styles/variables.styles';

// Animation and interaction constants
const TRANSITION_DURATION = '0.2s';
const HOVER_OPACITY = '0.8';
const FOCUS_OUTLINE_WIDTH = '2px';
const ACTIVE_OPACITY = '1';

// Container for the navigation item with RTL support
export const NavigationItemContainer = styled.div<{ dir?: 'ltr' | 'rtl' }>`
  display: flex;
  align-items: center;
  padding: ${spacing.space.md};
  margin-block: ${spacing.space.sm};
  margin-inline: 0;
  border-radius: 4px;
  transition: all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1);
  contain: layout style;
  will-change: transform, opacity;
  direction: ${({ dir }) => dir || 'ltr'};

  /* Theme-aware background colors */
  background-color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.background.dark : colors.background.light};

  /* Responsive adjustments */
  ${breakpoints.mediaQueries.mobile} {
    padding: ${spacing.space.sm};
    margin-block: calc(${spacing.space.xs});
  }
`;

// Styled navigation link with active state and accessibility support
export const NavigationLink = styled(Link)<{
  isActive?: boolean;
  dir?: 'ltr' | 'rtl';
}>`
  display: flex;
  align-items: center;
  text-decoration: none;
  width: 100%;
  font-family: ${typography.fontFamilyBody};
  font-size: ${typography.fontSize.base};
  line-height: ${typography.lineHeight.base};
  transition: all ${TRANSITION_DURATION} cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;

  /* Theme-aware text colors */
  color: ${({ theme }) => 
    theme.mode === 'dark' ? colors.text.dark : colors.text.light};

  /* Active state styles */
  ${({ isActive }) =>
    isActive &&
    `
    background-color: ${colors.primary};
    color: ${colors.text.light};
    font-weight: ${typography.fontWeight.medium};
    opacity: ${ACTIVE_OPACITY};
  `}

  /* Hover state with RTL-aware transform */
  &:hover {
    opacity: ${HOVER_OPACITY};
    cursor: pointer;
    transform: translateX(${({ dir }) => (dir === 'rtl' ? '-2px' : '2px')});
  }

  /* Focus state for accessibility */
  &:focus {
    outline: ${FOCUS_OUTLINE_WIDTH} solid ${colors.primary};
    outline-offset: 2px;
    box-shadow: 0 0 0 2px ${({ theme }) =>
      theme.mode === 'dark' ? colors.hover.dark : colors.hover.light};
  }

  /* Focus-visible polyfill support */
  &:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: ${FOCUS_OUTLINE_WIDTH} solid ${colors.primary};
    outline-offset: 2px;
  }

  /* ARIA current page indicator */
  &[aria-current='page'] {
    background-color: ${colors.primary};
    color: ${colors.text.light};
    font-weight: ${typography.fontWeight.medium};
  }
`;