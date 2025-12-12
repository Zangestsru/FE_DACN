/**
 * Authentication Hooks
 * Custom hooks cho authentication và authorization
 */

import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { useMutation } from './useApi';
import { STORAGE_KEYS } from '@/constants';
import type {
  IUser,
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IVerifyOtpRequest,
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
  /** Function để verify login OTP */
  verifyLoginOtp: (
    email: string,
    otp: string
  ) => Promise<ILoginResponse | null>;
  /** Function để register */
  register: (data: IRegisterRequest) => Promise<IRegisterResponse | null>;
  /** Function để logout */
  logout: (logoutAll?: boolean) => Promise<void>;
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
  /** Loading state cho verify login OTP */
  verifyLoginOtpLoading: boolean;
  /** Error cho verify login OTP */
  verifyLoginOtpError: Error | null;
  /** Cần xác thực OTP */
  needsVerification: boolean;
  /** Email for OTP verification */
  loginEmail: string;
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
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');

  /**
   * Load user info từ localStorage khi mount
   */
  useEffect(() => {
    const loadUser = () => {
      const currentUser = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();

      if (isAuth && currentUser) {
        setUser(currentUser);
      } else if (!isAuth && currentUser) {
        console.warn('Xóa dữ liệu user cũ do không có token hợp lệ');
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        setUser(null);
      } else {
        setUser(null);
      }
      setLoading(false);
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
    (email: string, password: string) => authService.login(email, password),
    {
      onSuccess: (data, variables) => {
        const requiresVerification = (data as any)?.requiresVerification || !((data as any)?.token?.accessToken);
        if (requiresVerification) {
          setNeedsVerification(true);
          const emailArg = variables?.[0];
          if (emailArg) setLoginEmail(emailArg);
        } else if (data.user) {
          setUser(data.user);
          setNeedsVerification(false);
        }
      },
      onError: (error, variables) => {
        const msg = error?.message || '';
        if (msg.includes('OTP') || msg.toLowerCase().includes('xác minh')) {
          setNeedsVerification(true);
          const emailArg = variables?.[0];
          if (emailArg) setLoginEmail(emailArg);
          return;
        }
        // Quietly keep error state for non-OTP cases; avoid noisy console logs
      },
    }
  );

  /**
   * Verify Login OTP mutation
   */
  const {
    mutate: verifyLoginOtpMutate,
    loading: verifyLoginOtpLoading,
    error: verifyLoginOtpError,
  } = useMutation<ILoginResponse, [string, string]>(
    async (email: string, otp: string) => {
      return await authService.verifyLoginOtp(email, otp);
    },
    {
      onSuccess: (data) => {
        const persistedUser = authService.getCurrentUser();
        setUser(persistedUser || data.user);
        setNeedsVerification(false);
        setLoginEmail('');
      },
      onError: (error) => {
        console.error('OTP Verification failed:', error);
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
      setLoginEmail(email);
      return await loginMutate(email, password);
    },
    [loginMutate]
  );

  /**
   * Verify login OTP
   */
  const verifyLoginOtp = useCallback(
    async (email: string, otp: string): Promise<ILoginResponse | null> => {
      return await verifyLoginOtpMutate(email, otp);
    },
    [verifyLoginOtpMutate]
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
   * @param logoutAll - true = đăng xuất khỏi TẤT CẢ thiết bị, false/undefined = chỉ thiết bị hiện tại
   */
  const logout = useCallback(async (logoutAll?: boolean): Promise<void> => {
    try {
      await authService.logout(!!logoutAll);
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
      // Ưu tiên lấy từ localStorage trước (không gọi API)
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        console.log('✅ refreshUser: Using user from localStorage');
        setUser(currentUser);
        return;
      }
      
      // Nếu không có trong localStorage và đã đăng nhập, thử lấy từ API (chỉ khi cần)
      if (authService.isAuthenticated()) {
        console.log('⚠️ refreshUser: No user in localStorage, trying to fetch from API');
        try {
          const serverUser = await userService.getUserProfile(false); // forceRefresh = false
          if (serverUser) {
            setUser(serverUser);
          }
        } catch (apiError) {
          console.warn('⚠️ refreshUser: API call failed, user may not be available');
        }
      } else {
        setUser(null);
      }
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
    verifyLoginOtp,
    verifyLoginOtpLoading,
    verifyLoginOtpError,
    needsVerification,
    loginEmail,
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

