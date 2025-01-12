import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';

// Component imports
import LoginPage from './LoginPage';
import { useAuth } from '../../../hooks/useAuth';
import { lightTheme, darkTheme } from '../../../styles/theme.styles';

// Mock hooks and navigation
vi.mock('../../../hooks/useAuth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock session storage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Test suite setup
describe('LoginPage', () => {
  // Mock auth hook implementation
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockImplementation(() => ({
      login: mockLogin,
      loading: false,
      error: null
    }));
  });

  // Helper function to render component with providers
  const renderLoginPage = (theme = lightTheme) => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  // Test accessibility compliance
  test('should meet WCAG 2.1 Level AA standards', async () => {
    const { container } = renderLoginPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Test form validation
  test('should validate form fields correctly', async () => {
    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);

    // Test empty fields
    await userEvent.click(submitButton);
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();

    // Test invalid email format
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitButton);
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();

    // Test password length requirement
    await userEvent.type(passwordInput, 'short');
    await userEvent.click(submitButton);
    expect(await screen.findByText(/password must be at least 12 characters/i)).toBeInTheDocument();
  });

  // Test successful authentication flow
  test('should handle successful login correctly', async () => {
    renderLoginPage();
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMe = screen.getByRole('checkbox', { name: /remember me/i });
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill form with valid data
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'securePassword123!');
    await userEvent.click(rememberMe);
    await userEvent.click(submitButton);

    // Verify login attempt
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'securePassword123!',
        rememberMe: true
      });
    });
  });

  // Test error handling
  test('should display authentication errors correctly', async () => {
    const errorMessage = 'Invalid credentials';
    (useAuth as any).mockImplementation(() => ({
      login: vi.fn().mockRejectedValue(new Error(errorMessage)),
      loading: false,
      error: errorMessage
    }));

    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await userEvent.type(screen.getByRole('textbox', { name: /email address/i }), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'securePassword123!');
    await userEvent.click(submitButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  // Test loading state
  test('should handle loading state correctly', async () => {
    (useAuth as any).mockImplementation(() => ({
      login: vi.fn(),
      loading: true,
      error: null
    }));

    renderLoginPage();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
  });

  // Test theme support
  test('should render correctly in dark theme', () => {
    renderLoginPage(darkTheme);
    const form = screen.getByRole('form');
    expect(form).toHaveStyle({
      backgroundColor: darkTheme.colors.background.paper
    });
  });

  // Test navigation links
  test('should render and handle navigation links correctly', () => {
    renderLoginPage();
    expect(screen.getByText(/forgot password/i)).toHaveAttribute('href', '/auth/forgot-password');
    expect(screen.getByText(/sign up/i)).toHaveAttribute('href', '/auth/signup');
  });

  // Test keyboard navigation
  test('should support keyboard navigation', async () => {
    renderLoginPage();
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const passwordInput = screen.getByLabelText(/password/i);
    const rememberMe = screen.getByRole('checkbox', { name: /remember me/i });

    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);

    await userEvent.tab();
    expect(document.activeElement).toBe(passwordInput);

    await userEvent.tab();
    expect(document.activeElement).toBe(rememberMe);
  });
});