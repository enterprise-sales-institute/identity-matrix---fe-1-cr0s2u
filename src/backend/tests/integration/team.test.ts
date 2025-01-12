/**
 * @fileoverview Integration tests for team management functionality
 * @version 1.0.0
 */

import { describe, it, beforeEach, afterEach, expect } from 'jest'; // ^29.0.0
import { Container } from 'inversify'; // ^6.0.1
import { v4 as uuidv4 } from 'uuid'; // ^9.0.0

import { TeamService } from '../../src/services/team/team.service';
import { TeamRepository } from '../../src/db/repositories/team.repository';
import { 
  ITeamMember, 
  TeamRole, 
  TeamMemberStatus 
} from '../../src/interfaces/team.interface';

/**
 * Configures test container with required service bindings
 */
const setupTestContainer = (): Container => {
  const container = new Container();
  container.bind<TeamRepository>(TeamRepository).toSelf().inSingletonScope();
  container.bind<TeamService>(TeamService).toSelf().inRequestScope();
  return container;
};

/**
 * Creates test team member data with specified role and status
 */
const createTestTeamMember = (
  role: TeamRole = TeamRole.MEMBER,
  status: TeamMemberStatus = TeamMemberStatus.ACTIVE
): ITeamMember => ({
  id: uuidv4(),
  userId: uuidv4(),
  companyId: uuidv4(),
  role,
  status,
  invitedBy: uuidv4(),
  invitedAt: new Date(),
  joinedAt: new Date(),
  lastAccessAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

describe('TeamService Integration Tests', () => {
  let container: Container;
  let teamService: TeamService;
  let teamRepository: TeamRepository;

  beforeEach(async () => {
    container = setupTestContainer();
    teamService = container.get<TeamService>(TeamService);
    teamRepository = container.get<TeamRepository>(TeamRepository);
    await teamRepository.model.sync({ force: true });
  });

  afterEach(async () => {
    await teamRepository.model.destroy({ where: {}, truncate: true });
    container.unbindAll();
  });

  describe('Team Member Creation', () => {
    it('should create a team member with valid data', async () => {
      const testData = {
        userId: uuidv4(),
        companyId: uuidv4(),
        role: TeamRole.MEMBER,
        invitedBy: uuidv4()
      };

      const result = await teamService.createTeamMember(testData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(testData.userId);
      expect(result.companyId).toBe(testData.companyId);
      expect(result.role).toBe(TeamRole.MEMBER);
      expect(result.status).toBe(TeamMemberStatus.PENDING);
    });

    it('should enforce role-based creation restrictions', async () => {
      const testData = {
        userId: uuidv4(),
        companyId: uuidv4(),
        role: TeamRole.ADMIN,
        invitedBy: uuidv4()
      };

      await expect(teamService.createTeamMember(testData))
        .rejects
        .toThrow('Insufficient permissions to assign role');
    });

    it('should prevent duplicate team members', async () => {
      const testData = {
        userId: uuidv4(),
        companyId: uuidv4(),
        role: TeamRole.MEMBER,
        invitedBy: uuidv4()
      };

      await teamService.createTeamMember(testData);
      await expect(teamService.createTeamMember(testData))
        .rejects
        .toThrow();
    });
  });

  describe('Team Member Retrieval', () => {
    it('should retrieve team member by ID', async () => {
      const testMember = createTestTeamMember();
      await teamRepository.create(testMember);

      const result = await teamService.getTeamMember(testMember.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(testMember.id);
      expect(result.role).toBe(testMember.role);
    });

    it('should retrieve company team members with pagination', async () => {
      const companyId = uuidv4();
      const members = Array.from({ length: 5 }, () => 
        createTestTeamMember(TeamRole.MEMBER, TeamMemberStatus.ACTIVE));
      
      members.forEach(member => member.companyId = companyId);
      await Promise.all(members.map(member => teamRepository.create(member)));

      const result = await teamService.getTeamMembers(companyId, 1, 3);

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(2);
    });

    it('should filter team members by role and status', async () => {
      const companyId = uuidv4();
      await Promise.all([
        teamRepository.create(createTestTeamMember(TeamRole.ADMIN, TeamMemberStatus.ACTIVE)),
        teamRepository.create(createTestTeamMember(TeamRole.MEMBER, TeamMemberStatus.ACTIVE)),
        teamRepository.create(createTestTeamMember(TeamRole.MEMBER, TeamMemberStatus.PENDING))
      ].map(member => ({ ...member, companyId })));

      const result = await teamService.getTeamMembers(
        companyId,
        1,
        10,
        TeamRole.MEMBER,
        TeamMemberStatus.ACTIVE
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role).toBe(TeamRole.MEMBER);
      expect(result.items[0].status).toBe(TeamMemberStatus.ACTIVE);
    });
  });

  describe('Team Member Updates', () => {
    it('should update team member role with proper validation', async () => {
      const testMember = createTestTeamMember(TeamRole.MEMBER);
      await teamRepository.create(testMember);

      const result = await teamService.updateTeamMember(
        testMember.id,
        { role: TeamRole.MANAGER }
      );

      expect(result.role).toBe(TeamRole.MANAGER);
      expect(result.updatedAt).not.toBe(testMember.updatedAt);
    });

    it('should prevent demoting last admin', async () => {
      const testMember = createTestTeamMember(TeamRole.ADMIN);
      await teamRepository.create(testMember);

      await expect(teamService.updateTeamMember(
        testMember.id,
        { role: TeamRole.MEMBER }
      )).rejects.toThrow('Cannot demote last admin');
    });

    it('should update member status with proper validation', async () => {
      const testMember = createTestTeamMember(TeamRole.MEMBER);
      await teamRepository.create(testMember);

      const result = await teamService.updateTeamMember(
        testMember.id,
        { status: TeamMemberStatus.INACTIVE }
      );

      expect(result.status).toBe(TeamMemberStatus.INACTIVE);
    });
  });

  describe('Team Member Removal', () => {
    it('should remove team member with proper validation', async () => {
      const testMember = createTestTeamMember(TeamRole.MEMBER);
      await teamRepository.create(testMember);

      const result = await teamService.removeTeamMember(testMember.id);

      expect(result).toBe(true);
      const removed = await teamRepository.findById(testMember.id);
      expect(removed).toBeNull();
    });

    it('should prevent removing last admin', async () => {
      const testMember = createTestTeamMember(TeamRole.ADMIN);
      await teamRepository.create(testMember);

      await expect(teamService.removeTeamMember(testMember.id))
        .rejects
        .toThrow('Cannot delete last admin');
    });
  });

  describe('Permission Validation', () => {
    it('should validate team member permissions correctly', async () => {
      const adminMember = createTestTeamMember(TeamRole.ADMIN);
      const viewerMember = createTestTeamMember(TeamRole.VIEWER);

      await Promise.all([
        teamRepository.create(adminMember),
        teamRepository.create(viewerMember)
      ]);

      const adminResult = await teamService.validatePermissions(
        adminMember.id,
        TeamRole.MANAGER
      );
      const viewerResult = await teamService.validatePermissions(
        viewerMember.id,
        TeamRole.MEMBER
      );

      expect(adminResult).toBe(true);
      expect(viewerResult).toBe(false);
    });

    it('should handle invalid member IDs in permission checks', async () => {
      const result = await teamService.validatePermissions(
        uuidv4(),
        TeamRole.MEMBER
      );

      expect(result).toBe(false);
    });
  });
});