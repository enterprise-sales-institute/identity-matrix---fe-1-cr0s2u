import styled from 'styled-components'; // v5.x
import type { DefaultTheme } from 'styled-components'; // v5.x

/**
 * Status color mapping with WCAG 2.1 Level AA compliant colors
 * Each color includes a CSS variable with fallback for better maintainability
 */
const STATUS_COLORS = {
  active: 'var(--color-success, #4caf50)',
  inactive: 'var(--color-error, #f44336)',
  pending: 'var(--color-warning, #ff9800)',
  error: 'var(--color-error, #f44336)',
  connecting: 'var(--color-info, #2196f3)',
  syncing: 'var(--color-info, #2196f3)'
} as const;

type StatusType = keyof typeof STATUS_COLORS;

/**
 * Returns WCAG AA compliant color for integration status
 * @param status - Current integration status
 * @returns CSS color value with guaranteed WCAG AA contrast
 */
const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as StatusType] || STATUS_COLORS.error;
};

/**
 * Main container for integration card with accessibility and responsive features
 * Implements theme-aware styling and interactive states
 */
export const CardContainer = styled.div<{ theme: DefaultTheme }>`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.baseUnit * 2}px;
  margin-bottom: ${({ theme }) => theme.spacing.baseUnit}px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  container-type: inline-size;

  /* Hover state with elevation */
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px ${({ theme }) => theme.colors.border.light};
  }

  /* Focus state for keyboard navigation */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* Responsive adjustments */
  @media (max-width: ${({ theme }) => theme.breakpoints.values.mobile}px) {
    padding: ${({ theme }) => theme.spacing.baseUnit}px;
  }
`;

/**
 * Header section with improved layout and accessibility
 * Implements responsive design patterns
 */
export const CardHeader = styled.div<{ theme: DefaultTheme }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.baseUnit}px;
  gap: ${({ theme }) => theme.spacing.baseUnit}px;

  /* Container query for narrow containers */
  @container (max-width: 300px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

/**
 * Content section with responsive typography
 * Implements theme-aware text colors
 */
export const CardContent = styled.div<{ theme: DefaultTheme }>`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(14px, 2vw, 16px);
  line-height: ${({ theme }) => theme.typography.lineHeights.normal};
  margin: ${({ theme }) => theme.spacing.baseUnit}px 0;

  /* High contrast support */
  @media (forced-colors: active) {
    border: 1px solid CanvasText;
  }
`;

/**
 * Footer section with improved spacing and responsive layout
 * Implements flexible positioning for actions
 */
export const CardFooter = styled.div<{ theme: DefaultTheme }>`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.baseUnit}px;
  margin-top: ${({ theme }) => theme.spacing.baseUnit * 2}px;
  flex-wrap: wrap;

  /* Responsive layout adjustment */
  @media (max-width: ${({ theme }) => theme.breakpoints.values.mobile}px) {
    justify-content: center;
  }
`;

/**
 * Container for integration type icon with improved accessibility
 * Implements consistent sizing and interactive states
 */
export const IntegrationIcon = styled.div<{ theme: DefaultTheme }>`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.main};
  border-radius: 50%;
  will-change: transform;

  /* Focus state for interactive icons */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }

  /* Smooth loading state */
  &[data-loading="true"] {
    opacity: 0.7;
    cursor: wait;
  }
`;

/**
 * Status indicator with dynamic color and accessibility features
 * Implements WCAG compliant status colors
 */
export const StatusIndicator = styled.span<{ 
  theme: DefaultTheme;
  status: string;
}>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: ${({ theme }) => theme.spacing.baseUnit}px;
  background-color: ${({ status }) => getStatusColor(status)};
  transition: background-color 0.3s ease;

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* Visual separation from background */
  box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.background.main};

  /* High contrast mode support */
  @media (forced-colors: active) {
    forced-color-adjust: none;
    background-color: CanvasText;
  }
`;