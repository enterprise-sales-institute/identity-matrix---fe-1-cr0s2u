/**
 * @fileoverview Team controller implementation with enhanced security and audit logging
 * @version 1.0.0
 */

import { injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { TeamService } from '../../services/team/team.service';
import { 
  validateTeamInvitation, 
  validateTeamMemberUpdate, 
  validatePaginationParams 
} from '../validators/team.validator';
import { AppError, ValidationError } from '../../utils/error.util';
import { 
  ErrorCodes, 
  ErrorTypes, 
  ErrorMessages 
} from '../../constants/error.constants';
import { TeamRole, TeamMemberStatus } from '../../interfaces/team.interface';

/**
 * Controller handling team management HTTP endpoints with comprehensive security
 */
@injectable()
export class TeamController {
  private readonly logger: winston.Logger;
  private readonly teamService: TeamService;

  constructor(teamService: TeamService) {
    this.teamService = teamService;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'team-controller' },
      transports: [
        new winston.transports.File({ filename: 'team-controller.log' })
      ]
    });
  }

  /**
   * Retrieves paginated team members with role-based access control
   */
  public getTeamMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId } = req.user;
      const { page = 1, limit = 10, role, status } = req.query;

      // Validate pagination parameters
      const paginationParams = await validatePaginationParams({
        page: Number(page),
        limit: Number(limit),
        role: role as TeamRole,
        status: status as TeamMemberStatus
      });

      // Validate user has permission to view team
      const hasPermission = await this.teamService.validatePermissions(
        req.user.id,
        TeamRole.VIEWER
      );

      if (!hasPermission) {
        throw new AppError(
          ErrorMessages.SECURITY_MESSAGES.INSUFFICIENT_PERMISSIONS,
          ErrorCodes.FORBIDDEN,
          ErrorTypes.AUTHORIZATION_ERROR
        );
      }

      // Retrieve team members with pagination
      const teamMembers = await this.teamService.getTeamMembers(
        companyId,
        paginationParams.page,
        paginationParams.limit,
        paginationParams.role,
        paginationParams.status
      );

      this.logger.info('Team members retrieved successfully', {
        userId: req.user.id,
        companyId,
        totalItems: teamMembers.total
      });

      res.status(200).json(teamMembers);
    } catch (error) {
      this.logger.error('Error retrieving team members', {
        error: error.message,
        userId: req.user?.id,
        companyId: req.user?.companyId
      });
      next(error);
    }
  };

  /**
   * Invites a new team member with enhanced security validation
   */
  public inviteTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { companyId } = req.user;

      // Validate user has permission to invite team members
      const hasPermission = await this.teamService.validatePermissions(
        req.user.id,
        TeamRole.MANAGER
      );

      if (!hasPermission) {
        throw new AppError(
          ErrorMessages.SECURITY_MESSAGES.INSUFFICIENT_PERMISSIONS,
          ErrorCodes.FORBIDDEN,
          ErrorTypes.AUTHORIZATION_ERROR
        );
      }

      // Validate and sanitize invitation data
      const validatedInvitation = await validateTeamInvitation({
        ...req.body,
        companyId,
        invitedBy: req.user.id
      });

      // Create team member invitation
      const invitation = await this.teamService.createTeamMember({
        ...validatedInvitation,
        status: TeamMemberStatus.PENDING
      });

      this.logger.info('Team member invited successfully', {
        inviterId: req.user.id,
        companyId,
        inviteeEmail: validatedInvitation.email,
        role: validatedInvitation.role
      });

      res.status(201).json(invitation);
    } catch (error) {
      this.logger.error('Error inviting team member', {
        error: error.message,
        userId: req.user?.id,
        companyId: req.user?.companyId
      });
      next(error);
    }
  };

  /**
   * Updates team member status or role with security validation
   */
  public updateTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      // Validate user has permission to update team members
      const hasPermission = await this.teamService.validatePermissions(
        req.user.id,
        TeamRole.MANAGER
      );

      if (!hasPermission) {
        throw new AppError(
          ErrorMessages.SECURITY_MESSAGES.INSUFFICIENT_PERMISSIONS,
          ErrorCodes.FORBIDDEN,
          ErrorTypes.AUTHORIZATION_ERROR
        );
      }

      // Validate update data
      const validatedUpdate = await validateTeamMemberUpdate(req.body);

      // Update team member
      const updatedMember = await this.teamService.updateTeamMember(
        id,
        validatedUpdate
      );

      this.logger.info('Team member updated successfully', {
        updaterId: req.user.id,
        companyId,
        teamMemberId: id,
        updates: validatedUpdate
      });

      res.status(200).json(updatedMember);
    } catch (error) {
      this.logger.error('Error updating team member', {
        error: error.message,
        userId: req.user?.id,
        companyId: req.user?.companyId,
        teamMemberId: req.params.id
      });
      next(error);
    }
  };

  /**
   * Removes team member with proper validation and cleanup
   */
  public removeTeamMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      // Validate user has permission to remove team members
      const hasPermission = await this.teamService.validatePermissions(
        req.user.id,
        TeamRole.ADMIN
      );

      if (!hasPermission) {
        throw new AppError(
          ErrorMessages.SECURITY_MESSAGES.INSUFFICIENT_PERMISSIONS,
          ErrorCodes.FORBIDDEN,
          ErrorTypes.AUTHORIZATION_ERROR
        );
      }

      // Remove team member
      await this.teamService.removeTeamMember(id);

      this.logger.info('Team member removed successfully', {
        removerId: req.user.id,
        companyId,
        teamMemberId: id
      });

      res.status(204).send();
    } catch (error) {
      this.logger.error('Error removing team member', {
        error: error.message,
        userId: req.user?.id,
        companyId: req.user?.companyId,
        teamMemberId: req.params.id
      });
      next(error);
    }
  };
}

export default TeamController;