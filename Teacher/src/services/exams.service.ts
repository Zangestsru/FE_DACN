// Exams Service for Teacher
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
  // ✅ NEW FIELDS FOR CERTIFICATION EXAMS
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  level?: string;
  difficulty?: string;
  provider?: string;
  featuresJson?: string;
  validPeriod?: string;
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
  examType?: string;
  startAt?: string;
  endAt?: string;
  randomizeQuestions?: boolean;
  allowMultipleAttempts?: boolean;
  status?: string;
  questions?: CreateExamQuestionRequest[];
  // ✅ NEW FIELDS FOR CERTIFICATION EXAMS
  subjectId?: number;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  level?: string;
  difficulty?: string;
  provider?: string;
  featuresJson?: string;
  validPeriod?: string;
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
  status?: string;
  // ✅ NEW FIELDS FOR CERTIFICATION EXAMS
  subjectId?: number;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  level?: string;
  difficulty?: string;
  provider?: string;
  featuresJson?: string;
  validPeriod?: string;
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
      // Hỗ trợ cả Data và data (case-insensitive)
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      return data as PagedResponse<ExamListItemDto>;
    } catch (error) {
      console.error('Error fetching exams:', error);
      throw error;
    }
  }

  // Lấy chi tiết bài thi theo ID
  async getExamById(id: number): Promise<ExamDetailDto> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.exams.getById(String(id)));
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      return data as ExamDetailDto;
    } catch (error) {
      console.error(`Error fetching exam ${id}:`, error);
      throw error;
    }
  }

  // Tạo bài thi mới
  async createExam(examData: CreateExamRequest): Promise<ExamDetailDto> {
    try {
      const res = await apiService.post<any>(API_ENDPOINTS.exams.create, examData);
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      return data as ExamDetailDto;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  }

  // Cập nhật bài thi
  async updateExam(id: number, examData: UpdateExamRequest): Promise<ExamDetailDto> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.exams.update(String(id)), examData);
      
      // Lấy Data từ response
      const data = res.Data || res.data;
      
      // Nếu có Data, trả về Data
      if (data) {
        return data as ExamDetailDto;
      }
      
      // Nếu không có Data nhưng HTTP request thành công (apiService chỉ trả về response khi status 200),
      // backend có thể trả về SuccessResponse(null, "message") khi update thành công.
      // Trong trường hợp này, fetch lại exam để lấy dữ liệu đã cập nhật.
      return await this.getExamById(id);
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
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      return data as ExamDetailDto;
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

  // ✅ Upload exam cover image to Cloudinary
  async uploadExamImage(formData: FormData): Promise<{ url: string }> {
    try {
      const endpoint = `/Exams/upload-image`;
      // ✅ Don't set Content-Type header - browser will set it automatically with boundary
      const res = await apiService.post<any>(endpoint, formData);
      
      console.log('📦 Upload response:', res);
      
      // ✅ Handle both uppercase and lowercase Data property
      // Response structure: {Success, Message, Data: {url}, StatusCode}
      const data = res.Data || res.data;
      
      if (!data) {
        console.error('❌ No data in response:', res);
        throw new Error('Invalid response from server: No data field');
      }
      
      // Data is {url: "..."}
      if (!data.url) {
        console.error('❌ No url in data:', data);
        throw new Error('Invalid response from server: No url in data');
      }
      
      return { url: data.url };
    } catch (error) {
      console.error('Error uploading exam image:', error);
      throw error;
    }
  }
}

export const examsService = new ExamsService();
export default examsService;

