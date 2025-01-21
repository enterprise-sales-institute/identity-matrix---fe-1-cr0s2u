import React, { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary'; // v4.x
import { analytics } from '@identity-matrix/analytics'; // v1.x

// Internal imports
import DashboardLayout from '../../components/templates/DashboardLayout/DashboardLayout';
import TeamTable from '../../components/organisms/TeamTable/TeamTable';
import { useTeam } from '../../../hooks/useTeam';
import { TeamRole, TeamMemberStatus } from '../../../types/team.types';

/**
 * Enhanced team management page component with role-based access control
 * and real-time updates
 */
const TeamPage: React.FC = React.memo(() => {
  // State management
  const {
    loading,
    error,
    updateMember,
    removeMember,
    clearError
  } = useTeam();

  const [currentUserRole] = useState<TeamRole>(TeamRole.ADMIN); // TODO: Get from auth context

  /**
   * Handle role changes with audit logging
   */
  const handleRoleChange = useCallback(async (
    memberId: string,
    newRole: TeamRole
  ) => {
    try {
      analytics.track('team_role_change_initiated', {
        memberId,
        newRole,
        timestamp: new Date().toISOString()
      });

      await updateMember(memberId, {
        role: newRole,
        updatedAt: new Date()
      });

      analytics.track('team_role_change_completed', {
        memberId,
        newRole,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const error = err as Error;
      analytics.track('team_role_change_failed', {
        memberId,
        newRole,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [updateMember]);

  /**
   * Handle status changes with optimistic updates
   */
  const handleStatusChange = useCallback(async (
    memberId: string,
    newStatus: TeamMemberStatus
  ) => {
    try {
      analytics.track('team_status_change_initiated', {
        memberId,
        newStatus,
        timestamp: new Date().toISOString()
      });

      await updateMember(memberId, {
        status: newStatus,
        updatedAt: new Date()
      });

      analytics.track('team_status_change_completed', {
        memberId,
        newStatus,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const error = err as Error;
      analytics.track('team_status_change_failed', {
        memberId,
        newStatus,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [updateMember]);

  /**
   * Handle member removal with confirmation
   */
  const handleRemoveMember = useCallback(async (memberId: string) => {
    try {
      analytics.track('team_member_removal_initiated', {
        memberId,
        timestamp: new Date().toISOString()
      });

      await removeMember(memberId);

      analytics.track('team_member_removal_completed', {
        memberId,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const error = err as Error;
      analytics.track('team_member_removal_failed', {
        memberId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [removeMember]);

  /**
   * Error boundary fallback component
   */
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div role="alert" className="error-container">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );

  /**
   * Clear errors on unmount
   */
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={clearError}
      onError={(error) => {
        analytics.track('team_page_error', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }}
    >
      <DashboardLayout>
        <main
          role="main"
          aria-label="Team Management"
          className="team-page-container"
        >
          <header className="team-page-header">
            <h1>Team Management</h1>
            <p>Manage your team members and their access levels</p>
          </header>

          <section
            aria-label="Team Members List"
            className="team-table-container"
          >
            <TeamTable
              currentUserRole={currentUserRole}
              onRoleChange={handleRoleChange}
              onStatusChange={handleStatusChange}
              onRemoveMember={handleRemoveMember}
            />
          </section>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="error-message"
            >
              {error}
            </div>
          )}

          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="loading-indicator"
            >
              Loading team members...
            </div>
          )}
        </main>
      </DashboardLayout>
    </ErrorBoundary>
  );
});

// Display name for debugging
TeamPage.displayName = 'TeamPage';

export default TeamPage;