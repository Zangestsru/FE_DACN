// Exams Service for TailAdmin
// Map đúng dữ liệu và endpoints từ BE (ExamsService)

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

// DTOs khớp với BE
export interface ExamListItemDto {
  id: number;
  title: string;
  description?: string;
  courseId?: number;
  courseName?: string;
  teacherId?: number;
  teacherName?: string;
  subjectId?: number;
  subjectName?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  passingMark?: number;
  examType?: string;
  startAt?: string;
  endAt?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnswerOptionDto {
  optionId: number;
  content: string;
  isCorrect: boolean;
  sequenceIndex?: number;
}

export interface ExamQuestionDto {
  examQuestionId: number;
  questionId: number;
  content: string;
  questionType?: string;
  difficulty?: string;
  marks?: number;
  sequenceIndex?: number;
  options: AnswerOptionDto[];
}

export interface ExamDetailDto extends ExamListItemDto {
  randomizeQuestions: boolean;
  allowMultipleAttempts: boolean;
  questions: ExamQuestionDto[];
}

export interface CreateExamQuestionRequest {
  questionId: number;
  marks?: number;
  sequenceIndex?: number;
}

export interface CreateExamRequest {
  title: string;
  description?: string;
  courseId?: number;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  passingMark?: number;
  examType?: string; // default "Quiz"
  startAt?: string;
  endAt?: string;
  randomizeQuestions?: boolean; // default false
  allowMultipleAttempts?: boolean; // default true
  status?: string; // default "Draft"
  questions?: CreateExamQuestionRequest[];
}

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  courseId?: number;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  passingMark?: number;
  examType?: string;
  startAt?: string;
  endAt?: string;
  randomizeQuestions?: boolean;
  allowMultipleAttempts?: boolean;
  status?: string; // ví dụ: Draft, Active
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

class ExamsService {
  // Lấy danh sách bài thi (có phân trang & filter)
  async getExams(params?: { pageIndex?: number; pageSize?: number; courseId?: number; teacherId?: number; subjectId?: number; }): Promise<PagedResponse<ExamListItemDto>> {
    try {
      const query = new URLSearchParams();
      if (params?.pageIndex) query.append('pageIndex', String(params.pageIndex));
      if (params?.pageSize) query.append('pageSize', String(params.pageSize));
      if (params?.courseId) query.append('courseId', String(params.courseId));
      if (params?.teacherId) query.append('teacherId', String(params.teacherId));
      if (params?.subjectId) query.append('subjectId', String(params.subjectId));

      const endpoint = `${API_ENDPOINTS.exams.getAll}${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await apiService.get<any>(endpoint);
      // BE trả về ApiResponse { Success, Message, Data, StatusCode }
      return res.Data as PagedResponse<ExamListItemDto>;
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  }

  // Lấy chi tiết bài thi theo ID
  async getExamById(id: number): Promise<ExamDetailDto> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.exams.getById(String(id)));
      return res.Data as ExamDetailDto;
    } catch (error) {
      console.error(`Error fetching exam ${id}:`, error);
      throw error;
    }
  }

  // Tạo bài thi mới
  async createExam(examData: CreateExamRequest): Promise<ExamDetailDto> {
    try {
      const res = await apiService.post<any>(API_ENDPOINTS.exams.create, examData);
      return res.Data as ExamDetailDto;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  }

  // Cập nhật bài thi
  async updateExam(id: number, examData: UpdateExamRequest): Promise<ExamDetailDto> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.exams.update(String(id)), examData);
      return res.Data as ExamDetailDto;
    } catch (error) {
      console.error(`Error updating exam ${id}:`, error);
      throw error;
    }
  }

  // Xóa bài thi
  async deleteExam(id: number): Promise<void> {
    try {
      await apiService.delete<any>(API_ENDPOINTS.exams.delete(String(id)));
    } catch (error) {
      console.error(`Error deleting exam ${id}:`, error);
      throw error;
    }
  }

  // Thêm câu hỏi từ ngân hàng vào bài thi
  async addQuestionsFromBank(examId: number, payload: { questionIds: number[]; defaultMarks?: number; }): Promise<ExamDetailDto> {
    try {
      const endpoint = `/Exams/${examId}/add-from-bank`;
      const res = await apiService.post<any>(endpoint, payload);
      return res.Data as ExamDetailDto;
    } catch (error) {
      console.error(`Error adding questions from bank to exam ${examId}:`, error);
      throw error;
    }
  }

  // Thêm câu hỏi mới trực tiếp vào bài thi (tạo mới câu hỏi + đáp án)
  async addQuestionToExam(examId: number, payload: { content: string; questionType?: string; difficulty?: string; marks?: number; sequenceIndex?: number; answerOptions: { content: string; isCorrect: boolean; orderIndex?: number; }[]; }): Promise<ExamQuestionDto> {
    try {
      const endpoint = `/Exams/${examId}/questions`;
      const res = await apiService.post<any>(endpoint, payload);
      return res.Data as ExamQuestionDto;
    } catch (error) {
      console.error(`Error adding question to exam ${examId}:`, error);
      throw error;
    }
  }
}

export const examsService = new ExamsService();
export default examsService;