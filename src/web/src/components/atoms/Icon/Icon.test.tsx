import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { axe, toHaveNoViolations } from 'jest-axe';
import Icon from './Icon';
import { ThemeConstants, ColorConstants } from '../../../constants/theme.constants';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test constants
const TEST_ICON_NAME = 'test-icon';
const ARIA_LABEL = 'Test Icon Label';
const TEST_ID = 'icon-test';

// Mock themes
const mockTheme = {
  mode: ThemeConstants.THEME_LIGHT,
  colors: {
    text: {
      primary: ColorConstants.LIGHT_TEXT
    },
    border: {
      focus: ColorConstants.PRIMARY
    }
  }
};

// Helper function to render with theme
const renderWithTheme = (ui: React.ReactElement, theme = mockTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Icon Component', () => {
  // Basic Rendering
  describe('Rendering', () => {
    it('should render successfully with required props', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render with custom test id', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} testId={TEST_ID} />);
      expect(screen.getByTestId(TEST_ID)).toBeInTheDocument();
    });

    it('should render SVG with correct icon reference', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} />);
      const svgElement = screen.getByRole('img').querySelector('use');
      expect(svgElement).toHaveAttribute('href', `#icon-${TEST_ICON_NAME}`);
    });
  });

  // Theme Integration
  describe('Theme Integration', () => {
    it('should apply correct color from theme', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} />);
      expect(screen.getByTestId('icon')).toHaveStyle({
        color: ColorConstants.LIGHT_TEXT
      });
    });

    it('should apply custom color when provided', () => {
      const customColor = '#ff0000';
      renderWithTheme(<Icon name={TEST_ICON_NAME} color={customColor} />);
      expect(screen.getByTestId('icon')).toHaveStyle({
        color: customColor
      });
    });

    it('should apply disabled styles when disabled', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} disabled />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveStyle({ cursor: 'not-allowed' });
    });
  });

  // Size Variants
  describe('Size Variants', () => {
    it.each([
      ['small', '16px'],
      ['medium', '24px'],
      ['large', '32px']
    ])('should render with correct %s size', (size, expected) => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} size={size as 'small' | 'medium' | 'large'} />);
      expect(screen.getByTestId('icon')).toHaveStyle({
        width: expected,
        height: expected
      });
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithTheme(
        <Icon name={TEST_ICON_NAME} ariaLabel={ARIA_LABEL} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have correct ARIA role when interactive', () => {
      const onClickMock = jest.fn();
      renderWithTheme(
        <Icon name={TEST_ICON_NAME} onClick={onClickMock} ariaLabel={ARIA_LABEL} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have correct ARIA role when non-interactive', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} ariaLabel={ARIA_LABEL} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should include screen reader text when ariaLabel is provided', () => {
      renderWithTheme(<Icon name={TEST_ICON_NAME} ariaLabel={ARIA_LABEL} />);
      expect(screen.getByText(ARIA_LABEL)).toHaveClass('sr-only');
    });
  });

  // Interaction
  describe('Interaction', () => {
    it('should handle click events when enabled', () => {
      const onClickMock = jest.fn();
      renderWithTheme(
        <Icon name={TEST_ICON_NAME} onClick={onClickMock} />
      );
      fireEvent.click(screen.getByTestId('icon'));
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('should not handle click events when disabled', () => {
      const onClickMock = jest.fn();
      renderWithTheme(
        <Icon name={TEST_ICON_NAME} onClick={onClickMock} disabled />
      );
      fireEvent.click(screen.getByTestId('icon'));
      expect(onClickMock).not.toHaveBeenCalled();
    });

    it('should handle keyboard events correctly', () => {
      const onClickMock = jest.fn();
      renderWithTheme(
        <Icon name={TEST_ICON_NAME} onClick={onClickMock} />
      );
      const icon = screen.getByTestId('icon');
      
      // Test Enter key
      fireEvent.keyDown(icon, { key: 'Enter' });
      expect(onClickMock).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(icon, { key: ' ' });
      expect(onClickMock).toHaveBeenCalledTimes(2);
    });
  });

  // Performance
  describe('Performance', () => {
    it('should not re-render on same props', () => {
      const { rerender } = renderWithTheme(
        <Icon name={TEST_ICON_NAME} />
      );
      const initialRender = screen.getByTestId('icon');
      
      rerender(
        <ThemeProvider theme={mockTheme}>
          <Icon name={TEST_ICON_NAME} />
        </ThemeProvider>
      );
      
      const secondRender = screen.getByTestId('icon');
      expect(initialRender).toBe(secondRender);
    });

    it('should re-render only on prop changes', () => {
      const { rerender } = renderWithTheme(
        <Icon name={TEST_ICON_NAME} />
      );
      const initialRender = screen.getByTestId('icon');
      
      rerender(
        <ThemeProvider theme={mockTheme}>
          <Icon name={TEST_ICON_NAME} size="large" />
        </ThemeProvider>
      );
      
      const secondRender = screen.getByTestId('icon');
      expect(initialRender).not.toBe(secondRender);
    });
  });
});