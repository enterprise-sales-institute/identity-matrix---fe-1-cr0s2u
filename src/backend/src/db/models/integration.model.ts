/**
 * @fileoverview Sequelize model definition for CRM Integration entity
 * Manages integration configurations, credentials and sync status with enhanced security
 * @version 1.0.0
 */

import { Model, DataTypes, Sequelize } from 'sequelize'; // ^6.32.x
import { Table, Column, Index } from 'sequelize-typescript'; // ^2.1.x
import CryptoJS from 'crypto-js'; // ^4.1.x
import { Logger } from 'winston'; // ^3.8.x

import { IIntegration } from '../../../interfaces/integration.interface';
import { CRM_TYPES, INTEGRATION_STATUS } from '../../../constants/integration.constants';
import { Company } from './company.model';

// Encryption key from environment variables
const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || '';

@Table({
  tableName: 'integrations',
  paranoid: true,
  timestamps: true,
  underscored: true,
})
export class Integration extends Model<IIntegration> implements IIntegration {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
  })
  @Index('integrations_company_id_idx')
  companyId!: string;

  @Column({
    type: DataTypes.ENUM(...Object.values(CRM_TYPES)),
    allowNull: false,
    validate: {
      isIn: [Object.values(CRM_TYPES)],
    },
  })
  @Index('integrations_type_idx')
  type!: CRM_TYPES;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    get() {
      const value = this.getDataValue('credentials');
      return value ? JSON.parse(CryptoJS.AES.decrypt(value, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)) : {};
    },
    set(value: any) {
      this.setDataValue('credentials', CryptoJS.AES.encrypt(JSON.stringify(value), ENCRYPTION_KEY).toString());
    },
  })
  credentials!: any;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    validate: {
      isValidConfig(value: any) {
        if (!value.syncInterval) {
          throw new Error('syncInterval is required in config');
        }
        if (!Array.isArray(value.fieldMappings)) {
          throw new Error('fieldMappings must be an array');
        }
        if (value.webhookUrl && !value.webhookSecret) {
          throw new Error('webhookSecret is required when webhookUrl is provided');
        }
      },
    },
  })
  config!: any;

  @Column({
    type: DataTypes.ENUM(...Object.values(INTEGRATION_STATUS)),
    allowNull: false,
    defaultValue: INTEGRATION_STATUS.PENDING,
    validate: {
      isIn: [Object.values(INTEGRATION_STATUS)],
    },
  })
  @Index('integrations_status_idx')
  status!: INTEGRATION_STATUS;

  @Column({
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_sync_at',
  })
  @Index('integrations_last_sync_idx')
  lastSyncAt!: Date;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sync_attempts',
  })
  syncAttempts!: number;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'sync_errors',
  })
  syncErrors!: any[];

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'credentials_updated_at',
  })
  @Index('integrations_credentials_updated_idx')
  credentialsUpdatedAt!: Date;

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

  @Column({
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  deletedAt!: Date;

  /**
   * Initialize the Integration model with Sequelize instance
   * @param sequelize - Sequelize instance
   * @returns Initialized Integration model
   */
  public static initModel(sequelize: Sequelize): typeof Integration {
    Integration.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        companyId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'company_id',
          references: {
            model: 'companies',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        type: {
          type: DataTypes.ENUM(...Object.values(CRM_TYPES)),
          allowNull: false,
          validate: {
            isIn: [Object.values(CRM_TYPES)],
          },
        },
        credentials: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        config: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
        status: {
          type: DataTypes.ENUM(...Object.values(INTEGRATION_STATUS)),
          allowNull: false,
          defaultValue: INTEGRATION_STATUS.PENDING,
        },
        lastSyncAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_sync_at',
        },
        syncAttempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'sync_attempts',
        },
        syncErrors: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
          field: 'sync_errors',
        },
        credentialsUpdatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'credentials_updated_at',
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
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at',
        },
      },
      {
        sequelize,
        tableName: 'integrations',
        paranoid: true,
        timestamps: true,
        underscored: true,
        indexes: [
          {
            unique: true,
            fields: ['company_id', 'type'],
            name: 'integrations_company_type_idx',
          },
          {
            fields: ['status'],
            name: 'integrations_status_idx',
          },
          {
            fields: ['last_sync_at'],
            name: 'integrations_last_sync_idx',
          },
          {
            fields: ['credentials_updated_at'],
            name: 'integrations_credentials_updated_idx',
          },
        ],
        hooks: {
          beforeSave: async (instance: Integration) => {
            // Update credentials timestamp on credential changes
            if (instance.changed('credentials')) {
              instance.credentialsUpdatedAt = new Date();
            }

            // Validate config structure
            if (instance.changed('config')) {
              instance.validateConfig(instance.config);
            }

            // Log security audit event
            Logger.info('Integration credentials updated', {
              integrationId: instance.id,
              companyId: instance.companyId,
              type: instance.type,
              timestamp: new Date(),
            });
          },
        },
      }
    );
    return Integration;
  }

  /**
   * Set up model associations
   * @param models - Object containing all models
   */
  public static associate(models: any): void {
    Integration.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
      onDelete: 'CASCADE',
    });
  }

  /**
   * Validate integration configuration
   * @param config - Configuration object to validate
   * @throws Error if configuration is invalid
   */
  private validateConfig(config: any): void {
    if (!config.syncInterval) {
      throw new Error('syncInterval is required in config');
    }
    if (!Array.isArray(config.fieldMappings)) {
      throw new Error('fieldMappings must be an array');
    }
    if (config.webhookUrl && !config.webhookSecret) {
      throw new Error('webhookSecret is required when webhookUrl is provided');
    }
    // Validate retry policy
    if (config.retryPolicy) {
      if (typeof config.retryPolicy.maxAttempts !== 'number') {
        throw new Error('retryPolicy.maxAttempts must be a number');
      }
      if (typeof config.retryPolicy.backoffInterval !== 'number') {
        throw new Error('retryPolicy.backoffInterval must be a number');
      }
      if (typeof config.retryPolicy.timeoutMs !== 'number') {
        throw new Error('retryPolicy.timeoutMs must be a number');
      }
    }
  }
}