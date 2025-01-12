/**
 * @fileoverview Entry point for Identity Matrix backend server
 * Implements production-grade server initialization with clustering, monitoring,
 * and container lifecycle management
 * @version 1.0.0
 */

import http from 'http';
import cluster from 'cluster';
import { Logger } from '@nestjs/common';
import { createTerminus } from '@godaddy/terminus';
import { register, collectDefaultMetrics } from 'prom-client';

// Internal imports
import app from './app';
import { serverConfig } from './config/server.config';
import { WebSocketService } from './websocket/socket.service';

// Initialize logger
const logger = new Logger('Server');

// Enable default Prometheus metrics collection
collectDefaultMetrics({ prefix: 'identity_matrix_' });

/**
 * Initializes and starts the HTTP and WebSocket servers with clustering support
 */
async function startServer(): Promise<void> {
  try {
    // Initialize HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket service
    const wsService = new WebSocketService();
    await wsService.initialize(server);

    // Configure health checks
    createTerminus(server, {
      healthChecks: {
        '/health': async () => {
          // Implement comprehensive health checks
          return Promise.resolve();
        },
        '/metrics': async () => {
          return register.metrics();
        }
      },
      onSignal: async () => {
        // Cleanup on shutdown signal
        logger.log('Starting cleanup...');
        await wsService.shutdown();
        await app.locals.cleanup?.();
      },
      onShutdown: async () => {
        logger.log('Cleanup completed, shutting down...');
      },
      logger: console.log
    });

    // Start server with clustering support
    if (process.env.CLUSTER_ENABLED === 'true' && cluster.isPrimary) {
      const numWorkers = Number(process.env.WORKER_COUNT) || serverConfig.cluster.workers;
      
      // Fork workers
      for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
      }

      // Handle worker events
      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.id} died. Code: ${code}, Signal: ${signal}`);
        if (code !== 0 && !worker.exitedAfterDisconnect) {
          logger.log('Starting new worker...');
          cluster.fork();
        }
      });

      // Log master process info
      logger.log(`Master process running with PID: ${process.pid}`);
    } else {
      // Worker process or non-clustered mode
      server.listen(serverConfig.port, serverConfig.host, () => {
        logger.log(`Server running on http://${serverConfig.host}:${serverConfig.port}`);
        logger.log(`Worker ${cluster.worker?.id || 'standalone'} started with PID: ${process.pid}`);
      });
    }

    // Handle container lifecycle signals
    setupProcessHandlers();
  } catch (error) {
    logger.error('Failed to start server:', error.stack);
    process.exit(1);
  }
}

/**
 * Sets up process event handlers for graceful shutdown
 */
function setupProcessHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error.stack);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle termination signals
  process.on('SIGTERM', async () => {
    await handleShutdown('SIGTERM');
  });

  process.on('SIGINT', async () => {
    await handleShutdown('SIGINT');
  });
}

/**
 * Handles graceful server shutdown
 */
async function handleShutdown(signal: NodeJS.Signals): Promise<void> {
  logger.log(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    if (cluster.worker) {
      cluster.worker.disconnect();
    }

    // Wait for existing requests to complete (with timeout)
    const shutdownTimeout = serverConfig.performance.timeout.server;
    await new Promise(resolve => setTimeout(resolve, shutdownTimeout));

    // Cleanup and exit
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error.stack);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  logger.error('Failed to start server:', error.stack);
  process.exit(1);
});