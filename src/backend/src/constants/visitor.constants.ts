/**
 * @fileoverview Constants and enums for visitor tracking and management in Identity Matrix
 * Defines type-safe enums and configuration constants for the visitor tracking system
 * @version 1.0.0
 */

/**
 * Enum defining possible visitor identification states
 * Used to track the progress of visitor de-anonymization
 */
export enum VISITOR_STATUS {
    /** Initial state when visitor is not identified */
    ANONYMOUS = 'ANONYMOUS',
    /** Visitor has been identified with basic information */
    IDENTIFIED = 'IDENTIFIED',
    /** Visitor data has been enriched with additional information */
    ENRICHED = 'ENRICHED'
}

/**
 * Enum defining trackable visitor activities
 * Used for comprehensive visitor behavior monitoring
 */
export enum VISITOR_ACTIVITY_TYPE {
    /** Visitor viewed a page */
    PAGE_VIEW = 'PAGE_VIEW',
    /** Visitor submitted a form */
    FORM_SUBMIT = 'FORM_SUBMIT',
    /** Visitor clicked a button or interactive element */
    BUTTON_CLICK = 'BUTTON_CLICK',
    /** Visitor downloaded a file */
    FILE_DOWNLOAD = 'FILE_DOWNLOAD'
}

/**
 * MongoDB collection name for visitor data
 * Used for consistent collection referencing across the application
 */
export const VISITOR_COLLECTION = 'visitors';

/**
 * Redis cache TTL in seconds for visitor data
 * Default: 1 hour (3600 seconds)
 */
export const VISITOR_CACHE_TTL = 3600;

/**
 * Type guard to check if a string is a valid VISITOR_STATUS
 * @param status - String to check
 * @returns boolean indicating if string is a valid VISITOR_STATUS
 */
export const isValidVisitorStatus = (status: string): status is VISITOR_STATUS => {
    return Object.values(VISITOR_STATUS).includes(status as VISITOR_STATUS);
};

/**
 * Type guard to check if a string is a valid VISITOR_ACTIVITY_TYPE
 * @param type - String to check
 * @returns boolean indicating if string is a valid VISITOR_ACTIVITY_TYPE
 */
export const isValidActivityType = (type: string): type is VISITOR_ACTIVITY_TYPE => {
    return Object.values(VISITOR_ACTIVITY_TYPE).includes(type as VISITOR_ACTIVITY_TYPE);
};