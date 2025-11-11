/**
 * Course Service
 * Xử lý tất cả các chức năng liên quan đến khóa học và tài liệu học tập
 */

import { apiService } from './api.service';
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
      const response = await apiService.get<IGetCoursesResponse>(
        COURSE_ENDPOINTS.LIST,
        { params }
      );

      if (response && Array.isArray(response.data)) {
        return response;
      }
      throw new Error('Invalid course list response');
    } catch (error) {
      return {
        success: true,
        data: mockCourses,
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: mockCourses.length,
          totalPages: Math.ceil(mockCourses.length / (params?.limit || 10)),
          hasNext: false,
          hasPrev: false,
        },
        message: 'Using mock courses due to API error',
      };
    }
  }

  /**
   * Lấy chi tiết khóa học theo ID
   * @param id - ID của khóa học
   * @returns Promise với thông tin khóa học
   */
  async getCourseById(id: string | number): Promise<ICourse> {
    try {
      const response = await apiService.get<ICourse>(
        COURSE_ENDPOINTS.GET_BY_ID(id)
      );
      if (response && (response as any).id !== undefined) {
        return response;
      }
      throw new Error('Invalid course detail response');
    } catch (error) {
      return {
        ...mockCourse,
        id: typeof id === 'string' ? parseInt(id) : id,
      };
    }
  }

  /**
   * Đăng ký khóa học
   * @param courseId - ID của khóa học
   * @returns Promise với thông tin enrollment
   */
  async enrollCourse(courseId: string | number): Promise<IEnrollCourseResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IEnrollCourseResponse>(
    //   COURSE_ENDPOINTS.ENROLL(courseId)
    // );

    // Mock response
    return Promise.resolve({
      enrollment: {
        id: 'enroll-' + Date.now(),
        courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
        userId: 1,
        enrolledAt: new Date().toISOString(),
        status: 'active',
      },
      message: SUCCESS_MESSAGES.COURSE_ENROLLED,
    });
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
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICourse[]>(
    //   COURSE_ENDPOINTS.MY_COURSES
    // );

    // Mock response
    return Promise.resolve(mockCourses.slice(0, 3));
  }

  /**
   * Lấy tiến độ học tập
   * @param courseId - ID của khóa học
   * @returns Promise với tiến độ
   */
  async getCourseProgress(courseId: string | number): Promise<ICourseProgress> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICourseProgress>(
    //   COURSE_ENDPOINTS.PROGRESS(courseId)
    // );

    // Mock response
    return Promise.resolve({
      courseId: typeof courseId === 'string' ? parseInt(courseId) : courseId,
      currentLesson: 5,
      completedLessons: [1, 2, 3, 4, 5],
      totalLessons: 45,
      progressPercentage: 11,
      lastAccessedAt: new Date().toISOString(),
    });
  }

  /**
   * Cập nhật tiến độ học tập
   * @param courseId - ID của khóa học
   * @param lessonId - ID của bài học
   * @returns Promise với tiến độ mới
   */
  async updateCourseProgress(
    courseId: string | number,
    lessonId: string | number
  ): Promise<ICourseProgress> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.put<ICourseProgress>(
    //   COURSE_ENDPOINTS.UPDATE_PROGRESS(courseId),
    //   { lessonId }
    // );

    // Mock response
    const progress = await this.getCourseProgress(courseId);
    return Promise.resolve({
      ...progress,
      currentLesson: typeof lessonId === 'string' ? parseInt(lessonId) : lessonId,
      lastAccessedAt: new Date().toISOString(),
    });
  }

  /**
   * Lấy danh sách bài học
   * @param courseId - ID của khóa học
   * @returns Promise với danh sách bài học
   */
  async getCourseLessons(courseId: string | number): Promise<ILesson[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ILesson[]>(
    //   COURSE_ENDPOINTS.LESSONS(courseId)
    // );

    // Mock response
    return Promise.resolve(
      Array.from({ length: 10 }, (_, i) => ({
        ...mockLesson,
        id: i + 1,
        title: `Bài học ${i + 1}`,
        completed: i < 5,
      }))
    );
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
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<ICourseReview[]>(
    //   COURSE_ENDPOINTS.REVIEWS(courseId)
    // );

    // Mock response
    return Promise.resolve([
      {
        id: 1,
        name: 'Nguyễn Văn A',
        rating: 5,
        date: '2 tuần trước',
        comment: 'Khóa học rất hay và chi tiết',
        avatar: '/images/background.png',
      },
      {
        id: 2,
        name: 'Trần Thị B',
        rating: 5,
        date: '1 tháng trước',
        comment: 'Nội dung cập nhật, phù hợp với thực tế',
        avatar: '/images/background.png',
      },
    ]);
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
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   COURSE_ENDPOINTS.ADD_REVIEW(courseId),
    //   { rating, comment }
    // );

    // Mock response
    return Promise.resolve({
      message: 'Đánh giá đã được gửi thành công',
    });
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
  async getLessonMaterials(lessonId: string | number): Promise<any[]> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<any[]>(
    //   LESSON_ENDPOINTS.MATERIALS(lessonId)
    // );

    // Mock response
    return Promise.resolve(mockLesson.materials || []);
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

