// Base API Service for TailAdmin
// Handles HTTP requests to backend via API Gateway

import { API_CONFIG } from '../config/api.config';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export class ApiService {
  protected baseUrl: string;
  private timeout: number;
  private baseHeaders: Record<string, string>;
  private debug: boolean;

  constructor() {
    this.baseUrl = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.baseHeaders = API_CONFIG.headers;
    this.debug = (typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true') || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE !== 'production');
  }

  // Get auth headers with token from localStorage
  protected async getHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const headers = { ...this.baseHeaders, ...customHeaders };
    
    // Get token from localStorage (in real app, you'd get this from AuthContext)
    let token = localStorage.getItem('authToken');
    if (!token) {
      token = localStorage.getItem('access_token') || '';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = await this.getHeaders(customHeaders);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // ✅ Check if data is FormData (for file uploads)
      const isFormData = data instanceof FormData;
      
      // ✅ If FormData, remove Content-Type header (browser will set it with boundary)
      if (isFormData) {
        delete requestHeaders['Content-Type'];
        delete requestHeaders['content-type'];
      }

      const config: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (data && method !== 'GET') {
        // ✅ Don't stringify FormData - send it directly
        config.body = isFormData ? data : JSON.stringify(data);
      }

      if (this.debug) {
        console.log(`🌐 API Request: ${method} ${url}`);
        console.log('📤 Request headers:', requestHeaders);
      }
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (this.debug) {
        console.log(`📥 API Response: ${response.status} ${response.statusText}`);
      }

      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ 401 Unauthorized - Token expired or invalid');
        // Token expired or invalid - clear auth data and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        throw new Error('Authentication required');
      }
      
      // Handle forbidden errors (403)
      if (response.status === 403) {
        console.error('❌ 403 Forbidden - User does not have admin role');
        const errorText = await response.text();
        let errorMessage = 'Bạn không có quyền truy cập trang này. Chỉ admin mới có thể xem danh sách người dùng.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.Message || errorMessage;
        } catch {
          // Use default message
        }
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = {};
        try {
          const text = await response.text();
          if (text) {
            errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.Message || errorMessage;
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.response = { data: errorData };
        throw error;
      }

      const result = await response.json();
      if (this.debug) {
        console.log('📦 API Response body:', result);
      }
      return result;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  protected async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  protected async post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, data, headers);
  }

  protected async put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, headers);
  }

  protected async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, headers);
  }
}

export const apiService = new ApiService();
export default apiService;