/**
 * @fileoverview Enhanced visitor controller for Identity Matrix platform
 * Implements secure and performant REST endpoints for visitor tracking and management
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  ValidationPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimit } from '@nestjs/throttler';
import { MetricsService } from '@nestjs/metrics';

import { VisitorService } from '../../services/visitor/visitor.service';
import {
  IVisitor,
  IVisitorMetadata,
  IEnrichedData
} from '../../interfaces/visitor.interface';
import { validateVisitorMetadata, validateEnrichedData } from '../validators/visitor.validator';
import { VISITOR_STATUS } from '../../constants/visitor.constants';
import { createError } from '../../utils/error.util';
import { ErrorTypes, ErrorCodes } from '../../constants/error.constants';

@Controller('visitors')
@ApiTags('visitors')
@UseGuards(AuthGuard('jwt'))
@ApiSecurity('jwt')
export class VisitorController {
  constructor(
    private readonly visitorService: VisitorService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Creates a new visitor record with enhanced security and validation
   */
  @Post()
  @RateLimit({ ttl: 60, limit: 100 })
  @ApiOperation({ summary: 'Create new visitor' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Visitor created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid visitor data' })
  async createVisitor(
    @Body(new ValidationPipe()) metadata: IVisitorMetadata,
    @Query('companyId') companyId: string
  ): Promise<IVisitor> {
    const timer = this.metricsService.startTimer('visitor_creation');
    try {
      // Validate visitor metadata
      await validateVisitorMetadata(metadata);

      // Create visitor with GDPR compliance
      const visitor = await this.visitorService.createVisitor(
        companyId,
        metadata,
        true // Default to GDPR compliance
      );

      this.metricsService.incrementCounter('visitors_created');
      return visitor;
    } catch (error) {
      this.metricsService.incrementCounter('visitor_creation_errors');
      throw createError(
        error.message,
        ErrorCodes.BAD_REQUEST,
        ErrorTypes.VALIDATION_ERROR,
        { metadata: error.details }
      );
    } finally {
      timer.end();
    }
  }

  /**
   * Retrieves visitor details with caching and security checks
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get visitor by ID' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Visitor retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Visitor not found' })
  async getVisitor(@Param('id') id: string): Promise<IVisitor> {
    const timer = this.metricsService.startTimer('visitor_retrieval');
    try {
      const visitor = await this.visitorService.getVisitor(id);
      if (!visitor) {
        throw createError(
          'Visitor not found',
          ErrorCodes.NOT_FOUND,
          ErrorTypes.RESOURCE_ERROR
        );
      }
      return visitor;
    } finally {
      timer.end();
    }
  }

  /**
   * Lists company visitors with pagination and filtering
   */
  @Get()
  @ApiOperation({ summary: 'List company visitors' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: VISITOR_STATUS })
  async getCompanyVisitors(
    @Query('companyId') companyId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: VISITOR_STATUS
  ): Promise<{ visitors: IVisitor[]; total: number }> {
    const timer = this.metricsService.startTimer('visitors_list');
    try {
      return await this.visitorService.getCompanyVisitors(companyId, {
        page,
        limit,
        status
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Updates visitor data with validation and security checks
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update visitor data' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Visitor updated successfully' })
  async updateVisitor(
    @Param('id') id: string,
    @Body() updateData: Partial<IVisitor>
  ): Promise<IVisitor> {
    const timer = this.metricsService.startTimer('visitor_update');
    try {
      if (updateData.metadata) {
        await validateVisitorMetadata(updateData.metadata);
      }
      return await this.visitorService.updateVisitor(id, updateData);
    } finally {
      timer.end();
    }
  }

  /**
   * Tracks visitor activity with performance optimization
   */
  @Post(':id/activity')
  @RateLimit({ ttl: 60, limit: 200 })
  @ApiOperation({ summary: 'Track visitor activity' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async trackActivity(
    @Param('id') id: string,
    @Body() activityData: Record<string, any>
  ): Promise<void> {
    const timer = this.metricsService.startTimer('activity_tracking');
    try {
      await this.visitorService.trackActivity(id, {
        type: activityData.type,
        timestamp: new Date(),
        data: activityData.data
      });
    } finally {
      timer.end();
    }
  }

  /**
   * Enriches visitor data with additional information
   */
  @Post(':id/enrich')
  @ApiOperation({ summary: 'Enrich visitor data' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async enrichVisitorData(
    @Param('id') id: string,
    @Body() enrichedData: IEnrichedData
  ): Promise<IVisitor> {
    const timer = this.metricsService.startTimer('visitor_enrichment');
    try {
      await validateEnrichedData(enrichedData);
      return await this.visitorService.enrichVisitorData(id, enrichedData);
    } finally {
      timer.end();
    }
  }

  /**
   * Deletes visitor data with GDPR compliance
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete visitor data' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Visitor deleted successfully' })
  async deleteVisitor(@Param('id') id: string): Promise<void> {
    const timer = this.metricsService.startTimer('visitor_deletion');
    try {
      await this.visitorService.deleteVisitor(id);
    } finally {
      timer.end();
    }
  }
}