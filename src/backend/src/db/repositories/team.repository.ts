/**
 * @fileoverview Team repository implementation with secure multi-tenant data access patterns
 * @version 1.0.0
 */

import { Transaction, Op } from 'sequelize'; // ^6.32.x
import winston from 'winston'; // ^3.8.x
import { TeamModel } from '../models/team.model';
import { 
  ITeamMember, 
  ITeamMemberCreate, 
  ITeamMemberUpdate, 
  TeamRole, 
  TeamMemberStatus 
} from '../../interfaces/team.interface';

/**
 * Interface for pagination options
 */
interface PaginationOptions {
  page: number;
  limit: number;
  role?: TeamRole;
  status?: TeamMemberStatus;
}

/**
 * Interface for paginated response
 */
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Repository class implementing secure team management operations with role-based validation
 */
export class TeamRepository {
  private model: typeof TeamModel;
  private logger: winston.Logger;

  constructor() {
    this.model = TeamModel;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'team-operations.log' })
      ]
    });
  }

  /**
   * Creates a new team member with role validation and audit logging
   * @param data Team member creation data
   * @param transaction Optional transaction for atomic operations
   * @returns Created team member record
   */
  public async create(
    data: ITeamMemberCreate,
    transaction?: Transaction
  ): Promise<ITeamMember> {
    try {
      // Validate company member limit based on subscription
      await this.validateCompanyMemberLimit(data.companyId);

      // Validate role assignment permissions
      await this.validateRoleAssignment(data.role, data.invitedBy, data.companyId);

      const teamMember = await this.model.create(
        {
          ...data,
          status: TeamMemberStatus.PENDING,
          invitedAt: new Date()
        },
        { transaction }
      );

      this.logger.info('Team member created', {
        teamMemberId: teamMember.id,
        companyId: data.companyId,
        role: data.role,
        invitedBy: data.invitedBy
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
   * Retrieves paginated team members for a company with role filtering
   * @param companyId Company identifier
   * @param options Pagination and filter options
   * @returns Paginated team members
   */
  public async findByCompany(
    companyId: string,
    options: PaginationOptions
  ): Promise<PaginatedResponse<ITeamMember>> {
    const { page = 1, limit = 10, role, status } = options;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      companyId,
      ...(role && { role }),
      ...(status && { status })
    };

    const { count, rows } = await this.model.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] }
    });

    return {
      items: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Updates a team member with role transition validation
   * @param id Team member identifier
   * @param data Update data
   * @param transaction Optional transaction
   * @returns Updated team member
   */
  public async update(
    id: string,
    data: ITeamMemberUpdate,
    transaction?: Transaction
  ): Promise<ITeamMember> {
    try {
      const teamMember = await this.model.findByPk(id);
      if (!teamMember) {
        throw new Error('Team member not found');
      }

      if (data.role) {
        await this.validateRoleTransition(
          teamMember.role,
          data.role,
          teamMember.companyId
        );
      }

      if (data.status) {
        await this.validateStatusTransition(
          teamMember.status,
          data.status,
          teamMember.companyId
        );
      }

      const updatedMember = await teamMember.update(data, { transaction });

      this.logger.info('Team member updated', {
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
   * Soft deletes a team member with cascade validation
   * @param id Team member identifier
   * @param transaction Optional transaction
   * @returns Deletion success status
   */
  public async delete(
    id: string,
    transaction?: Transaction
  ): Promise<boolean> {
    try {
      const teamMember = await this.model.findByPk(id);
      if (!teamMember) {
        throw new Error('Team member not found');
      }

      // Prevent deletion of last admin
      await this.validateAdminDeletion(teamMember);

      await teamMember.update(
        { status: TeamMemberStatus.INACTIVE },
        { transaction }
      );

      this.logger.info('Team member deleted', {
        teamMemberId: id,
        companyId: teamMember.companyId
      });

      return true;
    } catch (error) {
      this.logger.error('Team member deletion failed', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  /**
   * Validates company member limit based on subscription
   * @param companyId Company identifier
   */
  private async validateCompanyMemberLimit(companyId: string): Promise<void> {
    const memberCount = await this.model.count({
      where: { companyId, status: { [Op.ne]: TeamMemberStatus.INACTIVE } }
    });

    // TODO: Implement subscription-based limit validation
    const MEMBER_LIMIT = 100; // Placeholder limit
    if (memberCount >= MEMBER_LIMIT) {
      throw new Error('Company member limit reached');
    }
  }

  /**
   * Validates role assignment permissions
   * @param role Role to assign
   * @param assignerId User assigning the role
   * @param companyId Company identifier
   */
  private async validateRoleAssignment(
    role: TeamRole,
    assignerId: string,
    companyId: string
  ): Promise<void> {
    const assigner = await this.model.findOne({
      where: {
        userId: assignerId,
        companyId,
        status: TeamMemberStatus.ACTIVE
      }
    });

    if (!assigner || assigner.role !== TeamRole.ADMIN) {
      throw new Error('Insufficient permissions to assign role');
    }
  }

  /**
   * Validates role transition rules
   * @param currentRole Current role
   * @param newRole New role
   * @param companyId Company identifier
   */
  private async validateRoleTransition(
    currentRole: TeamRole,
    newRole: TeamRole,
    companyId: string
  ): Promise<void> {
    if (currentRole === TeamRole.ADMIN && newRole !== TeamRole.ADMIN) {
      const adminCount = await this.model.count({
        where: {
          companyId,
          role: TeamRole.ADMIN,
          status: TeamMemberStatus.ACTIVE
        }
      });

      if (adminCount <= 1) {
        throw new Error('Cannot demote last admin');
      }
    }
  }

  /**
   * Validates status transition rules
   * @param currentStatus Current status
   * @param newStatus New status
   * @param companyId Company identifier
   */
  private async validateStatusTransition(
    currentStatus: TeamMemberStatus,
    newStatus: TeamMemberStatus,
    companyId: string
  ): Promise<void> {
    if (
      currentStatus === TeamMemberStatus.ACTIVE &&
      newStatus === TeamMemberStatus.INACTIVE
    ) {
      await this.validateAdminDeletion({ companyId, status: currentStatus });
    }
  }

  /**
   * Validates admin deletion to prevent removing last admin
   * @param teamMember Team member to validate
   */
  private async validateAdminDeletion(
    teamMember: Partial<ITeamMember>
  ): Promise<void> {
    if (teamMember.role === TeamRole.ADMIN) {
      const adminCount = await this.model.count({
        where: {
          companyId: teamMember.companyId,
          role: TeamRole.ADMIN,
          status: TeamMemberStatus.ACTIVE
        }
      });

      if (adminCount <= 1) {
        throw new Error('Cannot delete last admin');
      }
    }
  }
}

export default TeamRepository;