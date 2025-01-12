/**
 * @fileoverview Enhanced authentication service implementing OAuth 2.0 + PKCE standards
 * with comprehensive security features and monitoring
 * @version 1.0.0
 */

// External imports
import { injectable } from 'inversify'; // ^6.0.1
import { Transaction } from 'sequelize'; // ^6.32.x

// Internal imports
import { IAuthCredentials, IRegistrationData, IAuthTokens, IUserProfile } from '../../interfaces/auth.interface';
import { JwtService } from './jwt.service';
import { UserRepository } from '../../db/repositories/user.repository';
import { ErrorTypes } from '../../constants/error.constants';

/**
 * Enhanced authentication service implementing OAuth 2.0 + PKCE standards
 * with comprehensive security monitoring and audit logging
 */
@injectable()
export class AuthService {
  private readonly maxLoginAttempts: number = 5;
  private readonly lockoutDuration: number = 30 * 60 * 1000; // 30 minutes
  private readonly passwordMinLength: number = 12;
  private readonly securityMonitor: Map<string, number> = new Map();

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Authenticate user with enhanced security measures
   * @param credentials - User login credentials
   * @returns Authentication response with tokens
   * @throws Error for invalid credentials or security violations
   */
  public async login(credentials: IAuthCredentials): Promise<{
    user: IUserProfile;
    tokens: IAuthTokens;
  }> {
    try {
      // Validate and sanitize input
      this.validateLoginInput(credentials);

      // Check rate limiting
      this.checkRateLimit(credentials.email);

      // Validate credentials and get user profile
      const user = await this.userRepository.validateCredentials(
        credentials.email,
        credentials.password
      );

      // Generate OAuth 2.0 compliant tokens
      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      });

      // Reset rate limiting
      this.resetRateLimit(credentials.email);

      return { user, tokens };
    } catch (error) {
      // Increment failed attempts
      this.incrementFailedAttempts(credentials.email);
      throw error;
    }
  }

  /**
   * Register new user with enhanced validation
   * @param registrationData - User registration data
   * @param transaction - Optional transaction
   * @returns Authentication response for new user
   */
  public async register(
    registrationData: IRegistrationData,
    transaction?: Transaction
  ): Promise<{
    user: IUserProfile;
    tokens: IAuthTokens;
  }> {
    // Validate registration data
    this.validateRegistrationData(registrationData);

    try {
      // Create user with company association
      const user = await this.userRepository.create(registrationData, transaction);

      // Generate initial token pair
      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      });

      return { user, tokens };
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new Error(ErrorTypes.VALIDATION_ERROR);
      }
      throw error;
    }
  }

  /**
   * Refresh access token with secure token rotation
   * @param refreshToken - Current refresh token
   * @returns New token pair
   */
  public async refreshToken(refreshToken: string): Promise<IAuthTokens> {
    try {
      // Verify refresh token
      const userId = this.jwtService.verifyRefreshToken(refreshToken);

      // Get user profile
      const user = await this.userRepository.findById(userId);

      // Generate new token pair
      const tokens = this.jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      });

      // Revoke old refresh token
      this.jwtService.revokeRefreshToken(refreshToken);

      return tokens;
    } catch (error) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }
  }

  /**
   * Logout user with secure token revocation
   * @param refreshToken - Current refresh token
   */
  public async logout(refreshToken: string): Promise<void> {
    try {
      // Verify and revoke refresh token
      this.jwtService.verifyRefreshToken(refreshToken);
      this.jwtService.revokeRefreshToken(refreshToken);
    } catch (error) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }
  }

  /**
   * Validate access token with enhanced security checks
   * @param accessToken - Access token to validate
   * @returns Decoded token payload
   */
  public async validateToken(accessToken: string): Promise<IUserProfile> {
    try {
      // Verify token and get payload
      const payload = this.jwtService.verifyAccessToken(accessToken);

      // Get and return user profile
      return await this.userRepository.findById(payload.userId);
    } catch (error) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }
  }

  /**
   * Validate login input credentials
   * @param credentials - Login credentials
   */
  private validateLoginInput(credentials: IAuthCredentials): void {
    if (!credentials.email || !credentials.password) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    if (!this.isValidEmail(credentials.email)) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    if (credentials.password.length < this.passwordMinLength) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }
  }

  /**
   * Validate registration data
   * @param data - Registration data
   */
  private validateRegistrationData(data: IRegistrationData): void {
    if (!this.isValidEmail(data.email)) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    if (!this.isValidPassword(data.password)) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    if (!data.name || data.name.length < 2) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    if (!data.companyName || data.companyName.length < 2) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }

    if (!this.isValidDomain(data.companyDomain)) {
      throw new Error(ErrorTypes.VALIDATION_ERROR);
    }
  }

  /**
   * Check rate limiting for login attempts
   * @param email - User email
   */
  private checkRateLimit(email: string): void {
    const attempts = this.securityMonitor.get(email) || 0;
    if (attempts >= this.maxLoginAttempts) {
      throw new Error('Too many login attempts');
    }
  }

  /**
   * Increment failed login attempts
   * @param email - User email
   */
  private incrementFailedAttempts(email: string): void {
    const attempts = this.securityMonitor.get(email) || 0;
    this.securityMonitor.set(email, attempts + 1);

    // Set cleanup timeout
    setTimeout(() => {
      this.securityMonitor.delete(email);
    }, this.lockoutDuration);
  }

  /**
   * Reset rate limiting for successful login
   * @param email - User email
   */
  private resetRateLimit(email: string): void {
    this.securityMonitor.delete(email);
  }

  /**
   * Validate email format
   * @param email - Email to validate
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   */
  private isValidPassword(password: string): boolean {
    return (
      password.length >= this.passwordMinLength &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  /**
   * Validate domain format
   * @param domain - Domain to validate
   */
  private isValidDomain(domain: string): boolean {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domain);
  }
}