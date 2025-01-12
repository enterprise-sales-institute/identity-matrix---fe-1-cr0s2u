import React from 'react'; // v18.x
import { render, screen, fireEvent, within } from '@testing-library/react'; // v13.x
import userEvent from '@testing-library/user-event'; // v14.x
import { ThemeProvider } from 'styled-components'; // v5.x
import FormGroup from './FormGroup';
import Input from '../../atoms/Input/Input';

// Test constants
const TEST_ID = 'form-group';
const ARIA_LABELS = {
  error: 'Error message',
  required: 'Required field',
  helper: 'Helper text'
};

// Mock theme for styled-components testing
const mockTheme = {
  mode: 'light',
  direction: 'ltr',
  colors: {
    text: '#1a1a1a',
    error: '#ff3b30',
    background: '#ffffff'
  },
  typography: {
    body: 'Inter',
    label: 'Inter-Medium'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px'
  },
  breakpoints: {
    mediaQueries: {
      mobile: '@media (min-width: 320px)'
    }
  }
};

// Helper function to render components with theme
const renderWithTheme = (children: React.ReactNode, options = {}) => {
  const direction = options?.rtl ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  
  return render(
    <ThemeProvider theme={{ ...mockTheme, direction }}>
      {children}
    </ThemeProvider>
  );
};

describe('FormGroup Component', () => {
  // Basic rendering and accessibility
  describe('Rendering and Accessibility', () => {
    it('renders with proper accessibility attributes', () => {
      const label = 'Email Address';
      renderWithTheme(
        <FormGroup label={label} required>
          <Input type="email" />
        </FormGroup>
      );

      const formGroup = screen.getByRole('group');
      const labelElement = screen.getByText(label);
      const input = screen.getByRole('textbox');

      expect(formGroup).toHaveAttribute('aria-labelledby');
      expect(labelElement).toHaveAttribute('id');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('associates label with input correctly', () => {
      renderWithTheme(
        <FormGroup label="Username">
          <Input />
        </FormGroup>
      );

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('displays error message with proper ARIA attributes', () => {
      const errorMessage = 'Invalid input';
      renderWithTheme(
        <FormGroup label="Test" error={errorMessage}>
          <Input />
        </FormGroup>
      );

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(errorMessage);
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  // RTL support
  describe('RTL Support', () => {
    it('handles RTL layout correctly', () => {
      renderWithTheme(
        <FormGroup label="Name" direction="rtl">
          <Input />
        </FormGroup>,
        { rtl: true }
      );

      const formGroup = screen.getByRole('group');
      expect(formGroup).toHaveAttribute('dir', 'rtl');
    });

    it('positions error message correctly in RTL mode', () => {
      renderWithTheme(
        <FormGroup label="Test" error="Error" direction="rtl">
          <Input />
        </FormGroup>,
        { rtl: true }
      );

      const errorMessage = screen.getByRole('alert');
      const styles = window.getComputedStyle(errorMessage);
      expect(styles.right).toBe('0');
      expect(styles.left).toBe('auto');
    });
  });

  // Theme integration
  describe('Theme Integration', () => {
    it('applies theme colors correctly', () => {
      renderWithTheme(
        <FormGroup label="Test">
          <Input />
        </FormGroup>
      );

      const label = screen.getByText('Test');
      const styles = window.getComputedStyle(label);
      expect(styles.color).toBe(mockTheme.colors.text);
    });

    it('handles dark theme properly', () => {
      const darkTheme = { ...mockTheme, mode: 'dark' };
      render(
        <ThemeProvider theme={darkTheme}>
          <FormGroup label="Test">
            <Input />
          </FormGroup>
        </ThemeProvider>
      );

      const label = screen.getByText('Test');
      expect(label).toHaveStyle({ color: darkTheme.colors.text });
    });
  });

  // Child component interaction
  describe('Child Component Interaction', () => {
    it('forwards props to child input correctly', async () => {
      const handleChange = jest.fn();
      renderWithTheme(
        <FormGroup label="Test">
          <Input onChange={handleChange} />
        </FormGroup>
      );

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('propagates error state to child components', () => {
      renderWithTheme(
        <FormGroup label="Test" error="Error message">
          <Input />
        </FormGroup>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('handles multiple child components', () => {
      renderWithTheme(
        <FormGroup label="Test">
          <Input placeholder="First input" />
          <Input placeholder="Second input" />
        </FormGroup>
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(2);
      inputs.forEach(input => {
        expect(input).toHaveAttribute('aria-labelledby');
      });
    });
  });

  // Edge cases and error handling
  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      expect(() => {
        renderWithTheme(<FormGroup label="Test" />);
      }).not.toThrow();
    });

    it('handles non-input children', () => {
      renderWithTheme(
        <FormGroup label="Test">
          <div>Custom content</div>
        </FormGroup>
      );

      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('maintains accessibility when label is very long', () => {
      const longLabel = 'A'.repeat(100);
      renderWithTheme(
        <FormGroup label={longLabel}>
          <Input />
        </FormGroup>
      );

      const label = screen.getByText(longLabel);
      expect(label).toBeVisible();
      expect(label).toHaveAttribute('for');
    });
  });
});