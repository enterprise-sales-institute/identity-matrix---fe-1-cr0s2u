import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // v13.x
import { ThemeProvider } from 'styled-components'; // v5.x
import '@testing-library/jest-dom/extend-expect'; // v5.x

import Card from './Card';
import { ThemeConstants, ColorConstants } from '../../../constants/theme.constants';
import type { ThemeConfig } from '../../../types/theme.types';

// Test content constants
const TEST_CONTENT = 'Test content for card component';
const TEST_HEADER = 'Test header for card component';
const TEST_FOOTER = 'Test footer for card component';
const CUSTOM_CLASS = 'custom-card-class';
const ARIA_LABEL = 'Test card component';

// Mock theme configurations
const mockLightTheme: Partial<ThemeConfig> = {
  mode: ThemeConstants.THEME_LIGHT,
  colors: {
    background: {
      main: ColorConstants.LIGHT_BACKGROUND,
    },
    text: {
      primary: ColorConstants.LIGHT_TEXT,
    },
    border: {
      main: ColorConstants.LIGHT_BORDER,
    },
  },
};

const mockDarkTheme: Partial<ThemeConfig> = {
  mode: ThemeConstants.THEME_DARK,
  colors: {
    background: {
      main: ColorConstants.DARK_BACKGROUND,
    },
    text: {
      primary: ColorConstants.DARK_TEXT,
    },
    border: {
      main: ColorConstants.DARK_BORDER,
    },
  },
};

// Mock handlers
const mockOnClick = jest.fn();

// Test wrapper component with theme provider
const renderWithTheme = (ui: React.ReactElement, theme: Partial<ThemeConfig> = mockLightTheme) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders with required props', () => {
      renderWithTheme(
        <Card>
          {TEST_CONTENT}
        </Card>
      );

      const content = screen.getByText(TEST_CONTENT);
      expect(content).toBeInTheDocument();
      expect(content.parentElement).toHaveClass('im-card-content');
    });

    test('renders with all sections', () => {
      renderWithTheme(
        <Card
          header={TEST_HEADER}
          footer={TEST_FOOTER}
        >
          {TEST_CONTENT}
        </Card>
      );

      expect(screen.getByText(TEST_HEADER)).toBeInTheDocument();
      expect(screen.getByText(TEST_CONTENT)).toBeInTheDocument();
      expect(screen.getByText(TEST_FOOTER)).toBeInTheDocument();
    });

    test('applies custom className', () => {
      renderWithTheme(
        <Card className={CUSTOM_CLASS}>
          {TEST_CONTENT}
        </Card>
      );

      const card = screen.getByText(TEST_CONTENT).closest('.im-card');
      expect(card).toHaveClass(CUSTOM_CLASS);
    });
  });

  describe('Theme Awareness', () => {
    test('renders with light theme styles', () => {
      renderWithTheme(
        <Card>
          {TEST_CONTENT}
        </Card>,
        mockLightTheme
      );

      const card = screen.getByText(TEST_CONTENT).closest('.im-card');
      expect(card).toHaveStyle({
        backgroundColor: ColorConstants.LIGHT_BACKGROUND,
        color: ColorConstants.LIGHT_TEXT,
        borderColor: ColorConstants.LIGHT_BORDER,
      });
    });

    test('renders with dark theme styles', () => {
      renderWithTheme(
        <Card>
          {TEST_CONTENT}
        </Card>,
        mockDarkTheme
      );

      const card = screen.getByText(TEST_CONTENT).closest('.im-card');
      expect(card).toHaveStyle({
        backgroundColor: ColorConstants.DARK_BACKGROUND,
        color: ColorConstants.DARK_TEXT,
        borderColor: ColorConstants.DARK_BORDER,
      });
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation when interactive', () => {
      renderWithTheme(
        <Card onClick={mockOnClick}>
          {TEST_CONTENT}
        </Card>
      );

      const card = screen.getByText(TEST_CONTENT).closest('.im-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');

      // Test keyboard interaction
      fireEvent.keyDown(card!, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card!, { key: ' ' });
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    test('maintains proper heading structure in header', () => {
      renderWithTheme(
        <Card
          header={<h2>{TEST_HEADER}</h2>}
        >
          {TEST_CONTENT}
        </Card>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent(TEST_HEADER);
    });

    test('supports custom ARIA attributes', () => {
      renderWithTheme(
        <Card aria-label={ARIA_LABEL}>
          {TEST_CONTENT}
        </Card>
      );

      const card = screen.getByLabelText(ARIA_LABEL);
      expect(card).toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    test('handles click events', () => {
      renderWithTheme(
        <Card onClick={mockOnClick}>
          {TEST_CONTENT}
        </Card>
      );

      const card = screen.getByText(TEST_CONTENT).closest('.im-card');
      fireEvent.click(card!);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('applies hover styles', async () => {
      renderWithTheme(
        <Card>
          {TEST_CONTENT}
        </Card>
      );

      const card = screen.getByText(TEST_CONTENT).closest('.im-card');
      fireEvent.mouseEnter(card!);

      await waitFor(() => {
        expect(card).toHaveStyle({
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        });
      });
    });
  });

  describe('Responsive Behavior', () => {
    test('adjusts padding at different breakpoints', () => {
      const { container } = renderWithTheme(
        <Card>
          {TEST_CONTENT}
        </Card>
      );

      // Default padding
      expect(container.firstChild).toHaveStyle({
        padding: '16px',
      });

      // Tablet breakpoint styles would be handled by CSS media queries
      // and can't be directly tested in JSDOM
    });
  });
});