/**
 * @fileoverview Company routes configuration for Identity Matrix platform
 * @version 1.0.0
 * 
 * Implements secure REST endpoints for company management with comprehensive
 * validation, rate limiting, and role-based access control.
 */

import { Router } from 'express'; // ^4.18.2
import { CompanyController } from '../controllers/company.controller';
import { 
  authenticate, 
  authorize,
  authRateLimiter 
} from '../middlewares/auth.middleware';
import { 
  validateCompanyCreate, 
  validateCompanyUpdate 
} from '../validators/company.validator';
import { UserRole } from '../../interfaces/auth.interface';

// Rate limiting configurations
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const STANDARD_RATE_LIMIT = 100; // Standard requests per window
const CREATE_RATE_LIMIT = 10; // Create operations per window
const DELETE_RATE_LIMIT = 5; // Delete operations per window
const UPDATE_RATE_LIMIT = 20; // Update operations per window

// Role configurations
const ADMIN_ROLES = [UserRole.ADMIN];
const MANAGER_ROLES = [UserRole.ADMIN, UserRole.MANAGER];

/**
 * Configures and returns Express router with secure company management endpoints
 * Implements comprehensive security measures and validation
 */
function configureCompanyRoutes(): Router {
  const router = Router();
  const companyController = new CompanyController();

  // Apply global rate limiting
  router.use(authRateLimiter);

  // Apply authentication to all routes
  router.use(authenticate);

  /**
   * @route GET /companies
   * @description List all companies with pagination and filtering
   * @access Admin, Manager
   */
  router.get(
    '/',
    authorize(MANAGER_ROLES),
    async (req, res, next) => {
      try {
        await companyController.listCompanies(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route POST /companies
   * @description Create a new company with enhanced validation
   * @access Admin only
   */
  router.post(
    '/',
    authorize(ADMIN_ROLES),
    validateCompanyCreate,
    async (req, res, next) => {
      try {
        await companyController.createCompany(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route GET /companies/:id
   * @description Get company details by ID
   * @access Admin, Manager
   */
  router.get(
    '/:id',
    authorize(MANAGER_ROLES),
    async (req, res, next) => {
      try {
        await companyController.getCompany(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route PUT /companies/:id
   * @description Update company details with validation
   * @access Admin only
   */
  router.put(
    '/:id',
    authorize(ADMIN_ROLES),
    validateCompanyUpdate,
    async (req, res, next) => {
      try {
        await companyController.updateCompany(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route DELETE /companies/:id
   * @description Delete a company with proper cleanup
   * @access Admin only
   */
  router.delete(
    '/:id',
    authorize(ADMIN_ROLES),
    async (req, res, next) => {
      try {
        await companyController.deleteCompany(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * @route PUT /companies/:id/settings
   * @description Update company settings with validation
   * @access Admin, Manager
   */
  router.put(
    '/:id/settings',
    authorize(MANAGER_ROLES),
    async (req, res, next) => {
      try {
        await companyController.updateCompanySettings(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

// Create and export configured router
const companyRouter = configureCompanyRoutes();
export default companyRouter;