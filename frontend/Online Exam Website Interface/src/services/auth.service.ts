/**
 * Authentication Service
 * Xử lý tất cả các chức năng liên quan đến authentication và authorization
 */

import { apiClient, setAuthToken, removeAuthToken } from './api.service';
import { userService } from './user.service';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '@/constants/endpoints';
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
  avatar: '/images/background.png',
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
    try {
      const res = await apiClient.post(AUTH_ENDPOINTS.LOGIN, { email, password });
      const result: any = (res as any).data;

      // If backend returns success and user data with token (direct login)
      if (result?.success && result?.data && result?.data?.accessToken) {
        const { accessToken, refreshToken } = result.data;

        setAuthToken(accessToken);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || '');
        
        let profile = null;
        try {
          profile = await userService.getUserProfile();
        } catch {}
        const userData = profile || result.data.user || null;
        if (userData) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
        }

        console.log('Login successful, token stored:', accessToken);

        return {
          user: userData,
          token: {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
          message: result.message || 'Login successful',
        };
      }

      // If backend requires OTP verification (status 200 but no token yet)
      // Many backends respond 200 with only a message when OTP is sent
      if ((res as any).status === 200 && (!result?.data?.accessToken)) {
        const message = result?.message || 'Đã gửi OTP tới email. Vui lòng xác minh.';
        console.log('OTP verification required:', message);
        return {
          requiresVerification: true,
          message,
          user: result?.data?.user || null,
          token: {
            accessToken: '',
            refreshToken: '',
            expiresIn: 0,
            tokenType: 'Bearer',
          },
        };
      }

      // Any 200 response without token is treated as OTP-verification-required
      return {
        requiresVerification: true,
        message: result?.message || 'Vui lòng xác minh OTP để tiếp tục',
        user: result?.data?.user || null,
        token: {
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
          tokenType: 'Bearer',
        },
      };

    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('OTP') || msg.toLowerCase().includes('xác minh')) {
        return {
          requiresVerification: true,
          message: msg,
          user: null,
          token: {
            accessToken: '',
            refreshToken: '',
            expiresIn: 0,
            tokenType: 'Bearer',
          },
        } as ILoginResponse;
      }
      if (error?.code === 'ERR_NETWORK' || /Network|fetch/i.test(error?.message)) {
        throw new Error(`Không thể kết nối máy chủ. Vui lòng kiểm tra Backend (${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'})`);
      }
      throw new Error(error.message || 'Network error during login');
    }
  }

  /**
   * Xác thực OTP đăng nhập
   * @param email - Email người dùng
   * @param otp - Mã OTP
   * @returns Promise với thông tin user và token
   */
  async verifyLoginOtp(email: string, otp: string): Promise<ILoginResponse> {
    const response = await apiClient.post<ILoginResponse>(
      AUTH_ENDPOINTS.VERIFY_LOGIN_OTP,
      { email, otp }
    );
    const tokenData: any = (response as any)?.data?.token;
    let accessToken = '';
    let refreshToken = '';
    if (typeof tokenData === 'string') {
      accessToken = tokenData;
    } else if (tokenData && typeof tokenData === 'object') {
      accessToken = tokenData.accessToken || '';
      refreshToken = tokenData.refreshToken || '';
    }

    if (accessToken) {
      setAuthToken(accessToken);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || '');

      try {
        const payloadBase64 = accessToken.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        const sub = payload.sub || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid;
        const emailClaim = payload.email || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        const name = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || payload.name || '';
        const role = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'student';
        const user: IUser = {
          id: typeof sub === 'string' ? sub : String(sub),
          username: emailClaim ? String(emailClaim).split('@')[0] : '',
          fullName: name,
          email: emailClaim || email,
          phone: '',
          role: String(role).toLowerCase(),
          avatar: '',
          isVerified: true,
          isActive: true,
        } as IUser;
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
      } catch {}

      try {
        const serverUser = await userService.getUserProfile();
        if (serverUser) {
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(serverUser));
        }
      } catch {}
    }

    if ((response as any)?.data?.user) {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify((response as any).data.user));
    }

    return (response as any).data;
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(userData: IRegisterRequest): Promise<IRegisterResponse> {
    try {
      // Gọi API thật để tạo tài khoản và gửi OTP xác thực
      const response = await apiClient.post<IRegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        userData
      );

      // Không thiết lập token ở bước đăng ký
      // Backend sẽ lưu tài khoản ở trạng thái chưa xác thực và gửi OTP
      const data = response.data;

      // Đảm bảo cờ yêu cầu xác thực tồn tại để UI chuyển sang màn OTP
      if (typeof data.requiresVerification === 'undefined') {
        data.requiresVerification = true;
      }

      return data;
    } catch (error) {
      // Fallback khi backend chưa sẵn sàng: lưu "database" cục bộ và yêu cầu OTP
      const localUsersStr = localStorage.getItem('registered_users');
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];

      const newUser: IUser = {
        ...mockUser,
        id: (localUsers.length + 1).toString(),
        username: userData.email.split('@')[0],
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phoneNumber,
        role: 'student',
        isVerified: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      } as IUser;

      localUsers.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(localUsers));

      // Trả về response mô phỏng
      return {
        user: newUser,
        message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
        requiresVerification: true,
      };
    }
  }

  /**
   * Đăng xuất
   */
  async logout(): Promise<void> {
    // TODO: Uncomment khi có API thật
    // await apiClient.post(AUTH_ENDPOINTS.LOGOUT);

    removeAuthToken();
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    sessionStorage.clear();

    return Promise.resolve();
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) throw new Error('No refresh token available');

    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<{ accessToken: string }>(
    //   AUTH_ENDPOINTS.REFRESH_TOKEN,
    //   { refreshToken }
    // );

    const newToken = 'new-mock-jwt-token-' + Date.now();

    setAuthToken(newToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);

    return Promise.resolve(newToken);
  }

  /**
   * Quên mật khẩu - Gửi email/SMS reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<{ message: string }>(
    //   AUTH_ENDPOINTS.FORGOT_PASSWORD,
    //   { email }
    // );

    return Promise.resolve({
      message: 'Mã xác thực đã được gửi đến email của bạn',
    });
  }

  /**
   * Reset mật khẩu
   */
  async resetPassword(data: IPasswordResetRequest): Promise<IPasswordResetResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<IPasswordResetResponse>(
    //   AUTH_ENDPOINTS.RESET_PASSWORD,
    //   data
    // );

    return Promise.resolve({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_RESET,
    });
  }

  /**
   * Xác thực OTP
   */
  async verifyOTP(
    type: 'email' | 'phone',
    contact: string,
    code: string
  ): Promise<IOTPVerifyResponse> {
    try {
      const response = await apiClient.post<IOTPVerifyResponse>(
        AUTH_ENDPOINTS.VERIFY_OTP,
        { type, contact, code }
      );

      // Ở luồng xác thực đăng ký, KHÔNG gán token để tránh auto-login
      const data = response.data;

      // Nếu dùng mock/local DB, cập nhật trạng thái isVerified
      try {
        const localUsersStr = localStorage.getItem('registered_users');
        if (localUsersStr) {
          const localUsers: IUser[] = JSON.parse(localUsersStr);
          const idx = localUsers.findIndex(u => u.email === contact);
          if (idx >= 0) {
            localUsers[idx].isVerified = true;
            localStorage.setItem('registered_users', JSON.stringify(localUsers));
          }
        }
      } catch {}

      return data;
    } catch (error) {
      // Fallback mô phỏng thành công
      // Cập nhật trạng thái verified trong local "database"
      try {
        const localUsersStr = localStorage.getItem('registered_users');
        if (localUsersStr) {
          const localUsers: IUser[] = JSON.parse(localUsersStr);
          const idx = localUsers.findIndex(u => u.email === contact);
          if (idx >= 0) {
            localUsers[idx].isVerified = true;
            localStorage.setItem('registered_users', JSON.stringify(localUsers));
          }
        }
      } catch {}

      return Promise.resolve({
        verified: true,
        message: 'Xác thực thành công',
      });
    }
  }

  /**
   * Gửi lại OTP
   */
  async resendOTP(type: 'email' | 'phone', contact: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<{ message: string }>(
    //   AUTH_ENDPOINTS.RESEND_OTP,
    //   { type, contact }
    // );

    return Promise.resolve({
      message: 'Mã OTP mới đã được gửi',
    });
  }

  /**
   * Đổi mật khẩu
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD,
        { oldPassword, newPassword }
      );

      return {
        message: (response as any)?.data?.message || SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    } catch (error: any) {
      // Nếu backend chưa sẵn sàng, trả về thông báo thành công giả lập để UI không bị gãy
      return {
        message: error?.message || SUCCESS_MESSAGES.PASSWORD_CHANGED,
      };
    }
  }

  /**
   * Xác thực email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<{ message: string }>(
    //   AUTH_ENDPOINTS.VERIFY_EMAIL,
    //   { token }
    // );

    return Promise.resolve({
      message: 'Email đã được xác thực thành công',
    });
  }

  /**
   * Đăng nhập với Google
   */
  async loginWithGoogle(googleToken: string): Promise<ILoginResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<ILoginResponse>(
    //   AUTH_ENDPOINTS.GOOGLE_LOGIN,
    //   { token: googleToken }
    // );

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

    const { accessToken, refreshToken } = response.token;
    setAuthToken(accessToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return Promise.resolve(response);
  }

  /**
   * Đăng nhập với Facebook
   */
  async loginWithFacebook(facebookToken: string): Promise<ILoginResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiClient.post<ILoginResponse>(
    //   AUTH_ENDPOINTS.FACEBOOK_LOGIN,
    //   { token: facebookToken }
    // );

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

    const { accessToken, refreshToken } = response.token;
    setAuthToken(accessToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    return Promise.resolve(response);
  }

  /**
   * Cập nhật hồ sơ người dùng
   */
  async updateProfile(data: { email: string; dateOfBirth: Date }): Promise<IUser> {
    const payload = { ...data, dateOfBirth: data.dateOfBirth.toISOString() };
    const response = await apiClient.put<IUser>(
      USER_ENDPOINTS.UPDATE_PROFILE,
      payload
    );
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.data));
    return response.data;
  }

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser(): IUser | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  }
}

// ==================== EXPORT ====================

export const authService = new AuthService();
export default authService;
