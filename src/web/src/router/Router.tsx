import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'; // v6.x
import { ErrorBoundary } from 'react-error-boundary'; // v4.x

// Lazy loaded components with route-based code splitting
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const Dashboard = React.lazy(() => import('../pages/dashboard/Dashboard'));
const Pulse = React.lazy(() => import('../pages/pulse/Pulse'));
const Integrations = React.lazy(() => import('../pages/integrations/Integrations'));
const Team = React.lazy(() => import('../pages/team/Team'));
const Settings = React.lazy(() => import('../pages/settings/Settings'));
const NotFound = React.lazy(() => import('../pages/errors/NotFound'));

// Layouts
const AuthLayout = React.lazy(() => import('../layouts/AuthLayout'));
const DashboardLayout = React.lazy(() => import('../layouts/DashboardLayout'));

// Components
const LoadingFallback = React.lazy(() => import('../components/common/LoadingFallback'));
const ErrorFallback = React.lazy(() => import('../components/common/ErrorFallback'));

// Route configurations with meta data
const publicRoutes = [
  {
    path: '/login',
    component: Login,
    meta: { title: 'Login - Identity Matrix' }
  },
  {
    path: '/register',
    component: Register,
    meta: { title: 'Register - Identity Matrix' }
  }
];

const protectedRoutes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard - Identity Matrix' }
  },
  {
    path: '/pulse',
    component: Pulse,
    meta: { title: 'Pulse - Identity Matrix' }
  },
  {
    path: '/integrations',
    component: Integrations,
    meta: { title: 'Integrations - Identity Matrix' }
  },
  {
    path: '/team',
    component: Team,
    meta: { title: 'Team - Identity Matrix' }
  },
  {
    path: '/settings',
    component: Settings,
    meta: { title: 'Settings - Identity Matrix' }
  }
];

// Route guard component for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth_token');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Scroll restoration component
const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

// Analytics tracking component
const RouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    const pageView = {
      path: location.pathname,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    // Send to analytics service
    console.log('Page View:', pageView);
  }, [location]);

  return null;
};

// Main Router component
const Router: React.FC = () => {
  const location = useLocation();

  // Route change handler for prefetching
  useEffect(() => {
    // Prefetch adjacent routes
    const prefetchRoutes = async () => {
      const currentIndex = protectedRoutes.findIndex(
        route => route.path === location.pathname
      );

      if (currentIndex !== -1) {
        const nextRoute = protectedRoutes[currentIndex + 1];
        const prevRoute = protectedRoutes[currentIndex - 1];

        if (nextRoute) {
          const module = await nextRoute.component;
          // Prefetch next route
          console.log('Prefetching:', nextRoute.path);
        }

        if (prevRoute) {
          const module = await prevRoute.component;
          // Prefetch previous route
          console.log('Prefetching:', prevRoute.path);
        }
      }
    };

    prefetchRoutes();
  }, [location]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<LoadingFallback />}>
        <ScrollToTop />
        <RouteTracker />
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            {publicRoutes.map(({ path, component: Component, meta }) => (
              <Route
                key={path}
                path={path}
                element={
                  <AuthLayout>
                    <Component />
                  </AuthLayout>
                }
              />
            ))}

            {/* Protected Routes */}
            {protectedRoutes.map(({ path, component: Component, meta }) => (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Component />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Redirect root to dashboard if authenticated */}
            <Route
              path="/"
              element={
                localStorage.getItem('auth_token') ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <AuthLayout>
                  <NotFound />
                </AuthLayout>
              }
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </ErrorBoundary>
  );
};

export default Router;