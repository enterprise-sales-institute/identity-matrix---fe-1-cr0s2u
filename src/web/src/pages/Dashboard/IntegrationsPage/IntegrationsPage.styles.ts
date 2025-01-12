import styled from 'styled-components'; // v5.3.x
import type { DefaultTheme } from 'styled-components';

/**
 * Main container for the Integrations page with responsive padding
 * and theme-aware styling
 */
export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  padding: ${({ theme }) => theme.spacing.scale.md};
  background: ${({ theme }) => theme.colors.background.main};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  contain: content;

  /* Tablet and above */
  @media (min-width: ${({ theme }) => theme.breakpoints.values.tablet}px) {
    padding: ${({ theme }) => theme.spacing.scale.lg};
  }

  /* Print styles */
  @media print {
    background: white;
    color: black;
    padding: ${({ theme }) => theme.spacing.scale.sm};
  }
`;

/**
 * Header section containing title and action buttons
 * with responsive layout adjustments
 */
export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.scale.lg};
  padding-bottom: ${({ theme }) => theme.spacing.scale.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.main};
  transition: border-color 0.2s ease-in-out;

  /* Mobile layout adjustments */
  @media (max-width: ${({ theme }) => theme.breakpoints.values.mobile}px) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.scale.md};
    align-items: flex-start;
  }

  /* High contrast mode support */
  @media (forced-colors: active) {
    border-bottom: 1px solid CanvasText;
  }
`;

/**
 * Main content area with responsive grid layout for integration cards
 * Implements performance optimizations and RTL support
 */
export const ContentArea = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.scale.lg};
  width: 100%;
  flex: 1;
  contain: layout style;
  margin-top: ${({ theme }) => theme.spacing.scale.md};

  /* Mobile single column layout */
  @media (max-width: ${({ theme }) => theme.breakpoints.values.mobile}px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.scale.md};
  }

  /* RTL support */
  [dir='rtl'] & {
    direction: rtl;
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Integration card wrapper with theme-aware styling
 * and hover/focus states
 */
export const IntegrationCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.scale.lg};
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  cursor: pointer;

  &:hover, &:focus-within {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => 
      theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  }

  /* High contrast mode focus state */
  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }
`;

/**
 * Empty state container with centered content
 * and responsive spacing
 */
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.scale.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  min-height: 300px;
  width: 100%;

  /* Tablet and above */
  @media (min-width: ${({ theme }) => theme.breakpoints.values.tablet}px) {
    padding: ${({ theme }) => theme.spacing.scale['2xl']};
  }
`;