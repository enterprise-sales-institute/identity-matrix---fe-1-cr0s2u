import crypto from 'crypto'; // v18.x
import bcrypt from 'bcrypt'; // v5.x
import { ENCRYPTION_CONSTANTS } from '../constants/security.constants';
import { securityConfig } from '../config/security.config';
import { logger } from '../utils/logger.util';

/**
 * Interface for encrypted data structure with metadata
 */
interface IEncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyId: string;
  version: number;
  algorithm: string;
  createdAt: string;
}

/**
 * Interface for crypto operation errors
 */
interface ICryptoError {
  code: string;
  message: string;
  operation: string;
  timestamp: string;
}

/**
 * Validates input data for encryption operations
 * @param data Data to validate
 * @throws Error if validation fails
 */
const validateInput = (data: any): void => {
  if (!data || (typeof data !== 'string' && typeof data !== 'object')) {
    throw new Error('Invalid input data for encryption');
  }
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
};

/**
 * Encrypts sensitive data using AES-256-GCM algorithm
 * @param data Data to encrypt
 * @param options Optional encryption parameters
 * @returns Promise<IEncryptedData> Encrypted data with metadata
 */
export const encrypt = async (
  data: string | object,
  options: { keyId?: string } = {}
): Promise<IEncryptedData> => {
  try {
    validateInput(data);
    
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(ENCRYPTION_CONSTANTS.IV_LENGTH);
    const key = Buffer.from(securityConfig.encryption.key, 'base64');
    
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONSTANTS.ALGORITHM,
      key,
      iv,
      { authTagLength: ENCRYPTION_CONSTANTS.AUTH_TAG_LENGTH }
    );
    
    let encryptedData = cipher.update(stringData, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    const result: IEncryptedData = {
      encryptedData,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyId: options.keyId || 'primary',
      version: 1,
      algorithm: ENCRYPTION_CONSTANTS.ALGORITHM,
      createdAt: new Date().toISOString()
    };
    
    // Clear sensitive data from memory
    key.fill(0);
    return result;
    
  } catch (error) {
    const cryptoError: ICryptoError = {
      code: 'ENCRYPTION_ERROR',
      message: error.message,
      operation: 'encrypt',
      timestamp: new Date().toISOString()
    };
    logger.error('Encryption failed', cryptoError);
    throw error;
  }
};

/**
 * Decrypts data encrypted using AES-256-GCM algorithm
 * @param encryptedData Encrypted data object
 * @returns Promise<string> Decrypted data
 */
export const decrypt = async (encryptedData: IEncryptedData): Promise<string> => {
  try {
    const key = Buffer.from(securityConfig.encryption.key, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      key,
      iv,
      { authTagLength: ENCRYPTION_CONSTANTS.AUTH_TAG_LENGTH }
    );
    
    decipher.setAuthTag(authTag);
    
    let decryptedData = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    
    // Clear sensitive data from memory
    key.fill(0);
    return decryptedData;
    
  } catch (error) {
    const cryptoError: ICryptoError = {
      code: 'DECRYPTION_ERROR',
      message: error.message,
      operation: 'decrypt',
      timestamp: new Date().toISOString()
    };
    logger.error('Decryption failed', cryptoError);
    throw error;
  }
};

/**
 * Hashes password using bcrypt with timing attack protection
 * @param password Password to hash
 * @param options Optional hashing parameters
 * @returns Promise<string> Hashed password
 */
export const hashPassword = async (
  password: string,
  options: { rounds?: number } = {}
): Promise<string> => {
  try {
    const rounds = options.rounds || ENCRYPTION_CONSTANTS.SALT_ROUNDS;
    const salt = await bcrypt.genSalt(rounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Clear sensitive data from memory
    password = '';
    return hashedPassword;
    
  } catch (error) {
    const cryptoError: ICryptoError = {
      code: 'HASH_ERROR',
      message: error.message,
      operation: 'hashPassword',
      timestamp: new Date().toISOString()
    };
    logger.error('Password hashing failed', cryptoError);
    throw error;
  }
};

/**
 * Compares plain text password with hashed password securely
 * @param password Plain text password
 * @param hashedPassword Hashed password to compare against
 * @returns Promise<boolean> True if passwords match
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    
    // Clear sensitive data from memory
    password = '';
    return isMatch;
    
  } catch (error) {
    const cryptoError: ICryptoError = {
      code: 'COMPARE_ERROR',
      message: error.message,
      operation: 'comparePassword',
      timestamp: new Date().toISOString()
    };
    logger.error('Password comparison failed', cryptoError);
    throw error;
  }
};

/**
 * Generates cryptographically secure random key
 * @param length Key length in bytes
 * @param options Optional key generation parameters
 * @returns Promise<Buffer> Generated key buffer
 */
export const generateKey = async (
  length: number = ENCRYPTION_CONSTANTS.KEY_LENGTH,
  options: { encoding?: BufferEncoding } = {}
): Promise<Buffer> => {
  try {
    const key = crypto.randomBytes(length);
    return options.encoding ? Buffer.from(key.toString(options.encoding)) : key;
    
  } catch (error) {
    const cryptoError: ICryptoError = {
      code: 'KEY_GENERATION_ERROR',
      message: error.message,
      operation: 'generateKey',
      timestamp: new Date().toISOString()
    };
    logger.error('Key generation failed', cryptoError);
    throw error;
  }
};