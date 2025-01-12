import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import RegisterPage from './RegisterPage';
import { lightTheme, darkTheme } from '../../../styles/theme.styles';
import { authReducer } from '../../../store/auth/auth.slice';
import { useAuth } from '../../../hooks/useAuth';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock useAuth hook
jest.mock('../../../hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Test constants
const VALID_REGISTRATION_DATA = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'StrongP@ss123',
  companyName: 'Acme Inc',
  companyDomain: 'acme.com'
};

const INVALID_REGISTRATION_DATA = {
  name: '',
  email: 'invalid-email',
  password: 'weak',
  companyName: '',
  companyDomain: 'invalid'
};

const ERROR_MESSAGES = {
  name: 'Full name is required',
  email: 'Please enter a valid email address',
  password: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  companyName: 'Company name is required',
  companyDomain: 'Please enter a valid domain name'
};

// Helper function to render component with providers
const renderWithProviders = (ui: React.ReactElement, theme = lightTheme) => {
  const store = configureStore({
    reducer: { auth: authReducer }
  });

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('RegisterPage Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      register: jest.fn(),
      loading: false,
      error: null
    } as any);
    mockNavigate.mockClear();
  });

  describe('Form Rendering', () => {
    it('renders all form fields with correct labels and placeholders', () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company domain/i)).toBeInTheDocument();
    });

    it('renders submit button in initial disabled state', () => {
      renderWithProviders(<RegisterPage />);
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('validates empty form submission', async () => {
      renderWithProviders(<RegisterPage />);
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        Object.values(ERROR_MESSAGES).forEach(message => {
          expect(screen.getByText(message)).toBeInTheDocument();
        });
      });
    });

    it('validates email format', async () => {
      renderWithProviders(<RegisterPage />);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.email)).toBeInTheDocument();
      });
    });

    it('validates password complexity requirements', async () => {
      renderWithProviders(<RegisterPage />);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(passwordInput, 'weak');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.password)).toBeInTheDocument();
      });
    });

    it('validates company domain format', async () => {
      renderWithProviders(<RegisterPage />);
      const domainInput = screen.getByLabelText(/company domain/i);

      await userEvent.type(domainInput, 'invalid');
      fireEvent.blur(domainInput);

      await waitFor(() => {
        expect(screen.getByText(ERROR_MESSAGES.companyDomain)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('handles successful registration', async () => {
      const mockRegister = jest.fn().mockResolvedValue({});
      mockUseAuth.mockReturnValue({
        register: mockRegister,
        loading: false,
        error: null
      } as any);

      renderWithProviders(<RegisterPage />);

      // Fill form with valid data
      await userEvent.type(screen.getByLabelText(/full name/i), VALID_REGISTRATION_DATA.name);
      await userEvent.type(screen.getByLabelText(/email address/i), VALID_REGISTRATION_DATA.email);
      await userEvent.type(screen.getByLabelText(/password/i), VALID_REGISTRATION_DATA.password);
      await userEvent.type(screen.getByLabelText(/company name/i), VALID_REGISTRATION_DATA.companyName);
      await userEvent.type(screen.getByLabelText(/company domain/i), VALID_REGISTRATION_DATA.companyDomain);

      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(VALID_REGISTRATION_DATA);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('displays server error messages', async () => {
      const errorMessage = 'Registration failed';
      mockUseAuth.mockReturnValue({
        register: jest.fn().mockRejectedValue(new Error(errorMessage)),
        loading: false,
        error: errorMessage
      } as any);

      renderWithProviders(<RegisterPage />);

      await userEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      mockUseAuth.mockReturnValue({
        register: jest.fn().mockImplementation(() => new Promise(() => {})),
        loading: true,
        error: null
      } as any);

      renderWithProviders(<RegisterPage />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('renders correctly in light theme', () => {
      const { container } = renderWithProviders(<RegisterPage />, lightTheme);
      expect(container).toHaveStyle({ backgroundColor: lightTheme.colors.background.main });
    });

    it('renders correctly in dark theme', () => {
      const { container } = renderWithProviders(<RegisterPage />, darkTheme);
      expect(container).toHaveStyle({ backgroundColor: darkTheme.colors.background.main });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 Level AA requirements', async () => {
      const { container } = renderWithProviders(<RegisterPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<RegisterPage />);
      const form = screen.getByRole('form');
      
      expect(document.body).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByLabelText(/full name/i)).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();
    });

    it('provides appropriate ARIA labels', () => {
      renderWithProviders(<RegisterPage />);
      
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Registration form');
      expect(screen.getByRole('button', { name: /create account/i }))
        .toHaveAttribute('aria-label', 'Create account');
    });
  });
});