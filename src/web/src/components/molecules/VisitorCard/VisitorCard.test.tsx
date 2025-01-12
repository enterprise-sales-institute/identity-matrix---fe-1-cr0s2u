/**
 * Test suite for VisitorCard component
 * Verifies rendering, interaction, accessibility and theme support
 * @version 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@emotion/react';
import VisitorCard from './VisitorCard';
import { Visitor, VisitorStatus } from '../../../types/visitor.types';
import { ThemeMode } from '../../../types/theme.types';
import { getRelativeTime } from '../../../utils/date.util';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock date utility to ensure consistent tests
jest.mock('../../../utils/date.util', () => ({
  getRelativeTime: jest.fn(() => '5 minutes ago')
}));

/**
 * Creates mock visitor data for testing
 * @param overrides - Optional property overrides
 * @returns Mock visitor object
 */
const createMockVisitor = (overrides?: Partial<Visitor>): Visitor => ({
  id: 'test-visitor-1',
  companyId: 'test-company-1',
  email: 'test@example.com',
  status: VisitorStatus.IDENTIFIED,
  metadata: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    referrer: 'https://google.com',
    location: {
      country: 'US',
      city: 'New York',
      region: 'NY'
    }
  },
  enrichedData: {
    company: 'Test Corp',
    title: 'Engineer',
    industry: 'Technology',
    size: '100-500',
    revenue: '$10M-50M'
  },
  firstSeen: '2023-01-01T00:00:00Z',
  lastSeen: '2023-01-01T00:05:00Z',
  ...overrides
});

/**
 * Helper to render component with theme context
 * @param component - React component to render
 * @param mode - Theme mode to apply
 */
const renderWithTheme = (component: React.ReactElement, mode: ThemeMode = 'light') => {
  const theme = {
    mode,
    colors: mode === 'dark' ? {
      background: '#1a1a1a',
      text: '#ffffff'
    } : {
      background: '#ffffff',
      text: '#000000'
    }
  };
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('VisitorCard Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders identified visitor correctly', () => {
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} />);

      expect(screen.getByText('Identified')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test Corp')).toBeInTheDocument();
      expect(screen.getByText('New York, US')).toBeInTheDocument();
    });

    it('renders anonymous visitor correctly', () => {
      const visitor = createMockVisitor({
        email: null,
        status: VisitorStatus.ANONYMOUS
      });
      renderWithTheme(<VisitorCard visitor={visitor} />);

      expect(screen.getByText('Anonymous')).toBeInTheDocument();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });

    it('renders enriched visitor data when available', () => {
      const visitor = createMockVisitor({
        status: VisitorStatus.ENRICHED
      });
      renderWithTheme(<VisitorCard visitor={visitor} />);

      expect(screen.getByText('Engineer')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('handles missing enriched data gracefully', () => {
      const visitor = createMockVisitor({
        enrichedData: null
      });
      renderWithTheme(<VisitorCard visitor={visitor} />);

      expect(screen.queryByText('Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('Technology')).not.toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('calls onClick handler when clicked', () => {
      const onClick = jest.fn();
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('visitor-card'));
      expect(onClick).toHaveBeenCalledWith(visitor);
    });

    it('supports keyboard navigation', () => {
      const onClick = jest.fn();
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} onClick={onClick} />);

      const card = screen.getByTestId('visitor-card');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onClick).toHaveBeenCalledWith(visitor);

      fireEvent.keyDown(card, { key: ' ' });
      expect(onClick).toHaveBeenCalledWith(visitor);
    });

    it('does not call onClick when not provided', () => {
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} />);

      const card = screen.getByTestId('visitor-card');
      fireEvent.click(card);
      fireEvent.keyDown(card, { key: 'Enter' });
      // Should not throw errors
    });
  });

  // Theme tests
  describe('Theme Support', () => {
    it('renders correctly in light theme', () => {
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} />, 'light');
      
      const card = screen.getByTestId('visitor-card');
      expect(card).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('renders correctly in dark theme', () => {
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} />, 'dark');
      
      const card = screen.getByTestId('visitor-card');
      expect(card).toHaveStyle({ backgroundColor: '#1a1a1a' });
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const visitor = createMockVisitor();
      const { container } = renderWithTheme(<VisitorCard visitor={visitor} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses correct ARIA labels', () => {
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} />);

      const card = screen.getByTestId('visitor-card');
      expect(card).toHaveAttribute('aria-label', `Visitor ${visitor.email} - Identified`);
    });

    it('provides proper focus management', () => {
      const onClick = jest.fn();
      const visitor = createMockVisitor();
      renderWithTheme(<VisitorCard visitor={visitor} onClick={onClick} />);

      const card = screen.getByTestId('visitor-card');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('memoizes correctly to prevent unnecessary re-renders', () => {
      const visitor = createMockVisitor();
      const { rerender } = renderWithTheme(<VisitorCard visitor={visitor} />);

      // Re-render with same props
      rerender(<VisitorCard visitor={visitor} />);
      expect(getRelativeTime).toHaveBeenCalledTimes(1);
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('handles invalid dates gracefully', () => {
      const visitor = createMockVisitor({
        lastSeen: 'invalid-date'
      });
      renderWithTheme(<VisitorCard visitor={visitor} />);

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    it('handles missing location data gracefully', () => {
      const visitor = createMockVisitor({
        metadata: {
          ...createMockVisitor().metadata,
          location: {
            country: '',
            city: '',
            region: ''
          }
        }
      });
      renderWithTheme(<VisitorCard visitor={visitor} />);

      expect(screen.getByText(', ')).toBeInTheDocument();
    });
  });
});