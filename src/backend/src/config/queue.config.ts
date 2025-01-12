/**
 * @fileoverview AWS SQS Queue Configuration
 * Queue configuration for asynchronous task processing including visitor tracking,
 * identity resolution, CRM synchronization and data enrichment operations.
 * @version 1.0.0
 */

// @aws-sdk/types version ^3.0.0
import { SQSClientConfig } from '@aws-sdk/types';

/**
 * Interface defining individual queue settings for SQS queues
 */
export interface QueueSettings {
  /** Queue URL from AWS SQS */
  url: string;
  /** Number of messages to process in a single batch */
  batchSize: number;
  /** Duration (seconds) that messages are hidden from subsequent retrieve requests */
  visibilityTimeout: number;
  /** Maximum number of retry attempts for failed message processing */
  retryAttempts: number;
}

/**
 * Interface defining the complete queue configuration structure
 */
export interface QueueConfig {
  /** AWS Region where SQS queues are located */
  region: string;
  /** SQS service endpoint URL */
  endpoint: string;
  /** Configuration for different queue types */
  queues: {
    /** Queue for processing visitor tracking events */
    visitorTracking: QueueSettings;
    /** Queue for identity resolution tasks */
    identityResolution: QueueSettings;
    /** Queue for enriching visitor data with additional information */
    dataEnrichment: QueueSettings;
    /** Queue for synchronizing data with CRM systems */
    crmSync: QueueSettings;
  };
}

/**
 * Default queue configuration settings for the application.
 * Uses environment variables for sensitive/environment-specific values.
 */
export const queueConfig: QueueConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.SQS_ENDPOINT || 'https://sqs.us-east-1.amazonaws.com',
  queues: {
    visitorTracking: {
      url: process.env.VISITOR_TRACKING_QUEUE_URL || '',
      batchSize: 10, // Optimized for high-throughput visitor events
      visibilityTimeout: 30, // 30 seconds for quick processing
      retryAttempts: 3
    },
    identityResolution: {
      url: process.env.IDENTITY_RESOLUTION_QUEUE_URL || '',
      batchSize: 5, // Smaller batch size for complex resolution tasks
      visibilityTimeout: 60, // 1 minute for resolution processing
      retryAttempts: 3
    },
    dataEnrichment: {
      url: process.env.DATA_ENRICHMENT_QUEUE_URL || '',
      batchSize: 5, // Balanced batch size for enrichment operations
      visibilityTimeout: 120, // 2 minutes for external API calls
      retryAttempts: 3
    },
    crmSync: {
      url: process.env.CRM_SYNC_QUEUE_URL || '',
      batchSize: 1, // Single message processing for reliable CRM updates
      visibilityTimeout: 300, // 5 minutes for complex CRM operations
      retryAttempts: 5 // More retries for critical CRM sync tasks
    }
  }
};

/**
 * Validates that all required queue URLs are provided in environment variables
 * @throws {Error} If any required queue URL is missing
 */
const validateQueueConfig = (): void => {
  const requiredQueues = [
    'VISITOR_TRACKING_QUEUE_URL',
    'IDENTITY_RESOLUTION_QUEUE_URL',
    'DATA_ENRICHMENT_QUEUE_URL',
    'CRM_SYNC_QUEUE_URL'
  ];

  const missingQueues = requiredQueues.filter(
    queue => !process.env[queue]
  );

  if (missingQueues.length > 0) {
    throw new Error(
      `Missing required queue URLs in environment variables: ${missingQueues.join(', ')}`
    );
  }
};

// Validate queue configuration on module load
validateQueueConfig();

export default queueConfig;