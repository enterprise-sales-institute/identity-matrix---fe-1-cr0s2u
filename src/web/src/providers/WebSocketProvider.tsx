/**
 * WebSocket Provider Component for Identity Matrix
 * @version 1.0.0
 * @description React context provider that manages WebSocket connections with enhanced
 * security, performance optimization, and real-time communication capabilities
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketService } from '../services/websocket.service';
import { WEBSOCKET_EVENTS } from '../config/websocket.config';
import { useAuth } from '../hooks/useAuth';

// Connection status enum for type-safe status tracking
enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// Interface for visitor activity data
interface VisitorActivity {
  visitorId: string;
  action: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// Interface for visitor update data
interface VisitorUpdate {
  visitorId: string;
  changes: Record<string, any>;
  timestamp: string;
}

// Interface for reconnection options
interface ReconnectOptions {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
}

// WebSocket context value interface
interface WebSocketContextValue {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToCompany: (companyId: string) => void;
  onVisitorActivity: (callback: (data: VisitorActivity) => void) => () => void;
  onVisitorUpdate: (callback: (data: VisitorUpdate) => void) => () => void;
  connectionError: Error | null;
  reconnectAttempts: number;
  lastHeartbeat: Date | null;
}

// Provider props interface
interface WebSocketProviderProps {
  children: React.ReactNode;
  poolSize?: number;
  batchSize?: number;
  reconnectOptions?: ReconnectOptions;
}

// Constants
const DEFAULT_POOL_SIZE = 3;
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_RECONNECT_OPTIONS: ReconnectOptions = {
  maxAttempts: 5,
  delay: 1000,
  backoffMultiplier: 1.5
};

// Create WebSocket context
const WebSocketContext = createContext<WebSocketContextValue | null>(null);

/**
 * WebSocket Provider Component
 * Manages WebSocket connections and provides real-time communication capabilities
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  poolSize = DEFAULT_POOL_SIZE,
  batchSize = DEFAULT_BATCH_SIZE,
  reconnectOptions = DEFAULT_RECONNECT_OPTIONS
}) => {
  const { isAuthenticated, user, validateSession } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const wsService = useRef<WebSocketService>(new WebSocketService());

  /**
   * Initialize WebSocket service with enhanced features
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [poolSize, batchSize]);

  /**
   * Connect to WebSocket server with authentication
   */
  const connect = useCallback(async () => {
    if (!isAuthenticated || !user) {
      throw new Error('Authentication required for WebSocket connection');
    }

    try {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      await wsService.current.connect(user.id);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setConnectionError(null);
      setReconnectAttempts(0);
    } catch (error) {
      setConnectionStatus(ConnectionStatus.ERROR);
      setConnectionError(error as Error);
      handleReconnection();
    }
  }, [isAuthenticated, user]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    wsService.current.disconnect();
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setConnectionError(null);
    setReconnectAttempts(0);
  }, []);

  /**
   * Handle WebSocket reconnection with exponential backoff
   */
  const handleReconnection = useCallback(async () => {
    if (reconnectAttempts >= reconnectOptions.maxAttempts) {
      setConnectionStatus(ConnectionStatus.ERROR);
      setConnectionError(new Error('Maximum reconnection attempts reached'));
      return;
    }

    const delay = reconnectOptions.delay * Math.pow(reconnectOptions.backoffMultiplier, reconnectAttempts);
    setConnectionStatus(ConnectionStatus.RECONNECTING);
    setReconnectAttempts(prev => prev + 1);

    await new Promise(resolve => setTimeout(resolve, delay));
    await connect();
  }, [reconnectAttempts, reconnectOptions, connect]);

  /**
   * Subscribe to company-specific events
   */
  const subscribeToCompany = useCallback((companyId: string) => {
    if (connectionStatus !== ConnectionStatus.CONNECTED) {
      throw new Error('WebSocket not connected');
    }

    wsService.current.subscribeToCompany(companyId);
  }, [connectionStatus]);

  /**
   * Register visitor activity callback
   */
  const onVisitorActivity = useCallback((callback: (data: VisitorActivity) => void) => {
    const eventEmitter = wsService.current.getEventEmitter();
    eventEmitter.on(WEBSOCKET_EVENTS.VISITOR_ACTIVITY, callback);
    return () => {
      eventEmitter.off(WEBSOCKET_EVENTS.VISITOR_ACTIVITY, callback);
    };
  }, []);

  /**
   * Register visitor update callback
   */
  const onVisitorUpdate = useCallback((callback: (data: VisitorUpdate) => void) => {
    const eventEmitter = wsService.current.getEventEmitter();
    eventEmitter.on(WEBSOCKET_EVENTS.VISITOR_UPDATE, callback);
    return () => {
      eventEmitter.off(WEBSOCKET_EVENTS.VISITOR_UPDATE, callback);
    };
  }, []);

  /**
   * Monitor connection status and handle session validation
   */
  useEffect(() => {
    if (isAuthenticated && connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect();
    }

    const heartbeatInterval = setInterval(async () => {
      if (connectionStatus === ConnectionStatus.CONNECTED) {
        const isValid = await validateSession();
        if (!isValid) {
          disconnect();
        } else {
          setLastHeartbeat(new Date());
        }
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [isAuthenticated, connectionStatus, connect, disconnect, validateSession]);

  const contextValue: WebSocketContextValue = {
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    connectionStatus,
    connect,
    disconnect,
    subscribeToCompany,
    onVisitorActivity,
    onVisitorUpdate,
    connectionError,
    reconnectAttempts,
    lastHeartbeat
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Custom hook to access WebSocket context with type safety
 */
export const useWebSocketContext = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};