/**
 * Generic API Hook
 * Hook tổng quát để xử lý API calls với loading, error, và data states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError } from 'axios';
import { ERROR_MESSAGES } from '@/constants';

// ==================== TYPES ====================

/**
 * Options cho useApi hook
 */
export interface IUseApiOptions<T> {
  /** Tự động fetch khi component mount */
  immediate?: boolean;
  /** Initial data */
  initialData?: T;
  /** Callback khi fetch thành công */
  onSuccess?: (data: T) => void;
  /** Callback khi có lỗi */
  onError?: (error: Error) => void;
  /** Số lần retry khi lỗi */
  retryCount?: number;
  /** Delay giữa các lần retry (ms) */
  retryDelay?: number;
  /** Cache key để lưu data */
  cacheKey?: string;
  /** Cache time (ms) */
  cacheTime?: number;
}

/**
 * Return type của useApi hook
 */
export interface IUseApiReturn<T, P extends any[] = any[]> {
  /** Dữ liệu từ API */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error nếu có */
  error: Error | null;
  /** Function để gọi lại API */
  refetch: (...args: P) => Promise<void>;
  /** Function để reset state */
  reset: () => void;
  /** Function để set data manually */
  setData: (data: T | null) => void;
}

// ==================== CACHE STORAGE ====================

/**
 * Simple in-memory cache
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const inflight = new Map<string, Promise<any>>();

/**
 * Get cached data
 */
const getCachedData = <T>(key: string, cacheTime: number): T | null => {
  const cached = cache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > cacheTime;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
};

/**
 * Set cached data
 */
const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

// ==================== USE API HOOK ====================

/**
 * Generic API hook
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useApi(
 *   examService.getAllExams,
 *   { immediate: true }
 * );
 * ```
 */
export function useApi<T, P extends any[] = any[]>(
  serviceFunction: (...args: P) => Promise<T>,
  options: IUseApiOptions<T> = {}
): IUseApiReturn<T, P> {
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes default
  } = options;

  // States
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs để tránh stale closure
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  /**
   * Execute API call với retry logic
   */
  const execute = useCallback(
    async (...args: P): Promise<void> => {
      if (cacheKey && inflight.has(cacheKey)) {
        return;
      }
      // Check cache first
      if (cacheKey) {
        const cachedData = getCachedData<T>(cacheKey, cacheTime);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        let promise: Promise<any> = serviceFunction(...args);
        if (cacheKey) inflight.set(cacheKey, promise);
        const result = await promise;

        console.log('🎯 useApi execute - result received:', result);

        if (!isMountedRef.current) {
          console.log('⚠️ useApi - component unmounted, skipping state update');
          return;
        }

        console.log('📝 useApi - updating state with data');
        setData(result);
        setLoading(false);
        retryCountRef.current = 0;

        // Cache data
        if (cacheKey) {
          setCachedData(cacheKey, result);
        }

        // Success callback
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        if (!isMountedRef.current) return;

        // Chuẩn hóa thông điệp lỗi (ưu tiên message từ server nếu có)
        let error: Error;
        if (axios.isAxiosError(err)) {
          const axiosErr = err as AxiosError<any>;
          const serverMessage = axiosErr.response?.data?.message;
          const status = axiosErr.response?.status;
          const friendlyMessage =
            serverMessage ||
            (status === 401 ? ERROR_MESSAGES.INVALID_CREDENTIALS : axiosErr.message) ||
            ERROR_MESSAGES.SOMETHING_WENT_WRONG;
          error = new Error(friendlyMessage);
        } else if (err instanceof Error) {
          error = err;
        } else {
          error = new Error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
        }

        // Retry logic
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++;
          console.log(`Retrying... (${retryCountRef.current}/${retryCount})`);

          setTimeout(() => {
            execute(...args);
          }, retryDelay);

          return;
        }

        setError(error);
        setLoading(false);
        retryCountRef.current = 0;

        // Error callback
        if (onError) {
          onError(error);
        }
      } finally {
        if (cacheKey) inflight.delete(cacheKey);
      }
    },
    [serviceFunction, onSuccess, onError, retryCount, retryDelay, cacheKey, cacheTime]
  );

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    retryCountRef.current = 0;
  }, [initialData]);

  /**
   * Refetch function
   */
  const refetch = useCallback(
    async (...args: P): Promise<void> => {
      await execute(...args);
    },
    [execute]
  );

  // Auto fetch on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (immediate) {
      execute(...([] as unknown as P));
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    refetch,
    reset,
    setData,
  };
}

// ==================== MUTATION HOOK ====================

/**
 * Options cho useMutation hook
 */
export interface IUseMutationOptions<T, P extends any[] = any[]> {
  /** Callback khi mutation thành công */
  onSuccess?: (data: T, variables: P) => void;
  /** Callback khi có lỗi */
  onError?: (error: Error, variables: P) => void;
  /** Callback khi mutation hoàn thành (success hoặc error) */
  onSettled?: (data: T | null, error: Error | null, variables: P) => void;
}

/**
 * Return type của useMutation hook
 */
export interface IUseMutationReturn<T, P extends any[] = any[]> {
  /** Dữ liệu từ mutation */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error nếu có */
  error: Error | null;
  /** Function để execute mutation */
  mutate: (...args: P) => Promise<T | null>;
  /** Function để reset state */
  reset: () => void;
}

/**
 * Mutation hook cho POST, PUT, DELETE operations
 * 
 * @example
 * ```typescript
 * const { mutate, loading, error } = useMutation(
 *   examService.registerExam,
 *   {
 *     onSuccess: (data) => console.log('Success:', data),
 *     onError: (error) => console.error('Error:', error),
 *   }
 * );
 * 
 * // Use it
 * await mutate(examId);
 * ```
 */
export function useMutation<T, P extends any[] = any[]>(
  mutationFunction: (...args: P) => Promise<T>,
  options: IUseMutationOptions<T, P> = {}
): IUseMutationReturn<T, P> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);

  /**
   * Execute mutation
   */
  const mutate = useCallback(
    async (...args: P): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFunction(...args);

        if (!isMountedRef.current) return null;

        setData(result);
        setLoading(false);

        // Success callback
        if (onSuccess) {
          onSuccess(result, args);
        }

        // Settled callback
        if (onSettled) {
          onSettled(result, null, args);
        }

        return result;
      } catch (err) {
        if (!isMountedRef.current) return null;

        // Chuẩn hóa thông điệp lỗi (ưu tiên message từ server nếu có)
        let error: Error;
        if (axios.isAxiosError(err)) {
          const axiosErr = err as AxiosError<any>;
          const serverMessage = axiosErr.response?.data?.message;
          const status = axiosErr.response?.status;
          const friendlyMessage =
            serverMessage ||
            (status === 401 ? ERROR_MESSAGES.INVALID_CREDENTIALS : axiosErr.message) ||
            ERROR_MESSAGES.SOMETHING_WENT_WRONG;
          error = new Error(friendlyMessage);
        } else if (err instanceof Error) {
          error = err;
        } else {
          error = new Error(ERROR_MESSAGES.SOMETHING_WENT_WRONG);
        }

        setError(error);
        setLoading(false);

        // Error callback
        if (onError) {
          onError(error, args);
        }

        // Settled callback
        if (onSettled) {
          onSettled(null, error, args);
        }

        return null;
      }
    },
    [mutationFunction, onSuccess, onError, onSettled]
  );

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

// ==================== EXPORT ====================

export default useApi;

