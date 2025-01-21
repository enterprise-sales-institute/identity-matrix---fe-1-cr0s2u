/**
 * Constants defining all application route paths with strict type safety
 * @version 1.0.0
 * @module constants/routes
 */

/**
 * Public routes accessible without authentication
 * These routes can be accessed by any user without requiring login
 * @constant
 * @readonly
 */
export const PUBLIC_ROUTES = Object.freeze({
  LOGIN: '/login',
  REGISTER: '/register',
} as const);

/**
 * Protected routes requiring authentication
 * These routes are only accessible to authenticated users with valid sessions
 * @constant
 * @readonly
 */
export const PROTECTED_ROUTES = Object.freeze({
  DASHBOARD: '/',
  PULSE: '/pulse',
  INTEGRATIONS: '/integrations',
  TEAM: '/team',
  SETTINGS: '/settings',
} as const);

/**
 * TypeScript type definition for public routes
 * Ensures type safety when accessing public route paths
 * @type {PublicRoutes}
 */
export type PublicRoutes = typeof PUBLIC_ROUTES;

/**
 * TypeScript type definition for protected routes
 * Ensures type safety when accessing protected route paths
 * @type {ProtectedRoutes}
 */
export type ProtectedRoutes = typeof PROTECTED_ROUTES;

/**
 * Type guard to check if a route is public
 * @param {string} route - Route path to check
 * @returns {boolean} True if route is public
 */
export const isPublicRoute = (route: string): route is PublicRoutes[keyof PublicRoutes] => {
  return (Object.values(PUBLIC_ROUTES) as string[]).includes(route);
};

/**
 * Type guard to check if a route is protected
 * @param {string} route - Route path to check
 * @returns {boolean} True if route is protected
 */
export const isProtectedRoute = (route: string): route is ProtectedRoutes[keyof ProtectedRoutes] => {
  return (Object.values(PROTECTED_ROUTES) as string[]).includes(route);
};