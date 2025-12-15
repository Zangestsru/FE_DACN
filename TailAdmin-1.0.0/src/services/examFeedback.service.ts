import { ApiService } from './api.service';

export interface ExamFeedback {
  feedbackId: number;
  userId: number;
  examId: number;
  stars: number;
  comment?: string;
  createdAt: string;
  userName?: string;
  examTitle?: string;
}

export interface ExamFeedbackResponse {
  success: boolean;
  data: ExamFeedback[];
}

class ExamFeedbackService extends ApiService {

  // Get all exam feedbacks (from all exams)
  async getAllExamFeedbacks(): Promise<ExamFeedback[]> {
    try {
      // First, get all exams
      const examsResponse = await fetch(`${this.baseUrl}/Exams`, {
        method: 'GET',
        headers: await this.getHeaders() as HeadersInit,
      });
      
      if (!examsResponse.ok) {
        throw new Error('Failed to fetch exams');
      }
      
      const examsData = await examsResponse.json();
      const exams = examsData?.data?.items || examsData?.items || examsData || [];
      
      // Get feedbacks for all exams
      const allFeedbacks: ExamFeedback[] = [];
      
      for (const exam of exams) {
        try {
          const examId = exam.id || exam.examId;
          if (!examId) continue;
          
          const headers = await this.getHeaders() as HeadersInit;
          const feedbackResponse = await fetch(`${this.baseUrl}/feedback/exam/${examId}`, {
            method: 'GET',
            headers: headers,
          });
          
          if (feedbackResponse.ok) {
            const feedbackData: ExamFeedbackResponse = await feedbackResponse.json();
            if (feedbackData.success && feedbackData.data) {
              // Add exam title to each feedback
              const feedbacksWithExam = feedbackData.data.map(fb => ({
                ...fb,
                examTitle: exam.title || exam.name || `Exam ${examId}`,
              }));
              allFeedbacks.push(...feedbacksWithExam);
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch feedback for exam ${exam.id}:`, err);
        }
      }
      
      // Sort by created date (newest first)
      return allFeedbacks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching exam feedbacks:', error);
      throw new Error('Không thể tải danh sách đánh giá bài thi');
    }
  }

  // Get feedbacks for a specific exam
  async getExamFeedbacks(examId: number): Promise<ExamFeedback[]> {
    try {
      const headers = await this.getHeaders() as HeadersInit;
      const response = await fetch(`${this.baseUrl}/feedback/exam/${examId}`, {
        method: 'GET',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch exam feedbacks');
      }
      
      const data: ExamFeedbackResponse = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.error('Error fetching exam feedbacks:', error);
      throw new Error('Không thể tải đánh giá bài thi');
    }
  }

  // Delete exam feedback
  async deleteExamFeedback(feedbackId: number): Promise<void> {
    try {
      // Note: This endpoint might need to be implemented in the backend
      const headers = await this.getHeaders() as HeadersInit;
      const response = await fetch(`${this.baseUrl}/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting exam feedback:', error);
      throw new Error('Không thể xóa đánh giá');
    }
  }
}

export const examFeedbackService = new ExamFeedbackService();

