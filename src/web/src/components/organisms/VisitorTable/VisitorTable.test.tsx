import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

import VisitorTable from './VisitorTable';
import { ThemeProvider } from '../../../providers/ThemeProvider';
import { Visitor, VisitorStatus } from '../../../types/visitor.types';
import visitorsReducer from '../../../store/visitors/visitors.slice';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Helper function to render component with required providers
 */
const renderWithProviders = (
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { visitors: visitorsReducer },
      preloadedState
    }),
    themeMode = 'light',
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider defaultMode={themeMode}>
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
 * Generate mock visitor data for testing
 */
const generateMockVisitorData = (count = 10): Visitor[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `visitor-${index}`,
    companyId: `company-${Math.floor(index / 3)}`,
    email: index % 3 === 0 ? null : `visitor${index}@example.com`,
    status: Object.values(VisitorStatus)[index % 3],
    metadata: {
      ipAddress: `192.168.1.${index}`,
      userAgent: 'Mozilla/5.0',
      referrer: 'https://google.com',
      location: {
        country: 'US',
        city: 'New York',
        region: 'NY'
      }
    },
    enrichedData: index % 3 === 0 ? null : {
      company: `Company ${index}`,
      title: 'Manager',
      industry: 'Technology',
      size: '50-100',
      revenue: '$1M-$5M'
    },
    firstSeen: dayjs().subtract(index, 'days').toISOString(),
    lastSeen: dayjs().subtract(index, 'hours').toISOString()
  }));
};

describe('VisitorTable Component', () => {
  // Mock ResizeObserver for Material Table
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <VisitorTable visitors={generateMockVisitorData()} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<VisitorTable visitors={generateMockVisitorData()} />);
      
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      
      // Focus first row
      rows[1].focus();
      expect(document.activeElement).toBe(rows[1]);
      
      // Navigate with keyboard
      fireEvent.keyDown(rows[1], { key: 'ArrowDown' });
      expect(document.activeElement).toBe(rows[2]);
    });

    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<VisitorTable visitors={generateMockVisitorData()} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label');
      expect(screen.getAllByRole('columnheader')).toHaveLength(6);
    });
  });

  describe('Data Display and Interaction', () => {
    const mockVisitors = generateMockVisitorData();

    it('should render all visitor data correctly', () => {
      renderWithProviders(<VisitorTable visitors={mockVisitors} />);
      
      mockVisitors.forEach(visitor => {
        expect(screen.getByText(visitor.email || 'Anonymous')).toBeInTheDocument();
        if (visitor.enrichedData) {
          expect(screen.getByText(visitor.enrichedData.company)).toBeInTheDocument();
        }
      });
    });

    it('should handle sorting correctly', async () => {
      renderWithProviders(<VisitorTable visitors={mockVisitors} />);
      
      // Click email header to sort
      const emailHeader = screen.getByText('Email');
      fireEvent.click(emailHeader);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('Anonymous');
      });
    });

    it('should handle filtering correctly', async () => {
      renderWithProviders(<VisitorTable visitors={mockVisitors} />);
      
      const searchInput = screen.getByRole('searchbox');
      await userEvent.type(searchInput, 'visitor1');
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(2); // Header + 1 filtered row
      });
    });

    it('should handle row selection', async () => {
      const onVisitorSelect = jest.fn();
      renderWithProviders(
        <VisitorTable 
          visitors={mockVisitors} 
          onVisitorSelect={onVisitorSelect}
        />
      );
      
      const firstRow = screen.getAllByRole('row')[1];
      fireEvent.click(firstRow);
      
      expect(onVisitorSelect).toHaveBeenCalledWith(mockVisitors[0]);
    });
  });

  describe('Theme Support', () => {
    it('should render correctly in light theme', () => {
      renderWithProviders(
        <VisitorTable visitors={generateMockVisitorData()} />,
        { themeMode: 'light' }
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    it('should render correctly in dark theme', () => {
      renderWithProviders(
        <VisitorTable visitors={generateMockVisitorData()} />,
        { themeMode: 'dark' }
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveStyle({ backgroundColor: 'rgb(26, 26, 26)' });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time visitor updates', async () => {
      const initialVisitors = generateMockVisitorData(1);
      const { rerender } = renderWithProviders(
        <VisitorTable visitors={initialVisitors} />
      );

      const updatedVisitors = [
        { ...initialVisitors[0], email: 'updated@example.com' }
      ];

      rerender(
        <Provider store={configureStore({ reducer: { visitors: visitorsReducer } })}>
          <ThemeProvider>
            <VisitorTable visitors={updatedVisitors} />
          </ThemeProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('updated@example.com')).toBeInTheDocument();
      });
    });

    it('should show connection status when enabled', () => {
      renderWithProviders(
        <VisitorTable 
          visitors={generateMockVisitorData()} 
          showConnectionStatus={true}
        />
      );
      
      expect(screen.getByText(/Real-time updates/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      renderWithProviders(
        <VisitorTable 
          visitors={[]} 
          error="Failed to load visitors"
        />
      );
      
      expect(screen.getByText('Failed to load visitors')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      renderWithProviders(
        <VisitorTable 
          visitors={[]} 
          loading={true}
        />
      );
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should handle export action', async () => {
      const onExport = jest.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <VisitorTable 
          visitors={generateMockVisitorData()} 
          onExport={onExport}
        />
      );
      
      const exportButton = screen.getByTitle('Export Data');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(onExport).toHaveBeenCalled();
      });
    });
  });
});