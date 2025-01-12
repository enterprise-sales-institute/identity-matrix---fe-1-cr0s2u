/**
 * Constants and enums for CRM integration functionality
 * Defines supported CRM types, integration statuses, and synchronization intervals
 * @version 1.0.0
 */

/**
 * Enum defining supported CRM platform types
 */
export enum CRM_TYPES {
  SALESFORCE = 'SALESFORCE',
  HUBSPOT = 'HUBSPOT',
  PIPEDRIVE = 'PIPEDRIVE',
  ZOHO = 'ZOHO'
}

/**
 * Enum defining possible integration status states
 */
export enum INTEGRATION_STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ERROR = 'ERROR'
}

/**
 * Object defining available sync interval options in milliseconds
 */
export const SYNC_INTERVALS = {
  REAL_TIME: 1000 * 60, // 1 minute
  HOURLY: 1000 * 60 * 60, // 1 hour
  DAILY: 1000 * 60 * 60 * 24 // 24 hours
} as const;

/**
 * Default synchronization interval if none specified (1 hour)
 */
export const DEFAULT_SYNC_INTERVAL = SYNC_INTERVALS.HOURLY;

/**
 * Maximum number of retry attempts for failed API calls
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Object defining API versions for each supported CRM
 */
export const CRM_API_VERSIONS = {
  SALESFORCE: 'v53.0',
  HUBSPOT: 'v3',
  PIPEDRIVE: 'v1',
  ZOHO: 'v2'
} as const;

/**
 * Object defining OAuth endpoints for each supported CRM
 */
export const CRM_API_ENDPOINTS = {
  SALESFORCE: 'https://login.salesforce.com/services/oauth2/token',
  HUBSPOT: 'https://api.hubapi.com/oauth/v1/token',
  PIPEDRIVE: 'https://api.pipedrive.com/oauth/token',
  ZOHO: 'https://accounts.zoho.com/oauth/v2/token'
} as const;

/**
 * Type definitions for CRM integration configuration
 */
export type CRMType = keyof typeof CRM_TYPES;
export type IntegrationStatus = keyof typeof INTEGRATION_STATUS;
export type SyncInterval = keyof typeof SYNC_INTERVALS;
export type CRMApiVersion = typeof CRM_API_VERSIONS[CRMType];
export type CRMApiEndpoint = typeof CRM_API_ENDPOINTS[CRMType];