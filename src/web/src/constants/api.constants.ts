/**
 * API Constants for Identity Matrix Web Application
 * @version 1.0.0
 * @description Defines API endpoint constants, headers, request configurations, and type-safe interfaces
 */

/**
 * Base API version path
 * @constant
 */
export const API_VERSION = '/api/v1';

/**
 * Type-safe interface for Authentication endpoints
 */
interface AuthEndpoints {
  readonly LOGIN: string;
  readonly REGISTER: string;
  readonly REFRESH: string;
  readonly LOGOUT: string;
  readonly VERIFY: string;
  readonly RESET_PASSWORD: string;
  readonly CHANGE_PASSWORD: string;
}

/**
 * Type-safe interface for Visitor endpoints
 */
interface VisitorEndpoints {
  readonly BASE: string;
  readonly BY_ID: string;
  readonly BY_COMPANY: string;
  readonly ACTIVITY: string;
  readonly SEARCH: string;
  readonly EXPORT: string;
  readonly ENRICH: string;
  readonly BULK_ACTION: string;
}

/**
 * Type-safe interface for Integration endpoints
 */
interface IntegrationEndpoints {
  readonly BASE: string;
  readonly BY_ID: string;
  readonly CONNECT: string;
  readonly SYNC: string;
  readonly VERIFY: string;
  readonly PROVIDERS: string;
  readonly FIELDS: string;
  readonly MAPPING: string;
}

/**
 * Type-safe interface for Team endpoints
 */
interface TeamEndpoints {
  readonly BASE: string;
  readonly INVITE: string;
  readonly BY_ID: string;
  readonly ROLES: string;
  readonly PERMISSIONS: string;
  readonly ACTIVITY: string;
  readonly BULK_INVITE: string;
}

/**
 * Type-safe interface for Security Headers
 */
interface SecurityHeaders {
  readonly STRICT_TRANSPORT: string;
  readonly CONTENT_SECURITY: string;
  readonly X_FRAME_OPTIONS: string;
  readonly X_CONTENT_TYPE: string;
  readonly REFERRER_POLICY: string;
}

/**
 * API Endpoints configuration object
 * @constant
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
  } as AuthEndpoints,

  VISITORS: {
    BASE: '/visitors',
    BY_ID: '/visitors/:id',
    BY_COMPANY: '/visitors/company/:companyId',
    ACTIVITY: '/visitors/:id/activity',
    SEARCH: '/visitors/search',
    EXPORT: '/visitors/export',
    ENRICH: '/visitors/:id/enrich',
    BULK_ACTION: '/visitors/bulk'
  } as VisitorEndpoints,

  INTEGRATIONS: {
    BASE: '/integrations',
    BY_ID: '/integrations/:id',
    CONNECT: '/integrations/connect',
    SYNC: '/integrations/:id/sync',
    VERIFY: '/integrations/:id/verify',
    PROVIDERS: '/integrations/providers',
    FIELDS: '/integrations/:id/fields',
    MAPPING: '/integrations/:id/mapping'
  } as IntegrationEndpoints,

  TEAM: {
    BASE: '/team',
    INVITE: '/team/invite',
    BY_ID: '/team/:id',
    ROLES: '/team/roles',
    PERMISSIONS: '/team/permissions',
    ACTIVITY: '/team/activity',
    BULK_INVITE: '/team/bulk-invite'
  } as TeamEndpoints
} as const;

/**
 * API Headers configuration object
 * @constant
 */
export const API_HEADERS = {
  CONTENT_TYPE: 'application/json',
  ACCEPT: 'application/json',
  AUTHORIZATION: 'Bearer',
  SECURITY: {
    STRICT_TRANSPORT: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    CONTENT_SECURITY: "Content-Security-Policy: default-src 'self'",
    X_FRAME_OPTIONS: 'X-Frame-Options: DENY',
    X_CONTENT_TYPE: 'X-Content-Type-Options: nosniff',
    REFERRER_POLICY: 'Referrer-Policy: strict-origin-when-cross-origin'
  } as SecurityHeaders
} as const;

/**
 * HTTP Methods configuration object
 * @constant
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const;

/**
 * Type exports for consuming components
 */
export type ApiEndpoints = typeof API_ENDPOINTS;
export type ApiHeadersType = typeof API_HEADERS;
export type HttpMethodsType = typeof HTTP_METHODS;