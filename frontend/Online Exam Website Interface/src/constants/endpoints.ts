/**
 * API Endpoints
 * Định nghĩa tất cả các API endpoints trong ứng dụng
 * 
 * Quy tắc đặt tên:
 * - Sử dụng UPPERCASE cho tên constant
 * - Group theo module (AUTH, EXAM, USER, COURSE, etc.)
 * - Sử dụng prefix để dễ phân biệt (AUTH_, EXAM_, USER_, etc.)
 */

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * Authentication & Authorization Endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/Auth/login',
  REGISTER: '/Auth/register',
  LOGOUT: '/Auth/logout',
  REFRESH_TOKEN: '/Auth/refresh',
  FORGOT_PASSWORD: '/Auth/forgot-password',
  RESET_PASSWORD: '/Auth/reset-password',
  VERIFY_OTP: '/Auth/verify-otp',
  VERIFY_LOGIN_OTP: '/Auth/verify-login-otp',
  RESEND_OTP: '/Auth/resend-otp',
  CHANGE_PASSWORD: '/Auth/change-password',
  VERIFY_EMAIL: '/Auth/verify-email',
  GOOGLE_LOGIN: '/Auth/google',
  FACEBOOK_LOGIN: '/Auth/facebook',
} as const;

// ==================== USER ENDPOINTS ====================

/**
 * User Management Endpoints
 */
export const USER_ENDPOINTS = {
  
  // Cập nhật profile (bao gồm ngày sinh)
  UPDATE_PROFILE: '/Users/profile',
  
  // Cập nhật avatar
  UPDATE_AVATAR: '/Users/upload-avatar',
  
  // Lấy thông tin user theo ID
  GET_BY_ID: (id: string | number) => `/Users/${id}`,
  
  // Lấy danh sách users
  LIST: '/Users',
  
  // Xóa user
  DELETE: (id: string | number) => `/Users/${id}`,
  
  // Lấy lịch sử hoạt động
  ACTIVITY_HISTORY: '/Users/activity',
  
  // Lấy thống kê user
  STATISTICS: '/Users/statistics',
} as const;

// ==================== EXAM ENDPOINTS ====================

/**
 * Exam Management Endpoints
 */
export const EXAM_ENDPOINTS = {
  // Lấy danh sách bài thi
  LIST: '/Exams',
  
  // Lấy chi tiết bài thi
  GET_BY_ID: (id: string | number) => `/Exams/${id}`,
  
  // Tạo bài thi mới (Admin)
  CREATE: '/exams',
  
  // Cập nhật bài thi (Admin)
  UPDATE: (id: string | number) => `/exams/${id}`,
  
  // Xóa bài thi (Admin)
  DELETE: (id: string | number) => `/exams/${id}`,
  
  // Đăng ký thi
  REGISTER: (id: string | number) => `/exams/${id}/register`,
  
  // Bắt đầu làm bài thi
  START: (id: string | number) => `/exams/${id}/start`,
  
  // Nộp bài thi
  SUBMIT: (id: string | number) => `/exams/${id}/submit`,
  
  // Lấy kết quả bài thi
  RESULT: (id: string | number) => `/exams/${id}/result`,
  
  // Lấy danh sách kết quả của user
  MY_RESULTS: '/exams/my-results',
  
  // Lấy câu hỏi của bài thi
  QUESTIONS: (id: string | number) => `/exams/${id}/questions`,
  
  // Lấy thống kê bài thi
  STATISTICS: (id: string | number) => `/exams/${id}/statistics`,
  
  // Báo cáo sự cố
  REPORT_ISSUE: (id: string | number) => `/exams/${id}/report`,
  
  // Lấy bài thi liên quan
  RELATED: (id: string | number) => `/exams/${id}/related`,
  
  // Tìm kiếm bài thi
  SEARCH: '/exams/search',
  
  // Lọc bài thi theo category
  BY_CATEGORY: (category: string) => `/exams/category/${category}`,
  
  // Lọc bài thi theo level
  BY_LEVEL: (level: string) => `/exams/level/${level}`,
} as const;

// ==================== CERTIFICATION ENDPOINTS ====================

/**
 * Certification Exam Endpoints
 */
export const CERTIFICATION_ENDPOINTS = {
  // Lấy danh sách chứng chỉ
  LIST: '/certifications',
  
  // Lấy chi tiết chứng chỉ
  GET_BY_ID: (id: string | number) => `/certifications/${id}`,
  
  // Lấy chứng chỉ của user
  MY_CERTIFICATES: '/certifications/my-certificates',
  
  // Download chứng chỉ
  DOWNLOAD: (id: string | number) => `/certifications/${id}/download`,
  
  // Xác thực chứng chỉ
  VERIFY: (certificateNumber: string) => `/certifications/verify/${certificateNumber}`,
} as const;

// ==================== COURSE ENDPOINTS ====================

/**
 * Course & Study Material Endpoints
 */
export const COURSE_ENDPOINTS = {
  // Lấy danh sách khóa học
  LIST: '/courses',
  
  // Lấy chi tiết khóa học
  GET_BY_ID: (id: string | number) => `/courses/${id}`,
  
  // Tạo khóa học mới (Admin/Instructor)
  CREATE: '/courses',
  
  // Cập nhật khóa học
  UPDATE: (id: string | number) => `/courses/${id}`,
  
  // Xóa khóa học
  DELETE: (id: string | number) => `/courses/${id}`,
  
  // Đăng ký khóa học
  ENROLL: (id: string | number) => `/courses/${id}/enroll`,
  
  // Hủy đăng ký khóa học
  UNENROLL: (id: string | number) => `/courses/${id}/unenroll`,
  
  // Lấy khóa học đã đăng ký
  MY_COURSES: '/courses/my-courses',
  
  // Lấy tiến độ học tập
  PROGRESS: (id: string | number) => `/courses/${id}/progress`,
  
  // Cập nhật tiến độ
  UPDATE_PROGRESS: (id: string | number) => `/courses/${id}/progress`,
  
  // Lấy danh sách bài học
  LESSONS: (id: string | number) => `/courses/${id}/lessons`,
  
  // Lấy chi tiết bài học
  LESSON_DETAIL: (courseId: string | number, lessonId: string | number) => 
    `/courses/${courseId}/lessons/${lessonId}`,
  
  // Đánh dấu bài học hoàn thành
  COMPLETE_LESSON: (courseId: string | number, lessonId: string | number) => 
    `/courses/${courseId}/lessons/${lessonId}/complete`,
  
  // Lấy đánh giá khóa học
  REVIEWS: (id: string | number) => `/courses/${id}/reviews`,
  
  // Thêm đánh giá
  ADD_REVIEW: (id: string | number) => `/courses/${id}/reviews`,
  
  // Lấy khóa học liên quan
  RELATED: (id: string | number) => `/courses/${id}/related`,
  
  // Tìm kiếm khóa học
  SEARCH: '/courses/search',
  
  // Lọc theo category
  BY_CATEGORY: (category: string) => `/courses/category/${category}`,
} as const;

// ==================== LESSON ENDPOINTS ====================

/**
 * Lesson Management Endpoints
 */
export const LESSON_ENDPOINTS = {
  // Lấy tài liệu bài học
  MATERIALS: (lessonId: string | number) => `/lessons/${lessonId}/materials`,
  
  // Download tài liệu
  DOWNLOAD_MATERIAL: (lessonId: string | number, materialId: string | number) => 
    `/lessons/${lessonId}/materials/${materialId}/download`,
  
  // Lấy ghi chú bài học
  NOTES: (lessonId: string | number) => `/lessons/${lessonId}/notes`,
  
  // Thêm ghi chú
  ADD_NOTE: (lessonId: string | number) => `/lessons/${lessonId}/notes`,
  
  // Cập nhật ghi chú
  UPDATE_NOTE: (lessonId: string | number, noteId: string | number) => 
    `/lessons/${lessonId}/notes/${noteId}`,
  
  // Xóa ghi chú
  DELETE_NOTE: (lessonId: string | number, noteId: string | number) => 
    `/lessons/${lessonId}/notes/${noteId}`,
} as const;

// ==================== PAYMENT ENDPOINTS ====================

/**
 * Payment Processing Endpoints
 */
export const PAYMENT_ENDPOINTS = {
  // Tạo payment
  CREATE: '/payments',
  
  // Xác thực payment
  VERIFY: '/payments/verify',
  
  // Lấy lịch sử thanh toán
  HISTORY: '/payments/history',
  
  // Lấy chi tiết payment
  GET_BY_ID: (id: string | number) => `/payments/${id}`,
  
  // Hủy payment
  CANCEL: (id: string | number) => `/payments/${id}/cancel`,
  
  // Hoàn tiền
  REFUND: (id: string | number) => `/payments/${id}/refund`,
  
  // MoMo callback
  MOMO_CALLBACK: '/payments/momo/callback',
  
  // VNPay callback
  VNPAY_CALLBACK: '/payments/vnpay/callback',
  
  // PayPal callback
  PAYPAL_CALLBACK: '/payments/paypal/callback',
} as const;

// ==================== NOTIFICATION ENDPOINTS ====================

/**
 * Notification Management Endpoints
 */
export const NOTIFICATION_ENDPOINTS = {
  // Lấy danh sách thông báo
  LIST: '/notifications',
  
  // Đánh dấu đã đọc
  MARK_AS_READ: (id: string | number) => `/notifications/${id}/read`,
  
  // Đánh dấu tất cả đã đọc
  MARK_ALL_AS_READ: '/notifications/read-all',
  
  // Xóa thông báo
  DELETE: (id: string | number) => `/notifications/${id}`,
  
  // Xóa tất cả
  DELETE_ALL: '/notifications/delete-all',
  
  // Lấy số lượng thông báo chưa đọc
  UNREAD_COUNT: '/notifications/unread-count',
} as const;

// ==================== UPLOAD ENDPOINTS ====================

/**
 * File Upload Endpoints
 */
export const UPLOAD_ENDPOINTS = {
  // Upload avatar
  AVATAR: '/upload/avatar',
  
  // Upload document
  DOCUMENT: '/upload/document',
  
  // Upload image
  IMAGE: '/upload/image',
  
  // Upload video
  VIDEO: '/upload/video',
  
  // Upload certificate
  CERTIFICATE: '/upload/certificate',
  
  // Upload report attachment
  REPORT_ATTACHMENT: '/upload/report',
} as const;

// ==================== STATISTICS ENDPOINTS ====================

/**
 * Statistics & Analytics Endpoints
 */
export const STATISTICS_ENDPOINTS = {
  // Dashboard statistics
  DASHBOARD: '/statistics/dashboard',
  
  // User statistics
  USER: '/statistics/user',
  
  // Exam statistics
  EXAM: '/statistics/exam',
  
  // Course statistics
  COURSE: '/statistics/course',
  
  // Revenue statistics (Admin)
  REVENUE: '/statistics/revenue',
  
  // Popular exams
  POPULAR_EXAMS: '/statistics/popular-exams',
  
  // Popular courses
  POPULAR_COURSES: '/statistics/popular-courses',
} as const;

// ==================== ADMIN ENDPOINTS ====================

/**
 * Admin Management Endpoints
 */
export const ADMIN_ENDPOINTS = {
  // User management
  USERS: '/admin/users',
  USER_DETAIL: (id: string | number) => `/admin/users/${id}`,
  
  // Exam management
  EXAMS: '/admin/exams',
  EXAM_DETAIL: (id: string | number) => `/admin/exams/${id}`,
  
  // Course management
  COURSES: '/admin/courses',
  COURSE_DETAIL: (id: string | number) => `/admin/courses/${id}`,
  
  // Payment management
  PAYMENTS: '/admin/payments',
  PAYMENT_DETAIL: (id: string | number) => `/admin/payments/${id}`,
  
  // Reports
  REPORTS: '/admin/reports',
  
  // System settings
  SETTINGS: '/admin/settings',
} as const;

// ==================== EXPORT ALL ENDPOINTS ====================

/**
 * Export tất cả endpoints để dễ sử dụng
 */
export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  USER: USER_ENDPOINTS,
  EXAM: EXAM_ENDPOINTS,
  CERTIFICATION: CERTIFICATION_ENDPOINTS,
  COURSE: COURSE_ENDPOINTS,
  LESSON: LESSON_ENDPOINTS,
  PAYMENT: PAYMENT_ENDPOINTS,
  NOTIFICATION: NOTIFICATION_ENDPOINTS,
  UPLOAD: UPLOAD_ENDPOINTS,
  STATISTICS: STATISTICS_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
} as const;

export default API_ENDPOINTS;

