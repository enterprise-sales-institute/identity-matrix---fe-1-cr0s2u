/**
 * @fileoverview Team management routes configuration with enhanced security and RBAC
 * @version 1.0.0
 */

import { Router } from 'express'; // ^4.18.2
import rateLimit from 'express-rate-limit'; // ^6.7.0
import helmet from 'helmet'; // ^7.0.0

import { TeamController } from '../controllers/team.controller';
import { 
  authenticate, 
  authorize, 
  validateCompanyContext 
} from '../middlewares/auth.middleware';
import { 
  validateRequest, 
  sanitizeInput 
} from '../middlewares/validation.middleware';
import { 
  validateTeamInvitation, 
  validateTeamMemberUpdate 
} from '../validators/team.validator';
import { UserRole } from '../../interfaces/auth.interface';

// Constants
const BASE_PATH = '/team';
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

/**
 * Configure rate limiting for team invitation endpoints
 */
const inviteRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  message: { error: 'Too many invitations from this IP' }
});

/**
 * Initialize team management routes with security middleware and RBAC
 * @param teamController - Initialized team controller instance
 * @returns Configured Express router
 */
export const initializeTeamRoutes = (teamController: TeamController): Router => {
  const router = Router({ strict: true });

  // Apply security headers
  router.use(helmet());

  // GET /team - Retrieve team members with pagination and filtering
  router.get(
    '/',
    authenticate,
    authorize([UserRole.VIEWER]),
    validateCompanyContext,
    async (req, res, next) => {
      try {
        await teamController.getTeamMembers(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /team/invite - Invite new team member
  router.post(
    '/invite',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    validateCompanyContext,
    inviteRateLimiter,
    validateRequest(validateTeamInvitation, 'body'),
    sanitizeInput,
    async (req, res, next) => {
      try {
        await teamController.inviteTeamMember(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /team/:memberId - Update team member role or status
  router.put(
    '/:memberId',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    validateCompanyContext,
    validateRequest(validateTeamMemberUpdate, 'body'),
    sanitizeInput,
    async (req, res, next) => {
      try {
        await teamController.updateTeamMember(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /team/:memberId - Remove team member
  router.delete(
    '/:memberId',
    authenticate,
    authorize([UserRole.ADMIN]),
    validateCompanyContext,
    async (req, res, next) => {
      try {
        await teamController.removeTeamMember(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /team/invite/:invitationId/accept - Accept team invitation
  router.put(
    '/invite/:invitationId/accept',
    authenticate,
    validateRequest(validateTeamInvitation, 'body'),
    sanitizeInput,
    async (req, res, next) => {
      try {
        await teamController.acceptInvitation(req, res, next);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

export default initializeTeamRoutes;