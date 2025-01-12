import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // v13.x
import userEvent from '@testing-library/user-event'; // v14.x
import { ThemeProvider } from 'styled-components'; // v5.x
import Input from './Input';

// Mock theme object matching the application's theme structure
const mockTheme = {
  mode: 'light',
  colors: {
    primary: '#813efb',
    text: {
      light: '#000000',
      dark: '#ffffff'
    },
    background: {
      light: '#ffffff',
      dark: '#1a1a1a'
    },
    inputBackground: {
      light: '#f5f5f5',
      dark: '#2d2d2d'
    },
    border: {
      light: '#e0e0e0',
      dark: '#333333'
    }
  },
  typography: {
    fontFamilyBody: 'Roboto, system-ui, sans-serif'
  }
};

// Custom render function with theme provider
const renderWithTheme = (component: React.ReactNode, theme = mockTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Input Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with required props', () => {
      const label = 'Test Input';
      renderWithTheme(<Input label={label} />);
      
      expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(screen.getByLabelText(label)).toHaveAttribute('type', 'text');
    });

    it('renders with aria-label when no visible label is provided', () => {
      const ariaLabel = 'Hidden Label';
      renderWithTheme(<Input aria-label={ariaLabel} />);
      
      expect(screen.getByLabelText(ariaLabel)).toBeInTheDocument();
    });

    it('renders helper text', () => {
      const helperText = 'Helper message';
      renderWithTheme(<Input label="Test" helperText={helperText} />);
      
      const helperElement = screen.getByText(helperText);
      expect(helperElement).toBeInTheDocument();
      expect(helperElement).toHaveAttribute('role', 'status');
    });

    it('renders error state correctly', () => {
      const errorMessage = 'Error message';
      renderWithTheme(
        <Input 
          label="Test" 
          error={true} 
          helperText={errorMessage}
        />
      );
      
      const input = screen.getByRole('textbox');
      const errorElement = screen.getByText(errorMessage);
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });
  });

  // User interaction tests
  describe('User Interactions', () => {
    it('handles text input correctly', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const testValue = 'test input';
      
      renderWithTheme(
        <Input 
          label="Test" 
          onChange={onChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, testValue);
      
      expect(onChange).toHaveBeenCalledTimes(testValue.length);
      expect(input).toHaveValue(testValue);
    });

    it('handles focus and blur events', async () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      
      renderWithTheme(
        <Input 
          label="Test"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      await userEvent.click(input);
      expect(onFocus).toHaveBeenCalledTimes(1);
      
      await userEvent.tab();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('handles disabled state', async () => {
      const onChange = jest.fn();
      
      renderWithTheme(
        <Input 
          label="Test"
          disabled={true}
          onChange={onChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toBeDisabled();
      await userEvent.type(input, 'test');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('provides proper aria attributes', () => {
      const helperText = 'Helper text';
      renderWithTheme(
        <Input 
          label="Test"
          required={true}
          helperText={helperText}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );
      
      const firstInput = screen.getByLabelText('First');
      const secondInput = screen.getByLabelText('Second');
      
      await user.tab();
      expect(firstInput).toHaveFocus();
      
      await user.tab();
      expect(secondInput).toHaveFocus();
    });

    it('announces error messages to screen readers', async () => {
      const errorMessage = 'Error message';
      renderWithTheme(
        <Input 
          label="Test"
          error={true}
          helperText={errorMessage}
        />
      );
      
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toHaveAttribute('role', 'alert');
    });
  });

  // Theme integration tests
  describe('Theme Integration', () => {
    it('applies theme styles correctly', () => {
      renderWithTheme(<Input label="Test" />);
      
      const input = screen.getByRole('textbox');
      const styles = window.getComputedStyle(input);
      
      expect(styles.backgroundColor).toBe(mockTheme.colors.inputBackground.light);
      expect(styles.borderColor).toBe(mockTheme.colors.border.light);
    });

    it('applies dark theme styles', () => {
      const darkTheme = { ...mockTheme, mode: 'dark' };
      renderWithTheme(<Input label="Test" />, darkTheme);
      
      const input = screen.getByRole('textbox');
      const styles = window.getComputedStyle(input);
      
      expect(styles.backgroundColor).toBe(mockTheme.colors.inputBackground.dark);
      expect(styles.borderColor).toBe(mockTheme.colors.border.dark);
    });
  });

  // Ref forwarding tests
  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      renderWithTheme(<Input label="Test" ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(screen.getByRole('textbox'));
    });
  });
});