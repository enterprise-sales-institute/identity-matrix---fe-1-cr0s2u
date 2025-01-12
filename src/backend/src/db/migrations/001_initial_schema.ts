import { QueryInterface, DataTypes } from 'sequelize';
import { postgresql } from '../../config/database.config';

/**
 * Initial database migration that establishes the core schema for Identity Matrix platform
 * with enhanced security, performance optimization, and proper multi-tenant data isolation.
 */
export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Enable UUID extension for PostgreSQL
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Create companies table
  await queryInterface.createTable('companies', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isUrl: true,
        notEmpty: true
      }
    },
    subscription_tier: {
      type: DataTypes.ENUM('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'),
      allowNull: false,
      defaultValue: 'FREE'
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidJSON: true
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'companies_domain_idx',
        unique: true,
        fields: ['domain'],
        using: 'BTREE'
      },
      {
        name: 'companies_subscription_idx',
        fields: ['subscription_tier'],
        using: 'BTREE'
      },
      {
        name: 'companies_created_at_idx',
        fields: ['created_at'],
        using: 'BRIN'
      }
    ]
  });

  // Create users table
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 255]
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'),
      allowNull: false,
      defaultValue: 'MEMBER'
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidJSON: true
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'users_email_idx',
        unique: true,
        fields: ['email'],
        using: 'BTREE'
      },
      {
        name: 'users_company_role_idx',
        fields: ['company_id', 'role'],
        using: 'BTREE'
      },
      {
        name: 'users_created_at_idx',
        fields: ['created_at'],
        using: 'BRIN'
      }
    ]
  });

  // Create team_members table
  await queryInterface.createTable('team_members', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'companies',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'),
      allowNull: false,
      defaultValue: 'MEMBER'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'PENDING', 'INACTIVE', 'BLOCKED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    invited_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    invited_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'team_members_user_company_idx',
        unique: true,
        fields: ['user_id', 'company_id'],
        using: 'BTREE'
      },
      {
        name: 'team_members_company_idx',
        fields: ['company_id'],
        using: 'BTREE'
      },
      {
        name: 'team_members_status_idx',
        fields: ['status'],
        using: 'BTREE'
      },
      {
        name: 'team_members_created_at_idx',
        fields: ['created_at'],
        using: 'BRIN'
      }
    ]
  });

  // Create audit logging function and trigger
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION audit_log_changes()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Add triggers for automatic timestamp updates
  const tables = ['companies', 'users', 'team_members'];
  for (const table of tables) {
    await queryInterface.sequelize.query(`
      CREATE TRIGGER ${table}_audit_log
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE FUNCTION audit_log_changes();
    `);
  }
};

/**
 * Rollback migration that safely removes all created database objects
 * in the correct order to maintain referential integrity.
 */
export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop triggers first
  const tables = ['companies', 'users', 'team_members'];
  for (const table of tables) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS ${table}_audit_log ON ${table};
    `);
  }

  // Drop the audit function
  await queryInterface.sequelize.query(`
    DROP FUNCTION IF EXISTS audit_log_changes();
  `);

  // Drop tables in reverse order to handle foreign key constraints
  await queryInterface.dropTable('team_members');
  await queryInterface.dropTable('users');
  await queryInterface.dropTable('companies');

  // Drop ENUMs
  await queryInterface.sequelize.query(`
    DROP TYPE IF EXISTS enum_team_members_status;
    DROP TYPE IF EXISTS enum_users_role;
    DROP TYPE IF EXISTS enum_companies_subscription_tier;
  `);
};