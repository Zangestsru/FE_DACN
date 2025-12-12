import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  score: number;
  startTime: string;
  endTime: string;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
  status: 'completed' | 'in_progress' | 'abandoned';
  submittedAt: string;
}

export interface ExamStatistic {
  id: string;
  examName: string;
  subject: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  duration: number;
  date: string;
  scoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export interface OverallStatistics {
  totalExams: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalQuestions: number;
  averageScore: number;
  passRate: number;
  activeExams: number;
  completedExams: number;
}

class StatisticsService extends ApiService {
  // Get overall statistics
  async getOverallStatistics(): Promise<OverallStatistics> {
    try {
      const response = await this.get<OverallStatistics>(API_ENDPOINTS.statistics.overall);
      const anyResp: any = response as any;
      const data = anyResp?.data ?? anyResp?.Data ?? anyResp;
      return data as OverallStatistics;
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      throw new Error('Không thể tải thống kê tổng quan');
    }
  }

  // Get exam results by exam ID
  async getExamResults(examId: string): Promise<ExamResult[]> {
    try {
      const response = await this.get<ExamResult[]>(API_ENDPOINTS.statistics.examResults(examId));
      return response;
    } catch (error) {
      console.error('Error fetching exam results:', error);
      throw new Error('Không thể tải kết quả thi');
    }
  }

  // Get exam statistics by exam ID
  async getExamStatistics(examId: string): Promise<ExamStatistic> {
    try {
      const response = await this.get<ExamStatistic>(API_ENDPOINTS.statistics.examStats(examId));
      return response;
    } catch (error) {
      console.error('Error fetching exam statistics:', error);
      throw new Error('Không thể tải thống kê bài thi');
    }
  }

  // Get all exam statistics with filtering
  async getExamStatisticsList(filters?: {
    subject?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Promise<ExamStatistic[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.subject) queryParams.append('subject', filters.subject);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters?.status) queryParams.append('status', filters.status);

      const url = queryParams.toString() 
        ? `${API_ENDPOINTS.statistics.examsList}?${queryParams.toString()}`
        : API_ENDPOINTS.statistics.examsList;

      const response = await this.get<ExamStatistic[]>(url);
      const anyResp: any = response as any;
      const data = anyResp?.data ?? anyResp?.Data ?? anyResp;
      
      // Normalize the data to ensure consistent property names (handle both camelCase and PascalCase)
      const normalized = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id || item.Id || '',
        examName: item.examName || item.ExamName || '',
        subject: item.subject || item.Subject || '',
        totalParticipants: item.totalParticipants ?? item.TotalParticipants ?? 0,
        averageScore: item.averageScore ?? item.AverageScore ?? 0,
        highestScore: item.highestScore ?? item.HighestScore ?? 0,
        lowestScore: item.lowestScore ?? item.LowestScore ?? 0,
        passRate: item.passRate ?? item.PassRate ?? 0,
        duration: item.duration ?? item.Duration ?? 0,
        date: item.date || item.Date || '',
        scoreDistribution: Array.isArray(item.scoreDistribution || item.ScoreDistribution) 
          ? (item.scoreDistribution || item.ScoreDistribution).map((dist: any) => ({
              range: dist.range || dist.Range || '',
              count: dist.count ?? dist.Count ?? 0,
              percentage: dist.percentage ?? dist.Percentage ?? 0
            }))
          : []
      })) : [];
      
      console.log('Normalized exam statistics:', normalized);
      return normalized;
    } catch (error) {
      console.error('Error fetching exam statistics list:', error);
      return [];
    }
  }

  // Get user statistics
  async getUserStatistics(userId: string): Promise<{
    totalExamsTaken: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
    recentExams: ExamResult[];
  }> {
    try {
      const response = await this.get(API_ENDPOINTS.statistics.userStats(userId));
      return response;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw new Error('Không thể tải thống kê người dùng');
    }
  }

  // Get subject statistics
  async getSubjectStatistics(): Promise<Array<{
    subject: string;
    totalExams: number;
    totalParticipants: number;
    averageScore: number;
    passRate: number;
  }>> {
    try {
      const response = await this.get(API_ENDPOINTS.statistics.subjects);
      return response;
    } catch (error) {
      console.error('Error fetching subject statistics:', error);
      throw new Error('Không thể tải thống kê môn học');
    }
  }

  // Calculate score distribution for an exam
  calculateScoreDistribution(results: ExamResult[]): Array<{
    range: string;
    count: number;
    percentage: number;
  }> {
    const ranges = [
      { name: '9-10', min: 9, max: 10 },
      { name: '8-8.9', min: 8, max: 8.9 },
      { name: '7-7.9', min: 7, max: 7.9 },
      { name: '6-6.9', min: 6, max: 6.9 },
      { name: '5-5.9', min: 5, max: 5.9 },
      { name: '0-4.9', min: 0, max: 4.9 }
    ];

    const total = results.length;
    
    return ranges.map(range => {
      const count = results.filter(result => 
        result.score >= range.min && result.score <= range.max
      ).length;
      
      return {
        range: range.name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    });
  }

  // Export statistics to PDF
  async exportStatisticsToPDF(examId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.statistics.export(examId)}`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting statistics:', error);
      throw new Error('Không thể xuất báo cáo PDF');
    }
  }
}

export const statisticsService = new StatisticsService();
