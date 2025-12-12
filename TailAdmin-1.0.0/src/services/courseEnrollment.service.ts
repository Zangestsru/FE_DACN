// Course Enrollment Service for TailAdmin
// Quản lý lịch sử đăng ký khóa học của tất cả users

import { ApiService } from './api.service';

export interface CourseEnrollmentDto {
  enrollmentId: number;
  courseId: number;
  courseTitle?: string;
  userId: number;
  userName?: string;
  userEmail?: string;
  enrolledAt?: string;
  completedAt?: string;
  progress?: number;
  isCompleted?: boolean;
  status?: string; // Active, Completed, Cancelled
  lastAccessedAt?: string;
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

class CourseEnrollmentService extends ApiService {
  // Lấy danh sách lịch sử đăng ký khóa học (có phân trang & filter)
  async getCourseEnrollments(params?: {
    pageIndex?: number;
    pageSize?: number;
    courseId?: number;
    userId?: number;
    status?: string;
    isCompleted?: boolean;
    search?: string;
  }): Promise<PagedResponse<CourseEnrollmentDto>> {
    try {
      const query = new URLSearchParams();
      if (params?.pageIndex) query.append('pageIndex', String(params.pageIndex));
      if (params?.pageSize) query.append('pageSize', String(params.pageSize));
      if (params?.courseId) query.append('courseId', String(params.courseId));
      if (params?.userId) query.append('userId', String(params.userId));
      if (params?.status) query.append('status', params.status);
      if (params?.isCompleted !== undefined) query.append('isCompleted', String(params.isCompleted));
      if (params?.search) query.append('search', params.search);

      // Use Admin endpoint (port 5001) - this will proxy to ExamsService
      const endpoint = `/Admin/course-enrollments?${query.toString()}`;

      try {
        const res = await this.get<any>(endpoint);
        // AdminController returns ContentResult, so response might be direct JSON or wrapped
        const data = res.data ?? res.Data ?? res;
        
        // Handle response format from AdminController -> ExamsService
        let items: any[] = [];
        let total = 0;
        let pageIndex = params?.pageIndex || 1;
        let pageSize = params?.pageSize || 10;
        let totalPages = 1;

        // Response format: { Success: true, Message: "...", Data: { Items: [...], Total: ..., ... } }
        const responseData = data.Data || data.data || data;
        
        if (responseData.Items || responseData.items) {
          items = responseData.Items || responseData.items || [];
          total = responseData.Total || responseData.total || 0;
          pageIndex = responseData.PageIndex || responseData.pageIndex || pageIndex;
          pageSize = responseData.PageSize || responseData.pageSize || pageSize;
          totalPages = responseData.TotalPages || responseData.totalPages || Math.ceil(total / pageSize);
        } else if (Array.isArray(responseData)) {
          items = responseData;
          total = responseData.length;
          totalPages = Math.ceil(total / pageSize);
        }

        return {
          items: items.map((item: any) => ({
            enrollmentId: item.EnrollmentId || item.enrollmentId || item.id,
            courseId: item.CourseId || item.courseId,
            courseTitle: item.CourseTitle || item.courseTitle || item.course?.title,
            userId: item.UserId || item.userId,
            userName: item.UserName || item.userName || item.user?.name || item.user?.fullName,
            userEmail: item.UserEmail || item.userEmail || item.user?.email,
            enrolledAt: item.EnrolledAt || item.enrolledAt,
            completedAt: item.CompletedAt || item.completedAt,
            progress: item.Progress || item.progress || 0,
            isCompleted: item.IsCompleted !== undefined ? item.IsCompleted : (item.isCompleted !== undefined ? item.isCompleted : false),
            status: item.Status || item.status || 'Active',
            lastAccessedAt: item.LastAccessedAt || item.lastAccessedAt,
          })),
          total,
          pageIndex,
          pageSize,
          totalPages,
          hasPreviousPage: pageIndex > 1,
          hasNextPage: pageIndex < totalPages,
        };
      } catch (error: any) {
        throw error;
      }
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw error;
    }
  }

  // Lấy chi tiết một enrollment
  async getCourseEnrollmentById(enrollmentId: number): Promise<CourseEnrollmentDto> {
    try {
      const endpoints = [
        `/Admin/course-enrollments/${enrollmentId}`,
        `/Admin/Courses/enrollments/${enrollmentId}`,
        `/Courses/enrollments/${enrollmentId}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          const res = await this.get<any>(endpoint);
          const data = res.data ?? res.Data ?? res;
          
          return {
            enrollmentId: data.EnrollmentId || data.enrollmentId || enrollmentId,
            courseId: data.CourseId || data.courseId,
            courseTitle: data.CourseTitle || data.courseTitle,
            userId: data.UserId || data.userId,
            userName: data.UserName || data.userName,
            userEmail: data.UserEmail || data.userEmail,
            enrolledAt: data.EnrolledAt || data.enrolledAt,
            completedAt: data.CompletedAt || data.completedAt,
            progress: data.Progress || data.progress || 0,
            isCompleted: data.IsCompleted !== undefined ? data.IsCompleted : (data.isCompleted !== undefined ? data.isCompleted : false),
            status: data.Status || data.status || 'Active',
            lastAccessedAt: data.LastAccessedAt || data.lastAccessedAt,
          };
        } catch (error: any) {
          lastError = error;
          if (error.status === 404 || error.status === 400) {
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error('Không thể tải chi tiết lịch sử đăng ký khóa học');
    } catch (error) {
      console.error(`Error fetching course enrollment ${enrollmentId}:`, error);
      throw error;
    }
  }

  // Xóa enrollment (admin only)
  async deleteCourseEnrollment(enrollmentId: number): Promise<void> {
    try {
      const endpoints = [
        `/Admin/course-enrollments/${enrollmentId}`,
        `/Admin/Courses/enrollments/${enrollmentId}`,
        `/Courses/enrollments/${enrollmentId}`,
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          await this.delete<any>(endpoint);
          return;
        } catch (error: any) {
          lastError = error;
          if (error.status === 404 || error.status === 400) {
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error('Không thể xóa lịch sử đăng ký khóa học');
    } catch (error) {
      console.error(`Error deleting course enrollment ${enrollmentId}:`, error);
      throw error;
    }
  }
}

export const courseEnrollmentService = new CourseEnrollmentService();
export default courseEnrollmentService;

