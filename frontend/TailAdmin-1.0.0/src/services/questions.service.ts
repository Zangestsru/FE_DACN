// Questions Service cho Ngân hàng câu hỏi
// Khớp đúng endpoints /api/question-bank

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface AnswerOptionResponse {
  optionId: number;
  content: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface QuestionBankResponse {
  questionId: number;
  content: string;
  questionType?: string;
  difficulty?: string;
  marks?: number;
  tags?: string;
  createdAt: string;
  answerOptions: AnswerOptionResponse[];
}

export interface CreateAnswerOptionRequest {
  content: string;
  isCorrect: boolean;
  orderIndex?: number;
}

export interface CreateQuestionBankRequest {
  content: string;
  questionType: string; // ví dụ: MultipleChoice
  difficulty: string; // ví dụ: Easy/Medium/Hard
  marks: number;
  tags?: string; // chuỗi, ngăn cách dấu phẩy
  answerOptions: CreateAnswerOptionRequest[];
}

export interface UpdateQuestionBankRequest extends CreateQuestionBankRequest {}

class QuestionsService {
  // Lấy danh sách câu hỏi từ ngân hàng
  async getQuestions(): Promise<QuestionBankResponse[]> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.questions.getAll);
      // Controller trả về { message, data: QuestionBankResponse[] }
      return (res.data ?? res.Data ?? res)?.data ?? res.Data ?? [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  // Lấy câu hỏi theo ID (nếu BE có)
  async getQuestionById(id: number): Promise<QuestionBankResponse> {
      const res = await apiService.get<any>(API_ENDPOINTS.questions.getById(String(id)));
      return (res.data ?? res.Data ?? res)?.data ?? res.Data;
  }

  // Tạo câu hỏi mới vào ngân hàng
  async createQuestion(questionData: CreateQuestionBankRequest): Promise<QuestionBankResponse> {
    try {
      const res = await apiService.post<any>(API_ENDPOINTS.questions.create, questionData);
      return (res.data ?? res.Data ?? res)?.data ?? res.Data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  // Cập nhật câu hỏi
  async updateQuestion(id: number, questionData: UpdateQuestionBankRequest): Promise<QuestionBankResponse> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.questions.update(String(id)), questionData);
      return (res.data ?? res.Data ?? res)?.data ?? res.Data;
    } catch (error) {
      console.error(`Error updating question ${id}:`, error);
      throw error;
    }
  }

  // Xóa câu hỏi
  async deleteQuestion(id: number): Promise<void> {
    try {
      await apiService.delete<any>(API_ENDPOINTS.questions.delete(String(id)));
    } catch (error) {
      console.error(`Error deleting question ${id}:`, error);
      throw error;
    }
  }
}

export const questionsService = new QuestionsService();
export default questionsService;