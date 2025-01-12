/**
 * @fileoverview Sequelize model definition for Company entity in Identity Matrix platform
 * @version 1.0.0
 */

import { Model, DataTypes, Sequelize } from 'sequelize'; // ^6.32.x
import { Table, Column, Index } from 'sequelize-typescript'; // ^2.1.x
import CryptoJS from 'crypto-js'; // ^4.1.x
import { ICompany, ICompanySettings } from '../../../interfaces/company.interface';

const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || '';

@Table({
  tableName: 'companies',
  paranoid: true,
  timestamps: true,
  underscored: true,
})
export class Company extends Model<ICompany> implements ICompany {
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  })
  id!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255],
    },
  })
  name!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isUrl: true,
    },
  })
  @Index('companies_domain_idx')
  domain!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'free',
    field: 'subscription_tier',
    validate: {
      isIn: [['free', 'basic', 'professional', 'enterprise']],
    },
  })
  @Index('companies_subscription_idx')
  subscriptionTier!: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    field: 'billing_email',
    validate: {
      isEmail: true,
    },
    get() {
      const value = this.getDataValue('billingEmail');
      return value ? CryptoJS.AES.decrypt(value, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8) : null;
    },
    set(value: string) {
      this.setDataValue('billingEmail', CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString());
    },
  })
  @Index('companies_billing_email_idx')
  billingEmail!: string;

  @Column({
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    field: 'technical_contacts',
    validate: {
      isEmailArray(value: string[]) {
        if (!Array.isArray(value)) {
          throw new Error('Technical contacts must be an array');
        }
        value.forEach(email => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error(`Invalid email format: ${email}`);
          }
        });
      },
    },
    get() {
      const value = this.getDataValue('technicalContacts');
      return value ? value.map(email => 
        CryptoJS.AES.decrypt(email, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)
      ) : [];
    },
    set(value: string[]) {
      this.setDataValue('technicalContacts', 
        value.map(email => CryptoJS.AES.encrypt(email, ENCRYPTION_KEY).toString())
      );
    },
  })
  technicalContacts!: string[];

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  @Index('companies_is_active_idx')
  isActive!: boolean;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    validate: {
      isValidSettings(value: ICompanySettings) {
        if (!value.timezone) {
          throw new Error('Timezone is required in company settings');
        }
        if (typeof value.emailNotifications !== 'boolean') {
          throw new Error('emailNotifications must be a boolean');
        }
        if (!Array.isArray(value.allowedDomains)) {
          throw new Error('allowedDomains must be an array');
        }
        if (typeof value.integrationConfig !== 'object') {
          throw new Error('integrationConfig must be an object');
        }
        if (typeof value.visitorTrackingSettings !== 'object') {
          throw new Error('visitorTrackingSettings must be an object');
        }
        if (typeof value.securitySettings !== 'object') {
          throw new Error('securitySettings must be an object');
        }
      },
    },
  })
  settings!: ICompanySettings;

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
   * Initialize the Company model with Sequelize instance
   * @param sequelize - Sequelize instance
   * @returns Initialized Company model
   */
  public static initModel(sequelize: Sequelize): typeof Company {
    Company.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [2, 255],
          },
        },
        domain: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isUrl: true,
          },
        },
        subscriptionTier: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'free',
          field: 'subscription_tier',
          validate: {
            isIn: [['free', 'basic', 'professional', 'enterprise']],
          },
        },
        billingEmail: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'billing_email',
          validate: {
            isEmail: true,
          },
        },
        technicalContacts: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
          field: 'technical_contacts',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active',
        },
        settings: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
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
        tableName: 'companies',
        paranoid: true,
        timestamps: true,
        underscored: true,
        hooks: {
          beforeSave: async (instance: Company) => {
            // Ensure settings has required structure
            if (!instance.settings) {
              instance.settings = {
                emailNotifications: true,
                allowedDomains: [instance.domain],
                integrationConfig: {
                  enabled: true,
                  allowedIntegrations: [],
                  integrationSettings: {},
                },
                visitorTrackingSettings: {
                  enabled: true,
                  retentionDays: 365,
                  excludedPaths: [],
                  captureIPAddress: true,
                },
                timezone: 'UTC',
                securitySettings: {
                  enforceIPRestrictions: false,
                  allowedIPs: [],
                  requireMFA: false,
                },
              };
            }
          },
        },
      }
    );
    return Company;
  }

  /**
   * Set up model associations
   * @param models - Object containing all models
   */
  public static associate(models: any): void {
    Company.hasMany(models.TeamMember, {
      foreignKey: 'companyId',
      as: 'teamMembers',
      onDelete: 'CASCADE',
    });

    Company.hasMany(models.Integration, {
      foreignKey: 'companyId',
      as: 'integrations',
      onDelete: 'CASCADE',
    });

    Company.hasMany(models.Visitor, {
      foreignKey: 'companyId',
      as: 'visitors',
      onDelete: 'CASCADE',
    });
  }
}