// Lessons Service for TailAdmin
// Manages course lessons API calls

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface Lesson {
  lessonId: number;
  courseId: number;
  title: string;
  description?: string;
  content?: string;
  type?: string; // video, document, quiz, assignment
  videoUrl?: string;
  contentUrl?: string;
  durationSeconds?: number;
  orderIndex?: number;
  isFree: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLessonRequest {
  courseId: number;
  title: string;
  description?: string;
  content?: string;
  type?: string;
  videoUrl?: string;
  contentUrl?: string;
  durationSeconds?: number;
  orderIndex?: number;
  isFree?: boolean;
  questionIds?: number[]; // IDs của câu hỏi từ ngân hàng
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  content?: string;
  type?: string;
  videoUrl?: string;
  contentUrl?: string;
  durationSeconds?: number;
  orderIndex?: number;
  isFree?: boolean;
}

class LessonsService {
  // Get lessons by course ID
  async getLessonsByCourseId(courseId: string | number): Promise<Lesson[]> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.lessons.getByCourseId(courseId));
      const data = res.Data || res.data || res;
      
      // Backend trả về: { message, data: [...] }
      if (data && typeof data === 'object' && Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching lessons for course ${courseId}:`, error);
      return [];
    }
  }

  // Get lesson by ID
  async getLessonById(id: string | number): Promise<Lesson> {
    try {
      const res = await apiService.get<any>(API_ENDPOINTS.lessons.getById(String(id)));
      const data = res.Data || res.data || res;
      
      if (data && typeof data === 'object' && data.data) {
        return data.data;
      }
      return data as Lesson;
    } catch (error) {
      console.error(`Error fetching lesson ${id}:`, error);
      throw error;
    }
  }

  // Create new lesson
  async createLesson(request: CreateLessonRequest): Promise<Lesson> {
    try {
      console.log('📤 Creating lesson:', request);
      const res = await apiService.post<any>(API_ENDPOINTS.lessons.create, request);
      const data = res.Data || res.data || res;
      
      if (data && typeof data === 'object' && data.data) {
        return data.data;
      }
      return data as Lesson;
    } catch (error: any) {
      console.error('❌ Error creating lesson:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi tạo bài học';
      throw new Error(errorMessage);
    }
  }

  // Update lesson
  async updateLesson(id: string | number, request: UpdateLessonRequest): Promise<Lesson> {
    try {
      const res = await apiService.put<any>(API_ENDPOINTS.lessons.update(String(id)), request);
      const data = res.Data || res.data || res;
      
      if (data && typeof data === 'object' && data.data) {
        return data.data;
      }
      return data as Lesson;
    } catch (error: any) {
      console.error(`Error updating lesson ${id}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật bài học';
      throw new Error(errorMessage);
    }
  }

  // Delete lesson
  async deleteLesson(id: string | number): Promise<void> {
    try {
      await apiService.delete(API_ENDPOINTS.lessons.delete(String(id)));
    } catch (error: any) {
      console.error(`Error deleting lesson ${id}:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi xóa bài học';
      throw new Error(errorMessage);
    }
  }
}

export const lessonsService = new LessonsService();
export default lessonsService;

