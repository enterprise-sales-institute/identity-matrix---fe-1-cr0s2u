/**
 * @fileoverview Team validation schemas and functions for Identity Matrix platform
 * @version 1.0.0
 * 
 * Implements comprehensive validation for team-related operations with
 * enhanced security controls and detailed error handling.
 */

import { object, string } from 'yup'; // v1.0.0
import { 
  TeamRole, 
  TeamMemberStatus, 
  ITeamMemberCreate, 
  ITeamMemberUpdate, 
  ITeamInvitation 
} from '../../interfaces/team.interface';
import { validateEmail, validateSchema } from '../../utils/validation.util';

// Constants for validation rules
const TEAM_MEMBER_ROLES = Object.values(TeamRole);
const TEAM_MEMBER_STATUSES = Object.values(TeamMemberStatus);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Yup schema for team invitation validation with enhanced security controls
 */
export const teamInvitationSchema = object({
  email: string()
    .required('Email address is required')
    .trim()
    .lowercase()
    .test('email', 'Invalid email format', validateEmail),

  role: string()
    .required('Team member role is required')
    .trim()
    .oneOf(TEAM_MEMBER_ROLES, 'Invalid team role')
    .default(TeamRole.MEMBER),

  companyId: string()
    .required('Company ID is required')
    .matches(UUID_REGEX, 'Invalid company ID format'),

  invitedBy: string()
    .required('Inviter ID is required')
    .matches(UUID_REGEX, 'Invalid inviter ID format')
}).strict();

/**
 * Yup schema for team member updates with role transition validation
 */
export const teamMemberUpdateSchema = object({
  role: string()
    .optional()
    .trim()
    .oneOf(TEAM_MEMBER_ROLES, 'Invalid team role'),

  status: string()
    .optional()
    .trim()
    .oneOf(TEAM_MEMBER_STATUSES, 'Invalid member status')
    .test('status-transition', 'Invalid status transition', function(value) {
      if (!value) return true;
      const currentStatus = this.parent.currentStatus;
      
      // Validate status transitions
      const allowedTransitions: Record<TeamMemberStatus, TeamMemberStatus[]> = {
        [TeamMemberStatus.PENDING]: [TeamMemberStatus.ACTIVE, TeamMemberStatus.INACTIVE],
        [TeamMemberStatus.ACTIVE]: [TeamMemberStatus.INACTIVE],
        [TeamMemberStatus.INACTIVE]: [TeamMemberStatus.ACTIVE]
      };

      return currentStatus && allowedTransitions[currentStatus]?.includes(value as TeamMemberStatus);
    })
}).strict();

/**
 * Validates and sanitizes team invitation request payload
 * @param invitationData - Raw invitation data to validate
 * @returns Validated and sanitized invitation data
 */
export async function validateTeamInvitation(
  invitationData: Partial<ITeamInvitation>
): Promise<ITeamInvitation> {
  try {
    // Sanitize input data
    const sanitizedData = {
      email: invitationData.email?.trim().toLowerCase(),
      role: invitationData.role?.trim(),
      companyId: invitationData.companyId,
      invitedBy: invitationData.invitedBy
    };

    // Validate against schema
    const validatedData = await teamInvitationSchema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true
    });

    return {
      ...validatedData,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Team invitation validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validates and sanitizes team member update request payload
 * @param updateData - Raw update data to validate
 * @returns Validated and sanitized update data
 */
export async function validateTeamMemberUpdate(
  updateData: Partial<ITeamMemberUpdate>
): Promise<ITeamMemberUpdate> {
  try {
    // Sanitize input data
    const sanitizedData = {
      role: updateData.role?.trim(),
      status: updateData.status?.trim(),
      currentStatus: updateData.status // For transition validation
    };

    // Validate against schema
    const validatedData = await teamMemberUpdateSchema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true
    });

    // Remove helper fields
    delete (validatedData as any).currentStatus;

    // Add lastAccessAt if status is being updated to ACTIVE
    if (validatedData.status === TeamMemberStatus.ACTIVE) {
      validatedData.lastAccessAt = new Date();
    }

    return validatedData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Team member update validation failed: ${error.message}`);
    }
    throw error;
  }
}