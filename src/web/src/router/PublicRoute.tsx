/**
 * Public Route Component for Identity Matrix Web Application
 * @version 1.0.0
 * @description Higher-order component that wraps public routes and handles authentication-based redirection
 * with secure route protection, performance optimization, and TypeScript type safety.
 */

import { FC, memo, useEffect } from 'react'; // v18.x
import { Navigate, Outlet, useLocation } from 'react-router-dom'; // v6.x

// Internal imports
import { useAuth } from '../hooks/useAuth';
import { PROTECTED_ROUTES } from '../constants/routes.constants';

/**
 * Interface for component props with strict typing
 */
interface PublicRouteProps {}

/**
 * PublicRoute component that handles authentication-based routing
 * Prevents authenticated users from accessing public routes
 * @returns JSX.Element - Either redirects to dashboard or renders child routes
 */
const PublicRoute: FC<PublicRouteProps> = memo(() => {
  // Get authentication state and location
  const { isAuthenticated, isLoading, authError } = useAuth();
  const location = useLocation();

  // Monitor authentication state changes
  useEffect(() => {
    if (authError) {
      console.error('Authentication error in PublicRoute:', authError);
    }
  }, [authError]);

  // Handle loading state
  if (isLoading) {
    // Return null during loading to prevent flash of incorrect content
    return null;
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return (
      <Navigate
        to={PROTECTED_ROUTES.DASHBOARD}
        state={{ from: location }}
        replace
      />
    );
  }

  // Render child routes for non-authenticated users
  return <Outlet />;
});

// Set display name for debugging
PublicRoute.displayName = 'PublicRoute';

// Export memoized component
export default PublicRoute;