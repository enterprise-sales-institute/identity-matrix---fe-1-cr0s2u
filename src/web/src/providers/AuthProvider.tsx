/**
 * Authentication Provider Component for Identity Matrix
 * @version 1.0.0
 * @description Provides secure authentication context with session management,
 * token refresh, and performance optimizations according to NIST standards
 */

import { 
  createContext, 
  useContext, 
  ReactNode, 
  FC, 
  useMemo, 
  useCallback, 
  useEffect 
} from 'react'; // v18.x

// Internal imports
import { useAuth } from '../hooks/useAuth';
import { 
  UserProfile, 
  AuthError 
} from '../types/auth.types';

/**
 * Enum for session status tracking
 */
enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  INVALID = 'invalid'
}

/**
 * Interface for authentication context
 */
interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  error: AuthError | null;
  sessionStatus: SessionStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    companyDomain: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  validateSession: () => Promise<boolean>;
}

/**
 * Interface for provider configuration
 */
interface AuthProviderProps {
  children: ReactNode;
  config?: {
    refreshInterval?: number;
    sessionTimeout?: number;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  refreshInterval: 4 * 60 * 1000, // 4 minutes
  sessionTimeout: 30 * 60 * 1000  // 30 minutes
};

/**
 * Create authentication context with null assertion
 */
const AuthContext = createContext<AuthContextType>(null!);

/**
 * Custom hook for consuming auth context with safety checks
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 */
export const AuthProvider: FC<AuthProviderProps> = ({ 
  children, 
  config = DEFAULT_CONFIG 
}) => {
  const {
    isAuthenticated,
    user,
    loading,
    error,
    sessionData,
    login: authLogin,
    register: authRegister,
    logout: authLogout,
    refreshToken: authRefreshToken,
    validateSession: authValidateSession,
    clearError: authClearError
  } = useAuth();

  /**
   * Memoized session status calculation
   */
  const sessionStatus = useMemo(() => {
    if (!isAuthenticated) return SessionStatus.INVALID;
    if (!sessionData?.lastActivity) return SessionStatus.INVALID;

    const lastActivity = new Date(sessionData.lastActivity).getTime();
    const currentTime = Date.now();
    
    return currentTime - lastActivity > config.sessionTimeout!
      ? SessionStatus.EXPIRED
      : SessionStatus.ACTIVE;
  }, [isAuthenticated, sessionData, config.sessionTimeout]);

  /**
   * Enhanced login handler with error management
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      await authLogin({ email, password });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [authLogin]);

  /**
   * Enhanced registration handler with validation
   */
  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    companyDomain: string;
  }) => {
    try {
      await authRegister(data);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [authRegister]);

  /**
   * Secure logout handler with cleanup
   */
  const logout = useCallback(async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout on error
      await authLogout();
    }
  }, [authLogout]);

  /**
   * Token refresh handler with error recovery
   */
  const refreshToken = useCallback(async () => {
    try {
      await authRefreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [authRefreshToken, logout]);

  /**
   * Session validation with automatic refresh
   */
  const validateSession = useCallback(async () => {
    try {
      const isValid = await authValidateSession();
      if (!isValid) {
        await logout();
      }
      return isValid;
    } catch (error) {
      console.error('Session validation failed:', error);
      await logout();
      return false;
    }
  }, [authValidateSession, logout]);

  /**
   * Setup automatic token refresh
   */
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (isAuthenticated && config.refreshInterval) {
      refreshInterval = setInterval(refreshToken, config.refreshInterval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, config.refreshInterval, refreshToken]);

  /**
   * Memoized context value for performance
   */
  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    error,
    sessionStatus,
    login,
    register,
    logout,
    refreshToken,
    clearError: authClearError,
    validateSession
  }), [
    isAuthenticated,
    user,
    loading,
    error,
    sessionStatus,
    login,
    register,
    logout,
    refreshToken,
    authClearError,
    validateSession
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export context for direct usage
export { AuthContext };

// Default export
export default AuthProvider;