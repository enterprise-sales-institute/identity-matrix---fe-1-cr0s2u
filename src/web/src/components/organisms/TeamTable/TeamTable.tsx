import React, { useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// Internal imports
import {
  TableContainer,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  ActionCell
} from './TeamTable.styles';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon/Icon';
import { useTeam } from '../../../hooks/useTeam';

// Types
import { TeamMember, TeamRole, TeamMemberStatus } from '../../../types/team.types';

/**
 * Role hierarchy for permission validation
 */
const ROLE_HIERARCHY = {
  [TeamRole.ADMIN]: 4,
  [TeamRole.MANAGER]: 3,
  [TeamRole.MEMBER]: 2,
  [TeamRole.VIEWER]: 1
};

interface TeamTableProps {
  currentUserRole: TeamRole;
  onRoleChange: (memberId: string, role: TeamRole, audit: { initiator: string; reason: string }) => Promise<void>;
  onStatusChange: (memberId: string, status: TeamMemberStatus, audit: { initiator: string; reason: string }) => Promise<void>;
  onRemoveMember: (memberId: string, audit: { initiator: string; reason: string }) => Promise<void>;
  isMobile?: boolean;
}

interface VirtualRow {
  index: number;
  key: number;
  size: number;
  start: number;
  end: number;
  measureElement: (element: Element | null) => void;
}

/**
 * Enhanced team management table component with security, accessibility, and mobile optimizations
 */
export const TeamTable: React.FC<TeamTableProps> = React.memo(({
  currentUserRole,
  onRoleChange,
  onStatusChange,
  onRemoveMember,
  isMobile = false
}) => {
  // Hooks
  const {
    members,
    loading,
    updateMember,
    removeMember,
    clearError
  } = useTeam();

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);

  /**
   * Virtual list configuration for performance
   */
  const rowVirtualizer = useVirtualizer({
    count: members.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 60,
    overscan: 5
  });

  /**
   * Check if current user can modify target role
   */
  const canModifyRole = useCallback((targetRole: TeamRole): boolean => {
    return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetRole];
  }, [currentUserRole]);

  /**
   * Handle role change with security validation
   */
  const handleRoleChange = useCallback(async (
    member: TeamMember,
    newRole: TeamRole
  ) => {
    if (!canModifyRole(member.role)) {
      return;
    }

    try {
      await onRoleChange(member.id, newRole, {
        initiator: 'current_user_id',
        reason: `Role change from ${member.role} to ${newRole}`
      });

      await updateMember(member.id, { role: newRole });
      clearError();
    } catch (error) {
      console.error('Role change failed:', error);
    }
  }, [onRoleChange, updateMember, canModifyRole, clearError]);

  /**
   * Handle status change with audit logging
   */
  const handleStatusChange = useCallback(async (
    member: TeamMember,
    newStatus: TeamMemberStatus
  ) => {
    try {
      await onStatusChange(member.id, newStatus, {
        initiator: 'current_user_id',
        reason: `Status change from ${member.status} to ${newStatus}`
      });

      await updateMember(member.id, { status: newStatus });
      clearError();
    } catch (error) {
      console.error('Status change failed:', error);
    }
  }, [onStatusChange, updateMember, clearError]);

  /**
   * Handle member removal with security checks
   */
  const handleRemoveMember = useCallback(async (member: TeamMember) => {
    if (!canModifyRole(member.role)) {
      return;
    }

    try {
      await onRemoveMember(member.id, {
        initiator: 'current_user_id',
        reason: 'Member removal requested'
      });

      await removeMember(member.id);
      clearError();
    } catch (error) {
      console.error('Member removal failed:', error);
    }
  }, [onRemoveMember, removeMember, canModifyRole, clearError]);

  /**
   * Render role selection with accessibility
   */
  const renderRoleSelect = useCallback((member: TeamMember) => (
    <select
      value={member.role}
      onChange={(e) => handleRoleChange(member, e.target.value as TeamRole)}
      disabled={!canModifyRole(member.role)}
      aria-label={`Change role for ${member.name}`}
    >
      {Object.values(TeamRole).map((role) => (
        <option key={role} value={role} disabled={!canModifyRole(role)}>
          {role}
        </option>
      ))}
    </select>
  ), [handleRoleChange, canModifyRole]);

  /**
   * Render status indicator with accessibility
   */
  const renderStatus = useCallback((status: TeamMemberStatus) => (
    <span
      data-status={status.toLowerCase()}
      aria-label={`Status: ${status}`}
      role="status"
    >
      {status}
    </span>
  ), []);

  /**
   * Memoized table headers with responsive design
   */
  const tableHeaders = useMemo(() => [
    { id: 'name', label: 'Name' },
    { id: 'email', label: isMobile ? 'Email' : 'Email Address' },
    { id: 'role', label: 'Role' },
    { id: 'status', label: 'Status' },
    { id: 'actions', label: 'Actions' }
  ], [isMobile]);

  return (
    <TableContainer ref={tableRef} role="region" aria-label="Team Members">
      <Table>
        <TableHeader>
          <tr>
            {tableHeaders.map(header => (
              <th key={header.id} scope="col">
                {header.label}
              </th>
            ))}
          </tr>
        </TableHeader>
        <tbody>
          {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualRow) => {
            const member = members[virtualRow.index];
            return (
              <TableRow
                key={member.id}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{renderRoleSelect(member)}</TableCell>
                <TableCell>{renderStatus(member.status)}</TableCell>
                <ActionCell>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleStatusChange(member, 
                      member.status === TeamMemberStatus.ACTIVE ? 
                      TeamMemberStatus.SUSPENDED : TeamMemberStatus.ACTIVE
                    )}
                    ariaLabel={`Toggle status for ${member.name}`}
                  >
                    <Icon 
                      name={member.status === TeamMemberStatus.ACTIVE ? "pause" : "play"}
                      size="small"
                    />
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleRemoveMember(member)}
                    disabled={!canModifyRole(member.role)}
                    ariaLabel={`Remove ${member.name}`}
                  >
                    <Icon name="trash" size="small" />
                  </Button>
                </ActionCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>
      {loading && (
        <div role="status" aria-live="polite">
          Loading team members...
        </div>
      )}
    </TableContainer>
  );
});

TeamTable.displayName = 'TeamTable';

export default TeamTable;