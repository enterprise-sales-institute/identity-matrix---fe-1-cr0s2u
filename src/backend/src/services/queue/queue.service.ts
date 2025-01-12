/**
 * @fileoverview AWS SQS Queue Service implementation for asynchronous task processing
 * Handles message queuing for visitor tracking, identity resolution, CRM syncs and data enrichment
 * with comprehensive error handling, retry mechanisms, and performance monitoring.
 * @version 1.0.0
 */

import { 
    SQSClient, 
    SendMessageCommand, 
    ReceiveMessageCommand, 
    DeleteMessageCommand,
    GetQueueAttributesCommand
} from '@aws-sdk/client-sqs'; // ^3.0.0
import { QueueConfig, queueConfig } from '../../config/queue.config';
import { logger } from '../../utils/logger.util';

/**
 * Message options for queue operations
 */
interface MessageOptions {
    delaySeconds?: number;
    messageGroupId?: string;
    messageDeduplicationId?: string;
    messageAttributes?: Record<string, any>;
}

/**
 * Options for receiving messages from queues
 */
interface ReceiveOptions {
    maxMessages?: number;
    waitTimeSeconds?: number;
    visibilityTimeout?: number;
}

/**
 * Service class for managing AWS SQS message queues
 */
export class QueueService {
    private sqsClient: SQSClient;
    private config: QueueConfig;
    private metrics: Map<string, {
        sent: number;
        received: number;
        deleted: number;
        failed: number;
        retried: number;
    }>;

    /**
     * Initializes the Queue Service with AWS SQS client and metrics collection
     * @param config Queue configuration settings
     */
    constructor(config: QueueConfig = queueConfig) {
        this.config = config;
        this.sqsClient = new SQSClient({
            region: this.config.region,
            endpoint: this.config.endpoint
        });
        this.metrics = new Map();
        this.initializeMetrics();
        this.startMetricsReporting();
    }

    /**
     * Sends a message to the specified queue
     * @param queueName Name of the target queue
     * @param message Message content to send
     * @param options Optional message configuration
     */
    async sendMessage(
        queueName: string,
        message: Record<string, any>,
        options: MessageOptions = {}
    ): Promise<void> {
        try {
            const queueUrl = this.getQueueUrl(queueName);
            const messageBody = JSON.stringify({
                ...message,
                timestamp: new Date().toISOString(),
                metadata: {
                    source: 'identity-matrix',
                    version: '1.0.0'
                }
            });

            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: messageBody,
                DelaySeconds: options.delaySeconds,
                MessageGroupId: options.messageGroupId,
                MessageDeduplicationId: options.messageDeduplicationId,
                MessageAttributes: this.formatMessageAttributes(options.messageAttributes)
            });

            await this.sqsClient.send(command);
            this.updateMetrics(queueName, 'sent');
            
            logger.info('Message sent successfully', {
                queueName,
                messageId: options.messageDeduplicationId,
                size: messageBody.length
            });
        } catch (error) {
            this.updateMetrics(queueName, 'failed');
            logger.error('Failed to send message', {
                queueName,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Receives messages from the specified queue
     * @param queueName Name of the source queue
     * @param options Optional receive configuration
     * @returns Array of received messages
     */
    async receiveMessages(
        queueName: string,
        options: ReceiveOptions = {}
    ): Promise<Array<Record<string, any>>> {
        try {
            const queueUrl = this.getQueueUrl(queueName);
            const queueConfig = this.getQueueConfig(queueName);

            const command = new ReceiveMessageCommand({
                QueueUrl: queueUrl,
                MaxNumberOfMessages: options.maxMessages || queueConfig.batchSize,
                WaitTimeSeconds: options.waitTimeSeconds || 20,
                VisibilityTimeout: options.visibilityTimeout || queueConfig.visibilityTimeout,
                MessageAttributeNames: ['All'],
                AttributeNames: ['All']
            });

            const response = await this.sqsClient.send(command);
            const messages = response.Messages || [];
            
            this.updateMetrics(queueName, 'received', messages.length);
            
            return messages.map(message => ({
                id: message.MessageId,
                body: JSON.parse(message.Body),
                receiptHandle: message.ReceiptHandle,
                attributes: message.MessageAttributes,
                metadata: {
                    receivedCount: message.Attributes?.ApproximateReceiveCount,
                    firstReceived: message.Attributes?.SentTimestamp,
                    receiveTime: new Date().toISOString()
                }
            }));
        } catch (error) {
            this.updateMetrics(queueName, 'failed');
            logger.error('Failed to receive messages', {
                queueName,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Deletes a processed message from the queue
     * @param queueName Name of the queue
     * @param receiptHandle Receipt handle of the message to delete
     */
    async deleteMessage(queueName: string, receiptHandle: string): Promise<void> {
        try {
            const queueUrl = this.getQueueUrl(queueName);
            
            const command = new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: receiptHandle
            });

            await this.sqsClient.send(command);
            this.updateMetrics(queueName, 'deleted');
            
            logger.debug('Message deleted successfully', {
                queueName,
                receiptHandle: receiptHandle.substring(0, 20) + '...'
            });
        } catch (error) {
            this.updateMetrics(queueName, 'failed');
            logger.error('Failed to delete message', {
                queueName,
                receiptHandle: receiptHandle.substring(0, 20) + '...',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Retries a failed message with exponential backoff
     * @param queueName Name of the queue
     * @param message Failed message to retry
     * @param attemptCount Number of previous retry attempts
     */
    async retryMessage(
        queueName: string,
        message: Record<string, any>,
        attemptCount: number
    ): Promise<void> {
        const queueConfig = this.getQueueConfig(queueName);
        
        if (attemptCount >= queueConfig.retryAttempts) {
            logger.warn('Message exceeded retry limit', {
                queueName,
                messageId: message.id,
                attempts: attemptCount
            });
            // Move to DLQ handling would be implemented here
            return;
        }

        const delaySeconds = Math.min(
            Math.pow(2, attemptCount) * 10,
            900 // Max delay of 15 minutes
        );

        await this.sendMessage(queueName, message, {
            delaySeconds,
            messageAttributes: {
                ...message.attributes,
                retryCount: {
                    DataType: 'Number',
                    StringValue: attemptCount.toString()
                }
            }
        });

        this.updateMetrics(queueName, 'retried');
        
        logger.info('Message scheduled for retry', {
            queueName,
            messageId: message.id,
            attemptCount,
            delaySeconds
        });
    }

    /**
     * Initializes metrics collection for all queues
     * @private
     */
    private initializeMetrics(): void {
        Object.keys(this.config.queues).forEach(queueName => {
            this.metrics.set(queueName, {
                sent: 0,
                received: 0,
                deleted: 0,
                failed: 0,
                retried: 0
            });
        });
    }

    /**
     * Updates metrics for queue operations
     * @private
     */
    private updateMetrics(queueName: string, operation: string, count: number = 1): void {
        const queueMetrics = this.metrics.get(queueName);
        if (queueMetrics && operation in queueMetrics) {
            queueMetrics[operation] += count;
        }
    }

    /**
     * Starts periodic metrics reporting
     * @private
     */
    private startMetricsReporting(): void {
        setInterval(() => {
            this.metrics.forEach((metrics, queueName) => {
                logger.info('Queue metrics', {
                    queueName,
                    metrics,
                    timestamp: new Date().toISOString()
                });
            });
        }, 60000); // Report every minute
    }

    /**
     * Gets queue URL from configuration
     * @private
     */
    private getQueueUrl(queueName: string): string {
        const queueConfig = this.getQueueConfig(queueName);
        if (!queueConfig?.url) {
            throw new Error(`Queue URL not found for: ${queueName}`);
        }
        return queueConfig.url;
    }

    /**
     * Gets queue configuration
     * @private
     */
    private getQueueConfig(queueName: string): any {
        const queueConfig = this.config.queues[queueName];
        if (!queueConfig) {
            throw new Error(`Queue configuration not found for: ${queueName}`);
        }
        return queueConfig;
    }

    /**
     * Formats message attributes for SQS
     * @private
     */
    private formatMessageAttributes(
        attributes: Record<string, any> = {}
    ): Record<string, any> {
        const formatted = {};
        Object.entries(attributes).forEach(([key, value]) => {
            formatted[key] = {
                DataType: this.getAttributeDataType(value),
                StringValue: value.toString()
            };
        });
        return formatted;
    }

    /**
     * Determines SQS attribute data type
     * @private
     */
    private getAttributeDataType(value: any): string {
        if (typeof value === 'number') return 'Number';
        if (typeof value === 'boolean') return 'Boolean';
        if (value instanceof Date) return 'String';
        if (Buffer.isBuffer(value)) return 'Binary';
        return 'String';
    }
}