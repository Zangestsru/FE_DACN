/**
 * Exam Service
 * Xử lý tất cả các chức năng liên quan đến bài thi và chứng chỉ
 */

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
    // Gọi API thật với fallback mock khi lỗi hoặc backend chưa sẵn sàng
    try {
      const response = await apiService.get<IGetExamsResponse>(
        EXAM_ENDPOINTS.LIST,
        { params }
      );

      // Đảm bảo response có mảng data
      if (response && Array.isArray(response.data)) {
        return response;
      }

      throw new Error('Invalid exam list response');
    } catch (error) {
      return {
        success: true,
        data: mockExams,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: mockExams.length,
          totalPages: Math.ceil(mockExams.length / (params?.limit || 10)),
          hasNext: false,
          hasPrev: false,
        },
        message: 'Using mock exams due to API error',
      };
    }
  }

  /**
   * Lấy chi tiết bài thi theo ID
   * @param id - ID của bài thi
   * @returns Promise với thông tin bài thi
   */
  async getExamById(id: string | number): Promise<IExam> {
    try {
      const response = await apiService.get<IExam>(
        EXAM_ENDPOINTS.GET_BY_ID(id)
      );

      if (response && (response as any).id !== undefined) {
        return response;
      }
      throw new Error('Invalid exam detail response');
    } catch (error) {
      return {
        ...mockExam,
        id: typeof id === 'string' ? parseInt(id) : id,
      };
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
   * @returns Promise với session info
   */
  async startExam(examId: string | number): Promise<{ sessionId: string; startTime: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ sessionId: string; startTime: string }>(
    //   EXAM_ENDPOINTS.START(examId)
    // );

    // Mock response
    return Promise.resolve({
      sessionId: 'session-' + Date.now(),
      startTime: new Date().toISOString(),
    });
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
    try {
      const response = await apiService.get<Array<IExamResult & { exam: IExam }>>(
        EXAM_ENDPOINTS.MY_RESULTS
      );

      if (Array.isArray(response)) {
        return response;
      }
      throw new Error('Invalid my exam results response');
    } catch (error) {
      return [
        {
          ...mockExamResult,
          exam: mockExam,
        },
      ];
    }
  }

  /**
   * Lấy câu hỏi của bài thi
   * @param examId - ID của bài thi
   * @returns Promise với danh sách câu hỏi
   */
  async getExamQuestions(examId: string | number): Promise<any[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<any[]>(
    //   EXAM_ENDPOINTS.QUESTIONS(examId)
    // );

    // Mock response - Generate mock questions
    const questions = [
      // Câu hỏi 1: 200 chữ + hình ảnh
      {
        id: 1,
        question: `Câu hỏi 1: Phân tích và đánh giá tác động của công nghệ thông tin đến sự phát triển kinh tế - xã hội trong thời đại số hóa hiện nay. Công nghệ thông tin đã mang lại những thay đổi căn bản trong cách thức hoạt động của các doanh nghiệp, tổ chức và cá nhân. Từ việc tự động hóa quy trình sản xuất, cải thiện hiệu quả quản lý, đến việc tạo ra những mô hình kinh doanh mới như thương mại điện tử, kinh tế chia sẻ và dịch vụ số. Đồng thời, công nghệ thông tin cũng đặt ra những thách thức về bảo mật thông tin, quyền riêng tư cá nhân và khoảng cách số giữa các tầng lớp xã hội. Hãy phân tích những ưu điểm và nhược điểm của quá trình số hóa này, đồng thời đề xuất các giải pháp để tối đa hóa lợi ích và giảm thiểu rủi ro trong việc ứng dụng công nghệ thông tin vào phát triển bền vững.`,
        image: "/images/background.png",
        options: [
          "Công nghệ thông tin chỉ mang lại lợi ích kinh tế mà không có tác động xã hội",
          "Số hóa tạo ra cơ hội phát triển mới nhưng cần quản lý rủi ro về bảo mật và bất bình đẳng số",
          "Công nghệ thông tin hoàn toàn thay thế lao động con người trong mọi lĩnh vực",
          "Quá trình số hóa không ảnh hưởng đến mô hình kinh doanh truyền thống"
        ],
        correctAnswer: 1,
        type: 'multiple-choice'
      },
      // Câu hỏi 2: Cho phép chọn nhiều đáp án
      {
        id: 2,
        question: `Câu hỏi 2: Những yếu tố nào sau đây góp phần vào sự thành công của một dự án phần mềm? (Chọn tất cả đáp án đúng)`,
        options: [
          "Lập kế hoạch chi tiết và quản lý thời gian hiệu quả",
          "Giao tiếp rõ ràng giữa các thành viên trong nhóm",
          "Sử dụng công nghệ mới nhất mà không cần đánh giá phù hợp",
          "Kiểm thử và đảm bảo chất lượng sản phẩm",
          "Thu thập và phân tích yêu cầu từ khách hàng một cách chính xác"
        ],
        correctAnswer: [0, 1, 3, 4], // Multiple correct answers
        type: 'multiple-select'
      },
      // Các câu hỏi còn lại giữ nguyên
      ...Array.from({ length: 8 }, (_, i) => ({
        id: i + 3,
        question: `Câu hỏi ${i + 3}: Nội dung câu hỏi?`,
        options: [
          `Đáp án A cho câu ${i + 3}`,
          `Đáp án B cho câu ${i + 3}`,
          `Đáp án C cho câu ${i + 3}`,
          `Đáp án D cho câu ${i + 3}`,
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        type: 'multiple-choice'
      }))
    ];

    return Promise.resolve(questions);
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

