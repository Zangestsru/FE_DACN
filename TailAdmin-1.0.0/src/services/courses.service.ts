// Courses Service for TailAdmin
// Quản lý khóa học - tương tự ExamsService

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

// DTOs khớp với BE Course model
export interface CourseListItemDto {
  courseId: number;
  title: string;
  description?: string;
  teacherId?: number;
  teacherName?: string;
  subjectId?: number;
  subjectName?: string;
  price?: number;
  isFree: boolean;
  thumbnailUrl?: string;
  durationMinutes?: number;
  level?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CourseDetailDto = CourseListItemDto;

export interface CreateCourseRequest {
  title: string;
  description?: string;
  teacherId?: number;
  subjectId?: number;
  price?: number;
  isFree?: boolean;
  thumbnailUrl?: string;
  durationMinutes?: number;
  level?: string;
  status?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  teacherId?: number;
  subjectId?: number;
  price?: number;
  isFree?: boolean;
  thumbnailUrl?: string;
  durationMinutes?: number;
  level?: string;
  status?: string;
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

class CoursesService {
  // Lấy danh sách khóa học (có phân trang & filter)
  async getCourses(params?: { 
    pageIndex?: number; 
    pageSize?: number; 
    teacherId?: number; 
    subjectId?: number;
    search?: string;
  }): Promise<PagedResponse<CourseListItemDto>> {
    try {
      const query = new URLSearchParams();
      if (params?.pageIndex) query.append('pageIndex', String(params.pageIndex));
      if (params?.pageSize) query.append('pageSize', String(params.pageSize));
      if (params?.teacherId) query.append('teacherId', String(params.teacherId));
      if (params?.subjectId) query.append('subjectId', String(params.subjectId));
      if (params?.search) query.append('search', params.search);

      const endpoint = `${API_ENDPOINTS.courses.getAll}${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await apiService.get<any>(endpoint);
      
      // BE trả về ApiResponse { Success, Message, Data: { Items, Total, PageIndex, PageSize, TotalPages, HasPreviousPage, HasNextPage }, StatusCode }
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      
      // Map response từ backend format sang frontend format
      // Backend trả về: { Items: CourseListItemDto[], Total, PageIndex, PageSize, TotalPages, HasPreviousPage, HasNextPage }
      if (data.Items || data.items) {
        const items = data.Items || data.items || [];
        const total = data.Total || data.total || 0;
        const pageIndex = data.PageIndex || data.pageIndex || 1;
        const pageSize = data.PageSize || data.pageSize || 10;
        const totalPages = data.TotalPages || data.totalPages || Math.ceil(total / pageSize);
        const hasPreviousPage = data.HasPreviousPage !== undefined ? data.HasPreviousPage : (data.hasPreviousPage !== undefined ? data.hasPreviousPage : pageIndex > 1);
        const hasNextPage = data.HasNextPage !== undefined ? data.HasNextPage : (data.hasNextPage !== undefined ? data.hasNextPage : pageIndex < totalPages);
        
        return {
          items: items.map((item: any) => ({
            courseId: item.CourseId || item.courseId,
            title: item.Title || item.title,
            description: item.Description || item.description,
            teacherId: item.TeacherId || item.teacherId,
            teacherName: item.TeacherName || item.teacherName,
            subjectId: item.SubjectId || item.subjectId,
            subjectName: item.SubjectName || item.subjectName,
            price: item.Price || item.price,
            isFree: item.IsFree !== undefined ? item.IsFree : (item.isFree !== undefined ? item.isFree : true),
            thumbnailUrl: item.ThumbnailUrl || item.thumbnailUrl,
            durationMinutes: item.DurationMinutes || item.durationMinutes,
            level: item.Level || item.level,
            status: item.Status || item.status,
            createdAt: item.CreatedAt || item.createdAt,
            updatedAt: item.UpdatedAt || item.updatedAt,
          })),
          total,
          pageIndex,
          pageSize,
          totalPages,
          hasPreviousPage,
          hasNextPage,
        };
      }
      
      // Nếu đã đúng format rồi (fallback)
      return data as PagedResponse<CourseListItemDto>;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // Lấy chi tiết khóa học theo ID
  async getCourseById(id: number): Promise<CourseDetailDto> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.courses.getById(String(id)));
      // BE trả về ApiResponse { Success, Message, Data: CourseListItemDto, StatusCode }
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      // Map từ backend format
      return {
        courseId: data.CourseId || data.courseId,
        title: data.Title || data.title,
        description: data.Description || data.description,
        teacherId: data.TeacherId || data.teacherId,
        teacherName: data.TeacherName || data.teacherName,
        subjectId: data.SubjectId || data.subjectId,
        subjectName: data.SubjectName || data.subjectName,
        price: data.Price || data.price,
        isFree: data.IsFree !== undefined ? data.IsFree : (data.isFree !== undefined ? data.isFree : true),
        thumbnailUrl: data.ThumbnailUrl || data.thumbnailUrl,
        durationMinutes: data.DurationMinutes || data.durationMinutes,
        level: data.Level || data.level,
        status: data.Status || data.status,
        createdAt: data.CreatedAt || data.createdAt,
        updatedAt: data.UpdatedAt || data.updatedAt,
      } as CourseDetailDto;
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      throw error;
    }
  }

  // Tạo khóa học mới
  async createCourse(courseData: CreateCourseRequest): Promise<CourseDetailDto> {
    try {
      // Ensure teacherId is a number
      const payload = {
        ...courseData,
        teacherId: courseData.teacherId ? Number(courseData.teacherId) : undefined,
        subjectId: courseData.subjectId ? Number(courseData.subjectId) : undefined,
        price: courseData.price ? Number(courseData.price) : undefined,
        durationMinutes: courseData.durationMinutes ? Number(courseData.durationMinutes) : undefined,
      };
      console.log('📤 Creating course with data:', JSON.stringify(payload, null, 2));
      const res = await apiService.post<any>(API_ENDPOINTS.courses.create, payload);
      // BE trả về ApiResponse { Success, Message, Data: CourseListItemDto, StatusCode }
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      // Map từ backend format
      return {
        courseId: data.CourseId || data.courseId,
        title: data.Title || data.title,
        description: data.Description || data.description,
        teacherId: data.TeacherId || data.teacherId,
        teacherName: data.TeacherName || data.teacherName,
        subjectId: data.SubjectId || data.subjectId,
        subjectName: data.SubjectName || data.subjectName,
        price: data.Price || data.price,
        isFree: data.IsFree !== undefined ? data.IsFree : (data.isFree !== undefined ? data.isFree : true),
        thumbnailUrl: data.ThumbnailUrl || data.thumbnailUrl,
        durationMinutes: data.DurationMinutes || data.durationMinutes,
        level: data.Level || data.level,
        status: data.Status || data.status,
        createdAt: data.CreatedAt || data.createdAt,
        updatedAt: data.UpdatedAt || data.updatedAt,
      } as CourseDetailDto;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // Cập nhật khóa học
  async updateCourse(id: number, courseData: UpdateCourseRequest): Promise<CourseDetailDto> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.courses.update(String(id)), courseData);
      // BE trả về ApiResponse { Success, Message, Data: CourseListItemDto, StatusCode }
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response format from server');
      }
      // Map từ backend format
      return {
        courseId: data.CourseId || data.courseId,
        title: data.Title || data.title,
        description: data.Description || data.description,
        teacherId: data.TeacherId || data.teacherId,
        teacherName: data.TeacherName || data.teacherName,
        subjectId: data.SubjectId || data.subjectId,
        subjectName: data.SubjectName || data.subjectName,
        price: data.Price || data.price,
        isFree: data.IsFree !== undefined ? data.IsFree : (data.isFree !== undefined ? data.isFree : true),
        thumbnailUrl: data.ThumbnailUrl || data.thumbnailUrl,
        durationMinutes: data.DurationMinutes || data.durationMinutes,
        level: data.Level || data.level,
        status: data.Status || data.status,
        createdAt: data.CreatedAt || data.createdAt,
        updatedAt: data.UpdatedAt || data.updatedAt,
      } as CourseDetailDto;
    } catch (error) {
      console.error(`Error updating course ${id}:`, error);
      throw error;
    }
  }

  // Xóa khóa học
  async deleteCourse(id: number): Promise<void> {
    try {
      await apiService.delete<any>(API_ENDPOINTS.courses.delete(String(id)));
    } catch (error) {
      console.error(`Error deleting course ${id}:`, error);
      throw error;
    }
  }

  // Upload thumbnail image
  async uploadCourseImage(formData: FormData): Promise<{ url: string }> {
    try {
      const endpoint = `${API_ENDPOINTS.courses.getAll}/upload-image`;
      const res = await apiService.post<any>(endpoint, formData, {
        'Content-Type': 'multipart/form-data',
      });
      // BE trả về ApiResponse { Success, Message, Data: { url }, StatusCode }
      const data = res.Data || res.data;
      if (!data) {
        throw new Error('Invalid response from server: No data field');
      }
      const url = data.url || data.Url;
      if (!url) {
        throw new Error('Invalid response from server: No url field');
      }
      return { url };
    } catch (error) {
      console.error('Error uploading course image:', error);
      throw error;
    }
  }
}

export const coursesService = new CoursesService();
export default coursesService;

