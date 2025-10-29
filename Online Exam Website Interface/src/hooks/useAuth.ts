/**
 * Authentication Hooks
 * Custom hooks cho authentication và authorization
 */

import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { useMutation } from './useApi';
import type {
  IUser,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
} from '@/types';

// ==================== TYPES ====================

/**
 * Auth context state
 */
export interface IAuthState {
  /** User hiện tại */
  user: IUser | null;
  /** Đã đăng nhập chưa */
  isAuthenticated: boolean;
  /** Đang load user info */
  loading: boolean;
}

/**
 * Return type của useAuth hook
 */
export interface IUseAuthReturn extends IAuthState {
  /** Function để login */
  login: (email: string, password: string) => Promise<ILoginResponse | null>;
  /** Function để register */
  register: (data: IRegisterRequest) => Promise<IRegisterResponse | null>;
  /** Function để logout */
  logout: () => Promise<void>;
  /** Function để refresh user info */
  refreshUser: () => Promise<void>;
  /** Loading state cho login */
  loginLoading: boolean;
  /** Error cho login */
  loginError: Error | null;
  /** Loading state cho register */
  registerLoading: boolean;
  /** Error cho register */
  registerError: Error | null;
}

// ==================== USE AUTH HOOK ====================

/**
 * Main authentication hook
 * Quản lý authentication state và functions
 * 
 * @example
 * ```typescript
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * // Login
 * await login('user@example.com', 'password');
 * 
 * // Logout
 * await logout();
 * ```
 */
export function useAuth(): IUseAuthReturn {
  // Auth state
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Load user info từ localStorage khi mount
   */
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        const isAuth = authService.isAuthenticated();

        if (isAuth && currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login mutation
   */
  const {
    mutate: loginMutate,
    loading: loginLoading,
    error: loginError,
  } = useMutation<ILoginResponse, [string, string]>(
    async (email: string, password: string) => {
      return await authService.login(email, password);
    },
    {
      onSuccess: (data) => {
        setUser(data.user);
      },
      onError: (error) => {
        console.error('Login failed:', error);
      },
    }
  );

  /**
   * Register mutation
   */
  const {
    mutate: registerMutate,
    loading: registerLoading,
    error: registerError,
  } = useMutation<IRegisterResponse, [IRegisterRequest]>(
    async (data: IRegisterRequest) => {
      return await authService.register(data);
    },
    {
      onSuccess: (data) => {
        setUser(data.user);
      },
      onError: (error) => {
        console.error('Register failed:', error);
      },
    }
  );

  /**
   * Login function
   */
  const login = useCallback(
    async (email: string, password: string): Promise<ILoginResponse | null> => {
      return await loginMutate(email, password);
    },
    [loginMutate]
  );

  /**
   * Register function
   */
  const register = useCallback(
    async (data: IRegisterRequest): Promise<IRegisterResponse | null> => {
      return await registerMutate(data);
    },
    [registerMutate]
  );

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  /**
   * Refresh user info
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    loginLoading,
    loginError,
    registerLoading,
    registerError,
  };
}

// ==================== USE LOGIN HOOK ====================

/**
 * Login hook
 * Simplified hook chỉ cho login
 * 
 * @example
 * ```typescript
 * const { login, loading, error } = useLogin({
 *   onSuccess: (data) => navigate('/dashboard'),
 * });
 * 
 * await login('user@example.com', 'password');
 * ```
 */
export function useLogin(options?: {
  onSuccess?: (data: ILoginResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<ILoginResponse, [string, string]>(
    async (email: string, password: string) => {
      return await authService.login(email, password);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE REGISTER HOOK ====================

/**
 * Register hook
 * Simplified hook chỉ cho register
 * 
 * @example
 * ```typescript
 * const { mutate: register, loading, error } = useRegister({
 *   onSuccess: () => navigate('/login'),
 * });
 * 
 * await register({
 *   username: 'newuser',
 *   email: 'new@example.com',
 *   password: 'password123',
 *   fullName: 'Nguyễn Văn A',
 * });
 * ```
 */
export function useRegister(options?: {
  onSuccess?: (data: IRegisterResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<IRegisterResponse, [IRegisterRequest]>(
    async (data: IRegisterRequest) => {
      return await authService.register(data);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE LOGOUT HOOK ====================

/**
 * Logout hook
 * 
 * @example
 * ```typescript
 * const { logout, loading } = useLogout({
 *   onSuccess: () => navigate('/login'),
 * });
 * 
 * await logout();
 * ```
 */
export function useLogout(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      if (options?.onSuccess) {
        options.onSuccess();
      }
    } catch (error) {
      if (options?.onError) {
        options.onError(error as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [options]);

  return { logout, loading };
}

// ==================== EXPORT ====================

export default useAuth;

