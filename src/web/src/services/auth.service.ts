/**
 * Authentication Service for Identity Matrix Web Application
 * @version 1.0.0
 * @description Implements secure user authentication with OAuth 2.0 + PKCE, token management,
 * and session validation according to NIST 800-63B requirements
 */

// External imports
import { AxiosResponse } from 'axios'; // axios@1.x
import jwtDecode from 'jwt-decode'; // jwt-decode@3.x
import CryptoJS from 'crypto-js'; // crypto-js@4.x

// Internal imports
import ApiService from './api.service';
import { 
  AuthCredentials, 
  RegistrationData, 
  AuthResponse,
  PKCEVerifier,
  PKCEChallenge,
  AuthTokens
} from '../types/auth.types';
import { API_ENDPOINTS } from '../constants/api.constants';

// Constants for token and session management
const TOKEN_STORAGE_KEY = 'auth_tokens_encrypted';
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token_encrypted';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Singleton Authentication Service with enhanced security features
 */
class AuthService {
  private static instance: AuthService;
  private apiService = ApiService.instance;
  private tokenRefreshTimeout?: NodeJS.Timeout;
  private sessionTimeout?: NodeJS.Timeout;
  private lastActivity: Date = new Date();
  private encryptionKey: string;

  private constructor() {
    // Generate unique encryption key for token storage
    this.encryptionKey = CryptoJS.lib.WordArray.random(256/8).toString();
    this.initializeSession();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize session monitoring
   */
  private initializeSession(): void {
    window.addEventListener('mousemove', () => this.updateLastActivity());
    window.addEventListener('keypress', () => this.updateLastActivity());
    this.checkStoredSession();
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this.lastActivity = new Date();
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    this.sessionTimeout = setTimeout(() => this.handleSessionTimeout(), SESSION_TIMEOUT);
  }

  /**
   * Handle session timeout
   */
  private async handleSessionTimeout(): Promise<void> {
    await this.logout();
    window.location.href = '/login?reason=session_timeout';
  }

  /**
   * Generate PKCE challenge pair
   */
  private generatePKCEPair(): { verifier: PKCEVerifier; challenge: PKCEChallenge } {
    const verifier = CryptoJS.lib.WordArray.random(32).toString();
    const challenge = CryptoJS.SHA256(verifier).toString(CryptoJS.enc.Base64url);
    return { verifier, challenge };
  }

  /**
   * Encrypt sensitive data
   */
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Store encrypted tokens
   */
  private storeTokens(tokens: AuthTokens): void {
    const encryptedTokens = this.encrypt(JSON.stringify(tokens));
    localStorage.setItem(TOKEN_STORAGE_KEY, encryptedTokens);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, this.encrypt(tokens.refreshToken));
  }

  /**
   * Setup token refresh mechanism
   */
  private setupTokenRefresh(tokens: AuthTokens): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    const decodedToken: any = jwtDecode(tokens.accessToken);
    const expiresIn = (decodedToken.exp * 1000) - Date.now() - TOKEN_REFRESH_MARGIN;

    this.tokenRefreshTimeout = setTimeout(
      async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
          await this.logout();
        }
      },
      Math.max(0, expiresIn)
    );
  }

  /**
   * Authenticate user with credentials
   */
  public async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const { verifier, challenge } = this.generatePKCEPair();
      
      const response: AxiosResponse<AuthResponse> = await this.apiService.post(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          ...credentials,
          codeChallenge: challenge,
          codeChallengeMethod: 'S256'
        }
      );

      const { user, tokens } = response.data;
      
      this.storeTokens(tokens);
      this.setupTokenRefresh(tokens);
      this.updateLastActivity();
      
      ApiService.instance.setAuthToken(tokens.accessToken, tokens.refreshToken);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register new user and company
   */
  public async register(data: RegistrationData): Promise<AuthResponse> {
    try {
      const { verifier, challenge } = this.generatePKCEPair();
      
      const response: AxiosResponse<AuthResponse> = await this.apiService.post(
        API_ENDPOINTS.AUTH.REGISTER,
        {
          ...data,
          codeChallenge: challenge,
          codeChallengeMethod: 'S256'
        }
      );

      const { user, tokens } = response.data;
      
      this.storeTokens(tokens);
      this.setupTokenRefresh(tokens);
      this.updateLastActivity();
      
      ApiService.instance.setAuthToken(tokens.accessToken, tokens.refreshToken);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   */
  public async refreshToken(): Promise<AuthResponse> {
    try {
      const encryptedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (!encryptedRefreshToken) {
        throw new Error('No refresh token found');
      }

      const refreshToken = this.decrypt(encryptedRefreshToken);
      const { verifier, challenge } = this.generatePKCEPair();

      const response: AxiosResponse<AuthResponse> = await this.apiService.post(
        API_ENDPOINTS.AUTH.REFRESH,
        {
          refreshToken,
          codeChallenge: challenge,
          codeChallengeMethod: 'S256'
        }
      );

      const { tokens } = response.data;
      
      this.storeTokens(tokens);
      this.setupTokenRefresh(tokens);
      
      ApiService.instance.setAuthToken(tokens.accessToken, tokens.refreshToken);
      
      return response.data;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  /**
   * Logout user and cleanup
   */
  public async logout(): Promise<void> {
    try {
      await this.apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }
      if (this.sessionTimeout) {
        clearTimeout(this.sessionTimeout);
      }
      
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      
      ApiService.instance.removeAuthToken();
    }
  }

  /**
   * Validate current session
   */
  public async validateSession(): Promise<boolean> {
    try {
      const encryptedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!encryptedTokens) {
        return false;
      }

      const tokens: AuthTokens = JSON.parse(this.decrypt(encryptedTokens));
      const decodedToken: any = jwtDecode(tokens.accessToken);
      
      if (Date.now() >= decodedToken.exp * 1000) {
        await this.refreshToken();
      }

      const timeSinceLastActivity = Date.now() - this.lastActivity.getTime();
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      await this.logout();
      return false;
    }
  }
}

// Export singleton instance
export default AuthService.getInstance();