import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { axe, toHaveNoViolations } from 'jest-axe';
import Header from './Header';
import { PROTECTED_ROUTES } from '../../../constants/routes.constants';
import { lightTheme, darkTheme } from '../../../styles/theme.styles';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock hooks
jest.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: lightTheme,
    toggleTheme: jest.fn(),
    isDark: false
  })
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN'
    },
    logout: jest.fn(),
    loading: false
  })
}));

// Helper function to render component with providers
const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  return render(
    <ThemeProvider theme={lightTheme}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </ThemeProvider>,
    options
  );
};

describe('Header Component', () => {
  describe('Basic Rendering', () => {
    beforeEach(() => {
      renderWithProviders(<Header />);
    });

    test('renders header component', () => {
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('role', 'banner');
    });

    test('renders logo section', () => {
      const logo = screen.getByTestId('header-logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('aria-label', 'Identity Matrix Logo');
    });

    test('renders all navigation items', () => {
      const navigation = screen.getByRole('navigation');
      expect(navigation).toBeInTheDocument();
      expect(navigation).toHaveAttribute('aria-label', 'Main navigation');

      const navItems = [
        { testId: 'nav-pulse', label: 'Pulse' },
        { testId: 'nav-integrations', label: 'Integrations' },
        { testId: 'nav-team', label: 'Team' },
        { testId: 'nav-settings', label: 'Settings' }
      ];

      navItems.forEach(({ testId, label }) => {
        const navItem = screen.getByTestId(testId);
        expect(navItem).toBeInTheDocument();
        expect(navItem).toHaveTextContent(label);
      });
    });
  });

  describe('Theme Integration', () => {
    test('applies correct theme styles', () => {
      const { rerender } = renderWithProviders(<Header />);

      // Light theme
      let header = screen.getByTestId('header');
      expect(header).toHaveStyle({
        backgroundColor: lightTheme.colors.background.main
      });

      // Dark theme
      rerender(
        <ThemeProvider theme={darkTheme}>
          <MemoryRouter>
            <Header />
          </MemoryRouter>
        </ThemeProvider>
      );

      header = screen.getByTestId('header');
      expect(header).toHaveStyle({
        backgroundColor: darkTheme.colors.background.main
      });
    });

    test('theme toggle button functions correctly', async () => {
      const mockToggleTheme = jest.fn();
      jest.spyOn(React, 'useContext').mockImplementation(() => ({
        theme: lightTheme,
        toggleTheme: mockToggleTheme
      }));

      renderWithProviders(<Header />);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      await waitFor(() => {
        expect(mockToggleTheme).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Navigation Functionality', () => {
    test('navigation links route to correct paths', () => {
      renderWithProviders(<Header />);

      const navItems = [
        { path: PROTECTED_ROUTES.PULSE, label: 'Pulse' },
        { path: PROTECTED_ROUTES.INTEGRATIONS, label: 'Integrations' },
        { path: PROTECTED_ROUTES.TEAM, label: 'Team' },
        { path: PROTECTED_ROUTES.SETTINGS, label: 'Settings' }
      ];

      navItems.forEach(({ path, label }) => {
        const link = screen.getByText(label);
        expect(link.closest('a')).toHaveAttribute('href', path);
      });
    });

    test('handles active route highlighting', () => {
      renderWithProviders(
        <MemoryRouter initialEntries={[PROTECTED_ROUTES.PULSE]}>
          <Header />
        </MemoryRouter>
      );

      const pulseLink = screen.getByTestId('nav-pulse');
      expect(pulseLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Accessibility Compliance', () => {
    test('meets WCAG accessibility standards', async () => {
      const { container } = renderWithProviders(<Header />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('supports keyboard navigation', () => {
      renderWithProviders(<Header />);
      
      const navigation = screen.getByRole('navigation');
      const focusableElements = within(navigation).getAllByRole('link');

      // Verify tab order
      focusableElements.forEach((element) => {
        element.focus();
        expect(element).toHaveFocus();
      });
    });

    test('provides proper ARIA labels', () => {
      renderWithProviders(<Header />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
      expect(screen.getByTestId('theme-toggle')).toHaveAttribute('aria-label', expect.stringContaining('theme'));
    });
  });

  describe('Responsive Behavior', () => {
    test('handles mobile menu toggle', () => {
      renderWithProviders(<Header />);

      const menuToggle = screen.getByTestId('mobile-menu-toggle');
      expect(menuToggle).toBeInTheDocument();

      fireEvent.click(menuToggle);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(menuToggle);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'false');
    });

    test('closes mobile menu on route change', () => {
      const { rerender } = renderWithProviders(<Header />);

      const menuToggle = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(menuToggle);
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'true');

      // Simulate route change
      rerender(
        <ThemeProvider theme={lightTheme}>
          <MemoryRouter initialEntries={[PROTECTED_ROUTES.TEAM]}>
            <Header />
          </MemoryRouter>
        </ThemeProvider>
      );

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Authentication Integration', () => {
    test('handles logout functionality', async () => {
      const mockLogout = jest.fn();
      jest.spyOn(React, 'useContext').mockImplementation(() => ({
        logout: mockLogout,
        loading: false
      }));

      renderWithProviders(<Header />);
      
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    test('disables logout button while processing', () => {
      jest.spyOn(React, 'useContext').mockImplementation(() => ({
        logout: jest.fn(),
        loading: true
      }));

      renderWithProviders(<Header />);
      
      const logoutButton = screen.getByTestId('logout-button');
      expect(logoutButton).toBeDisabled();
    });
  });
});