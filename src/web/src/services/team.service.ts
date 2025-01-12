/**
 * Team Management Service
 * @version 1.0.0
 * @description Service class that handles team management operations with enhanced security,
 * validation, and error handling based on role-based access control
 */

// External imports
import { AxiosResponse } from 'axios'; // axios@1.x

// Internal imports
import ApiService from './api.service';
import { API_ENDPOINTS } from '../constants/api.constants';
import { TeamMember, TeamMemberCreate, TeamMemberUpdate, TeamRole, TeamMemberStatus, TeamInvitation } from '../types/team.types';
import { UUID } from 'crypto';

/**
 * Interface for pagination options
 */
interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for paginated response
 */
interface PaginatedResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Enhanced team service with comprehensive security and validation
 */
export class TeamService {
  private readonly apiInstance = ApiService.instance;
  private readonly requestTimeout: number;
  private readonly retryAttempts: number;
  private readonly endpoints = API_ENDPOINTS.TEAM;

  constructor(timeout: number = 5000, retries: number = 3) {
    this.requestTimeout = timeout;
    this.retryAttempts = retries;
  }

  /**
   * Retrieve paginated team members with enhanced filtering
   */
  public async getTeamMembers(
    companyId: UUID,
    options: PaginationOptions
  ): Promise<PaginatedResponse<TeamMember[]>> {
    try {
      const response: AxiosResponse<PaginatedResponse<TeamMember[]>> = await this.apiInstance.get(
        this.endpoints.BASE,
        {
          params: {
            companyId,
            ...options
          },
          timeout: this.requestTimeout
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch team members', error);
    }
  }

  /**
   * Invite new team member with enhanced validation
   */
  public async inviteTeamMember(memberData: TeamMemberCreate): Promise<TeamInvitation> {
    this.validateInvitation(memberData);

    try {
      const response: AxiosResponse<TeamInvitation> = await this.apiInstance.post(
        this.endpoints.INVITE,
        memberData,
        {
          timeout: this.requestTimeout
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError('Failed to invite team member', error);
    }
  }

  /**
   * Update team member with role transition validation
   */
  public async updateTeamMember(
    memberId: UUID,
    updateData: TeamMemberUpdate
  ): Promise<TeamMember> {
    this.validateUpdate(updateData);

    try {
      const response: AxiosResponse<TeamMember> = await this.apiInstance.patch(
        `${this.endpoints.BY_ID.replace(':id', memberId.toString())}`,
        updateData,
        {
          timeout: this.requestTimeout
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError('Failed to update team member', error);
    }
  }

  /**
   * Remove team member with cascade deletion
   */
  public async removeTeamMember(memberId: UUID): Promise<void> {
    try {
      await this.apiInstance.delete(
        `${this.endpoints.BY_ID.replace(':id', memberId.toString())}`,
        {
          timeout: this.requestTimeout
        }
      );
    } catch (error) {
      throw this.handleError('Failed to remove team member', error);
    }
  }

  /**
   * Bulk invite team members with validation
   */
  public async bulkInviteMembers(
    invitations: TeamMemberCreate[]
  ): Promise<TeamInvitation[]> {
    invitations.forEach(this.validateInvitation);

    try {
      const response: AxiosResponse<TeamInvitation[]> = await this.apiInstance.post(
        this.endpoints.BULK_INVITE,
        { invitations },
        {
          timeout: this.requestTimeout * 2 // Extended timeout for bulk operation
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError('Failed to bulk invite team members', error);
    }
  }

  /**
   * Get team member roles and permissions
   */
  public async getTeamRoles(): Promise<Record<TeamRole, string[]>> {
    try {
      const response: AxiosResponse<Record<TeamRole, string[]>> = await this.apiInstance.get(
        this.endpoints.ROLES,
        {
          timeout: this.requestTimeout
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError('Failed to fetch team roles', error);
    }
  }

  /**
   * Validate team member invitation data
   */
  private validateInvitation(data: TeamMemberCreate): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Invalid email address');
    }

    if (!Object.values(TeamRole).includes(data.role)) {
      throw new Error('Invalid team role');
    }

    if (data.initialPermissions) {
      this.validatePermissions(data.initialPermissions);
    }
  }

  /**
   * Validate team member update data
   */
  private validateUpdate(data: TeamMemberUpdate): void {
    if (data.role && !Object.values(TeamRole).includes(data.role)) {
      throw new Error('Invalid team role');
    }

    if (data.status && !Object.values(TeamMemberStatus).includes(data.status)) {
      throw new Error('Invalid status');
    }

    if (data.permissions) {
      this.validatePermissions(data.permissions);
    }
  }

  /**
   * Validate permissions array
   */
  private validatePermissions(permissions: string[]): void {
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }

    // Add additional permission validation logic here
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Enhanced error handling with context
   */
  private handleError(context: string, error: any): never {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(`${context}: ${errorMessage}`);
  }
}

// Export singleton instance
export default new TeamService();