/**
 * Exam Hooks
 * Custom hooks cho exam management
 */

import { useCallback } from 'react';
import { examService } from '@/services/exam.service';
import { useApi, useMutation } from './useApi';
import type {
  IExam,
  IGetExamsRequest,
  IGetExamsResponse,
  ISubmitExamRequest,
  ISubmitExamResponse,
  IExamResult,
} from '@/types';

// ==================== USE EXAMS HOOK ====================

/**
 * Hook để fetch danh sách exams với pagination và filter
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useExams({
 *   page: 1,
 *   limit: 12,
 *   category: 'Cloud Computing',
 * });
 * ```
 */
export function useExams(params?: IGetExamsRequest, immediate = true) {
  return useApi<IGetExamsResponse, [IGetExamsRequest?]>(
    (params) => examService.getAllExams(params),
    {
      immediate,
      cacheKey: params ? `exams-${JSON.stringify(params)}` : 'exams',
      cacheTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Error fetching exams:', error);
      },
    }
  );
}

// ==================== USE EXAM DETAIL HOOK ====================

/**
 * Hook để fetch chi tiết một exam
 * 
 * @param examId - ID của exam
 * @param immediate - Tự động fetch khi mount (default: true)
 * 
 * @example
 * ```typescript
 * const { data: exam, loading, error } = useExamDetail(examId);
 * ```
 */
export function useExamDetail(examId: string | number | null, immediate = true) {
  return useApi<IExam, [string | number]>(
    (id) => examService.getExamById(id),
    {
      immediate: immediate && !!examId,
      cacheKey: examId ? `exam-${examId}` : undefined,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Error fetching exam detail:', error);
      },
    }
  );
}

// ==================== USE EXAM REGISTER HOOK ====================

/**
 * Hook để đăng ký thi
 * 
 * @example
 * ```typescript
 * const { mutate: registerExam, loading, error } = useExamRegister({
 *   onSuccess: () => {
 *     showToast('Đăng ký thành công!');
 *     navigate('/exam-taking');
 *   },
 * });
 * 
 * // Use it
 * await registerExam(examId);
 * ```
 */
export function useExamRegister(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<{ message: string }, [string | number, string | number?]>(
    async (examId, userId?) => {
      return await examService.registerExam(examId, userId);
    },
    {
      onSuccess: (data) => {
        console.log('Exam registered successfully:', data);
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
      },
      onError: (error) => {
        console.error('Error registering exam:', error);
        if (options?.onError) {
          options.onError(error);
        }
      },
    }
  );
}

// ==================== USE EXAM START HOOK ====================

/**
 * Hook để bắt đầu làm bài thi
 * 
 * @example
 * ```typescript
 * const { mutate: startExam, loading, data: session } = useExamStart({
 *   onSuccess: (session) => {
 *     console.log('Session ID:', session.sessionId);
 *   },
 * });
 * 
 * await startExam(examId);
 * ```
 */
export function useExamStart(options?: {
  onSuccess?: (data: { sessionId: string; startTime: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<{ sessionId: string; startTime: string }, [string | number]>(
    async (examId) => {
      return await examService.startExam(examId);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE EXAM SUBMIT HOOK ====================

/**
 * Hook để nộp bài thi
 * 
 * @example
 * ```typescript
 * const { mutate: submitExam, loading, error, data: result } = useExamSubmit({
 *   onSuccess: (result) => {
 *     if (result.result.passed) {
 *       showToast('Chúc mừng! Bạn đã đạt!');
 *     }
 *     navigate('/exam-result');
 *   },
 * });
 * 
 * await submitExam(examId, {
 *   answers: { 1: 0, 2: 2, 3: 1 },
 *   timeSpent: 3600,
 * });
 * ```
 */
export function useExamSubmit(options?: {
  onSuccess?: (data: ISubmitExamResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<ISubmitExamResponse, [string | number, ISubmitExamRequest]>(
    async (examId, data) => {
      return await examService.submitExam(examId, data);
    },
    {
      onSuccess: (data) => {
        console.log('Exam submitted successfully:', data);
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
      },
      onError: (error) => {
        console.error('Error submitting exam:', error);
        if (options?.onError) {
          options.onError(error);
        }
      },
    }
  );
}

// ==================== USE EXAM QUESTIONS HOOK ====================

/**
 * Hook để lấy câu hỏi của exam
 * 
 * @example
 * ```typescript
 * const { data: questions, loading } = useExamQuestions(examId);
 * ```
 */
export function useExamQuestions(examId: string | number | null, immediate = true) {
  return useApi<any[], [string | number]>(
    (id) => examService.getExamQuestions(id),
    {
      immediate: immediate && !!examId,
      cacheKey: examId ? `exam-questions-${examId}` : undefined,
      onError: (error) => {
        console.error('Error fetching exam questions:', error);
      },
    }
  );
}

// ==================== USE EXAM RESULT HOOK ====================

/**
 * Hook để lấy kết quả exam
 * 
 * @example
 * ```typescript
 * const { data: result, loading } = useExamResult(examId);
 * ```
 */
export function useExamResult(
  examId: string | number | null,
  userId?: string | number,
  immediate = true
) {
  return useApi<IExamResult, [string | number, string | number?]>(
    (id, uid?) => examService.getExamResult(id, uid),
    {
      immediate: immediate && !!examId,
      cacheKey: examId ? `exam-result-${examId}-${userId || 'me'}` : undefined,
      onError: (error) => {
        console.error('Error fetching exam result:', error);
      },
    }
  );
}

// ==================== USE MY EXAM RESULTS HOOK ====================

/**
 * Hook để lấy danh sách kết quả exams của user
 * 
 * @example
 * ```typescript
 * const { data: results, loading, refetch } = useMyExamResults();
 * ```
 */
export function useMyExamResults(immediate = true) {
  return useApi<Array<IExamResult & { exam: IExam }>>(
    () => examService.getMyResults(),
    {
      immediate,
      cacheKey: 'my-exam-results',
      onError: (error) => {
        console.error('Error fetching my exam results:', error);
      },
    }
  );
}

// ==================== USE EXAM SEARCH HOOK ====================

/**
 * Hook để tìm kiếm exams
 * 
 * @example
 * ```typescript
 * const { data: exams, loading, refetch } = useExamSearch(searchQuery);
 * 
 * // Search
 * refetch('AWS Cloud');
 * ```
 */
export function useExamSearch(query?: string, immediate = false) {
  return useApi<IExam[], [string]>(
    (q) => examService.searchExams(q),
    {
      immediate: immediate && !!query,
      onError: (error) => {
        console.error('Error searching exams:', error);
      },
    }
  );
}

// ==================== USE EXAMS BY CATEGORY HOOK ====================

/**
 * Hook để lấy exams theo category
 * 
 * @example
 * ```typescript
 * const { data: exams, loading } = useExamsByCategory('Cloud Computing');
 * ```
 */
export function useExamsByCategory(category: string | null, immediate = true) {
  return useApi<IExam[], [string]>(
    (cat) => examService.getExamsByCategory(cat),
    {
      immediate: immediate && !!category,
      cacheKey: category ? `exams-category-${category}` : undefined,
      cacheTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching exams by category:', error);
      },
    }
  );
}

// ==================== USE RELATED EXAMS HOOK ====================

/**
 * Hook để lấy exams liên quan
 * 
 * @example
 * ```typescript
 * const { data: relatedExams, loading } = useRelatedExams(examId);
 * ```
 */
export function useRelatedExams(examId: string | number | null, immediate = true) {
  return useApi<IExam[], [string | number]>(
    (id) => examService.getRelatedExams(id),
    {
      immediate: immediate && !!examId,
      cacheKey: examId ? `related-exams-${examId}` : undefined,
      onError: (error) => {
        console.error('Error fetching related exams:', error);
      },
    }
  );
}

// ==================== EXPORT ====================

export default useExams;

