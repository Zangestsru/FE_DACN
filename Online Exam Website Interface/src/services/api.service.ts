
/**
 * API Service
 * Service cơ sở cho tất cả API calls
 * Cung cấp axios instance đã được cấu hình và các utility functions
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { IApiResponse, IApiError } from '@/types';
import { AUTH_ENDPOINTS, STORAGE_KEYS } from '@/constants';

// ==================== API BASE CONFIGURATION ====================

/**
 * API Base URL - Lấy từ biến môi trường
 * Mặc định sử dụng localhost nếu không có biến môi trường
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

/**
 * API Version
 */
export const API_VERSION = ''; // No version prefix for backend API

/**
 * Full API URL
 */
// Build base API path robustly even when API_VERSION is empty
const API_PATH = '/api';

export const API_URL = `${API_BASE_URL}${API_PATH}`;

if (import.meta.env.DEV) {
  try {
    console.log('🔧 API_BASE_URL:', API_BASE_URL, 'API_URL:', API_URL);
  } catch {}
}

// Paths served by ExamsService (fallback when API Gateway returns 500/502)
const EXAMS_SERVICE_PATHS = [
  '/Exams',
  '/subjects',
  '/question-bank',
  '/ExamAttempts',
];

// ==================== TIMEOUT SETTINGS ====================

/**
 * Request timeout (milliseconds)
 */
export const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Upload timeout (milliseconds)
 */
export const UPLOAD_TIMEOUT = 120000; // 2 minutes

/**
 * Download timeout (milliseconds)
 */
export const DOWNLOAD_TIMEOUT = 180000; // 3 minutes

// ==================== DEFAULT HEADERS ====================

/**
 * Default headers cho tất cả requests
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Headers cho multipart/form-data (upload files)
 */
export const MULTIPART_HEADERS = {
  'Content-Type': 'multipart/form-data',
};

// ==================== AXIOS INSTANCE ====================

/**
 * Tạo Axios instance với cấu hình mặc định
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: DEFAULT_HEADERS,
  withCredentials: true,
});

// ==================== REQUEST INTERCEPTOR ====================

/**
 * Request Interceptor
 * Xử lý trước khi gửi request
 */
apiClient.interceptors.request.use(
  (config: any) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    // Thêm Authorization header nếu có token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Thêm timestamp vào request để tránh cache
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }

    // Log request trong development mode
    if (import.meta.env.DEV) {
      try {
        const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullUrl,
          data: config.data,
          params: config.params,
        });
      } catch {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          params: config.params,
        });
      }
    }

    return config;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================

/**
 * Response Interceptor
 * Xử lý response trước khi trả về component
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response trong development mode
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    // Log error trong development mode
    if (import.meta.env.DEV) {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Xử lý các lỗi phổ biến
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config?.url || '';

      switch (status) {
        case 401: {
          // Tránh redirect về /login khi chính request /auth/* trả về 401 (ví dụ: sai mật khẩu, sai OTP)
          // Chỉ redirect khi 401 xảy ra ở các endpoint khác (token hết hạn trên các request thường)
          const isAuthRequest =
            requestUrl.includes('/auth/') ||
            requestUrl.includes(AUTH_ENDPOINTS.LOGIN) ||
            requestUrl.includes(AUTH_ENDPOINTS.REGISTER) ||
            requestUrl.includes(AUTH_ENDPOINTS.VERIFY_LOGIN_OTP) ||
            requestUrl.includes(AUTH_ENDPOINTS.VERIFY_OTP) ||
            requestUrl.includes(AUTH_ENDPOINTS.FORGOT_PASSWORD) ||
            requestUrl.includes(AUTH_ENDPOINTS.RESET_PASSWORD) ||
            requestUrl.includes(AUTH_ENDPOINTS.RESEND_OTP);

          if (!isAuthRequest) {
            handleUnauthorized();
          }
          break;
        }
        case 403: {
          // Không tự động redirect cho các endpoint start exam để component có thể xử lý lỗi chi tiết
          const isStartExamRequest = requestUrl.includes('/Exams/') && requestUrl.includes('/start');
          
          if (isStartExamRequest) {
            // Cho phép component xử lý lỗi 403 cho start exam
            console.warn('⚠️ 403 Forbidden on start exam - letting component handle it');
          } else {
            // Tự động redirect cho các endpoint khác
          handleForbidden();
          }
          break;
        }
        case 404:
          console.error('Resource not found');
          break;
        case 500: {
          const respData: any = error.response?.data as any;
          const errorMessage = respData?.message || respData?.Message || 'Lỗi máy chủ. Vui lòng thử lại sau.';
          console.error('Server error occurred:', errorMessage);
          // Tạo error object với message để frontend có thể hiển thị
          try {
            const dataRef: any = error.response?.data;
            if (dataRef && typeof dataRef === 'object') {
              (dataRef as any)._errorMessage = errorMessage;
            } else if (error.response) {
              (error.response as any).data = { _errorMessage: errorMessage, message: errorMessage };
            }
          } catch {}
          break;
        }
        case 503:
          console.error('Service temporarily unavailable');
          break;
        default:
          console.error('An error occurred:', error.message);
      }
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error setting up request:', error.message);
    }

    return Promise.reject(error);
  }
);

// ==================== ERROR HANDLERS ====================

/**
 * Xử lý khi token hết hạn hoặc không hợp lệ
 */
const handleUnauthorized = () => {
  try {
    // Clear invalid token
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    // Redirect to login page
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      console.warn('🔄 Redirecting to login due to unauthorized access');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error handling unauthorized access:', error);
  }
};

/**
 * Xử lý khi không có quyền truy cập
 */
const handleForbidden = () => {
  try {
    if (typeof window !== 'undefined') {
      // Kiểm tra xem user có đăng nhập không
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        // Nếu chưa đăng nhập, redirect đến login
        window.location.href = '/login';
      } else {
        // Nếu đã đăng nhập nhưng không có quyền, redirect đến 403
      window.location.href = '/403';
      }
    }
  } catch {}
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Set Authorization token
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('access_token', token);
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Remove Authorization token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Get Authorization token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// ==================== REQUEST HELPERS ====================

/**
 * Create request config with custom timeout
 */
export const createRequestConfig = (
  timeout?: number,
  headers?: Record<string, string>
): AxiosRequestConfig => {
  return {
    timeout: timeout || REQUEST_TIMEOUT,
    headers: {
      ...DEFAULT_HEADERS,
      ...headers,
    },
  };
};

/**
 * Create upload request config
 */
export const createUploadConfig = (
  onUploadProgress?: (progressEvent: any) => void
): AxiosRequestConfig => {
  return {
    timeout: UPLOAD_TIMEOUT,
    // Ghi đè Content-Type mặc định (application/json) bằng multipart/form-data
    // Trình duyệt sẽ tự thêm boundary, không cần tự đặt boundary thủ công
    headers: MULTIPART_HEADERS,
    onUploadProgress,
  };
};

/**
 * Create download request config
 */
export const createDownloadConfig = (
  onDownloadProgress?: (progressEvent: any) => void
): AxiosRequestConfig => {
  return {
    timeout: DOWNLOAD_TIMEOUT,
    responseType: 'blob',
    onDownloadProgress,
  };
};

// ==================== API SERVICE CLASS ====================

/**
 * API Service Class
 * Cung cấp các methods để tương tác với API
 */
class ApiService {
  private async requestWithFallback<T>(
    fn: () => Promise<AxiosResponse<any>>, 
    method: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE',
    url: string,
    payload?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await fn();
      const data = response.data;
      const payloadOut = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
      return payloadOut as T;
    } catch (error: any) {
      const status = error?.response?.status;
      const isGatewayError = status === 502 || status === 500;
      const isExamsServicePath = EXAMS_SERVICE_PATHS.some(p => url.startsWith(p));
      const noResponse = !error?.response && !!error?.request;
      if (import.meta.env.DEV && isExamsServicePath && (isGatewayError || noResponse)) {
        try {
          const altBase = (import.meta.env.VITE_EXAMS_SERVICE_URL || 'http://localhost:5002');
          const fullUrl = `${altBase}${API_PATH}${url}`;
          const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          const headers: any = {
            ...DEFAULT_HEADERS,
          };
          if (token) headers.Authorization = `Bearer ${token}`;
          let resp: AxiosResponse<any>;
          switch (method) {
            case 'GET':
              resp = await axios.get(fullUrl, { ...(config||{}), headers, withCredentials: true });
              break;
            case 'POST':
              resp = await axios.post(fullUrl, payload, { ...(config||{}), headers, withCredentials: true });
              break;
            case 'PUT':
              resp = await axios.put(fullUrl, payload, { ...(config||{}), headers, withCredentials: true });
              break;
            case 'PATCH':
              resp = await axios.patch(fullUrl, payload, { ...(config||{}), headers, withCredentials: true });
              break;
            case 'DELETE':
              resp = await axios.delete(fullUrl, { ...(config||{}), headers, withCredentials: true });
              break;
          }
          const data = resp.data;
          const payloadOut = (data && typeof data === 'object' && 'data' in data) ? (data as any).data : data;
          return payloadOut as T;
        } catch (fallbackError) {
          throw this.handleError(fallbackError);
        }
      }
      throw this.handleError(error);
    }
  }
  /**
   * GET request
   */
  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.requestWithFallback<T>(
      () => apiClient.get<any>(url, config),
      'GET',
      url,
      undefined,
      config
    );
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithFallback<T>(
      () => apiClient.post<any>(url, data, config),
      'POST',
      url,
      data,
      config
    );
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithFallback<T>(
      () => apiClient.put<any>(url, data, config),
      'PUT',
      url,
      data,
      config
    );
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithFallback<T>(
      () => apiClient.patch<any>(url, data, config),
      'PATCH',
      url,
      data,
      config
    );
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.requestWithFallback<T>(
      () => apiClient.delete<any>(url, config),
      'DELETE',
      url,
      undefined,
      config
    );
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = createUploadConfig(onUploadProgress);
      // Không thiết lập Content-Type thủ công để trình duyệt tự thêm boundary cho multipart/form-data
      const response = await apiClient.post(url, formData, config);
      // Hỗ trợ cả hai dạng response: có wrapper { data: ... } hoặc trả về payload trực tiếp
      const payload = (response.data && typeof response.data === 'object' && 'data' in response.data)
        ? (response.data as any).data
        : response.data;
      return payload as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Download file
   */
  async download(
    url: string,
    filename: string,
    onDownloadProgress?: (progressEvent: any) => void
  ): Promise<void> {
    try {
      const config = createDownloadConfig(onDownloadProgress);
      const response = await apiClient.get(url, config);

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): IApiError {
    const apiError: IApiError = {
      message: 'Đã có lỗi xảy ra',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;

      if (axiosError.response) {
        apiError.statusCode = axiosError.response.status;
        const dataAny: any = axiosError.response.data as any;
        const serverMsg = dataAny?._errorMessage || dataAny?.message || dataAny?.Message;
        apiError.message = serverMsg || axiosError.message;
        apiError.code = dataAny?.code || `HTTP_${axiosError.response.status}`;
        apiError.details = dataAny?.details;
      } else if (axiosError.request) {
        // Request made but no response
        apiError.message = 'Không thể kết nối đến server';
        apiError.code = 'NETWORK_ERROR';
        apiError.statusCode = 0;
      } else {
        // Error in request setup
        apiError.message = axiosError.message;
        apiError.code = 'REQUEST_ERROR';
      }
    } else if (error instanceof Error) {
      apiError.message = error.message;
    }

    return apiError;
  }
}

// ==================== EXPORT ====================

// Export API Service instance
export const apiService = new ApiService();

// Export axios client for direct use if needed
export default apiClient;
