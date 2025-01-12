import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter, useLocation } from 'react-router-dom';
import NavigationItem from './NavigationItem';
import { PROTECTED_ROUTES } from '../../../constants/routes.constants';
import { ThemeConfig } from '../../../types/theme.types';

// Mock location hook
const mockLocation = { pathname: '/' };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation
}));

// Helper function to render with required providers
const renderWithProviders = (
  ui: React.ReactElement,
  {
    theme = {
      mode: 'light',
      colors: {
        text: { primary: '#000000' },
        border: { focus: '#813efb' }
      }
    } as ThemeConfig,
    route = '/'
  } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    </MemoryRouter>
  );
};

// Mock matchMedia for theme testing
const createMatchMedia = (matches: boolean) => {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('NavigationItem Component', () => {
  beforeEach(() => {
    mockLocation.pathname = '/';
    window.matchMedia = createMatchMedia(true);
  });

  describe('Rendering', () => {
    it('renders with icon and label correctly', () => {
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />
      );

      const navItem = screen.getByTestId('nav-item');
      expect(navItem).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Dashboard icon')).toBeInTheDocument();
    });

    it('handles long labels gracefully', () => {
      const longLabel = 'Very Long Navigation Label That Should Be Handled Properly';
      renderWithProviders(
        <NavigationItem
          icon="settings"
          label={longLabel}
          to={PROTECTED_ROUTES.SETTINGS}
        />
      );

      const navItem = screen.getByTestId('nav-item');
      expect(navItem).toBeInTheDocument();
      expect(screen.getByText(longLabel)).toBeInTheDocument();
      // Check text overflow styling
      expect(navItem).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      });
    });

    it('renders in RTL direction correctly', () => {
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />,
        {
          theme: {
            mode: 'light',
            dir: 'rtl'
          } as ThemeConfig
        }
      );

      const navItem = screen.getByTestId('nav-item');
      expect(navItem).toHaveStyle({ direction: 'rtl' });
    });
  });

  describe('Navigation Behavior', () => {
    it('navigates to correct route on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <NavigationItem
          icon="pulse"
          label="Pulse"
          to={PROTECTED_ROUTES.PULSE}
        />
      );

      const navLink = screen.getByRole('link');
      await user.click(navLink);
      expect(mockLocation.pathname).toBe(PROTECTED_ROUTES.PULSE);
    });

    it('maintains active state for current route', () => {
      mockLocation.pathname = PROTECTED_ROUTES.SETTINGS;
      renderWithProviders(
        <NavigationItem
          icon="settings"
          label="Settings"
          to={PROTECTED_ROUTES.SETTINGS}
        />
      );

      const navLink = screen.getByRole('link');
      expect(navLink).toHaveAttribute('aria-current', 'page');
      expect(navLink).toHaveStyleRule('background-color', '#813efb');
    });
  });

  describe('Theme Support', () => {
    it('applies light theme styles correctly', () => {
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />,
        {
          theme: {
            mode: 'light',
            colors: {
              text: { light: '#000000' },
              background: { light: '#ffffff' }
            }
          } as ThemeConfig
        }
      );

      const navItem = screen.getByTestId('nav-item');
      expect(navItem).toHaveStyle({
        backgroundColor: '#ffffff',
        color: '#000000'
      });
    });

    it('applies dark theme styles correctly', () => {
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />,
        {
          theme: {
            mode: 'dark',
            colors: {
              text: { dark: '#ffffff' },
              background: { dark: '#1a1a1a' }
            }
          } as ThemeConfig
        }
      );

      const navItem = screen.getByTestId('nav-item');
      expect(navItem).toHaveStyle({
        backgroundColor: '#1a1a1a',
        color: '#ffffff'
      });
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />
      );

      const navLink = screen.getByRole('link');
      await user.tab();
      expect(navLink).toHaveFocus();
      await user.keyboard('{enter}');
      expect(mockLocation.pathname).toBe(PROTECTED_ROUTES.DASHBOARD);
    });

    it('provides correct ARIA attributes', () => {
      mockLocation.pathname = PROTECTED_ROUTES.DASHBOARD;
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />
      );

      const navLink = screen.getByRole('link');
      expect(navLink).toHaveAttribute('aria-current', 'page');
      expect(navLink).toHaveAttribute('aria-label', 'Dashboard (current page)');
      expect(screen.getByLabelText('Dashboard icon')).toBeInTheDocument();
    });

    it('announces state changes to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <NavigationItem
          icon="dashboard"
          label="Dashboard"
          to={PROTECTED_ROUTES.DASHBOARD}
        />
      );

      const navLink = screen.getByRole('link');
      await user.click(navLink);
      expect(navLink).toHaveAttribute('aria-label', 'Dashboard (current page)');
    });
  });
});