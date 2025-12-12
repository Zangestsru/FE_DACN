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
  /**
   * Normalize user data từ backend về format chuẩn IUser
   * Public method để có thể dùng ở các service khác
   */
  normalizeUser(raw: any): IUser {
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
    // Map avatar từ nhiều nguồn có thể có
    const avatar = raw?.avatar ?? raw?.AvatarUrl ?? raw?.Avatar ?? raw?.avatarUrl ?? '';
    console.log('🔍 normalizeUser - Avatar mapping:', {
      'raw?.avatar': raw?.avatar,
      'raw?.AvatarUrl': raw?.AvatarUrl,
      'raw?.Avatar': raw?.Avatar,
      'raw?.avatarUrl': raw?.avatarUrl,
      'final avatar': avatar
    });
    
    // Lấy role từ nhiều nguồn và normalize
    const roleRaw = raw?.role ?? raw?.Role ?? raw?.roleId ?? raw?.RoleId;
    let role = 'student';
    
    // Nếu roleRaw là số (roleId), map qua roleMap
    if (typeof roleRaw === 'number') {
      role = roleMap[roleRaw] ?? 'student';
    } 
    // Nếu roleRaw là string, normalize về lowercase và map
    else if (typeof roleRaw === 'string') {
      const normalizedRole = roleRaw.toLowerCase().trim();
      role = roleMap[normalizedRole] ?? roleMap[normalizedRole as any] ?? 'student';
    }
    // Nếu không có, fallback về student
    else {
      role = 'student';
    }
    const isVerified = raw?.isVerified ?? raw?.IsEmailVerified ?? false;
    const isActive = raw?.isActive ?? (raw?.Status ? String(raw?.Status).toLowerCase() === 'active' : true);

    const normalized = {
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

    // Log để debug
    console.log('🔍 normalizeUser - Input:', raw);
    console.log('🔍 normalizeUser - Role mapping:', { 
      roleRaw, 
      roleRawType: typeof roleRaw,
      role,
      'roleMap check': typeof roleRaw === 'number' ? roleMap[roleRaw] : (typeof roleRaw === 'string' ? roleMap[roleRaw.toLowerCase()] : 'N/A')
    });
    console.log('🔍 normalizeUser - Output:', normalized);

    return normalized;
  }
  /**
   * Lấy thông tin profile của user hiện tại
   * @param forceRefresh - Nếu true, sẽ gọi API để refresh data. Mặc định false, ưu tiên localStorage
   * @returns Promise với thông tin user
   */
  async getUserProfile(forceRefresh: boolean = false): Promise<IUser> {
    // Ưu tiên lấy từ localStorage trước (đã có sau khi verify OTP)
    if (!forceRefresh) {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          const normalized = this.normalizeUser(parsed);
          // Kiểm tra xem data có hợp lệ không
          if (normalized && normalized.id) {
            console.log('✅ getUserProfile: Using cached user from localStorage');
            return normalized;
          }
        } catch (e) {
          console.warn('⚠️ getUserProfile: Failed to parse cached user, will fetch from API');
        }
      }
    }

    // Nếu forceRefresh = true, mới gọi API. Nếu false và không có trong localStorage, không gọi API
    if (forceRefresh) {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          try {
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
                console.log('✅ getUserProfile: Fetched from /users/{id}');
                return normalized;
              }
            }
          } catch (idError) {
            console.warn('⚠️ getUserProfile: Failed to fetch from /users/{id}, using cached data');
          }
        }
      } catch (e) {
        console.warn('⚠️ getUserProfile: API call failed, using cached data');
      }
    } else {
      // Nếu forceRefresh = false và không có trong localStorage, không gọi API
      console.log('ℹ️ getUserProfile: forceRefresh = false, skipping API call');
    }

    // Fallback: lấy từ localStorage nếu API fail
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        const normalized = this.normalizeUser(parsed);
        // Return nếu có id hợp lệ (bất kỳ id nào, không chỉ check !== '1')
        if (normalized && normalized.id) {
          console.log('✅ getUserProfile: Using cached user from localStorage');
          return normalized;
        }
      } catch (e) {
        console.warn('⚠️ getUserProfile: Failed to parse cached user', e);
      }
    }

    // Nếu không có data, return null (component sẽ xử lý)
    console.warn('⚠️ getUserProfile: No user data available');
    return null as any;
  }

  /**
   * Lấy thông tin user theo ID
   * @param id - ID của user
   * @returns Promise với thông tin user
   */
  async getUserById(id: string | number): Promise<IUser> {
    try {
      const response = await apiService.get<any>(USER_ENDPOINTS.GET_BY_ID(id));
      console.log('🔍 getUserById - Raw response:', response);
      console.log('🔍 getUserById - AvatarUrl from response:', response?.AvatarUrl || response?.avatarUrl || response?.avatar);
      
      const normalized = this.normalizeUser(response);
      console.log('🔍 getUserById - Normalized user:', normalized);
      console.log('🔍 getUserById - Normalized avatar:', normalized?.avatar);
      
      // Lưu vào localStorage để cache
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(normalized));
      return normalized;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      // Fallback: return mock data nếu API fail
      return Promise.resolve({
        ...mockUser,
        id: typeof id === 'string' ? id : id.toString(),
      });
    }
  }

  /**
   * Lấy danh sách users
   */
  async getUsers(params?: any): Promise<IUser[]> {
    try {
      // Use fallback endpoint if LIST is causing 404
      // This is a temporary fix for the 404 error
      let response;
      try {
        response = await apiService.get<any>(USER_ENDPOINTS.LIST, { params });
      } catch (err: any) {
        if (err?.response?.status === 404) {
          console.warn('Endpoint /Users not found, trying /api/Users directly or fallback');
          // If 404, return empty list or mock data to prevent crash
          return [];
        }
        throw err;
      }
      
      // Response might be wrapped in { data: [...] } or just [...]
      const list = Array.isArray(response) ? response : (response?.data || []);
      if (Array.isArray(list)) {
        return list.map((u: any) => this.normalizeUser(u));
      }
      return [];
    } catch (e) {
      console.error('Error fetching users', e);
      return [];
    }
  }

  /**
   * Cập nhật thông tin profile
   * @param data - Dữ liệu cần cập nhật
   * @returns Promise với thông tin user đã cập nhật
   */
  async updateProfile(data: Partial<IUser>): Promise<IUser> {
    try {
      // Lấy userId từ token hoặc user hiện tại
      const currentUser = await this.getUserProfile();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      }

      // Chuyển đổi format dữ liệu để phù hợp với backend
      const updatePayload: any = {};
      
      if (data.fullName) {
        updatePayload.FullName = data.fullName;
      }
      if (data.phone) {
        updatePayload.PhoneNumber = data.phone;
      }
      if (data.address) {
        updatePayload.Address = data.address;
      }
      if (data.idNumber) {
        updatePayload.IdNumber = data.idNumber;
      }
      if (data.dateOfBirth) {
        const iso = String(data.dateOfBirth);
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
          const [y, m, d] = iso.split('-');
          updatePayload.DateOfBirth = `${d}/${m}/${y}`;
        } else {
          try {
            const date = new Date(iso);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            updatePayload.DateOfBirth = `${day}/${month}/${year}`;
          } catch {}
        }
      }

      // Log để debug
      if (import.meta.env.DEV) {
        console.log('📤 Update Profile Request:', {
          endpoint: `/Users/${userId}`,
          payload: updatePayload,
          userId
        });
      }

      // Gọi endpoint PUT /Users/{id} thay vì /Users/profile
      const response = await apiService.put<any>(
        `/Users/${userId}`,
        updatePayload
      );

      if (import.meta.env.DEV) {
        console.log('✅ Update Profile Response:', response);
      }

      // Sau khi update thành công, fetch lại user từ API để đảm bảo có đầy đủ thông tin
      // (bao gồm email, role, và các thông tin khác)
      let updatedUserData;
      try {
        updatedUserData = await this.getUserById(userId);
      } catch (fetchError) {
        console.warn('Failed to fetch updated user, using response data:', fetchError);
        // Fallback: dùng response từ update nếu fetch thất bại
        const userData = response.user || response;
        updatedUserData = this.normalizeUser(userData);
      }
      
      // QUAN TRỌNG: Merge với currentUser để giữ lại các thông tin quan trọng
      // (email, role, username, etc.) nếu backend không trả về đầy đủ
      const merged = {
        ...currentUser, // Giữ lại tất cả thông tin cũ trước
        ...updatedUserData, // Ghi đè bằng dữ liệu mới từ API
        // Đảm bảo các field quan trọng không bị mất
        email: updatedUserData.email || currentUser?.email || '',
        fullName: updatedUserData.fullName || currentUser?.fullName || '',
        role: updatedUserData.role || currentUser?.role || 'student',
        username: updatedUserData.username || currentUser?.username || '',
        // Merge các field không được backend hỗ trợ
        phone: data.phone ?? updatedUserData.phone ?? currentUser?.phone,
        address: data.address ?? currentUser?.address,
        idNumber: data.idNumber ?? currentUser?.idNumber,
        dateOfBirth: data.dateOfBirth ?? (updatedUserData as any).dateOfBirth ?? currentUser?.dateOfBirth,
        // Giữ lại các thông tin khác từ currentUser nếu không có trong updatedUserData
        isVerified: updatedUserData.isVerified ?? currentUser?.isVerified ?? false,
        isActive: updatedUserData.isActive ?? currentUser?.isActive ?? true,
        avatar: updatedUserData.avatar || currentUser?.avatar,
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(merged));
      return merged;
    } catch (error) {
      console.error('Error updating profile:', error);
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
      // Gọi API POST /api/Users/upload-avatar
      const result = await apiService.upload<{ avatarUrl?: string; url?: string }>(
        USER_ENDPOINTS.UPDATE_AVATAR,
        file
      );

      // Hỗ trợ cả hai dạng thuộc tính trả về từ BE: { avatarUrl } hoặc { url }
      const avatarUrl = result.avatarUrl ?? result.url ?? '';
      if (!avatarUrl) {
        throw new Error('Avatar URL not found in response');
      }
      
      // QUAN TRỌNG: Fetch lại user từ API để đảm bảo có đầy đủ thông tin (bao gồm avatarUrl)
      // Điều này đảm bảo khi F5, avatar vẫn còn vì đã được lưu vào localStorage từ API
      const currentUser = await this.getUserProfile();
      const userId = currentUser?.id;
      
      if (userId) {
        try {
          // Fetch lại user từ API để lấy avatarUrl mới nhất
          const updatedUserData = await this.getUserById(userId);
          // getUserById đã tự động lưu vào localStorage, không cần lưu lại
          return { avatarUrl: updatedUserData.avatar || avatarUrl };
        } catch (fetchError) {
          console.warn('Failed to fetch updated user after avatar upload, using response URL:', fetchError);
          // Fallback: cập nhật localStorage với avatarUrl từ response
          const updatedUser = { ...currentUser, avatar: avatarUrl, avatarUrl };
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
          return { avatarUrl };
        }
      } else {
        // Nếu không có userId, chỉ cập nhật localStorage với avatarUrl từ response
        const updatedUser = { ...currentUser, avatar: avatarUrl, avatarUrl };
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
        return { avatarUrl };
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
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
    try {
      console.log('📋 Fetching activity history from:', USER_ENDPOINTS.ACTIVITY_HISTORY);
      const response = await apiService.get<any[]>(
        USER_ENDPOINTS.ACTIVITY_HISTORY
      );
      console.log('📊 Activity history response:', response);
      return response;
    } catch (error) {
      console.warn('⚠️ Could not fetch real activity history:', error);
      // Return empty array instead of mock data
      return [];
    }
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

  /**
   * Gửi yêu cầu trở thành giáo viên
   * @param data - Thông tin yêu cầu
   * @returns Promise với message và requestId
   */
  async requestTeacherRole(data: {
    // Thông tin cũ (để tương thích)
    bankName?: string;
    BankName?: string;
    bankAccountName?: string;
    BankAccountName?: string;
    bankAccountNumber?: string;
    BankAccountNumber?: string;
    fullName?: string;
    FullName?: string;
    phoneNumber?: string;
    PhoneNumber?: string;
    gender?: string;
    Gender?: string;
    dateOfBirth?: string;
    DateOfBirth?: string;
    paymentMethod?: string;
    PaymentMethod?: string;
    paymentReference?: string;
    PaymentReference?: string;
    paymentStatus?: string;
    PaymentStatus?: string;
    paymentAmount?: number;
    PaymentAmount?: number;
    // Thông tin mới
    realName?: string;
    cccdOrTeacherCard?: string;
    evidenceImageUrl?: string;
    EvidenceImageUrl?: string;
    reason?: string;
    Reason?: string;
  }): Promise<{ message: string; requestId?: number }> {
    try {
      // Chuyển đổi sang PascalCase để phù hợp với backend
      const payload: any = {};
      
      if (data.FullName || data.fullName) payload.FullName = data.FullName || data.fullName;
      if (data.BankName || data.bankName) payload.BankName = data.BankName || data.bankName;
      if (data.BankAccountName || data.bankAccountName) payload.BankAccountName = data.BankAccountName || data.bankAccountName;
      if (data.BankAccountNumber || data.bankAccountNumber) payload.BankAccountNumber = data.BankAccountNumber || data.bankAccountNumber;
      if (data.PhoneNumber || data.phoneNumber) payload.PhoneNumber = data.PhoneNumber || data.phoneNumber;
      if (data.Gender || data.gender) payload.Gender = data.Gender || data.gender;
      if (data.DateOfBirth || data.dateOfBirth) payload.DateOfBirth = data.DateOfBirth || data.dateOfBirth;
      if (data.PaymentMethod || data.paymentMethod) payload.PaymentMethod = data.PaymentMethod || data.paymentMethod;
      if (data.PaymentReference || data.paymentReference) payload.PaymentReference = data.PaymentReference || data.paymentReference;
      if (data.PaymentStatus || data.paymentStatus) payload.PaymentStatus = data.PaymentStatus || data.paymentStatus;
      if (data.PaymentAmount !== undefined) payload.PaymentAmount = data.PaymentAmount;
      if (data.EvidenceImageUrl || data.evidenceImageUrl) payload.EvidenceImageUrl = data.EvidenceImageUrl || data.evidenceImageUrl;
      if (data.Reason || data.reason) payload.Reason = data.Reason || data.reason;

      if (import.meta.env.DEV) {
        console.log('📤 Request payload (PascalCase):', payload);
      }
      
      const response = await apiService.post<{ message: string; requestId?: number }>(
        '/Users/request-teacher-role',
        payload
      );
      
      if (import.meta.env.DEV) {
        console.log('✅ Response:', response);
      }
      
      return response;
    } catch (error: any) {
      console.error('Error requesting teacher role:', error);
      // Log chi tiết lỗi để debug
      if (import.meta.env.DEV) {
        console.error('Response status:', error?.response?.status);
        console.error('Response data:', error?.response?.data);
        console.error('Error message:', error?.message);
      }
      
      // Xử lý lỗi validation từ backend
      let errorMessage = 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      
      if (error?.response?.data) {
        const responseData = error.response.data;
        
        // Lỗi validation (400 Bad Request)
        if (error.response.status === 400) {
          if (responseData.errors && typeof responseData.errors === 'object') {
            // ModelState errors từ ASP.NET Core
            const validationErrors: string[] = [];
            Object.keys(responseData.errors).forEach(key => {
              const messages = responseData.errors[key];
              if (Array.isArray(messages)) {
                validationErrors.push(...messages);
              } else if (typeof messages === 'string') {
                validationErrors.push(messages);
              }
            });
            errorMessage = validationErrors.length > 0 
              ? validationErrors.join(', ') 
              : responseData.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
          } else if (responseData.message) {
            errorMessage = responseData.message;
          } else if (typeof responseData === 'string') {
            errorMessage = responseData;
          }
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.Message) {
          errorMessage = responseData.Message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}

// ==================== EXPORT ====================

export const userService = new UserService();
export default userService;
