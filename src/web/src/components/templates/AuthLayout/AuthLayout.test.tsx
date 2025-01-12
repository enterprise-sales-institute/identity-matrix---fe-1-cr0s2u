import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, describe, it, beforeEach, afterEach } from '@jest/globals';

import AuthLayout from './AuthLayout';
import ThemeProvider from '../../../providers/ThemeProvider';
import { ThemeConstants } from '../../../constants/theme.constants';

// Add jest-axe custom matcher
expect.extend(toHaveNoViolations);

// Constants for testing
const TEST_ID = 'auth-layout';
const TEST_CONTENT = 'Test authentication content';
const ARIA_LABELS = {
  AUTH_CONTAINER: 'Authentication form container',
  LOGO_SECTION: 'Company logo',
  AUTH_FORM: 'Authentication form'
};
const VIEWPORT_SIZES = {
  mobile: 320,
  tablet: 768,
  desktop: 1024
};

/**
 * Helper function to render components with theme provider
 */
const renderWithTheme = (ui: React.ReactElement, options = {}) => {
  return render(
    <ThemeProvider defaultMode={ThemeConstants.THEME_LIGHT}>
      {ui}
    </ThemeProvider>,
    options
  );
};

/**
 * Mock ResizeObserver for responsive testing
 */
const createResizeObserverMock = () => {
  class ResizeObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  return ResizeObserverMock;
};

describe('AuthLayout Component', () => {
  // Setup and teardown
  beforeEach(() => {
    // Mock ResizeObserver
    window.ResizeObserver = createResizeObserverMock();
    
    // Mock SVG imports
    jest.mock('../../../assets/images/logo-dark.svg', () => 'LogoDark');
    jest.mock('../../../assets/images/logo-light.svg', () => 'LogoLight');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );
      expect(screen.getByTestId(TEST_ID)).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );
      expect(screen.getByText(TEST_CONTENT)).toBeInTheDocument();
    });

    it('should render with correct ARIA labels', () => {
      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );
      expect(screen.getByLabelText(ARIA_LABELS.AUTH_CONTAINER)).toBeInTheDocument();
      expect(screen.getByLabelText(ARIA_LABELS.LOGO_SECTION)).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should render with light theme by default', () => {
      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );
      const container = screen.getByTestId(TEST_ID);
      expect(container).toHaveStyle({
        backgroundColor: ThemeConstants.LIGHT_BACKGROUND
      });
    });

    it('should switch theme correctly', async () => {
      const { container } = renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );

      // Simulate theme toggle
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await userEvent.click(themeToggle);

      await waitFor(() => {
        expect(container.firstChild).toHaveStyle({
          backgroundColor: ThemeConstants.DARK_BACKGROUND
        });
      });
    });

    it('should load correct logo based on theme', async () => {
      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );

      // Check light theme logo
      expect(screen.getByAltText('Identity Matrix')).toBeInTheDocument();

      // Toggle theme and check dark theme logo
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await userEvent.click(themeToggle);

      await waitFor(() => {
        expect(screen.getByAltText('Identity Matrix')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    Object.entries(VIEWPORT_SIZES).forEach(([size, width]) => {
      it(`should render correctly at ${size} viewport`, () => {
        // Mock viewport size
        window.innerWidth = width;
        fireEvent(window, new Event('resize'));

        renderWithTheme(
          <AuthLayout>
            <div>{TEST_CONTENT}</div>
          </AuthLayout>
        );

        const container = screen.getByTestId(TEST_ID);
        expect(container).toBeInTheDocument();
      });
    });

    it('should adjust layout for mobile devices', () => {
      window.innerWidth = VIEWPORT_SIZES.mobile;
      fireEvent(window, new Event('resize'));

      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );

      const container = screen.getByTestId(TEST_ID);
      expect(container).toHaveStyle({
        padding: '16px'
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle keyboard navigation', async () => {
      renderWithTheme(
        <AuthLayout>
          <button>Test Button</button>
        </AuthLayout>
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('should maintain focus within modal', async () => {
      renderWithTheme(
        <AuthLayout>
          <div>
            <button>First</button>
            <button>Last</button>
          </div>
        </AuthLayout>
      );

      const firstButton = screen.getByText('First');
      const lastButton = screen.getByText('Last');

      firstButton.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(lastButton);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing children gracefully', () => {
      // @ts-expect-error Testing invalid props
      renderWithTheme(<AuthLayout />);
      expect(screen.getByTestId(TEST_ID)).toBeInTheDocument();
    });

    it('should handle logo loading errors', async () => {
      // Mock failed logo import
      jest.mock('../../../assets/images/logo-light.svg', () => {
        throw new Error('Failed to load logo');
      });

      renderWithTheme(
        <AuthLayout>
          <div>{TEST_CONTENT}</div>
        </AuthLayout>
      );

      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should render error boundary fallback on error', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      renderWithTheme(
        <AuthLayout>
          <ThrowError />
        </AuthLayout>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});