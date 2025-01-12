import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { axe } from '@axe-core/react';

import IntegrationsPage from './IntegrationsPage';
import DashboardLayout from '../../../components/templates/DashboardLayout/DashboardLayout';
import { IntegrationType, IntegrationStatus } from '../../../types/integration.types';

// Mock data
const mockIntegrations = [
  {
    id: '1',
    type: IntegrationType.SALESFORCE,
    status: IntegrationStatus.ACTIVE,
    lastSyncAt: new Date().toISOString(),
    config: {
      syncInterval: 300000,
      fieldMappings: []
    }
  },
  {
    id: '2',
    type: IntegrationType.HUBSPOT,
    status: IntegrationStatus.INACTIVE,
    lastSyncAt: null,
    config: {
      syncInterval: 300000,
      fieldMappings: []
    }
  }
];

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      integrations: (state = initialState, action) => state,
      auth: () => ({ user: { role: 'ADMIN' } })
    },
    preloadedState: {
      integrations: {
        integrations: mockIntegrations,
        loading: false,
        error: null,
        lastSync: new Date(),
        pendingOperations: {}
      }
    }
  });
};

// Test utilities
const renderWithProviders = (
  ui: React.ReactElement,
  { initialState = {}, store = createMockStore(initialState), ...renderOptions } = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

describe('IntegrationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the integrations page with correct title', () => {
      renderWithProviders(<IntegrationsPage />);
      expect(screen.getByText('Integrations')).toBeInTheDocument();
      expect(screen.getByText('Manage your CRM integrations and data synchronization')).toBeInTheDocument();
    });

    it('should render integration cards for each integration', () => {
      renderWithProviders(<IntegrationsPage />);
      expect(screen.getAllByRole('article')).toHaveLength(mockIntegrations.length);
    });

    it('should display loading state when fetching integrations', () => {
      const loadingStore = createMockStore({
        integrations: {
          loading: true,
          integrations: []
        }
      });
      renderWithProviders(<IntegrationsPage />, { store: loadingStore });
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(<IntegrationsPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      renderWithProviders(<IntegrationsPage />);
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Integrations Management');
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Integration Management', () => {
    it('should handle connecting a new integration', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntegrationsPage />);
      
      const connectButton = screen.getAllByRole('button', { name: /connect/i })[0];
      await user.click(connectButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Integration connected successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle disconnecting an integration with confirmation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntegrationsPage />);
      
      const disconnectButton = screen.getAllByRole('button', { name: /disconnect/i })[0];
      await user.click(disconnectButton);
      
      // Confirm dialog
      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Integration disconnected successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle integration configuration updates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<IntegrationsPage />);
      
      const configureButton = screen.getAllByRole('button', { name: /configure/i })[0];
      await user.click(configureButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Integration configuration updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when integration operation fails', async () => {
      const errorStore = createMockStore({
        integrations: {
          error: { message: 'Failed to connect integration' }
        }
      });
      renderWithProviders(<IntegrationsPage />, { store: errorStore });
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to connect integration');
    });

    it('should allow retrying failed operations', async () => {
      const user = userEvent.setup();
      const errorStore = createMockStore({
        integrations: {
          error: { message: 'Operation failed' }
        }
      });
      renderWithProviders(<IntegrationsPage />, { store: errorStore });
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should restrict certain actions for non-admin users', () => {
      const restrictedStore = createMockStore({
        auth: { user: { role: 'VIEWER' } }
      });
      renderWithProviders(<IntegrationsPage />, { store: restrictedStore });
      
      expect(screen.queryByRole('button', { name: /connect/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
    });

    it('should allow full access for admin users', () => {
      const adminStore = createMockStore({
        auth: { user: { role: 'ADMIN' } }
      });
      renderWithProviders(<IntegrationsPage />, { store: adminStore });
      
      expect(screen.getAllByRole('button', { name: /connect|disconnect|configure/i })).toHaveLength(3);
    });
  });

  describe('Real-Time Updates', () => {
    it('should update integration status in real-time', async () => {
      const { rerender } = renderWithProviders(<IntegrationsPage />);
      
      const updatedIntegrations = [...mockIntegrations];
      updatedIntegrations[0].status = IntegrationStatus.SYNCING;
      
      rerender(<IntegrationsPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/syncing/i)).toBeInTheDocument();
      });
    });
  });
});