// Exam History Service for Teacher
// Quản lý lịch sử làm bài thi của các bài thi do teacher tạo

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface ExamAttemptDto {
  examAttemptId: number;
  examId: number;
  examTitle?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  startTime?: string;
  submittedAt?: string;
  endTime?: string;
  score?: number;
  maxScore?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  percentage?: number;
  isPassed?: boolean;
  passed?: boolean;
  timeSpentSeconds?: number;
  timeSpentMinutes?: number;
  attemptNumber?: number;
  status?: string; // InProgress, Completed, Abandoned
  variantCode?: string;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

class ExamHistoryService {
  // Lấy danh sách lịch sử làm bài thi (có phân trang & filter)
  async getExamAttempts(params?: {
    pageIndex?: number;
    pageSize?: number;
    examId?: number;
    userId?: number;
    status?: string;
    isPassed?: boolean;
    search?: string;
  }): Promise<PagedResponse<ExamAttemptDto>> {
    try {
      const query = new URLSearchParams();
      if (params?.pageIndex) query.append('pageIndex', String(params.pageIndex));
      if (params?.pageSize) query.append('pageSize', String(params.pageSize));
      if (params?.examId) query.append('examId', String(params.examId));
      if (params?.userId) query.append('userId', String(params.userId));
      if (params?.status) query.append('status', params.status);
      if (params?.isPassed !== undefined) query.append('isPassed', String(params.isPassed));
      if (params?.search) query.append('search', params.search);

      // If examId is provided, try using exam-results endpoint as fallback
      if (params?.examId) {
        try {
          console.log('Trying exam-results endpoint for examId:', params.examId);
          const res = await apiService.get<any>(`/Exams/exam-results/${params.examId}`);
          const data = res.Data || res.data || res;
          
          // exam-results endpoint returns: { StudentScores: [...], Statistics: {...} }
          const studentScores = data.StudentScores || data.studentScores || [];
          
          if (studentScores.length > 0) {
            // Convert StudentScoreDto to ExamAttemptDto
            const items = studentScores.map((score: any) => ({
              examAttemptId: score.ExamAttemptId || score.examAttemptId || 0, // May not have attemptId
              examId: params.examId!,
              examTitle: data.ExamTitle || data.examTitle,
              userId: score.UserId || score.userId,
              userName: score.UserName || score.userName,
              userEmail: score.UserEmail || score.userEmail,
              startTime: score.StartTime || score.startTime,
              submittedAt: score.SubmittedAt || score.submittedAt,
              endTime: score.EndTime || score.endTime,
              score: score.Score || score.score,
              maxScore: score.MaxScore || score.maxScore,
              correctAnswers: score.CorrectAnswers || score.correctAnswers,
              totalQuestions: score.TotalQuestions || score.totalQuestions,
              percentage: score.Percentage || score.percentage,
              isPassed: score.IsPassed !== undefined ? score.IsPassed : (score.isPassed !== undefined ? score.isPassed : false),
              passed: score.IsPassed !== undefined ? score.IsPassed : (score.isPassed !== undefined ? score.isPassed : false),
              timeSpentSeconds: score.TimeSpentSeconds || score.timeSpentSeconds || (score.TimeSpentMinutes || score.timeSpentMinutes || 0) * 60,
              timeSpentMinutes: score.TimeSpentMinutes || score.timeSpentMinutes,
              attemptNumber: score.AttemptNumber || score.attemptNumber || 1,
              status: 'Completed', // exam-results only returns submitted attempts
              variantCode: score.VariantCode || score.variantCode,
            }));

            // Apply filters
            let filteredItems = items;
            if (params?.status && params.status !== 'Completed') {
              filteredItems = []; // exam-results only returns completed attempts
            }
            if (params?.isPassed !== undefined) {
              filteredItems = filteredItems.filter(item => item.isPassed === params.isPassed);
            }
            if (params?.search) {
              const searchLower = params.search.toLowerCase();
              filteredItems = filteredItems.filter(item => 
                (item.examTitle?.toLowerCase().includes(searchLower)) ||
                (item.userName?.toLowerCase().includes(searchLower)) ||
                (item.userEmail?.toLowerCase().includes(searchLower))
              );
            }

            const pageIndex = params?.pageIndex || 1;
            const pageSize = params?.pageSize || 10;
            const total = filteredItems.length;
            const totalPages = Math.ceil(total / pageSize);
            const startIndex = (pageIndex - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedItems = filteredItems.slice(startIndex, endIndex);

            return {
              items: paginatedItems,
              total,
              pageIndex,
              pageSize,
              totalPages,
              hasPreviousPage: pageIndex > 1,
              hasNextPage: pageIndex < totalPages,
            };
          }
        } catch (error: any) {
          console.log('exam-results endpoint failed:', error);
          // Continue to try other endpoints
        }
      }

      // Try admin endpoint (may require admin permission)
      const endpoints = [
        `/Exams/admin/attempts?${query.toString()}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          const res = await apiService.get<any>(endpoint);
          const data = res.Data || res.data || res;
          
          // Handle response format
          let items: any[] = [];
          let total = 0;
          let pageIndex = params?.pageIndex || 1;
          let pageSize = params?.pageSize || 10;
          let totalPages = 1;

          // Response format: { Success: true, Message: "...", Data: { Items: [...], Total: ..., ... } }
          const responseData = data.Data || data.data || data;
          
          if (responseData.Items || responseData.items) {
            items = responseData.Items || responseData.items || [];
            total = responseData.Total || responseData.total || 0;
            pageIndex = responseData.PageIndex || responseData.pageIndex || pageIndex;
            pageSize = responseData.PageSize || responseData.pageSize || pageSize;
            totalPages = responseData.TotalPages || responseData.totalPages || Math.ceil(total / pageSize);
          } else if (Array.isArray(responseData)) {
            items = responseData;
            total = responseData.length;
            totalPages = Math.ceil(total / pageSize);
          }

          return {
            items: items.map((item: any) => ({
              examAttemptId: item.ExamAttemptId || item.examAttemptId || item.id || item.attemptId,
              examId: item.ExamId || item.examId,
              examTitle: item.ExamTitle || item.examTitle || item.exam?.title,
              userId: item.UserId || item.userId,
              userName: item.UserName || item.userName || item.user?.name || item.user?.fullName,
              userEmail: item.UserEmail || item.userEmail || item.user?.email,
              startTime: item.StartTime || item.startTime,
              submittedAt: item.SubmittedAt || item.submittedAt,
              endTime: item.EndTime || item.endTime,
              score: item.Score || item.score,
              maxScore: item.MaxScore || item.maxScore,
              correctAnswers: item.CorrectAnswers || item.correctAnswers,
              totalQuestions: item.TotalQuestions || item.totalQuestions,
              percentage: item.Percentage || item.percentage,
              isPassed: item.IsPassed !== undefined ? item.IsPassed : (item.isPassed !== undefined ? item.isPassed : (item.Passed !== undefined ? item.Passed : item.passed)),
              passed: item.IsPassed !== undefined ? item.IsPassed : (item.isPassed !== undefined ? item.isPassed : (item.Passed !== undefined ? item.Passed : item.passed)),
              timeSpentSeconds: item.TimeSpentSeconds || item.timeSpentSeconds,
              timeSpentMinutes: item.TimeSpentMinutes || item.timeSpentMinutes,
              attemptNumber: item.AttemptNumber || item.attemptNumber,
              status: item.Status || item.status || 'Completed',
              variantCode: item.VariantCode || item.variantCode,
            })),
            total,
            pageIndex,
            pageSize,
            totalPages,
            hasPreviousPage: pageIndex > 1,
            hasNextPage: pageIndex < totalPages,
          };
        } catch (error: any) {
          lastError = error;
          console.log(`Endpoint ${endpoint} failed:`, error);
          // If 403 (Forbidden), teacher doesn't have permission - skip this endpoint
          if (error.status === 403) {
            console.warn(`Teacher doesn't have permission to access ${endpoint}. This is expected for non-admin users.`);
            continue; // Try next endpoint
          }
          if (error.status === 404 || error.status === 400) {
            continue; // Try next endpoint
          }
          throw error;
        }
      }
      
      // If all endpoints failed, return empty result instead of throwing error
      if (lastError) {
        console.warn('All endpoints failed, returning empty result. Last error:', lastError);
        return {
          items: [],
          total: 0,
          pageIndex: params?.pageIndex || 1,
          pageSize: params?.pageSize || 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        };
      }
      
      throw new Error('Không thể tải lịch sử làm bài thi');
    } catch (error) {
      console.error('Error fetching exam attempts:', error);
      throw error;
    }
  }

  // Lấy chi tiết một exam attempt
  async getExamAttemptById(attemptId: number): Promise<ExamAttemptDto> {
    try {
      const endpoints = [
        `/Exams/attempts/${attemptId}`,
        `/Exams/admin/attempts/${attemptId}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          const res = await apiService.get<any>(endpoint);
      const data = res.Data || res.data || res;
      
          return {
            examAttemptId: data.ExamAttemptId || data.examAttemptId || attemptId,
            examId: data.ExamId || data.examId,
            examTitle: data.ExamTitle || data.examTitle,
            userId: data.UserId || data.userId,
            userName: data.UserName || data.userName,
            userEmail: data.UserEmail || data.userEmail,
            startTime: data.StartTime || data.startTime,
            submittedAt: data.SubmittedAt || data.submittedAt,
            endTime: data.EndTime || data.endTime,
            score: data.Score || data.score,
            maxScore: data.MaxScore || data.maxScore,
            correctAnswers: data.CorrectAnswers || data.correctAnswers,
            totalQuestions: data.TotalQuestions || data.totalQuestions,
            percentage: data.Percentage || data.percentage,
            isPassed: data.IsPassed !== undefined ? data.IsPassed : (data.isPassed !== undefined ? data.isPassed : (data.Passed !== undefined ? data.Passed : data.passed)),
            passed: data.IsPassed !== undefined ? data.IsPassed : (data.isPassed !== undefined ? data.isPassed : (data.Passed !== undefined ? data.Passed : data.passed)),
            timeSpentSeconds: data.TimeSpentSeconds || data.timeSpentSeconds,
            timeSpentMinutes: data.TimeSpentMinutes || data.timeSpentMinutes,
            attemptNumber: data.AttemptNumber || data.attemptNumber,
            status: data.Status || data.status,
            variantCode: data.VariantCode || data.variantCode,
          };
        } catch (error: any) {
          lastError = error;
          if (error.status === 404 || error.status === 400) {
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error(`Không thể tải chi tiết exam attempt ${attemptId}`);
    } catch (error) {
      console.error(`Error fetching exam attempt ${attemptId}:`, error);
      throw error;
    }
  }

  // Xóa exam attempt
  async deleteExamAttempt(attemptId: number): Promise<void> {
    try {
      const endpoints = [
        `/Exams/attempts/${attemptId}`,
        `/Exams/admin/attempts/${attemptId}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          await apiService.delete<any>(endpoint);
          return;
        } catch (error: any) {
          lastError = error;
          if (error.status === 404 || error.status === 400) {
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error(`Không thể xóa exam attempt ${attemptId}`);
    } catch (error) {
      console.error(`Error deleting exam attempt ${attemptId}:`, error);
      throw error;
    }
  }
}

export const examHistoryService = new ExamHistoryService();
export default examHistoryService;

