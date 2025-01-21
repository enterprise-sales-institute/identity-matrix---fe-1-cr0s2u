/**
 * @fileoverview Redux selectors for team state management with memoization and type safety
 * @version 1.0.0
 * @license MIT
 */

import { createSelector } from '@reduxjs/toolkit'; // v1.9.x
import { RootState } from '../index';
import { TeamRole, TeamMemberStatus } from '../../types/team.types';

/**
 * Base selector to access team state slice
 */
export const selectTeamState = (state: RootState) => state.team;

/**
 * Memoized selector to get all team members
 * Optimized for performance with createSelector
 */
export const selectTeamMembers = createSelector(
  [selectTeamState],
  (teamState) => teamState.members
);

/**
 * Memoized selector to get team members filtered by role
 * Used for role-based access control and team management
 */
export const selectTeamMembersByRole = createSelector(
  [selectTeamMembers, (_, role: TeamRole) => role],
  (members, role) => members.filter(member => member.role === role)
);

/**
 * Memoized selector to get team members filtered by status
 * Used for managing active, pending, and inactive members
 */
export const selectTeamMembersByStatus = createSelector(
  [selectTeamMembers, (_, status: TeamMemberStatus) => status],
  (members, status) => members.filter(member => member.status === status)
);

/**
 * Memoized selector to get a specific team member by ID
 * Optimized for individual member lookups
 */
export const selectTeamMemberById = createSelector(
  [selectTeamMembers, (_, memberId: string) => memberId],
  (members, memberId) => members.find(member => member.id === memberId)
);

/**
 * Memoized selector to get active admins
 * Used for validating admin-level operations
 */
export const selectActiveAdmins = createSelector(
  [selectTeamMembers],
  (members) => members.filter(
    member => member.role === TeamRole.ADMIN && 
    member.status === TeamMemberStatus.ACTIVE
  )
);

/**
 * Memoized selector to get pending invitations
 * Used for invitation management and tracking
 */
export const selectPendingInvitations = createSelector(
  [selectTeamState],
  (teamState) => teamState.pendingInvitations
);

/**
 * Memoized selector to get loading state
 * Used for UI loading indicators
 */
export const selectTeamLoading = createSelector(
  [selectTeamState],
  (teamState) => teamState.loading
);

/**
 * Memoized selector to get invitation loading state
 * Used for invitation-specific loading indicators
 */
export const selectTeamInviting = createSelector(
  [selectTeamState],
  (teamState) => teamState.inviting
);

/**
 * Memoized selector to get update loading state
 * Used for update-specific loading indicators
 */
export const selectTeamUpdating = createSelector(
  [selectTeamState],
  (teamState) => teamState.updating
);

/**
 * Memoized selector to get error state
 * Used for error handling and display
 */
export const selectTeamError = createSelector(
  [selectTeamState],
  (teamState) => teamState.error
);

/**
 * Memoized selector to get validation errors
 * Used for form validation and error display
 */
export const selectTeamValidationErrors = createSelector(
  [selectTeamState],
  (teamState) => teamState.validationErrors
);

/**
 * Memoized selector to check if there are any active operations
 * Used for preventing concurrent operations
 */
export const selectHasActiveOperations = createSelector(
  [selectTeamState],
  (teamState) => teamState.loading || teamState.inviting || teamState.updating
);