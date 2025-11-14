import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export type FeedbackStatus = "pending" | "responded" | "resolved" | "dismissed";
export type FeedbackType = "bug" | "feature" | "complaint" | "suggestion" | "other";
export type FeedbackPriority = "low" | "medium" | "high";

export interface Feedback {
  id: string;
  userName: string;
  userEmail: string;
  userId?: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  createdAt: string;
  updatedAt?: string;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  attachments?: string[];
  tags?: string[];
}

export interface CreateFeedbackRequest {
  userName: string;
  userEmail: string;
  userId?: string;
  type: FeedbackType;
  subject: string;
  message: string;
  priority?: FeedbackPriority;
  attachments?: string[];
  tags?: string[];
}

export interface RespondToFeedbackRequest {
  response: string;
  respondedBy: string;
  status?: FeedbackStatus;
}

export interface UpdateFeedbackStatusRequest {
  status: FeedbackStatus;
  updatedBy: string;
  reason?: string;
}

class FeedbackService extends ApiService {
  // Get all feedback entries
  async getFeedbacks(filters?: {
    status?: FeedbackStatus;
    type?: FeedbackType;
    priority?: FeedbackPriority;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Feedback[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.priority) queryParams.append('priority', filters.priority);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters?.search) queryParams.append('search', filters.search);

      const url = queryParams.toString() 
        ? `${API_ENDPOINTS.feedback.getAll}?${queryParams.toString()}`
        : API_ENDPOINTS.feedback.getAll;

      const response = await this.get<Feedback[]>(url);
      return response;
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw new Error('Không thể tải danh sách phản hồi');
    }
  }

  // Get feedback by ID
  async getFeedback(id: string): Promise<Feedback> {
    try {
      const response = await this.get<Feedback>(API_ENDPOINTS.feedback.getById(id));
      return response;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw new Error('Không thể tải phản hồi');
    }
  }

  // Create new feedback
  async createFeedback(feedbackData: CreateFeedbackRequest): Promise<Feedback> {
    try {
      const response = await this.post<Feedback>(API_ENDPOINTS.feedback.create, feedbackData);
      return response;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw new Error('Không thể tạo phản hồi');
    }
  }

  // Update feedback
  async updateFeedback(id: string, feedbackData: Partial<Feedback>): Promise<Feedback> {
    try {
      const response = await this.put<Feedback>(API_ENDPOINTS.feedback.update(id), feedbackData);
      return response;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw new Error('Không thể cập nhật phản hồi');
    }
  }

  // Delete feedback
  async deleteFeedback(id: string): Promise<void> {
    try {
      await this.delete(API_ENDPOINTS.feedback.delete(id));
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw new Error('Không thể xóa phản hồi');
    }
  }

  // Respond to feedback
  async respondToFeedback(id: string, responseData: RespondToFeedbackRequest): Promise<Feedback> {
    try {
      const response = await this.post<Feedback>(API_ENDPOINTS.feedback.respond(id), responseData);
      return response;
    } catch (error) {
      console.error('Error responding to feedback:', error);
      throw new Error('Không thể trả lời phản hồi');
    }
  }

  // Update feedback status
  async updateFeedbackStatus(id: string, statusData: UpdateFeedbackStatusRequest): Promise<Feedback> {
    try {
      const response = await this.put<Feedback>(API_ENDPOINTS.feedback.updateStatus(id), statusData);
      return response;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw new Error('Không thể cập nhật trạng thái phản hồi');
    }
  }

  // Get feedback statistics
  async getFeedbackStatistics(): Promise<{
    total: number;
    pending: number;
    responded: number;
    resolved: number;
    dismissed: number;
    byType: Record<FeedbackType, number>;
    byPriority: Record<FeedbackPriority, number>;
    avgResponseTime: number; // in hours
    monthlyTrend: Array<{ month: string; count: number }>;
  }> {
    try {
      const response = await this.get(`${API_ENDPOINTS.feedback.getAll}/statistics`);
      return response;
    } catch (error) {
      console.error('Error fetching feedback statistics:', error);
      throw new Error('Không thể tải thống kê phản hồi');
    }
  }

  // Bulk update feedback status
  async bulkUpdateFeedbackStatus(feedbackIds: string[], status: FeedbackStatus, updatedBy: string): Promise<void> {
    try {
      const response = await this.post(`${API_ENDPOINTS.feedback.getAll}/bulk-status`, {
        feedbackIds,
        status,
        updatedBy
      });
      return response;
    } catch (error) {
      console.error('Error bulk updating feedback status:', error);
      throw new Error('Không thể cập nhật hàng loạt trạng thái phản hồi');
    }
  }

  // Export feedback data
  async exportFeedbacks(filters?: {
    status?: FeedbackStatus;
    type?: FeedbackType;
    dateFrom?: string;
    dateTo?: string;
  }, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
      queryParams.append('format', format);

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.feedback.getAll}/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting feedbacks:', error);
      throw new Error('Không thể xuất dữ liệu phản hồi');
    }
  }

  // Download exported feedback
  async downloadFeedbackExport(
    filters?: Parameters<typeof this.exportFeedbacks>[0],
    format: 'csv' | 'excel' = 'csv',
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.exportFeedbacks(filters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || `feedbacks-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading feedback export:', error);
      throw new Error('Không thể tải xuống dữ liệu phản hồi');
    }
  }

  // Helper methods for UI
  getStatusText(status: FeedbackStatus): string {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'responded': return 'Đã trả lời';
      case 'resolved': return 'Đã giải quyết';
      case 'dismissed': return 'Đã bỏ qua';
      default: return status;
    }
  }

  getTypeText(type: FeedbackType): string {
    switch (type) {
      case 'bug': return 'Lỗi hệ thống';
      case 'feature': return 'Đề xuất tính năng';
      case 'complaint': return 'Khiếu nại';
      case 'suggestion': return 'Góp ý';
      case 'other': return 'Khác';
      default: return type;
    }
  }

  getPriorityText(priority: FeedbackPriority): string {
    switch (priority) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      default: return priority;
    }
  }

  getStatusColor(status: FeedbackStatus): string {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'responded': return 'text-blue-600';
      case 'resolved': return 'text-green-600';
      case 'dismissed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  getPriorityColor(priority: FeedbackPriority): string {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
}

export const feedbackService = new FeedbackService();