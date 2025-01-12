/**
 * Entry point for Identity Matrix Web Application
 * @version 1.0.0
 * @description Initializes React application with Redux store provider and strict mode
 */

import React from 'react'; // v18.x
import ReactDOM from 'react-dom/client'; // v18.x
import { Provider } from 'react-redux'; // v8.x

// Internal imports
import App from './App';
import { store } from './store';

/**
 * Initialize React root and render application with providers
 * Implements strict mode for development best practices and performance
 */
const renderApp = (): void => {
  // Get root element from index.html
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Failed to find root element');
  }

  // Create React root
  const root = ReactDOM.createRoot(rootElement);

  // Render application with providers
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
};

// Initialize application
renderApp();

// Enable hot module replacement in development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', () => {
    renderApp();
  });
}

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Handle uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});