// Base API Service for TailAdmin
// Handles HTTP requests to backend via API Gateway

import { API_CONFIG, API_ENDPOINTS } from '../config/api.config';

export class ApiService {
  protected baseUrl: string;
  private timeout: number;
  private baseHeaders: Record<string, string>;
  private debug: boolean;
  private authToken: string | null;

  constructor() {
    this.baseUrl = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.baseHeaders = API_CONFIG.headers;
    this.debug = typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true';
    const envAny = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
    const envToken = (envAny.VITE_TEST_TOKEN && String(envAny.VITE_TEST_TOKEN).trim()) ? String(envAny.VITE_TEST_TOKEN).trim() : '';
    this.authToken = envToken || null;
  }

  // Get auth headers with token from localStorage
  protected async getHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const headers = { ...this.baseHeaders, ...customHeaders };
    
    // Prefer tokens from localStorage first, then fallback to in-memory/env token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || localStorage.getItem('access_token') || this.authToken || '';
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
    const requestHeaders = await this.getHeaders(customHeaders);
    const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
    const directBase = (() => {
      if (isAbsolute) return '';
      if (endpoint.startsWith('/Admin') || endpoint.startsWith('/Auth') || endpoint.startsWith('/Users')) return 'http://localhost:5001/api';
      if (endpoint.startsWith('/Exams') || endpoint.startsWith('/question-bank') || endpoint.startsWith('/subjects') || endpoint.startsWith('/Courses') || endpoint.startsWith('/Lessons') || endpoint.startsWith('/Statistics')) return 'http://localhost:5002/api';
      if (endpoint.startsWith('/Materials')) return 'http://localhost:5003/api';
      if (endpoint.startsWith('/Chat')) return 'http://localhost:5004/api';
      return '';
    })();

    const bases = isAbsolute ? [''] : [this.baseUrl, directBase].filter(Boolean);
    let lastError: any = null;
    for (const base of bases) {
      const url = isAbsolute ? endpoint : `${base}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const isFormData = data instanceof FormData;
      if (isFormData) {
        delete requestHeaders['Content-Type'];
        delete requestHeaders['content-type'];
      }

      const config: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };
      if (data && method !== 'GET') config.body = isFormData ? data : JSON.stringify(data);

      try {
        if (this.debug) {
          const maskedHeaders: Record<string, string> = { ...requestHeaders };
          if (maskedHeaders.Authorization) {
            const t = maskedHeaders.Authorization;
            const last = t.slice(Math.max(0, t.length - 6));
            maskedHeaders.Authorization = `Bearer ***${last}`;
          }
          console.log(`🌐 API Request: ${method} ${url}`);
          console.log('📤 Request headers:', maskedHeaders);
        }

        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (this.debug) console.log(`📥 API Response: ${response.status} ${response.statusText}`);

        if (response.status === 401) {
          const rt = localStorage.getItem('refresh_token') || localStorage.getItem('refreshToken') || '';
          if (rt) {
            try {
              const refreshController = new AbortController();
              const refreshTimeoutId = setTimeout(() => refreshController.abort(), Math.max(5000, this.timeout));
              const refreshUrl = isAbsolute ? '' : `${base}${API_ENDPOINTS.auth.refresh}`;
              const refreshRes = await fetch(refreshUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }), signal: refreshController.signal });
              clearTimeout(refreshTimeoutId);
              if (refreshRes.ok) {
                const rr = await refreshRes.json();
                const anyR: any = rr;
                const newToken = anyR?.token || anyR?.data?.token || anyR?.Data?.token || '';
                const newRefresh = anyR?.refreshToken || anyR?.data?.refreshToken || anyR?.Data?.refreshToken || '';
                if (newToken && typeof newToken === 'string') {
                  try {
                    localStorage.setItem('authToken', newToken);
                    localStorage.setItem('access_token', newToken);
                    localStorage.setItem('auth_token', newToken);
                    if (newRefresh && typeof newRefresh === 'string') {
                      localStorage.setItem('refresh_token', newRefresh);
                      localStorage.setItem('refreshToken', newRefresh);
                    }
                  } catch {}
                  this.setAuthToken(newToken);
                  const retryHeaders = await this.getHeaders(customHeaders);
                  const retryConfig: RequestInit = { method, headers: retryHeaders, signal: controller.signal };
                  if (data && method !== 'GET') retryConfig.body = isFormData ? data : JSON.stringify(data);
                  const retryRes = await fetch(url, retryConfig);
                  clearTimeout(timeoutId);
                  if (retryRes.status === 401) {
                    throw new Error('Authentication required');
                  }
                  if (!retryRes.ok) {
                    let errorMessage = `HTTP error! status: ${retryRes.status}`;
                    let errorData: any = {}; let rawText: string | undefined;
                    try {
                      const text = await retryRes.text(); rawText = text;
                      if (text) {
                        try { errorData = JSON.parse(text); errorMessage = errorData.message || errorData.Message || errorMessage; }
                        catch { errorData = { raw: text }; errorMessage = retryRes.statusText || errorMessage; }
                      }
                    } catch { errorMessage = retryRes.statusText || errorMessage; }
                    const error = new Error(errorMessage) as any; error.status = retryRes.status; error.response = { data: errorData }; if (rawText && !errorData?.raw) error.raw = rawText;
                    lastError = error;
                    throw error;
                  }
                  const ct2 = retryRes.headers.get('content-type') || '';
                  let result2: any;
                  if (ct2.includes('application/json')) result2 = await retryRes.json();
                  else {
                    const textBody = await retryRes.text();
                    try { result2 = JSON.parse(textBody); }
                    catch { result2 = { data: textBody, success: true, message: retryRes.statusText } as any; }
                  }
                  if (this.debug) console.log('📦 API Response body (after refresh):', result2);
                  return result2 as T;
                }
              }
            } catch {}
          }
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          const errorText = await response.text();
          let errorMessage = 'Bạn không có quyền truy cập trang này. Chỉ admin mới có thể xem danh sách người dùng.';
          try { const errorData = JSON.parse(errorText); errorMessage = errorData.message || errorData.Message || errorMessage; } catch {}
          throw new Error(errorMessage);
        }
        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          let errorData: any = {}; let rawText: string | undefined;
          try {
            const text = await response.text(); rawText = text;
            if (text) {
              try { errorData = JSON.parse(text); errorMessage = errorData.message || errorData.Message || errorMessage; }
              catch { errorData = { raw: text }; errorMessage = response.statusText || errorMessage; }
            }
          } catch { errorMessage = response.statusText || errorMessage; }
          const dbg = this.debug;
          if (dbg && typeof endpoint === 'string' && endpoint.includes('/question-bank/generate-ai')) {
            console.warn('🧪 AI error raw:', rawText || (errorData && (errorData.raw || errorData.Content || errorData.data)) || '');
          }
          const error = new Error(errorMessage) as any; error.status = response.status; error.response = { data: errorData }; if (rawText && !errorData?.raw) error.raw = rawText;
          // If first attempt (gateway) failed with 5xx or 404 and we have direct base, try next base
          lastError = error;
          const shouldFallback = !isAbsolute && base === this.baseUrl && directBase && (response.status >= 500 || response.status === 404);
          if (shouldFallback) {
            if (this.debug) console.log(`🔄 Fallback to direct service: ${directBase}${endpoint} (original error: ${response.status})`);
            continue;
          }
          throw error;
        }

        const ct = response.headers.get('content-type') || '';
        let result: any;
        if (ct.includes('application/json')) result = await response.json();
        else {
          const textBody = await response.text();
          try { result = JSON.parse(textBody); }
          catch { result = { data: textBody, success: true, message: response.statusText } as any; }
        }
        if (this.debug) console.log('📦 API Response body:', result);
        return result;
      } catch (error) {
        const ep = endpoint || ''; const isAiGenerate = typeof ep === 'string' && ep.includes('/question-bank/generate-ai'); const logFn = this.debug ? (isAiGenerate ? console.warn : console.error) : null;
        if (logFn) logFn(`API Error [${method} ${endpoint}]:`, error);
        lastError = error;
        // If first attempt failed due to network or 5xx, try direct base; fallback done above via continue
        if (!isAbsolute && base === this.baseUrl && directBase) {
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  async post<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, data, headers);
  }

  async put<T>(endpoint: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, headers);
  }

  setAuthToken(token: string | null): void {
    this.authToken = token || null;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }
}

export const apiService = new ApiService();
export default apiService;
