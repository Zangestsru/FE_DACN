/**
 * Exam Hooks
 * Custom hooks cho exam management
 */

import React, { useCallback, useEffect } from 'react';
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
  console.log('🎣 useExams called with params:', params);

  const { data, loading, error, refetch } = useApi<IGetExamsResponse, any[]>(
    () => {
      console.log('🎣 Service function executing...');
      return examService.getAllExams(params);
    },
    {
      immediate,
      cacheKey: params ? `exams-${JSON.stringify(params)}` : 'exams',
      cacheTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching exams:', error);
      },
      onSuccess: (result) => {
        console.log('✅ useExams onSuccess:', result);
      },
      retryCount: 0,
    }
  );

  console.log('🎣 useExams state - data:', data, 'loading:', loading, 'error:', error);

  return { data, loading, error, refetch };
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
  const api = useApi<IExam, [string | number]>(
    (id) => examService.getExamById(id),
    {
      immediate: false,
      cacheKey: examId ? `exam-${examId}` : undefined,
      cacheTime: 10 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching exam detail:', error);
      },
    }
  );

  const { refetch } = api;

  useEffect(() => {
    if (examId && immediate) {
      refetch(examId as string | number);
    }
  }, [examId, immediate, refetch]);

  return api;
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
  return useMutation<{ message: string }, Error, string | number>(
    async (examId) => {
      return await examService.registerExam(examId);
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
 * const { mutate: startExam, loading, data: attempt } = useExamStart({
 *   onSuccess: (attempt) => {
 *     console.log('Attempt ID:', attempt.examAttemptId);
 *   },
 * });
 * 
 * await startExam(examId);
 * ```
 */
export function useExamStart(options?: {
  onSuccess?: (data: { examAttemptId: number;[key: string]: any }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation(
    (examId: string | number) => examService.startExam(examId),
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
 *   attemptId: 123,
 *   answers: [{ questionId: 1, selectedOptionIds: [1] }],
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
      return await examService.submitExam({ examId, attemptId: data.attemptId, answers: data.answers });
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
  const api = useApi<any[], [string | number]>(
    (id) => examService.getExamQuestions(id),
    {
      immediate: false,
      cacheKey: examId ? `exam-questions-${examId}` : undefined,
      onError: (error) => {
        console.error('Error fetching exam questions:', error);
      },
    }
  );

  const { refetch } = api;

  useEffect(() => {
    if (examId && immediate) {
      refetch(examId as string | number);
    }
  }, [examId, immediate, refetch]);

  return api;
}

// ==================== USE EXAM RESULT HOOK (OLD - REMOVED) ====================
// Old version removed - now using attemptId instead of examId

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

// ==================== USE START EXAM HOOK ====================

/**
 * Hook để bắt đầu làm bài thi
 * 
 * @example
 * ```typescript
 * const { execute: startExam, loading, error } = useStartExam();
 * const result = await startExam(examId);
 * ```
 */
export function useStartExam() {
  return useMutation(
    (examId: number) => examService.startExam(examId),
    {
      onError: (error) => {
        console.error('Error starting exam:', error);
      },
    }
  );
}

// ==================== USE EXAM ATTEMPT HOOK ====================

/**
 * Hook để lấy thông tin exam attempt (bao gồm questions)
 * 
 * @example
 * ```typescript
 * const { data, loading, error } = useExamAttempt(attemptId);
 * ```
 */
export function useExamAttempt(attemptId: string | number | null, immediate = true) {
  // Memoize the mock data check to prevent infinite re-renders
  const getMockAttemptData = React.useCallback(() => {
    if (!attemptId) return null;
    try {
      // Check if this is a mock attempt ID (timestamp-based)
      const attemptIdNum = parseInt(String(attemptId), 10);
      if (isNaN(attemptIdNum) || attemptIdNum < 1000000000000) return null; // Not a timestamp

      // Try to get mock data from sessionStorage
      const examId = sessionStorage.getItem('current_exam_id');
      if (examId) {
        const mockData = sessionStorage.getItem(`mock_attempt_${examId}`);
        if (mockData) {
          const parsed = JSON.parse(mockData);
          if (parsed.examAttemptId === attemptIdNum) {
            console.log('🎯 Using mock attempt data for demo');
            return {
              ...parsed,
              questions: parsed.questions || [],
              durationMinutes: 60,
              endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
              instructions: 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.'
            };
          }
        }
      }
    } catch (error) {
      console.error('Error checking mock data:', error);
    }
    return null;
  }, [attemptId]);

  // Memoize the service function to prevent infinite re-renders
  const serviceFunction = React.useCallback(
    () => {
      console.log('🎣 useExamAttempt - attemptId:', attemptId);
      // Check for mock data first
      const mockData = getMockAttemptData();
      console.log('🎣 useExamAttempt - mockData found:', mockData);
      if (mockData) {
        console.log('🎣 useExamAttempt - returning mock data');
        return Promise.resolve(mockData);
      }
      console.log('🎣 useExamAttempt - calling examService.getExamAttempt');
      return examService.getExamAttempt(attemptId!);
    },
    [attemptId, getMockAttemptData]
  );

  return useApi<any, [string | number]>(
    serviceFunction,
    {
      immediate: immediate && !!attemptId,
      cacheKey: attemptId ? `exam-attempt-${attemptId}` : undefined,
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent re-renders
      onSuccess: (data) => {
        console.log('🎣 useExamAttempt - success:', data);
      },
      onError: (error) => {
        console.error('🎣 useExamAttempt - error:', error);
      },
    }
  );
}

// ==================== USE SUBMIT EXAM HOOK ====================

/**
 * Hook để nộp bài thi
 * 
 * @example
 * ```typescript
 * const { execute: submitExam, loading, error } = useSubmitExam();
 * const result = await submitExam({ examId, attemptId, answers });
 * ```
 */
export function useSubmitExam() {
  return useMutation(
    (data: { examId: number; attemptId: number; answers: any[]; timeSpent?: number; isViolationSubmit?: boolean; violationReason?: string }) => examService.submitExam(data),
    {
      onError: (error) => {
        console.error('Error submitting exam:', error);
      },
    }
  );
}

// ==================== USE SAVE ANSWER HOOK ====================

/**
 * Hook để lưu câu trả lời (auto-save)
 * 
 * @example
 * ```typescript
 * const { execute: saveAnswer } = useSaveAnswer();
 * await saveAnswer({ examId, attemptId, questionId, selectedOptionIds });
 * ```
 */
export function useSaveAnswer() {
  return useMutation(
    (data: { examId: number; attemptId: number; questionId: number; selectedOptionIds: number[]; textAnswer?: string }) =>
      examService.saveAnswer(data),
    {
      onError: (error) => {
        console.error('Error saving answer:', error);
      },
    }
  );
}

/**
 * Hook để lưu tiến trình (batch save tất cả câu trả lời)
 * 
 * @example
 * ```typescript
 * const { mutate: saveProgress } = useSaveProgress();
 * saveProgress({ examId, attemptId, answers });
 * ```
 */
export function useSaveProgress() {
  return useMutation(
    (data: { examId: number; attemptId: number; answers: Array<{ questionId: number; selectedOptionIds: number[]; textAnswer?: string | null }> }) =>
      examService.saveProgress(data),
    {
      onError: (error) => {
        console.error('Error saving progress:', error);
      },
    }
  );
}

/**
 * Hook để khôi phục tiến trình đã lưu từ Redis
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useRestoreProgress(examId, attemptId);
 * ```
 */
export function useRestoreProgress(examId: number | null, attemptId: number | string | null, immediate = false) {
  return useApi(
    () => {
      if (!examId || !attemptId) {
        throw new Error('Exam ID and Attempt ID are required');
      }
      return examService.restoreProgress(examId, typeof attemptId === 'string' ? parseInt(attemptId) : attemptId);
    },
    {
      immediate,
      cacheKey: examId && attemptId ? `restoreProgress-${examId}-${attemptId}` : undefined,
      cacheTime: 30 * 1000, // 30 seconds
      retryCount: 0,
      onError: (error) => {
        console.error('Error restoring progress:', error);
      },
    }
  );
}

// ==================== USE EXAM RESULT HOOK ====================

/**
 * Hook để lấy kết quả bài thi
 * 
 * @example
 * ```typescript
 * const { data, loading, error } = useExamResult(attemptId);
 * ```
 */
export function useExamResult(attemptId: string | number | null, immediate = true) {
  const serviceFunction = React.useCallback(
    async () => {
      if (!attemptId) {
        throw new Error('Attempt ID is required');
      }

      const result = await examService.getExamResult(attemptId);

      // Map backend result to frontend format
      // ✅ Try both camelCase and PascalCase for all fields
      // Backend returns: Score (absolute score = correct answers), Percentage, CorrectAnswers, TotalQuestions, MaxScore
      const score = Number(result.score || result.Score || 0); // Absolute score (number of correct answers)
      const maxScore = Number(result.maxScore || result.MaxScore || 0); // Total questions
      const percentage = Number(result.percentage || result.Percentage || 0); // Percentage score
      const correctAnswers = Number(result.correctAnswers || result.CorrectAnswers || score || 0); // Number of correct answers
      const totalQuestions = Number(result.totalQuestions || result.TotalQuestions || maxScore || 0); // Total questions
      
      const mappedResult = {
        examAttemptId: result.examAttemptId || result.ExamAttemptId || attemptId,
        examId: result.examId || result.ExamId,
        examTitle: result.examTitle || result.ExamTitle || 'Bài thi',
        examImage: result.examImage || result.ExamImage || '/images/background.png',
        examCategory: result.examCategory || result.ExamCategory || result.subjectName || result.SubjectName || 'General',
        examDifficulty: result.examDifficulty || result.ExamDifficulty || 'Beginner',
        examDuration: result.examDuration || result.ExamDuration || '60 phút',
        examPassingScore: result.examPassingScore || result.ExamPassingScore || 70,
        percentage: percentage, // ✅ Use percentage directly from backend
        score: score, // ✅ Absolute score (correct answers)
        maxScore: maxScore, // ✅ Total questions
        isPassed: result.isPassed || result.IsPassed || result.passed || result.Passed || false,
        timeSpentMinutes: result.timeSpentMinutes || result.TimeSpentMinutes || Math.floor((result.timeSpent || result.TimeSpent || 3600) / 60),
        timeSpentSeconds: result.timeSpentSeconds || result.TimeSpentSeconds, // ✅ Include TimeSpentSeconds for accurate display
        correctAnswers: correctAnswers, // ✅ Number of correct answers
        totalQuestions: totalQuestions, // ✅ Total questions
        answers: result.answers || result.Answers || [],
        // ✅ Include QuestionResults for detailed analysis
        questionResults: result.questionResults || result.QuestionResults || result.answers || result.Answers || [],
        // ✅ Include StartTime and SubmittedAt for accurate time calculation (try both cases)
        startTime: result.startTime || result.StartTime,
        submittedAt: result.submittedAt || result.SubmittedAt,
      };

      console.log('🔄 Mapped result with time fields:', {
        startTime: mappedResult.startTime,
        submittedAt: mappedResult.submittedAt,
        timeSpentMinutes: mappedResult.timeSpentMinutes,
        timeSpentSeconds: mappedResult.timeSpentSeconds,
        originalResult: result
      });

      return mappedResult;
    },
    [attemptId]
  );

  return useApi<any, [string | number]>(
    serviceFunction,
    {
      immediate: immediate && !!attemptId,
      cacheKey: attemptId ? `exam-result-${attemptId}` : undefined,
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      retryCount: 1, // Only retry once to prevent infinite loops
      onError: (error) => {
        console.error('Error fetching exam result:', error);
      },
    }
  );
}

// ==================== USE PURCHASE EXAM HOOK ====================

/**
 * Hook để mua bài thi (purchase exam)
 * 
 * @example
 * ```typescript
 * const { mutate: purchaseExam, loading, error } = usePurchaseExam();
 * const result = await purchaseExam(examId, { autoConfirm: true });
 * ```
 */
export function usePurchaseExam() {
  return useMutation(
    (examId: number, data?: { autoConfirm?: boolean }) => examService.purchaseExam(examId, data),
    {
      onError: (error) => {
        console.error('Error purchasing exam:', error);
      },
    }
  );
}

// ==================== EXPORT ====================

export default useExams;
