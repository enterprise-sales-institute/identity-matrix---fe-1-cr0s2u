/**
 * WebSocket Configuration
 * Version: 1.0.0
 * 
 * Defines connection settings, event types, and options for real-time communication
 * between the Identity Matrix frontend and backend with enhanced type safety and
 * performance optimizations.
 */

/**
 * Global WebSocket configuration constants for performance optimization
 * Based on performance benchmarks requiring <50ms response time
 */
const WS_RECONNECTION_ATTEMPTS = 3;
const WS_RECONNECTION_DELAY = 1000; // 1 second
const WS_TIMEOUT = 5000; // 5 seconds
const WS_PING_INTERVAL = 30000; // 30 seconds
const WS_PING_TIMEOUT = 5000; // 5 seconds

/**
 * WebSocket event types for type-safe event handling
 */
export enum WEBSOCKET_EVENTS {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    VISITOR_ACTIVITY = 'visitor:activity',
    VISITOR_UPDATE = 'visitor:update',
    SUBSCRIBE_COMPANY = 'subscribe:company',
    UNSUBSCRIBE_COMPANY = 'unsubscribe:company',
    ERROR = 'error'
}

/**
 * TypeScript interface for WebSocket configuration options
 * Ensures type safety and proper configuration of Socket.IO client
 */
export interface WebSocketOptions {
    /** Allowed transport methods */
    transports: string[];
    /** Maximum number of reconnection attempts */
    reconnectionAttempts: number;
    /** Delay between reconnection attempts in milliseconds */
    reconnectionDelay: number;
    /** Connection timeout in milliseconds */
    timeout: number;
    /** Interval for ping messages in milliseconds */
    pingInterval: number;
    /** Timeout for ping messages in milliseconds */
    pingTimeout: number;
    /** Whether to automatically connect on initialization */
    autoConnect: boolean;
    /** WebSocket endpoint path */
    path: string;
}

/**
 * WebSocket configuration object with environment-specific settings
 * and performance-optimized options
 */
export const WEBSOCKET_CONFIG = {
    url: process.env.VITE_WS_URL || 
        (process.env.NODE_ENV === 'production' 
            ? 'wss://api.identitymatrix.io' 
            : 'ws://localhost:3000'),
    options: {
        transports: ['websocket'], // Force WebSocket transport for better performance
        reconnectionAttempts: WS_RECONNECTION_ATTEMPTS,
        reconnectionDelay: WS_RECONNECTION_DELAY,
        timeout: WS_TIMEOUT,
        pingInterval: WS_PING_INTERVAL,
        pingTimeout: WS_PING_TIMEOUT,
        autoConnect: false, // Manual connection management for better control
        path: '/ws'
    } as WebSocketOptions
};