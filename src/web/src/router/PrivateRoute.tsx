/**
 * Higher-order component for protecting routes requiring authentication
 * @version 1.0.0
 * @description Implements secure route protection by validating authentication state
 * and redirecting unauthorized users to the login page with loading state handling
 */

import { FC, PropsWithChildren } from 'react'; // v18.x
import { Navigate } from 'react-router-dom'; // v6.x
import { useAuth } from '../hooks/useAuth';
import { PUBLIC_ROUTES } from '../constants/routes.constants';

/**
 * PrivateRoute component that wraps protected routes and handles authentication
 * @component
 * @param {PropsWithChildren} props - React props with children components
 * @returns {JSX.Element} Protected route content or redirect to login
 */
const PrivateRoute: FC<PropsWithChildren> = ({ children }): JSX.Element => {
  // Get authentication state and loading status from auth hook
  const { isAuthenticated, loading } = useAuth();

  // Show nothing while checking authentication status
  if (loading) {
    return null;
  }

  // Redirect to login page if user is not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={PUBLIC_ROUTES.LOGIN} 
        replace={true} 
        state={{ from: window.location.pathname }}
      />
    );
  }

  // Render protected route content if authenticated
  return <>{children}</>;
};

export default PrivateRoute;