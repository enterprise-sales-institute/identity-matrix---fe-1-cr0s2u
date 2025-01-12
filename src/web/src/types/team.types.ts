/**
 * @fileoverview TypeScript type definitions for team management functionality
 * @version 1.0.0
 */

// External imports
import { UUID } from 'crypto'; // latest

/**
 * Enumeration of possible team member roles with different access levels
 * Based on the authorization matrix for role-based access control
 */
export enum TeamRole {
  ADMIN = 'ADMIN',       // Full access to all features
  MANAGER = 'MANAGER',   // Full access except billing, limited team management
  MEMBER = 'MEMBER',     // Standard access with limited management capabilities
  VIEWER = 'VIEWER'      // Read-only access to permitted features
}

/**
 * Enumeration of possible team member statuses for lifecycle management
 * Tracks the current state of team members and their invitations
 */
export enum TeamMemberStatus {
  ACTIVE = 'ACTIVE',         // Fully active team member
  PENDING = 'PENDING',       // Invitation sent, awaiting acceptance
  INACTIVE = 'INACTIVE',     // Account deactivated but retained
  SUSPENDED = 'SUSPENDED',   // Temporarily disabled access
  EXPIRED = 'EXPIRED'        // Invitation or access period expired
}

/**
 * Interface defining the complete structure of a team member
 * Includes comprehensive tracking and audit fields
 */
export interface TeamMember {
  id: UUID;                          // Unique identifier for the team member
  userId: UUID;                      // Associated user account ID
  companyId: UUID;                   // Company/organization ID
  role: TeamRole;                    // Access role in the team
  status: TeamMemberStatus;          // Current member status
  invitedBy: UUID;                   // ID of the user who sent the invitation
  invitedAt: Date;                   // Timestamp of invitation
  joinedAt: Date;                    // Timestamp of acceptance/activation
  lastActiveAt: Date;                // Last activity timestamp
  email: string;                     // Email address
  name: string;                      // Display name
  avatarUrl?: string;                // Optional profile picture URL
  isMfaEnabled: boolean;             // Multi-factor authentication status
  permissions: string[];             // Granular permission flags
  featureFlags: Record<string, boolean>; // Feature access flags
  createdAt: Date;                   // Record creation timestamp
  updatedAt: Date;                   // Last update timestamp
  deletedAt: Date | null;            // Soft deletion timestamp
}

/**
 * Interface for team member creation payload
 * Defines required and optional fields for creating new team members
 */
export interface TeamMemberCreate {
  email: string;                     // Required email address
  role: TeamRole;                    // Required initial role
  companyId: UUID;                   // Required company association
  welcomeMessage?: string;           // Optional personalized welcome message
  initialPermissions?: string[];     // Optional initial permission set
  sendWelcomeEmail?: boolean;        // Optional welcome email flag
}

/**
 * Interface for team member update operations
 * Supports partial updates with optional fields
 */
export interface TeamMemberUpdate {
  role?: TeamRole;                   // Updated role
  status?: TeamMemberStatus;         // Updated status
  permissions?: string[];            // Updated permissions
  featureFlags?: Record<string, boolean>; // Updated feature flags
  name?: string;                     // Updated display name
  avatarUrl?: string;                // Updated profile picture
}

/**
 * Interface for team invitation tracking
 * Manages pending team member invitations
 */
export interface TeamInvitation {
  id: UUID;                          // Unique invitation identifier
  email: string;                     // Invitee email address
  role: TeamRole;                    // Offered role
  companyId: UUID;                   // Target company
  invitedBy: UUID;                   // Inviter ID
  invitedAt: Date;                   // Invitation timestamp
  expiresAt: Date;                   // Expiration timestamp
  status: TeamMemberStatus;          // Current invitation status
  welcomeMessage?: string;           // Optional welcome message
}

/**
 * Interface for team state management in Redux store
 * Includes loading states and error handling
 */
export interface TeamState {
  members: TeamMember[];             // Current team members
  pendingInvitations: TeamInvitation[]; // Pending invitations
  loading: boolean;                  // Global loading state
  inviting: boolean;                 // Invitation in progress
  updating: boolean;                 // Update in progress
  error: string | null;              // Error message
  validationErrors: Record<string, string>; // Field-level validation errors
}