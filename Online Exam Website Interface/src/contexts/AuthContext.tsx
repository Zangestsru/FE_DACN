
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '@/services';
import { STORAGE_KEYS } from '@/constants';
import type { IUser, ILoginRequest, IRegisterRequest } from '@/types';

// ==================== TYPES ====================

/**
 * Auth context state
 */
export interface IAuthContext {
  /** User hiện tại */
  user: IUser | null;
  /** Access token */
  token: string | null;
  /** Đã đăng nhập chưa */
  isAuthenticated: boolean;
  /** Đang load initial auth state */
  loading: boolean;
  /** Cần xác thực OTP */
  needsVerification: boolean;
  /** Login function */
  login: (email: string, password: string) => Promise<void>;
  /** Register function */
  register: (data: IRegisterRequest) => Promise<void>;
  /** Logout function */
  logout: (logoutAll?: boolean) => Promise<void>;
  /** Update user info */
  updateUser: (user: Partial<IUser>) => void;
  /** Refresh user info from localStorage */
  refreshUser: () => void;
}

/**
 * Auth provider props
 */
interface IAuthProviderProps {
  children: ReactNode;
}

// ==================== CONTEXT ====================

/**
 * Auth Context
 */
const AuthContext = createContext<IAuthContext | undefined>(undefined);

// ==================== PROVIDER ====================

/**
 * Auth Provider Component
 * Wrap app với provider này để provide auth state
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  // States
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);

  // Dùng cùng key với AuthService để lắng nghe logoutAll từ tab khác
  const GLOBAL_LOGOUT_KEY = 'GLOBAL_LOGOUT_BROADCAST';

  const performLocalLogout = useCallback(() => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);

    // Clear session storage
    sessionStorage.clear();
  }, []);

  /**
   * Load auth state từ localStorage khi app khởi động
   */
  useEffect(() => {
    const loadAuthState = () => {
      try {
        // Load token
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        
        // Load user info
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid data
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
    const handleLoggedIn = () => loadAuthState();
    const handleLoggedOut = () => loadAuthState();
    window.addEventListener('auth:logged-in', handleLoggedIn);
    window.addEventListener('auth:logged-out', handleLoggedOut);
    return () => {
      window.removeEventListener('auth:logged-in', handleLoggedIn);
      window.removeEventListener('auth:logged-out', handleLoggedOut);
    };
  }, []);

  /**
   * Login function
   * @param email - User email
   * @param password - User password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const response = await authService.login(email, password);
      
      if (response.requiresVerification) {
        // Lưu thông tin người dùng tạm thời và yêu cầu xác minh
        setUser(response.user);
        setNeedsVerification(true);
        // Không lưu token vào localStorage ở đây
      } else {
        // Đăng nhập thành công
        setUser(response.user);
        setToken(response.token.accessToken);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.token.accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));
        if (response.token.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.token.refreshToken);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  /**
   * Register function
   * @param data - Registration data
   */
  const register = useCallback(async (data: IRegisterRequest): Promise<void> => {
    try {
      const response = await authService.register(data);
      
      // Update state
      setUser(response.user);
      
      // If token provided, save it
      if (response.token) {
        setToken(response.token.accessToken);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.token.accessToken);
        
        if (response.token.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.token.refreshToken);
        }
      }
      
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }, []);

  /**
   * Logout function
   * @param logoutAll - true = đăng xuất khỏi TẤT CẢ thiết bị, false/undefined = chỉ thiết bị hiện tại
   */
  const logout = useCallback(
    async (logoutAll?: boolean): Promise<void> => {
    try {
        await authService.logout(!!logoutAll);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
        performLocalLogout();
    }
    },
    [performLocalLogout]
  );

  /**
   * Update user info
   * @param updatedUser - Partial user data to update
   */
  const updateUser = useCallback((updatedUser: Partial<IUser>): void => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      const newUser = { ...prevUser, ...updatedUser };
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(newUser));
      
      return newUser;
    });
  }, []);

  /**
   * Refresh user info từ localStorage
   */
  const refreshUser = useCallback((): void => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      setToken(storedToken || null);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  // Lắng nghe broadcast logoutAll từ các tab khác qua localStorage
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === GLOBAL_LOGOUT_KEY) {
        console.log('🔒 Global logout detected from another tab', event.newValue);
        performLocalLogout();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [GLOBAL_LOGOUT_KEY, performLocalLogout]);

  // Context value
  const value: IAuthContext = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    needsVerification,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==================== HOOK ====================

/**
 * Custom hook để sử dụng Auth Context
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuthContext();
 * 
 * if (!isAuthenticated) {
 *   return <LoginPage />;
 * }
 * 
 * return <div>Welcome, {user?.fullName}!</div>;
 * ```
 * 
 * @throws Error nếu sử dụng ngoài AuthProvider
 */
export const useAuthContext = (): IAuthContext => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  
  return context;
};

// ==================== EXPORT ====================

export default AuthContext;

