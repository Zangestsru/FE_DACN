/**
 * API Types
 * Chứa tất cả các types liên quan đến API responses và requests
 */

import { IUser, IAuthToken } from './user.types';
import { IExam, IExamResult } from './exam.types';
import { ICourse } from './course.types';

// ==================== GENERIC API RESPONSE TYPES ====================

/**
 * Generic API Response wrapper
 */
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: IApiError;
  timestamp?: string;
}

/**
 * API Error interface
 */
export interface IApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

/**
 * Paginated API Response
 */
export interface IPaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: IPagination;
  message?: string;
}

/**
 * Pagination metadata
 */
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==================== AUTH API TYPES ====================

/**
 * Login request
 */
export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Login response
 */
export interface ILoginResponse {
  user: IUser;
  token: IAuthToken;
  message: string;
}

/**
 * Register request
 */
export interface IRegisterRequest {
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

/**
 * Register response
 */
export interface IRegisterResponse {
  user: IUser;
  token?: IAuthToken;
  message: string;
  requiresVerification?: boolean;
}

/**
 * OTP verification request
 */
export interface IOTPVerifyRequest {
  type: 'email' | 'phone';
  contact: string;
  code: string;
}

/**
 * OTP verification response
 */
export interface IOTPVerifyResponse {
  verified: boolean;
  message: string;
  token?: IAuthToken;
}

/**
 * Password reset request
 */
export interface IPasswordResetRequest {
  email?: string;
  phone?: string;
  verificationCode: string;
  newPassword: string;
}

/**
 * Password reset response
 */
export interface IPasswordResetResponse {
  success: boolean;
  message: string;
}

// ==================== EXAM API TYPES ====================

/**
 * Get exams request
 */
export interface IGetExamsRequest {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  difficulty?: string;
  search?: string;
  sortBy?: 'price' | 'rating' | 'students' | 'date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get exams response
 */
export interface IGetExamsResponse extends IPaginatedResponse<IExam> {}

/**
 * Get exam detail response
 */
export interface IGetExamDetailResponse {
  exam: IExam;
  relatedExams?: IExam[];
}

/**
 * Submit exam request
 */
export interface ISubmitExamRequest {
  examId: string | number;
  answers: { [key: number]: number };
  timeSpent: number;
  startedAt: string;
  submittedAt: string;
}

/**
 * Submit exam response
 */
export interface ISubmitExamResponse {
  result: IExamResult;
  certificate?: ICertificate;
  message: string;
}

/**
 * Certificate interface
 */
export interface ICertificate {
  id: string;
  examId: string | number;
  userId: string | number;
  certificateNumber: string;
  issuedAt: Date | string;
  expiresAt?: Date | string;
  downloadUrl?: string;
}

// ==================== COURSE API TYPES ====================

/**
 * Get courses request
 */
export interface IGetCoursesRequest {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  search?: string;
  sortBy?: 'price' | 'rating' | 'students' | 'date';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get courses response
 */
export interface IGetCoursesResponse extends IPaginatedResponse<ICourse> {}

/**
 * Get course detail response
 */
export interface IGetCourseDetailResponse {
  course: ICourse;
  relatedCourses?: ICourse[];
  isEnrolled?: boolean;
  progress?: number;
}

/**
 * Enroll course request
 */
export interface IEnrollCourseRequest {
  courseId: string | number;
  paymentMethod?: string;
}

/**
 * Enroll course response
 */
export interface IEnrollCourseResponse {
  enrollment: ICourseEnrollment;
  message: string;
}

/**
 * Course enrollment interface
 */
export interface ICourseEnrollment {
  id: string;
  courseId: string | number;
  userId: string | number;
  enrolledAt: Date | string;
  expiresAt?: Date | string;
  status: 'active' | 'completed' | 'expired';
}

// ==================== PAYMENT API TYPES ====================

/**
 * Payment request
 */
export interface IPaymentRequest {
  examId?: string | number;
  courseId?: string | number;
  amount: number;
  paymentMethod: 'momo' | 'vnpay' | 'credit-card' | 'bank-transfer';
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    idNumber?: string;
  };
}

/**
 * Payment response
 */
export interface IPaymentResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  paymentUrl?: string;
  qrCode?: string;
  message: string;
}

/**
 * Payment verification response
 */
export interface IPaymentVerifyResponse {
  paymentId: string;
  status: 'success' | 'failed';
  transactionId?: string;
  paidAt?: Date | string;
  message: string;
}

// ==================== STATISTICS API TYPES ====================

/**
 * User statistics response
 */
export interface IUserStatisticsResponse {
  totalExams: number;
  completedExams: number;
  passedExams: number;
  failedExams: number;
  averageScore: number;
  totalCourses: number;
  completedCourses: number;
  certificates: number;
}

/**
 * Exam statistics response
 */
export interface IExamStatisticsResponse {
  examId: string | number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  averageTime: number;
}

// ==================== FILE UPLOAD TYPES ====================

/**
 * File upload request
 */
export interface IFileUploadRequest {
  file: File;
  type: 'avatar' | 'document' | 'certificate' | 'report';
}

/**
 * File upload response
 */
export interface IFileUploadResponse {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date | string;
}

// ==================== NOTIFICATION TYPES ====================

/**
 * Notification interface
 */
export interface INotification {
  id: string;
  userId: string | number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  link?: string;
}

/**
 * Get notifications response
 */
export interface IGetNotificationsResponse extends IPaginatedResponse<INotification> {}

