/**
 * User Service
 * Xử lý tất cả các chức năng liên quan đến user profile và quản lý tài khoản
 */

import { apiClient } from './api.service';
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
  avatar: 'https://via.placeholder.com/150',
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
  /**
   * Lấy thông tin profile của user hiện tại
   * @returns Promise với thông tin user
   */
  async getUserProfile(): Promise<IUser> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IUser>(USER_ENDPOINTS.ME);

    // Mock response - Get from localStorage first
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (userStr) {
      try {
        return Promise.resolve(JSON.parse(userStr));
      } catch {
        return Promise.resolve(mockUser);
      }
    }

    return Promise.resolve(mockUser);
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
    // TODO: Uncomment khi có API thật
    // const response = await apiService.put<IUser>(
    //   USER_ENDPOINTS.UPDATE_PROFILE,
    //   data
    // );

    // Mock response - Update localStorage
    const currentUser = await this.getUserProfile();
    const updatedUser = { ...currentUser, ...data };
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));

    return Promise.resolve(updatedUser);
  }

  /**
   * Cập nhật avatar
   * @param file - File ảnh avatar
   * @returns Promise với URL avatar mới
   */
  async updateAvatar(file: File): Promise<{ avatarUrl: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.upload<{ avatarUrl: string }>(
    //   USER_ENDPOINTS.UPDATE_AVATAR,
    //   file
    // );

    // Mock response
    const mockAvatarUrl = URL.createObjectURL(file);
    
    // Update user info in localStorage
    const currentUser = await this.getUserProfile();
    const updatedUser = { ...currentUser, avatar: mockAvatarUrl };
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));

    return Promise.resolve({ avatarUrl: mockAvatarUrl });
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
    //   USER_ENDPOINTS.UPDATE_PROFILE,
    //   { oldPassword, newPassword }
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
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

