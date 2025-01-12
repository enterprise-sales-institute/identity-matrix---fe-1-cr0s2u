/**
 * @fileoverview Authentication routes configuration implementing OAuth 2.0 + PKCE standards
 * with comprehensive security measures and audit logging
 * @version 1.0.0
 */

// External imports
import { Router } from 'express'; // ^4.18.2
import helmet from 'helmet'; // ^7.0.0
import compression from 'compression'; // ^1.7.4
import rateLimit from 'express-rate-limit'; // ^6.7.0
import winston from 'winston'; // ^3.8.2

// Internal imports
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  loginSchema, 
  registrationSchema, 
  refreshTokenSchema 
} from '../validators/auth.validator';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'auth-routes-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'auth-routes-combined.log' })
  ]
});

// Rate limiting configurations
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many refresh attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many logout attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Configures and returns Express router with secure authentication routes
 * implementing OAuth 2.0 + PKCE standards with comprehensive security measures
 */
const router = Router();

// Apply global middleware
router.use(helmet());
router.use(compression());

// Audit logging middleware
const auditLog = (req: any, res: any, next: any) => {
  logger.info('Auth route accessed', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  next();
};

// Configure secure routes with validation, rate limiting, and audit logging
router.post(
  '/login',
  auditLog,
  loginLimiter,
  helmet(),
  validateRequest(loginSchema, 'body'),
  AuthController.login
);

router.post(
  '/register',
  auditLog,
  registrationLimiter,
  helmet(),
  validateRequest(registrationSchema, 'body'),
  AuthController.register
);

router.post(
  '/refresh',
  auditLog,
  refreshLimiter,
  helmet(),
  validateRequest(refreshTokenSchema, 'body'),
  AuthController.refreshToken
);

router.post(
  '/logout',
  auditLog,
  logoutLimiter,
  helmet(),
  AuthController.logout
);

// Error handling middleware
router.use((err: any, req: any, res: any, next: any) => {
  logger.error('Auth route error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    code: err.statusCode || 500,
    requestId: req.id
  });
});

export default router;