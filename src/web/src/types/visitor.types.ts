/**
 * Enum defining possible visitor identification states for tracking de-anonymization progress
 * @version 1.0.0
 */
export enum VisitorStatus {
    ANONYMOUS = 'ANONYMOUS',
    IDENTIFIED = 'IDENTIFIED',
    ENRICHED = 'ENRICHED'
}

/**
 * Interface defining visitor geographical location data for regional analytics
 * @interface VisitorLocation
 */
export interface VisitorLocation {
    /** ISO country code */
    country: string;
    /** City name */
    city: string;
    /** Region/state name */
    region: string;
}

/**
 * Interface defining comprehensive visitor tracking metadata including technical and location information
 * @interface VisitorMetadata
 */
export interface VisitorMetadata {
    /** Visitor's IP address */
    ipAddress: string;
    /** Browser user agent string */
    userAgent: string;
    /** Page referrer URL */
    referrer: string;
    /** Geographical location data */
    location: VisitorLocation;
}

/**
 * Interface defining enriched company and professional data obtained through lead enrichment
 * @interface EnrichedData
 */
export interface EnrichedData {
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
}

/**
 * Main interface defining complete visitor entity with tracking and enrichment data
 * @interface Visitor
 */
export interface Visitor {
    /** Unique visitor identifier */
    id: string;
    /** Associated company identifier */
    companyId: string;
    /** Visitor email (null if anonymous) */
    email: string | null;
    /** Current identification status */
    status: VisitorStatus;
    /** Technical and location metadata */
    metadata: VisitorMetadata;
    /** Enriched data (null if not enriched) */
    enrichedData: EnrichedData | null;
    /** Initial visit timestamp (ISO format) */
    firstSeen: string;
    /** Most recent visit timestamp (ISO format) */
    lastSeen: string;
}

/**
 * Interface defining visitor filtering and search options
 * @interface VisitorFilter
 */
export interface VisitorFilter {
    /** Filter by visitor status */
    status: VisitorStatus[];
    /** Date range for filtering visits */
    dateRange: {
        /** Start date (ISO format) */
        start: string;
        /** End date (ISO format) */
        end: string;
    };
    /** Search query string */
    search: string;
}