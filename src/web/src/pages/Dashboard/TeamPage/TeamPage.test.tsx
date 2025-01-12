import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import ResizeObserver from 'resize-observer-polyfill';

// Component under test
import TeamPage from './TeamPage';

// Hooks
import { useTeam } from '../../../hooks/useTeam';
import { useWebSocket } from '../../../hooks/useWebSocket';

// Types
import { TeamRole, TeamMemberStatus } from '../../../types/team.types';

// Mock implementations
jest.mock('../../../hooks/useTeam');
jest.mock('../../../hooks/useWebSocket');

// Mock ResizeObserver
global.ResizeObserver = ResizeObserver;

// Test data
const mockTeamMembers = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: TeamRole.ADMIN,
    status: TeamMemberStatus.ACTIVE,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'Manager User',
    role: TeamRole.MANAGER,
    status: TeamMemberStatus.ACTIVE,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('TeamPage', () => {
  // Setup before each test
  beforeEach(() => {
    // Mock useTeam hook
    (useTeam as jest.Mock).mockReturnValue({
      members: mockTeamMembers,
      loading: false,
      error: null,
      inviteTeamMember: jest.fn(),
      updateMemberRole: jest.fn(),
      removeMember: jest.fn(),
      clearError: jest.fn()
    });

    // Mock useWebSocket hook
    (useWebSocket as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    });
  });

  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without errors', () => {
      render(<TeamPage />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Team Management')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      (useTeam as jest.Mock).mockReturnValue({
        ...useTeam(),
        loading: true
      });

      render(<TeamPage />);
      expect(screen.getByText('Loading team members...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorMessage = 'Failed to load team members';
      (useTeam as jest.Mock).mockReturnValue({
        ...useTeam(),
        error: errorMessage
      });

      render(<TeamPage />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render team members table', () => {
      render(<TeamPage />);
      mockTeamMembers.forEach(member => {
        expect(screen.getByText(member.name)).toBeInTheDocument();
        expect(screen.getByText(member.email)).toBeInTheDocument();
      });
    });
  });

  describe('Team Operations', () => {
    it('should handle role changes', async () => {
      const { updateMemberRole } = useTeam();
      render(<TeamPage />);

      const roleSelect = screen.getAllByRole('combobox')[0];
      await userEvent.selectOptions(roleSelect, TeamRole.MANAGER);

      expect(updateMemberRole).toHaveBeenCalledWith(
        mockTeamMembers[0].id,
        TeamRole.MANAGER,
        expect.any(Object)
      );
    });

    it('should handle member removal', async () => {
      const { removeMember } = useTeam();
      render(<TeamPage />);

      const removeButton = screen.getAllByRole('button', { name: /remove/i })[0];
      await userEvent.click(removeButton);

      expect(removeMember).toHaveBeenCalledWith(
        mockTeamMembers[0].id,
        expect.any(Object)
      );
    });

    it('should handle status changes', async () => {
      const { updateMemberRole } = useTeam();
      render(<TeamPage />);

      const statusToggle = screen.getAllByRole('button', { name: /toggle status/i })[0];
      await userEvent.click(statusToggle);

      expect(updateMemberRole).toHaveBeenCalledWith(
        mockTeamMembers[0].id,
        expect.objectContaining({ status: TeamMemberStatus.SUSPENDED }),
        expect.any(Object)
      );
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to team updates on mount', () => {
      const { subscribe } = useWebSocket();
      render(<TeamPage />);
      
      expect(subscribe).toHaveBeenCalledWith(
        'team:updates',
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should update team member list on real-time update', async () => {
      const { subscribe } = useWebSocket();
      render(<TeamPage />);

      const updateCallback = subscribe.mock.calls[0][1];
      const newMember = {
        ...mockTeamMembers[0],
        id: '3',
        name: 'New Member'
      };

      act(() => {
        updateCallback({ type: 'member:add', data: newMember });
      });

      await waitFor(() => {
        expect(screen.getByText('New Member')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<TeamPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', () => {
      render(<TeamPage />);
      const firstRow = screen.getAllByRole('row')[1];
      
      firstRow.focus();
      expect(document.activeElement).toBe(firstRow);
      
      fireEvent.keyDown(firstRow, { key: 'Tab' });
      expect(document.activeElement).toBe(
        within(firstRow).getByRole('combobox')
      );
    });

    it('should have proper ARIA labels', () => {
      render(<TeamPage />);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Team Management');
      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Team Members');
    });
  });

  describe('Responsive Design', () => {
    it('should adjust layout for mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<TeamPage />);
      
      expect(screen.getByRole('main')).toHaveStyle({
        padding: expect.stringContaining('8px')
      });
    });

    it('should handle table overflow on small screens', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      render(<TeamPage />);
      
      const tableContainer = screen.getByRole('region');
      expect(tableContainer).toHaveStyle({
        overflowX: 'auto'
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error boundary fallback on error', () => {
      const error = new Error('Test error');
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TeamPage />,
        {
          wrapper: ({ children }) => (
            <ErrorBoundary fallback={<div>Error: {error.message}</div>}>
              {children}
            </ErrorBoundary>
          )
        }
      );

      act(() => {
        throw error;
      });

      expect(screen.getByText(`Error: ${error.message}`)).toBeInTheDocument();
    });

    it('should clear errors on unmount', () => {
      const { clearError } = useTeam();
      const { unmount } = render(<TeamPage />);
      
      unmount();
      
      expect(clearError).toHaveBeenCalled();
    });
  });
});