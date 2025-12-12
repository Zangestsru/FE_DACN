// Users Service for TailAdmin
// Manages user-related API calls via Admin endpoints

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

// Frontend User interface
export interface User {
  id: string;
  username?: string;
  email: string;
  fullName: string;
  role: string;
  createdDate: string;
  isActive: boolean;
  avatar?: string;
  phoneNumber?: string;
  status?: string;
  roleId?: number;
}

// Backend response format (can be PascalCase or camelCase depending on API Gateway)
interface BackendUser {
  UserId?: number;
  userId?: number; // camelCase from API Gateway
  Email?: string;
  email?: string;
  PhoneNumber?: string;
  phoneNumber?: string;
  FullName?: string;
  fullName?: string;
  RoleId?: number;
  roleId?: number;
  RoleName?: string;
  roleName?: string;
  Gender?: string;
  gender?: string;
  DateOfBirth?: string;
  dateOfBirth?: string;
  AvatarUrl?: string;
  avatarUrl?: string;
  Status?: string;
  status?: string;
  IsEmailVerified?: boolean;
  isEmailVerified?: boolean;
  CreatedAt?: string;
  createdAt?: string;
  UpdatedAt?: string;
  updatedAt?: string;
  LastLoginAt?: string;
  lastLoginAt?: string;
}

interface GetAllUsersResponse {
  Users: BackendUser[];
  TotalCount: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
  isActive?: boolean;
  status?: string;
}

export interface UpdateRoleRequest {
  Role: string;
}

// Helper function to map backend user to frontend user
// Handles both PascalCase (from backend) and camelCase (from API Gateway)
function mapBackendUserToFrontend(backendUser: any): User {
  // Safely extract values with fallback to camelCase
  const userId = backendUser.UserId ?? backendUser.userId;
  const email = backendUser.Email ?? backendUser.email ?? '';
  const fullName = backendUser.FullName ?? backendUser.fullName ?? '';
  const roleName = backendUser.RoleName ?? backendUser.roleName;
  const phoneNumber = backendUser.PhoneNumber ?? backendUser.phoneNumber;
  const avatarUrl = backendUser.AvatarUrl ?? backendUser.avatarUrl;
  const status = backendUser.Status ?? backendUser.status;
  const roleId = backendUser.RoleId ?? backendUser.roleId;
  const createdAt = backendUser.CreatedAt ?? backendUser.createdAt;
  
  // Map RoleName to lowercase for frontend consistency
  // Backend returns: "Admin", "Teacher", "Student"
  // Frontend expects: "admin", "teacher", "student"
  const role = roleName?.toLowerCase() || 'student';
  
  // Safely handle UserId - can be number or undefined
  const userIdString = userId !== null && userId !== undefined ? String(userId) : '';
  
  return {
    id: userIdString,
    email: email,
    fullName: fullName,
    role: role,
    createdDate: createdAt ? String(createdAt) : '',
    isActive: status?.toLowerCase() === 'active',
    avatar: avatarUrl,
    phoneNumber: phoneNumber,
    status: status,
    roleId: roleId,
  };
}

class UsersService {
  // Get all users with pagination and filters
  async getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<{ users: User[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search && params.search.trim()) queryParams.append('search', params.search.trim());
      if (params?.status && params.status.trim()) queryParams.append('status', params.status.trim());
      // Only append role if it's not empty and not undefined
      if (params?.role && params.role.trim()) {
        queryParams.append('role', params.role.trim());
      }

      const endpoint = `${API_ENDPOINTS.admin.users.getAll}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const debug = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production') && (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true');
      const log = (...args: unknown[]) => { if (debug) console.log(...args); };
      log('🌐 Calling endpoint:', endpoint);
      
      const response = await apiService.get<any>(endpoint);
      
      log('🔍 UsersService.getUsers - Raw response:', response);
      log('🔍 Response type:', typeof response);
      log('🔍 Is array?', Array.isArray(response));
      if (response && typeof response === 'object') {
        log('🔍 Response keys:', Object.keys(response));
        log('🔍 Response has Users?', 'Users' in response);
        log('🔍 Response has users?', 'users' in response);
        log('🔍 Response has data?', 'data' in response);
        log('🔍 Response has Data?', 'Data' in response);
        if ('Users' in response) {
          log('🔍 Users value:', response.Users);
          log('🔍 Users is array?', Array.isArray(response.Users));
          log('🔍 Users length:', response.Users?.length);
        }
      }
      
      // Handle wrapped response (data or Data) or direct response
      // Backend returns PascalCase { Users, TotalCount } but API Gateway may convert to camelCase { users, totalCount }
      let responseData: GetAllUsersResponse;
      if (response && typeof response === 'object') {
        // Try different possible response formats
        if ('data' in response && response.data) {
          log('📦 Found response.data');
          responseData = response.data;
        } else if ('Data' in response && response.Data) {
          log('📦 Found response.Data');
          responseData = response.Data;
        } else if ('Users' in response || 'users' in response) {
          // Handle both PascalCase (Users) and camelCase (users)
          log('📦 Found Users/users - direct GetAllUsersResponse');
          // Normalize to PascalCase format for processing
          const usersArray = response.Users || response.users || [];
          responseData = {
            Users: usersArray,
            TotalCount: response.TotalCount ?? response.totalCount ?? usersArray.length,
            Page: response.Page ?? response.page ?? (params?.page || 1),
            PageSize: response.PageSize ?? response.pageSize ?? (params?.pageSize || 10),
            TotalPages: response.TotalPages ?? response.totalPages ?? Math.ceil((response.TotalCount ?? response.totalCount ?? usersArray.length) / (response.PageSize ?? response.pageSize ?? (params?.pageSize || 10)))
          };
        } else if (Array.isArray(response)) {
          // If response is directly an array of users
          log('📦 Response is array - wrapping in GetAllUsersResponse');
          responseData = {
            Users: response,
            TotalCount: response.length,
            Page: params?.page || 1,
            PageSize: params?.pageSize || 10,
            TotalPages: Math.ceil(response.length / (params?.pageSize || 10))
          };
        } else {
          // If response is directly the GetAllUsersResponse (try both cases)
          log('📦 Using response as GetAllUsersResponse');
          const usersArray = (response as any).Users || (response as any).users || [];
          responseData = {
            Users: usersArray,
            TotalCount: (response as any).TotalCount ?? (response as any).totalCount ?? usersArray.length,
            Page: (response as any).Page ?? (response as any).page ?? (params?.page || 1),
            PageSize: (response as any).PageSize ?? (response as any).pageSize ?? (params?.pageSize || 10),
            TotalPages: (response as any).TotalPages ?? (response as any).totalPages ?? Math.ceil(((response as any).TotalCount ?? (response as any).totalCount ?? usersArray.length) / ((response as any).PageSize ?? (response as any).pageSize ?? (params?.pageSize || 10)))
          };
        }
      } else {
        console.error('❌ Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      log('✅ UsersService.getUsers - Parsed response:', responseData);
      log('📊 Users array:', responseData.Users);
      log('📊 Users count:', responseData.Users?.length || 0);
      log('📊 TotalCount:', responseData.TotalCount);
      
      // Map backend users to frontend format
      const users = (responseData.Users || []).map(mapBackendUserToFrontend);
      
      log('👥 Mapped users:', users);
      log('👥 Mapped users count:', users.length);
      
      return {
        users,
        totalCount: responseData.TotalCount || 0,
        page: responseData.Page || 1,
        pageSize: responseData.PageSize || 10,
        totalPages: responseData.TotalPages || 1,
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiService.get<BackendUser>(API_ENDPOINTS.users.getById(id));
      return mapBackendUserToFrontend(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      // Map frontend format to backend format
      const backendData: any = {};
      if (userData.email) backendData.Email = userData.email;
      if (userData.fullName) backendData.FullName = userData.fullName;
      if (userData.status) backendData.Status = userData.status;
      
      await apiService.put(API_ENDPOINTS.admin.users.update(id), backendData);
      
      // Fetch updated user
      return await this.getUserById(id);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Update user role by role name
  async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      const payload: UpdateRoleRequest = { Role: role };
      const response = await apiService.put<BackendUser>(API_ENDPOINTS.admin.users.updateRole(userId), payload);
      return mapBackendUserToFrontend(response);
    } catch (error) {
      console.error(`Error updating user role ${userId}:`, error);
      throw error;
    }
  }

  // Lock user
  async lockUser(id: string): Promise<void> {
    try {
      await apiService.put(API_ENDPOINTS.admin.users.lock(id), {});
    } catch (error) {
      console.error(`Error locking user ${id}:`, error);
      throw error;
    }
  }

  // Unlock user
  async unlockUser(id: string): Promise<void> {
    try {
      await apiService.put(API_ENDPOINTS.admin.users.unlock(id), {});
    } catch (error) {
      console.error(`Error unlocking user ${id}:`, error);
      throw error;
    }
  }

  // Delete user (soft delete)
  async deleteUser(id: string): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.admin.users.delete(id));
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
export default usersService;