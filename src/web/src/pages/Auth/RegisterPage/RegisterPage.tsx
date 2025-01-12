import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// Internal imports
import AuthLayout from '../../components/templates/AuthLayout/AuthLayout';
import FormGroup from '../../components/molecules/FormGroup/FormGroup';
import Button from '../../components/atoms/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { RegistrationData } from '../../types/auth.types';

// Validation schema with NIST 800-63B password requirements
const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),

  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),

  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  companyName: yup
    .string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters'),

  companyDomain: yup
    .string()
    .required('Company domain is required')
    .matches(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      'Please enter a valid domain name'
    )
});

/**
 * Registration page component implementing secure user registration flow
 * with comprehensive form validation and accessibility features
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading, error: authError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<RegistrationData>({
    resolver: yupResolver(validationSchema),
    mode: 'onBlur'
  });

  /**
   * Handle form submission with validation and error handling
   */
  const onSubmit = useCallback(async (data: RegistrationData) => {
    try {
      setSubmitError(null);
      await registerUser(data);
      navigate('/dashboard');
    } catch (error: any) {
      setSubmitError(error.message || 'Registration failed. Please try again.');
      
      // Set field-specific errors if returned from API
      if (error.fields) {
        Object.entries(error.fields).forEach(([field, message]) => {
          setError(field as keyof RegistrationData, {
            type: 'manual',
            message: message as string
          });
        });
      }
    }
  }, [registerUser, navigate, setError]);

  return (
    <AuthLayout>
      <form 
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Registration form"
      >
        <FormGroup
          label="Full Name"
          error={errors.name?.message}
          required
        >
          <input
            type="text"
            {...register('name')}
            aria-label="Full name"
            autoComplete="name"
            disabled={isSubmitting}
          />
        </FormGroup>

        <FormGroup
          label="Email Address"
          error={errors.email?.message}
          required
        >
          <input
            type="email"
            {...register('email')}
            aria-label="Email address"
            autoComplete="email"
            disabled={isSubmitting}
          />
        </FormGroup>

        <FormGroup
          label="Password"
          error={errors.password?.message}
          required
        >
          <input
            type="password"
            {...register('password')}
            aria-label="Password"
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </FormGroup>

        <FormGroup
          label="Company Name"
          error={errors.companyName?.message}
          required
        >
          <input
            type="text"
            {...register('companyName')}
            aria-label="Company name"
            autoComplete="organization"
            disabled={isSubmitting}
          />
        </FormGroup>

        <FormGroup
          label="Company Domain"
          error={errors.companyDomain?.message}
          required
        >
          <input
            type="text"
            {...register('companyDomain')}
            aria-label="Company domain"
            placeholder="example.com"
            autoComplete="url"
            disabled={isSubmitting}
          />
        </FormGroup>

        {(submitError || authError) && (
          <div
            role="alert"
            aria-live="polite"
            className="error-message"
          >
            {submitError || authError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
          loading={loading}
          aria-label="Create account"
        >
          Create Account
        </Button>

        <p className="login-link">
          Already have an account?{' '}
          <a 
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
          >
            Sign in
          </a>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;