import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { axe } from '@axe-core/react';
import userEvent from '@testing-library/user-event';

// Component imports
import PulsePage from './PulsePage';
import ThemeProvider from '../../../providers/ThemeProvider';

// Mock imports
jest.mock('../../../hooks/useVisitorData');
jest.mock('../../../hooks/useWebSocket');

/**
 * Helper function to render component with required providers
 */
const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        visitors: (state = preloadedState) => state,
        auth: () => ({ isAuthenticated: true })
      }
    }),
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

/**
 * Mock visitor data generator
 */
const mockVisitorData = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  companyId: 'comp123',
  status: 'IDENTIFIED',
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
    title: 'Manager',
    industry: 'Technology'
  },
  firstSeen: '2023-01-01T00:00:00Z',
  lastSeen: '2023-01-02T00:00:00Z',
  ...overrides
});

describe('PulsePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Layout', () => {
    it('should render without crashing', () => {
      renderWithProviders(<PulsePage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should display loading state correctly', () => {
      const { useVisitorData } = require('../../../hooks/useVisitorData');
      useVisitorData.mockReturnValue({
        loading: true,
        visitors: [],
        error: null
      });

      renderWithProviders(<PulsePage />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle error states appropriately', () => {
      const { useVisitorData } = require('../../../hooks/useVisitorData');
      useVisitorData.mockReturnValue({
        loading: false,
        visitors: [],
        error: 'Failed to load visitors'
      });

      renderWithProviders(<PulsePage />);
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load visitors');
    });

    it('should be responsive at different breakpoints', () => {
      const { container } = renderWithProviders(<PulsePage />);
      expect(container.firstChild).toHaveStyle({
        display: 'flex',
        flexDirection: 'column'
      });
    });
  });

  describe('Visitor Data Management', () => {
    const mockVisitors = [
      mockVisitorData(),
      mockVisitorData({
        id: '456',
        email: 'other@example.com'
      })
    ];

    it('should display visitor list correctly', () => {
      const { useVisitorData } = require('../../../hooks/useVisitorData');
      useVisitorData.mockReturnValue({
        loading: false,
        visitors: mockVisitors,
        error: null
      });

      renderWithProviders(<PulsePage />);
      expect(screen.getAllByRole('row')).toHaveLength(mockVisitors.length + 1); // +1 for header
    });

    it('should handle visitor selection', async () => {
      const { useVisitorData } = require('../../../hooks/useVisitorData');
      const selectVisitor = jest.fn();
      useVisitorData.mockReturnValue({
        loading: false,
        visitors: mockVisitors,
        selectVisitor,
        error: null
      });

      renderWithProviders(<PulsePage />);
      await userEvent.click(screen.getByText('test@example.com'));
      expect(selectVisitor).toHaveBeenCalledWith('123');
    });

    it('should handle filtering operations', async () => {
      const { useVisitorData } = require('../../../hooks/useVisitorData');
      const updateFilter = jest.fn();
      useVisitorData.mockReturnValue({
        loading: false,
        visitors: mockVisitors,
        updateFilter,
        error: null
      });

      renderWithProviders(<PulsePage />);
      await userEvent.type(screen.getByPlaceholderText('Search visitors...'), 'test');
      await waitFor(() => {
        expect(updateFilter).toHaveBeenCalledWith(expect.objectContaining({
          search: 'test'
        }));
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket connection status', () => {
      const { useWebSocket } = require('../../../hooks/useWebSocket');
      useWebSocket.mockReturnValue({
        connectionStatus: 'connected'
      });

      renderWithProviders(<PulsePage />);
      expect(screen.getByText('Real-time updates active')).toBeInTheDocument();
    });

    it('should update visitor data on real-time events', async () => {
      const { useVisitorData } = require('../../../hooks/useVisitorData');
      const { useWebSocket } = require('../../../hooks/useWebSocket');
      
      const fetchVisitors = jest.fn();
      useVisitorData.mockReturnValue({
        loading: false,
        visitors: [mockVisitorData()],
        fetchVisitors,
        error: null
      });

      useWebSocket.mockReturnValue({
        connectionStatus: 'connected',
        subscribe: (event: string, callback: Function) => {
          callback({ type: 'visitor_update' });
        }
      });

      renderWithProviders(<PulsePage />);
      await waitFor(() => {
        expect(fetchVisitors).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('should render initial content within performance budget', async () => {
      const startTime = performance.now();
      renderWithProviders(<PulsePage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // 200ms budget
    });

    it('should handle large visitor lists efficiently', async () => {
      const largeVisitorList = Array(1000).fill(null).map((_, index) => 
        mockVisitorData({ id: `visitor${index}` })
      );

      const { useVisitorData } = require('../../../hooks/useVisitorData');
      useVisitorData.mockReturnValue({
        loading: false,
        visitors: largeVisitorList,
        error: null
      });

      const startTime = performance.now();
      renderWithProviders(<PulsePage />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // 1s budget for large lists
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<PulsePage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<PulsePage />);
      const table = screen.getByRole('table');
      await userEvent.tab();
      expect(table).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      renderWithProviders(<PulsePage />);
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Visitor tracking dashboard');
    });

    it('should announce real-time updates', () => {
      renderWithProviders(<PulsePage />);
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});