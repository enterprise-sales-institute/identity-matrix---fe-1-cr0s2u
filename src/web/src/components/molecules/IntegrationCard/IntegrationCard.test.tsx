import React from 'react'; // v18.x
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'; // v13.x
import { vi } from 'vitest'; // v0.34.x
import { axe, toHaveNoViolations } from 'jest-axe'; // v4.7.x

import { IntegrationCard } from './IntegrationCard';
import { Integration, IntegrationType, IntegrationStatus } from '../../../types/integration.types';
import { ThemeProvider } from '../../../providers/ThemeProvider';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock theme provider to control theme state
vi.mock('../../../providers/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({
    theme: {
      colors: {
        text: { error: '#f44336' }
      }
    },
    isDark: false
  })
}));

describe('IntegrationCard', () => {
  // Test data setup
  const mockIntegration: Integration = {
    id: 'test-integration-id',
    type: IntegrationType.SALESFORCE,
    status: IntegrationStatus.ACTIVE,
    lastSyncAt: new Date('2023-01-01T00:00:00Z'),
    companyId: 'test-company',
    credentials: {
      clientId: 'test-client',
      clientSecret: 'test-secret',
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      tokenExpiry: new Date()
    },
    config: {
      syncInterval: 3600,
      fieldMappings: [],
      customSettings: {}
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Mock callback functions
  const mockCallbacks = {
    onConnect: vi.fn(() => Promise.resolve()),
    onDisconnect: vi.fn(() => Promise.resolve()),
    onConfigure: vi.fn(() => Promise.resolve())
  };

  // Test IDs for querying elements
  const testIds = {
    card: 'integration-card',
    status: 'integration-status',
    actions: 'integration-actions'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with active integration', () => {
    render(
      <ThemeProvider>
        <IntegrationCard
          integration={mockIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Verify basic content
    expect(screen.getByText('Salesforce')).toBeInTheDocument();
    expect(screen.getByText(IntegrationStatus.ACTIVE)).toBeInTheDocument();
    expect(screen.getByText(/Last sync/)).toBeInTheDocument();

    // Verify correct buttons are shown for active state
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeInTheDocument();
    expect(screen.queryByText('Connect')).not.toBeInTheDocument();
  });

  it('renders correctly with inactive integration', () => {
    const inactiveIntegration = {
      ...mockIntegration,
      status: IntegrationStatus.INACTIVE
    };

    render(
      <ThemeProvider>
        <IntegrationCard
          integration={inactiveIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Verify inactive state UI
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.queryByText('Disconnect')).not.toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeDisabled();
  });

  it('handles connect action correctly', async () => {
    const inactiveIntegration = {
      ...mockIntegration,
      status: IntegrationStatus.INACTIVE
    };

    render(
      <ThemeProvider>
        <IntegrationCard
          integration={inactiveIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Click connect button
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);

    // Verify loading state
    expect(connectButton).toHaveAttribute('aria-busy', 'true');
    expect(connectButton).toBeDisabled();

    // Verify callback was called
    await waitFor(() => {
      expect(mockCallbacks.onConnect).toHaveBeenCalledWith(inactiveIntegration.id);
    });
  });

  it('handles disconnect action correctly', async () => {
    render(
      <ThemeProvider>
        <IntegrationCard
          integration={mockIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Click disconnect button
    const disconnectButton = screen.getByText('Disconnect');
    fireEvent.click(disconnectButton);

    // Verify loading state
    expect(disconnectButton).toHaveAttribute('aria-busy', 'true');
    expect(disconnectButton).toBeDisabled();

    // Verify callback was called
    await waitFor(() => {
      expect(mockCallbacks.onDisconnect).toHaveBeenCalledWith(mockIntegration.id);
    });
  });

  it('handles configure action correctly', async () => {
    render(
      <ThemeProvider>
        <IntegrationCard
          integration={mockIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Click configure button
    const configureButton = screen.getByText('Configure');
    fireEvent.click(configureButton);

    // Verify loading state
    expect(configureButton).toHaveAttribute('aria-busy', 'true');
    expect(configureButton).toBeDisabled();

    // Verify callback was called
    await waitFor(() => {
      expect(mockCallbacks.onConfigure).toHaveBeenCalledWith(mockIntegration.id);
    });
  });

  it('handles error states correctly', async () => {
    // Mock failed connection attempt
    mockCallbacks.onConnect.mockRejectedValueOnce(new Error('Connection failed'));

    const inactiveIntegration = {
      ...mockIntegration,
      status: IntegrationStatus.INACTIVE
    };

    render(
      <ThemeProvider>
        <IntegrationCard
          integration={inactiveIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Connect'));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to connect integration')).toBeInTheDocument();
    });
  });

  it('meets accessibility requirements', async () => {
    const { container } = render(
      <ThemeProvider>
        <IntegrationCard
          integration={mockIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Run accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Verify ARIA attributes
    const card = screen.getByTestId(testIds.card);
    expect(card).toHaveAttribute('role', 'article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Salesforce integration'));
  });

  it('handles keyboard navigation correctly', () => {
    render(
      <ThemeProvider>
        <IntegrationCard
          integration={mockIntegration}
          onConnect={mockCallbacks.onConnect}
          onDisconnect={mockCallbacks.onDisconnect}
          onConfigure={mockCallbacks.onConfigure}
          testId={testIds.card}
        />
      </ThemeProvider>
    );

    // Verify tab navigation
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    // Verify keyboard activation
    const disconnectButton = screen.getByText('Disconnect');
    disconnectButton.focus();
    fireEvent.keyDown(disconnectButton, { key: 'Enter' });
    expect(mockCallbacks.onDisconnect).toHaveBeenCalled();
  });
});