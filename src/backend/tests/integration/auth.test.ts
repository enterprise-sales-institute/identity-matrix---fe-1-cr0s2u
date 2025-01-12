/**
 * @fileoverview Integration tests for authentication flows with comprehensive security validation
 * @version 1.0.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'; // v29.x
import supertest from 'supertest'; // ^6.3.3
import { DataSource } from 'typeorm'; // ^0.3.0
import { AuthService } from '../../src/services/auth/auth.service';
import { IAuthCredentials, IRegistrationData, IAuthResponse, UserRole } from '../../src/interfaces/auth.interface';

// Test constants
const TEST_USER: IRegistrationData = {
  email: 'test@example.com',
  password: 'Test@Password123',
  name: 'Test User',
  companyName: 'Test Company',
  companyDomain: 'test.com'
};

const INVALID_USER = {
  email: 'invalid@example.com',
  password: 'invalid',
  name: 'Invalid User',
  companyName: 'Invalid Company',
  companyDomain: 'invalid.com'
};

let authService: AuthService;
let dataSource: DataSource;
let testUserTokens: IAuthResponse;

// Configure longer timeout for integration tests
jest.setTimeout(10000);

beforeAll(async () => {
  // Initialize test database connection
  dataSource = new DataSource({
    type: 'postgres',
    database: 'identity_matrix_test',
    synchronize: true,
    logging: false,
    entities: ['src/db/models/*.ts']
  });
  await dataSource.initialize();

  // Initialize auth service
  authService = new AuthService();

  // Clear test data
  await dataSource.query('TRUNCATE TABLE users CASCADE');
  await dataSource.query('TRUNCATE TABLE companies CASCADE');
});

afterAll(async () => {
  // Cleanup test data
  await dataSource.query('TRUNCATE TABLE users CASCADE');
  await dataSource.query('TRUNCATE TABLE companies CASCADE');
  await dataSource.destroy();
});

describe('User Registration', () => {
  test('should successfully register new user with valid data', async () => {
    const response = await authService.register(TEST_USER);

    expect(response).toBeDefined();
    expect(response.user).toHaveProperty('id');
    expect(response.user.email).toBe(TEST_USER.email);
    expect(response.user.role).toBe(UserRole.ADMIN);
    expect(response.tokens).toHaveProperty('accessToken');
    expect(response.tokens).toHaveProperty('refreshToken');
  });

  test('should enforce password complexity requirements', async () => {
    const weakPassword: IRegistrationData = {
      ...TEST_USER,
      email: 'weak@example.com',
      password: 'weak'
    };

    await expect(authService.register(weakPassword)).rejects.toThrow();
  });

  test('should prevent duplicate email registration', async () => {
    await expect(authService.register(TEST_USER)).rejects.toThrow();
  });

  test('should validate company domain format', async () => {
    const invalidDomain: IRegistrationData = {
      ...TEST_USER,
      email: 'domain@example.com',
      companyDomain: 'invalid..domain'
    };

    await expect(authService.register(invalidDomain)).rejects.toThrow();
  });

  test('should create audit log entry for registration', async () => {
    const user = await dataSource
      .getRepository('User')
      .findOne({ where: { email: TEST_USER.email } });

    expect(user.auditLog).toBeDefined();
    expect(user.auditLog[0]).toHaveProperty('action', 'registration');
  });
});

describe('User Login', () => {
  test('should successfully login with valid credentials', async () => {
    const credentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };

    const response = await authService.login(credentials);
    testUserTokens = response;

    expect(response).toBeDefined();
    expect(response.tokens).toHaveProperty('accessToken');
    expect(response.tokens).toHaveProperty('refreshToken');
    expect(response.user.email).toBe(TEST_USER.email);
  });

  test('should handle invalid credentials correctly', async () => {
    const invalidCredentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: 'wrongpassword'
    };

    await expect(authService.login(invalidCredentials)).rejects.toThrow();
  });

  test('should implement account lockout after failed attempts', async () => {
    const invalidCredentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: 'wrongpassword'
    };

    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await expect(authService.login(invalidCredentials)).rejects.toThrow();
    }

    // Verify account lockout
    await expect(authService.login({
      email: TEST_USER.email,
      password: TEST_USER.password
    })).rejects.toThrow('Account temporarily locked');
  });

  test('should validate JWT token structure', async () => {
    const credentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };

    const response = await authService.login(credentials);
    const token = response.tokens.accessToken;

    expect(token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
  });
});

describe('Token Refresh', () => {
  test('should successfully refresh access token', async () => {
    const response = await authService.refreshToken(testUserTokens.tokens.refreshToken);

    expect(response).toBeDefined();
    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
    expect(response.accessToken).not.toBe(testUserTokens.tokens.accessToken);
  });

  test('should reject invalid refresh tokens', async () => {
    await expect(authService.refreshToken('invalid.refresh.token')).rejects.toThrow();
  });

  test('should prevent refresh token reuse', async () => {
    const response = await authService.refreshToken(testUserTokens.tokens.refreshToken);
    await expect(authService.refreshToken(testUserTokens.tokens.refreshToken)).rejects.toThrow();
  });

  test('should maintain token version consistency', async () => {
    const response = await authService.login({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    const oldToken = response.tokens.accessToken;
    await authService.logout(response.tokens.refreshToken);

    await expect(authService.validateToken(oldToken)).rejects.toThrow();
  });
});

describe('User Logout', () => {
  test('should successfully logout user', async () => {
    const credentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };

    const loginResponse = await authService.login(credentials);
    await expect(authService.logout(loginResponse.tokens.refreshToken)).resolves.not.toThrow();
  });

  test('should invalidate tokens after logout', async () => {
    const credentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };

    const loginResponse = await authService.login(credentials);
    await authService.logout(loginResponse.tokens.refreshToken);

    await expect(authService.validateToken(loginResponse.tokens.accessToken)).rejects.toThrow();
  });

  test('should handle concurrent logout requests', async () => {
    const credentials: IAuthCredentials = {
      email: TEST_USER.email,
      password: TEST_USER.password
    };

    const loginResponse = await authService.login(credentials);
    await Promise.all([
      authService.logout(loginResponse.tokens.refreshToken),
      authService.logout(loginResponse.tokens.refreshToken)
    ]);

    await expect(authService.validateToken(loginResponse.tokens.accessToken)).rejects.toThrow();
  });

  test('should create audit log entry for logout', async () => {
    const user = await dataSource
      .getRepository('User')
      .findOne({ where: { email: TEST_USER.email } });

    const logoutEntry = user.auditLog.find(entry => entry.action === 'logout');
    expect(logoutEntry).toBeDefined();
  });
});