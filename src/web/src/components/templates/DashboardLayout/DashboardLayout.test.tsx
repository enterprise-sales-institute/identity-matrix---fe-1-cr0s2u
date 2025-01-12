import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'styled-components';

// Component imports
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';

// Mock dependencies
jest.mock('../../../hooks/useAuth');
jest.mock('../../../hooks/useTheme');

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Extend expect for accessibility testing
expect.extend(toHaveNoViolations);

describe('DashboardLayout', () => {
  // Mock data
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN'
  };

  // Setup function for rendering with providers
  const renderWithProviders = (ui: React.ReactNode, options = {}) => {
    const mockTheme = {
      mode: 'light',
      colors: {
        background: { light: '#ffffff', dark: '#1a1a1a' },
        text: { light: '#000000', dark: '#ffffff' }
      }
    };

    return render(
      <MemoryRouter>
        <ThemeProvider theme={mockTheme}>
          {ui}
        </ThemeProvider>
      </MemoryRouter>,
      options
    );
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock authentication hook
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockUser,
      logout: jest.fn()
    });

    // Mock theme hook
    (useTheme as jest.Mock).mockReturnValue({
      theme: { mode: 'light' },
      toggleTheme: jest.fn()
    });

    // Reset window dimensions
    window.innerWidth = 1024;
    window.innerHeight = 768;
  });

  describe('Authentication', () => {
    it('should redirect to login when not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        user: null
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(window.location.pathname).toBe('/login');
    });

    it('should render dashboard when authenticated', () => {
      renderWithProviders(<DashboardLayout>Test Content</DashboardLayout>);
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });

    it('should handle logout action', async () => {
      const mockLogout = jest.fn();
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        logout: mockLogout
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      const logoutButton = screen.getByTestId('logout-button');
      await userEvent.click(logoutButton);
      
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Layout Structure', () => {
    it('should render header, sidebar and content area', () => {
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    it('should handle sidebar collapse toggle', async () => {
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      const toggleButton = screen.getByTestId('sidebar-toggle');
      await userEvent.click(toggleButton);
      
      expect(screen.getByTestId('dashboard-sidebar')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should render skip navigation link for accessibility', () => {
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile layout', () => {
      window.innerWidth = 320;
      fireEvent(window, new Event('resize'));
      
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-layout')).toHaveStyle({
        gridTemplateColumns: '1fr'
      });
    });

    it('should adapt to tablet layout', () => {
      window.innerWidth = 768;
      fireEvent(window, new Event('resize'));
      
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-sidebar')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should handle window resize events', async () => {
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      window.innerWidth = 320;
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-sidebar')).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme styles', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: { mode: 'light' },
        toggleTheme: jest.fn()
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-layout')).toHaveStyle({
        backgroundColor: '#ffffff'
      });
    });

    it('should apply dark theme styles', () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: { mode: 'dark' },
        toggleTheme: jest.fn()
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByTestId('dashboard-layout')).toHaveStyle({
        backgroundColor: '#1a1a1a'
      });
    });

    it('should handle theme toggle', async () => {
      const mockToggleTheme = jest.fn();
      (useTheme as jest.Mock).mockReturnValue({
        theme: { mode: 'light' },
        toggleTheme: mockToggleTheme
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      await userEvent.click(themeToggle);
      
      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <DashboardLayout>Content</DashboardLayout>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      const skipLink = screen.getByText('Skip to main content');
      await userEvent.tab();
      
      expect(skipLink).toHaveFocus();
    });

    it('should support screen readers', () => {
      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content');
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', () => {
      const mockError = new Error('Authentication failed');
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        error: mockError
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('should handle theme switching errors', async () => {
      const mockToggleTheme = jest.fn().mockRejectedValue(new Error('Theme switch failed'));
      (useTheme as jest.Mock).mockReturnValue({
        theme: { mode: 'light' },
        toggleTheme: mockToggleTheme
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      const themeToggle = screen.getByTestId('theme-toggle');
      await userEvent.click(themeToggle);
      
      expect(screen.getByText('Theme switch failed')).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network error');
      (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        error: mockError
      });

      renderWithProviders(<DashboardLayout>Content</DashboardLayout>);
      
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});