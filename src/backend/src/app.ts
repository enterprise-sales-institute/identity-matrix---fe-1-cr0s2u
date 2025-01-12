/**
 * @fileoverview Main Express application configuration for Identity Matrix platform
 * Implements comprehensive middleware stack with security, monitoring, and performance optimizations
 * @version 1.0.0
 */

// External imports
import express, { Application } from 'express'; // ^4.18.2
import cors from 'cors'; // ^2.8.5
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import { correlator } from 'correlation-id'; // ^3.1.0
import promMiddleware from 'express-prometheus-middleware'; // ^1.2.0

// Internal imports
import authRoutes from './api/routes/auth.routes';
import visitorRoutes from './api/routes/visitor.routes';
import integrationRoutes from './api/routes/integration.routes';
import teamRoutes from './api/routes/team.routes';
import errorMiddleware from './api/middlewares/error.middleware';
import { requestLoggingMiddleware, errorLoggingMiddleware } from './api/middlewares/logging.middleware';
import { rateLimiter } from './api/middlewares/rateLimiter.middleware';
import { securityConfig } from './config/security.config';

/**
 * Main application class implementing comprehensive Express configuration
 * with enhanced security, monitoring, and performance optimizations
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initializes application middleware stack with security and performance optimizations
   */
  private initializeMiddleware(): void {
    // Request correlation for tracing
    this.app.use(correlator());

    // Security middleware
    this.app.use(helmet(securityConfig.helmet));
    this.app.use(cors(securityConfig.cors));

    // Performance middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Monitoring middleware
    this.app.use(promMiddleware({
      metricsPath: '/metrics',
      collectDefaultMetrics: true,
      requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 3, 5],
      requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
      responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400]
    }));

    // Logging middleware
    this.app.use(requestLoggingMiddleware);

    // Rate limiting
    this.app.use(rateLimiter);
  }

  /**
   * Initializes API routes with versioning and security middleware
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API routes with versioning
    const apiPrefix = '/api/v1';
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/visitors`, visitorRoutes);
    this.app.use(`${apiPrefix}/integrations`, integrationRoutes);
    this.app.use(`${apiPrefix}/team`, teamRoutes);

    // Handle 404 errors
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.path} not found`,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    });
  }

  /**
   * Initializes error handling middleware with monitoring and logging
   */
  private initializeErrorHandling(): void {
    this.app.use(errorLoggingMiddleware);
    this.app.use(errorMiddleware);
  }
}

// Create and export application instance
const app = new App().app;
export default app;