/**
 * Root Application Component for Identity Matrix Platform
 * @version 1.0.0
 * @description Implements core application structure with providers and routing,
 * ensuring proper component hierarchy and dependency management
 */

import React, { FC, Suspense } from 'react'; // v18.x
import { ErrorBoundary } from 'react-error-boundary'; // v4.0.0

// Internal imports
import Router from './router/Router';
import ThemeProvider from './providers/ThemeProvider';
import AuthProvider from './providers/AuthProvider';
import WebSocketProvider from './providers/WebSocketProvider';

/**
 * Error fallback component for top-level error boundary
 */
const ErrorFallback: FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary
}) => (
  <div role="alert" style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Something went wrong</h2>
    <pre style={{ color: 'red' }}>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

/**
 * Loading fallback component for Suspense boundary
 */
const LoadingFallback: FC = () => (
  <div style={{ 
    position: 'fixed', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)'
  }}>
    Loading...
  </div>
);

/**
 * Root application component that sets up the provider hierarchy and routing
 * Implements secure authentication, theme management, and real-time communication
 */
const App: FC = () => {
  /**
   * Handle unrecoverable errors at the application root
   * @param error - Error object
   * @param info - Error information
   */
  const handleError = (error: Error, info: { componentStack: string }) => {
    // Log error to monitoring service
    console.error('Application Error:', error);
    console.error('Component Stack:', info.componentStack);
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Reset application state and reload
        window.location.reload();
      }}
    >
      <ThemeProvider defaultMode="light" useSystemTheme={true}>
        <AuthProvider
          config={{
            refreshInterval: 4 * 60 * 1000, // 4 minutes
            sessionTimeout: 30 * 60 * 1000  // 30 minutes
          }}
        >
          <WebSocketProvider
            poolSize={3}
            batchSize={10}
            reconnectOptions={{
              maxAttempts: 5,
              delay: 1000,
              backoffMultiplier: 1.5
            }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Router />
            </Suspense>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;