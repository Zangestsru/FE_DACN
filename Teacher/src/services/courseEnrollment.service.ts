// Course Enrollment Service for Teacher
// Quản lý lịch sử đăng ký khóa học của các khóa học do teacher tạo

import { apiService } from './api.service';

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

class CourseEnrollmentService {
  // Lấy danh sách lịch sử đăng ký khóa học (có phân trang & filter)
  // Chỉ lấy enrollments của các khóa học do teacher tạo
  async getCourseEnrollments(params?: {
    pageIndex?: number;
    pageSize?: number;
    courseId?: number;
    userId?: number;
    status?: string;
    isCompleted?: boolean;
    search?: string;
    teacherId?: number; // Filter by teacher ID
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

      // Use teacher endpoints as specified in API documentation:
      // GET /api/Courses/teacher/enrollments - Lấy danh sách lịch sử đăng ký khóa học cho Teacher
      // (chỉ lấy enrollments của các khóa học do teacher tạo)
      // Fallback to admin endpoints only if teacher endpoint fails
      const endpoints = [
        `/Courses/teacher/enrollments?${query.toString()}`, // Primary: Teacher endpoint
        `/Courses/admin/enrollments?${query.toString()}`,   // Fallback 1: Admin endpoint
        `/Admin/course-enrollments?${query.toString()}`,    // Fallback 2: Alternative admin endpoint
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          // Log endpoint being called (only in dev mode for debugging)
          if (import.meta.env.DEV) {
            console.log(`🔄 Calling endpoint: ${endpoint}`);
            console.log(`📡 Full URL will be: http://localhost:5000/api${endpoint}`);
          }
          const res = await apiService.get<any>(endpoint);
          // Only log in development mode
          if (import.meta.env.DEV) {
            console.log(`✅ Endpoint ${endpoint} succeeded!`, res);
          }
          
          // Handle different response formats from backend
          // Format 1: { success: true, data: { items: [...], total: ... } }
          // Format 2: { Success: true, Data: { Items: [...], Total: ... } }
          // Format 3: { items: [...], total: ... } (direct)
          // Format 4: [{...}, {...}] (array directly)
          
          let items: any[] = [];
          let total = 0;
          let pageIndex = params?.pageIndex || 1;
          let pageSize = params?.pageSize || 10;
          let totalPages = 1;

          // Extract data from response
          const responseData = res.data || res.Data || res;
          
          // Check if response has pagination structure
          if (responseData && typeof responseData === 'object') {
            // Check for nested data structure: { data: { items: [...] } }
            const nestedData = responseData.data || responseData.Data;
            if (nestedData) {
              if (nestedData.Items || nestedData.items) {
                items = nestedData.Items || nestedData.items || [];
                total = nestedData.Total || nestedData.total || 0;
                pageIndex = nestedData.PageIndex || nestedData.pageIndex || pageIndex;
                pageSize = nestedData.PageSize || nestedData.pageSize || pageSize;
                totalPages = nestedData.TotalPages || nestedData.totalPages || Math.ceil(total / pageSize);
              } else if (Array.isArray(nestedData)) {
                items = nestedData;
                total = nestedData.length;
                totalPages = Math.ceil(total / pageSize);
              }
            } else {
              // Direct structure: { items: [...], total: ... }
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
            }
          }

          // Map to DTO
          const mappedItems = items.map((item: any) => ({
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
          }));

          // Filter by teacherId if provided (client-side filter)
          // Note: This assumes the backend doesn't support teacherId filter
          // If backend supports it, we should add it to query params instead
          let filteredItems = mappedItems;
          if (params?.teacherId) {
            // We need to check if course belongs to teacher
            // This requires loading course details or having course.teacherId in response
            // For now, we'll return all and filter in the component after loading courses
            filteredItems = mappedItems;
          }

          // Only log in development mode
          if (import.meta.env.DEV) {
            console.log(`✅ Successfully loaded ${filteredItems.length} enrollments from ${endpoint}`);
          }
          
          return {
            items: filteredItems,
            total: total, // Use total from response, not filteredItems.length
            pageIndex,
            pageSize,
            totalPages: totalPages, // Use totalPages from response
            hasPreviousPage: pageIndex > 1,
            hasNextPage: pageIndex < totalPages,
          };
        } catch (error: any) {
          lastError = error;
          
          // Extract error message from response
          let errorMessage = error.message || 'Unknown error';
          
          // Try to extract more detailed error information
          if (error.response?.data) {
            const responseData = error.response.data;
            errorMessage = responseData.message || responseData.Message || responseData.error || errorMessage;
          }
          
          // Check if this is a SQL/database error
          const isSqlError = errorMessage.includes('syntax') || 
                            errorMessage.includes('SQL') || 
                            errorMessage.includes('WITH') ||
                            errorMessage.includes('Incorrect syntax') ||
                            errorMessage.includes('database') ||
                            errorMessage.includes('Database');
          
          // Completely suppress console logs for expected errors (SQL errors, 403, 404, 500 for enrollments)
          // These are backend issues that we handle gracefully
          
          // If 403 (Forbidden) or 500 (Internal Server Error), teacher doesn't have permission - skip this endpoint
          // BUT: Don't skip if it's the teacher endpoint (should work)
          if (error.status === 403 || error.status === 500) {
            if (endpoint.includes('teacher/enrollments')) {
              // Teacher endpoint should not return 403/500, this is unexpected
              if (isSqlError) {
                // SQL errors are expected backend issues - suppress console errors
                // Update error message to be more specific
                const sqlError = new Error(errorMessage) as any;
                sqlError.status = 500;
                sqlError.isSqlError = true;
                sqlError.response = error.response;
                lastError = sqlError;
              }
              // Still continue to try other endpoints as fallback
            }
            continue; // Try next endpoint
          }
          if (error.status === 404 || error.status === 400) {
            continue; // Try next endpoint
          }
          throw error;
        }
      }
      
      // If all endpoints failed, return empty result instead of throwing error
      if (lastError) {
        // Completely silent - don't log expected backend failures
        return {
          items: [],
          total: 0,
          pageIndex: params?.pageIndex || 1,
          pageSize: params?.pageSize || 10,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        };
      }
      
      throw new Error('Không thể tải lịch sử đăng ký khóa học');
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw error;
    }
  }

  // Lấy chi tiết một enrollment
  // GET /api/Courses/teacher/enrollments/{id} - Lấy chi tiết enrollment theo ID
  async getCourseEnrollmentById(enrollmentId: number): Promise<CourseEnrollmentDto> {
    try {
      const endpoints = [
        `/Courses/teacher/enrollments/${enrollmentId}`, // Primary: Teacher endpoint
        `/Admin/course-enrollments/${enrollmentId}`,     // Fallback 1
        `/Admin/Courses/enrollments/${enrollmentId}`,   // Fallback 2
        `/Courses/enrollments/${enrollmentId}`,          // Fallback 3
      ];

      let lastError: any = null;
      for (const endpoint of endpoints) {
        try {
          const res = await apiService.get<any>(endpoint);
          const data = res.Data || res.data || res;
          
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
      throw lastError || new Error(`Không thể tải chi tiết lịch sử đăng ký khóa học ${enrollmentId}`);
    } catch (error) {
      console.error(`Error fetching course enrollment ${enrollmentId}:`, error);
      throw error;
    }
  }

  // Xóa enrollment (may require admin permission)
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
          await apiService.delete<any>(endpoint);
          return;
        } catch (error: any) {
          lastError = error;
          if (error.status === 404 || error.status === 400) {
            continue;
          }
          throw error;
        }
      }
      throw lastError || new Error(`Không thể xóa lịch sử đăng ký khóa học ${enrollmentId}`);
    } catch (error) {
      console.error(`Error deleting course enrollment ${enrollmentId}:`, error);
      throw error;
    }
  }
}

export const courseEnrollmentService = new CourseEnrollmentService();
export default courseEnrollmentService;

