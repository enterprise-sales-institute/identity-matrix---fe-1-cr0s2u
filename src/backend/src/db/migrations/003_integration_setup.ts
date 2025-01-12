import { QueryInterface, DataTypes } from 'sequelize';
import { databaseConfig } from '../../config/database.config';
import { CRM_TYPES, INTEGRATION_STATUS } from '../../../constants/integration.constants';

/**
 * Migration: Integration Setup
 * Creates tables and relationships for CRM integration functionality
 * Version: 1.0.0
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // Create integrations table
  await queryInterface.createTable('integrations', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
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
    type: {
      type: DataTypes.ENUM(...Object.values(CRM_TYPES)),
      allowNull: false,
      comment: 'Type of CRM integration'
    },
    credentials: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Encrypted OAuth2 credentials and tokens'
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Integration configuration settings'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(INTEGRATION_STATUS)),
      allowNull: false,
      defaultValue: INTEGRATION_STATUS.PENDING
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    schema: databaseConfig.postgresql.database,
    comment: 'Stores CRM integration configurations and credentials'
  });

  // Create integration sync logs table
  await queryInterface.createTable('integration_sync_logs', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    integration_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'integrations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'ERROR', 'PARTIAL'),
      allowNull: false
    },
    records_processed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    records_failed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    error_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detailed error information if sync failed'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    schema: databaseConfig.postgresql.database,
    comment: 'Tracks integration synchronization history and results'
  });

  // Create integration field mappings table
  await queryInterface.createTable('integration_field_mappings', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    integration_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'integrations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    source_field: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Field name in Identity Matrix'
    },
    target_field: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Field name in CRM system'
    },
    transformation: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Optional data transformation rules'
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    schema: databaseConfig.postgresql.database,
    comment: 'Defines field mapping between Identity Matrix and CRM systems'
  });

  // Create indexes for performance optimization
  await queryInterface.addIndex('integrations', ['company_id', 'type'], {
    name: 'integrations_company_type_idx',
    unique: true
  });

  await queryInterface.addIndex('integrations', ['status', 'last_sync_at'], {
    name: 'integrations_status_sync_idx'
  });

  await queryInterface.addIndex('integration_sync_logs', ['integration_id', 'started_at'], {
    name: 'sync_logs_integration_date_idx'
  });

  await queryInterface.addIndex('integration_sync_logs', ['status', 'completed_at'], {
    name: 'sync_logs_status_date_idx'
  });

  await queryInterface.addIndex('integration_field_mappings', ['integration_id', 'source_field'], {
    name: 'field_mappings_integration_source_idx',
    unique: true
  });
}

/**
 * Rollback Migration: Integration Setup
 * Removes all integration-related tables and indexes
 */
export async function down(queryInterface: QueryInterface): Promise<void> {
  // Drop tables in reverse order to handle foreign key constraints
  await queryInterface.dropTable('integration_field_mappings');
  await queryInterface.dropTable('integration_sync_logs');
  await queryInterface.dropTable('integrations');

  // Remove ENUM types
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_integrations_type');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_integrations_status');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_integration_sync_logs_status');
}