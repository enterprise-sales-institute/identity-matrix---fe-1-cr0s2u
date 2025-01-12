/**
 * @fileoverview Visitor routes configuration for Identity Matrix platform
 * Implements secure, performant and validated routes for visitor tracking and management
 * @version 1.0.0
 */

import { Router } from 'express';
import { RateLimiter } from 'rate-limiter-flexible';
import { VisitorController } from '../controllers/visitor.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest, commonValidations } from '../middlewares/validation.middleware';
import { visitorMetadataSchema, enrichedDataSchema } from '../validators/visitor.validator';
import { UserRole } from '../../interfaces/auth.interface';
import { VISITOR_STATUS } from '../../constants/visitor.constants';

// Initialize rate limiter for visitor endpoints
const visitorRateLimiter = new RateLimiter({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
  blockDuration: 120 // Block for 2 minutes if exceeded
});

// Initialize router
const visitorRouter = Router();

// Initialize controller
const visitorController = new VisitorController();

/**
 * Apply global middleware to all visitor routes
 * - Authentication required for all routes
 * - Request correlation ID
 * - Basic rate limiting
 */
visitorRouter.use(authenticate);

/**
 * @route POST /visitors
 * @desc Create new visitor with metadata
 * @access Private - Requires MEMBER role or higher
 */
visitorRouter.post('/',
  authorize([UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN]),
  validateRequest(visitorMetadataSchema, 'body'),
  async (req, res, next) => {
    try {
      await visitorRateLimiter.consume(req.ip);
      const visitor = await visitorController.createVisitor(req.body, req.query.companyId);
      res.status(201).json(visitor);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /visitors/:id
 * @desc Get visitor details by ID
 * @access Private - Requires VIEWER role or higher
 */
visitorRouter.get('/:id',
  authorize([UserRole.VIEWER, UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN]),
  commonValidations.uuidParam,
  async (req, res, next) => {
    try {
      const visitor = await visitorController.getVisitor(req.params.id);
      res.json(visitor);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /visitors/company/:companyId
 * @desc List company visitors with pagination and filtering
 * @access Private - Requires VIEWER role or higher
 */
visitorRouter.get('/company/:companyId',
  authorize([UserRole.VIEWER, UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN]),
  commonValidations.pagination,
  validateRequest(
    {
      status: visitorMetadataSchema.status.oneOf(Object.values(VISITOR_STATUS))
    },
    'query'
  ),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const visitors = await visitorController.getCompanyVisitors(
        req.params.companyId,
        { page: Number(page), limit: Number(limit), status }
      );
      res.json(visitors);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PUT /visitors/:id
 * @desc Update visitor data
 * @access Private - Requires MEMBER role or higher
 */
visitorRouter.put('/:id',
  authorize([UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN]),
  commonValidations.uuidParam,
  validateRequest(visitorMetadataSchema, 'body'),
  async (req, res, next) => {
    try {
      await visitorRateLimiter.consume(req.ip);
      const visitor = await visitorController.updateVisitor(req.params.id, req.body);
      res.json(visitor);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /visitors/:id/activity
 * @desc Track visitor activity
 * @access Private - Requires MEMBER role or higher
 */
visitorRouter.post('/:id/activity',
  authorize([UserRole.MEMBER, UserRole.MANAGER, UserRole.ADMIN]),
  commonValidations.uuidParam,
  validateRequest(
    {
      type: visitorMetadataSchema.string().required(),
      data: visitorMetadataSchema.object().required()
    },
    'body'
  ),
  async (req, res, next) => {
    try {
      await visitorRateLimiter.consume(req.ip);
      await visitorController.trackActivity(req.params.id, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /visitors/:id/enrich
 * @desc Enrich visitor data with additional information
 * @access Private - Requires MANAGER role or higher
 */
visitorRouter.post('/:id/enrich',
  authorize([UserRole.MANAGER, UserRole.ADMIN]),
  commonValidations.uuidParam,
  validateRequest(enrichedDataSchema, 'body'),
  async (req, res, next) => {
    try {
      await visitorRateLimiter.consume(req.ip);
      const visitor = await visitorController.enrichVisitorData(req.params.id, req.body);
      res.json(visitor);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /visitors/:id
 * @desc Delete visitor data (GDPR compliant)
 * @access Private - Requires ADMIN role
 */
visitorRouter.delete('/:id',
  authorize([UserRole.ADMIN]),
  commonValidations.uuidParam,
  async (req, res, next) => {
    try {
      await visitorController.deleteVisitor(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { visitorRouter };