// Users Service for TailAdmin
// Manages user-related API calls

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdDate: string;
  isActive: boolean;
  avatar?: string;
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
}

class UsersService {
  // Get all users
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<User[]>(API_ENDPOINTS.users.getAll);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiService.get<User>(API_ENDPOINTS.users.getById(id));
      return response;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await apiService.post<User>(API_ENDPOINTS.users.create, userData);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiService.put<User>(API_ENDPOINTS.users.update(id), userData);
      return response;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.users.delete(id));
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
export default usersService;