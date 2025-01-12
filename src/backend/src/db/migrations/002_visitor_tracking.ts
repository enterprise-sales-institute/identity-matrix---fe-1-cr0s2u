import { QueryInterface, DataTypes, Transaction } from 'sequelize';
import { encryptionKey, schema } from '../../config/database.config';

// Migration version and description
const MIGRATION_VERSION = '002';
const MIGRATION_DESCRIPTION = 'Visitor tracking schema implementation';

export = {
  up: async (queryInterface: QueryInterface, transaction: Transaction): Promise<void> => {
    await transaction.begin();

    try {
      // Create extension for UUID generation if not exists
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      // Create visitors table with encryption and security measures
      await queryInterface.createTable('visitors', {
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
          onDelete: 'CASCADE'
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        status: {
          type: DataTypes.ENUM('ANONYMOUS', 'IDENTIFIED', 'ENRICHED'),
          defaultValue: 'ANONYMOUS',
          allowNull: false
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        },
        first_seen: {
          type: DataTypes.DATE,
          allowNull: false
        },
        last_seen: {
          type: DataTypes.DATE,
          allowNull: false
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
        transaction
      });

      // Create visitor_activities table with time-based partitioning
      await queryInterface.createTable('visitor_activities', {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
        },
        visitor_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'visitors',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        activity_type: {
          type: DataTypes.STRING,
          allowNull: false
        },
        activity_data: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      }, {
        transaction
      });

      // Create visitor_enrichment table for storing enriched data
      await queryInterface.createTable('visitor_enrichment', {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
        },
        visitor_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'visitors',
            key: 'id'
          },
          onDelete: 'CASCADE',
          unique: true
        },
        enriched_data: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      }, {
        transaction
      });

      // Create indexes for performance optimization
      await queryInterface.addIndex('visitors', ['company_id'], {
        name: 'idx_visitors_company',
        transaction
      });

      await queryInterface.addIndex('visitors', ['email'], {
        name: 'idx_visitors_email',
        unique: true,
        where: {
          email: {
            [Op.ne]: null
          }
        },
        transaction
      });

      await queryInterface.addIndex('visitors', ['status', 'last_seen'], {
        name: 'idx_visitors_status_last_seen',
        using: 'BRIN',
        transaction
      });

      await queryInterface.addIndex('visitor_activities', ['visitor_id', 'timestamp'], {
        name: 'idx_visitor_activities_visitor_timestamp',
        using: 'BRIN',
        transaction
      });

      // Add encryption for sensitive fields
      await queryInterface.sequelize.query(`
        ALTER TABLE visitors 
        ALTER COLUMN email SET DATA TYPE bytea 
        USING PGP_SYM_ENCRYPT(email::text, :encryptionKey)::bytea
      `, {
        replacements: { encryptionKey },
        transaction
      });

      // Create row-level security policy
      await queryInterface.sequelize.query(`
        ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY visitor_isolation_policy ON visitors
        FOR ALL
        TO authenticated_users
        USING (company_id = current_setting('app.current_company_id')::uuid);
      `, { transaction });

      // Create audit trigger function
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION audit_visitor_changes()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO audit_logs (
            table_name,
            record_id,
            action,
            changed_by,
            changed_at,
            old_values,
            new_values
          ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            current_setting('app.current_user_id'),
            current_timestamp,
            row_to_json(OLD),
            row_to_json(NEW)
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction });

      // Attach audit trigger to tables
      await queryInterface.sequelize.query(`
        CREATE TRIGGER visitor_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON visitors
        FOR EACH ROW EXECUTE FUNCTION audit_visitor_changes();
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface: QueryInterface, transaction: Transaction): Promise<void> => {
    await transaction.begin();

    try {
      // Remove triggers
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS visitor_audit_trigger ON visitors;
        DROP FUNCTION IF EXISTS audit_visitor_changes();
      `, { transaction });

      // Remove RLS policies
      await queryInterface.sequelize.query(`
        DROP POLICY IF EXISTS visitor_isolation_policy ON visitors;
      `, { transaction });

      // Drop indexes
      await queryInterface.removeIndex('visitor_activities', 'idx_visitor_activities_visitor_timestamp', { transaction });
      await queryInterface.removeIndex('visitors', 'idx_visitors_status_last_seen', { transaction });
      await queryInterface.removeIndex('visitors', 'idx_visitors_email', { transaction });
      await queryInterface.removeIndex('visitors', 'idx_visitors_company', { transaction });

      // Drop tables
      await queryInterface.dropTable('visitor_enrichment', { transaction });
      await queryInterface.dropTable('visitor_activities', { transaction });
      await queryInterface.dropTable('visitors', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};