/**
 * User Service
 * Xử lý tất cả các chức năng liên quan đến user profile và quản lý tài khoản
 */

import { apiService } from './api.service';
import { USER_ENDPOINTS } from '@/constants/endpoints';
import { STORAGE_KEYS, SUCCESS_MESSAGES } from '@/constants';
import type { IUser, ICustomerInfo, IUserStatisticsResponse } from '@/types';

// ==================== MOCK DATA ====================

const mockUser: IUser = {
  id: '1',
  username: 'testuser',
  fullName: 'Nguyễn Văn A',
  email: 'test@example.com',
  phone: '0123456789',
  role: 'student',
  avatar: '/images/background.png',
  bio: 'Học viên nhiệt huyết',
  isVerified: true,
  isActive: true,
  createdAt: new Date().toISOString(),
};

const mockStatistics: IUserStatisticsResponse = {
  totalExams: 15,
  completedExams: 12,
  passedExams: 10,
  failedExams: 2,
  averageScore: 78.5,
  totalCourses: 8,
  completedCourses: 5,
  certificates: 10,
};

// ==================== USER SERVICE ====================

class UserService {
  private normalizeUser(raw: any): IUser {
    const roleMap: Record<string | number, string> = {
      1: 'admin',
      2: 'teacher',
      3: 'student',
      admin: 'admin',
      teacher: 'teacher',
      instructor: 'teacher',
      student: 'student',
    };

    const id = raw?.id ?? raw?.Id ?? raw?.UserId ?? raw?.userId ?? raw?.userid;
    const username = raw?.username ?? raw?.UserName ?? raw?.userName ?? raw?.Email?.split?.('@')[0];
    const email = raw?.email ?? raw?.Email;
    const fullName = raw?.fullName ?? raw?.FullName ?? raw?.Name ?? '';
    const phone = raw?.phone ?? raw?.PhoneNumber ?? raw?.Phone ?? '';
    const avatar = raw?.avatar ?? raw?.AvatarUrl ?? raw?.Avatar ?? '';
    const roleRaw = raw?.role ?? raw?.Role ?? raw?.RoleId;
    const role = roleMap[roleRaw as any] ?? 'student';
    const isVerified = raw?.isVerified ?? raw?.IsEmailVerified ?? false;
    const isActive = raw?.isActive ?? (raw?.Status ? String(raw?.Status).toLowerCase() === 'active' : true);

    return {
      id: typeof id === 'string' ? id : String(id ?? ''),
      username: String(username ?? ''),
      fullName: String(fullName ?? ''),
      email: String(email ?? ''),
      phone: String(phone ?? ''),
      role: role as any,
      avatar: String(avatar ?? ''),
      isVerified: Boolean(isVerified),
      isActive: Boolean(isActive),
    } as IUser;
  }
  /**
   * Lấy thông tin profile của user hiện tại
   * @returns Promise với thông tin user
   */
  async getUserProfile(): Promise<IUser> {
    try {
      // Ưu tiên lấy từ API thật nếu backend sẵn sàng
      const raw = await apiService.get<any>(USER_ENDPOINTS.ME);
      if (raw) {
        const normalized = this.normalizeUser(raw);
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(normalized));
        return normalized;
      }
    } catch (e) {
      // Thử fallback: nếu /users/me không tồn tại, decode JWT để lấy userId và gọi /users/{id}
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const payloadBase64 = token.split('.')[1];
          const payloadJson = atob(payloadBase64);
          const payload = JSON.parse(payloadJson);
          const sub = payload.sub || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid;
          const userId = typeof sub === 'string' ? parseInt(sub, 10) : sub;
          if (userId && !Number.isNaN(userId)) {
            const rawById = await apiService.get<any>(USER_ENDPOINTS.GET_BY_ID(userId));
            if (rawById) {
              const normalized = this.normalizeUser(rawById);
              localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(normalized));
              return normalized;
            }
          }
        }
      } catch {}

      // Fallback cuối: lấy từ localStorage nếu API chưa sẵn sàng
      const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          return this.normalizeUser(parsed);
        } catch {
          return mockUser;
        }
      }
    }

    return mockUser;
  }

  /**
   * Lấy thông tin user theo ID
   * @param id - ID của user
   * @returns Promise với thông tin user
   */
  async getUserById(id: string | number): Promise<IUser> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IUser>(
    //   USER_ENDPOINTS.GET_BY_ID(id)
    // );

    // Mock response
    return Promise.resolve({
      ...mockUser,
      id: typeof id === 'string' ? id : id.toString(),
    });
  }

  /**
   * Cập nhật thông tin profile
   * @param data - Dữ liệu cần cập nhật
   * @returns Promise với thông tin user đã cập nhật
   */
  async updateProfile(data: Partial<IUser>): Promise<IUser> {
    try {
      // Gọi API thật để cập nhật hồ sơ
      const updatedUser = await apiService.put<IUser>(
        USER_ENDPOINTS.UPDATE_PROFILE,
        data
      );

      // Lưu lại thông tin người dùng mới
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      // Fallback: cập nhật localStorage nếu API chưa sẵn sàng
      const currentUser = await this.getUserProfile();
      const merged = { ...currentUser, ...data };
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(merged));
      return merged;
    }
  }

  /**
   * Cập nhật avatar
   * @param file - File ảnh avatar
   * @returns Promise với URL avatar mới
   */
  async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      // Gọi API upload thật
      const result = await apiService.upload<{ avatarUrl?: string; url?: string }>(
        USER_ENDPOINTS.UPDATE_AVATAR,
        file
      );

      // Hỗ trợ cả hai dạng thuộc tính trả về từ BE: { avatarUrl } hoặc { url }
      const avatarUrl = result.avatarUrl ?? result.url ?? '';
      if (!avatarUrl) {
        throw new Error('Avatar URL not found in response');
      }
      // Cập nhật lại thông tin người dùng trong localStorage
      const currentUser = await this.getUserProfile();
      const updatedUser = { ...currentUser, avatar: avatarUrl };
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));

      return { avatarUrl };
    } catch (error) {
      // Fallback: dùng blob URL khi API chưa sẵn sàng
      const mockAvatarUrl = URL.createObjectURL(file);
      const currentUser = await this.getUserProfile();
      const updatedUser = { ...currentUser, avatar: mockAvatarUrl };
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
      return { avatarUrl: mockAvatarUrl };
    }
  }

  /**
   * Đổi mật khẩu
   * @param oldPassword - Mật khẩu cũ
   * @param newPassword - Mật khẩu mới
   * @returns Promise với message
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Một số hệ thống đổi mật khẩu ở module Auth thay vì User.
      // Nếu backend của bạn hỗ trợ đổi mật khẩu qua /users/profile, hãy điều chỉnh endpoint tại đây.
      const response = await apiService.put<{ message: string }>(
        USER_ENDPOINTS.UPDATE_PROFILE,
        { oldPassword, newPassword }
      );

      return { message: response.message || SUCCESS_MESSAGES.PASSWORD_CHANGED };
    } catch (error) {
      // Fallback mock
      return { message: SUCCESS_MESSAGES.PASSWORD_CHANGED };
    }
  }

  /**
   * Lấy lịch sử hoạt động
   * @returns Promise với danh sách hoạt động
   */
  async getActivityHistory(): Promise<any[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<any[]>(
    //   USER_ENDPOINTS.ACTIVITY_HISTORY
    // );

    // Mock response
    return Promise.resolve([
      {
        id: 1,
        type: 'exam_completed',
        title: 'Hoàn thành bài thi AWS Cloud Practitioner',
        timestamp: new Date().toISOString(),
        metadata: {
          examId: 1,
          score: 85,
        },
      },
      {
        id: 2,
        type: 'course_enrolled',
        title: 'Đăng ký khóa học Lập Trình Full-Stack',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        metadata: {
          courseId: 1,
        },
      },
    ]);
  }

  /**
   * Lấy thống kê user
   * @returns Promise với thống kê
   */
  async getUserStatistics(): Promise<IUserStatisticsResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IUserStatisticsResponse>(
    //   USER_ENDPOINTS.STATISTICS
    // );

    // Mock response
    return Promise.resolve(mockStatistics);
  }

  /**
   * Lấy danh sách users (Admin only)
   * @param params - Filter và pagination params
   * @returns Promise với danh sách users
   */
  async getAllUsers(params?: any): Promise<any> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<any>(
    //   USER_ENDPOINTS.LIST,
    //   { params }
    // );

    // Mock response
    const users = Array.from({ length: 20 }, (_, i) => ({
      ...mockUser,
      id: (i + 1).toString(),
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));

    return Promise.resolve({
      success: true,
      data: users,
      pagination: {
        page: 1,
        limit: 20,
        total: users.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
  }

  /**
   * Xóa user (Admin only)
   * @param id - ID của user
   * @returns Promise với message
   */
  async deleteUser(id: string | number): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.delete<{ message: string }>(
    //   USER_ENDPOINTS.DELETE(id)
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.DELETED,
    });
  }

  /**
   * Cập nhật thông tin khách hàng (cho thanh toán)
   * @param data - Thông tin khách hàng
   * @returns Promise với message
   */
  async updateCustomerInfo(data: ICustomerInfo): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.put<{ message: string }>(
    //   USER_ENDPOINTS.UPDATE_PROFILE,
    //   data
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.PROFILE_UPDATED,
    });
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
   * Kiểm tra role của user
   * @param role - Role cần kiểm tra
   * @returns Boolean
   */
  hasRole(role: 'admin' | 'instructor' | 'student'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Kiểm tra user có phải admin không
   * @returns Boolean
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Kiểm tra user có phải instructor không
   * @returns Boolean
   */
  isInstructor(): boolean {
    return this.hasRole('instructor');
  }

  /**
   * Kiểm tra user có phải student không
   * @returns Boolean
   */
  isStudent(): boolean {
    return this.hasRole('student');
  }
}

// ==================== EXPORT ====================

export const userService = new UserService();
export default userService;

