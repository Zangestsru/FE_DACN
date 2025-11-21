/**
 * Exam Service
 * Xử lý tất cả các chức năng liên quan đến bài thi và chứng chỉ
 */

import apiClient, { apiService } from './api.service';
import axios from 'axios';
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
    try {
      console.log('🔍 getAllExams called with params:', params);

      // Map frontend params to backend params
      const backendParams: any = {};
      if (params?.page) backendParams.pageIndex = params.page;
      if (params?.limit) backendParams.pageSize = params.limit;
      if (params?.category) backendParams.subjectId = params.category; // Map category to subjectId if needed

      console.log('📤 Sending to API:', backendParams);

      let response: any;
      try {
        response = await apiClient.get(EXAM_ENDPOINTS.LIST, { params: backendParams });
      } catch (primaryError: any) {
        const status = primaryError?.response?.status;
        console.error('❌ Primary exams list request failed with status:', status);
        // Fallback: nếu gateway trả 502/500, thử gọi trực tiếp ExamsService (dev)
        if (import.meta.env.DEV && (status === 502 || status === 500)) {
          try {
            const altBase = (import.meta.env.VITE_EXAMS_SERVICE_URL || 'http://localhost:5002');
            const url = `${altBase}/api${EXAM_ENDPOINTS.LIST}`;
            console.warn('🔁 Trying fallback direct call to ExamsService:', url);
            response = await axios.get(url, { params: backendParams, withCredentials: true });
          } catch (fallbackError: any) {
            console.error('❌ Fallback call failed:', fallbackError?.response?.status, fallbackError?.message);
            throw fallbackError;
          }
        } else {
          throw primaryError;
        }
      }

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
      const mappedExams: IExam[] = (backendData?.items || []).map((item: any) => {
        // ✅ Parse features JSON if exists
        let featuresArray: string[] = [];
        if (item.featuresJson || item.FeaturesJson) {
          try {
            const parsed = JSON.parse(item.featuresJson || item.FeaturesJson);
            if (Array.isArray(parsed)) {
              featuresArray = parsed;
            }
          } catch (e) {
            console.warn('Failed to parse featuresJson:', e);
          }
        }

        return {
          id: item.id || item.examId,
          title: item.title || 'Bài thi',
          subject: item.subjectName || item.subject || '',
          category: item.subjectName || item.category || 'Khác',
          description: item.description || '',
          // ✅ NEW: Use ImageUrl from backend
          image: item.imageUrl || item.ImageUrl || '/images/background.png',
          duration: item.durationMinutes ? `${item.durationMinutes} phút` : '60 phút',
          questions: item.totalQuestions || 0,
          passingScore: item.passingMark || 0,
          // ✅ NEW: Use Difficulty from backend, fallback to mapDifficulty
          difficulty: item.difficulty || item.Difficulty || this.mapDifficulty(item.examType || ''),
          // ✅ NEW: Use Level from backend
          level: item.level || item.Level || item.examType || 'Entry',
          // ✅ NEW: Use Price from backend
          price: item.price || item.Price || 0,
          // ✅ NEW: Use OriginalPrice from backend
          originalPrice: item.originalPrice || item.OriginalPrice,
          rating: 4.5, // Default rating
          students: 0, // Default students count
          // ✅ NEW: Use Provider from backend
          provider: item.provider || item.Provider || item.teacherName || 'Hệ thống',
          // ✅ NEW: Use Features and ValidPeriod from backend
          features: featuresArray.length > 0 ? featuresArray : undefined,
          validPeriod: item.validPeriod || item.ValidPeriod,
          date: item.startAt ? new Date(item.startAt).toISOString() : undefined,
          time: item.startAt ? new Date(item.startAt).toLocaleTimeString('vi-VN') : undefined,
        };
      });

      const total = backendData?.total || backendData?.totalCount || 0;
      const page = backendData?.pageIndex || params?.page || 1;
      const limit = backendData?.pageSize || params?.limit || 10;
      const totalPages = backendData?.totalPages || Math.ceil((total || 0) / (limit || 10));
      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
      const result: IGetExamsResponse = {
        success: true,
        data: mappedExams,
        pagination,
        message: 'Fetched exams',
      };

      console.log('✅ Returning to frontend:', result);
      return result;
    } catch (error) {
      console.error('Error fetching exams:', error);
      // Ném lỗi để UI hiển thị thông báo thay vì hiểu nhầm là không có dữ liệu
      throw error;
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

      const response = await apiClient.get(EXAM_ENDPOINTS.GET_BY_ID(id));

      console.log('📥 Exam detail response:', response.data);

      const payload = response?.data;
      const hasSuccess = (payload && (payload.success === true || payload.Success === true));
      let backendData: any = hasSuccess ? (payload?.data ?? payload?.Data) : (payload?.data ?? payload?.Data ?? payload);
      if (backendData && typeof backendData === 'object' && (backendData.exam || backendData.Exam)) {
        backendData = backendData.exam ?? backendData.Exam;
      }

      if (!backendData) {
        throw new Error('No exam data received');
      }

      const toNumber = (v: any): number | undefined => {
        if (v == null) return undefined;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = parseInt(v, 10);
          return isNaN(n) ? undefined : n;
        }
        return undefined;
      };

      const questionsArrayLength = (() => {
        const arr = backendData.questions || backendData.Questions || backendData.questionList || backendData.QuestionList || backendData.questionDtos || backendData.QuestionDtos;
        return Array.isArray(arr) ? arr.length : undefined;
      })();

      const mappedQuestions = (
        toNumber(backendData.totalQuestions) ??
        toNumber(backendData.TotalQuestions) ??
        toNumber(backendData.questionCount) ??
        toNumber(backendData.QuestionCount) ??
        toNumber(backendData.totalQuestion) ??
        toNumber(backendData.TotalQuestion) ??
        questionsArrayLength ??
        0
      );

      // Backend returns PassingMark (absolute score) or passingScore (percentage)
      // Try to get passingMark first (absolute score), then passingScore (percentage)
      const passingMark = toNumber(backendData.passingMark) ?? toNumber(backendData.PassingMark) ?? 0;
      const passingScorePercent = toNumber(backendData.passingScore) ?? 
                                  toNumber(backendData.PassingScore) ?? 
                                  toNumber(backendData.passPercent) ?? 
                                  toNumber(backendData.PassPercent) ?? 0;
      
      // If passingMark exists, use it; otherwise use passingScore (percentage)
      // Store passingMark separately for absolute score display
      const mappedPassingMark = passingMark > 0 ? passingMark : 
        (passingScorePercent > 0 && mappedQuestions > 0 
          ? Math.ceil((passingScorePercent / 100) * mappedQuestions) 
          : 0);
      
      // For backward compatibility, still store as passingScore (but it might be absolute or percentage)
      // We'll use passingMark for display
      const mappedPassingScore = passingMark > 0 ? passingMark : passingScorePercent;

      // ✅ Parse features JSON if exists
      let featuresArray: string[] = [];
      if (backendData.featuresJson || backendData.FeaturesJson) {
        try {
          const parsed = JSON.parse(backendData.featuresJson || backendData.FeaturesJson);
          if (Array.isArray(parsed)) {
            featuresArray = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse featuresJson:', e);
        }
      }

      const exam: IExam = {
        id: backendData.examId || backendData.id || backendData.Id,
        title: backendData.title || backendData.Title || 'Bài thi',
        subject: backendData.subject || backendData.SubjectName || '',
        category: backendData.category || backendData.Category || 'Khác',
        description: backendData.description || backendData.Description || backendData.instructions || '',
        // ✅ NEW: Use ImageUrl from backend
        image: backendData.imageUrl || backendData.ImageUrl || backendData.image || backendData.Image || '/images/background.png',
        duration: (backendData.durationMinutes || backendData.DurationMinutes) ? `${backendData.durationMinutes || backendData.DurationMinutes} phút` : (backendData.duration || backendData.Duration || '60 phút'),
        questions: mappedQuestions,
        passingScore: mappedPassingScore,
        // ✅ Store passingMark (absolute score) separately for display
        ...(mappedPassingMark > 0 && { passingMark: mappedPassingMark } as any),
        // ✅ NEW: Use Difficulty from backend, fallback to mapDifficulty
        difficulty: backendData.difficulty || backendData.Difficulty || this.mapDifficulty(backendData.examType || backendData.ExamType || ''),
        // ✅ NEW: Use Level from backend
        level: backendData.level || backendData.Level || backendData.examType || backendData.ExamType || 'Entry',
        // ✅ NEW: Use Price from backend
        price: backendData.price || backendData.Price || 0,
        // ✅ NEW: Use OriginalPrice from backend
        originalPrice: backendData.originalPrice || backendData.OriginalPrice,
        rating: 4.5,
        students: 0,
        // ✅ NEW: Use Provider from backend
        provider: backendData.provider || backendData.Provider || backendData.createdByName || backendData.CreatedByName || 'Hệ thống',
        // ✅ NEW: Use Features and ValidPeriod from backend
        features: featuresArray.length > 0 ? featuresArray : undefined,
        validPeriod: backendData.validPeriod || backendData.ValidPeriod,
        date: (backendData.startAt || backendData.StartAt) ? new Date(backendData.startAt || backendData.StartAt).toISOString() : undefined,
        time: (backendData.startAt || backendData.StartAt) ? new Date(backendData.startAt || backendData.StartAt).toLocaleTimeString('vi-VN') : undefined,
      };

      console.log('✅ Mapped exam:', exam);

      // Store exam information for later use in result display
      try {
        const examInfoKey = `exam_info_${exam.id}`;
        const examInfo = {
          id: exam.id,
          title: exam.title,
          duration: exam.duration,
          category: exam.category,
          difficulty: exam.difficulty,
          passingScore: exam.passingScore,
          image: exam.image
        };
        sessionStorage.setItem(examInfoKey, JSON.stringify(examInfo));
        console.log('📋 Stored exam info from getExamById in sessionStorage:', examInfo);
      } catch (storageError) {
        console.warn('⚠️ Could not store exam info:', storageError);
      }

      return exam;
    } catch (error) {
      console.error('Error fetching exam detail:', error);
      throw error;
    }
  }

  /**
   * Đăng ký thi (tạo enrollment cho bài thi miễn phí)
   * Với bài thi miễn phí, backend không yêu cầu enrollment, nhưng có thể tạo để tracking
   * @param examId - ID của bài thi
   * @param userId - ID của user (optional, lấy từ token)
   * @returns Promise với message
   */
  async registerExam(examId: string | number, userId?: string | number): Promise<{ message: string }> {
    try {
      console.log('📝 registerExam called with examId:', examId);

      // Backend không có endpoint /register riêng
      // Đối với bài thi miễn phí: enrollment sẽ tự động được tạo khi start exam
      // Đối với bài thi có phí: dùng /purchase endpoint

      // Trả về thành công ngay - enrollment sẽ được xử lý khi start exam
      console.log('✅ Exam registration skipped - will auto-enroll on start');
      return {
        message: SUCCESS_MESSAGES.EXAM_REGISTERED,
      };
    } catch (error: any) {
      console.error('❌ Error registering exam:', error);
      return {
        message: SUCCESS_MESSAGES.EXAM_REGISTERED,
      };
    }
  }

  /**
   * Mua bài thi (purchase exam)
   * @param examId - ID của bài thi
   * @param options - Tùy chọn (autoConfirm để tự động xác nhận thanh toán)
   * @returns Promise với thông tin transaction
   */
  async purchaseExam(examId: string | number, options?: { autoConfirm?: boolean }): Promise<any> {
    try {
      console.log('💳 purchaseExam called with examId:', examId, 'options:', options);

      const response = await apiClient.post(`/Exams/${examId}/purchase`, {
        Gateway: 'VNPay',
        Currency: 'VND',
        SimulateSuccess: options?.autoConfirm ?? true, // Tự động xác nhận thanh toán nếu autoConfirm = true
      });

      console.log('📥 Purchase exam response:', response.data);

      // Backend returns: { success: true, data: PurchaseExamResponse, message: "..." }
      const backendData = response.data?.success ? response.data.data : response.data;

      return backendData;
    } catch (error: any) {
      console.error('❌ Error purchasing exam:', error);

      // Extract error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Không thể mua bài thi';
      throw new Error(errorMessage);
    }
  }

  async createExamPayOSLink(
    examId: string | number,
    description?: string,
    returnUrl?: string,
    cancelUrl?: string,
    buyer?: { name?: string; email?: string; phone?: string; address?: string },
    items?: { name: string; quantity: number; price: number; unit?: string; taxPercentage?: number }[],
    expiredAt?: number
  ): Promise<any> {
    try {
      const payload: any = {
        description: description || `Thanh toán bài thi ${examId}`,
        returnUrl,
        cancelUrl,
        buyerName: buyer?.name,
        buyerEmail: buyer?.email,
        buyerPhone: buyer?.phone,
        buyerAddress: buyer?.address,
        items,
        expiredAt,
      };
      const response = await apiClient.post(EXAM_ENDPOINTS.PAYOS.CREATE_LINK(examId), payload);
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể tạo liên kết thanh toán PayOS';
      throw new Error(msg);
    }
  }

  async getPayOSOrder(orderCode: string | number): Promise<any> {
    try {
      const response = await apiClient.get(EXAM_ENDPOINTS.PAYOS.GET_ORDER(orderCode));
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể kiểm tra trạng thái đơn PayOS';
      throw new Error(msg);
    }
  }

  async cancelPayOSOrder(orderCode: string | number, cancellationReason?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/Exams/payos/order/${orderCode}/cancel`, {
        cancellationReason,
      });
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể huỷ link thanh toán PayOS';
      throw new Error(msg);
    }
  }

  async getPayOSInvoices(orderCode: string | number): Promise<any> {
    try {
      const response = await apiClient.get(`/Exams/payos/order/${orderCode}/invoices`);
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể lấy thông tin hóa đơn PayOS';
      throw new Error(msg);
    }
  }

  async downloadPayOSInvoice(orderCode: string | number, invoiceId: string): Promise<void> {
    try {
      const url = `${apiClient.defaults.baseURL}/Exams/payos/order/${orderCode}/invoices/${invoiceId}/download`;
      window.open(url, '_blank');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể tải hóa đơn PayOS';
      throw new Error(msg);
    }
  }

  async confirmPayOSWebhook(webhookUrl: string): Promise<any> {
    try {
      const response = await apiClient.post(`/Exams/payos/confirm-webhook`, { webhookUrl });
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể xác thực/cập nhật webhook PayOS';
      throw new Error(msg);
    }
  }

  async pollPayOSOrderStatus(
    orderCode: string | number,
    intervalMs = 3000,
    timeoutMs = 300000
  ): Promise<any> {
    const start = Date.now();
    while (true) {
      const info = await this.getPayOSOrder(orderCode);
      const status = info?.status || info?.Status;
      const amount = info?.amount ?? info?.Amount;
      const amountPaid = info?.amountPaid ?? info?.AmountPaid;
      if (status === 'PAID' || (amountPaid != null && amount != null && amountPaid >= amount)) {
        return info;
      }
      if (Date.now() - start > timeoutMs) {
        return info;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  /**
   * Bắt đầu làm bài thi
   * @param examId - ID của bài thi
   * @returns Promise với attempt ID và thông tin bài thi
   */
  async startExam(examId: string | number): Promise<any> {
    try {
      console.log('🚀 startExam called with examId:', examId);

      const response = await apiClient.post(`/Exams/${examId}/start`, {
        variantCode: null, // Optional
      });

      console.log('📥 Start exam response:', response.data);

      // Backend returns: { success: true, data: StartExamResponse, message: "..." }
      const backendData = response.data?.success ? response.data.data : response.data;

      const toNumber = (v: any): number | undefined => {
        if (v == null) return undefined;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = parseInt(v, 10);
          return Number.isNaN(n) ? undefined : n;
        }
        return undefined;
      };

      const attemptId =
        toNumber(backendData?.examAttemptId) ??
        toNumber(backendData?.ExamAttemptId) ??
        toNumber(backendData?.attemptId) ??
        toNumber(backendData?.AttemptId) ??
        toNumber(backendData?.id) ??
        toNumber(backendData?.Id);

      const normalized = {
        examAttemptId: attemptId,
        examId: toNumber(backendData?.examId) ?? toNumber(backendData?.ExamId),
        examTitle:
          backendData?.examTitle ?? backendData?.ExamTitle ?? backendData?.title ?? backendData?.Title ?? '',
        variantCode: backendData?.variantCode ?? backendData?.VariantCode ?? null,
        startTime: backendData?.startTime ?? backendData?.StartTime ?? null,
        endTime: backendData?.endTime ?? backendData?.EndTime ?? null,
        durationMinutes:
          toNumber(backendData?.durationMinutes) ?? toNumber(backendData?.DurationMinutes) ?? 0,
        questions: backendData?.questions ?? backendData?.Questions ?? [],
        totalMarks: toNumber(backendData?.totalMarks) ?? toNumber(backendData?.TotalMarks) ?? 0,
        passingMark: toNumber(backendData?.passingMark) ?? toNumber(backendData?.PassingMark) ?? 0,
        instructions:
          backendData?.instructions ?? backendData?.Instructions ?? 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.',
        _raw: backendData,
      };

      try {
        if (normalized.examAttemptId && normalized.examId != null) {
          const key = `exam_attempt_${normalized.examId}`;
          sessionStorage.setItem(key, String(normalized.examAttemptId));
        }

        // Store exam information for later use in result display
        if (normalized.examId) {
          const examInfoKey = `exam_info_${normalized.examId}`;

          // Try to get actual exam details from the start exam response
          let examTitle = normalized.examTitle;
          let examCategory = 'Khác'; // Default to Vietnamese "Other"
          let examDifficulty = 'Cơ bản'; // Default to Vietnamese "Basic"
          let examDuration = normalized.durationMinutes ? `${normalized.durationMinutes} phút` : '90 phút';
          let examPassingScore = normalized.passingMark || 70;
          let examImage = '/images/background.png';

          // Try to extract real exam info from the response data
          try {
            const rawData = normalized._raw;
            if (rawData) {
              // Look for category/subject information in various possible fields
              examCategory = rawData.subjectName || rawData.SubjectName ||
                rawData.category || rawData.Category ||
                rawData.subject || rawData.Subject || 'Khác';

              // Look for difficulty information
              const difficultyRaw = rawData.examType || rawData.ExamType || rawData.difficulty || rawData.Difficulty;
              if (difficultyRaw) {
                examDifficulty = this.mapDifficulty(difficultyRaw);
              }

              // Look for title information
              examTitle = rawData.examTitle || rawData.ExamTitle ||
                rawData.title || rawData.Title ||
                normalized.examTitle || 'Bài thi';

              // Look for image information
              examImage = rawData.image || rawData.Image || rawData.imageUrl || rawData.ImageUrl || '/images/background.png';

              console.log('📋 Extracted exam info from start response:', {
                examTitle, examCategory, examDifficulty, examDuration, examPassingScore, examImage
              });
            }
          } catch (extractionError) {
            console.warn('⚠️ Could not extract exam info from response:', extractionError);
          }

          const examInfo = {
            id: normalized.examId,
            title: examTitle,
            duration: examDuration,
            category: examCategory,
            difficulty: examDifficulty,
            passingScore: examPassingScore,
            image: examImage
          };
          sessionStorage.setItem(examInfoKey, JSON.stringify(examInfo));
          console.log('📋 Stored exam info in sessionStorage:', examInfo);
        }
      } catch { }

      return normalized;
    } catch (error: any) {
      console.error('❌ Error starting exam:', error);

      // Gracefully handle case: user already has an ongoing attempt
      const message: string = error.response?.data?.message || error.message || '';
      const status: number | undefined = error.response?.status;
      const lowerMsg = (message || '').toLowerCase();
      const isOngoingAttempt = status === 400 || status === 409 || (lowerMsg.includes('đang diễn ra') || lowerMsg.includes('in progress') || lowerMsg.includes('ongoing'));

      if (isOngoingAttempt) {
        try {
          const fallbackData = error.response?.data?.data ?? error.response?.data;

          const toNumber = (v: any): number | undefined => {
            if (v == null) return undefined;
            if (typeof v === 'number') return v;
            if (typeof v === 'string') {
              const n = parseInt(v, 10);
              return Number.isNaN(n) ? undefined : n;
            }
            return undefined;
          };

          const extractId = (obj: any): number | undefined => {
            if (!obj) return undefined;
            const keys = ['examAttemptId', 'ExamAttemptId', 'attemptId', 'AttemptId', 'id', 'Id'];
            for (const k of keys) {
              const n = toNumber(obj?.[k]);
              if (n != null) return n;
            }
            if (typeof obj === 'object') {
              for (const k of Object.keys(obj)) {
                const v = (obj as any)[k];
                const n = toNumber(v);
                if (n != null && /attempt|exam|id/i.test(k)) return n;
                const deep = extractId(v);
                if (deep != null) return deep;
              }
            }
            return undefined;
          };
          const attemptId =
            toNumber(fallbackData?.examAttemptId) ??
            toNumber(fallbackData?.ExamAttemptId) ??
            toNumber(fallbackData?.attemptId) ??
            toNumber(fallbackData?.AttemptId) ??
            toNumber(fallbackData?.id) ??
            toNumber(fallbackData?.Id) ??
            extractId(fallbackData);

          if (attemptId) {
            const normalized = {
              examAttemptId: attemptId,
              examId: toNumber(fallbackData?.examId) ?? toNumber(fallbackData?.ExamId) ?? toNumber(examId),
              examTitle:
                fallbackData?.examTitle ?? fallbackData?.ExamTitle ?? fallbackData?.title ?? fallbackData?.Title ?? '',
              variantCode: fallbackData?.variantCode ?? fallbackData?.VariantCode ?? null,
              startTime: fallbackData?.startTime ?? fallbackData?.StartTime ?? null,
              endTime: fallbackData?.endTime ?? fallbackData?.EndTime ?? null,
              durationMinutes:
                toNumber(fallbackData?.durationMinutes) ?? toNumber(fallbackData?.DurationMinutes) ?? 0,
              questions: fallbackData?.questions ?? fallbackData?.Questions ?? [],
              totalMarks: toNumber(fallbackData?.totalMarks) ?? toNumber(fallbackData?.TotalMarks) ?? 0,
              passingMark: toNumber(fallbackData?.passingMark) ?? toNumber(fallbackData?.PassingMark) ?? 0,
              instructions:
                fallbackData?.instructions ?? fallbackData?.Instructions ?? 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.',
              _raw: fallbackData,
            };
            console.warn('⚠️ Resuming ongoing attempt with ID:', attemptId);
            return normalized;
          }

          // Try sessionStorage cache
          try {
            const key = `exam_attempt_${examId}`;
            const cached = sessionStorage.getItem(String(key));
            const cachedId = cached ? parseInt(cached, 10) : undefined;
            if (cachedId && !Number.isNaN(cachedId)) {
              const normalized = {
                examAttemptId: cachedId,
                examId: toNumber(examId),
                examTitle: '',
                variantCode: null,
                startTime: null,
                endTime: null,
                durationMinutes: 0,
                questions: [],
                totalMarks: 0,
                passingMark: 0,
                instructions: 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.',
                _raw: { cached: true },
              };
              console.warn('⚠️ Resuming attempt from sessionStorage cache:', cachedId);
              return normalized;
            }
          } catch { }

          // Try fetching ongoing attempt via possible endpoints
          const tryEndpoints = [
            `/Exams/${examId}/attempts/ongoing`,
            `/Exams/${examId}/attempts/current`,
            `/Exams/${examId}/attempts/last`,
            `/Exams/${examId}/attempts`,
            `/Exams/attempts`,
            `/ExamAttempts`,
            `/Users/me/exam-attempts`,
            `/User/exam-attempts`,
            `/Exams/${examId}/Attempts`,
            `/ExamAttempts/by-exam/${examId}`
          ];

          for (const ep of tryEndpoints) {
            try {
              const resp = await apiClient.get(ep);
              const data = resp.data?.success ? resp.data.data : resp.data;
              const attId =
                toNumber(data?.examAttemptId) ??
                toNumber(data?.ExamAttemptId) ??
                toNumber(data?.attemptId) ??
                toNumber(data?.AttemptId) ??
                toNumber(data?.id) ??
                toNumber(data?.Id);

              // If list endpoint returns array, pick in-progress attempt
              const list = Array.isArray(data) ? data : null;
              const pick = list ? (list.find((x: any) => {
                const st = (x?.status || x?.Status || '').toLowerCase();
                return st.includes('progress') || st.includes('start') || st.includes('active');
              }) || list[0]) : data;

              const finalAttemptId = attId ?? (
                toNumber(pick?.examAttemptId) ??
                toNumber(pick?.ExamAttemptId) ??
                toNumber(pick?.attemptId) ??
                toNumber(pick?.AttemptId) ??
                toNumber(pick?.id) ??
                toNumber(pick?.Id)
              );

              if (finalAttemptId) {
                const normalized = {
                  examAttemptId: finalAttemptId,
                  examId: toNumber(pick?.examId) ?? toNumber(pick?.ExamId) ?? toNumber(examId),
                  examTitle: pick?.examTitle ?? pick?.ExamTitle ?? pick?.title ?? pick?.Title ?? '',
                  variantCode: pick?.variantCode ?? pick?.VariantCode ?? null,
                  startTime: pick?.startTime ?? pick?.StartTime ?? null,
                  endTime: pick?.endTime ?? pick?.EndTime ?? null,
                  durationMinutes:
                    toNumber(pick?.durationMinutes) ?? toNumber(pick?.DurationMinutes) ?? 0,
                  questions: pick?.questions ?? pick?.Questions ?? [],
                  totalMarks: toNumber(pick?.totalMarks) ?? toNumber(pick?.TotalMarks) ?? 0,
                  passingMark: toNumber(pick?.passingMark) ?? toNumber(pick?.PassingMark) ?? 0,
                  instructions:
                    pick?.instructions ?? pick?.Instructions ?? 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.',
                  _raw: pick,
                };
                console.warn('⚠️ Fetched ongoing attempt via endpoint:', ep, 'ID:', finalAttemptId);
                return normalized;
              }
            } catch { }
          }
          try {
            const ongoing = await this.getOngoingAttemptByExamId(examId);
            if (ongoing?.examAttemptId) {
              return ongoing;
            }
          } catch { }
        } catch { }
      }

      const errorMessage = message || 'Không thể bắt đầu bài thi';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get exam attempt data with questions
   * @param attemptId - ID của exam attempt
   * @returns Promise với thông tin attempt và questions  
   */
  async getExamAttempt(attemptId: string | number): Promise<any> {
    try {
      console.log('🔍 getExamAttempt called with attemptId:', attemptId);

      // Use the correct ExamsService microservice endpoint
      const response = await apiClient.get(`/Exams/attempts/${attemptId}`);

      console.log('📥 Exam attempt response:', response.data);

      // Backend returns: { success: true, data: {...}, message: "..." }
      const backendData = response.data?.success ? response.data.data : response.data;

      // Map the response to the expected format
      const mappedData = {
        examAttemptId: backendData?.examAttemptId || backendData?.ExamAttemptId || attemptId,
        examId: backendData?.examId || backendData?.ExamId,
        examTitle: backendData?.examTitle || backendData?.ExamTitle || 'Bài thi',
        variantCode: backendData?.variantCode || backendData?.VariantCode || null,
        startTime: backendData?.startTime || backendData?.StartTime,
        endTime: backendData?.endTime || backendData?.EndTime,
        durationMinutes: backendData?.durationMinutes || backendData?.DurationMinutes || 0,
        questions: backendData?.questions || backendData?.Questions || [],
        totalMarks: backendData?.totalMarks || backendData?.TotalMarks || 0,
        passingMark: backendData?.passingMark || backendData?.PassingMark || 0,
        instructions: backendData?.instructions || backendData?.Instructions || 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.',
        _raw: backendData
      };

      // Log warning if no questions found
      if (!mappedData.questions || mappedData.questions.length === 0) {
        console.warn('⚠️ No questions found in exam attempt! Exam may not have questions added yet.');
      }

      return mappedData;
    } catch (error: any) {
      console.error('❌ Error getting exam attempt:', error);

      // For development/demo purposes, return mock data if API fails
      if (error.response?.status === 404 || error.response?.status === 401 || error.message?.includes('không tìm thấy')) {
        console.warn('⚠️ Attempt not found or unauthorized, returning mock data for demo');
        return {
          examAttemptId: parseInt(String(attemptId), 10),
          examId: 1,
          examTitle: 'Bài thi thử nghiệm',
          questions: [
            {
              questionId: 1,
              content: 'Đây là câu hỏi số 1 trong bài thi thử nghiệm. Hãy chọn đáp án đúng nhất?',
              questionType: 'SingleChoice',
              options: [
                { optionId: 1, content: 'Đáp án A cho câu hỏi số 1' },
                { optionId: 2, content: 'Đáp án B cho câu hỏi số 1' },
                { optionId: 3, content: 'Đáp án C cho câu hỏi số 1' },
                { optionId: 4, content: 'Đáp án D cho câu hỏi số 1' }
              ]
            },
            {
              questionId: 2,
              content: 'Đây là câu hỏi số 2 trong bài thi thử nghiệm. Hãy chọn đáp án đúng nhất?',
              questionType: 'SingleChoice',
              options: [
                { optionId: 5, content: 'Đáp án A cho câu hỏi số 2' },
                { optionId: 6, content: 'Đáp án B cho câu hỏi số 2' },
                { optionId: 7, content: 'Đáp án C cho câu hỏi số 2' },
                { optionId: 8, content: 'Đáp án D cho câu hỏi số 2' }
              ]
            },
            {
              questionId: 3,
              content: 'Đây là câu hỏi số 3 trong bài thi thử nghiệm. Hãy chọn đáp án đúng nhất?',
              questionType: 'SingleChoice',
              options: [
                { optionId: 9, content: 'Đáp án A cho câu hỏi số 3' },
                { optionId: 10, content: 'Đáp án B cho câu hỏi số 3' },
                { optionId: 11, content: 'Đáp án C cho câu hỏi số 3' },
                { optionId: 12, content: 'Đáp án D cho câu hỏi số 3' }
              ]
            }
          ],
          durationMinutes: 60,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          instructions: 'Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.'
        };
      }

      throw new Error(error.response?.data?.message || 'Không thể lấy thông tin bài thi');
    }
  }

  /**
   * Try to fetch ongoing attempt for an exam
   * @param examId
   */
  async getOngoingAttemptByExamId(examId: string | number): Promise<any | null> {
    try {
      const toNumber = (v: any): number | undefined => {
        if (v == null) return undefined;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = parseInt(v, 10);
          return Number.isNaN(n) ? undefined : n;
        }
        return undefined;
      };

      const tryEndpoints = [
        `/Exams/${examId}/attempts/ongoing`,
        `/Exams/${examId}/attempts/current`,
        `/Exams/${examId}/attempts/last`,
        `/Exams/${examId}/attempts`,
        `/Exams/attempts`,
        `/ExamAttempts`,
        `/Users/me/exam-attempts`,
        `/User/exam-attempts`,
        `/Exams/${examId}/Attempts`,
        `/ExamAttempts/by-exam/${examId}`
      ];

      for (const ep of tryEndpoints) {
        try {
          const resp = await apiClient.get(ep);
          const data = resp.data?.success ? resp.data.data : resp.data;

          const list = Array.isArray(data) ? data : null;
          const pick = list ? (list.find((x: any) => {
            const st = (x?.status || x?.Status || '').toLowerCase();
            return st.includes('progress') || st.includes('start') || st.includes('active');
          }) || list[0]) : data;

          const finalAttemptId =
            toNumber(pick?.examAttemptId) ??
            toNumber(pick?.ExamAttemptId) ??
            toNumber(pick?.attemptId) ??
            toNumber(pick?.AttemptId) ??
            toNumber(pick?.id) ??
            toNumber(pick?.Id);

          if (finalAttemptId) {
            return {
              examAttemptId: finalAttemptId,
              examId: toNumber(pick?.examId) ?? toNumber(pick?.ExamId) ?? toNumber(examId),
              examTitle: pick?.examTitle ?? pick?.ExamTitle ?? pick?.title ?? pick?.Title ?? '',
              _raw: pick,
            };
          }
        } catch { }
      }

      try {
        const key = `exam_attempt_${examId}`;
        const cached = sessionStorage.getItem(String(key));
        const cachedId = cached ? parseInt(cached, 10) : undefined;
        if (cachedId && !Number.isNaN(cachedId)) {
          return {
            examAttemptId: cachedId,
            examId: toNumber(examId),
            examTitle: '',
            _raw: { cached: true }
          };
        }
      } catch { }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Save completed exam to user history
   * @param examData - Exam completion data
   */
  private async saveExamToHistory(examData: {
    examId: number;
    examTitle: string;
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    timeSpentMinutes: number;
    correctAnswers: number;
    totalQuestions: number;
    completedAt: string;
  }): Promise<void> {
    try {
      console.log('💾 Saving exam to history:', examData);

      const activityData = {
        activityType: 'EXAM_COMPLETED',
        examId: examData.examId,
        examTitle: examData.examTitle,
        score: examData.score,
        maxScore: examData.maxScore,
        percentage: examData.percentage,
        isPassed: examData.isPassed,
        timeSpentMinutes: examData.timeSpentMinutes,
        correctAnswers: examData.correctAnswers,
        totalQuestions: examData.totalQuestions,
        completedAt: examData.completedAt,
        metadata: {
          examCompleted: true,
          passingScore: examData.isPassed ? 'PASSED' : 'FAILED'
        }
      };

      await apiClient.post('/users/activity', activityData);
      console.log('✅ Exam saved to history successfully');
    } catch (error) {
      console.error('❌ Error saving exam to history:', error);
      // Don't throw error - history storage is not critical for exam submission
    }
  }

  /**
   * Nộp bài thi
   * @param data - Dữ liệu submit bao gồm examId, attemptId, answers
   * @returns Promise với kết quả bài thi
   */
  async submitExam(data: { examId: number; attemptId: number; answers: any[]; timeSpent?: number }): Promise<any> {
    try {
      console.log('🚀 submitExam called with data:', data);
      console.log('⏱️ timeSpent value:', data.timeSpent, 'type:', typeof data.timeSpent);

      // Use the correct endpoint format: POST /Exams/{examId}/submit
      const requestBody: any = {
        examAttemptId: data.attemptId,
        answers: data.answers,
      };

      // ✅ Include timeSpentSeconds if provided (actual time spent from frontend)
      if (data.timeSpent !== undefined && data.timeSpent !== null && data.timeSpent >= 0) {
        requestBody.timeSpentSeconds = data.timeSpent;
        console.log('✅ Sending timeSpentSeconds to backend:', data.timeSpent, 'seconds');
      } else {
        console.warn('⚠️ timeSpent is missing or invalid:', data.timeSpent);
      }

      console.log('📤 Final request body:', JSON.stringify(requestBody, null, 2));
      const response = await apiClient.post(`/Exams/${data.examId}/submit`, requestBody);

      console.log('📥 Submit exam response:', response.data);

      // Backend returns: { success: true, data: SubmitExamResponse, message: "..." }
      const backendData = response.data?.success ? response.data.data : response.data;

      // Save exam to history if submission was successful
      if (backendData && !backendData._mock) {
        try {
          const historyData = {
            examId: data.examId,
            examTitle: backendData.examTitle || backendData.title || 'Bài thi',
            score: backendData.score || backendData.correctAnswers || 0,
            maxScore: backendData.maxScore || backendData.totalQuestions || data.answers?.length || 0,
            percentage: backendData.percentage || backendData.score || 0,
            isPassed: backendData.isPassed || backendData.passed || false,
            timeSpentMinutes: backendData.timeSpentMinutes || Math.floor((data.timeSpent || 3600) / 60),
            correctAnswers: backendData.correctAnswers || backendData.score || 0,
            totalQuestions: backendData.totalQuestions || backendData.maxScore || data.answers?.length || 0,
            completedAt: new Date().toISOString()
          };

          await this.saveExamToHistory(historyData);
        } catch (historyError) {
          console.error('❌ Error saving exam history:', historyError);
        }
      }

      return backendData;
    } catch (error: any) {
      console.error('❌ Error submitting exam:', error);

      // For demo purposes, return mock result if API fails
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('⚠️ API not available, returning mock result for demo');

        // Count actual answers submitted (questions with selected options)
        const totalQuestions = data.answers?.length || 7; // Default to 7 questions
        const answeredQuestions = data.answers?.filter(answer => answer.selectedOptionIds && answer.selectedOptionIds.length > 0) || [];
        const unansweredQuestions = totalQuestions - answeredQuestions.length;

        // For demo: assume all answered questions are correct, unanswered are incorrect
        const correctAnswers = answeredQuestions.length;
        const incorrectAnswers = unansweredQuestions;
        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        console.log('📊 Exam calculation:', {
          totalQuestions,
          answeredQuestions: answeredQuestions.length,
          unansweredQuestions,
          correctAnswers,
          incorrectAnswers,
          score
        });

        const mockResult = {
          examAttemptId: data.attemptId,
          examId: data.examId,
          examTitle: 'Bài thi thử nghiệm',
          examImage: '/images/background.png',
          examCategory: 'Cloud Computing',
          examDifficulty: 'Beginner',
          examDuration: '90 phút',
          examPassingScore: 70,
          percentage: score,
          score: correctAnswers,
          maxScore: totalQuestions,
          isPassed: score >= 70,
          timeSpentMinutes: Math.floor((data.timeSpent || 3600) / 60),
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions,
          answers: data.answers || [],
          _mock: true
        };

        // Store mock result in sessionStorage for later retrieval
        try {
          const mockResultKey = `mock_exam_result_${data.attemptId}`;
          sessionStorage.setItem(mockResultKey, JSON.stringify(mockResult));
          console.log('📋 Stored mock result in sessionStorage for attempt:', data.attemptId);
        } catch { }

        // Store submission data for accurate result calculation
        try {
          const submissionDataKey = `exam_submission_${data.attemptId}`;

          // Try to get actual exam info from sessionStorage
          let examTitle = mockResult.examTitle;
          let examCategory = 'Khác'; // Vietnamese default
          let examDifficulty = 'Cơ bản'; // Vietnamese default
          let examDuration = '90 phút';
          let examPassingScore = 70;

          try {
            const examInfoKey = `exam_info_${data.examId}`;
            const storedExamInfo = sessionStorage.getItem(examInfoKey);
            if (storedExamInfo) {
              const examInfo = JSON.parse(storedExamInfo);
              examTitle = examInfo.title || examTitle;
              examCategory = examInfo.category || examCategory;
              examDifficulty = examInfo.difficulty || examDifficulty;
              examDuration = examInfo.duration || examDuration;
              examPassingScore = examInfo.passingScore || examPassingScore;
            }
          } catch { }

          const submissionData = {
            examId: data.examId,
            examTitle: examTitle,
            examCategory: examCategory,
            examDifficulty: examDifficulty,
            examDuration: examDuration,
            examPassingScore: examPassingScore,
            answers: data.answers,
            timeSpent: data.timeSpent || 3600
          };
          sessionStorage.setItem(submissionDataKey, JSON.stringify(submissionData));
          console.log('📋 Stored submission data in sessionStorage for attempt:', data.attemptId);
        } catch { }

        // Also save mock exam to history for demo purposes
        try {
          const historyData = {
            examId: data.examId,
            examTitle: mockResult.examTitle,
            score: mockResult.score,
            maxScore: mockResult.maxScore,
            percentage: mockResult.percentage,
            isPassed: mockResult.isPassed,
            timeSpentMinutes: mockResult.timeSpentMinutes,
            correctAnswers: mockResult.correctAnswers,
            totalQuestions: mockResult.totalQuestions,
            completedAt: new Date().toISOString()
          };

          await this.saveExamToHistory(historyData);
        } catch (historyError) {
          console.error('❌ Error saving mock exam history:', historyError);
        }

        return mockResult;
      }

      throw new Error(error.response?.data?.message || 'Không thể nộp bài');
    }
  }

  /**
   * Save answer (auto-save during exam)
   * @param data - Question and answer data
   * @returns Promise
   */
  async saveAnswer(data: { examId: number; attemptId: number; questionId: number; selectedOptionIds: number[]; textAnswer?: string }): Promise<void> {
    try {
      console.log('💾 saveAnswer called:', data);

      await apiClient.post(`/Exams/${data.examId}/attempts/${data.attemptId}/save-answer`, {
        questionId: data.questionId,
        selectedOptionIds: data.selectedOptionIds,
        textAnswer: data.textAnswer,
      });

      console.log('✅ Answer saved');
    } catch (error: any) {
      console.error('❌ Error saving answer:', error);
      // Don't throw for auto-save failures
    }
  }

  /**
   * Save progress (batch save all answers)
   * @param data - Exam ID, attempt ID, and answers array
   * @returns Promise with save result
   */
  async saveProgress(data: { examId: number; attemptId: number; answers: Array<{ questionId: number; selectedOptionIds: number[]; textAnswer?: string | null }> }): Promise<any> {
    try {
      console.log('💾 saveProgress called:', data);

      const response = await apiClient.post(`/Exams/${data.examId}/attempts/${data.attemptId}/save-batch`, {
        examAttemptId: data.attemptId,
        answers: data.answers.map(a => ({
          questionId: a.questionId,
          selectedOptionIds: a.selectedOptionIds || [],
          textAnswer: a.textAnswer || null,
        })),
      });

      console.log('✅ Progress saved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error saving progress:', error);
      throw new Error(error.response?.data?.message || 'Không thể lưu tiến trình');
    }
  }

  /**
   * Restore progress (get saved answers from Redis)
   * @param examId - Exam ID
   * @param attemptId - Attempt ID
   * @returns Promise with saved progress
   */
  async restoreProgress(examId: number, attemptId: number): Promise<any> {
    try {
      console.log('📥 restoreProgress called:', { examId, attemptId });

      const response = await apiClient.get(`/Exams/${examId}/attempts/${attemptId}/progress`);

      console.log('✅ Progress restored:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error restoring progress:', error);
      throw new Error(error.response?.data?.message || 'Không thể khôi phục tiến trình');
    }
  }

  /**
   * Lấy kết quả bài thi theo attempt ID
   * @param attemptId - ID của attempt
   * @returns Promise với kết quả bài thi
   */
  async getExamResult(attemptId: string | number): Promise<any> {
    try {
      console.log('🔍 getExamResult called with attemptId:', attemptId);

      // Get userId from localStorage
      const userStr = localStorage.getItem('user_info');
      let userId: number | null = null;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId || user.UserId || user.id;
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Use correct backend endpoint: GET /Exams/results/{userId}
      const response = await apiClient.get(`/Exams/results/${userId}`);

      console.log('📥 User exam results response:', response.data);
      console.log('📥 Response type:', typeof response.data);
      console.log('📥 Response keys:', response.data ? Object.keys(response.data) : 'null');

      // Backend returns: { success: true, data: { Results: [...], Statistics: {...} } } or { success: true, data: [...] }
      const backendData = response.data?.success ? response.data.data : response.data;
      console.log('📥 Backend data:', backendData);
      console.log('📥 Backend data type:', typeof backendData);
      console.log('📥 Backend data keys:', backendData ? Object.keys(backendData) : 'null');

      // Extract results array - handle both formats
      let resultsArray: any[] = [];
      if (Array.isArray(backendData)) {
        resultsArray = backendData;
        console.log('✅ Backend data is array, using directly');
      } else if (backendData?.Results && Array.isArray(backendData.Results)) {
        resultsArray = backendData.Results;
        console.log('✅ Found Results array in backendData.Results');
      } else if (backendData?.results && Array.isArray(backendData.results)) {
        resultsArray = backendData.results;
        console.log('✅ Found results array in backendData.results');
      } else {
        console.warn('⚠️ Could not find results array in response:', {
          backendData,
          hasResults: !!backendData?.results,
          hasResultsPascal: !!backendData?.Results,
          isArray: Array.isArray(backendData)
        });
      }

      console.log(`📊 Searching in ${resultsArray.length} results for attemptId: ${attemptId}`);

      // Find the specific attempt in the results array - check multiple field names
      const result = resultsArray.find(item => {
        const attemptIdNum = typeof attemptId === 'string' ? parseInt(attemptId) : attemptId;
        return (
          item.examAttemptId == attemptIdNum ||
          item.ExamAttemptId == attemptIdNum ||
          item.examAttemptId == attemptId ||
          item.ExamAttemptId == attemptId ||
          item.attemptId == attemptIdNum ||
          item.AttemptId == attemptIdNum ||
          item.id == attemptIdNum ||
          item.Id == attemptIdNum ||
          item.examAttemptId == attemptId ||
          item.ExamAttemptId == attemptId ||
          item.attemptId == attemptId ||
          item.AttemptId == attemptId ||
          item.id == attemptId ||
          item.Id == attemptId
        );
      });

      if (result) {
        console.log('✅ Found exam result:', result);
        console.log('📋 Result keys:', Object.keys(result));
        return result;
      } else {
        console.warn('⚠️ Attempt not found in results array. AttemptId:', attemptId);
        console.warn('📋 Available attemptIds:', resultsArray.map((r: any) => ({
          examAttemptId: r.examAttemptId || r.ExamAttemptId,
          attemptId: r.attemptId || r.AttemptId,
          id: r.id || r.Id
        })));
      }

      // If not found in my-results, check sessionStorage for recent submit
      console.log('🔍 Checking sessionStorage for recent submit...');
      const resultKey = `exam_result_${attemptId}`;
      const storedResult = sessionStorage.getItem(resultKey);

      if (storedResult) {
        console.log('💾 Found result in sessionStorage');
        const parsed = JSON.parse(storedResult);

        // Check if result is recent (within last 5 minutes)
        if (parsed.timestamp && (Date.now() - parsed.timestamp < 5 * 60 * 1000)) {
          console.log('✅ Using stored result (recent)');
          return parsed;
        }
      }

      // If still not found, return null (will use fallback mock data)
      console.warn('⚠️ No result found anywhere');
      throw new Error('Không tìm thấy kết quả bài thi');

    } catch (error: any) {
      console.error('❌ Error getting exam result:', error);

      // For development/demo purposes, return mock result if API fails
      if (error.response?.status === 400 || error.response?.status === 404 || error.response?.status === 500 || error.response?.status === 401) {
        console.warn('⚠️ Result API not available or returned 400, using fallback logic');

        // Try to get mock data from sessionStorage first (if submitted exam stored it)
        try {
          const mockResultKey = `mock_exam_result_${attemptId}`;
          const storedResult = sessionStorage.getItem(mockResultKey);
          if (storedResult) {
            console.log('📋 Found stored mock result in sessionStorage');
            return JSON.parse(storedResult);
          }
        } catch { }

        // Get actual submission data from sessionStorage for accurate calculation
        try {
          const submissionDataKey = `exam_submission_${attemptId}`;
          const storedSubmission = sessionStorage.getItem(submissionDataKey);
          console.log('📋 Looking for submission data with key:', submissionDataKey);
          console.log('📋 Found submission data:', storedSubmission);

          if (storedSubmission) {
            const submissionData = JSON.parse(storedSubmission);
            console.log('📊 Parsed submission data:', submissionData);

            const totalQuestions = submissionData.answers?.length || 7;
            const answeredQuestions = submissionData.answers?.filter((answer: any) =>
              answer.selectedOptionIds && answer.selectedOptionIds.length > 0
            ) || [];
            const correctAnswers = answeredQuestions.length; // For demo: assume answered = correct
            const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            const isPassed = score >= 70;

            console.log('📊 Calculated result from submission data:', {
              totalQuestions,
              answeredQuestions: answeredQuestions.length,
              correctAnswers,
              score,
              isPassed,
              submissionData: submissionData
            });

            // Try to get actual exam details from various sources
            let examTitle = submissionData.examTitle || 'Bài thi thử nghiệm';
            let examCategory = submissionData.examCategory || 'Cloud Computing';
            let examDifficulty = submissionData.examDifficulty || 'Beginner';
            let examDuration = submissionData.examDuration || '90 phút';
            let examPassingScore = submissionData.examPassingScore || 70;
            let examImage = submissionData.examImage || '/images/background.png';

            console.log('📋 Initial exam details from submission:', {
              examTitle, examCategory, examDifficulty, examDuration, examPassingScore, examImage
            });

            // Try to get exam info from sessionStorage (stored during exam start)
            try {
              const examInfoKey = `exam_info_${submissionData.examId}`;
              const storedExamInfo = sessionStorage.getItem(examInfoKey);
              console.log('📋 Looking for exam info with key:', examInfoKey);
              console.log('📋 Found exam info:', storedExamInfo);

              if (storedExamInfo) {
                const examInfo = JSON.parse(storedExamInfo);
                examTitle = examInfo.title || examTitle;
                examCategory = examInfo.category || examCategory;
                examDifficulty = examInfo.difficulty || examDifficulty;
                examDuration = examInfo.duration || examDuration;
                examPassingScore = examInfo.passingScore || examPassingScore;
                examImage = examInfo.image || examImage;
                console.log('📋 Updated exam info from sessionStorage:', examInfo);
              }
            } catch (examInfoError) {
              console.warn('⚠️ Could not get exam info from sessionStorage:', examInfoError);
            }

            console.log('📋 Final exam details:', {
              examTitle, examCategory, examDifficulty, examDuration, examPassingScore, examImage
            });

            return {
              examAttemptId: parseInt(String(attemptId), 10),
              examId: submissionData.examId || 1,
              examTitle: examTitle,
              examImage: examImage,
              examCategory: examCategory,
              examDifficulty: examDifficulty,
              examDuration: examDuration,
              examPassingScore: examPassingScore,
              percentage: score,
              score: correctAnswers,
              maxScore: totalQuestions,
              isPassed: isPassed,
              timeSpentMinutes: Math.floor((submissionData.timeSpent || 3600) / 60),
              correctAnswers: correctAnswers,
              totalQuestions: totalQuestions,
              answers: submissionData.answers || [],
              _mock: true,
              _calculated: true
            };
          } else {
            console.warn('⚠️ No submission data found for attempt:', attemptId);
          }
        } catch (calcError) {
          console.error('❌ Error calculating from submission data:', calcError);
        }

        // Return default mock result as final fallback
        return {
          examAttemptId: parseInt(String(attemptId), 10),
          examId: 1,
          examTitle: 'Bài thi',
          examImage: '/images/background.png',
          examCategory: 'Khác',
          examDifficulty: 'Cơ bản',
          examDuration: '90 phút',
          examPassingScore: 70,
          percentage: 0,
          score: 0,
          maxScore: 7,
          isPassed: false,
          timeSpentMinutes: 60,
          correctAnswers: 0,
          totalQuestions: 7,
          answers: [],
          _mock: true
        };
      }

      throw new Error(error.response?.data?.message || 'Không thể lấy kết quả bài thi');
    }
  }

  /**
   * Lấy danh sách kết quả bài thi của user
   * @returns Promise với danh sách kết quả
   */
  async getMyResults(): Promise<Array<IExamResult & { exam: IExam }>> {
    try {
      // Get userId from localStorage
      const userStr = localStorage.getItem('user_info');
      let userId: number | null = null;

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId || user.UserId || user.id;
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('📋 Fetching my exam results for userId:', userId);
      const response = await apiService.get<any>(
        EXAM_ENDPOINTS.MY_RESULTS(userId)
      );
      console.log('📊 My exam results response (full):', response);
      console.log('📊 Response type:', typeof response);
      console.log('📊 Is array?', Array.isArray(response));
      
      // Backend returns: { success: true, data: { userId, userName, results: [...], statistics: {...} } }
      // Or direct: { userId, userName, results: [...], statistics: {...} }
      const backendData = response?.success ? response.data : response;
      console.log('📊 Backend data:', backendData);
      console.log('📊 Backend data type:', typeof backendData);
      console.log('📊 Backend data keys:', backendData ? Object.keys(backendData) : 'null');
      
      // Extract results array
      let resultsArray: any[] = [];
      if (Array.isArray(backendData)) {
        resultsArray = backendData;
        console.log('✅ Backend data is array, using directly');
      } else if (backendData?.results && Array.isArray(backendData.results)) {
        resultsArray = backendData.results;
        console.log('✅ Found results in backendData.results');
      } else if (backendData?.Results && Array.isArray(backendData.Results)) {
        resultsArray = backendData.Results;
        console.log('✅ Found Results in backendData.Results');
      } else {
        console.warn('⚠️ Could not find results array in response:', {
          backendData,
          hasResults: !!backendData?.results,
          hasResultsPascal: !!backendData?.Results,
          isArray: Array.isArray(backendData)
        });
      }
      
      console.log(`✅ Found ${resultsArray.length} exam results`);
      
      // Map results to frontend format - USE SAME LOGIC AS getExamResult()
      const mappedResults = resultsArray.map((item: any) => {
        // Backend returns ExamResultDto, need to map to IExamResult & { exam: IExam }
        // Use same mapping logic as getExamResult() in useExamResult hook
        const score = Number(item.score || item.Score || 0);
        const maxScore = Number(item.maxScore || item.MaxScore || 0);
        const percentage = Number(item.percentage || item.Percentage || 0);
        
        // Calculate correctAnswers and totalQuestions from Score and MaxScore
        // Assuming each correct answer = 1 point
        const correctAnswers = Math.round(score);
        const totalQuestions = Math.round(maxScore) || correctAnswers; // Use maxScore as total, fallback to correctAnswers if 0
        
        // ✅ USE SAME LOGIC AS ExamResult component and useExamResult hook
        // ExamResult uses: resultData?.isPassed || (resultData?.percentage >= (exam.passingScore || 0))
        // But we need to get isPassed from backend first (same as useExamResult hook line 572)
        let isPassed = item.isPassed || item.IsPassed || item.passed || item.Passed || false;
        isPassed = Boolean(isPassed);
        
        // ✅ CRITICAL VALIDATION: Ensure isPassed matches actual score
        // Backend logic: isPassed = Score >= PassingMark (absolute score comparison)
        // If score is 0, isPassed must be false
        if (score === 0) {
          isPassed = false;
          console.log('🔴 Score is 0, forcing isPassed = false', { 
            attemptId: item.examAttemptId || item.ExamAttemptId,
            originalIsPassed: item.IsPassed || item.isPassed 
          });
        }
        
        // Note: We don't have passingMark in ExamResultDto, so we trust backend's IsPassed
        // But we validate that score = 0 means failed
        
        return {
          examAttemptId: item.examAttemptId || item.ExamAttemptId || item.id,
          examId: item.examId || item.ExamId,
          examTitle: item.examTitle || item.ExamTitle || '',
          score: score,
          maxScore: maxScore,
          percentage: percentage,
          isPassed: isPassed,
          passed: isPassed, // Alias for compatibility
          timeSpent: (item.timeSpentMinutes || item.TimeSpentMinutes || 0) * 60, // Convert to seconds
          timeSpentMinutes: item.timeSpentMinutes || item.TimeSpentMinutes || 0,
          correctAnswers: item.correctAnswers || item.CorrectAnswers || correctAnswers,
          totalQuestions: item.totalQuestions || item.TotalQuestions || totalQuestions,
          submittedAt: item.submittedAt || item.SubmittedAt,
          startTime: item.startTime || item.StartTime,
          attemptNumber: item.attemptNumber || item.AttemptNumber || 1,
          exam: {
            id: item.examId || item.ExamId,
            title: item.examTitle || item.ExamTitle || '',
            category: item.subjectName || item.SubjectName || item.courseName || item.CourseName || '',
            difficulty: 'Cơ bản',
            price: 0,
            passingScore: 0, // ExamResultDto doesn't include passingMark, set to 0
            image: '/images/background.png',
          }
        };
      });
      
      return mappedResults;
    } catch (error) {
      console.error('❌ Error fetching my exam results:', error);
      // Return empty array instead of mock data - let the UI handle the empty state
      console.warn('⚠️ No exam results available - returning empty array');
      return [];
    }
  }

  /**
   * Lấy câu hỏi của bài thi
   * @param examId - ID của bài thi
   * @returns Promise với danh sách câu hỏi
   */
  async getExamQuestions(examId: string | number): Promise<any[]> {
    try {
      const response = await apiClient.get(EXAM_ENDPOINTS.GET_BY_ID(examId));
      const payload = response?.data;
      const hasSuccess = (payload && (payload.success === true || payload.Success === true));
      const backendData: any = hasSuccess ? (payload?.data ?? payload?.Data) : (payload?.data ?? payload?.Data ?? payload);
      const questions = backendData?.questions ?? backendData?.Questions ?? [];
      if (Array.isArray(questions)) {
        return questions.map((q: any) => ({
          examQuestionId: q.examQuestionId ?? q.ExamQuestionId ?? undefined,
          questionId: q.questionId ?? q.QuestionId,
          content: q.content ?? q.Content ?? '',
          questionType: q.questionType ?? q.QuestionType ?? '',
          difficulty: q.difficulty ?? q.Difficulty ?? '',
          marks: q.marks ?? q.Marks ?? 0,
          sequenceIndex: q.sequenceIndex ?? q.SequenceIndex ?? undefined,
          answerOptions: (q.options ?? q.Options ?? []).map((ao: any) => ({
            optionId: ao.optionId ?? ao.OptionId,
            content: ao.content ?? ao.Content ?? '',
            isCorrect: ao.isCorrect ?? ao.IsCorrect ?? false,
            orderIndex: ao.sequenceIndex ?? ao.SequenceIndex ?? ao.orderIndex ?? ao.OrderIndex ?? undefined,
          })),
        }));
      }
      throw new Error('Invalid exam questions response');
    } catch (error: any) {
      console.error('❌ Error fetching exam questions:', error);
      throw new Error(error.response?.data?.message || 'Không thể lấy câu hỏi bài thi');
    }
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
   * Tải chứng chỉ hoàn thành bài thi
   * @param userId - User ID
   * @param examId - Exam ID
   * @param examResultData - Optional: Exam result data to use if API fails
   * @returns Promise với file chứng chỉ (blob)
   */
  async downloadExamCertificate(userId: number, examId: number, examResultData?: any): Promise<void> {
    // Declare variables in outer scope so they're accessible throughout the function
    let certificateInfo: any = null;
    let backendData: any = null;
    
    try {
      console.log('📜 Downloading exam certificate:', { userId, examId });

      // Get auth token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Vui lòng đăng nhập để tải chứng chỉ');
      }

      // First, try to get certificate info (JSON response)
      try {
        const infoResponse = await apiClient.get(`/Exams/certificates/${userId}/${examId}`);
        console.log('📥 Certificate info response:', infoResponse.data);

        backendData = infoResponse.data?.success ? infoResponse.data.data : infoResponse.data;
        certificateInfo = backendData?.Certificate || backendData?.certificate || backendData;

        // Check if eligible
        if (backendData?.IsEligible === false || backendData?.isEligible === false) {
          const message = backendData?.Message || backendData?.message || 'Không đủ điều kiện để tải chứng chỉ';
          throw new Error(message);
        }

        // If there's a download URL, use it
        const downloadUrl = certificateInfo?.DownloadUrl || certificateInfo?.downloadUrl;
        if (downloadUrl) {
          console.log('📥 Found download URL:', downloadUrl);
          
          try {
            // Handle relative URLs - prepend base URL if needed
            let fullUrl = downloadUrl;
            if (downloadUrl.startsWith('/')) {
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
              fullUrl = `${apiBaseUrl}${downloadUrl}`;
              console.log('📥 Converted relative URL to full URL:', fullUrl);
            }
            
            // Download file from URL
            const fileResponse = await apiClient.get(fullUrl, {
              responseType: 'blob',
            });

            console.log('✅ Certificate file response received:', {
              size: fileResponse.data?.size,
              type: fileResponse.data?.type,
              headers: fileResponse.headers
            });

            // Validate that response is actually a PDF
            if (fileResponse.data instanceof Blob) {
              // Check if blob is too small (likely JSON error)
              if (fileResponse.data.size < 100) {
                const text = await fileResponse.data.text();
                try {
                  const jsonData = JSON.parse(text);
                  if (jsonData.message || jsonData.Message || jsonData.error) {
                    throw new Error(jsonData.message || jsonData.Message || jsonData.error || 'Không thể tải chứng chỉ');
                  }
                } catch (parseError) {
                  // Not JSON, but too small to be PDF
                  throw new Error('File tải về không hợp lệ (quá nhỏ)');
                }
              }

              // Validate PDF by checking magic bytes
              const arrayBuffer = await fileResponse.data.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              const pdfMagicBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF
              const isPDF = uint8Array.length >= 4 && 
                           uint8Array[0] === pdfMagicBytes[0] &&
                           uint8Array[1] === pdfMagicBytes[1] &&
                           uint8Array[2] === pdfMagicBytes[2] &&
                           uint8Array[3] === pdfMagicBytes[3];

              if (!isPDF) {
                // Try to parse as JSON to get error message
                const text = new TextDecoder().decode(uint8Array.slice(0, 1000));
                try {
                  const jsonData = JSON.parse(text);
                  if (jsonData.message || jsonData.Message) {
                    throw new Error(jsonData.message || jsonData.Message);
                  }
                } catch {
                  throw new Error('File tải về không phải là PDF hợp lệ. Backend có thể chưa implement chức năng tạo PDF.');
                }
              }

              // Create blob and download
              const blob = new Blob([arrayBuffer], { 
                type: 'application/pdf' 
              });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              
              // Generate filename from certificate info or default
              const certificateId = certificateInfo?.CertificateId || certificateInfo?.certificateId || `CERT-${examId}-${userId}`;
              const examTitle = certificateInfo?.ExamTitle || certificateInfo?.examTitle || `bai-thi-${examId}`;
              const filename = `${certificateId}-${examTitle.replace(/\s+/g, '-')}.pdf`;
              link.download = filename;
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);

              console.log('✅ Certificate downloaded successfully from URL');
              return;
            } else {
              throw new Error('Response không phải là file PDF');
            }
          } catch (urlError: any) {
            console.error('❌ Error downloading from URL:', urlError);
            // If download URL fails, fall through to show error or try alternative
            throw new Error(urlError.message || 'Không thể tải file từ URL được cung cấp');
          }
        }
      } catch (infoError: any) {
        // If info endpoint returns error, check if it's an eligibility error
        console.log('⚠️ Info endpoint error:', infoError);
        
        if (infoError.response?.data?.data?.IsEligible === false || 
            infoError.response?.data?.data?.isEligible === false) {
          const message = infoError.response?.data?.data?.Message || 
                         infoError.response?.data?.data?.message || 
                         'Không đủ điều kiện để tải chứng chỉ';
          throw new Error(message);
        }
        
        // If other error, try to get certificate info from error response
        const errorBackendData = infoError.response?.data?.success 
          ? infoError.response.data.data 
          : infoError.response?.data;
        if (errorBackendData) {
          backendData = errorBackendData;
          certificateInfo = errorBackendData?.Certificate || errorBackendData?.certificate || errorBackendData;
        }
      }

      // If no download URL, generate PDF on frontend using certificate info
      if (!certificateInfo && backendData) {
        certificateInfo = backendData?.Certificate || backendData?.certificate || backendData;
      }
      
      if (!certificateInfo) {
        // Try direct blob download as last resort
        console.log('📥 Trying direct blob download as fallback...');
        try {
          const response = await apiClient.get(
            `/Exams/certificates/${userId}/${examId}`,
            { responseType: 'blob' }
          );
          
          // Validate PDF
          if (response.data instanceof Blob && response.data.size > 100) {
            const arrayBuffer = await response.data.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const pdfMagicBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF
            const isPDF = uint8Array.length >= 4 && 
                         uint8Array[0] === pdfMagicBytes[0] &&
                         uint8Array[1] === pdfMagicBytes[1] &&
                         uint8Array[2] === pdfMagicBytes[2] &&
                         uint8Array[3] === pdfMagicBytes[3];
            
            if (isPDF) {
              const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `chung-chi-${examId}-${userId}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              console.log('✅ Certificate downloaded successfully');
              return;
            }
          }
        } catch (blobError) {
          console.log('⚠️ Direct blob download also failed:', blobError);
        }
        
        // If still no certificate info, try to use examResultData if provided
        if (examResultData) {
          console.log('📄 Using exam result data to create certificate...');
          const userStr = localStorage.getItem('user_info');
          let userName = 'Người dùng';
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              userName = user.fullName || user.FullName || user.name || user.Name || user.email || user.Email || userName;
            } catch (e) {
              console.warn('Failed to parse user info for certificate');
            }
          }
          
          certificateInfo = {
            CertificateId: `CERT-${examId}-${userId}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
            ExamId: examId,
            UserId: userId,
            ExamTitle: examResultData.examTitle || examResultData.title || `Bài thi ${examId}`,
            UserName: userName,
            Score: examResultData.score || examResultData.Score || 0,
            MaxScore: examResultData.maxScore || examResultData.MaxScore || 0,
            Percentage: examResultData.percentage || examResultData.Percentage || 0,
            CompletedAt: examResultData.submittedAt || examResultData.SubmittedAt || new Date(),
            IssuedAt: new Date()
          };
        } else {
          // Create a minimal certificate with available data
          console.log('📄 No certificate info from API, creating PDF with minimal data...');
          const userStr = localStorage.getItem('user_info');
          let userName = 'Người dùng';
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              userName = user.fullName || user.FullName || user.name || user.Name || user.email || user.Email || userName;
            } catch (e) {
              console.warn('Failed to parse user info for certificate');
            }
          }
          
          certificateInfo = {
            CertificateId: `CERT-${examId}-${userId}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
            ExamId: examId,
            UserId: userId,
            ExamTitle: `Bài thi ${examId}`,
            UserName: userName,
            Score: 0,
            MaxScore: 0,
            Percentage: 0,
            CompletedAt: new Date(),
            IssuedAt: new Date()
          };
        }
      }
      
      console.log('📄 Generating PDF on frontend with certificate info:', certificateInfo);
      
      // Use pdfmake for better Unicode/Vietnamese support
      const pdfMake = await import('pdfmake/build/pdfmake');
      
      // Try to load vfs_fonts if available
      try {
        const vfsFonts = await import('pdfmake/build/vfs_fonts');
        if (vfsFonts && pdfMake.default) {
          pdfMake.default.vfs = vfsFonts.default || vfsFonts;
        }
      } catch (e) {
        // vfs_fonts not available, pdfmake will use default fonts
        console.log('Using pdfmake default fonts (Roboto supports Vietnamese)');
      }
      
      // Prepare data - Always get userName from localStorage first (most accurate)
      const certId = certificateInfo.CertificateId || certificateInfo.certificateId || `CERT-${examId}-${userId}`;
      
      // Get userName from localStorage (most reliable source)
      let userName = 'Người dùng';
      const userStr = localStorage.getItem('user_info');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userName = user.fullName || user.FullName || user.name || user.Name || user.userName || user.UserName || user.email || user.Email || userName;
          console.log('📝 User name from localStorage:', userName);
        } catch (e) {
          console.warn('Failed to parse user info from localStorage:', e);
        }
      }
      
      // Fallback to certificateInfo only if localStorage doesn't have it
      if (!userName || userName === 'Người dùng') {
        userName = certificateInfo.UserName || certificateInfo.userName || userName;
        console.log('📝 User name from certificateInfo (fallback):', userName);
      }
      
      const examTitle = certificateInfo.ExamTitle || certificateInfo.examTitle || 'Bài thi';
      const score = certificateInfo.Score || certificateInfo.score || 0;
      const maxScore = certificateInfo.MaxScore || certificateInfo.maxScore || 0;
      const percentage = certificateInfo.Percentage || certificateInfo.percentage || 0;
      
      const completedDate = certificateInfo.CompletedAt || certificateInfo.completedAt;
      const dateStr = completedDate 
        ? new Date(completedDate).toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : new Date().toLocaleDateString('vi-VN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
      
      // Load certificate template image as base64
      let certificateImage: string | null = null;
      try {
        // Try to fetch the image and convert to base64
        const imageUrl = '/images/certificate-template.png';
        const response = await fetch(imageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          certificateImage = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.warn('Could not load certificate template image, using design without image:', e);
      }
      
      // Create PDF document definition with template image
      const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait', // Template is portrait
        pageMargins: [0, 0, 0, 0], // No margins to use full page for image
        defaultStyle: {
          font: 'Roboto',
          fontSize: 12,
        },
        background: certificateImage ? [
          {
            image: certificateImage,
            width: 595.28, // A4 width in points
            height: 841.89, // A4 height in points
            absolutePosition: { x: 0, y: 0 },
          }
        ] : undefined,
        content: [
          // Certificate template image as background (if loaded)
          ...(certificateImage ? [] : [
            // Fallback: Simple design if image not available
            {
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 595.28,
                  h: 841.89,
                  color: '#ffffff',
                  fillOpacity: 1,
                },
              ],
            },
          ]),
          
          // Name of recipient - positioned in the center area below "This certificate is proudly presented to:"
          // Using elegant script-like style
          {
            text: userName,
            fontSize: 42,
            bold: true,
            italics: true, // Create elegant script-like effect
            color: '#1e40af', // Dark blue matching template
            alignment: 'center',
            absolutePosition: { x: 0, y: 420 }, // Center area of template
            width: 495.28, // A4 width minus margins
            margin: [50, 0, 50, 0],
            font: 'Roboto', // Will use italic + bold for elegant look
          },
          
          // Congratulatory message - below name with serif-like font
          {
            text: `Chúc mừng bạn đã hoàn thành xuất sắc bài thi "${examTitle}" với điểm số ${score}/${maxScore} (${percentage.toFixed(1)}%).\nChứng chỉ này công nhận sự nỗ lực và thành tích của bạn trong việc học tập và rèn luyện.`,
            fontSize: 14,
            color: '#1e293b',
            alignment: 'center',
            absolutePosition: { x: 0, y: 480 }, // Below name
            width: 495.28,
            margin: [50, 0, 50, 0],
            lineHeight: 1.6,
            font: 'Roboto', // Using Roboto but with normal weight for serif-like readability
          },
          
          // Exam title - positioned below congratulatory message (smaller, as secondary info)
          {
            text: examTitle,
            fontSize: 20,
            bold: true,
            color: '#059669', // Green matching template
            alignment: 'center',
            absolutePosition: { x: 0, y: 550 }, // Below congratulatory message
            width: 495.28,
            margin: [50, 0, 50, 0],
          },
          
          // Date issued - near bottom
          {
            text: `Ngày cấp: ${dateStr}`,
            fontSize: 14,
            color: '#64748b',
            alignment: 'center',
            absolutePosition: { x: 0, y: 600 }, // Near bottom
            width: 495.28,
            margin: [50, 0, 50, 0],
          },
          
          // Certificate ID (small, bottom left)
          {
            text: `Mã: ${certId}`,
            fontSize: 9,
            color: '#94a3b8',
            absolutePosition: { x: 50, y: 800 }, // Bottom left corner
          },
        ],
      };
      
      // Generate PDF
      const pdfDocGenerator = pdfMake.default.createPdf(docDefinition);
      
      // Generate filename
      const certificateId = certificateInfo.CertificateId || certificateInfo.certificateId || `CERT-${examId}-${userId}`;
      const examTitleForFile = (certificateInfo.ExamTitle || certificateInfo.examTitle || `bai-thi-${examId}`)
        .replace(/\s+/g, '-')
        .toLowerCase();
      const filename = `${certificateId}-${examTitleForFile}.pdf`;
      
      // Download PDF
      pdfDocGenerator.download(filename);
      
      console.log('✅ Certificate PDF generated successfully');
      return;
    } catch (error: any) {
      console.error('❌ Error downloading certificate:', error);
      
      // Handle specific error messages
      if (error.response?.data) {
        // Try to parse error message from response
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const jsonData = JSON.parse(text);
            const message = jsonData.message || jsonData.Message || jsonData.data?.message || jsonData.data?.Message;
            if (message) {
              throw new Error(message);
            }
          } catch (parseError) {
            // Not JSON or parse failed, continue with default error
            console.log('⚠️ Could not parse error response as JSON');
          }
        } else if (error.response.data.message || error.response.data.Message) {
          throw new Error(error.response.data.message || error.response.data.Message);
        } else if (error.response.data.data?.message || error.response.data.data?.Message) {
          throw new Error(error.response.data.data.message || error.response.data.data.Message);
        }
      }
      
      const errorMessage = error.message || 'Không thể tải chứng chỉ';
      throw new Error(errorMessage);
    }
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

