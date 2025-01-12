import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'styled-components';
import Button from './Button';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock theme for testing
const mockTheme = {
  light: {
    colors: {
      primary: '#813efb',
      secondary: '#6B7280',
      background: '#ffffff',
      text: '#000000',
      error: '#DC2626'
    },
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px'
    }
  },
  dark: {
    colors: {
      primary: '#813efb',
      secondary: '#9CA3AF',
      background: '#1a1a1a',
      text: '#ffffff',
      error: '#EF4444'
    },
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px'
    }
  }
};

// Test IDs for querying elements
const testIds = {
  button: 'button-component',
  buttonIcon: 'button-icon',
  buttonLoader: 'button-loading',
  buttonText: 'button-text'
};

// Wrapper component with theme provider
const renderWithTheme = (ui: React.ReactElement, theme = mockTheme.light) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Button Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      renderWithTheme(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('renders different variants correctly', () => {
      const { rerender } = renderWithTheme(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ background: expect.stringContaining('#813efb') });

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ border: expect.stringContaining('#813efb') });

      rerender(<Button variant="text">Text</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ background: 'transparent' });
    });

    it('renders different sizes correctly', () => {
      const { rerender } = renderWithTheme(<Button size="small">Small</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveStyle({ padding: '8px 16px' });

      rerender(<Button size="medium">Medium</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveStyle({ padding: '16px 24px' });

      rerender(<Button size="large">Large</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveStyle({ padding: '24px 32px' });
    });

    it('renders full width when specified', () => {
      renderWithTheme(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ width: '100%' });
    });

    it('renders loading state correctly', () => {
      renderWithTheme(<Button loading>Loading</Button>);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe('Interaction', () => {
    it('handles click events correctly', async () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('prevents click when disabled', async () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents click when loading', async () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button loading onClick={handleClick}>Loading</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles keyboard interaction correctly', async () => {
      const handleClick = jest.fn();
      renderWithTheme(<Button onClick={handleClick}>Press me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithTheme(
        <Button aria-label="Accessible button">Click me</Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria labels and descriptions', () => {
      renderWithTheme(
        <Button 
          ariaLabel="Custom label"
          ariaDescribedBy="desc"
          ariaControls="content"
          ariaExpanded={false}
        >
          Accessible
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'desc');
      expect(button).toHaveAttribute('aria-controls', 'content');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles disabled state accessibility', () => {
      renderWithTheme(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });

    it('handles loading state accessibility', () => {
      renderWithTheme(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
    });
  });

  // Theme support tests
  describe('Theming', () => {
    it('renders correctly in light theme', () => {
      renderWithTheme(<Button>Light theme</Button>, mockTheme.light);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: expect.stringContaining(mockTheme.light.colors.primary)
      });
    });

    it('renders correctly in dark theme', () => {
      renderWithTheme(<Button>Dark theme</Button>, mockTheme.dark);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: expect.stringContaining(mockTheme.dark.colors.primary)
      });
    });

    it('supports custom theme colors', () => {
      const customTheme = {
        ...mockTheme.light,
        colors: {
          ...mockTheme.light.colors,
          primary: '#custom'
        }
      };
      
      renderWithTheme(<Button>Custom theme</Button>, customTheme);
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        background: expect.stringContaining('#custom')
      });
    });
  });
});