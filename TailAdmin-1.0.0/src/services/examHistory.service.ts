// Exam History Service for TailAdmin
// Quản lý lịch sử làm bài thi của tất cả users

import { ApiService } from './api.service';

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

class ExamHistoryService extends ApiService {
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

      // Use Admin endpoint (port 5001) - this will proxy to ExamsService
      const endpoint = `/Admin/exam-attempts?${query.toString()}`;

      try {
        const res = await this.get<any>(endpoint);
        // AdminController returns ContentResult, so response might be direct JSON or wrapped
        const data = res.data ?? res.Data ?? res;
        
        // Handle response format from AdminController -> ExamsService
        let items: any[] = [];
        let total = 0;
        let pageIndex = params?.pageIndex || 1;
        let pageSize = params?.pageSize || 10;
        let totalPages = 1;

        // Response format: { Success: true, Message: "...", Data: { Items: [...], Total: ..., ... } }
        const responseData = data.Data || data.data || data;
        
        console.log('🔍 API Response Data:', responseData);
        console.log('🔍 First item raw data:', responseData.Items?.[0] || responseData.items?.[0]);

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

        console.log(`📊 Found ${items.length} exam attempts`);

        return {
          items: items.map((item: any, index: number) => {
            // Log first item for debugging
            if (index === 0) {
              console.log('🔍 Mapping first item:', {
                raw: item,
                userId: item.UserId || item.userId,
                userName: item.UserName || item.userName || item.User?.FullName || item.user?.fullName,
                userEmail: item.UserEmail || item.userEmail || item.User?.Email || item.user?.email,
                submittedAt: item.SubmittedAt || item.submittedAt,
              });
            }

            const mapped = {
              examAttemptId: item.ExamAttemptId || item.examAttemptId || item.id || item.attemptId,
              examId: item.ExamId || item.examId,
              examTitle: item.ExamTitle || item.examTitle || item.exam?.title,
              userId: item.UserId || item.userId,
              // Try multiple possible field names for user data
              userName: item.UserName || item.userName || item.User?.FullName || item.User?.Name || item.user?.fullName || item.user?.name || item.user?.FullName || item.user?.Name || 'Unknown User',
              userEmail: item.UserEmail || item.userEmail || item.User?.Email || item.user?.email || item.user?.Email || '',
              startTime: item.StartTime || item.startTime,
              submittedAt: item.SubmittedAt || item.submittedAt || item.EndTime || item.endTime,
            endTime: item.EndTime || item.endTime,
            score: item.Score || item.score,
            maxScore: item.MaxScore || item.maxScore,
            correctAnswers: item.CorrectAnswers || item.correctAnswers,
            totalQuestions: item.TotalQuestions || item.totalQuestions,
            percentage: item.Percentage || item.percentage,
            isPassed: item.IsPassed !== undefined ? item.IsPassed : (item.isPassed !== undefined ? item.isPassed : (item.Passed !== undefined ? item.Passed : item.passed)),
            passed: item.IsPassed !== undefined ? item.IsPassed : (item.isPassed !== undefined ? item.isPassed : (item.Passed !== undefined ? item.Passed : item.passed)),
            timeSpentSeconds: item.TimeSpentSeconds !== undefined ? item.TimeSpentSeconds : (item.timeSpentSeconds !== undefined ? item.timeSpentSeconds : 0),
            timeSpentMinutes: item.TimeSpentMinutes !== undefined ? item.TimeSpentMinutes : (item.timeSpentMinutes !== undefined ? item.timeSpentMinutes : 0),
            attemptNumber: item.AttemptNumber || item.attemptNumber,
              status: item.Status || item.status || 'Completed',
              variantCode: item.VariantCode || item.variantCode,
            };

            // Log first mapped item
            if (index === 0) {
              console.log('✅ Mapped first item:', mapped);
            }

            return mapped;
          }),
          total,
          pageIndex,
          pageSize,
          totalPages,
          hasPreviousPage: pageIndex > 1,
          hasNextPage: pageIndex < totalPages,
        };
      } catch (error: any) {
        console.error('❌ Error in getExamAttempts:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching exam attempts:', error);
      throw error;
    }
  }

  // Lấy chi tiết một exam attempt
  async getExamAttemptById(attemptId: number): Promise<ExamAttemptDto> {
    try {
      const endpoints = [
        `/Admin/exam-attempts/${attemptId}`,
        `/Admin/Exams/attempts/${attemptId}`,
        `/Exams/attempts/${attemptId}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          const res = await this.get<any>(endpoint);
          const data = res.data ?? res.Data ?? res;
          
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
      throw lastError || new Error('Không thể tải chi tiết lịch sử làm bài thi');
    } catch (error) {
      console.error(`Error fetching exam attempt ${attemptId}:`, error);
      throw error;
    }
  }

  // Xóa exam attempt (admin only)
  async deleteExamAttempt(attemptId: number): Promise<void> {
    try {
      const endpoints = [
        `/Admin/exam-attempts/${attemptId}`,
        `/Admin/Exams/attempts/${attemptId}`,
        `/Exams/attempts/${attemptId}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          await this.delete<any>(endpoint);
          return;
        } catch (error: any) {
          lastError = error;
          if (error.status === 404 || error.status === 400) {
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error('Không thể xóa lịch sử làm bài thi');
    } catch (error) {
      console.error(`Error deleting exam attempt ${attemptId}:`, error);
      throw error;
    }
  }
}

export const examHistoryService = new ExamHistoryService();
export default examHistoryService;

