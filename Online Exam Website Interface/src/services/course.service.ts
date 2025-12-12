/**
 * Course Service
 * Xử lý tất cả các chức năng liên quan đến khóa học và tài liệu học tập
 */

import apiClient, { apiService } from './api.service';
import { COURSE_ENDPOINTS, LESSON_ENDPOINTS } from '@/constants/endpoints';
import { SUCCESS_MESSAGES } from '@/constants';
import type {
  ICourse,
  ILesson,
  ICourseReview,
  ICourseProgress,
  ILessonNote,
  IGetCoursesRequest,
  IGetCoursesResponse,
  IEnrollCourseResponse,
} from '@/types';

// ==================== MOCK DATA ====================

const mockCourse: ICourse = {
  id: 1,
  title: 'Lập Trình Full-Stack',
  subtitle: 'JavaScript, React, Node.js',
  description: 'Khóa học toàn diện về phát triển web từ cơ bản đến nâng cao',
  image: '/images/background.png',
  category: 'programming',
  lessons: 45,
  duration: '120 giờ',
  level: 'Cơ bản đến nâng cao',
  price: 1200000,
  rating: 4.8,
  students: 15420,
  instructor: 'Nguyễn Văn Tuấn',
  features: ['Video HD', 'Tài liệu PDF', 'Dự án thực tế', 'Hỗ trợ 24/7'],
};

const mockCourses: ICourse[] = Array.from({ length: 10 }, (_, i) => ({
  ...mockCourse,
  id: i + 1,
  title: `Khóa học ${i + 1}`,
}));

const mockLesson: ILesson = {
  id: 1,
  title: 'Giới thiệu khóa học',
  duration: '15:30',
  type: 'video',
  completed: false,
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  transcript: 'Nội dung transcript...',
  materials: [
    { name: 'Slide bài giảng', type: 'pdf', size: '2.5 MB' },
    { name: 'Source code', type: 'zip', size: '1.2 MB' },
  ],
};

// ==================== COURSE SERVICE ====================

class CourseService {
  /**
   * Lấy danh sách tất cả khóa học
   * @param params - Filter và pagination params
   * @returns Promise với danh sách khóa học
   */
  async getAllCourses(params?: IGetCoursesRequest): Promise<IGetCoursesResponse> {
    try {
      // Map frontend params sang backend params
      const backendParams: any = {
        pageIndex: params?.page || 1,
        pageSize: params?.limit || 10,
      };

      if (params?.search) {
        backendParams.search = params.search;
      }

      if (params?.category) {
        // Map category sang subjectId nếu cần
        // Tạm thời dùng search
        backendParams.search = params.category;
      }

      const response = await apiService.get<any>(
        '/Courses', // Backend endpoint
        { params: backendParams }
      );

      console.log('📦 Courses API Response (raw):', response);

      // Backend trả về: ApiResponse { Success, Message, Data: { Items, Total, PageIndex, PageSize, TotalPages, HasPreviousPage, HasNextPage } }
      // apiService.get có thể đã unwrap response.data, nên response có thể là:
      // 1. ApiResponse object: { Success, Message, Data: PagedResponse }
      // 2. PagedResponse trực tiếp: { Items, Total, ... }
      // 3. Hoặc đã unwrap Data: PagedResponse

      let backendData: any = null;

      // Case 1: Response là ApiResponse với Data property
      if (response && typeof response === 'object') {
        if (response.Data) {
          backendData = response.Data;
        } else if (response.data) {
          backendData = response.data;
        }
        // Case 2: Response trực tiếp là PagedResponse (Items hoặc items)
        else if (response.Items || response.items) {
          backendData = response;
        }
      }

      console.log('📦 Parsed backendData:', backendData);

      if (backendData && (backendData.Items || backendData.items)) {
        // Map backend format sang frontend format
        const items = backendData.Items || backendData.items || [];
        console.log('📦 Courses items:', items);

        const courses: ICourse[] = items.map((item: any) => {
          // ✅ Get actual data from API if available
          const lessonCount = item.LessonCount || item.lessonCount || item.LessonsCount || item.lessonsCount || 0;
          const rating = item.Rating || item.rating || item.AverageRating || item.averageRating || 0;
          const studentCount = item.StudentCount || item.studentCount || item.EnrollmentCount || item.enrollmentCount || item.StudentsCount || item.studentsCount || 0;

          return {
            id: item.CourseId || item.courseId,
            title: item.Title || item.title,
            subtitle: item.SubjectName || item.subjectName || item.Level || item.level || '',
            description: item.Description || item.description || '',
            image: item.ThumbnailUrl || item.thumbnailUrl || '/images/background.png',
            category: item.SubjectName?.toLowerCase().replace(/\s+/g, '-') || 'all',
            lessons: lessonCount, // ✅ Use actual lesson count from API
            duration: item.DurationMinutes
              ? `${Math.floor(item.DurationMinutes / 60)} giờ ${item.DurationMinutes % 60 > 0 ? `${item.DurationMinutes % 60} phút` : ''}`.trim()
              : 'N/A',
            level: item.Level || item.level || 'Cơ bản',
            price: item.Price || item.price || 0,
            originalPrice: undefined,
            rating: rating, // ✅ Use actual rating from API
            students: studentCount, // ✅ Use actual student count from API
            instructor: item.TeacherName || item.teacherName || 'N/A',
            features: [],
          };
        });

        return {
          success: true,
          data: courses,
          pagination: {
            page: backendData.PageIndex || backendData.pageIndex || 1,
            limit: backendData.PageSize || backendData.pageSize || 10,
            total: backendData.Total || backendData.total || 0,
            totalPages: backendData.TotalPages || backendData.totalPages || 1,
            hasNext: backendData.HasNextPage || backendData.hasNextPage || false,
            hasPrev: backendData.HasPreviousPage || backendData.hasPreviousPage || false,
          },
          message: 'Success',
        };
      }

      throw new Error('Invalid course list response');
    } catch (error) {
      console.error('Error fetching courses from API:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết khóa học theo ID
   * @param id - ID của khóa học
   * @returns Promise với thông tin khóa học
   */
  async getCourseById(id: string | number): Promise<ICourse> {
    try {
      const response = await apiService.get<any>(
        `/Courses/${id}` // Backend endpoint
      );

      console.log('📦 getCourseById - Raw API response:', response);
      console.log('📦 getCourseById - Response type:', typeof response);
      console.log('📦 getCourseById - Response keys:', response ? Object.keys(response) : 'null');

      // Backend trả về: ApiResponse { Success, Message, Data: CourseListItemDto }
      // Hoặc có thể là: { success: true, data: { ... } }
      // Hoặc trực tiếp: { CourseId, Title, ... }
      let backendData: any = null;

      // Try multiple formats
      if (response && typeof response === 'object') {
        // Format 1: { Data: {...} } hoặc { data: {...} }
        if (response.Data) {
          backendData = response.Data;
          console.log('📦 Using response.Data');
        } else if (response.data) {
          backendData = response.data;
          console.log('📦 Using response.data');
        }
        // Format 2: Response trực tiếp là course object (có CourseId hoặc courseId)
        else if (response.CourseId || response.courseId) {
          backendData = response;
          console.log('📦 Using response directly (has CourseId)');
        }
        // Format 3: { success: true, data: {...} }
        else if (response.success && response.data) {
          backendData = response.data;
          console.log('📦 Using response.success.data');
        }
      }

      console.log('📦 getCourseById - Extracted backendData:', backendData);
      console.log('📦 getCourseById - backendData keys:', backendData ? Object.keys(backendData) : 'null');

      if (backendData) {
        // Map backend format sang frontend format
        const course: ICourse = {
          id: backendData.CourseId || backendData.courseId,
          title: backendData.Title || backendData.title,
          subtitle: backendData.SubjectName || backendData.subjectName || backendData.Level || backendData.level || '',
          description: backendData.Description || backendData.description || '',
          image: backendData.ThumbnailUrl || backendData.thumbnailUrl || '/images/background.png',
          category: backendData.SubjectName?.toLowerCase().replace(/\s+/g, '-') || 'all',
          lessons: 0, // Sẽ lấy từ materials count sau
          duration: backendData.DurationMinutes
            ? `${Math.floor(backendData.DurationMinutes / 60)} giờ ${backendData.DurationMinutes % 60 > 0 ? `${backendData.DurationMinutes % 60} phút` : ''}`.trim()
            : 'N/A',
          level: backendData.Level || backendData.level || 'Cơ bản',
          price: backendData.Price || backendData.price || 0,
          originalPrice: undefined,
          rating: backendData.Rating || backendData.rating || 0, // Get from API or default to 0
          students: backendData.StudentCount || backendData.studentCount || backendData.EnrollmentCount || backendData.enrollmentCount || 0, // Get from API or default to 0
          instructor: backendData.TeacherName || backendData.teacherName || 'N/A',
          features: [],
        };

        return course;
      }

      throw new Error('Invalid course detail response');
    } catch (error) {
      console.error('Error fetching course detail from API:', error);
      throw error;
    }
  }

  /**
   * Đăng ký khóa học
   * @param courseId - ID của khóa học
   * @returns Promise với thông tin enrollment
   */
  async enrollCourse(courseId: string | number): Promise<IEnrollCourseResponse> {
    try {
      console.log('📤 Enrolling course:', courseId);
      const response = await apiService.post<any>(
        COURSE_ENDPOINTS.ENROLL(courseId),
        {} // Empty body, backend will get userId from JWT token
      );

      console.log('✅ Course enrolled successfully:', response);

      // Parse response từ backend
      const data = (response as any).Data || (response as any).data || response;

      // Backend trả về: { enrollmentId, courseId, userId, status, enrolledAt }
      const courseIdNum = typeof courseId === 'string' ? parseInt(courseId) : courseId;
      return {
        enrollment: {
          id: String(data.enrollmentId || data.enrollment?.enrollmentId || `enroll-${Date.now()}`),
          courseId: data.courseId || courseIdNum,
          userId: data.userId || data.enrollment?.userId || 0,
          enrolledAt: data.enrolledAt || data.enrollment?.enrolledAt || new Date().toISOString(),
          status: data.status || data.enrollment?.status || 'active',
        },
        message: data.message || SUCCESS_MESSAGES.COURSE_ENROLLED,
      };
    } catch (error: any) {
      console.error('❌ Error enrolling course:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi đăng ký khóa học';
      throw new Error(errorMessage);
    }
  }

  async createCoursePayOSLink(
    courseId: string | number,
    description?: string,
    returnUrl?: string,
    cancelUrl?: string,
    buyer?: { name?: string; email?: string; phone?: string; address?: string },
    items?: { name: string; quantity: number; price: number; unit?: string; taxPercentage?: number }[],
    expiredAt?: number
  ): Promise<any> {
    try {
      const payload: any = {
        description: description || `Thanh toán khóa học ${courseId}`,
        returnUrl,
        cancelUrl,
        buyerName: buyer?.name,
        buyerEmail: buyer?.email,
        buyerPhone: buyer?.phone,
        buyerAddress: buyer?.address,
        items,
        expiredAt,
      };
      const response = await apiClient.post(COURSE_ENDPOINTS.PAYOS.CREATE_LINK(courseId), payload);
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể tạo liên kết thanh toán PayOS cho khóa học';
      throw new Error(msg);
    }
  }

  async getPayOSOrder(orderCode: string | number): Promise<any> {
    try {
      const response = await apiClient.get(COURSE_ENDPOINTS.PAYOS.GET_ORDER(orderCode));
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể kiểm tra trạng thái đơn PayOS của khóa học';
      throw new Error(msg);
    }
  }

  async cancelPayOSOrder(orderCode: string | number, cancellationReason?: string): Promise<any> {
    try {
      const response = await apiClient.post(`/Courses/payos/order/${orderCode}/cancel`, { cancellationReason });
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể huỷ link thanh toán PayOS của khóa học';
      throw new Error(msg);
    }
  }

  /**
   * Hoàn thành khóa học
   * @param courseId - ID của khóa học
   * @returns Promise với message
   */
  async completeCourse(courseId: string | number): Promise<{ message: string }> {
    try {
      console.log('📤 Completing course:', courseId);
      const response = await apiService.post<any>(
        `/Courses/${courseId}/complete`,
        {}
      );
      console.log('✅ Course completed successfully:', response);

      const data = (response as any).Data || (response as any).data || response;
      return {
        message: data.message || 'Chúc mừng bạn đã hoàn thành khóa học!',
      };
    } catch (error: any) {
      console.error('Error completing course:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi hoàn thành khóa học';
      throw new Error(errorMessage);
    }
  }

  /**
   * Hủy đăng ký khóa học
   * @param courseId - ID của khóa học
   * @returns Promise với message
   */
  async unenrollCourse(courseId: string | number): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   COURSE_ENDPOINTS.UNENROLL(courseId)
    // );

    // Mock response
    return Promise.resolve({
      message: 'Đã hủy đăng ký khóa học',
    });
  }

  /**
   * Lấy khóa học đã đăng ký
   * @returns Promise với danh sách khóa học
   */
  async getMyCourses(): Promise<ICourse[]> {
    try {
      const response = await apiService.get<any>(
        '/Courses/my-courses'
      );

      const data = (response as any).Data || (response as any).data || response;
      const courses = Array.isArray(data) ? data : [];

      // Map backend format sang frontend format
      return courses.map((course: any) => ({
        id: course.courseId || course.id,
        title: course.title || course.Title || '',
        subtitle: course.subjectName || course.SubjectName || '',
        description: course.description || course.Description || '',
        image: course.thumbnailUrl || course.ThumbnailUrl || '/images/background.png',
        category: 'all',
        lessons: 0,
        duration: course.durationMinutes ? `${Math.floor(course.durationMinutes / 60)} giờ ${course.durationMinutes % 60} phút` : 'N/A',
        rating: 0,
        students: 0,
        price: course.price || course.Price || 0,
        isFree: course.isFree ?? course.IsFree ?? true,
        instructor: course.teacherName || course.TeacherName || '',
        features: [],
        level: course.level || course.Level || 'Beginner',
        isEnrolled: true,
        enrollmentStatus: course.status || course.Status || 'Active',
        isCompleted: (course.status || course.Status) === 'Completed',
      }));
    } catch (error: any) {
      console.error('Error loading my courses:', error);
      return [];
    }
  }

  /**
   * Kiểm tra enrollment status và completion status
   * @param courseId - ID của khóa học
   * @returns Promise với enrollment info
   */
  async getEnrollmentStatus(courseId: string | number): Promise<{ isEnrolled: boolean; isCompleted: boolean }> {
    try {
      const response = await apiService.get<any>(
        `/Courses/${courseId}/enrollment-status`
      );

      const data = (response as any).Data || (response as any).data || response;

      return {
        isEnrolled: data.isEnrolled || false,
        isCompleted: data.isCompleted || false,
      };
    } catch (error: any) {
      console.error('Error checking enrollment status:', error);
      // Fallback: thử dùng getMyCourses nếu endpoint mới không có
      try {
        const myCourses = await this.getMyCourses();
        const courseIdNum = typeof courseId === 'string' ? parseInt(courseId) : courseId;
        const enrolledCourse = myCourses.find(c => {
          const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id;
          return cId === courseIdNum;
        });

        return {
          isEnrolled: !!enrolledCourse,
          isCompleted: enrolledCourse?.isCompleted || false,
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return { isEnrolled: false, isCompleted: false };
      }
    }
  }

  /**
   * Lấy tiến độ học tập
   * @param courseId - ID của khóa học
   * @returns Promise với tiến độ
   */
  async getCourseProgress(courseId: string | number): Promise<ICourseProgress> {
    try {
      const response = await apiClient.get(`/Courses/${courseId}/learning-progress`);
      const data = response.data?.data || response.data?.Data || response.data;

      console.log('📊 getCourseProgress API response:', { courseId, data, response: response.data });

      return {
        courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
        currentLesson: data.lastLessonId || 0,
        completedLessons: Array.from({ length: data.completedLessons || 0 }, (_, i) => i + 1),
        totalLessons: data.totalLessons || 0,
        progressPercentage: data.progressPercent || 0,
        lastAccessedAt: data.lastAccessedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Could not get course progress (user may not be enrolled):', error);
      // Return default progress if not enrolled or error
      return {
        courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
        currentLesson: 0,
        completedLessons: [],
        totalLessons: 0,
        progressPercentage: 0,
        lastAccessedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Cập nhật tiến độ học tập
   * @param courseId - ID của khóa học
   * @param lessonId - ID của bài học
   * @param progressPercent - Phần trăm hoàn thành (optional)
   * @returns Promise với tiến độ mới
   */
  async updateCourseProgress(
    courseId: string | number,
    lessonId: string | number,
    progressPercent?: number
  ): Promise<ICourseProgress> {
    try {
      const response = await apiClient.post(`/Courses/${courseId}/save-progress`, {
        lessonId: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
        progressPercent: progressPercent
      });

      const data = response.data?.data || response.data?.Data || response.data;
      console.log('✅ Progress saved:', data);

      return {
        courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
        currentLesson: data.lastLessonId || (typeof lessonId === 'string' ? parseInt(lessonId) : lessonId),
        completedLessons: [],
        totalLessons: 0,
        progressPercentage: data.progressPercent || 0,
        lastAccessedAt: data.lastAccessedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error saving progress:', error);
      // Return current state if error
      return {
        courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
        currentLesson: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
        completedLessons: [],
        totalLessons: 0,
        progressPercentage: 0,
        lastAccessedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Lấy danh sách bài học
   * @param courseId - ID của khóa học
   * @returns Promise với danh sách bài học
   */
  async getCourseLessons(courseId: string | number): Promise<ILesson[]> {
    try {
      console.log('📚 Fetching lessons for courseId:', courseId);
      const response = await apiService.get<any>(
        `/Lessons/by-course/${courseId}`
      );

      console.log('📥 Raw lessons response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Is array?', Array.isArray(response));

      // Parse response từ backend - có thể là ApiResponse hoặc array trực tiếp
      let lessons: any[] = [];

      // Case 1: Response là array trực tiếp
      if (Array.isArray(response)) {
        lessons = response;
        console.log('✅ Response is direct array, length:', lessons.length);
      }
      // Case 2: Response có structure { Data: {...}, data: {...}, ... }
      else if (response && typeof response === 'object') {
        // Try Data first (PascalCase)
        if (response.Data) {
          if (Array.isArray(response.Data)) {
            lessons = response.Data;
            console.log('✅ Found lessons in response.Data, length:', lessons.length);
          } else if (response.Data.data && Array.isArray(response.Data.data)) {
            lessons = response.Data.data;
            console.log('✅ Found lessons in response.Data.data, length:', lessons.length);
          } else if (response.Data.items && Array.isArray(response.Data.items)) {
            lessons = response.Data.items;
            console.log('✅ Found lessons in response.Data.items, length:', lessons.length);
          }
        }
        // Try data (camelCase)
        else if (response.data) {
          if (Array.isArray(response.data)) {
            lessons = response.data;
            console.log('✅ Found lessons in response.data, length:', lessons.length);
          } else if (response.data.items && Array.isArray(response.data.items)) {
            lessons = response.data.items;
            console.log('✅ Found lessons in response.data.items, length:', lessons.length);
          }
        }
        // Try items directly
        else if (response.items && Array.isArray(response.items)) {
          lessons = response.items;
          console.log('✅ Found lessons in response.items, length:', lessons.length);
        }
      }

      console.log('📚 Parsed lessons array, length:', lessons.length);
      console.log('📚 First lesson sample:', lessons[0]);

      if (lessons.length === 0) {
        console.warn('⚠️ No lessons found in response');
        return [];
      }

      // Map từ backend format sang frontend format
      const mappedLessons = lessons.map((lesson: any, index: number) => {
        // Map questions if available
        const questions = (lesson.questions || lesson.Questions || []).map((q: any) => ({
          questionId: q.questionId || q.QuestionId || 0,
          content: q.content || q.Content || '',
          questionType: q.questionType || q.QuestionType,
          difficulty: q.difficulty || q.Difficulty,
          marks: q.marks || q.Marks,
          sequenceIndex: q.sequenceIndex || q.SequenceIndex,
          options: (q.options || q.Options || []).map((opt: any) => ({
            optionId: opt.optionId || opt.OptionId || 0,
            content: opt.content || opt.Content || '',
            isCorrect: opt.isCorrect || opt.IsCorrect || false,
            sequenceIndex: opt.sequenceIndex || opt.SequenceIndex
          }))
        }));

        const mapped = {
          id: lesson.lessonId || lesson.LessonId || lesson.id || lesson.Id || index + 1,
          title: lesson.title || lesson.Title || `Bài học ${index + 1}`,
          description: lesson.description || lesson.Description || '',
          type: (lesson.type || lesson.Type || lesson.lessonType || lesson.LessonType || 'video').toLowerCase() as 'video' | 'document' | 'quiz' | 'assignment',
          duration: lesson.durationSeconds || lesson.DurationSeconds
            ? `${Math.floor((lesson.durationSeconds || lesson.DurationSeconds) / 60)}:${((lesson.durationSeconds || lesson.DurationSeconds) % 60).toString().padStart(2, '0')}`
            : lesson.duration || lesson.Duration || '0:00',
          videoUrl: lesson.videoUrl || lesson.VideoUrl || '',
          contentUrl: lesson.contentUrl || lesson.ContentUrl || '',
          content: lesson.content || lesson.Content || '',
          completed: false, // Sẽ lấy từ progress sau
          order: lesson.orderIndex || lesson.OrderIndex || lesson.order || lesson.Order || index,
          materials: [], // Sẽ load sau nếu cần
          questions: questions.length > 0 ? questions : undefined,
        };
        console.log(`📝 Mapped lesson ${index + 1}:`, mapped);
        console.log(`📝 Questions for lesson ${index + 1}:`, questions);
        console.log(`📝 Raw lesson data:`, lesson);
        return mapped;
      }).sort((a, b) => (a.order || 0) - (b.order || 0));

      console.log('✅ Final mapped lessons, count:', mappedLessons.length);
      return mappedLessons;
    } catch (error: any) {
      console.error('❌ Error fetching lessons from API:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error response:', error?.response);
      // Fallback to mock data
      return Promise.resolve(
        Array.from({ length: 3 }, (_, i) => ({
          ...mockLesson,
          id: i + 1,
          title: `Bài học ${i + 1}`,
          completed: false,
        }))
      );
    }
  }

  /**
   * Lấy chi tiết bài học
   * @param courseId - ID của khóa học
   * @param lessonId - ID của bài học
   * @returns Promise với thông tin bài học
   */
  async getLessonDetail(courseId: string | number, lessonId: string | number): Promise<ILesson> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ILesson>(
    //   COURSE_ENDPOINTS.LESSON_DETAIL(courseId, lessonId)
    // );

    // Mock response
    return Promise.resolve({
      ...mockLesson,
      id: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
    });
  }

  /**
   * Đánh dấu bài học hoàn thành
   * @param courseId - ID của khóa học
   * @param lessonId - ID của bài học
   * @returns Promise với message
   */
  async completeLesson(courseId: string | number, lessonId: string | number): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   COURSE_ENDPOINTS.COMPLETE_LESSON(courseId, lessonId)
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.LESSON_COMPLETED,
    });
  }

  /**
   * Lấy đánh giá khóa học
   * @param courseId - ID của khóa học
   * @returns Promise với danh sách đánh giá
   */
  async getCourseReviews(courseId: string | number): Promise<ICourseReview[]> {
    try {
      const response = await apiService.get<any>(
        `/Courses/${courseId}/reviews`
      );

      console.log('📝 Raw reviews response:', JSON.stringify(response, null, 2));

      // Xử lý response có thể là object hoặc array
      let data = response;
      if (response && typeof response === 'object') {
        // Nếu là ApiResponse format
        if ('Data' in response) {
          data = (response as any).Data;
          console.log('📝 Extracted Data from ApiResponse:', JSON.stringify(data, null, 2));
        } else if ('data' in response) {
          data = (response as any).data;
          console.log('📝 Extracted data from response:', JSON.stringify(data, null, 2));
        } else if (Array.isArray(response)) {
          console.log('📝 Response is already an array');
        } else {
          console.log('📝 Response keys:', Object.keys(response));
        }
      }

      const reviews = Array.isArray(data) ? data : [];
      console.log('📝 Parsed reviews array:', JSON.stringify(reviews, null, 2));
      console.log('📝 Reviews count:', reviews.length);

      // Map backend format sang frontend format
      const mappedReviews = reviews.map((review: any) => ({
        id: review.id || review.feedbackId,
        name: review.name || 'Người dùng',
        rating: typeof review.rating === 'number' ? review.rating : parseInt(review.rating) || 0,
        date: review.date || review.createdAt,
        comment: review.comment || '',
        avatar: review.avatar || '/images/background.png',
      }));

      console.log('📝 Mapped reviews:', mappedReviews);
      return mappedReviews;
    } catch (error: any) {
      console.error('Error loading course reviews:', error);
      // Trả về mảng rỗng nếu có lỗi
      return [];
    }
  }

  private formatDate(dateString: string | Date): string {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Hôm nay';
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
      return `${Math.floor(diffDays / 365)} năm trước`;
    } catch {
      return 'Vừa xong';
    }
  }

  /**
   * Thêm đánh giá khóa học
   * @param courseId - ID của khóa học
   * @param rating - Điểm đánh giá (1-5)
   * @param comment - Nội dung đánh giá
   * @returns Promise với message
   */
  async addCourseReview(
    courseId: string | number,
    rating: number,
    comment: string
  ): Promise<{ message: string }> {
    try {
      const response = await apiService.post<any>(
        `/Courses/${courseId}/reviews`,
        { rating, comment }
      );

      // Backend trả về ApiResponse với Data có thể null
      // apiService.post có thể trả về null nếu Data = null
      // Hoặc trả về object ApiResponse với { Success, Message, Data, StatusCode }
      if (response === null || response === undefined) {
        return {
          message: 'Đánh giá đã được gửi thành công',
        };
      }

      // Kiểm tra nếu response là ApiResponse object
      if (typeof response === 'object' && 'Message' in response) {
        return {
          message: (response as any).Message || 'Đánh giá đã được gửi thành công',
        };
      }

      // Fallback: kiểm tra các format khác
      const message = (response as any)?.message ||
        (response as any)?.Message ||
        'Đánh giá đã được gửi thành công';

      return {
        message: message,
      };
    } catch (error: any) {
      console.error('Error adding course review:', error);
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.message ||
        'Lỗi khi gửi đánh giá';
      throw new Error(errorMessage);
    }
  }

  /**
   * Lấy khóa học liên quan
   * @param courseId - ID của khóa học
   * @returns Promise với danh sách khóa học liên quan
   */
  async getRelatedCourses(courseId: string | number): Promise<ICourse[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICourse[]>(
    //   COURSE_ENDPOINTS.RELATED(courseId)
    // );

    // Mock response
    return Promise.resolve(mockCourses.slice(0, 4));
  }

  /**
   * Tìm kiếm khóa học
   * @param query - Từ khóa tìm kiếm
   * @returns Promise với danh sách khóa học
   */
  async searchCourses(query: string): Promise<ICourse[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICourse[]>(
    //   COURSE_ENDPOINTS.SEARCH,
    //   { params: { q: query } }
    // );

    // Mock response
    return Promise.resolve(
      mockCourses.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  /**
   * Lấy khóa học theo category
   * @param category - Category name
   * @returns Promise với danh sách khóa học
   */
  async getCoursesByCategory(category: string): Promise<ICourse[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICourse[]>(
    //   COURSE_ENDPOINTS.BY_CATEGORY(category)
    // );

    // Mock response
    return Promise.resolve(mockCourses);
  }

  // ==================== LESSON METHODS ====================

  /**
   * Lấy tài liệu bài học
   * @param lessonId - ID của bài học
   * @returns Promise với danh sách tài liệu
   */
  /**
   * Lấy tài liệu của khóa học từ MaterialsService
   * @param courseId - ID của khóa học
   * @returns Promise với danh sách tài liệu
   */
  async getCourseMaterials(courseId: string | number): Promise<any[]> {
    try {
      console.log('📚 Fetching materials for courseId:', courseId);
      // Backend endpoint: /api/courses/{courseId}/materials hoặc /api/Materials/by-course/{courseId}
      const response = await apiService.get<any>(
        `/Materials/by-course/${courseId}`
      );

      console.log('📥 Raw materials response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Is array?', Array.isArray(response));

      // Parse response từ backend
      let materials: any[] = [];

      // Case 1: Response là array trực tiếp
      if (Array.isArray(response)) {
        materials = response;
        console.log('✅ Response is direct array, length:', materials.length);
      }
      // Case 2: Response có structure { Data: {...}, data: {...}, ... }
      else if (response && typeof response === 'object') {
        // Try Data first (PascalCase)
        if (response.Data) {
          if (Array.isArray(response.Data)) {
            materials = response.Data;
            console.log('✅ Found materials in response.Data, length:', materials.length);
          } else if (response.Data.data && Array.isArray(response.Data.data)) {
            materials = response.Data.data;
            console.log('✅ Found materials in response.Data.data, length:', materials.length);
          } else if (response.Data.items && Array.isArray(response.Data.items)) {
            materials = response.Data.items;
            console.log('✅ Found materials in response.Data.items, length:', materials.length);
          }
        }
        // Try data (camelCase)
        else if (response.data) {
          if (Array.isArray(response.data)) {
            materials = response.data;
            console.log('✅ Found materials in response.data, length:', materials.length);
          } else if (response.data.items && Array.isArray(response.data.items)) {
            materials = response.data.items;
            console.log('✅ Found materials in response.data.items, length:', materials.length);
          }
        }
        // Try items directly
        else if (response.items && Array.isArray(response.items)) {
          materials = response.items;
          console.log('✅ Found materials in response.items, length:', materials.length);
        }
      }

      console.log('📚 Parsed materials array, length:', materials.length);
      console.log('📚 First material sample:', materials[0]);

      if (materials.length === 0) {
        console.warn('⚠️ No materials found in response');
        return [];
      }

      const mappedMaterials = materials.map((m: any, index: number) => {
        const mapped = {
          id: m.Id || m.id || m.MaterialId || m.materialId || index + 1,
          title: m.Title || m.title || 'Tài liệu',
          name: m.Title || m.title || 'Tài liệu',
          description: m.Description || m.description || '',
          mediaType: m.MediaType || m.mediaType || '',
          type: this.getFileTypeFromMediaType(m.MediaType || m.mediaType || ''),
          size: this.formatFileSize(m.FileSize || m.fileSize),
          fileUrl: m.FileUrl || m.fileUrl || m.Url || m.url || m.ExternalLink || m.externalLink,
          url: m.FileUrl || m.fileUrl || m.Url || m.url || m.ExternalLink || m.externalLink,
          isPaid: m.IsPaid || m.isPaid || false,
          price: m.Price || m.price,
        };
        console.log(`📝 Mapped material ${index + 1}:`, mapped);
        return mapped;
      });

      console.log('✅ Final mapped materials, count:', mappedMaterials.length);
      return mappedMaterials;
    } catch (error: any) {
      console.error('❌ Error fetching course materials:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error response:', error?.response);
      return [];
    }
  }

  /**
   * Lấy tài liệu của bài học
   * @param lessonId - ID của bài học (có thể là materialId)
   * @returns Promise với danh sách tài liệu
   */
  async getLessonMaterials(lessonId: string | number): Promise<any[]> {
    try {
      // Nếu lessonId thực chất là materialId, lấy trực tiếp
      const response = await apiService.get<any>(
        `/Materials/${lessonId}`
      );

      const material = response.Data || response.data || response;

      if (material) {
        return [{
          id: material.Id || material.id || material.MaterialId || material.materialId,
          name: material.Title || material.title || 'Tài liệu',
          type: this.getFileTypeFromMediaType(material.MediaType || material.mediaType || ''),
          size: this.formatFileSize(material.FileSize || material.fileSize),
          url: material.FileUrl || material.fileUrl || material.Url || material.url || material.ExternalLink || material.externalLink,
          isPaid: material.IsPaid || material.isPaid || false,
          price: material.Price || material.price,
        }];
      }

      return [];
    } catch (error) {
      console.error('Error fetching lesson materials:', error);
      // Fallback to mock
      return mockLesson.materials || [];
    }
  }

  /**
   * Helper: Map MediaType từ backend sang file type
   */
  private getFileTypeFromMediaType(mediaType: string): string {
    if (!mediaType) return 'file';
    const type = mediaType.toLowerCase();
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('video') || type.includes('mp4') || type.includes('youtube')) return 'video';
    if (type.includes('zip') || type.includes('rar')) return 'zip';
    if (type.includes('doc') || type.includes('word')) return 'doc';
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return 'image';
    return 'file';
  }

  /**
   * Helper: Format file size
   */
  private formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Download tài liệu bài học
   * @param lessonId - ID của bài học
   * @param materialId - ID của tài liệu
   * @returns Promise
   */
  async downloadLessonMaterial(
    lessonId: string | number,
    materialId: string | number
  ): Promise<void> {
    // TODO: Uncomment khi có API thật
    // await apiService.download(
    //   LESSON_ENDPOINTS.DOWNLOAD_MATERIAL(lessonId, materialId),
    //   `material-${materialId}.pdf`
    // );

    // Mock response
    console.log('Downloading material:', materialId);
    return Promise.resolve();
  }

  /**
   * Lấy ghi chú bài học
   * @param lessonId - ID của bài học
   * @returns Promise với danh sách ghi chú
   */
  async getLessonNotes(lessonId: string | number): Promise<ILessonNote[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ILessonNote[]>(
    //   LESSON_ENDPOINTS.NOTES(lessonId)
    // );

    // Mock response
    return Promise.resolve([
      {
        id: 1,
        lessonId: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
        content: 'Ghi chú mẫu cho bài học',
        timestamp: 120,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  /**
   * Thêm ghi chú bài học
   * @param lessonId - ID của bài học
   * @param content - Nội dung ghi chú
   * @param timestamp - Thời điểm trong video (giây)
   * @returns Promise với ghi chú mới
   */
  async addLessonNote(
    lessonId: string | number,
    content: string,
    timestamp?: number
  ): Promise<ILessonNote> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<ILessonNote>(
    //   LESSON_ENDPOINTS.ADD_NOTE(lessonId),
    //   { content, timestamp }
    // );

    // Mock response
    return Promise.resolve({
      id: Date.now(),
      lessonId: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
      content,
      timestamp,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Cập nhật ghi chú bài học
   * @param lessonId - ID của bài học
   * @param noteId - ID của ghi chú
   * @param content - Nội dung ghi chú mới
   * @returns Promise với ghi chú đã cập nhật
   */
  async updateLessonNote(
    lessonId: string | number,
    noteId: string | number,
    content: string
  ): Promise<ILessonNote> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.put<ILessonNote>(
    //   LESSON_ENDPOINTS.UPDATE_NOTE(lessonId, noteId),
    //   { content }
    // );

    // Mock response
    return Promise.resolve({
      id: typeof noteId === 'string' ? parseInt(noteId) : noteId,
      lessonId: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
      content,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Xóa ghi chú bài học
   * @param lessonId - ID của bài học
   * @param noteId - ID của ghi chú
   * @returns Promise với message
   */
  async deleteLessonNote(lessonId: string | number, noteId: string | number): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.delete<{ message: string }>(
    //   LESSON_ENDPOINTS.DELETE_NOTE(lessonId, noteId)
    // );

    // Mock response
    return Promise.resolve({
      message: SUCCESS_MESSAGES.DELETED,
    });
  }
}

// ==================== EXPORT ====================

export const courseService = new CourseService();
export default courseService;
