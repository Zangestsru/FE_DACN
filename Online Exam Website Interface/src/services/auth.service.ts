/**
 * Authentication Service
 * Handles user authentication operations
 */

import { apiClient } from './api.service';
import { STORAGE_KEYS } from '@/constants';
import { userService } from './user.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  requiresVerification?: boolean;
  data?: {
    token?: string;
    refreshToken?: string;
    user?: any;
  };
  token?: {
    accessToken?: string;
    refreshToken?: string;
  };
  refreshToken?: string;
  user?: any;
}

export interface VerifyOTPRequest {
  type: 'email' | 'phone';
  contact: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  Email: string;
  Otp: string;
  NewPassword: string;
  ConfirmPassword: string;
}

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmPassword?: string; // Optional, chỉ dùng để validate ở frontend
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  avatar?: string;
}

class AuthService {
  /**
   * Login user
   * Supports both: login({ email, password }) and login(email, password)
   */
  async login(
    emailOrCredentials: string | LoginRequest,
    password?: string
  ): Promise<AuthResponse> {
    try {
      // Handle both call signatures
      const credentials: LoginRequest =
        typeof emailOrCredentials === 'string'
          ? { email: emailOrCredentials, password: password || '' }
          : emailOrCredentials;

      console.log('🔐 AuthService.login - request:', credentials);
      const response = await apiClient.post('/Auth/login', credentials);
      console.log('✅ AuthService.login - response:', response.data);
      
      // Handle both response formats
      const data = response.data?.data || response.data;
      const token = data?.token || response.data?.token;
      const user = data?.user || response.data?.user;
      
      // Check if verification is required
      const requiresVerification = response.data?.requiresVerification || 
                                   !token || 
                                   !user;
      
      if (token && !requiresVerification) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        if (data?.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
        }
      }
      
      return {
        success: true,
        requiresVerification,
        token: token ? { accessToken: token } : undefined,
        user,
        data
      };
    } catch (error: any) {
      console.error('❌ AuthService.login - error:', error);
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('📝 AuthService.register - request:', userData);
      const payload = {
        FullName: userData.fullName,
        Email: userData.email,
        PhoneNumber: userData.phoneNumber,
        Gender: userData.gender,
        DateOfBirth: userData.dateOfBirth,
        Password: userData.password,
        ConfirmPassword: userData.confirmPassword,
      };
      const response = await apiClient.post('/Auth/register', payload);
      console.log('✅ AuthService.register - response:', response.data);
      
      const data = response.data?.data || response.data;
      const token = data?.token || response.data?.token;
      const user = data?.user || response.data?.user;
      
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        if (data?.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
        }
      }
      
      return {
        success: true,
        token: token ? { accessToken: token } : undefined,
        user,
        data
      };
    } catch (error: any) {
      console.error('❌ AuthService.register - error:', error);
      const data = error?.response?.data || {};
      const status = error?.response?.status;
      const extractFieldErrors = (obj: any): string[] => {
        const msgs: string[] = [];
        if (!obj || typeof obj !== 'object') return msgs;
        const candidates = obj.ModelState || obj.errors || obj.Errors || obj.validationErrors;
        if (candidates && typeof candidates === 'object') {
          for (const k of Object.keys(candidates)) {
            const v = (candidates as any)[k];
            if (Array.isArray(v)) msgs.push(...v);
            else if (typeof v === 'string') msgs.push(v);
          }
        }
        return msgs;
      };
      const fieldMsgs = extractFieldErrors(data);
      const message = data._errorMessage || data.message || data.Message || (fieldMsgs.length ? fieldMsgs.join('\n') : undefined) || (status === 500 ? 'Lỗi máy chủ. Vui lòng thử lại sau.' : 'Đăng ký thất bại');
      throw new Error(message);
    }
  }

  /**
   * Verify OTP for registration
   * Backend yêu cầu: POST /api/Auth/verify-otp với { Email, Otp }
   */
  async verifyOTP(type: 'email' | 'phone', contact: string, code: string): Promise<{ verified: boolean; message?: string }> {
    try {
      console.log('🔐 AuthService.verifyOTP - request:', { type, contact, code });
      
      // Backend yêu cầu format: { Email, Otp }
      // Nếu type là 'phone', contact là phoneNumber, nhưng backend chỉ hỗ trợ email
      // Nên chỉ dùng contact làm Email
      const payload = {
        Email: contact, // contact là email trong trường hợp này
        Otp: code
      };
      
      const response = await apiClient.post('/Auth/verify-otp', payload);
      console.log('✅ AuthService.verifyOTP - response:', response.data);
      
      return {
        verified: true,
        message: response.data?.message || 'Xác thực thành công'
      };
    } catch (error: any) {
      console.error('❌ AuthService.verifyOTP - error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.Message || 'Xác thực OTP thất bại';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify login OTP
   */
  async verifyLoginOtp(email: string, otp: string): Promise<AuthResponse> {
    try {
      console.log('🔐 AuthService.verifyLoginOtp - request:', { email, otp });
      const response = await apiClient.post('/Auth/verify-login-otp', {
        email,
        otp
      });
      console.log('✅ AuthService.verifyLoginOtp - response:', response.data);
      
      const data = response.data?.data || response.data;
      const token = data?.token || response.data?.token;
      let user = data?.user || response.data?.user;
      
      // Normalize user data từ backend sử dụng userService để đảm bảo format nhất quán
      if (user) {
        // Dùng normalizeUser từ userService để đảm bảo format đúng
        user = userService.normalizeUser(user);
        console.log('✅ verifyLoginOtp: Normalized user:', user);
      } else {
        console.warn('⚠️ verifyLoginOtp: No user data in response');
      }
      
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        console.log('💾 Saved token to localStorage');
        
        if (data?.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        }
        
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
          console.log('💾 Saved user to localStorage:', user);
          
          // Verify user was saved
          const saved = localStorage.getItem(STORAGE_KEYS.USER_INFO);
          if (saved) {
            console.log('✅ Verified: User data saved successfully');
          } else {
            console.error('❌ Failed to save user data to localStorage');
          }
        } else {
          console.error('❌ Cannot save user: user data is null/undefined');
        }
      } else {
        console.error('❌ Cannot save user: token is missing');
      }
      
      return {
        success: true,
        token: token ? { accessToken: token } : undefined,
        user,
        data
      };
    } catch (error: any) {
      console.error('❌ AuthService.verifyLoginOtp - error:', error);
      throw new Error(error.response?.data?.message || 'Xác thực OTP thất bại');
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(type: 'email' | 'phone', contact: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('📧 AuthService.resendOTP - request:', { type, contact });
      const response = await apiClient.post('/Auth/resend-otp', {
        type,
        contact
      });
      console.log('✅ AuthService.resendOTP - response:', response.data);
      
      return {
        success: true,
        message: response.data?.message || 'Đã gửi lại mã OTP'
      };
    } catch (error: any) {
      console.error('❌ AuthService.resendOTP - error:', error);
      throw new Error(error.response?.data?.message || 'Không thể gửi lại mã OTP');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 AuthService.logout');
      await apiClient.post('/Auth/logout');
      
      // Clear local storage
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    } catch (error: any) {
      console.error('❌ AuthService.logout - error:', error);
      // Clear local storage even if API call fails
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    }
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): any | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userStr) {
        console.log('⚠️ getCurrentUser: No user data in localStorage');
        return null;
      }
      const parsed = JSON.parse(userStr);
      console.log('✅ getCurrentUser: Found user in localStorage');
      return parsed;
    } catch (error) {
      console.error('❌ Error parsing user from localStorage:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }

  /**
   * Forgot password
   * Backend yêu cầu: POST /api/Auth/forgot-password với { Email }
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔑 AuthService.forgotPassword - request:', email);
      
      // Backend yêu cầu format: { Email }
      const payload = {
        Email: email
      };
      
      const response = await apiClient.post('/Auth/forgot-password', payload);
      console.log('✅ AuthService.forgotPassword - response:', response.data);
      
      // Backend trả về { message: "..." }
      const message = response.data?.message || response.data?.data?.message || 'Đã gửi email reset mật khẩu';
      
      return {
        success: true,
        message: message
      };
    } catch (error: any) {
      console.error('❌ AuthService.forgotPassword - error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.Message || 'Không thể gửi email reset mật khẩu';
      throw new Error(errorMessage);
    }
  }

  /**
   * Reset password
   * Backend yêu cầu: POST /api/Auth/reset-password với { Email, Otp, NewPassword, ConfirmPassword }
   */
  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔑 AuthService.resetPassword - request');
      
      // Backend yêu cầu format: { Email, Otp, NewPassword, ConfirmPassword }
      const payload: ResetPasswordRequest = {
        Email: email,
        Otp: otp,
        NewPassword: newPassword,
        ConfirmPassword: confirmPassword
      };
      
      const response = await apiClient.post('/Auth/reset-password', payload);
      console.log('✅ AuthService.resetPassword - response:', response.data);
      
      // Backend trả về { message: "..." }
      const message = response.data?.message || response.data?.data?.message || 'Đặt lại mật khẩu thành công';
      
      return {
        success: true,
        message: message
      };
    } catch (error: any) {
      console.error('❌ AuthService.resetPassword - error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.Message || 'Đặt lại mật khẩu thất bại';
      throw new Error(errorMessage);
    }
  }

  /**
   * Change password
   * Backend yêu cầu: PUT /api/Auth/change-password với { CurrentPassword, NewPassword, ConfirmPassword }
   */
  async changePassword(oldPassword: string, newPassword: string, confirmPassword?: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔑 AuthService.changePassword - request');
      
      // Backend yêu cầu format: { CurrentPassword, NewPassword, ConfirmPassword }
      // Nếu không có confirmPassword, dùng newPassword làm ConfirmPassword
      const payload = {
        CurrentPassword: oldPassword,
        NewPassword: newPassword,
        ConfirmPassword: confirmPassword || newPassword
      };
      
      // Sử dụng PUT method như backend yêu cầu
      const response = await apiClient.put('/Auth/change-password', payload);
      console.log('✅ AuthService.changePassword - response:', response.data);
      
      // Backend trả về { message: "..." } hoặc có thể có wrapper
      const message = response.data?.message || response.data?.data?.message || 'Đổi mật khẩu thành công';
      
      return {
        success: true,
        message: message
      };
    } catch (error: any) {
      console.error('❌ AuthService.changePassword - error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.Message || 'Đổi mật khẩu thất bại';
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;





