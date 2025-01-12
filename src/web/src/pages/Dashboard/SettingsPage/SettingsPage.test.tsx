import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@axe-core/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';

import SettingsPage from './SettingsPage';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { lightTheme } from '../../../styles/theme.styles';
import { createStore } from '../../../store';

// Mock hooks
jest.mock('../../../hooks/useAuth');
jest.mock('../../../hooks/useTheme');

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  company: {
    name: 'Acme Inc'
  }
};

// Helper function to render component with providers
const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const store = createStore();
  
  return render(
    <Provider store={store}>
      <ThemeProvider theme={lightTheme}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </ThemeProvider>
    </Provider>,
    options
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: mockUser,
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
      loading: false,
      error: null
    }));

    (useTheme as jest.Mock).mockImplementation(() => ({
      theme: lightTheme,
      toggleTheme: jest.fn(),
      isDark: false
    }));
  });

  describe('Profile Section', () => {
    it('renders profile form with user data', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByTestId('name-input')).toHaveValue(mockUser.name);
      expect(screen.getByTestId('email-input')).toHaveValue(mockUser.email);
      expect(screen.getByTestId('company-input')).toHaveValue(mockUser.company.name);
    });

    it('handles profile form submission with validation', async () => {
      const mockUpdateProfile = jest.fn();
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: mockUser,
        updateProfile: mockUpdateProfile,
        loading: false
      }));

      renderWithProviders(<SettingsPage />);

      // Test invalid submission
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: '' } });
      fireEvent.click(screen.getByTestId('profile-submit'));

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(mockUpdateProfile).not.toHaveBeenCalled();

      // Test valid submission
      fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Jane Doe' } });
      fireEvent.click(screen.getByTestId('profile-submit'));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          name: 'Jane Doe',
          email: mockUser.email,
          company: mockUser.company.name
        });
      });
    });

    it('displays loading state during profile update', async () => {
      const mockUpdateProfile = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: mockUser,
        updateProfile: mockUpdateProfile,
        loading: true
      }));

      renderWithProviders(<SettingsPage />);

      fireEvent.click(screen.getByTestId('profile-submit'));

      expect(screen.getByTestId('profile-submit')).toBeDisabled();
      expect(screen.getByTestId('profile-submit')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Password Change Section', () => {
    it('validates password requirements according to NIST standards', async () => {
      const mockUpdatePassword = jest.fn();
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: mockUser,
        updatePassword: mockUpdatePassword,
        loading: false
      }));

      renderWithProviders(<SettingsPage />);

      // Test minimum length requirement
      await userEvent.type(screen.getByTestId('new-password-input'), 'short');
      fireEvent.click(screen.getByTestId('password-submit'));

      expect(screen.getByText(/Password must be at least 12 characters/)).toBeInTheDocument();

      // Test complexity requirements
      await userEvent.type(screen.getByTestId('new-password-input'), 'simplepassword');
      fireEvent.click(screen.getByTestId('password-submit'));

      expect(screen.getByText(/Password must include uppercase, lowercase, number, and special character/)).toBeInTheDocument();

      // Test password confirmation match
      const validPassword = 'ValidP@ssw0rd123';
      await userEvent.type(screen.getByTestId('new-password-input'), validPassword);
      await userEvent.type(screen.getByTestId('confirm-password-input'), 'different');
      fireEvent.click(screen.getByTestId('password-submit'));

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('handles password change with security measures', async () => {
      const mockUpdatePassword = jest.fn();
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: mockUser,
        updatePassword: mockUpdatePassword,
        loading: false
      }));

      renderWithProviders(<SettingsPage />);

      const validPassword = 'ValidP@ssw0rd123';
      await userEvent.type(screen.getByTestId('current-password-input'), 'currentPass123!');
      await userEvent.type(screen.getByTestId('new-password-input'), validPassword);
      await userEvent.type(screen.getByTestId('confirm-password-input'), validPassword);
      
      fireEvent.click(screen.getByTestId('password-submit'));

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith({
          currentPassword: 'currentPass123!',
          newPassword: validPassword,
          confirmPassword: validPassword
        });
      });
    });

    it('implements failed attempts lockout', async () => {
      const mockUpdatePassword = jest.fn().mockRejectedValue(new Error('Invalid password'));
      (useAuth as jest.Mock).mockImplementation(() => ({
        user: mockUser,
        updatePassword: mockUpdatePassword,
        loading: false
      }));

      renderWithProviders(<SettingsPage />);

      // Attempt password change multiple times
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByTestId('password-submit'));
        await waitFor(() => {
          expect(mockUpdatePassword).toHaveBeenCalled();
        });
      }

      expect(screen.getByTestId('password-submit')).toBeDisabled();
      expect(screen.getByText('Too many failed attempts. Please try again later.')).toBeInTheDocument();
    });
  });

  describe('Theme Preferences', () => {
    it('handles theme toggle with animation', async () => {
      const mockToggleTheme = jest.fn();
      (useTheme as jest.Mock).mockImplementation(() => ({
        theme: lightTheme,
        toggleTheme: mockToggleTheme,
        isDark: false
      }));

      renderWithProviders(<SettingsPage />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      await waitFor(() => {
        expect(mockToggleTheme).toHaveBeenCalled();
      });
    });

    it('persists theme preference', async () => {
      const mockToggleTheme = jest.fn();
      (useTheme as jest.Mock).mockImplementation(() => ({
        theme: lightTheme,
        toggleTheme: mockToggleTheme,
        isDark: false
      }));

      renderWithProviders(<SettingsPage />);

      fireEvent.click(screen.getByTestId('theme-toggle'));

      await waitFor(() => {
        expect(localStorage.getItem('theme_preference')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 Level AA standards', async () => {
      const { container } = renderWithProviders(<SettingsPage />);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<SettingsPage />);

      const firstInput = screen.getByTestId('name-input');
      const lastInput = screen.getByTestId('confirm-password-input');

      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);

      userEvent.tab();
      expect(document.activeElement).toBe(screen.getByTestId('email-input'));

      // Tab through to last input
      while (document.activeElement !== lastInput) {
        userEvent.tab();
      }
      expect(document.activeElement).toBe(lastInput);
    });

    it('provides proper ARIA labels and roles', () => {
      renderWithProviders(<SettingsPage />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-labelledby', 'settings-title');
      expect(screen.getByLabelledby('profile-section')).toBeInTheDocument();
      expect(screen.getByLabelledby('theme-section')).toBeInTheDocument();
      expect(screen.getByLabelledby('password-section')).toBeInTheDocument();
    });
  });
});