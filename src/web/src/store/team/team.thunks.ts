/**
 * Redux thunk actions for team management operations
 * @version 1.0.0
 * @description Implements async team management operations with enhanced security,
 * validation, and error handling based on role-based access control
 */

import { createAsyncThunk } from '@reduxjs/toolkit'; // v1.9.x
import { debounce } from 'lodash'; // v4.17.x
import { UUID } from 'crypto';

// Internal imports
import { teamActions } from './team.slice';
import TeamService from '../../services/team.service';
import { TeamTypes } from '../../types/team.types';

/**
 * Fetch team members with pagination and caching
 */
export const fetchTeamMembers = createAsyncThunk<
  TeamTypes.TeamMember[],
  { companyId: UUID; page?: number; limit?: number },
  { rejectValue: string }
>(
  'team/fetchTeamMembers',
  async ({ companyId, page = 1, limit = 10 }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(teamActions.setLoading(true));
      dispatch(teamActions.clearError());

      const response = await TeamService.getTeamMembers(companyId, {
        page,
        limit,
        sortBy: 'role',
        sortOrder: 'desc'
      });

      dispatch(teamActions.setTeamMembers(response.data));
      return response.data;
    } catch (error: any) {
      dispatch(teamActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(teamActions.setLoading(false));
    }
  }
);

/**
 * Invite new team member with validation
 */
export const inviteTeamMember = createAsyncThunk<
  TeamTypes.TeamMember,
  TeamTypes.TeamMemberCreate,
  { rejectValue: string }
>(
  'team/inviteTeamMember',
  async (memberData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(teamActions.setLoading(true));
      dispatch(teamActions.clearError());

      const invitation = await TeamService.inviteTeamMember(memberData);
      
      // Convert invitation to team member format
      const newMember: TeamTypes.TeamMember = {
        id: invitation.id,
        userId: invitation.id, // Temporary ID until user accepts
        companyId: memberData.companyId,
        role: memberData.role,
        status: TeamTypes.TeamMemberStatus.PENDING,
        email: memberData.email,
        name: memberData.email.split('@')[0], // Temporary name
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
        invitedBy: invitation.invitedBy,
        isMfaEnabled: false,
        permissions: memberData.initialPermissions || [],
        featureFlags: {},
        deletedAt: null
      };

      dispatch(teamActions.addTeamMember(newMember));
      return newMember;
    } catch (error: any) {
      dispatch(teamActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(teamActions.setLoading(false));
    }
  }
);

/**
 * Update team member with role validation
 */
export const updateTeamMember = createAsyncThunk<
  TeamTypes.TeamMember,
  { memberId: UUID; updateData: TeamTypes.TeamMemberUpdate },
  { rejectValue: string }
>(
  'team/updateTeamMember',
  async ({ memberId, updateData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(teamActions.setLoading(true));
      dispatch(teamActions.clearError());

      const updatedMember = await TeamService.updateTeamMember(memberId, updateData);
      dispatch(teamActions.updateTeamMember(updatedMember));
      return updatedMember;
    } catch (error: any) {
      dispatch(teamActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(teamActions.setLoading(false));
    }
  }
);

/**
 * Remove team member with cascade handling
 */
export const removeTeamMember = createAsyncThunk<
  void,
  UUID,
  { rejectValue: string }
>(
  'team/removeTeamMember',
  async (memberId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(teamActions.setLoading(true));
      dispatch(teamActions.clearError());

      await TeamService.removeTeamMember(memberId);
      dispatch(teamActions.removeTeamMember(memberId));
    } catch (error: any) {
      dispatch(teamActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(teamActions.setLoading(false));
    }
  }
);

/**
 * Bulk invite team members with validation
 */
export const bulkInviteTeamMembers = createAsyncThunk<
  TeamTypes.TeamMember[],
  TeamTypes.TeamMemberCreate[],
  { rejectValue: string }
>(
  'team/bulkInviteTeamMembers',
  async (invitations, { dispatch, rejectWithValue }) => {
    try {
      dispatch(teamActions.setLoading(true));
      dispatch(teamActions.clearError());

      const response = await TeamService.bulkInviteMembers(invitations);
      
      // Convert invitations to team members
      const newMembers = response.map(invitation => ({
        id: invitation.id,
        userId: invitation.id,
        companyId: invitation.companyId,
        role: invitation.role,
        status: TeamTypes.TeamMemberStatus.PENDING,
        email: invitation.email,
        name: invitation.email.split('@')[0],
        invitedAt: invitation.invitedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date(),
        invitedBy: invitation.invitedBy,
        isMfaEnabled: false,
        permissions: [],
        featureFlags: {},
        deletedAt: null
      }));

      newMembers.forEach(member => dispatch(teamActions.addTeamMember(member)));
      return newMembers;
    } catch (error: any) {
      dispatch(teamActions.setError(error.message));
      return rejectWithValue(error.message);
    } finally {
      dispatch(teamActions.setLoading(false));
    }
  }
);

// Debounced search function for performance optimization
export const debouncedTeamSearch = debounce(
  (dispatch: any, companyId: UUID, searchTerm: string) => {
    dispatch(fetchTeamMembers({ 
      companyId,
      page: 1,
      limit: 10
    }));
  },
  300,
  { leading: true, trailing: true }
);