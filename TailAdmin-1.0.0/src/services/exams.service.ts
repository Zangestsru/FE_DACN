// Exams Service for TailAdmin
// Map đúng dữ liệu và endpoints từ BE (ExamsService)

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';
import { questionsService } from './questions.service';

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
  subjectId?: number;
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

export interface UpdateExamRequest {
  title?: string;
  description?: string;
  courseId?: number;
  subjectId?: number;
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

export interface PagedResponse<T> {
  items: T[];
  total: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ✅ Mix Questions DTOs
export interface DifficultyDistribution {
  difficulty: string; // Easy, Medium, Hard
  questionCount: number;
  marksPerQuestion: number;
}

export interface MixQuestionsRequest {
  numberOfVariants: number; // 1-100
  totalQuestions: number; // 1-500
  difficultyDistribution: DifficultyDistribution[];
}

export interface ExamVariant {
  variantCode: string; // V01, V02, ...
  questions: ExamQuestionDto[];
  totalMarks: number;
}

export interface MixQuestionsResponse {
  examId: number;
  variants: ExamVariant[];
  message: string;
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
      const data = (res as any)?.Data ?? (res as any)?.data;
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
      const data = (res as any)?.Data ?? (res as any)?.data;
      
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

  async createExamFromAI(payload: { subjectId: number; title?: string; topic?: string; count?: number; durationMinutes?: number; marksPerQuestion?: number; rawText?: string }, model?: string, apiKey?: string): Promise<{ examId: number; title: string; count: number }> {
    const envAny = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
    const envKeyGem = ((envAny.VITE_GEMINI_API_KEY || '') as string).trim();
    const envKeysGem = ((envAny.VITE_GEMINI_API_KEYS || '') as string).split(/[\,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
    const envKeyGroq = (((envAny.VITE_GROQ_API_KEY || envAny.VITE_OSS_API_KEY) || '') as string).trim();
    const envKeysGroq = ((envAny.VITE_GROQ_API_KEYS || envAny.VITE_OSS_API_KEYS || '') as string).split(/[\,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 20);
    const lsKeyGem = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || '').trim() : '';
    const lsKeysGem = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_keys') || '').split(/[\,\s]+/).map(s => s.trim()).filter(s => s.length > 20) : [];
    const lsKeyGroq = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_key') || localStorage.getItem('oss_api_key') || '') as string).trim() : '';
    const lsKeysGroq = typeof localStorage !== 'undefined' ? ((localStorage.getItem('groq_api_keys') || localStorage.getItem('oss_api_keys') || '') as string).split(/[\,\s]+/).map(s => s.trim()).filter(s => s.length > 20) : [];
    const modelEnvGem = ((envAny.VITE_GEMINI_MODEL || '') as string).trim();
    const modelsEnvGem = ((envAny.VITE_GEMINI_MODELS || '') as string).split(/[\,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3);
    const modelEnvOss = (((envAny.VITE_GROQ_MODEL || envAny.VITE_OSS_MODEL) || '') as string).trim();
    const modelsEnvOss = ((envAny.VITE_GROQ_MODELS || envAny.VITE_OSS_MODELS || '') as string).split(/[\,\s]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3);
    const modelLSGem = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_model') || '').trim() : '';
    const modelsLSGem = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_models') || '').split(/[\,\s]+/).map(s => s.trim()).filter(s => s.length > 3) : [];
    const modelLSOss = typeof localStorage !== 'undefined' ? ((localStorage.getItem('oss_model') || localStorage.getItem('groq_model') || '') as string).trim() : '';
    const modelsLSOss = typeof localStorage !== 'undefined' ? ((localStorage.getItem('oss_models') || localStorage.getItem('groq_models') || '') as string).split(/[\,\s]+/).map(s => s.trim()).filter(s => s.length > 3) : [];
    const mPrim = (model && model.trim()) || modelEnvGem || modelLSGem || modelsEnvGem[0] || modelsLSGem[0] || '';
    const isGroqModel = (() => { const ml = String(mPrim || model || '').toLowerCase(); return ml.includes('llama') || ml.includes('kimi') || ml.includes('whisper') || ml.includes('gpt oss') || ml.includes('scout'); })();
    const normalizeGroqModel = (name: string): string => {
      const s = String(name || '').toLowerCase();
      if (/llama\s*3\.3\s*70b/.test(s) || s.includes('llama')) return 'llama-3.3-70b-versatile';
      if (s.includes('whisper')) return 'whisper-large-v3';
      return 'llama-3.3-70b-versatile';
    };
    const modelChosenRaw = isGroqModel ? (model || modelEnvOss || modelLSOss || modelsEnvOss[0] || modelsLSOss[0] || 'Llama 3.3 70B') : (mPrim || 'gemini-1.5-flash');
    const modelChosen = isGroqModel ? normalizeGroqModel(modelChosenRaw) : modelChosenRaw;
    const keyChosen = (apiKey && apiKey.length > 20) ? apiKey : (isGroqModel ? (envKeysGroq[0] || (envKeyGroq && envKeyGroq.length > 20 ? envKeyGroq : (lsKeysGroq[0] || (lsKeyGroq && lsKeyGroq.length > 20 ? lsKeyGroq : '')))) : (envKeysGem[0] || (envKeyGem && envKeyGem.length > 20 ? envKeyGem : (lsKeysGem[0] || (lsKeyGem && lsKeyGem.length > 20 ? lsKeyGem : '')))));
    const headers: Record<string, string> | undefined = keyChosen ? (isGroqModel ? ({ 'X-Provider': 'groq', 'X-Groq-Api-Key': keyChosen, ...(modelChosen ? { 'X-Groq-Model': modelChosen } : {}) }) : ({ 'X-Provider': 'gemini', 'X-Gemini-Api-Key': keyChosen, ...(modelChosen ? { 'X-Gemini-Model': modelChosen } : {}) })) : undefined;

    try {
      const dbg = typeof localStorage !== 'undefined' && localStorage.getItem('debug') === 'true';
      if (dbg) {
        console.debug('ExamsService.createExamFromAI via question-bank', { provider: isGroqModel ? 'groq' : 'gemini', model: modelChosen, hasKey: !!keyChosen });
      }
      const count = Math.max(1, Number(payload.count || 5));
      const topic = String(payload.topic || payload.title || '').trim() || 'Câu hỏi trắc nghiệm tổng hợp';
      const resQ = await questionsService.createQuestionsFromAI({ subjectId: Number(payload.subjectId), topic, count, rawText: String(payload.rawText || '').trim() }, modelChosen, keyChosen);
      const createdIds = Array.isArray(resQ.questionIds) ? resQ.questionIds : [];
      const title = String(payload.title || `Bài kiểm tra AI (${count} câu)`).trim();
      const examDetail = await this.createExam({
        title,
        subjectId: Number(payload.subjectId),
        durationMinutes: Number(payload.durationMinutes || 10),
        totalQuestions: createdIds.length || count,
        totalMarks: createdIds.length || count,
        status: 'Draft',
        examType: 'Quiz'
      });
      const examId = Number((examDetail as any)?.id ?? (examDetail as any)?.ExamId ?? 0);
      if (createdIds.length && examId) {
        try { await this.addQuestionsFromBank(examId, { questionIds: createdIds, defaultMarks: Number(payload.marksPerQuestion || 1) }); } catch {}
      }
      return { examId, title, count: createdIds.length || count };
    } catch (innerErr) {
      const count = Math.max(1, Number(payload.count || 5));
      const title = String(payload.title || `Bài kiểm tra AI (${count} câu)`).trim();
      const examDetail = await this.createExam({
        title,
        subjectId: Number(payload.subjectId),
        durationMinutes: Number(payload.durationMinutes || 10),
        totalQuestions: count,
        totalMarks: count,
        status: 'Draft',
        examType: 'Quiz'
      });
      const examId = Number((examDetail as any)?.id ?? (examDetail as any)?.ExamId ?? 0);
      return { examId, title, count };
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
        throw new Error('Invalid response from server: No url field');
      }
      
      console.log('✅ Upload successful, URL:', data.url);
      return { url: data.url };
    } catch (error) {
      console.error('❌ Error uploading exam image:', error);
      throw error;
    }
  }

  // ✅ Trộn câu hỏi theo độ khó
  async mixQuestions(examId: number, request: MixQuestionsRequest): Promise<MixQuestionsResponse> {
    try {
      const endpoint = `/Exams/${examId}/mix-questions`;
      const res = await apiService.post<any>(endpoint, request);
      
      // BE trả về ApiResponse { Success, Message, Data, StatusCode }
      const data = res.Data || res.data;
      
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      
      return data as MixQuestionsResponse;
    } catch (error) {
      console.error(`Error mixing questions for exam ${examId}:`, error);
      throw error;
    }
  }
}

export const examsService = new ExamsService();
export default examsService;
