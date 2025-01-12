import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom/extend-expect';

// Component imports
import TeamTable from './TeamTable';
import { TeamRole, TeamMemberStatus } from '../../../types/team.types';

// Test constants
const TEST_IDS = {
  tableContainer: 'team-table-container',
  loadingSpinner: 'team-table-loading',
  roleSelect: 'team-member-role-select',
  statusToggle: 'team-member-status-toggle',
  removeButton: 'team-member-remove-button',
  sortButton: 'team-table-sort-button',
  searchInput: 'team-table-search-input',
  paginationControls: 'team-table-pagination'
};

// Mock data
const mockTeamMembers = [
  {
    id: 'member-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: TeamRole.ADMIN,
    status: TeamMemberStatus.ACTIVE,
    lastActiveAt: '2023-09-01T10:00:00Z'
  },
  {
    id: 'member-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: TeamRole.MEMBER,
    status: TeamMemberStatus.ACTIVE,
    lastActiveAt: '2023-09-01T09:00:00Z'
  }
];

// Mock handlers
const mockHandlers = {
  onRoleChange: vi.fn(),
  onStatusChange: vi.fn(),
  onRemoveMember: vi.fn()
};

// Test utilities
const renderTeamTable = (props = {}) => {
  const user = userEvent.setup();
  return {
    user,
    ...render(
      <TeamTable
        currentUserRole={TeamRole.ADMIN}
        members={mockTeamMembers}
        {...mockHandlers}
        {...props}
      />
    )
  };
};

describe('TeamTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    test('renders team members with correct data', () => {
      renderTeamTable();

      mockTeamMembers.forEach(member => {
        expect(screen.getByText(member.name)).toBeInTheDocument();
        expect(screen.getByText(member.email)).toBeInTheDocument();
        expect(screen.getByText(member.role)).toBeInTheDocument();
      });
    });

    test('displays loading state correctly', () => {
      renderTeamTable({ loading: true });
      expect(screen.getByText(/loading team members/i)).toBeInTheDocument();
    });

    test('handles empty state appropriately', () => {
      renderTeamTable({ members: [] });
      expect(screen.getByRole('region')).toBeEmptyDOMElement();
    });

    test('applies responsive styles on mobile viewport', () => {
      renderTeamTable({ isMobile: true });
      const container = screen.getByTestId(TEST_IDS.tableContainer);
      expect(container).toHaveStyle({ maxWidth: '100%' });
    });
  });

  describe('Role Management', () => {
    test('allows role changes for authorized users', async () => {
      const { user } = renderTeamTable();
      const roleSelect = screen.getAllByRole('combobox')[0];

      await user.selectOptions(roleSelect, TeamRole.MEMBER);

      expect(mockHandlers.onRoleChange).toHaveBeenCalledWith(
        'member-1',
        TeamRole.MEMBER,
        expect.any(Object)
      );
    });

    test('disables role changes for unauthorized users', () => {
      renderTeamTable({ currentUserRole: TeamRole.MEMBER });
      const roleSelect = screen.getAllByRole('combobox')[0];
      expect(roleSelect).toBeDisabled();
    });

    test('validates role hierarchy restrictions', async () => {
      const { user } = renderTeamTable({ currentUserRole: TeamRole.MANAGER });
      const roleSelect = screen.getAllByRole('combobox')[0];

      await user.selectOptions(roleSelect, TeamRole.ADMIN);
      expect(mockHandlers.onRoleChange).not.toHaveBeenCalled();
    });
  });

  describe('Status Management', () => {
    test('toggles member status correctly', async () => {
      const { user } = renderTeamTable();
      const statusButton = screen.getAllByRole('button', { name: /toggle status/i })[0];

      await user.click(statusButton);

      expect(mockHandlers.onStatusChange).toHaveBeenCalledWith(
        'member-1',
        TeamMemberStatus.SUSPENDED,
        expect.any(Object)
      );
    });

    test('displays correct status indicators', () => {
      renderTeamTable();
      const statusElements = screen.getAllByRole('status');
      expect(statusElements[0]).toHaveAttribute('data-status', 'active');
    });
  });

  describe('Member Removal', () => {
    test('handles member removal with confirmation', async () => {
      const { user } = renderTeamTable();
      const removeButton = screen.getAllByRole('button', { name: /remove/i })[0];

      await user.click(removeButton);
      
      expect(mockHandlers.onRemoveMember).toHaveBeenCalledWith(
        'member-1',
        expect.any(Object)
      );
    });

    test('disables remove button for unauthorized users', () => {
      renderTeamTable({ currentUserRole: TeamRole.MEMBER });
      const removeButton = screen.getAllByRole('button', { name: /remove/i })[0];
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('supports keyboard navigation', async () => {
      const { user } = renderTeamTable();
      const firstRow = screen.getAllByRole('row')[1];

      await user.tab();
      expect(firstRow).toHaveFocus();
    });

    test('provides proper ARIA labels', () => {
      renderTeamTable();
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Team Members');
    });

    test('announces status changes', async () => {
      const { user } = renderTeamTable();
      const statusButton = screen.getAllByRole('button', { name: /toggle status/i })[0];

      await user.click(statusButton);
      expect(screen.getByRole('status')).toHaveTextContent(/suspended/i);
    });
  });

  describe('Performance', () => {
    test('handles large datasets efficiently', () => {
      const largeDataset = Array(100).fill(null).map((_, index) => ({
        ...mockTeamMembers[0],
        id: `member-${index}`,
        name: `Member ${index}`
      }));

      renderTeamTable({ members: largeDataset });
      expect(screen.getAllByRole('row').length).toBeLessThan(largeDataset.length);
    });

    test('implements virtualization correctly', () => {
      const { container } = renderTeamTable();
      const virtualList = container.querySelector('[style*="transform"]');
      expect(virtualList).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error state appropriately', () => {
      renderTeamTable({ error: 'Failed to load team members' });
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    test('retries failed operations', async () => {
      const { user } = renderTeamTable();
      const retryButton = screen.getByRole('button', { name: /retry/i });

      await user.click(retryButton);
      expect(mockHandlers.onRetry).toHaveBeenCalled();
    });
  });
});