/**
 * Enhanced WebSocket Hook for Identity Matrix
 * @version 1.0.0
 * @description Custom React hook for managing WebSocket connections with performance monitoring,
 * connection pooling, and automatic reconnection features
 */

import { useEffect, useCallback, useRef } from 'react'; // v18.x
import { WebSocketService } from '../services/websocket.service';
import { WEBSOCKET_EVENTS } from '../config/websocket.config';
import { useAuth } from './useAuth';

// Performance monitoring constants
const LATENCY_THRESHOLD = 50; // 50ms as per performance requirements
const CONNECTION_POOL_SIZE = 2; // Number of backup connections
const RECONNECT_DELAY = 1000; // 1 second delay between reconnection attempts

/**
 * Interface for WebSocket connection statistics
 */
interface ConnectionStats {
  latency: number;
  lastActivity: number;
  reconnectAttempts: number;
  messageCount: number;
  errorCount: number;
}

/**
 * Interface for subscription options
 */
interface SubscriptionOptions {
  batchSize?: number;
  batchInterval?: number;
  includeEnrichment?: boolean;
}

/**
 * Enhanced WebSocket hook with performance monitoring and reliability features
 */
export const useWebSocket = () => {
  const { isAuthenticated, getAuthToken } = useAuth();
  const wsService = useRef<WebSocketService | null>(null);
  const statsRef = useRef<ConnectionStats>({
    latency: 0,
    lastActivity: Date.now(),
    reconnectAttempts: 0,
    messageCount: 0,
    errorCount: 0
  });
  const isConnectedRef = useRef<boolean>(false);

  /**
   * Initialize WebSocket service with connection pool
   */
  const initializeWebSocket = useCallback(async () => {
    if (!wsService.current) {
      wsService.current = WebSocketService;
      wsService.current.setConnectionPool(CONNECTION_POOL_SIZE);
    }

    if (isAuthenticated) {
      try {
        const token = await getAuthToken();
        await wsService.current.connect(token);
        isConnectedRef.current = true;
        statsRef.current.reconnectAttempts = 0;
      } catch (error) {
        console.error('WebSocket connection error:', error);
        statsRef.current.errorCount++;
        handleReconnection();
      }
    }
  }, [isAuthenticated, getAuthToken]);

  /**
   * Handle WebSocket reconnection with exponential backoff
   */
  const handleReconnection = useCallback(async () => {
    if (statsRef.current.reconnectAttempts < 3) {
      const delay = RECONNECT_DELAY * Math.pow(2, statsRef.current.reconnectAttempts);
      statsRef.current.reconnectAttempts++;
      
      setTimeout(() => {
        initializeWebSocket();
      }, delay);
    }
  }, [initializeWebSocket]);

  /**
   * Enhanced subscription function with performance monitoring
   */
  const subscribe = useCallback(async (
    event: string,
    callback: (data: any) => void,
    options: SubscriptionOptions = {}
  ) => {
    if (!wsService.current || !isConnectedRef.current) {
      throw new Error('WebSocket not connected');
    }

    const startTime = performance.now();
    
    try {
      // Validate event type
      if (!Object.values(WEBSOCKET_EVENTS).includes(event as WEBSOCKET_EVENTS)) {
        throw new Error('Invalid event type');
      }

      // Subscribe with performance tracking
      await wsService.current.subscribe(event, (data: any) => {
        statsRef.current.messageCount++;
        statsRef.current.lastActivity = Date.now();
        
        const messageLatency = performance.now() - startTime;
        statsRef.current.latency = messageLatency;

        if (messageLatency > LATENCY_THRESHOLD) {
          console.warn(`WebSocket message latency exceeded threshold: ${messageLatency}ms`);
        }

        callback(data);
      }, options);

      return {
        success: true,
        latency: performance.now() - startTime
      };
    } catch (error) {
      statsRef.current.errorCount++;
      throw error;
    }
  }, []);

  /**
   * Enhanced unsubscription function with cleanup verification
   */
  const unsubscribe = useCallback(async (
    event: string,
    callback: (data: any) => void
  ) => {
    if (!wsService.current || !isConnectedRef.current) {
      return { success: false, error: 'WebSocket not connected' };
    }

    try {
      await wsService.current.unsubscribe(event, callback);
      return { success: true };
    } catch (error) {
      statsRef.current.errorCount++;
      return { success: false, error };
    }
  }, []);

  /**
   * Enhanced event emission with delivery confirmation
   */
  const emit = useCallback(async (
    event: string,
    data: any,
    options: { timeout?: number } = {}
  ): Promise<{ success: boolean; latency?: number }> => {
    if (!wsService.current || !isConnectedRef.current) {
      throw new Error('WebSocket not connected');
    }

    const startTime = performance.now();

    try {
      await wsService.current.emit(event, data);
      const latency = performance.now() - startTime;
      
      if (latency > LATENCY_THRESHOLD) {
        console.warn(`WebSocket emit latency exceeded threshold: ${latency}ms`);
      }

      return { success: true, latency };
    } catch (error) {
      statsRef.current.errorCount++;
      throw error;
    }
  }, []);

  /**
   * Get current connection statistics
   */
  const getConnectionStats = useCallback((): ConnectionStats => {
    return {
      ...statsRef.current,
      isConnected: isConnectedRef.current
    };
  }, []);

  /**
   * Manual reconnection handler
   */
  const reconnect = useCallback(async () => {
    if (wsService.current) {
      await wsService.current.disconnect();
    }
    isConnectedRef.current = false;
    return initializeWebSocket();
  }, [initializeWebSocket]);

  /**
   * Setup WebSocket connection and cleanup
   */
  useEffect(() => {
    initializeWebSocket();

    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
      isConnectedRef.current = false;
    };
  }, [initializeWebSocket]);

  return {
    isConnected: isConnectedRef.current,
    connectionStats: getConnectionStats(),
    subscribe,
    unsubscribe,
    emit,
    reconnect
  };
};

export type UseWebSocketReturn = ReturnType<typeof useWebSocket>;