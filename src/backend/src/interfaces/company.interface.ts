/**
 * @fileoverview Company-related interfaces for Identity Matrix platform
 * @version 1.0.0
 */

// External imports
import { UUID } from 'crypto'; // v20.0.0+

/**
 * Comprehensive interface defining company-specific configuration settings
 * with extensive customization options for the Identity Matrix platform.
 */
export interface ICompanySettings {
  /** Enable/disable email notifications for company events */
  emailNotifications: boolean;

  /** List of allowed domains for company access */
  allowedDomains: string[];

  /** Integration configuration settings */
  integrationConfig: {
    /** Master toggle for integrations */
    enabled: boolean;
    /** List of enabled integration types */
    allowedIntegrations: string[];
    /** Integration-specific settings map */
    integrationSettings: Record<string, unknown>;
  };

  /** Visitor tracking configuration */
  visitorTrackingSettings: {
    /** Master toggle for visitor tracking */
    enabled: boolean;
    /** Number of days to retain visitor data */
    retentionDays: number;
    /** Paths to exclude from tracking */
    excludedPaths: string[];
    /** Whether to capture IP addresses */
    captureIPAddress: boolean;
  };

  /** Company timezone for reporting and scheduling */
  timezone: string;

  /** Security-related settings */
  securitySettings: {
    /** Enable/disable IP restrictions */
    enforceIPRestrictions: boolean;
    /** List of allowed IP addresses */
    allowedIPs: string[];
    /** Require Multi-Factor Authentication */
    requireMFA: boolean;
  };
}

/**
 * Core company interface defining the complete structure of company data
 * with all required fields for the Identity Matrix platform.
 */
export interface ICompany {
  /** Unique identifier for the company */
  id: UUID;

  /** Company name */
  name: string;

  /** Primary domain of the company */
  domain: string;

  /** Current subscription tier */
  subscriptionTier: string;

  /** Company-specific settings */
  settings: ICompanySettings;

  /** Company creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Company active status */
  isActive: boolean;

  /** Primary billing email address */
  billingEmail: string;

  /** List of technical contact email addresses */
  technicalContacts: string[];
}

/**
 * Interface for company creation payload with all required fields
 * for initial setup in the Identity Matrix platform.
 */
export interface ICompanyCreate {
  /** Company name */
  name: string;

  /** Primary domain of the company */
  domain: string;

  /** Initial subscription tier */
  subscriptionTier: string;

  /** Initial company settings */
  settings: ICompanySettings;

  /** Primary billing email address */
  billingEmail: string;

  /** List of technical contact email addresses */
  technicalContacts: string[];
}

/**
 * Interface for company update payload with all fields marked as optional
 * for flexible updates in the Identity Matrix platform.
 */
export interface ICompanyUpdate {
  /** Updated company name */
  name?: string;

  /** Updated primary domain */
  domain?: string;

  /** Updated subscription tier */
  subscriptionTier?: string;

  /** Partial settings update */
  settings?: Partial<ICompanySettings>;

  /** Updated active status */
  isActive?: boolean;

  /** Updated billing email */
  billingEmail?: string;

  /** Updated technical contacts */
  technicalContacts?: string[];
}