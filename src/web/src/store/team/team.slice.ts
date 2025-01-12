/**
 * @fileoverview Redux slice for team management with role-based access control
 * @version 1.0.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'; // v1.9.x
import { 
  TeamState, 
  TeamMember, 
  TeamRole, 
  TeamMemberStatus 
} from '../../types/team.types';

/**
 * Initial state for team management
 */
const initialState: TeamState = {
  members: [],
  pendingInvitations: [],
  loading: false,
  inviting: false,
  updating: false,
  error: null,
  validationErrors: {}
};

/**
 * Role hierarchy for permission validation
 */
const ROLE_HIERARCHY = {
  [TeamRole.ADMIN]: 4,
  [TeamRole.MANAGER]: 3,
  [TeamRole.MEMBER]: 2,
  [TeamRole.VIEWER]: 1
};

/**
 * Team management slice with enhanced validation and security
 */
const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
      // Sort members by role hierarchy and last active timestamp
      const sortedMembers = [...action.payload].sort((a, b) => {
        const roleComparison = ROLE_HIERARCHY[b.role] - ROLE_HIERARCHY[a.role];
        return roleComparison !== 0 ? roleComparison : 
          new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
      });

      state.members = sortedMembers;
      state.loading = false;
      state.error = null;
      state.validationErrors = {};
    },

    addTeamMember: (state, action: PayloadAction<TeamMember>) => {
      const newMember = action.payload;

      // Validate member role and permissions
      if (!Object.values(TeamRole).includes(newMember.role)) {
        state.validationErrors.role = 'Invalid team role specified';
        return;
      }

      // Check for existing member
      if (state.members.some(member => member.email === newMember.email)) {
        state.validationErrors.email = 'Team member already exists';
        return;
      }

      // Add member with initial pending status
      const memberWithStatus = {
        ...newMember,
        status: TeamMemberStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      state.members.push(memberWithStatus);
      state.validationErrors = {};
    },

    updateTeamMember: (state, action: PayloadAction<TeamMember>) => {
      const updatedMember = action.payload;
      const memberIndex = state.members.findIndex(m => m.id === updatedMember.id);

      if (memberIndex === -1) {
        state.error = 'Team member not found';
        return;
      }

      // Validate role change permissions
      const currentMember = state.members[memberIndex];
      if (currentMember.role === TeamRole.ADMIN && updatedMember.role !== TeamRole.ADMIN) {
        // Ensure at least one admin remains
        const remainingAdmins = state.members.filter(
          m => m.id !== updatedMember.id && m.role === TeamRole.ADMIN
        );
        if (remainingAdmins.length === 0) {
          state.validationErrors.role = 'Cannot remove last admin';
          return;
        }
      }

      state.members[memberIndex] = {
        ...updatedMember,
        updatedAt: new Date()
      };
      state.validationErrors = {};
    },

    removeTeamMember: (state, action: PayloadAction<string>) => {
      const memberId = action.payload;
      const memberIndex = state.members.findIndex(m => m.id === memberId);

      if (memberIndex === -1) {
        state.error = 'Team member not found';
        return;
      }

      // Validate removal permissions
      const memberToRemove = state.members[memberIndex];
      if (memberToRemove.role === TeamRole.ADMIN) {
        const remainingAdmins = state.members.filter(
          m => m.id !== memberId && m.role === TeamRole.ADMIN
        );
        if (remainingAdmins.length === 0) {
          state.validationErrors.role = 'Cannot remove last admin';
          return;
        }
      }

      // Soft delete by updating status
      state.members[memberIndex] = {
        ...memberToRemove,
        status: TeamMemberStatus.INACTIVE,
        deletedAt: new Date(),
        updatedAt: new Date()
      };
      state.validationErrors = {};
    },

    setValidationError: (state, action: PayloadAction<Record<string, string>>) => {
      state.validationErrors = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setInviting: (state, action: PayloadAction<boolean>) => {
      state.inviting = action.payload;
    },

    setUpdating: (state, action: PayloadAction<boolean>) => {
      state.updating = action.payload;
    },

    clearErrors: (state) => {
      state.error = null;
      state.validationErrors = {};
    }
  }
});

// Export actions and reducer
export const teamActions = teamSlice.actions;
export default teamSlice.reducer;