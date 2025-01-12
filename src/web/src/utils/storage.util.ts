/**
 * @fileoverview Secure browser storage utility with encryption for Identity Matrix
 * @version 1.0.0
 * @license MIT
 */

import { AES, lib, mode, pad, enc } from 'crypto-js'; // v4.1.x
import { AuthTokens } from '../types/auth.types';

// Storage keys constants
const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LAST_VISITED: 'last_visited',
  STORAGE_VERSION: 'storage_version'
} as const;

// Environment variables validation
if (!process.env.REACT_APP_STORAGE_ENCRYPTION_KEY) {
  throw new Error('Storage encryption key is not configured');
}

const ENCRYPTION_KEY = process.env.REACT_APP_STORAGE_ENCRYPTION_KEY;
const STORAGE_VERSION = '1.0';

// Type for encrypted data structure
interface EncryptedData {
  data: string;
  iv: string;
  version: string;
}

/**
 * Securely stores an encrypted item in localStorage with type safety
 * @template T - Type of value being stored
 * @param {string} key - Storage key
 * @param {T} value - Value to store
 * @throws {Error} If storage quota is exceeded or encryption fails
 */
export function setItem<T>(key: string, value: T): void {
  try {
    if (!key) throw new Error('Storage key is required');
    if (value === undefined) throw new Error('Value is required');

    // Generate random IV for encryption
    const iv = lib.WordArray.random(16);
    const jsonValue = JSON.stringify(value);

    // Encrypt data with AES-256-CBC
    const encrypted = AES.encrypt(jsonValue, ENCRYPTION_KEY, {
      iv: iv,
      mode: mode.CBC,
      padding: pad.Pkcs7
    });

    const encryptedData: EncryptedData = {
      data: encrypted.toString(),
      iv: iv.toString(),
      version: STORAGE_VERSION
    };

    localStorage.setItem(key, JSON.stringify(encryptedData));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded');
    }
    throw error;
  } finally {
    // Clear sensitive data from memory
    (iv as any) = null;
    (jsonValue as any) = null;
    (encrypted as any) = null;
  }
}

/**
 * Retrieves and decrypts an item from localStorage with type checking
 * @template T - Expected type of stored value
 * @param {string} key - Storage key
 * @returns {T | null} Decrypted value or null if not found
 * @throws {Error} If decryption fails or data is invalid
 */
export function getItem<T>(key: string): T | null {
  try {
    if (!key) throw new Error('Storage key is required');

    const storedData = localStorage.getItem(key);
    if (!storedData) return null;

    const encryptedData: EncryptedData = JSON.parse(storedData);
    if (encryptedData.version !== STORAGE_VERSION) {
      throw new Error('Storage version mismatch');
    }

    const iv = enc.Hex.parse(encryptedData.iv);
    const decrypted = AES.decrypt(encryptedData.data, ENCRYPTION_KEY, {
      iv: iv,
      mode: mode.CBC,
      padding: pad.Pkcs7
    });

    const decryptedText = decrypted.toString(enc.Utf8);
    if (!decryptedText) return null;

    return JSON.parse(decryptedText) as T;
  } catch (error) {
    console.error('Failed to retrieve stored item:', error);
    return null;
  } finally {
    // Clear sensitive data
    (iv as any) = null;
    (decrypted as any) = null;
    (decryptedText as any) = null;
  }
}

/**
 * Securely removes an item from localStorage with cleanup
 * @param {string} key - Storage key
 */
export function removeItem(key: string): void {
  if (!key) throw new Error('Storage key is required');
  localStorage.removeItem(key);
}

/**
 * Securely stores encrypted authentication tokens
 * @param {AuthTokens} tokens - Authentication tokens to store
 * @throws {Error} If tokens are invalid or storage fails
 */
export function setAuthTokens(tokens: AuthTokens): void {
  if (!tokens?.accessToken || !tokens?.refreshToken) {
    throw new Error('Invalid authentication tokens');
  }

  try {
    setItem(STORAGE_KEYS.AUTH_TOKENS, tokens);
    setItem(STORAGE_KEYS.LAST_VISITED, new Date().toISOString());
  } catch (error) {
    console.error('Failed to store auth tokens:', error);
    throw error;
  }
}

/**
 * Retrieves and validates decrypted authentication tokens
 * @returns {AuthTokens | null} Valid auth tokens or null if expired/invalid
 */
export function getAuthTokens(): AuthTokens | null {
  try {
    const tokens = getItem<AuthTokens>(STORAGE_KEYS.AUTH_TOKENS);
    if (!tokens?.accessToken || !tokens?.refreshToken) {
      return null;
    }
    return tokens;
  } catch (error) {
    console.error('Failed to retrieve auth tokens:', error);
    return null;
  }
}

/**
 * Securely clears all application storage data
 */
export function clearStorage(): void {
  try {
    // Clear all storage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Reset storage version
    localStorage.setItem(
      STORAGE_KEYS.STORAGE_VERSION,
      STORAGE_VERSION
    );

    // Dispatch storage cleared event
    window.dispatchEvent(new Event('storage_cleared'));
  } catch (error) {
    console.error('Failed to clear storage:', error);
    throw error;
  }
}

// Export storage keys for external use
export { STORAGE_KEYS };