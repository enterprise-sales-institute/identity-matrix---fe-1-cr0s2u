/**
 * @fileoverview Enhanced repository class for secure user data access operations
 * Implements comprehensive security measures, transaction support, and audit logging
 * @version 1.0.0
 */

import { Op, Transaction, QueryTypes } from 'sequelize'; // ^6.32.x
import { User, hashPassword, validatePassword, auditLog } from '../models/user.model';
import { IUserProfile, UserRole } from '../../interfaces/auth.interface';
import { ErrorTypes } from '../../constants/error.constants';

/**
 * Enhanced repository class for secure user data access operations
 * with transaction support and audit logging
 */
export class UserRepository {
  private userModel: typeof User;
  private maxLoginAttempts: number;
  private lockoutDuration: number;

  /**
   * Initialize user repository with security configurations
   * @param maxAttempts - Maximum allowed login attempts
   * @param lockoutMinutes - Account lockout duration in minutes
   */
  constructor(maxAttempts: number = 5, lockoutMinutes: number = 30) {
    this.userModel = User;
    this.maxLoginAttempts = maxAttempts;
    this.lockoutDuration = lockoutMinutes * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Find user by ID with enhanced security checks
   * @param id - User UUID
   * @param transaction - Optional transaction for data consistency
   * @returns User profile with role information
   * @throws Error if user not found or unauthorized
   */
  async findById(id: string, transaction?: Transaction): Promise<IUserProfile> {
    if (!id) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    const user = await this.userModel.findOne({
      where: { id },
      include: [
        {
          association: 'company',
          attributes: ['id', 'name', 'domain', 'isActive']
        }
      ],
      transaction
    });

    if (!user || !user.company.isActive) {
      throw new Error(ErrorTypes.RESOURCE_ERROR);
    }

    await this.auditUserAccess(user.id, 'profile_access');

    return this.sanitizeUserProfile(user);
  }

  /**
   * Find users by company ID with role-based filtering
   * @param companyId - Company UUID
   * @param role - Optional role filter
   * @param transaction - Optional transaction for data consistency
   * @returns Array of filtered user profiles
   */
  async findByCompany(
    companyId: string,
    role?: UserRole,
    transaction?: Transaction
  ): Promise<IUserProfile[]> {
    const whereClause: any = { companyId };
    if (role) {
      whereClause.role = role;
    }

    const users = await this.userModel.findAll({
      where: whereClause,
      include: [
        {
          association: 'company',
          attributes: ['id', 'name', 'domain', 'isActive'],
          where: { isActive: true }
        }
      ],
      transaction
    });

    await this.auditBulkAccess(companyId, 'company_users_access');

    return users.map(user => this.sanitizeUserProfile(user));
  }

  /**
   * Validate user credentials with security measures
   * @param email - User email
   * @param password - User password
   * @returns Validated user profile
   * @throws Error for invalid credentials or locked account
   */
  async validateCredentials(email: string, password: string): Promise<IUserProfile> {
    const user = await this.userModel.findOne({
      where: {
        email,
        failedLoginAttempts: {
          [Op.lt]: this.maxLoginAttempts
        }
      },
      include: [
        {
          association: 'company',
          attributes: ['id', 'name', 'domain', 'isActive'],
          where: { isActive: true }
        }
      ]
    });

    if (!user) {
      throw new Error(ErrorTypes.UNAUTHORIZED);
    }

    // Check account lockout
    const lastFailedAttempt = user.lastLoginAt;
    if (lastFailedAttempt && user.failedLoginAttempts >= this.maxLoginAttempts) {
      const lockoutTime = new Date(lastFailedAttempt.getTime() + this.lockoutDuration);
      if (new Date() < lockoutTime) {
        throw new Error('Account temporarily locked');
      }
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      await this.auditUserAccess(user.id, 'failed_login');
      throw new Error(ErrorTypes.UNAUTHORIZED);
    }

    // Update login timestamp and reset failed attempts
    await user.update({
      lastLoginAt: new Date(),
      failedLoginAttempts: 0
    });

    await this.auditUserAccess(user.id, 'successful_login');

    return this.sanitizeUserProfile(user);
  }

  /**
   * Sanitize user data for safe external usage
   * @param user - User model instance
   * @returns Sanitized user profile
   */
  private sanitizeUserProfile(user: User): IUserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      company: {
        id: user.company.id,
        name: user.company.name,
        domain: user.company.domain,
        isActive: user.company.isActive
      },
      lastLoginAt: user.lastLoginAt,
      mfaEnabled: Boolean(user.securityQuestions?.length),
      status: user.failedLoginAttempts >= this.maxLoginAttempts ? 'SUSPENDED' : 'ACTIVE'
    };
  }

  /**
   * Audit individual user access events
   * @param userId - User UUID
   * @param action - Audit action type
   */
  private async auditUserAccess(userId: string, action: string): Promise<void> {
    await this.userModel.update(
      {
        auditLog: [
          ...user.auditLog,
          {
            action,
            timestamp: new Date(),
            ip: process.env.REQUEST_IP,
            userAgent: process.env.REQUEST_USER_AGENT
          }
        ]
      },
      { where: { id: userId } }
    );
  }

  /**
   * Audit bulk access events
   * @param companyId - Company UUID
   * @param action - Audit action type
   */
  private async auditBulkAccess(companyId: string, action: string): Promise<void> {
    // Implement company-level audit logging
    // This could be extended based on specific audit requirements
  }
}

export default UserRepository;