/**
 * @fileoverview Unit tests for TeamService class
 * @version 1.0.0
 */

import { describe, beforeEach, afterEach, test, expect, jest } from '@jest/globals'; // ^29.0.0
import { Container } from 'inversify'; // ^6.0.1
import { Transaction } from 'sequelize'; // ^6.32.x
import { TeamService } from '../../../src/services/team/team.service';
import { TeamRepository } from '../../../src/db/repositories/team.repository';
import { 
  ITeamMember, 
  ITeamMemberCreate, 
  ITeamMemberUpdate,
  TeamRole, 
  TeamMemberStatus 
} from '../../../src/interfaces/team.interface';
import { UUID } from 'crypto';

// Mock the team repository
jest.mock('../../../src/db/repositories/team.repository');

describe('TeamService', () => {
  let container: Container;
  let teamService: TeamService;
  let mockTeamRepository: jest.Mocked<TeamRepository>;
  let mockTransaction: Transaction;

  // Mock data
  const mockTeamMember: ITeamMember = {
    id: '123e4567-e89b-12d3-a456-426614174000' as UUID,
    userId: '123e4567-e89b-12d3-a456-426614174001' as UUID,
    companyId: '123e4567-e89b-12d3-a456-426614174002' as UUID,
    role: TeamRole.ADMIN,
    status: TeamMemberStatus.ACTIVE,
    invitedBy: '123e4567-e89b-12d3-a456-426614174003' as UUID,
    invitedAt: new Date(),
    joinedAt: new Date(),
    lastAccessAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup DI container
    container = new Container();
    mockTeamRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCompany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      beginTransaction: jest.fn()
    } as unknown as jest.Mocked<TeamRepository>;

    // Bind mock repository
    container.bind(TeamRepository).toConstantValue(mockTeamRepository);
    teamService = new TeamService(mockTeamRepository);
    mockTransaction = {} as Transaction;
  });

  describe('createTeamMember', () => {
    test('should create a team member successfully', async () => {
      // Arrange
      const createData: ITeamMemberCreate = {
        userId: mockTeamMember.userId,
        companyId: mockTeamMember.companyId,
        role: TeamRole.MEMBER,
        invitedBy: mockTeamMember.invitedBy
      };
      mockTeamRepository.create.mockResolvedValue(mockTeamMember);

      // Act
      const result = await teamService.createTeamMember(createData, mockTransaction);

      // Assert
      expect(mockTeamRepository.create).toHaveBeenCalledWith(createData, mockTransaction);
      expect(result).toEqual(mockTeamMember);
    });

    test('should throw error when creation fails', async () => {
      // Arrange
      const createData: ITeamMemberCreate = {
        userId: mockTeamMember.userId,
        companyId: mockTeamMember.companyId,
        role: TeamRole.MEMBER,
        invitedBy: mockTeamMember.invitedBy
      };
      const error = new Error('Creation failed');
      mockTeamRepository.create.mockRejectedValue(error);

      // Act & Assert
      await expect(teamService.createTeamMember(createData)).rejects.toThrow(error);
    });
  });

  describe('updateTeamMember', () => {
    test('should update team member successfully', async () => {
      // Arrange
      const updateData: ITeamMemberUpdate = {
        role: TeamRole.MANAGER,
        status: TeamMemberStatus.ACTIVE
      };
      mockTeamRepository.update.mockResolvedValue({ ...mockTeamMember, ...updateData });

      // Act
      const result = await teamService.updateTeamMember(mockTeamMember.id, updateData, mockTransaction);

      // Assert
      expect(mockTeamRepository.update).toHaveBeenCalledWith(mockTeamMember.id, updateData, mockTransaction);
      expect(result.role).toBe(TeamRole.MANAGER);
    });

    test('should throw error when update fails', async () => {
      // Arrange
      const updateData: ITeamMemberUpdate = { role: TeamRole.MANAGER };
      const error = new Error('Update failed');
      mockTeamRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(teamService.updateTeamMember(mockTeamMember.id, updateData)).rejects.toThrow(error);
    });
  });

  describe('getTeamMembers', () => {
    test('should retrieve team members with pagination', async () => {
      // Arrange
      const paginatedResponse = {
        items: [mockTeamMember],
        total: 1,
        page: 1,
        totalPages: 1
      };
      mockTeamRepository.findByCompany.mockResolvedValue(paginatedResponse);

      // Act
      const result = await teamService.getTeamMembers(mockTeamMember.companyId, 1, 10);

      // Assert
      expect(mockTeamRepository.findByCompany).toHaveBeenCalledWith(
        mockTeamMember.companyId,
        expect.objectContaining({ page: 1, limit: 10 })
      );
      expect(result).toEqual(paginatedResponse);
    });

    test('should filter team members by role and status', async () => {
      // Arrange
      const paginatedResponse = {
        items: [mockTeamMember],
        total: 1,
        page: 1,
        totalPages: 1
      };
      mockTeamRepository.findByCompany.mockResolvedValue(paginatedResponse);

      // Act
      const result = await teamService.getTeamMembers(
        mockTeamMember.companyId,
        1,
        10,
        TeamRole.ADMIN,
        TeamMemberStatus.ACTIVE
      );

      // Assert
      expect(mockTeamRepository.findByCompany).toHaveBeenCalledWith(
        mockTeamMember.companyId,
        expect.objectContaining({
          page: 1,
          limit: 10,
          role: TeamRole.ADMIN,
          status: TeamMemberStatus.ACTIVE
        })
      );
      expect(result).toEqual(paginatedResponse);
    });
  });

  describe('removeTeamMember', () => {
    test('should remove team member successfully', async () => {
      // Arrange
      mockTeamRepository.delete.mockResolvedValue(true);

      // Act
      const result = await teamService.removeTeamMember(mockTeamMember.id, mockTransaction);

      // Assert
      expect(mockTeamRepository.delete).toHaveBeenCalledWith(mockTeamMember.id, mockTransaction);
      expect(result).toBe(true);
    });

    test('should throw error when removal fails', async () => {
      // Arrange
      const error = new Error('Removal failed');
      mockTeamRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(teamService.removeTeamMember(mockTeamMember.id)).rejects.toThrow(error);
    });
  });

  describe('updateLastAccess', () => {
    test('should update last access timestamp', async () => {
      // Arrange
      const updatedMember = { 
        ...mockTeamMember, 
        lastAccessAt: new Date() 
      };
      mockTeamRepository.update.mockResolvedValue(updatedMember);

      // Act
      const result = await teamService.updateLastAccess(mockTeamMember.id);

      // Assert
      expect(mockTeamRepository.update).toHaveBeenCalledWith(
        mockTeamMember.id,
        expect.objectContaining({ lastAccessAt: expect.any(Date) })
      );
      expect(result).toEqual(updatedMember);
    });
  });

  describe('validatePermissions', () => {
    test('should validate permissions successfully for admin', async () => {
      // Arrange
      mockTeamRepository.findById.mockResolvedValue(mockTeamMember);

      // Act
      const result = await teamService.validatePermissions(mockTeamMember.id, TeamRole.MANAGER);

      // Assert
      expect(mockTeamRepository.findById).toHaveBeenCalledWith(mockTeamMember.id);
      expect(result).toBe(true);
    });

    test('should return false for insufficient permissions', async () => {
      // Arrange
      const viewerMember = { ...mockTeamMember, role: TeamRole.VIEWER };
      mockTeamRepository.findById.mockResolvedValue(viewerMember);

      // Act
      const result = await teamService.validatePermissions(viewerMember.id, TeamRole.MANAGER);

      // Assert
      expect(result).toBe(false);
    });

    test('should return false for inactive member', async () => {
      // Arrange
      const inactiveMember = { ...mockTeamMember, status: TeamMemberStatus.INACTIVE };
      mockTeamRepository.findById.mockResolvedValue(inactiveMember);

      // Act
      const result = await teamService.validatePermissions(inactiveMember.id, TeamRole.MEMBER);

      // Assert
      expect(result).toBe(false);
    });
  });
});