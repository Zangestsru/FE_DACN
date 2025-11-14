/**
 * Course Hooks
 * Custom hooks cho course management
 */

import { courseService } from '@/services/course.service';
import { useApi, useMutation } from './useApi';
import type {
  ICourse,
  ILesson,
  IGetCoursesRequest,
  IGetCoursesResponse,
  ICourseProgress,
  ICourseReview,
  IEnrollCourseResponse,
  ILessonNote,
} from '@/types';

// ==================== USE COURSES HOOK ====================

/**
 * Hook để fetch danh sách courses với pagination và filter
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = useCourses({
 *   page: 1,
 *   limit: 9,
 *   category: 'programming',
 * });
 * ```
 */
export function useCourses(params?: IGetCoursesRequest, immediate = true) {
  return useApi<IGetCoursesResponse, [IGetCoursesRequest?]>(
    (params) => courseService.getAllCourses(params),
    {
      immediate,
      cacheKey: params ? `courses-${JSON.stringify(params)}` : 'courses',
      cacheTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Error fetching courses:', error);
      },
    }
  );
}

// ==================== USE COURSE DETAIL HOOK ====================

/**
 * Hook để fetch chi tiết một course
 * 
 * @param courseId - ID của course
 * @param immediate - Tự động fetch khi mount (default: true)
 * 
 * @example
 * ```typescript
 * const { data: course, loading, error } = useCourseDetail(courseId);
 * ```
 */
export function useCourseDetail(courseId: string | number | null, immediate = true) {
  return useApi<ICourse, [string | number]>(
    (id) => courseService.getCourseById(id),
    {
      immediate: immediate && !!courseId,
      cacheKey: courseId ? `course-${courseId}` : undefined,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Error fetching course detail:', error);
      },
    }
  );
}

// ==================== USE COURSE ENROLL HOOK ====================

/**
 * Hook để đăng ký course
 * 
 * @example
 * ```typescript
 * const { mutate: enrollCourse, loading, error } = useCourseEnroll({
 *   onSuccess: () => {
 *     showToast('Đăng ký khóa học thành công!');
 *     navigate('/my-courses');
 *   },
 * });
 * 
 * // Use it
 * await enrollCourse(courseId);
 * ```
 */
export function useCourseEnroll(options?: {
  onSuccess?: (data: IEnrollCourseResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<IEnrollCourseResponse, [string | number]>(
    async (courseId) => {
      return await courseService.enrollCourse(courseId);
    },
    {
      onSuccess: (data) => {
        console.log('Course enrolled successfully:', data);
        if (options?.onSuccess) {
          options.onSuccess(data);
        }
      },
      onError: (error) => {
        console.error('Error enrolling course:', error);
        if (options?.onError) {
          options.onError(error);
        }
      },
    }
  );
}

// ==================== USE COURSE UNENROLL HOOK ====================

/**
 * Hook để hủy đăng ký course
 * 
 * @example
 * ```typescript
 * const { mutate: unenrollCourse, loading } = useCourseUnenroll({
 *   onSuccess: () => showToast('Đã hủy đăng ký'),
 * });
 * ```
 */
export function useCourseUnenroll(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<{ message: string }, [string | number]>(
    async (courseId) => {
      return await courseService.unenrollCourse(courseId);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE MY COURSES HOOK ====================

/**
 * Hook để lấy danh sách courses đã đăng ký
 * 
 * @example
 * ```typescript
 * const { data: myCourses, loading, refetch } = useMyCourses();
 * ```
 */
export function useMyCourses(immediate = true) {
  return useApi<ICourse[]>(
    () => courseService.getMyCourses(),
    {
      immediate,
      cacheKey: 'my-courses',
      onError: (error) => {
        console.error('Error fetching my courses:', error);
      },
    }
  );
}

// ==================== USE COURSE PROGRESS HOOK ====================

/**
 * Hook để lấy tiến độ học tập
 * 
 * @example
 * ```typescript
 * const { data: progress, loading, refetch } = useCourseProgress(courseId);
 * ```
 */
export function useCourseProgress(courseId: string | number | null, immediate = true) {
  return useApi<ICourseProgress, [string | number]>(
    (id) => courseService.getCourseProgress(id),
    {
      immediate: immediate && !!courseId,
      cacheKey: courseId ? `course-progress-${courseId}` : undefined,
      onError: (error) => {
        console.error('Error fetching course progress:', error);
      },
    }
  );
}

// ==================== USE UPDATE COURSE PROGRESS HOOK ====================

/**
 * Hook để cập nhật tiến độ học tập
 * 
 * @example
 * ```typescript
 * const { mutate: updateProgress, loading } = useUpdateCourseProgress({
 *   onSuccess: () => refetchProgress(),
 * });
 * 
 * await updateProgress(courseId, lessonId);
 * ```
 */
export function useUpdateCourseProgress(options?: {
  onSuccess?: (data: ICourseProgress) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<ICourseProgress, [string | number, string | number]>(
    async (courseId, lessonId) => {
      return await courseService.updateCourseProgress(courseId, lessonId);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE COURSE LESSONS HOOK ====================

/**
 * Hook để lấy danh sách bài học
 * 
 * @example
 * ```typescript
 * const { data: lessons, loading } = useCourseLessons(courseId);
 * ```
 */
export function useCourseLessons(courseId: string | number | null, immediate = true) {
  return useApi<ILesson[], [string | number]>(
    (id) => courseService.getCourseLessons(id),
    {
      immediate: immediate && !!courseId,
      cacheKey: courseId ? `course-lessons-${courseId}` : undefined,
      cacheTime: 10 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching course lessons:', error);
      },
    }
  );
}

// ==================== USE LESSON DETAIL HOOK ====================

/**
 * Hook để lấy chi tiết bài học
 * 
 * @example
 * ```typescript
 * const { data: lesson, loading } = useLessonDetail(courseId, lessonId);
 * ```
 */
export function useLessonDetail(
  courseId: string | number | null,
  lessonId: string | number | null,
  immediate = true
) {
  return useApi<ILesson, [string | number, string | number]>(
    (cId, lId) => courseService.getLessonDetail(cId, lId),
    {
      immediate: immediate && !!courseId && !!lessonId,
      cacheKey: courseId && lessonId ? `lesson-${courseId}-${lessonId}` : undefined,
      onError: (error) => {
        console.error('Error fetching lesson detail:', error);
      },
    }
  );
}

// ==================== USE COMPLETE LESSON HOOK ====================

/**
 * Hook để đánh dấu bài học hoàn thành
 * 
 * @example
 * ```typescript
 * const { mutate: completeLesson, loading } = useCompleteLesson({
 *   onSuccess: () => {
 *     showToast('Đã hoàn thành bài học!');
 *     refetchProgress();
 *   },
 * });
 * 
 * await completeLesson(courseId, lessonId);
 * ```
 */
export function useCompleteLesson(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<{ message: string }, [string | number, string | number]>(
    async (courseId, lessonId) => {
      return await courseService.completeLesson(courseId, lessonId);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE COURSE REVIEWS HOOK ====================

/**
 * Hook để lấy đánh giá course
 * 
 * @example
 * ```typescript
 * const { data: reviews, loading } = useCourseReviews(courseId);
 * ```
 */
export function useCourseReviews(courseId: string | number | null, immediate = true) {
  return useApi<ICourseReview[], [string | number]>(
    (id) => courseService.getCourseReviews(id),
    {
      immediate: immediate && !!courseId,
      cacheKey: courseId ? `course-reviews-${courseId}` : undefined,
      onError: (error) => {
        console.error('Error fetching course reviews:', error);
      },
    }
  );
}

// ==================== USE ADD COURSE REVIEW HOOK ====================

/**
 * Hook để thêm đánh giá course
 * 
 * @example
 * ```typescript
 * const { mutate: addReview, loading } = useAddCourseReview({
 *   onSuccess: () => {
 *     showToast('Cảm ơn bạn đã đánh giá!');
 *     refetchReviews();
 *   },
 * });
 * 
 * await addReview(courseId, 5, 'Khóa học rất hay!');
 * ```
 */
export function useAddCourseReview(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<{ message: string }, [string | number, number, string]>(
    async (courseId, rating, comment) => {
      return await courseService.addCourseReview(courseId, rating, comment);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== USE COURSE SEARCH HOOK ====================

/**
 * Hook để tìm kiếm courses
 * 
 * @example
 * ```typescript
 * const { data: courses, loading, refetch } = useCourseSearch(searchQuery);
 * 
 * // Search
 * refetch('React Full-Stack');
 * ```
 */
export function useCourseSearch(query?: string, immediate = false) {
  return useApi<ICourse[], [string]>(
    (q) => courseService.searchCourses(q),
    {
      immediate: immediate && !!query,
      onError: (error) => {
        console.error('Error searching courses:', error);
      },
    }
  );
}

// ==================== USE COURSES BY CATEGORY HOOK ====================

/**
 * Hook để lấy courses theo category
 * 
 * @example
 * ```typescript
 * const { data: courses, loading } = useCoursesByCategory('programming');
 * ```
 */
export function useCoursesByCategory(category: string | null, immediate = true) {
  return useApi<ICourse[], [string]>(
    (cat) => courseService.getCoursesByCategory(cat),
    {
      immediate: immediate && !!category,
      cacheKey: category ? `courses-category-${category}` : undefined,
      cacheTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching courses by category:', error);
      },
    }
  );
}

// ==================== USE RELATED COURSES HOOK ====================

/**
 * Hook để lấy courses liên quan
 * 
 * @example
 * ```typescript
 * const { data: relatedCourses, loading } = useRelatedCourses(courseId);
 * ```
 */
export function useRelatedCourses(courseId: string | number | null, immediate = true) {
  return useApi<ICourse[], [string | number]>(
    (id) => courseService.getRelatedCourses(id),
    {
      immediate: immediate && !!courseId,
      cacheKey: courseId ? `related-courses-${courseId}` : undefined,
      onError: (error) => {
        console.error('Error fetching related courses:', error);
      },
    }
  );
}

// ==================== USE LESSON NOTES HOOK ====================

/**
 * Hook để lấy ghi chú bài học
 * 
 * @example
 * ```typescript
 * const { data: notes, loading, refetch } = useLessonNotes(lessonId);
 * ```
 */
export function useLessonNotes(lessonId: string | number | null, immediate = true) {
  return useApi<ILessonNote[], [string | number]>(
    (id) => courseService.getLessonNotes(id),
    {
      immediate: immediate && !!lessonId,
      cacheKey: lessonId ? `lesson-notes-${lessonId}` : undefined,
      onError: (error) => {
        console.error('Error fetching lesson notes:', error);
      },
    }
  );
}

// ==================== USE ADD LESSON NOTE HOOK ====================

/**
 * Hook để thêm ghi chú bài học
 * 
 * @example
 * ```typescript
 * const { mutate: addNote, loading } = useAddLessonNote({
 *   onSuccess: () => refetchNotes(),
 * });
 * 
 * await addNote(lessonId, 'Ghi chú quan trọng', 120);
 * ```
 */
export function useAddLessonNote(options?: {
  onSuccess?: (data: ILessonNote) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<ILessonNote, [string | number, string, number?]>(
    async (lessonId, content, timestamp?) => {
      return await courseService.addLessonNote(lessonId, content, timestamp);
    },
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    }
  );
}

// ==================== EXPORT ====================

export default useCourses;

