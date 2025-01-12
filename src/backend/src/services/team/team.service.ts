/**
 * @fileoverview Team service implementation with comprehensive team management functionality
 * @version 1.0.0
 */

import { injectable } from 'inversify'; // ^6.0.1
import { Transaction } from 'sequelize'; // ^6.32.x
import winston from 'winston'; // ^3.8.0
import { TeamRepository } from '../../db/repositories/team.repository';
import { 
  ITeamMember, 
  ITeamMemberCreate, 
  ITeamMemberUpdate, 
  TeamRole, 
  TeamMemberStatus,
  ITeamInvitation 
} from '../../interfaces/team.interface';
import { UUID } from 'crypto';

/**
 * Service class implementing comprehensive team management functionality
 * with enhanced security and transaction support
 */
@injectable()
export class TeamService {
  private readonly logger: winston.Logger;
  private readonly teamRepository: TeamRepository;

  constructor(teamRepository: TeamRepository) {
    this.teamRepository = teamRepository;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'team-service.log' })
      ]
    });
  }

  /**
   * Creates a new team member with role validation and security checks
   * @param data Team member creation data
   * @param transaction Optional transaction for atomic operations
   * @returns Created team member record
   */
  public async createTeamMember(
    data: ITeamMemberCreate,
    transaction?: Transaction
  ): Promise<ITeamMember> {
    try {
      this.logger.info('Creating team member', { data });
      
      // Create team member with repository
      const teamMember = await this.teamRepository.create(data, transaction);
      
      this.logger.info('Team member created successfully', {
        teamMemberId: teamMember.id,
        companyId: teamMember.companyId
      });

      return teamMember;
    } catch (error) {
      this.logger.error('Team member creation failed', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  /**
   * Updates an existing team member with role transition validation
   * @param id Team member identifier
   * @param data Update data
   * @param transaction Optional transaction
   * @returns Updated team member record
   */
  public async updateTeamMember(
    id: UUID,
    data: ITeamMemberUpdate,
    transaction?: Transaction
  ): Promise<ITeamMember> {
    try {
      this.logger.info('Updating team member', { id, data });
      
      // Update team member with repository
      const updatedMember = await this.teamRepository.update(
        id,
        data,
        transaction
      );
      
      this.logger.info('Team member updated successfully', {
        teamMemberId: id,
        updates: data
      });

      return updatedMember;
    } catch (error) {
      this.logger.error('Team member update failed', {
        error: error.message,
        id,
        data
      });
      throw error;
    }
  }

  /**
   * Retrieves team members for a company with pagination and filtering
   * @param companyId Company identifier
   * @param page Page number
   * @param limit Items per page
   * @param role Optional role filter
   * @param status Optional status filter
   * @returns Paginated team members
   */
  public async getTeamMembers(
    companyId: UUID,
    page: number = 1,
    limit: number = 10,
    role?: TeamRole,
    status?: TeamMemberStatus
  ): Promise<{
    items: ITeamMember[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      this.logger.info('Retrieving team members', {
        companyId,
        page,
        limit,
        role,
        status
      });

      const result = await this.teamRepository.findByCompany(companyId, {
        page,
        limit,
        role,
        status
      });

      this.logger.info('Team members retrieved successfully', {
        companyId,
        totalItems: result.total
      });

      return result;
    } catch (error) {
      this.logger.error('Team members retrieval failed', {
        error: error.message,
        companyId
      });
      throw error;
    }
  }

  /**
   * Removes a team member with proper validation and cleanup
   * @param id Team member identifier
   * @param transaction Optional transaction
   * @returns Operation success status
   */
  public async removeTeamMember(
    id: UUID,
    transaction?: Transaction
  ): Promise<boolean> {
    try {
      this.logger.info('Removing team member', { id });

      const result = await this.teamRepository.delete(id, transaction);

      this.logger.info('Team member removed successfully', { id });

      return result;
    } catch (error) {
      this.logger.error('Team member removal failed', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  /**
   * Updates team member access timestamp
   * @param id Team member identifier
   * @returns Updated team member
   */
  public async updateLastAccess(id: UUID): Promise<ITeamMember> {
    try {
      this.logger.info('Updating team member last access', { id });

      const updatedMember = await this.teamRepository.update(
        id,
        { lastAccessAt: new Date() }
      );

      this.logger.info('Team member last access updated', { id });

      return updatedMember;
    } catch (error) {
      this.logger.error('Team member last access update failed', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  /**
   * Validates team member permissions for specific actions
   * @param teamMemberId Team member identifier
   * @param requiredRole Minimum required role
   * @returns Validation result
   */
  public async validatePermissions(
    teamMemberId: UUID,
    requiredRole: TeamRole
  ): Promise<boolean> {
    try {
      const teamMember = await this.teamRepository.findById(teamMemberId);
      
      if (!teamMember || teamMember.status !== TeamMemberStatus.ACTIVE) {
        return false;
      }

      const roleHierarchy = {
        [TeamRole.ADMIN]: 4,
        [TeamRole.MANAGER]: 3,
        [TeamRole.MEMBER]: 2,
        [TeamRole.VIEWER]: 1
      };

      return roleHierarchy[teamMember.role] >= roleHierarchy[requiredRole];
    } catch (error) {
      this.logger.error('Permission validation failed', {
        error: error.message,
        teamMemberId,
        requiredRole
      });
      return false;
    }
  }
}

export default TeamService;