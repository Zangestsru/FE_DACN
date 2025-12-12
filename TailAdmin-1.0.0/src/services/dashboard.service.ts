// Dashboard Service for Education Dashboard
// Fetches data from multiple services and aggregates for dashboard display

import { statisticsService } from './statistics.service';
import { apiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export interface DashboardMetrics {
  totalTeachers: number;
  totalStudents: number;
  activeCourses: number;
  completionRate: number;
  teacherChange: number; // percentage change from last month
  studentChange: number;
  courseChange: number;
  completionChange: number;
}

export interface EnrollmentDataPoint {
  month: string;
  newRegistrations: number;
  activeStudents: number;
  completedCourses: number;
}

export interface RecentActivity {
  id: string | number;
  type: 'enrollment' | 'completion' | 'assignment' | 'exam' | 'course_created';
  title: string;
  description: string;
  time: string;
  user: string;
  timestamp: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  enrollmentData: EnrollmentDataPoint[];
  recentActivities: RecentActivity[];
}

class DashboardService {
  // Get dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Fetch data from multiple sources
      let totalTeachers = 0;
      let totalStudents = 0;
      let activeCourses = 0;
      let completionRate = 0;

      // 1. Fetch user stats from AuthService (/Admin/statistics)
      try {
        const adminStats = await apiService.get<any>(API_ENDPOINTS.admin.statistics);
        const stats = adminStats?.data || adminStats?.Data || adminStats;

        console.log('Dashboard AuthService Response:', stats);

        if (stats) {
          const usersData = stats.Users || stats.users || {};
          totalTeachers = usersData.TotalTeachers ?? usersData.totalTeachers ?? 0;
          totalStudents = usersData.TotalStudents ?? usersData.totalStudents ?? 0;
        }
      } catch (error) {
        console.log('Auth statistics not available');
      }

      // 2. Fetch courses count from Courses API
      try {
        const coursesResponse = await apiService.get<any>('/Courses');
        const coursesData = coursesResponse?.data || coursesResponse?.Data || coursesResponse;

        console.log('Dashboard Courses Response:', coursesData);

        if (Array.isArray(coursesData)) {
          activeCourses = coursesData.length;
        } else if (coursesData?.data && Array.isArray(coursesData.data)) {
          activeCourses = coursesData.data.length;
        } else if (coursesData?.total) {
          activeCourses = coursesData.total;
        }
      } catch (error) {
        console.log('Courses API not available');
      }

      // 3. Fetch completion rate from Statistics API
      try {
        const statsResponse = await apiService.get<any>('/Statistics/overall');
        const overallStats = statsResponse?.data || statsResponse?.Data || statsResponse;

        console.log('Dashboard Statistics Response:', overallStats);

        if (overallStats) {
          completionRate = overallStats.passRate ?? overallStats.PassRate ?? overallStats.completionRate ?? overallStats.CompletionRate ?? overallStats.averageScore ?? 0;
          // If we don't have courses count yet, try from stats
          if (activeCourses === 0) {
            activeCourses = overallStats.totalCourses ?? overallStats.TotalCourses ?? overallStats.activeCourses ?? overallStats.ActiveCourses ?? 0;
          }
        }
      } catch (error) {
        console.log('Statistics API not available');
      }

      return {
        totalTeachers,
        totalStudents,
        activeCourses,
        completionRate,
        teacherChange: 12,
        studentChange: 8,
        courseChange: 5,
        completionChange: -2,
      };
    } catch (error) {
      console.warn('Error fetching dashboard metrics, using mock data:', error);
      // Return mock data when backend is not available
      return {
        totalTeachers: 248,
        totalStudents: 3247,
        activeCourses: 156,
        completionRate: 87.5,
        teacherChange: 12,
        studentChange: 8,
        courseChange: 5,
        completionChange: -2,
      };
    }
  }

  // Get enrollment chart data
  async getEnrollmentData(): Promise<EnrollmentDataPoint[]> {
    try {
      // Try to fetch from API
      const response = await apiService.get<any>('/Statistics/enrollment-trends');
      const data = response?.data || response?.Data || response;

      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          month: item.month || item.Month || '',
          newRegistrations: item.newRegistrations ?? item.NewRegistrations ?? 0,
          activeStudents: item.activeStudents ?? item.ActiveStudents ?? 0,
          completedCourses: item.completedCourses ?? item.CompletedCourses ?? 0,
        }));
      }
    } catch (error) {
      console.log('Enrollment trends endpoint not available, using mock data');
    }

    // Return mock data
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    return months.map((month, index) => ({
      month,
      newRegistrations: 120 + index * 15,
      activeStudents: 2800 + index * 40,
      completedCourses: 45 + index * 4,
    }));
  }

  // Get recent activities
  async getRecentActivities(limit: number = 5): Promise<RecentActivity[]> {
    try {
      // Try to fetch from API
      const response = await apiService.get<any>(`/Statistics/recent-activities?limit=${limit}`);
      const data = response?.data || response?.Data || response;

      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id || item.Id || Math.random(),
          type: (item.type || item.Type || 'enrollment') as RecentActivity['type'],
          title: item.title || item.Title || '',
          description: item.description || item.Description || '',
          time: this.formatTimeAgo(item.timestamp || item.Timestamp || item.createdAt || item.CreatedAt),
          user: item.user || item.User || item.userName || item.UserName || '',
          timestamp: item.timestamp || item.Timestamp || item.createdAt || item.CreatedAt || new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.log('Recent activities endpoint not available, using mock data');
    }

    // Return mock data
    return [
      {
        id: 1,
        type: 'enrollment',
        title: 'Đăng ký khóa học mới',
        description: 'Nguyễn Văn A đã đăng ký khóa Toán học cơ bản',
        time: '5 phút trước',
        user: 'Nguyễn Văn A',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        type: 'completion',
        title: 'Hoàn thành bài tập',
        description: 'Trần Thị B đã hoàn thành bài tập Vật lý',
        time: '15 phút trước',
        user: 'Trần Thị B',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        type: 'exam',
        title: 'Thi kết thúc môn',
        description: 'Lớp 12A1 đã hoàn thành kỳ thi Hóa học',
        time: '1 giờ trước',
        user: 'Lớp 12A1',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        type: 'assignment',
        title: 'Giao bài tập mới',
        description: 'GV. Phạm Văn C đã giao bài tập Văn học',
        time: '2 giờ trước',
        user: 'GV. Phạm Văn C',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 5,
        type: 'enrollment',
        title: 'Học sinh mới',
        description: 'Lê Thị D đã được thêm vào hệ thống',
        time: '3 giờ trước',
        user: 'Lê Thị D',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  // Helper to format time ago
  private formatTimeAgo(timestamp: string): string {
    if (!timestamp) return 'Vừa xong';

    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return time.toLocaleDateString('vi-VN');
  }

  // Get all dashboard data
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [metrics, enrollmentData, recentActivities] = await Promise.all([
        this.getDashboardMetrics(),
        this.getEnrollmentData(),
        this.getRecentActivities(5),
      ]);

      return {
        metrics,
        enrollmentData,
        recentActivities,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return mock data as fallback
      const enrollmentData = await this.getEnrollmentData();
      const recentActivities = await this.getRecentActivities(5);
      return {
        metrics: {
          totalTeachers: 248,
          totalStudents: 3247,
          activeCourses: 156,
          completionRate: 87.5,
          teacherChange: 12,
          studentChange: 8,
          courseChange: 5,
          completionChange: -2,
        },
        enrollmentData,
        recentActivities,
      };
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
