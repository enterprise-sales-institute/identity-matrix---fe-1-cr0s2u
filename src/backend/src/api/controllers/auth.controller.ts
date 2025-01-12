/**
 * @fileoverview Authentication controller implementing secure REST endpoints with OAuth 2.0 + PKCE
 * Includes comprehensive security measures, request validation, and audit logging
 * @version 1.0.0
 */

// External imports
import { injectable } from 'inversify'; // ^6.0.1
import { Request, Response } from 'express'; // ^4.18.x
import { controller, httpPost } from 'inversify-express-utils'; // ^6.4.x
import helmet from 'helmet'; // ^7.0.0
import winston from 'winston'; // ^3.8.x
import RateLimiter from 'express-rate-limit'; // ^6.7.0

// Internal imports
import { AuthService } from '../../services/auth/auth.service';
import { 
  validateLoginRequest, 
  validateRegistrationRequest, 
  validateRefreshTokenRequest 
} from '../validators/auth.validator';
import { ErrorTypes } from '../../constants/error.constants';
import { formatError } from '../../utils/error.util';

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_REGISTRATION_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

/**
 * Enhanced authentication controller implementing OAuth 2.0 + PKCE standards
 * with comprehensive security measures and audit logging
 */
@injectable()
@controller('/auth')
export class AuthController {
  private readonly logger: winston.Logger;
  private readonly loginLimiter: RateLimiter;
  private readonly registrationLimiter: RateLimiter;

  constructor(
    private readonly authService: AuthService
  ) {
    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'auth-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'auth-combined.log' })
      ]
    });

    // Configure rate limiters
    this.loginLimiter = new RateLimiter({
      windowMs: RATE_LIMIT_WINDOW,
      max: MAX_LOGIN_ATTEMPTS,
      message: 'Too many login attempts, please try again later'
    });

    this.registrationLimiter = new RateLimiter({
      windowMs: RATE_LIMIT_WINDOW,
      max: MAX_REGISTRATION_ATTEMPTS,
      message: 'Too many registration attempts, please try again later'
    });
  }

  /**
   * Handles user login with enhanced security measures
   * @param req - Express request object containing login credentials
   * @param res - Express response object
   * @returns Authentication response with tokens
   */
  @httpPost('/login')
  public async login(req: Request, res: Response): Promise<Response> {
    try {
      // Apply rate limiting
      await this.loginLimiter(req, res, () => {});

      // Validate and sanitize request data
      const validationResult = await validateLoginRequest(req.body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: ErrorTypes.VALIDATION_ERROR,
          details: validationResult.validationErrors
        });
      }

      // Attempt authentication
      const { user, tokens } = await this.authService.login(validationResult.data!);

      // Set secure cookie with refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set security headers
      res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });

      // Audit successful login
      this.logger.info('Successful login', {
        userId: user.id,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      return res.status(200).json({
        user,
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn
      });
    } catch (error) {
      // Audit failed login attempt
      this.logger.error('Login failed', {
        error: error.message,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      return res.status(401).json(formatError(error));
    }
  }

  /**
   * Handles new user registration with security validation
   * @param req - Express request object containing registration data
   * @param res - Express response object
   * @returns Registration response with tokens
   */
  @httpPost('/register')
  public async register(req: Request, res: Response): Promise<Response> {
    try {
      // Apply rate limiting
      await this.registrationLimiter(req, res, () => {});

      // Validate and sanitize registration data
      const validationResult = await validateRegistrationRequest(req.body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: ErrorTypes.VALIDATION_ERROR,
          details: validationResult.validationErrors
        });
      }

      // Attempt registration
      const { user, tokens } = await this.authService.register(validationResult.data!);

      // Set secure cookie with refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set security headers
      res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });

      // Audit successful registration
      this.logger.info('Successful registration', {
        userId: user.id,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      return res.status(201).json({
        user,
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn
      });
    } catch (error) {
      // Audit failed registration
      this.logger.error('Registration failed', {
        error: error.message,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });

      return res.status(400).json(formatError(error));
    }
  }

  /**
   * Handles access token refresh with security validation
   * @param req - Express request object containing refresh token
   * @param res - Express response object
   * @returns New token pair
   */
  @httpPost('/refresh')
  public async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      // Get refresh token from secure cookie
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
      }

      // Validate refresh token
      const validationResult = await validateRefreshTokenRequest({ refreshToken });
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: ErrorTypes.VALIDATION_ERROR,
          details: validationResult.validationErrors
        });
      }

      // Generate new token pair
      const tokens = await this.authService.refreshToken(refreshToken);

      // Update secure cookie with new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Set security headers
      res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      });

      return res.status(200).json({
        accessToken: tokens.accessToken,
        tokenType: tokens.tokenType,
        expiresIn: tokens.expiresIn
      });
    } catch (error) {
      return res.status(401).json(formatError(error));
    }
  }

  /**
   * Handles user logout with secure token revocation
   * @param req - Express request object
   * @param res - Express response object
   * @returns Logout confirmation
   */
  @httpPost('/logout')
  public async logout(req: Request, res: Response): Promise<Response> {
    try {
      // Get refresh token from secure cookie
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        // Revoke refresh token
        await this.authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // Set security headers
      res.set({
        'Clear-Site-Data': '"cache", "cookies", "storage"',
        'X-Content-Type-Options': 'nosniff'
      });

      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      return res.status(400).json(formatError(error));
    }
  }
}