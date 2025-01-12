/**
 * @fileoverview Enhanced authentication middleware implementing OAuth 2.0 + PKCE standards
 * with comprehensive security features including token validation, RBAC, and audit logging
 * @version 1.0.0
 */

// External imports
import { Request, Response, NextFunction } from 'express'; // v4.18.x
import rateLimit from 'express-rate-limit'; // v6.x

// Internal imports
import { IJwtPayload, UserRole } from '../../interfaces/auth.interface';
import JwtService from '../../services/auth/jwt.service';
import { ErrorTypes } from '../../constants/error.constants';

// Initialize JWT service
const jwtService = new JwtService();

// Configure rate limiting for authentication attempts
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: ErrorTypes.RATE_LIMIT_ERROR, message: 'Too many authentication attempts' }
});

/**
 * Extended Request interface to include authenticated user and company info
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    companyId: string;
  };
}

/**
 * Enhanced authentication middleware for validating JWT tokens
 * Implements comprehensive security checks and audit logging
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }

    // Verify token validity and extract payload
    const decodedToken = await jwtService.verifyAccessToken(token);

    // Check if token is blacklisted
    if (await jwtService.isTokenBlacklisted(token)) {
      throw new Error(ErrorTypes.TOKEN_BLACKLISTED);
    }

    // Validate token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < currentTime) {
      throw new Error(ErrorTypes.TOKEN_EXPIRED);
    }

    // Attach user and company info to request
    req.user = {
      id: decodedToken.userId,
      role: decodedToken.role,
      companyId: decodedToken.companyId
    };

    // Log successful authentication for audit
    console.info(`User ${decodedToken.userId} authenticated successfully`);

    next();
  } catch (error: any) {
    const errorResponse = {
      error: error.message || ErrorTypes.AUTHENTICATION_ERROR,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };

    res.status(401).json(errorResponse);
  }
};

/**
 * Role hierarchy mapping for authorization checks
 */
const roleHierarchy: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.MANAGER, UserRole.MEMBER, UserRole.VIEWER],
  [UserRole.MANAGER]: [UserRole.MANAGER, UserRole.MEMBER, UserRole.VIEWER],
  [UserRole.MEMBER]: [UserRole.MEMBER, UserRole.VIEWER],
  [UserRole.VIEWER]: [UserRole.VIEWER]
};

/**
 * Enhanced authorization middleware factory for role-based access control
 * Supports role hierarchy and company-specific validation
 */
export const authorize = (allowedRoles: UserRole[], requireCompanyMatch: boolean = true) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
      }

      // Check if user's role is in the allowed roles hierarchy
      const hasPermission = allowedRoles.some(role => 
        roleHierarchy[user.role].includes(role)
      );

      if (!hasPermission) {
        throw new Error(ErrorTypes.AUTHORIZATION_ERROR);
      }

      // Validate company context if required
      if (requireCompanyMatch && req.params.companyId && req.params.companyId !== user.companyId) {
        throw new Error(ErrorTypes.AUTHORIZATION_ERROR);
      }

      // Log authorization check for audit
      console.info(`User ${user.id} authorized for role ${user.role}`);

      next();
    } catch (error: any) {
      const errorResponse = {
        error: error.message || ErrorTypes.AUTHORIZATION_ERROR,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      };

      res.status(403).json(errorResponse);
    }
  };
};

/**
 * Helper function to check if a role has required permissions
 */
const hasRequiredRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return roleHierarchy[userRole].includes(requiredRole);
};

/**
 * Middleware for refreshing tokens
 * Implements token rotation for enhanced security
 */
export const refreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new Error(ErrorTypes.AUTHENTICATION_ERROR);
    }

    // Verify and refresh token
    const newTokens = await jwtService.refreshToken(refreshToken);
    res.json(newTokens);
  } catch (error: any) {
    const errorResponse = {
      error: error.message || ErrorTypes.AUTHENTICATION_ERROR,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };

    res.status(401).json(errorResponse);
  }
};