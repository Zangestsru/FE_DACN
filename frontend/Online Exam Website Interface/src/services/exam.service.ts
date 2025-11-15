/**
 * Exam Service
 * Xử lý tất cả các chức năng liên quan đến bài thi và chứng chỉ
 */

import axios, { AxiosInstance } from 'axios';
import { apiService } from './api.service';
import { EXAM_ENDPOINTS, CERTIFICATION_ENDPOINTS } from '@/constants/endpoints';
import { SUCCESS_MESSAGES } from '@/constants';
import type {
  IExam,
  ICertificationExam,
  IExamResult,
  IGetExamsRequest,
  IGetExamsResponse,
  ISubmitExamRequest,
  ISubmitExamResponse,
  ICertificate,
} from '@/types';

// Create dedicated axios instance for ExamsService (port 5002)
const examsApiClient: AxiosInstance = axios.create({
  baseURL: 'http://localhost:5002/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor for ExamsService
examsApiClient.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for ExamsService
examsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('❌ ExamsService Error:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

// ==================== MOCK DATA ====================

const mockExam: IExam = {
  id: 1,
  title: 'AWS Certified Cloud Practitioner',
  category: 'Cloud Computing',
  description: 'Chứng chỉ nền tảng về dịch vụ đám mây AWS',
  image: '/images/background.png',
  duration: '90 phút',
  questions: 65,
  passingScore: 70,
  difficulty: 'Beginner',
  price: 1200000,
  rating: 4.8,
  students: 15420,
};

const mockExams: IExam[] = Array.from({ length: 10 }, (_, i) => ({
  ...mockExam,
  id: i + 1,
  title: `Bài thi ${i + 1}`,
}));

const mockExamResult: IExamResult = {
  score: 85,
  correctAnswers: 55,
  totalQuestions: 65,
  passed: true,
  answers: {},
  timeSpent: 5400,
};

// ==================== EXAM SERVICE ====================

class ExamService {
  /**
   * Lấy danh sách tất cả bài thi
   * @param params - Filter và pagination params
   * @returns Promise với danh sách bài thi
   */
  async getAllExams(params?: IGetExamsRequest): Promise<IGetExamsResponse> {
    try {
      console.log('🔍 getAllExams called with params:', params);
      
      // Map frontend params to backend params
      const backendParams: any = {};
      if (params?.page) backendParams.pageIndex = params.page;
      if (params?.limit) backendParams.pageSize = params.limit;
      if (params?.category) backendParams.subjectId = params.category; // Map category to subjectId if needed
      
      console.log('📤 Sending to API:', backendParams);
      
      // Use dedicated ExamsService client (port 5002)
      const response = await examsApiClient.get(EXAM_ENDPOINTS.LIST, { params: backendParams });
      
      console.log('📥 API Response:', response.data);
      console.log('📥 response.data.success:', response.data?.success);
      console.log('📥 response.data.data:', response.data?.data);
      
      // Backend returns: { success: true, data: { items: [...], totalCount, pageIndex, pageSize, ... }, message: "..." }
      let backendData: any;
      if (response.data && typeof response.data === 'object') {
        if (response.data.success && response.data.data) {
          // Format: { success: true, data: {...} }
          backendData = response.data.data;
        } else if (response.data.items) {
          // Format: { items: [...], totalCount, ... }
          backendData = response.data;
        } else {
          backendData = response.data;
        }
      } else {
        backendData = response.data;
      }

      // Map backend ExamListItemDto to frontend IExam
      const mappedExams: IExam[] = (backendData?.items || []).map((item: any) => ({
          id: item.id || item.examId,
          title: item.title || 'Bài thi',
          subject: item.subjectName || item.subject || '',
          category: item.subjectName || item.category || 'Khác',
          description: item.description || '',
          image: '/images/background.png', // Default image
          duration: item.durationMinutes ? `${item.durationMinutes} phút` : '60 phút',
          questions: item.totalQuestions || 0,
          passingScore: item.passingMark || 0,
          difficulty: this.mapDifficulty(item.examType || ''),
          level: item.examType || 'Entry',
          price: 0, // Default price
          rating: 4.5, // Default rating
          students: 0, // Default students count
          provider: item.teacherName || 'Hệ thống',
          date: item.startAt ? new Date(item.startAt).toISOString() : undefined,
          time: item.startAt ? new Date(item.startAt).toLocaleTimeString('vi-VN') : undefined,
        }));

      // Return in frontend format
      // Backend returns: total (not totalCount), pageIndex, pageSize, totalPages
      const result = {
        data: mappedExams,
        total: backendData?.total || backendData?.totalCount || 0,
        page: backendData?.pageIndex || params?.page || 1,
        limit: backendData?.pageSize || params?.limit || 10,
        totalPages: backendData?.totalPages || Math.ceil((backendData?.total || 0) / (backendData?.pageSize || 10)),
      } as IGetExamsResponse;
      
      console.log('✅ Returning to frontend:', result);
      return result;
    } catch (error) {
      console.error('Error fetching exams:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalPages: 0,
      } as IGetExamsResponse;
    }
  }

  /**
   * Map exam type to difficulty level
   */
  private mapDifficulty(examType: string): IExam['difficulty'] {
    const type = examType.toLowerCase();
    if (type.includes('basic') || type.includes('entry') || type.includes('cơ bản')) {
      return 'Cơ bản';
    }
    if (type.includes('intermediate') || type.includes('associate') || type.includes('trung bình')) {
      return 'Trung bình';
    }
    if (type.includes('advanced') || type.includes('professional') || type.includes('nâng cao')) {
      return 'Nâng cao';
    }
    return 'Cơ bản';
  }

  /**
   * Lấy chi tiết bài thi theo ID
   * @param id - ID của bài thi
   * @returns Promise với thông tin bài thi
   */
  async getExamById(id: string | number): Promise<IExam> {
    try {
      console.log('🔍 getExamById called with id:', id);
      
      // Use dedicated ExamsService client (port 5002)
      const response = await examsApiClient.get(EXAM_ENDPOINTS.GET_BY_ID(id));
      
      console.log('📥 Exam detail response:', response.data);
      
      // Backend returns: { success: true, data: {...}, message: "..." }
      const backendData = response.data?.success ? response.data.data : response.data;
      
      if (!backendData) {
        throw new Error('No exam data received');
      }
      
      // Map backend data to frontend format
      const exam: IExam = {
        id: backendData.examId || backendData.id,
        title: backendData.title || 'Bài thi',
        subject: backendData.courseName || backendData.subject || '',
        category: backendData.courseName || backendData.category || 'Khác',
        description: backendData.description || backendData.instructions || '',
        image: '/images/background.png',
        duration: backendData.durationMinutes ? `${backendData.durationMinutes} phút` : '60 phút',
        questions: backendData.totalQuestions || 0,
        passingScore: backendData.passingMark || 0,
        difficulty: this.mapDifficulty(backendData.examType || ''),
        level: backendData.examType || 'Entry',
        price: 0,
        rating: 4.5,
        students: 0,
        provider: backendData.createdByName || 'Hệ thống',
        date: backendData.startAt ? new Date(backendData.startAt).toISOString() : undefined,
        time: backendData.startAt ? new Date(backendData.startAt).toLocaleTimeString('vi-VN') : undefined,
      };
      
      console.log('✅ Mapped exam:', exam);
      return exam;
    } catch (error) {
      console.error('Error fetching exam detail:', error);
      throw error;
    }
  }

  /**
   * Đăng ký thi
   * @param examId - ID của bài thi
   * @param userId - ID của user (optional, lấy từ token)
   * @returns Promise với message
   */
  async registerExam(examId: string | number, userId?: string | number): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   EXAM_ENDPOINTS.REGISTER(examId),
    //   { userId }
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.EXAM_REGISTERED,
    });
  }

  /**
   * Bắt đầu làm bài thi
   * @param examId - ID của bài thi
   * @returns Promise với attempt ID và thông tin bài thi
   */
  async startExam(examId: string | number): Promise<any> {
    try {
      console.log('🚀 startExam called with examId:', examId);
      
      // Use dedicated ExamsService client (port 5002)
      const response = await examsApiClient.post(`/Exams/${examId}/start`, {
        variantCode: null, // Optional
      });
      
      console.log('📥 Start exam response:', response.data);
      
      // Backend returns: { success: true, data: StartExamResponse, message: "..." }
      const backendData = response.data?.success ? response.data.data : response.data;
      
      return backendData;
    } catch (error: any) {
      console.error('❌ Error starting exam:', error);
      
      // Extract error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Không thể bắt đầu bài thi';
      throw new Error(errorMessage);
    }
  }

  /**
   * Nộp bài thi
   * @param examId - ID của bài thi
   * @param data - Dữ liệu bài thi (answers, timeSpent, etc.)
   * @returns Promise với kết quả bài thi
   */
  async submitExam(examId: string | number, data: ISubmitExamRequest): Promise<ISubmitExamResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<ISubmitExamResponse>(
    //   EXAM_ENDPOINTS.SUBMIT(examId),
    //   data
    // );

    // Mock response
    return Promise.resolve({
      result: mockExamResult,
      certificate: mockExamResult.passed ? {
        id: 'cert-' + Date.now(),
        examId,
        userId: 1,
        certificateNumber: 'CERT-' + Date.now(),
        issuedAt: new Date().toISOString(),
      } : undefined,
      message: mockExamResult.passed 
        ? 'Chúc mừng! Bạn đã đạt' 
        : 'Rất tiếc! Bạn chưa đạt',
    });
  }

  /**
   * Lấy kết quả bài thi
   * @param examId - ID của bài thi
   * @param userId - ID của user (optional)
   * @returns Promise với kết quả bài thi
   */
  async getExamResult(examId: string | number, userId?: string | number): Promise<IExamResult> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IExamResult>(
    //   EXAM_ENDPOINTS.RESULT(examId),
    //   { params: { userId } }
    // );

    // Mock response
    return Promise.resolve(mockExamResult);
  }

  /**
   * Lấy danh sách kết quả bài thi của user
   * @returns Promise với danh sách kết quả
   */
  async getMyResults(): Promise<Array<IExamResult & { exam: IExam }>> {
    const response = await apiService.get<Array<IExamResult & { exam: IExam }>>(
      EXAM_ENDPOINTS.MY_RESULTS
    );
    if (Array.isArray(response)) {
      return response;
    }
    throw new Error('Invalid my exam results response');
  }

  /**
   * Lấy câu hỏi của bài thi
   * @param examId - ID của bài thi
   * @returns Promise với danh sách câu hỏi
   */
  async getExamQuestions(examId: string | number): Promise<any[]> {
    const response = await apiService.get<any[]>(
      EXAM_ENDPOINTS.QUESTIONS(examId)
    );
    if (Array.isArray(response)) {
      return response;
    }
    throw new Error('Invalid exam questions response');
  }

  /**
   * Lấy thống kê bài thi
   * @param examId - ID của bài thi
   * @returns Promise với thống kê
   */
  async getExamStatistics(examId: string | number): Promise<any> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<any>(
    //   EXAM_ENDPOINTS.STATISTICS(examId)
    // );

    // Mock response
    return Promise.resolve({
      totalAttempts: 1500,
      averageScore: 75,
      passRate: 68,
      averageTime: 5200,
    });
  }

  /**
   * Báo cáo sự cố
   * @param examId - ID của bài thi
   * @param description - Mô tả sự cố
   * @param attachments - File đính kèm
   * @returns Promise với message
   */
  async reportIssue(
    examId: string | number,
    description: string,
    attachments?: FileList | null
  ): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const formData = new FormData();
    // formData.append('description', description);
    // if (attachments) {
    //   Array.from(attachments).forEach(file => {
    //     formData.append('attachments', file);
    //   });
    // }
    // const response = await apiService.post<{ message: string }>(
    //   EXAM_ENDPOINTS.REPORT_ISSUE(examId),
    //   formData
    // );

    // Mock response
    return Promise.resolve({
      message: 'Báo cáo đã được gửi thành công',
    });
  }

  /**
   * Lấy bài thi liên quan
   * @param examId - ID của bài thi
   * @returns Promise với danh sách bài thi liên quan
   */
  async getRelatedExams(examId: string | number): Promise<IExam[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IExam[]>(
    //   EXAM_ENDPOINTS.RELATED(examId)
    // );

    // Mock response
    return Promise.resolve(mockExams.slice(0, 4));
  }

  /**
   * Tìm kiếm bài thi
   * @param query - Từ khóa tìm kiếm
   * @returns Promise với danh sách bài thi
   */
  async searchExams(query: string): Promise<IExam[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IExam[]>(
    //   EXAM_ENDPOINTS.SEARCH,
    //   { params: { q: query } }
    // );

    // Mock response
    return Promise.resolve(
      mockExams.filter(exam => 
        exam.title.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  /**
   * Lấy bài thi theo category
   * @param category - Category name
   * @returns Promise với danh sách bài thi
   */
  async getExamsByCategory(category: string): Promise<IExam[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IExam[]>(
    //   EXAM_ENDPOINTS.BY_CATEGORY(category)
    // );

    // Mock response
    return Promise.resolve(mockExams);
  }

  /**
   * Lấy bài thi theo level
   * @param level - Level name
   * @returns Promise với danh sách bài thi
   */
  async getExamsByLevel(level: string): Promise<IExam[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IExam[]>(
    //   EXAM_ENDPOINTS.BY_LEVEL(level)
    // );

    // Mock response
    return Promise.resolve(mockExams);
  }

  // ==================== CERTIFICATION METHODS ====================

  /**
   * Lấy danh sách chứng chỉ
   * @returns Promise với danh sách chứng chỉ
   */
  async getAllCertifications(): Promise<ICertificationExam[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICertificationExam[]>(
    //   CERTIFICATION_ENDPOINTS.LIST
    // );

    // Mock response
    return Promise.resolve(mockExams as ICertificationExam[]);
  }

  /**
   * Lấy chứng chỉ của user
   * @returns Promise với danh sách chứng chỉ
   */
  async getMyCertificates(): Promise<ICertificate[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICertificate[]>(
    //   CERTIFICATION_ENDPOINTS.MY_CERTIFICATES
    // );

    // Mock response
    return Promise.resolve([
      {
        id: 'cert-1',
        examId: 1,
        userId: 1,
        certificateNumber: 'CERT-2024-001',
        issuedAt: new Date().toISOString(),
        downloadUrl: '/certificates/cert-1.pdf',
      },
    ]);
  }

  /**
   * Download chứng chỉ
   * @param certificateId - ID của chứng chỉ
   * @returns Promise
   */
  async downloadCertificate(certificateId: string | number): Promise<void> {
    // TODO: Uncomment khi có API thật
    // await apiService.download(
    //   CERTIFICATION_ENDPOINTS.DOWNLOAD(certificateId),
    //   `certificate-${certificateId}.pdf`
    // );

    // Mock response
    console.log('Downloading certificate:', certificateId);
    return Promise.resolve();
  }

  /**
   * Xác thực chứng chỉ
   * @param certificateNumber - Số chứng chỉ
   * @returns Promise với thông tin chứng chỉ
   */
  async verifyCertificate(certificateNumber: string): Promise<any> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<any>(
    //   CERTIFICATION_ENDPOINTS.VERIFY(certificateNumber)
    // );

    // Mock response
    return Promise.resolve({
      valid: true,
      certificateNumber,
      holderName: 'Nguyễn Văn A',
      examTitle: 'AWS Certified Cloud Practitioner',
      issuedDate: new Date().toISOString(),
    });
  }
}

// ==================== EXPORT ====================

export const examService = new ExamService();
export default examService;

