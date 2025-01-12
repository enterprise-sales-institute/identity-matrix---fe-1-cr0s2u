/**
 * @fileoverview Comprehensive unit test suite for AuthService class validating authentication flows,
 * security standards, token management, and user operations with extensive security validation
 * @version 1.0.0
 */

// External imports
import { describe, beforeEach, test, expect, jest } from '@jest/globals'; // ^29.x
import { MockInstance } from 'jest-mock'; // ^29.x

// Internal imports
import { AuthService } from '../../../src/services/auth/auth.service';
import { JwtService } from '../../../src/services/auth/jwt.service';
import { UserRepository } from '../../../src/db/repositories/user.repository';
import { IAuthCredentials, IRegistrationData, UserRole, UserStatus } from '../../../src/interfaces/auth.interface';
import { ErrorTypes } from '../../../src/constants/error.constants';

// Mock implementations
jest.mock('../../../src/services/auth/jwt.service');
jest.mock('../../../src/db/repositories/user.repository');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockJwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.MEMBER,
    companyId: '123e4567-e89b-12d3-a456-426614174001',
    company: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Company',
      domain: 'example.com',
      isActive: true
    },
    lastLoginAt: new Date(),
    mfaEnabled: false,
    status: UserStatus.ACTIVE
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
    tokenType: 'Bearer',
    expiresIn: 900
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockJwtService = new JwtService() as jest.Mocked<JwtService>;
    authService = new AuthService(mockUserRepository, mockJwtService);
  });

  describe('login', () => {
    const validCredentials: IAuthCredentials = {
      email: 'test@example.com',
      password: 'StrongP@ssw0rd'
    };

    test('should successfully authenticate with valid credentials', async () => {
      mockUserRepository.validateCredentials.mockResolvedValue(mockUser);
      mockJwtService.generateTokenPair.mockReturnValue(mockTokens);

      const result = await authService.login(validCredentials);

      expect(mockUserRepository.validateCredentials).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password
      );
      expect(mockJwtService.generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        companyId: mockUser.companyId
      });
      expect(result).toEqual({ user: mockUser, tokens: mockTokens });
    });

    test('should enforce password complexity requirements', async () => {
      const weakCredentials: IAuthCredentials = {
        email: 'test@example.com',
        password: 'weak'
      };

      await expect(authService.login(weakCredentials)).rejects.toThrow(ErrorTypes.VALIDATION_ERROR);
    });

    test('should implement rate limiting after failed attempts', async () => {
      mockUserRepository.validateCredentials.mockRejectedValue(new Error(ErrorTypes.AUTHENTICATION_ERROR));

      for (let i = 0; i < 6; i++) {
        await expect(authService.login(validCredentials)).rejects.toThrow();
      }

      await expect(authService.login(validCredentials)).rejects.toThrow('Too many login attempts');
    });
  });

  describe('register', () => {
    const validRegistration: IRegistrationData = {
      email: 'new@example.com',
      password: 'StrongP@ssw0rd',
      name: 'New User',
      companyName: 'New Company',
      companyDomain: 'newcompany.com'
    };

    test('should create new user and company with secure password validation', async () => {
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockJwtService.generateTokenPair.mockReturnValue(mockTokens);

      const result = await authService.register(validRegistration);

      expect(mockUserRepository.create).toHaveBeenCalledWith(validRegistration, undefined);
      expect(mockJwtService.generateTokenPair).toHaveBeenCalled();
      expect(result).toEqual({ user: mockUser, tokens: mockTokens });
    });

    test('should prevent duplicate email registration', async () => {
      mockUserRepository.create.mockRejectedValue(new Error('duplicate key value'));

      await expect(authService.register(validRegistration)).rejects.toThrow(ErrorTypes.VALIDATION_ERROR);
    });

    test('should validate company domain format', async () => {
      const invalidDomain: IRegistrationData = {
        ...validRegistration,
        companyDomain: 'invalid'
      };

      await expect(authService.register(invalidDomain)).rejects.toThrow(ErrorTypes.VALIDATION_ERROR);
    });
  });

  describe('token management', () => {
    const mockRefreshToken = 'valid.refresh.token';
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

    test('should properly rotate refresh tokens', async () => {
      mockJwtService.verifyRefreshToken.mockReturnValue(mockUserId);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockJwtService.generateTokenPair.mockReturnValue(mockTokens);

      const result = await authService.refreshToken(mockRefreshToken);

      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockJwtService.revokeRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(result).toEqual(mockTokens);
    });

    test('should validate token signatures', async () => {
      mockJwtService.verifyAccessToken.mockReturnValue({
        userId: mockUserId,
        email: mockUser.email,
        role: mockUser.role,
        companyId: mockUser.companyId
      });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.validateToken('valid.access.token');

      expect(result).toEqual(mockUser);
    });

    test('should handle token expiration', async () => {
      mockJwtService.verifyAccessToken.mockRejectedValue(new Error(ErrorTypes.TOKEN_EXPIRED));

      await expect(authService.validateToken('expired.token')).rejects.toThrow(ErrorTypes.AUTHENTICATION_ERROR);
    });

    test('should implement proper token revocation', async () => {
      mockJwtService.verifyRefreshToken.mockReturnValue(mockUserId);

      await authService.logout(mockRefreshToken);

      expect(mockJwtService.verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockJwtService.revokeRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
    });
  });

  describe('security validations', () => {
    test('should enforce email format validation', async () => {
      const invalidEmail: IAuthCredentials = {
        email: 'invalid-email',
        password: 'StrongP@ssw0rd'
      };

      await expect(authService.login(invalidEmail)).rejects.toThrow(ErrorTypes.VALIDATION_ERROR);
    });

    test('should handle account lockout scenarios', async () => {
      mockUserRepository.validateCredentials.mockRejectedValue(new Error('Account locked'));

      await expect(authService.login({
        email: 'locked@example.com',
        password: 'StrongP@ssw0rd'
      })).rejects.toThrow();
    });

    test('should validate security settings during registration', async () => {
      const weakRegistration: IRegistrationData = {
        ...mockUser,
        password: 'weak',
        companyDomain: 'invalid'
      };

      await expect(authService.register(weakRegistration)).rejects.toThrow(ErrorTypes.VALIDATION_ERROR);
    });
  });
});