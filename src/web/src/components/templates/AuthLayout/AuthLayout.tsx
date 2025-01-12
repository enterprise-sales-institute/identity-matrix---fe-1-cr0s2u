import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.0.0

import {
  AuthLayoutContainer,
  AuthLayoutContent,
  AuthLayoutLogo
} from './AuthLayout.styles';
import { useTheme } from '../../../hooks/useTheme';

// Lazy load logos for better performance
const LogoDark = lazy(() => import('../../../assets/images/logo-dark.svg'));
const LogoLight = lazy(() => import('../../../assets/images/logo-light.svg'));

// Constants for accessibility and testing
const LOGO_ALT_TEXT = 'Identity Matrix';
const ARIA_LABELS = {
  AUTH_CONTAINER: 'Authentication form container',
  LOGO_SECTION: 'Company logo'
};

interface AuthLayoutProps {
  children: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
}

/**
 * Authentication layout template providing consistent structure for auth pages
 * Implements theme support, accessibility features, and responsive design
 *
 * @param {AuthLayoutProps} props - Component props
 * @returns {JSX.Element} Authentication layout component
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  ariaLabel = ARIA_LABELS.AUTH_CONTAINER,
  testId = 'auth-layout'
}) => {
  const { isDark } = useTheme();

  /**
   * Error fallback component for error boundary
   */
  const ErrorFallback = ({ error }: { error: Error }) => (
    <div role="alert" aria-live="assertive">
      <p>Something went wrong:</p>
      <pre style={{ color: '#813efb' }}>{error.message}</pre>
    </div>
  );

  /**
   * Loading fallback for Suspense
   */
  const LoadingFallback = () => (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading logo...</span>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthLayoutContainer
        data-testid={testId}
        role="main"
        aria-label={ariaLabel}
      >
        <AuthLayoutContent>
          <AuthLayoutLogo
            role="img"
            aria-label={ARIA_LABELS.LOGO_SECTION}
          >
            <Suspense fallback={<LoadingFallback />}>
              {isDark ? (
                <LogoDark
                  alt={LOGO_ALT_TEXT}
                  width={240}
                  height={60}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <LogoLight
                  alt={LOGO_ALT_TEXT}
                  width={240}
                  height={60}
                  loading="eager"
                  decoding="async"
                />
              )}
            </Suspense>
          </AuthLayoutLogo>

          {/* Main content area with enhanced accessibility */}
          <section
            role="region"
            aria-label="Authentication form"
          >
            {children}
          </section>
        </AuthLayoutContent>
      </AuthLayoutContainer>
    </ErrorBoundary>
  );
};

// Performance optimization
export default React.memo(AuthLayout);