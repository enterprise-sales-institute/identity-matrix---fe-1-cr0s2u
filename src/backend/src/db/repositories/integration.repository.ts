/**
 * @fileoverview Repository class for managing CRM integrations with transaction support and security
 * @version 1.0.0
 */

import { Transaction, Op } from 'sequelize'; // ^6.32.x
import { Integration } from '../models/integration.model';
import { IIntegration, IIntegrationCreate, IIntegrationUpdate } from '../../interfaces/integration.interface';
import { CRM_TYPES, INTEGRATION_STATUS } from '../../constants/integration.constants';

/**
 * Repository class implementing data access layer for CRM integrations
 * with comprehensive transaction support and multi-tenant security
 */
export class IntegrationRepository {
  private integration: typeof Integration;

  constructor() {
    this.integration = Integration;
  }

  /**
   * Creates a new integration with validation and encryption
   * @param data Integration creation data
   * @param transaction Optional transaction for atomic operations
   * @returns Created integration record
   */
  async create(data: IIntegrationCreate, transaction?: Transaction): Promise<IIntegration> {
    try {
      const existingIntegration = await this.integration.findOne({
        where: {
          companyId: data.companyId,
          type: data.type,
        },
        transaction,
      });

      if (existingIntegration) {
        throw new Error(`Integration of type ${data.type} already exists for company`);
      }

      const integration = await this.integration.create(
        {
          ...data,
          status: INTEGRATION_STATUS.PENDING,
          lastSyncAt: null,
          syncAttempts: 0,
          syncErrors: [],
        },
        { transaction }
      );

      return integration.get({ plain: true });
    } catch (error) {
      throw new Error(`Failed to create integration: ${error.message}`);
    }
  }

  /**
   * Retrieves an integration by ID with company validation
   * @param id Integration ID
   * @param companyId Company ID for security validation
   * @returns Found integration or null
   */
  async findById(id: string, companyId: string): Promise<IIntegration | null> {
    const integration = await this.integration.findOne({
      where: {
        id,
        companyId,
      },
    });

    return integration?.get({ plain: true }) || null;
  }

  /**
   * Finds integrations by company and type
   * @param companyId Company ID
   * @param type Optional CRM type filter
   * @returns List of matching integrations
   */
  async findByCompanyAndType(companyId: string, type?: CRM_TYPES): Promise<IIntegration[]> {
    const where: any = { companyId };
    if (type) {
      where.type = type;
    }

    const integrations = await this.integration.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return integrations.map(integration => integration.get({ plain: true }));
  }

  /**
   * Retrieves all integrations for a company
   * @param companyId Company ID
   * @returns List of company integrations
   */
  async findByCompany(companyId: string): Promise<IIntegration[]> {
    const integrations = await this.integration.findAll({
      where: { companyId },
      order: [['createdAt', 'DESC']],
    });

    return integrations.map(integration => integration.get({ plain: true }));
  }

  /**
   * Updates an integration with transaction support
   * @param id Integration ID
   * @param data Update data
   * @param companyId Company ID for security validation
   * @param transaction Optional transaction
   * @returns Updated integration
   */
  async update(
    id: string,
    data: IIntegrationUpdate,
    companyId: string,
    transaction?: Transaction
  ): Promise<IIntegration> {
    const integration = await this.integration.findOne({
      where: { id, companyId },
      transaction,
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    await integration.update(data, { transaction });
    return integration.get({ plain: true });
  }

  /**
   * Updates integration status with validation
   * @param id Integration ID
   * @param status New status
   * @param companyId Company ID for security validation
   * @param transaction Optional transaction
   * @returns Updated integration
   */
  async updateStatus(
    id: string,
    status: INTEGRATION_STATUS,
    companyId: string,
    transaction?: Transaction
  ): Promise<IIntegration> {
    const integration = await this.integration.findOne({
      where: { id, companyId },
      transaction,
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    await integration.update(
      {
        status,
        ...(status === INTEGRATION_STATUS.ERROR && {
          syncAttempts: integration.syncAttempts + 1,
        }),
      },
      { transaction }
    );

    return integration.get({ plain: true });
  }

  /**
   * Deletes an integration with security validation
   * @param id Integration ID
   * @param companyId Company ID for security validation
   * @param transaction Optional transaction
   */
  async delete(id: string, companyId: string, transaction?: Transaction): Promise<void> {
    const result = await this.integration.destroy({
      where: { id, companyId },
      transaction,
    });

    if (!result) {
      throw new Error('Integration not found');
    }
  }

  /**
   * Finds integrations pending synchronization
   * @param companyId Optional company ID filter
   * @returns List of pending integrations
   */
  async findPendingSync(companyId?: string): Promise<IIntegration[]> {
    const where: any = {
      status: {
        [Op.in]: [INTEGRATION_STATUS.ACTIVE, INTEGRATION_STATUS.ERROR],
      },
      [Op.or]: [
        { lastSyncAt: null },
        {
          lastSyncAt: {
            [Op.lt]: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          },
        },
      ],
    };

    if (companyId) {
      where.companyId = companyId;
    }

    const integrations = await this.integration.findAll({
      where,
      order: [['lastSyncAt', 'ASC', 'NULLS FIRST']],
    });

    return integrations.map(integration => integration.get({ plain: true }));
  }
}