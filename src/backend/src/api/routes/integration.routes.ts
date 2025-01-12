/**
 * @fileoverview Express router configuration for CRM integration endpoints
 * Implements secure routes with validation, RBAC, and monitoring
 * @version 1.0.0
 */

// External imports
import { Router } from 'express'; // ^4.18.x
import { container } from 'tsyringe'; // ^4.8.x
import helmet from 'helmet'; // ^6.0.x
import compression from 'compression'; // ^1.7.x
import rateLimit from 'express-rate-limit'; // ^6.7.x

// Internal imports
import { IntegrationController } from '../controllers/integration.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { validateIntegrationCreate, validateIntegrationUpdate } from '../validators/integration.validator';
import { UserRole } from '../../interfaces/auth.interface';

/**
 * Initialize and configure integration routes with security middleware
 * @returns Configured Express router instance
 */
function initializeRoutes(): Router {
  const router = Router();
  const integrationController = container.resolve(IntegrationController);

  // Apply global middleware
  router.use(helmet());
  router.use(compression());

  // Create integration route
  router.post(
    '/integrations',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    validateRequest(validateIntegrationCreate, 'body'),
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 requests per minute
      message: { error: 'Too many integration creation attempts' }
    }),
    integrationController.createIntegration.bind(integrationController)
  );

  // Update integration route
  router.put(
    '/integrations/:id',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    validateRequest(validateIntegrationUpdate, 'body'),
    rateLimit({
      windowMs: 60 * 1000,
      max: 10,
      message: { error: 'Too many integration update attempts' }
    }),
    integrationController.updateIntegration.bind(integrationController)
  );

  // Get single integration route
  router.get(
    '/integrations/:id',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      message: { error: 'Too many integration retrieval attempts' }
    }),
    integrationController.getIntegration.bind(integrationController)
  );

  // Get company integrations route
  router.get(
    '/integrations/company/:companyId',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      message: { error: 'Too many company integrations retrieval attempts' }
    }),
    integrationController.getCompanyIntegrations.bind(integrationController)
  );

  // Trigger integration sync route
  router.post(
    '/integrations/:id/sync',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    rateLimit({
      windowMs: 60 * 1000,
      max: 2, // Strict rate limit for sync operations
      message: { error: 'Too many sync attempts' }
    }),
    integrationController.syncIntegration.bind(integrationController)
  );

  return router;
}

// Export configured router
export default initializeRoutes();