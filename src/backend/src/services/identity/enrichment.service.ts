/**
 * @fileoverview Service responsible for enriching visitor data with company and professional information
 * Implements data enrichment through third-party providers and internal algorithms
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IVisitor, IEnrichedData } from '../../interfaces/visitor.interface';
import { VISITOR_STATUS } from '../../constants/visitor.constants';
import { ConfigService } from '@nestjs/config';

/**
 * Configuration interface for enrichment providers
 */
interface IEnrichmentProvider {
  name: string;
  baseUrl: string;
  apiKey: string;
  priority: number;
  timeout: number;
}

/**
 * Service handling visitor data enrichment through multiple data providers
 * Implements enterprise-grade enrichment capabilities with fallback and retry mechanisms
 */
@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);
  private readonly providers: IEnrichmentProvider[];
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // milliseconds

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.providers = this.initializeProviders();
    this.logger.log('Enrichment service initialized with configured providers');
  }

  /**
   * Enriches visitor data with company and professional information
   * @param visitor - Visitor object to be enriched
   * @returns Promise resolving to enriched visitor data
   * @throws Error if enrichment fails after all retries
   */
  public async enrichVisitorData(visitor: IVisitor): Promise<IVisitor> {
    try {
      this.logger.debug(`Starting enrichment process for visitor ${visitor.id}`);

      if (!visitor.email) {
        throw new Error('Visitor email is required for enrichment');
      }

      const enrichedData = await this.queryEnrichmentProviders(visitor.email);
      
      const updatedVisitor: IVisitor = {
        ...visitor,
        enrichedData,
        status: VISITOR_STATUS.ENRICHED,
        lastEnriched: new Date()
      };

      this.logger.debug(`Enrichment completed for visitor ${visitor.id}`);
      return updatedVisitor;
    } catch (error) {
      this.logger.error(`Enrichment failed for visitor ${visitor.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Queries configured third-party providers for enrichment data
   * Implements parallel requests with fallback mechanism
   * @param email - Email address to query
   * @returns Promise resolving to normalized enriched data
   */
  private async queryEnrichmentProviders(email: string): Promise<IEnrichedData> {
    const enrichmentPromises = this.providers.map(provider =>
      this.queryProviderWithRetry(provider, email)
    );

    const results = await Promise.allSettled(enrichmentPromises);
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    if (successfulResults.length === 0) {
      throw new Error('All enrichment providers failed');
    }

    return this.normalizeEnrichedData(successfulResults);
  }

  /**
   * Queries a single provider with retry mechanism
   * @param provider - Provider configuration
   * @param email - Email to query
   * @returns Promise resolving to provider-specific response
   */
  private async queryProviderWithRetry(
    provider: IEnrichmentProvider,
    email: string,
    attempt = 1
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${provider.baseUrl}/enrich`, {
          params: { email },
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: provider.timeout
        })
      );
      return response.data;
    } catch (error) {
      if (attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.queryProviderWithRetry(provider, email, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Normalizes enriched data from different providers into standard format
   * @param rawData - Array of provider responses
   * @returns Normalized enriched data structure
   */
  private normalizeEnrichedData(rawData: any[]): IEnrichedData {
    const mergedData = rawData.reduce((acc, curr) => ({ ...acc, ...curr }), {});

    return {
      company: mergedData.company_name || mergedData.organization || '',
      title: mergedData.job_title || mergedData.position || '',
      industry: mergedData.industry || '',
      size: mergedData.company_size || mergedData.employees || '',
      revenue: mergedData.annual_revenue || '',
      website: mergedData.company_website || mergedData.domain || '',
      technologies: Array.isArray(mergedData.technologies) ? mergedData.technologies : [],
      linkedinUrl: mergedData.linkedin_company_url || '',
      socialProfiles: this.normalizeSocialProfiles(mergedData),
      customFields: this.extractCustomFields(mergedData)
    };
  }

  /**
   * Normalizes social profile URLs from provider data
   * @param data - Raw provider data
   * @returns Normalized social profile URLs
   */
  private normalizeSocialProfiles(data: any): Record<string, string> {
    return {
      linkedin: data.linkedin_url || '',
      twitter: data.twitter_url || '',
      facebook: data.facebook_url || '',
      ...Object.entries(data)
        .filter(([key, value]) => key.includes('_url') && typeof value === 'string')
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key.replace('_url', '')]: value
        }), {})
    };
  }

  /**
   * Extracts additional custom fields from provider data
   * @param data - Raw provider data
   * @returns Custom fields object
   */
  private extractCustomFields(data: any): Record<string, any> {
    const standardFields = new Set([
      'company_name', 'job_title', 'industry', 'company_size',
      'annual_revenue', 'company_website', 'technologies', 'linkedin_company_url'
    ]);

    return Object.entries(data)
      .filter(([key]) => !standardFields.has(key))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  /**
   * Initializes enrichment providers from configuration
   * @returns Array of configured providers
   */
  private initializeProviders(): IEnrichmentProvider[] {
    const providersConfig = this.configService.get<IEnrichmentProvider[]>('enrichment.providers');
    
    if (!providersConfig || providersConfig.length === 0) {
      this.logger.warn('No enrichment providers configured');
      return [];
    }

    return providersConfig.sort((a, b) => a.priority - b.priority);
  }
}