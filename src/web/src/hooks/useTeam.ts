/**
 * @fileoverview Enhanced React hook for secure team management operations
 * @version 1.0.0
 * @description Provides secure team management functionality with role-based access control,
 * real-time updates, and comprehensive error handling
 */

// External imports - versions specified in package.json
import { useEffect, useCallback } from 'react'; // react@18.x
import { useDispatch, useSelector } from 'react-redux'; // react-redux@8.x
import debounce from 'lodash/debounce'; // lodash@4.x

// Internal imports
import TeamService from '../services/team.service';
import { teamActions } from '../store/team/team.slice';
import {
  TeamInvitation,
  TeamMemberUpdate,
  TeamState
} from '../types/team.types';

// Constants
const DEBOUNCE_DELAY = 300; // milliseconds
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Custom error type for team operations
 */
interface TeamOperationError {
  code: string;
  message: string;
  field?: string;
}

/**
 * Type for team operation types
 */
type TeamOperationType = 'fetch' | 'invite' | 'update' | 'remove';

/**
 * Enhanced hook for secure team management
 */
export const useTeam = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const members = useSelector((state: { team: TeamState }) => state.team.members);
  const loading = useSelector((state: { team: TeamState }) => state.team.loading);
  const error = useSelector((state: { team: TeamState }) => state.team.error);
  const validationErrors = useSelector((state: { team: TeamState }) => state.team.validationErrors);

  /**
   * Fetch team members with error handling and retry logic
   */
  const fetchTeamMembers = useCallback(async () => {
    let retryCount = 0;
    const fetchWithRetry = async (): Promise<void> => {
      try {
        dispatch(teamActions.setLoading(true));
        const response = await TeamService.getTeamMembers();
        dispatch(teamActions.setTeamMembers(response.data));
      } catch (error: any) {
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return fetchWithRetry();
        }
        dispatch(teamActions.setValidationError({
          general: error.message
        }));
      } finally {
        dispatch(teamActions.setLoading(false));
      }
    };

    await fetchWithRetry();
  }, [dispatch]);

  /**
   * Invite new team member with role validation
   */
  const inviteMember = useCallback(async (invitation: TeamInvitation) => {
    try {
      dispatch(teamActions.setInviting(true));
      
      // Validate role permissions
      await TeamService.validateTeamOperation('invite', invitation.role);
      
      const response = await TeamService.inviteTeamMember(invitation);
      dispatch(teamActions.addTeamMember(response));
      
    } catch (error: any) {
      dispatch(teamActions.setValidationError({
        invite: error.message
      }));
    } finally {
      dispatch(teamActions.setInviting(false));
    }
  }, [dispatch]);

  /**
   * Update team member with role transition validation
   */
  const updateMember = useCallback(async (
    memberId: string,
    update: TeamMemberUpdate
  ) => {
    try {
      dispatch(teamActions.setUpdating(true));
      
      // Validate role change permissions
      if (update.role) {
        await TeamService.validateTeamOperation('update', update.role);
      }
      
      const response = await TeamService.updateTeamMember(memberId, update);
      dispatch(teamActions.updateTeamMember(response));
      
    } catch (error: any) {
      dispatch(teamActions.setValidationError({
        update: error.message
      }));
    } finally {
      dispatch(teamActions.setUpdating(false));
    }
  }, [dispatch]);

  /**
   * Remove team member with cascade validation
   */
  const removeMember = useCallback(async (memberId: string) => {
    try {
      dispatch(teamActions.setUpdating(true));
      
      // Validate removal permissions
      await TeamService.validateTeamOperation('remove', memberId);
      
      await TeamService.removeTeamMember(memberId);
      dispatch(teamActions.removeTeamMember(memberId));
      
    } catch (error: any) {
      dispatch(teamActions.setValidationError({
        remove: error.message
      }));
    } finally {
      dispatch(teamActions.setUpdating(false));
    }
  }, [dispatch]);

  /**
   * Retry failed operation with exponential backoff
   */
  const retryOperation = useCallback(async (operationType: TeamOperationType) => {
    dispatch(teamActions.clearErrors());
    switch (operationType) {
      case 'fetch':
        await fetchTeamMembers();
        break;
      case 'invite':
        // Retry logic for pending invitations
        break;
      case 'update':
        // Retry logic for pending updates
        break;
      case 'remove':
        // Retry logic for pending removals
        break;
    }
  }, [fetchTeamMembers]);

  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    dispatch(teamActions.clearErrors());
  }, [dispatch]);

  // Debounced operations for performance
  const debouncedUpdate = useCallback(
    debounce(updateMember, DEBOUNCE_DELAY),
    [updateMember]
  );

  // Initialize team data and cleanup
  useEffect(() => {
    fetchTeamMembers();

    return () => {
      clearError();
    };
  }, [fetchTeamMembers, clearError]);

  return {
    members,
    loading,
    error,
    validationErrors,
    fetchTeamMembers,
    inviteMember,
    updateMember: debouncedUpdate,
    removeMember,
    retryOperation,
    clearError
  };
};

export type { TeamOperationError, TeamOperationType };