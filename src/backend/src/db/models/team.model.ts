/**
 * @fileoverview Team member model implementation for Identity Matrix platform
 * @version 1.0.0
 */

import { Model, DataTypes, ModelAttributes, ModelOptions } from 'sequelize'; // ^6.32.x
import { ITeamMember, TeamRole, TeamMemberStatus } from '../../interfaces/team.interface';

/**
 * Sequelize model class for team members with enhanced audit capabilities
 * and multi-tenant data isolation features.
 */
export class TeamModel extends Model<ITeamMember> implements ITeamMember {
  public id!: string;
  public userId!: string;
  public companyId!: string;
  public role!: TeamRole;
  public status!: TeamMemberStatus;
  public invitedBy!: string;
  public invitedAt!: Date;
  public joinedAt!: Date;
  public lastAccessAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  /**
   * Sets up model associations with users and companies
   * @param models - Database models object containing User and Company models
   */
  public static associate(models: any): void {
    TeamModel.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    TeamModel.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
      onDelete: 'CASCADE'
    });

    TeamModel.belongsTo(models.User, {
      foreignKey: 'invitedBy',
      as: 'inviter',
      onDelete: 'SET NULL'
    });
  }
}

/**
 * Initialize the team member model with schema definition and configuration
 */
export const initTeamModel = (sequelize: any): typeof TeamModel => {
  TeamModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        }
      },
      role: {
        type: DataTypes.ENUM(...Object.values(TeamRole)),
        allowNull: false,
        defaultValue: TeamRole.MEMBER,
        validate: {
          isIn: [Object.values(TeamRole)]
        }
      },
      status: {
        type: DataTypes.ENUM(...Object.values(TeamMemberStatus)),
        allowNull: false,
        defaultValue: TeamMemberStatus.PENDING,
        validate: {
          isIn: [Object.values(TeamMemberStatus)]
        }
      },
      invitedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      invitedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastAccessAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'TeamMember',
      tableName: 'team_members',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'companyId'],
          name: 'team_members_user_company_idx'
        },
        {
          fields: ['companyId'],
          name: 'team_members_company_idx'
        },
        {
          fields: ['status'],
          name: 'team_members_status_idx'
        },
        {
          fields: ['role'],
          name: 'team_members_role_idx'
        }
      ],
      hooks: {
        beforeCreate: (instance: TeamModel) => {
          instance.invitedAt = instance.invitedAt || new Date();
          instance.status = instance.status || TeamMemberStatus.PENDING;
        },
        beforeUpdate: (instance: TeamModel) => {
          if (
            instance.changed('status') &&
            instance.status === TeamMemberStatus.ACTIVE &&
            !instance.joinedAt
          ) {
            instance.joinedAt = new Date();
          }
        }
      }
    }
  );

  return TeamModel;
};

export default TeamModel;