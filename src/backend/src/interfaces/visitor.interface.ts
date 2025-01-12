/**
 * @fileoverview TypeScript interfaces for visitor tracking and de-anonymization in Identity Matrix
 * Defines comprehensive data structures for visitor tracking, enrichment, and management
 * @version 1.0.0
 */

import { VISITOR_STATUS } from '../constants/visitor.constants';

/**
 * Interface defining visitor geographical location data with GDPR compliance considerations
 * Only stores essential location data needed for business operations
 */
export interface IVisitorLocation {
    /** Country of the visitor */
    country: string;
    /** City of the visitor */
    city: string;
    /** Region/state of the visitor */
    region: string;
    /** Postal code of the visitor's location */
    postalCode: string;
    /** Timezone of the visitor */
    timezone: string;
}

/**
 * Interface defining comprehensive visitor tracking metadata
 * Captures technical and behavioral data about the visitor's session
 */
export interface IVisitorMetadata {
    /** Visitor's IP address (anonymized for GDPR compliance) */
    ipAddress: string;
    /** Visitor's browser user agent string */
    userAgent: string;
    /** Page or source that referred the visitor */
    referrer: string;
    /** Current page being viewed */
    currentPage: string;
    /** History of previously viewed pages */
    previousPages: string[];
    /** Custom tracking parameters */
    customParams: Record<string, string>;
    /** Geographical location data */
    location: IVisitorLocation;
    /** Type of device (desktop, mobile, tablet) */
    deviceType: string;
    /** Browser name and version */
    browser: string;
    /** Operating system */
    os: string;
}

/**
 * Interface defining comprehensive enriched visitor company data
 * Contains B2B-focused company and professional information
 */
export interface IEnrichedData {
    /** Company name */
    company: string;
    /** Professional title */
    title: string;
    /** Industry sector */
    industry: string;
    /** Company size range */
    size: string;
    /** Annual revenue range */
    revenue: string;
    /** Company website URL */
    website: string;
    /** Technology stack used by the company */
    technologies: string[];
    /** LinkedIn company profile URL */
    linkedinUrl: string;
    /** Social media profile URLs */
    socialProfiles: Record<string, string>;
    /** Additional custom enriched fields */
    customFields: Record<string, any>;
}

/**
 * Main interface defining complete visitor data structure
 * Combines identification, tracking, and enrichment capabilities
 */
export interface IVisitor {
    /** Unique identifier for the visitor */
    id: UUID;
    /** Associated company account ID */
    companyId: UUID;
    /** Visitor's email address (if identified) */
    email: string | null;
    /** Visitor's full name (if identified) */
    name: string | null;
    /** Visitor's phone number (if provided) */
    phone: string | null;
    /** Current identification status */
    status: VISITOR_STATUS;
    /** Technical and behavioral metadata */
    metadata: IVisitorMetadata;
    /** Enriched company and professional data */
    enrichedData: IEnrichedData | null;
    /** Total number of visits */
    visits: number;
    /** Cumulative time spent on site (seconds) */
    totalTimeSpent: number;
    /** Timestamp of first visit */
    firstSeen: Date;
    /** Timestamp of most recent visit */
    lastSeen: Date;
    /** Timestamp of last enrichment update */
    lastEnriched: Date;
    /** Flag indicating if visitor is currently active */
    isActive: boolean;
    /** Custom tags and labels */
    tags: Record<string, any>;
}