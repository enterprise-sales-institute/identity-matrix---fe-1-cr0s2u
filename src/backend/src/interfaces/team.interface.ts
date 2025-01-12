/**
 * @fileoverview Team management interfaces and enums for Identity Matrix platform
 * @version 1.0.0
 */

// External imports
import { UUID } from 'crypto'; // v20.0.0+

// Internal imports
import { ICompany } from './company.interface';

/**
 * Hierarchical enumeration of team member roles with distinct permission levels
 * aligned with the platform's authorization matrix.
 */
export enum TeamRole {
  /** Full system access including team management and billing */
  ADMIN = 'ADMIN',
  /** Team and integration management with limited administrative access */
  MANAGER = 'MANAGER',
  /** Standard access for regular team operations */
  MEMBER = 'MEMBER',
  /** Read-only access for limited visibility */
  VIEWER = 'VIEWER'
}

/**
 * Lifecycle states for team member accounts with security implications
 * controlling access and permissions within the system.
 */
export enum TeamMemberStatus {
  /** Full access granted with active credentials */
  ACTIVE = 'ACTIVE',
  /** Awaiting user acceptance of invitation */
  PENDING = 'PENDING',
  /** Access revoked or temporarily suspended */
  INACTIVE = 'INACTIVE'
}

/**
 * Comprehensive interface for team member data with audit and security fields
 * ensuring proper tracking and access control.
 */
export interface ITeamMember {
  /** Unique identifier for the team member record */
  id: UUID;

  /** Associated user identifier */
  userId: UUID;

  /** Associated company identifier */
  companyId: UUID;

  /** Assigned role determining access level */
  role: TeamRole;

  /** Current account status */
  status: TeamMemberStatus;

  /** Identifier of the user who sent the invitation */
  invitedBy: UUID;

  /** Timestamp of invitation creation */
  invitedAt: Date;

  /** Timestamp of invitation acceptance */
  joinedAt: Date;

  /** Timestamp of last system access */
  lastAccessAt: Date;

  /** Record creation timestamp */
  createdAt: Date;

  /** Record last update timestamp */
  updatedAt: Date;
}

/**
 * Interface for secure team member creation with required fields
 * ensuring proper initialization of team member records.
 */
export interface ITeamMemberCreate {
  /** Associated user identifier */
  userId: UUID;

  /** Associated company identifier */
  companyId: UUID;

  /** Initial assigned role */
  role: TeamRole;

  /** Identifier of the inviting user */
  invitedBy: UUID;
}

/**
 * Interface for controlled team member updates with optional fields
 * supporting partial updates while maintaining data integrity.
 */
export interface ITeamMemberUpdate {
  /** Updated role assignment */
  role?: TeamRole;

  /** Updated account status */
  status?: TeamMemberStatus;

  /** Updated last access timestamp */
  lastAccessAt?: Date;
}

/**
 * Interface for secure team invitations with validation fields
 * ensuring proper invitation handling and security.
 */
export interface ITeamInvitation {
  /** Email address of the invitee */
  email: string;

  /** Assigned role for the invitation */
  role: TeamRole;

  /** Associated company identifier */
  companyId: UUID;

  /** Identifier of the inviting user */
  invitedBy: UUID;

  /** Invitation expiration timestamp */
  expiresAt: Date;
}