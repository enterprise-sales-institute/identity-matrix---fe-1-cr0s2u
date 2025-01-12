/**
 * @fileoverview Enhanced JWT service implementing OAuth 2.0 + PKCE standards with RS256 algorithm
 * @version 1.0.0
 */

// External imports
import * as jwt from 'jsonwebtoken'; // v9.x
import * as crypto from 'crypto'; // v18.x

// Internal imports
import { IJwtPayload, IAuthTokens } from '../../interfaces/auth.interface';
import { ErrorTypes } from '../../constants/error.constants';

/**
 * Enhanced JWT service implementing OAuth 2.0 + PKCE standards with comprehensive security features
 */
export class JwtService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessTokenExpiry: number = 15 * 60; // 15 minutes
  private readonly refreshTokenExpiry: number = 7 * 24 * 60 * 60; // 7 days
  private readonly tokenBlacklist: Map<string, number> = new Map();
  private readonly tokenVersions: Map<string, number> = new Map();

  constructor() {
    // Load RS256 keys from secure storage
    this.privateKey = process.env.JWT_PRIVATE_KEY!;
    this.publicKey = process.env.JWT_PUBLIC_KEY!;

    // Validate key presence
    if (!this.privateKey || !this.publicKey) {
      throw new Error('JWT keys not configured');
    }

    // Set up token cleanup interval
    setInterval(() => this.cleanupBlacklist(), 3600000); // Cleanup every hour
  }

  /**
   * Generates a secure JWT access token using RS256 algorithm
   * @param payload - Token payload containing user information
   * @returns Signed JWT access token
   */
  public generateAccessToken(payload: Omit<IJwtPayload, 'tokenVersion' | 'issuedAt' | 'expiresAt'>): string {
    const tokenVersion = this.getTokenVersion(payload.userId);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + this.accessTokenExpiry;

    const tokenPayload: IJwtPayload = {
      ...payload,
      tokenVersion,
      issuedAt,
      expiresAt
    };

    return jwt.sign(tokenPayload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.accessTokenExpiry
    });
  }

  /**
   * Generates a secure refresh token with enhanced security features
   * @param userId - User identifier for token association
   * @returns Signed refresh token
   */
  public generateRefreshToken(userId: string): string {
    const tokenVersion = this.getTokenVersion(userId);
    const payload = {
      userId,
      tokenVersion,
      type: 'refresh',
      issuedAt: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.refreshTokenExpiry
    });
  }

  /**
   * Generates a pair of access and refresh tokens
   * @param payload - User payload for token generation
   * @returns OAuth 2.0 compliant token response
   */
  public generateTokenPair(payload: Omit<IJwtPayload, 'tokenVersion' | 'issuedAt' | 'expiresAt'>): IAuthTokens {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.userId);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiry
    };
  }

  /**
   * Verifies and decodes a JWT access token
   * @param token - JWT access token to verify
   * @returns Decoded token payload
   */
  public verifyAccessToken(token: string): IJwtPayload {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256']
      }) as IJwtPayload;

      // Validate token version
      if (!this.validateTokenVersion(decoded.userId, decoded.tokenVersion)) {
        throw new Error(ErrorTypes.TOKEN_INVALID);
      }

      // Check if token is blacklisted
      if (this.isTokenBlacklisted(token)) {
        throw new Error(ErrorTypes.TOKEN_REVOKED);
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(ErrorTypes.TOKEN_EXPIRED);
      }
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }
  }

  /**
   * Verifies and decodes a refresh token
   * @param token - Refresh token to verify
   * @returns User ID from token if valid
   */
  public verifyRefreshToken(token: string): string {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256']
      }) as { userId: string; tokenVersion: number };

      if (!this.validateTokenVersion(decoded.userId, decoded.tokenVersion)) {
        throw new Error(ErrorTypes.TOKEN_INVALID);
      }

      return decoded.userId;
    } catch (error) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }
  }

  /**
   * Revokes a refresh token by adding it to the blacklist
   * @param token - Token to revoke
   */
  public revokeRefreshToken(token: string): void {
    const decoded = jwt.decode(token) as { exp: number };
    if (decoded?.exp) {
      this.tokenBlacklist.set(token, decoded.exp);
    }
  }

  /**
   * Rotates token version for a user, invalidating all existing tokens
   * @param userId - User identifier
   */
  public rotateTokenVersion(userId: string): void {
    const currentVersion = this.tokenVersions.get(userId) || 0;
    this.tokenVersions.set(userId, currentVersion + 1);
  }

  /**
   * Gets current token version for a user
   * @param userId - User identifier
   * @returns Current token version
   */
  private getTokenVersion(userId: string): number {
    return this.tokenVersions.get(userId) || 0;
  }

  /**
   * Validates token version against stored version
   * @param userId - User identifier
   * @param tokenVersion - Version to validate
   * @returns Validation result
   */
  private validateTokenVersion(userId: string, tokenVersion: number): boolean {
    return this.getTokenVersion(userId) === tokenVersion;
  }

  /**
   * Checks if a token is blacklisted
   * @param token - Token to check
   * @returns Blacklist status
   */
  private isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  /**
   * Cleans up expired tokens from blacklist
   */
  private cleanupBlacklist(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [token, expiry] of this.tokenBlacklist.entries()) {
      if (expiry < now) {
        this.tokenBlacklist.delete(token);
      }
    }
  }
}