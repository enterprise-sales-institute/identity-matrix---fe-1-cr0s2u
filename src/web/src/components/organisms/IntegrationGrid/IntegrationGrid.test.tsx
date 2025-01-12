import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import { IntegrationGrid } from './IntegrationGrid';
import { lightTheme } from '../../../styles/theme.styles';
import integrationsReducer from '../../../store/integrations/integrations.slice';
import { Integration, IntegrationType, IntegrationStatus } from '../../../types/integration.types';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock useIntegration hook
jest.mock('../../../hooks/useIntegration', () => ({
  useIntegration: () => ({
    integrations: mockIntegrations,
    loading: false,
    error: null,
    createIntegration: jest.fn(),
    updateIntegration: jest.fn(),
    deleteIntegration: jest.fn(),
    syncIntegrationData: jest.fn()
  })
}));

// Mock ResizeObserver for responsive testing
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Test data
const mockIntegrations: Integration[] = [
  {
    id: 'test-integration-1',
    companyId: 'test-company',
    type: IntegrationType.SALESFORCE,
    status: IntegrationStatus.ACTIVE,
    lastSyncAt: new Date('2023-01-01T00:00:00Z'),
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    credentials: {
      clientId: 'test-client',
      clientSecret: 'test-secret',
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      tokenExpiry: new Date('2024-01-01T00:00:00Z')
    },
    config: {
      syncInterval: 300000,
      fieldMappings: [],
      customSettings: {}
    }
  },
  {
    id: 'test-integration-2',
    companyId: 'test-company',
    type: IntegrationType.HUBSPOT,
    status: IntegrationStatus.INACTIVE,
    lastSyncAt: null,
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    credentials: {
      clientId: 'test-client',
      clientSecret: 'test-secret',
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      tokenExpiry: new Date('2024-01-01T00:00:00Z')
    },
    config: {
      syncInterval: 300000,
      fieldMappings: [],
      customSettings: {}
    }
  }
];

// Test viewport sizes
const viewportSizes = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 }
};

// Test setup utility
const setupTest = (props = {}) => {
  const store = configureStore({
    reducer: {
      integrations: integrationsReducer
    }
  });

  return render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <IntegrationGrid {...props} />
      </ThemeProvider>
    </Provider>
  );
};

describe('IntegrationGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering States', () => {
    it('should render loading state correctly', () => {
      jest.spyOn(require('../../../hooks/useIntegration'), 'useIntegration')
        .mockImplementation(() => ({
          integrations: [],
          loading: true,
          error: null
        }));

      setupTest();
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
    });

    it('should render error state with retry button', () => {
      const errorMessage = 'Failed to load integrations';
      jest.spyOn(require('../../../hooks/useIntegration'), 'useIntegration')
        .mockImplementation(() => ({
          integrations: [],
          loading: false,
          error: new Error(errorMessage)
        }));

      setupTest();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render integration cards when data is available', () => {
      setupTest();
      expect(screen.getAllByRole('article')).toHaveLength(mockIntegrations.length);
    });
  });

  describe('Integration Management', () => {
    it('should handle connect action correctly', async () => {
      const { useIntegration } = require('../../../hooks/useIntegration');
      const updateIntegration = jest.fn();
      useIntegration.mockImplementation(() => ({
        integrations: mockIntegrations,
        loading: false,
        error: null,
        updateIntegration
      }));

      setupTest();
      const connectButton = screen.getByRole('button', { name: /connect hubspot/i });
      await userEvent.click(connectButton);
      
      expect(updateIntegration).toHaveBeenCalledWith('test-integration-2', {
        status: IntegrationStatus.ACTIVE
      });
    });

    it('should handle disconnect action with confirmation', async () => {
      const { useIntegration } = require('../../../hooks/useIntegration');
      const updateIntegration = jest.fn();
      useIntegration.mockImplementation(() => ({
        integrations: mockIntegrations,
        loading: false,
        error: null,
        updateIntegration
      }));

      setupTest();
      const disconnectButton = screen.getByRole('button', { name: /disconnect salesforce/i });
      await userEvent.click(disconnectButton);
      
      expect(updateIntegration).toHaveBeenCalledWith('test-integration-1', {
        status: IntegrationStatus.INACTIVE
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = setupTest();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      setupTest();
      const firstCard = screen.getAllByRole('article')[0];
      const connectButton = within(firstCard).getByRole('button');
      
      connectButton.focus();
      expect(document.activeElement).toBe(connectButton);
    });

    it('should have proper ARIA labels', () => {
      setupTest();
      expect(screen.getByRole('grid', { name: /crm integrations/i })).toBeInTheDocument();
      
      const cards = screen.getAllByRole('article');
      cards.forEach(card => {
        expect(card).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Responsive Behavior', () => {
    Object.entries(viewportSizes).forEach(([size, dimensions]) => {
      it(`should adapt layout for ${size} viewport`, () => {
        window.innerWidth = dimensions.width;
        window.innerHeight = dimensions.height;
        window.dispatchEvent(new Event('resize'));

        setupTest();
        const grid = screen.getByTestId('integration-grid');
        const styles = window.getComputedStyle(grid);
        
        if (dimensions.width <= viewportSizes.mobile.width) {
          expect(styles.gridTemplateColumns).toMatch(/repeat\(1,\s*1fr\)/);
        } else if (dimensions.width <= viewportSizes.tablet.width) {
          expect(styles.gridTemplateColumns).toMatch(/repeat\(2,\s*1fr\)/);
        } else {
          expect(styles.gridTemplateColumns).toMatch(/repeat\(3,\s*1fr\)/);
        }
      });
    });
  });

  describe('Error Boundary', () => {
    it('should catch and display render errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test render error');
      
      jest.spyOn(require('../../../hooks/useIntegration'), 'useIntegration')
        .mockImplementation(() => {
          throw error;
        });

      setupTest();
      
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });
});