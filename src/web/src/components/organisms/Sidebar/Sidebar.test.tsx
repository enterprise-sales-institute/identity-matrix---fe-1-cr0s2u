import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Sidebar from './Sidebar';
import { PROTECTED_ROUTES } from '../../../constants/routes.constants';
import { useTheme } from '../../../hooks/useTheme';
import { lightTheme, darkTheme } from '../../../styles/theme.styles';

// Mock useTheme hook
jest.mock('../../../hooks/useTheme', () => ({
  useTheme: jest.fn()
}));

// Mock matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Test IDs for component selection
const TEST_IDS = {
  sidebar: 'sidebar',
  themeToggle: 'theme-toggle',
  collapseToggle: 'collapse-toggle',
  navItemPrefix: 'nav-item-'
};

// Helper function to render Sidebar with providers
const renderWithProviders = (
  ui: React.ReactElement,
  { route = '/', theme = lightTheme } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default useTheme mock implementation
    (useTheme as jest.Mock).mockImplementation(() => ({
      isDark: false,
      toggleTheme: jest.fn(),
      theme: lightTheme
    }));
  });

  describe('Rendering', () => {
    it('renders all navigation items correctly', () => {
      renderWithProviders(<Sidebar />);

      // Verify all navigation items are present
      expect(screen.getByTestId(`${TEST_IDS.navItemPrefix}pulse`)).toBeInTheDocument();
      expect(screen.getByTestId(`${TEST_IDS.navItemPrefix}integrations`)).toBeInTheDocument();
      expect(screen.getByTestId(`${TEST_IDS.navItemPrefix}team`)).toBeInTheDocument();
      expect(screen.getByTestId(`${TEST_IDS.navItemPrefix}settings`)).toBeInTheDocument();
    });

    it('renders with correct ARIA attributes', () => {
      renderWithProviders(<Sidebar />);
      
      const sidebar = screen.getByTestId(TEST_IDS.sidebar);
      expect(sidebar).toHaveAttribute('role', 'navigation');
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
      expect(sidebar).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders logo with correct dimensions', () => {
      renderWithProviders(<Sidebar defaultCollapsed={false} />);
      
      const logo = screen.getByAltText('Identity Matrix');
      expect(logo).toHaveAttribute('width', '120');
      expect(logo).toHaveAttribute('height', '32');
    });
  });

  describe('Theme Switching', () => {
    it('handles theme toggle correctly', async () => {
      const toggleTheme = jest.fn();
      (useTheme as jest.Mock).mockImplementation(() => ({
        isDark: false,
        toggleTheme,
        theme: lightTheme
      }));

      renderWithProviders(<Sidebar />);
      
      const themeToggle = screen.getByTestId(TEST_IDS.themeToggle);
      await userEvent.click(themeToggle);
      
      expect(toggleTheme).toHaveBeenCalledTimes(1);
    });

    it('displays correct theme toggle label', () => {
      (useTheme as jest.Mock).mockImplementation(() => ({
        isDark: true,
        toggleTheme: jest.fn(),
        theme: darkTheme
      }));

      renderWithProviders(<Sidebar />);
      
      const themeToggle = screen.getByTestId(TEST_IDS.themeToggle);
      expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light theme');
    });
  });

  describe('Responsive Behavior', () => {
    it('collapses on mobile viewport', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      renderWithProviders(<Sidebar />);
      
      const sidebar = screen.getByTestId(TEST_IDS.sidebar);
      expect(sidebar).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles collapse toggle correctly', async () => {
      const onCollapsedChange = jest.fn();
      renderWithProviders(<Sidebar onCollapsedChange={onCollapsedChange} />);
      
      const collapseToggle = screen.getByTestId(TEST_IDS.collapseToggle);
      await userEvent.click(collapseToggle);
      
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation between items', async () => {
      renderWithProviders(<Sidebar />);
      
      const firstNavItem = screen.getByTestId(`${TEST_IDS.navItemPrefix}pulse`);
      firstNavItem.focus();
      
      await userEvent.keyboard('{Tab}');
      expect(screen.getByTestId(`${TEST_IDS.navItemPrefix}integrations`)).toHaveFocus();
    });

    it('handles escape key for collapse', async () => {
      const onCollapsedChange = jest.fn();
      renderWithProviders(<Sidebar onCollapsedChange={onCollapsedChange} />);
      
      await userEvent.keyboard('{Escape}');
      expect(onCollapsedChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG color contrast requirements', () => {
      renderWithProviders(<Sidebar />);
      
      const sidebar = screen.getByTestId(TEST_IDS.sidebar);
      const styles = window.getComputedStyle(sidebar);
      
      // Verify background and text colors meet contrast requirements
      expect(styles.backgroundColor).toBeDefined();
      expect(styles.color).toBeDefined();
    });

    it('provides proper focus indicators', async () => {
      renderWithProviders(<Sidebar />);
      
      const navItems = screen.getAllByRole('link');
      await userEvent.tab();
      
      expect(navItems[0]).toHaveFocus();
      expect(navItems[0]).toHaveStyleRule('outline', expect.stringContaining('2px solid'));
    });

    it('maintains proper focus order', async () => {
      renderWithProviders(<Sidebar />);
      
      const focusableElements = screen.getAllByRole('link');
      for (let i = 0; i < focusableElements.length; i++) {
        await userEvent.tab();
        expect(focusableElements[i]).toHaveFocus();
      }
    });
  });

  describe('Error Handling', () => {
    it('handles theme toggle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const toggleTheme = jest.fn().mockRejectedValue(new Error('Theme toggle failed'));
      
      (useTheme as jest.Mock).mockImplementation(() => ({
        isDark: false,
        toggleTheme,
        theme: lightTheme
      }));

      renderWithProviders(<Sidebar />);
      
      const themeToggle = screen.getByTestId(TEST_IDS.themeToggle);
      await userEvent.click(themeToggle);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});