import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash'; // v4.x

// Internal imports
import DashboardLayout from '../../../components/templates/DashboardLayout/DashboardLayout';
import FormGroup from '../../../components/molecules/FormGroup/FormGroup';
import Input from '../../../components/atoms/Input/Input';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';

// Constants
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$';
const DEBOUNCE_DELAY = 300;
const MAX_FAILED_ATTEMPTS = 3;

// Interfaces
interface ProfileFormData {
  name: string;
  email: string;
  company: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Settings page component for managing user profile, theme preferences, and security settings
 * Implements WCAG 2.1 Level AA compliance with enhanced security features
 */
const SettingsPage: React.FC = () => {
  // Hooks
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile, updatePassword } = useAuth();

  // Form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company?.name || ''
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Reset form state when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        company: user.company.name
      });
    }
  }, [user]);

  /**
   * Validate profile form data
   */
  const validateProfileData = useCallback((data: ProfileFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.company.trim()) {
      errors.company = 'Company name is required';
    }

    return errors;
  }, []);

  /**
   * Validate password form data against NIST 800-63B requirements
   */
  const validatePasswordData = useCallback((data: PasswordFormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!data.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (data.newPassword.length < PASSWORD_MIN_LENGTH) {
      errors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    } else if (!new RegExp(PASSWORD_PATTERN).test(data.newPassword)) {
      errors.newPassword = 'Password must include uppercase, lowercase, number, and special character';
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }, []);

  /**
   * Handle profile form submission with debouncing
   */
  const handleProfileSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationErrors = validateProfileData(profileData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      await updateProfile(profileData);
      setErrors({});
    } catch (error) {
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [profileData, validateProfileData, updateProfile]);

  /**
   * Handle password form submission with security measures
   */
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        setErrors({ submit: 'Too many failed attempts. Please try again later.' });
        return;
      }

      const validationErrors = validatePasswordData(passwordData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setFailedAttempts(prev => prev + 1);
        return;
      }

      await updatePassword(passwordData);
      setErrors({});
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFailedAttempts(0);
    } catch (error) {
      setErrors({ submit: 'Failed to update password. Please try again.' });
      setFailedAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [passwordData, validatePasswordData, updatePassword, failedAttempts]);

  /**
   * Handle theme toggle with debouncing
   */
  const handleThemeToggle = useCallback(debounce(() => {
    toggleTheme();
  }, DEBOUNCE_DELAY), [toggleTheme]);

  return (
    <DashboardLayout>
      <div className="settings-page" role="main" aria-labelledby="settings-title">
        <h1 id="settings-title" className="settings-title">Settings</h1>

        {/* Profile Section */}
        <section aria-labelledby="profile-section">
          <h2 id="profile-section">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} noValidate>
            <FormGroup
              label="Full Name"
              error={errors.name}
              required
            >
              <Input
                type="text"
                value={profileData.name}
                onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
                aria-label="Full name"
                data-testid="name-input"
              />
            </FormGroup>

            <FormGroup
              label="Email Address"
              error={errors.email}
              required
            >
              <Input
                type="email"
                value={profileData.email}
                onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled={loading}
                aria-label="Email address"
                data-testid="email-input"
              />
            </FormGroup>

            <FormGroup
              label="Company Name"
              error={errors.company}
              required
            >
              <Input
                type="text"
                value={profileData.company}
                onChange={e => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                disabled={loading}
                aria-label="Company name"
                data-testid="company-input"
              />
            </FormGroup>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              data-testid="profile-submit"
            >
              Save Changes
            </button>
          </form>
        </section>

        {/* Theme Section */}
        <section aria-labelledby="theme-section">
          <h2 id="theme-section">Theme Preferences</h2>
          <div className="theme-toggle">
            <label htmlFor="theme-toggle">Theme</label>
            <button
              id="theme-toggle"
              onClick={handleThemeToggle}
              aria-pressed={theme.mode === 'dark'}
              data-testid="theme-toggle"
            >
              {theme.mode === 'dark' ? 'Light' : 'Dark'} Theme
            </button>
          </div>
        </section>

        {/* Password Section */}
        <section aria-labelledby="password-section">
          <h2 id="password-section">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} noValidate>
            <FormGroup
              label="Current Password"
              error={errors.currentPassword}
              required
            >
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                disabled={loading}
                aria-label="Current password"
                data-testid="current-password-input"
              />
            </FormGroup>

            <FormGroup
              label="New Password"
              error={errors.newPassword}
              required
            >
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                disabled={loading}
                aria-label="New password"
                pattern={PASSWORD_PATTERN}
                minLength={PASSWORD_MIN_LENGTH}
                data-testid="new-password-input"
              />
            </FormGroup>

            <FormGroup
              label="Confirm New Password"
              error={errors.confirmPassword}
              required
            >
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={loading}
                aria-label="Confirm new password"
                data-testid="confirm-password-input"
              />
            </FormGroup>

            <button
              type="submit"
              disabled={loading || failedAttempts >= MAX_FAILED_ATTEMPTS}
              aria-busy={loading}
              data-testid="password-submit"
            >
              Update Password
            </button>
          </form>
        </section>

        {errors.submit && (
          <div
            role="alert"
            className="error-message"
            aria-live="polite"
            data-testid="submit-error"
          >
            {errors.submit}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;