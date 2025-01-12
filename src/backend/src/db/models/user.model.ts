/**
 * @fileoverview Sequelize model definition for User entity in Identity Matrix platform
 * Implements secure user data storage with role-based access control and enhanced security features
 * @version 1.0.0
 */

import { Model, DataTypes, Sequelize } from 'sequelize'; // ^6.32.x
import { Table, Column, Index } from 'sequelize-typescript'; // ^2.1.x
import bcrypt from 'bcryptjs'; // ^2.4.x
import { UserRole } from '../../../interfaces/auth.interface';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const PASSWORD_HISTORY_LIMIT = 5;

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class User extends Model {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  })
  @Index('users_email_idx')
  email!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [12, 128],
      notEmpty: true,
      isStrongPassword(value: string) {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(value)) {
          throw new Error('Password must contain lowercase, uppercase, number, and special character');
        }
      },
    },
  })
  password!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  })
  name!: string;

  @Column({
    type: DataTypes.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.MEMBER,
  })
  @Index('users_role_idx')
  role!: UserRole;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
  })
  @Index('users_company_idx')
  companyId!: string;

  @Column({
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login_at',
  })
  lastLoginAt!: Date | null;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'failed_login_attempts',
  })
  @Index('users_security_idx')
  failedLoginAttempts!: number;

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'password_last_changed',
  })
  passwordLastChanged!: Date;

  @Column({
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'security_questions',
    validate: {
      isValidQuestions(value: any) {
        if (value && (!Array.isArray(value) || value.length < 2)) {
          throw new Error('At least 2 security questions required');
        }
      },
    },
  })
  securityQuestions!: { question: string; answer: string }[] | null;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  preferences!: Record<string, unknown>;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'audit_log',
  })
  auditLog!: Array<{
    action: string;
    timestamp: Date;
    ip?: string;
    userAgent?: string;
  }>;

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
  })
  createdAt!: Date;

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt!: Date;

  /**
   * Initialize the User model with Sequelize instance
   * @param sequelize - Sequelize instance
   * @returns Initialized User model
   */
  public static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
            notEmpty: true,
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            len: [12, 128],
            notEmpty: true,
          },
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [2, 100],
          },
        },
        role: {
          type: DataTypes.ENUM(...Object.values(UserRole)),
          allowNull: false,
          defaultValue: UserRole.MEMBER,
        },
        companyId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'company_id',
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_login_at',
        },
        failedLoginAttempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'failed_login_attempts',
        },
        passwordLastChanged: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'password_last_changed',
        },
        securityQuestions: {
          type: DataTypes.JSONB,
          allowNull: true,
          field: 'security_questions',
        },
        preferences: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        auditLog: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
          field: 'audit_log',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
        },
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
          beforeCreate: async (user: User) => {
            user.password = await user.hashPassword(user.password);
            user.passwordLastChanged = new Date();
          },
          beforeUpdate: async (user: User) => {
            if (user.changed('password')) {
              user.password = await user.hashPassword(user.password);
              user.passwordLastChanged = new Date();
            }
          },
        },
        indexes: [
          {
            unique: true,
            fields: ['email', 'company_id'],
            name: 'users_email_company_idx',
          },
          {
            fields: ['role'],
            name: 'users_role_idx',
          },
          {
            fields: ['failed_login_attempts', 'password_last_changed'],
            name: 'users_security_idx',
          },
        ],
      }
    );
    return User;
  }

  /**
   * Set up model associations
   * @param models - Object containing all models
   */
  public static associate(models: any): void {
    User.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
      onDelete: 'RESTRICT',
    });
  }

  /**
   * Hash password using bcrypt with security measures
   * @param password - Plain text password
   * @returns Hashed password
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Validate password with security checks
   * @param password - Plain text password to validate
   * @returns Boolean indicating password validity
   */
  public async validatePassword(password: string): Promise<boolean> {
    if (this.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      throw new Error('Account locked due to too many failed attempts');
    }

    const isValid = await bcrypt.compare(password, this.password);
    
    if (!isValid) {
      this.failedLoginAttempts += 1;
      await this.save();
      throw new Error('Invalid password');
    }

    // Reset failed attempts on successful login
    if (this.failedLoginAttempts > 0) {
      this.failedLoginAttempts = 0;
      await this.save();
    }

    return true;
  }
}

export default User;