import { ApiService } from './api.service';

export interface CourseFeedback {
  feedbackId: number;
  userId: number;
  courseId: number;
  stars: number;
  comment?: string;
  createdAt: string;
  userName?: string;
  courseTitle?: string;
}

export interface CourseFeedbackResponse {
  success: boolean;
  data: CourseFeedback[];
}

class CourseFeedbackService extends ApiService {

  // Get all course feedbacks (from all courses)
  async getAllCourseFeedbacks(): Promise<CourseFeedback[]> {
    try {
      // First, get all courses
      const coursesResponse = await fetch(`${this.baseUrl}/Courses`, {
        method: 'GET',
        headers: await this.getHeaders() as HeadersInit,
      });
      
      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const coursesData = await coursesResponse.json();
      const courses = coursesData?.Data?.Items || coursesData?.data?.items || coursesData?.Items || coursesData?.items || coursesData || [];
      
      // Get feedbacks for all courses
      const allFeedbacks: CourseFeedback[] = [];
      
      for (const course of courses) {
        try {
          const courseId = course.courseId || course.CourseId || course.id || course.Id;
          if (!courseId) continue;
          
          const headers = await this.getHeaders() as HeadersInit;
          const feedbackResponse = await fetch(`${this.baseUrl}/Courses/${courseId}/reviews`, {
            method: 'GET',
            headers: headers,
          });
          
          if (feedbackResponse.ok) {
            const feedbackData: any = await feedbackResponse.json();
            // Backend returns: { Success: true, Data: [{ id, name, rating, comment, date, avatar }] }
            const reviews = feedbackData?.Data || feedbackData?.data || feedbackData || [];
            
            if (Array.isArray(reviews) && reviews.length > 0) {
              // Map backend format to CourseFeedback format
              const feedbacksWithCourse = reviews.map((review: any) => ({
                feedbackId: review.id || review.feedbackId || review.Id,
                userId: review.userId || review.UserId || 0,
                courseId: courseId,
                stars: review.rating || review.Rating || review.stars || 0,
                comment: review.comment || review.Comment || '',
                createdAt: review.date || review.createdAt || review.CreatedAt || new Date().toISOString(),
                userName: review.name || review.userName || 'Người dùng',
                courseTitle: course.title || course.Title || course.name || `Course ${courseId}`,
              }));
              allFeedbacks.push(...feedbacksWithCourse);
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch feedback for course ${course.courseId || course.id}:`, err);
        }
      }
      
      // Sort by created date (newest first)
      return allFeedbacks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching course feedbacks:', error);
      throw new Error('Không thể tải danh sách đánh giá khóa học');
    }
  }

  // Get feedbacks for a specific course
  async getCourseFeedbacks(courseId: number): Promise<CourseFeedback[]> {
    try {
      const headers = await this.getHeaders() as HeadersInit;
      const response = await fetch(`${this.baseUrl}/Courses/${courseId}/reviews`, {
        method: 'GET',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch course feedbacks');
      }
      
      const data: any = await response.json();
      const reviews = data?.Data || data?.data || data || [];
      
      // Map backend format to CourseFeedback format
      return Array.isArray(reviews) ? reviews.map((review: any) => ({
        feedbackId: review.id || review.feedbackId || review.Id,
        userId: review.userId || review.UserId || 0,
        courseId: courseId,
        stars: review.rating || review.Rating || review.stars || 0,
        comment: review.comment || review.Comment || '',
        createdAt: review.date || review.createdAt || review.CreatedAt || new Date().toISOString(),
        userName: review.name || review.userName || 'Người dùng',
      })) : [];
    } catch (error) {
      console.error('Error fetching course feedbacks:', error);
      throw new Error('Không thể tải đánh giá khóa học');
    }
  }

  // Delete course feedback
  async deleteCourseFeedback(feedbackId: number): Promise<void> {
    try {
      // Note: This endpoint might need to be implemented in the backend
      // For now, we'll use a similar pattern to exam feedback
      const headers = await this.getHeaders() as HeadersInit;
      const response = await fetch(`${this.baseUrl}/Feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting course feedback:', error);
      throw new Error('Không thể xóa đánh giá');
    }
  }
}

export const courseFeedbackService = new CourseFeedbackService();

