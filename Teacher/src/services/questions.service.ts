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
  subjectId?: number;
  subjectName?: string;
}

export interface QuestionBankFilterRequest {
  page?: number;
  pageSize?: number;
  subjectId?: number;
  questionType?: string;
  difficulty?: string;
  tags?: string;
  searchContent?: string;
}

export interface QuestionBankListResponse {
  questions: QuestionBankResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  subjectId: number; // Môn học (bắt buộc)
  answerOptions: CreateAnswerOptionRequest[];
}

export interface UpdateQuestionBankRequest {
  content: string;
  questionType: string;
  difficulty: string;
  marks: number;
  tags?: string;
  subjectId: number; // Môn học (bắt buộc)
  answerOptions: CreateAnswerOptionRequest[];
}

// Helper function to map backend response (PascalCase) to frontend format (camelCase)
function mapBackendQuestionToFrontend(backend: any): QuestionBankResponse {
  return {
    questionId: backend.QuestionId ?? backend.questionId ?? 0,
    content: backend.Content ?? backend.content ?? '',
    questionType: backend.QuestionType ?? backend.questionType,
    difficulty: backend.Difficulty ?? backend.difficulty,
    marks: backend.Marks ?? backend.marks,
    tags: backend.Tags ?? backend.tags,
    createdAt: backend.CreatedAt ? new Date(backend.CreatedAt).toISOString() : (backend.createdAt ?? new Date().toISOString()),
    subjectId: backend.SubjectId ?? backend.subjectId,
    subjectName: backend.SubjectName ?? backend.subjectName,
    answerOptions: (backend.AnswerOptions ?? backend.answerOptions ?? []).map((opt: any) => ({
      optionId: opt.OptionId ?? opt.optionId ?? 0,
      content: opt.Content ?? opt.content ?? '',
      isCorrect: opt.IsCorrect ?? opt.isCorrect ?? false,
      orderIndex: opt.OrderIndex ?? opt.orderIndex,
    })),
  };
}

class QuestionsService {
  async getQuestions(filter?: QuestionBankFilterRequest): Promise<QuestionBankListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filter?.page) queryParams.append('Page', filter.page.toString());
      if (filter?.pageSize) queryParams.append('PageSize', filter.pageSize.toString());
      if (filter?.subjectId) queryParams.append('SubjectId', filter.subjectId.toString());
      if (filter?.questionType) queryParams.append('QuestionType', filter.questionType);
      if (filter?.difficulty) queryParams.append('Difficulty', filter.difficulty);
      if (filter?.tags) queryParams.append('Tags', filter.tags);
      if (filter?.searchContent) queryParams.append('SearchContent', filter.searchContent);

      const endpoint = `${API_ENDPOINTS.questions.getAll}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 QuestionsService.getQuestions - Calling:', endpoint);
      const res = await apiService.get<any>(endpoint);
      console.log('📦 QuestionsService.getQuestions - Raw response:', res);
      
      // Backend trả về { message, data: QuestionBankListResponse }
      let listData: any = null;
      
      if (res && typeof res === 'object') {
        if (res.data) {
          console.log('📦 Found res.data:', res.data);
          if (res.data.data) {
            listData = res.data.data;
            console.log('📦 Found res.data.data:', listData);
          } else {
            listData = res.data;
          }
        } else if (res.Data) {
          console.log('📦 Found res.Data:', res.Data);
          if (res.Data.data) {
            listData = res.Data.data;
            console.log('📦 Found res.Data.data:', listData);
          } else {
            listData = res.Data;
          }
        } else {
          listData = res;
        }
      }
      
      console.log('📦 QuestionsService.getQuestions - Parsed listData:', listData);
      console.log('📦 listData type:', typeof listData);
      console.log('📦 listData keys:', listData ? Object.keys(listData) : 'null');
      
      if (listData && typeof listData === 'object') {
        if ('Questions' in listData || 'questions' in listData) {
          const questions = listData.Questions ?? listData.questions ?? [];
          const totalCount = listData.TotalCount ?? listData.totalCount ?? listData.Total ?? listData.total ?? 0;
          const page = listData.Page ?? listData.page ?? 1;
          const pageSize = listData.PageSize ?? listData.pageSize ?? 10;
          const totalPages = listData.TotalPages ?? listData.totalPages ?? Math.ceil(totalCount / pageSize);
          
          console.log('✅ QuestionsService.getQuestions - Parsed:', {
            questionsCount: questions.length,
            totalCount,
            page,
            pageSize,
            totalPages
          });
          
          // Map questions from PascalCase to camelCase
          const mappedQuestions = Array.isArray(questions) 
            ? questions.map(mapBackendQuestionToFrontend)
            : [];
          
          console.log('✅ QuestionsService.getQuestions - Mapped questions:', mappedQuestions.length);
          
          return {
            questions: mappedQuestions,
            totalCount,
            page,
            pageSize,
            totalPages,
          };
        } else if (Array.isArray(listData)) {
          console.log('✅ QuestionsService.getQuestions - Array format, count:', listData.length);
          const mappedQuestions = listData.map(mapBackendQuestionToFrontend);
          return {
            questions: mappedQuestions,
            totalCount: listData.length,
            page: filter?.page ?? 1,
            pageSize: filter?.pageSize ?? 10,
            totalPages: Math.ceil(listData.length / (filter?.pageSize ?? 10)),
          };
        }
      }
      
      console.warn('⚠️ QuestionsService.getQuestions - No valid data found, returning empty');
      return {
        questions: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
    } catch (error) {
      console.error('❌ QuestionsService.getQuestions - Error:', error);
      throw error;
    }
  }

  // Lấy câu hỏi theo ID (nếu BE có)
  async getQuestionById(id: number): Promise<QuestionBankResponse> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.questions.getById(String(id)));
      return (res.data ?? res.Data ?? res)?.data ?? res.Data;
    } catch (error) {
      console.error(`Error fetching question ${id}:`, error);
      throw error;
    }
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

