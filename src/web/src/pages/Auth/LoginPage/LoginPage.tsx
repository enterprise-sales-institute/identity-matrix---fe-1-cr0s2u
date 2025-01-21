import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // v6.x
import styled from 'styled-components'; // v5.x

// Internal imports
import AuthLayout from '../../../components/templates/AuthLayout/AuthLayout';
import FormGroup from '../../../components/molecules/FormGroup/FormGroup';
import Input from '../../../components/atoms/Input/Input';
import Button from '../../../components/atoms/Button/Button';
import { useAuth } from '../../../hooks/useAuth';
import { colors, spacing } from '../../../styles/variables.styles';

// Constants
const ROUTES = {
  DASHBOARD: '/dashboard',
  FORGOT_PASSWORD: '/auth/forgot-password',
  SIGNUP: '/auth/signup'
};

// Interfaces
interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  email: string | null;
  password: string | null;
}

// Styled components
const LoginContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${spacing.space.lg};
`;

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.space.sm};
  margin-bottom: ${spacing.space.md};
`;

const LinkText = styled(Link)`
  color: ${colors.primary};
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &:focus {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    email: null,
    password: null
  });

  // Clear validation errors on unmount
  useEffect(() => {
    return () => {
      setValidationErrors({ email: null, password: null });
    };
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {
      email: null,
      password: null
    };

    // Email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Password validation - NIST 800-63B compliant
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 12) {
      errors.password = 'Password must be at least 12 characters long';
    }

    setValidationErrors(errors);
    return !errors.email && !errors.password;
  }, [formData]);

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Form submission handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }, [formData, validateForm, login, navigate]);

  return (
    <AuthLayout>
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit} noValidate>
          <FormGroup
            label="Email Address"
            error={validationErrors.email || undefined}
            required
          >
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              aria-label="Email Address"
              autoComplete="email"
              disabled={loading}
              error={!!validationErrors.email}
            />
          </FormGroup>

          <FormGroup
            label="Password"
            error={validationErrors.password || undefined}
            required
          >
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              aria-label="Password"
              autoComplete="current-password"
              disabled={loading}
              error={!!validationErrors.password}
            />
          </FormGroup>

          <RememberMeContainer>
            <Input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              aria-label="Remember me"
              disabled={loading}
            />
            <label htmlFor="rememberMe">Remember me</label>
            <LinkText to={ROUTES.FORGOT_PASSWORD}>Forgot Password?</LinkText>
          </RememberMeContainer>

          {authError && (
            <div role="alert" aria-live="polite" style={{ color: 'var(--im-color-error)' }}>
              {authError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
            loading={loading}
            aria-label="Sign in to your account"
          >
            Sign In
          </Button>

          <div style={{ textAlign: 'center' }}>
            Don't have an account?{' '}
            <LinkText to={ROUTES.SIGNUP}>Sign Up</LinkText>
          </div>
        </LoginForm>
      </LoginContainer>
    </AuthLayout>
  );
};

export default LoginPage;