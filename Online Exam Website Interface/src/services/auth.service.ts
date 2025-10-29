/**
 * Authentication Service
 * Xử lý tất cả các chức năng liên quan đến authentication và authorization
 */

import { apiClient, setAuthToken, removeAuthToken } from './api.service';
import { AUTH_ENDPOINTS } from '@/constants/endpoints';
import { STORAGE_KEYS, SUCCESS_MESSAGES } from '@/constants';
import type {
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IRegisterResponse,
  IOTPVerifyRequest,
  IOTPVerifyResponse,
  IPasswordResetRequest,
  IPasswordResetResponse,
  IUser,
} from '@/types';

// ==================== MOCK DATA ====================

const mockUser: IUser = {
  id: '1',
  username: 'testuser',
  fullName: 'Nguyễn Văn A',
  email: 'test@example.com',
  phone: '0123456789',
  role: 'student',
  avatar: 'https://via.placeholder.com/150',
  isVerified: true,
  isActive: true,
};

const mockToken = 'mock-jwt-token-12345';

// ==================== AUTH SERVICE ====================

class AuthService {
  /**
   * Đăng nhập
   * @param email - Email người dùng
   * @param password - Mật khẩu
   * @returns Promise với thông tin user và token
   */
  async login(email: string, password: string): Promise<ILoginResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<ILoginResponse>(
    //   AUTH_ENDPOINTS.LOGIN,
    //   { email, password }
    // );

    // Mock response
    const response: ILoginResponse = {
      user: mockUser,
      token: {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    };

    // Save token
    setAuthToken(response.token.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.token.refreshToken || '');
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return Promise.resolve(response);
  }

  /**
   * Đăng ký tài khoản mới
   * @param userData - Thông tin đăng ký
   * @returns Promise với thông tin user và token
   */
  async register(userData: IRegisterRequest): Promise<IRegisterResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IRegisterResponse>(
    //   AUTH_ENDPOINTS.REGISTER,
    //   userData
    // );

    // Mock response
    const response: IRegisterResponse = {
      user: {
        ...mockUser,
        email: userData.email || mockUser.email,
        fullName: userData.fullName,
        username: userData.username,
      },
      token: {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      requiresVerification: true,
    };

    // Save token if provided
    if (response.token) {
      setAuthToken(response.token.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.token.refreshToken || '');
    }
    
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return Promise.resolve(response);
  }

  /**
   * Đăng xuất
   * @returns Promise
   */
  async logout(): Promise<void> {
    // TODO: Uncomment khi có API thật
    // await apiService.post(AUTH_ENDPOINTS.LOGOUT);

    // Clear local storage
    removeAuthToken();
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    
    // Clear session storage
    sessionStorage.clear();

    return Promise.resolve();
  }

  /**
   * Refresh access token
   * @returns Promise với token mới
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ accessToken: string }>(
    //   AUTH_ENDPOINTS.REFRESH_TOKEN,
    //   { refreshToken }
    // );

    // Mock response
    const newToken = 'new-mock-jwt-token-' + Date.now();
    setAuthToken(newToken);

    return Promise.resolve(newToken);
  }

  /**
   * Quên mật khẩu - Gửi email/SMS reset
   * @param email - Email hoặc số điện thoại
   * @returns Promise với message
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   AUTH_ENDPOINTS.FORGOT_PASSWORD,
    //   { email }
    // );

    // Mock response
    return Promise.resolve({
      message: 'Mã xác thực đã được gửi đến email của bạn',
    });
  }

  /**
   * Reset mật khẩu
   * @param data - Thông tin reset password
   * @returns Promise với message
   */
  async resetPassword(data: IPasswordResetRequest): Promise<IPasswordResetResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IPasswordResetResponse>(
    //   AUTH_ENDPOINTS.RESET_PASSWORD,
    //   data
    // );

    // Mock response
    return Promise.resolve({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET,
    });
  }

  /**
   * Xác thực OTP
   * @param type - Loại OTP (email/phone)
   * @param contact - Email hoặc số điện thoại
   * @param code - Mã OTP
   * @returns Promise với kết quả xác thực
   */
  async verifyOTP(
    type: 'email' | 'phone',
    contact: string,
    code: string
  ): Promise<IOTPVerifyResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IOTPVerifyResponse>(
    //   AUTH_ENDPOINTS.VERIFY_OTP,
    //   { type, contact, code }
    // );

    // Mock response
    const response: IOTPVerifyResponse = {
      verified: true,
      message: 'Xác thực thành công',
      token: {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    };

    // Save token if provided
    if (response.token) {
      setAuthToken(response.token.accessToken);
    }

    return Promise.resolve(response);
  }

  /**
   * Gửi lại OTP
   * @param type - Loại OTP (email/phone)
   * @param contact - Email hoặc số điện thoại
   * @returns Promise với message
   */
  async resendOTP(type: 'email' | 'phone', contact: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   AUTH_ENDPOINTS.RESEND_OTP,
    //   { type, contact }
    // );

    // Mock response
    return Promise.resolve({
      message: 'Mã OTP mới đã được gửi',
    });
  }

  /**
   * Đổi mật khẩu
   * @param oldPassword - Mật khẩu cũ
   * @param newPassword - Mật khẩu mới
   * @returns Promise với message
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   AUTH_ENDPOINTS.CHANGE_PASSWORD,
    //   { oldPassword, newPassword }
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  }

  /**
   * Xác thực email
   * @param token - Token xác thực
   * @returns Promise với message
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   AUTH_ENDPOINTS.VERIFY_EMAIL,
    //   { token }
    // );

    // Mock response
    return Promise.resolve({
      message: 'Email đã được xác thực thành công',
    });
  }

  /**
   * Đăng nhập với Google
   * @param googleToken - Google OAuth token
   * @returns Promise với thông tin user và token
   */
  async loginWithGoogle(googleToken: string): Promise<ILoginResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<ILoginResponse>(
    //   AUTH_ENDPOINTS.GOOGLE_LOGIN,
    //   { token: googleToken }
    // );

    // Mock response
    const response: ILoginResponse = {
      user: mockUser,
      token: {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    };

    setAuthToken(response.token.accessToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return Promise.resolve(response);
  }

  /**
   * Đăng nhập với Facebook
   * @param facebookToken - Facebook OAuth token
   * @returns Promise với thông tin user và token
   */
  async loginWithFacebook(facebookToken: string): Promise<ILoginResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<ILoginResponse>(
    //   AUTH_ENDPOINTS.FACEBOOK_LOGIN,
    //   { token: facebookToken }
    // );

    // Mock response
    const response: ILoginResponse = {
      user: mockUser,
      token: {
        accessToken: mockToken,
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    };

    setAuthToken(response.token.accessToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return Promise.resolve(response);
  }

  /**
   * Lấy thông tin user hiện tại từ localStorage
   * @returns User info hoặc null
   */
  getCurrentUser(): IUser | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   * @returns Boolean
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }
}

// ==================== EXPORT ====================

export const authService = new AuthService();
export default authService;

