/**
 * Constants Index
 * Export tất cả constants từ một điểm trung tâm
 */

// ==================== EXPORT ENDPOINTS ====================
export * from './endpoints';

// ==================== APP SETTINGS ====================

/**
 * Pagination Settings
 */
export const PAGINATION = {
  // Số items mặc định trên mỗi trang
  DEFAULT_PAGE_SIZE: 10,
  
  // Số items cho danh sách exam
  EXAM_PAGE_SIZE: 12,
  
  // Số items cho danh sách course
  COURSE_PAGE_SIZE: 9,
  
  // Số items cho danh sách user (Admin)
  USER_PAGE_SIZE: 20,
  
  // Số items cho notification
  NOTIFICATION_PAGE_SIZE: 15,
  
  // Trang đầu tiên
  FIRST_PAGE: 1,
  
  // Các options cho page size
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * Timeout Settings
 */
export const TIMEOUT = {
  // Timeout mặc định cho request (ms)
  DEFAULT: 30000, // 30 seconds
  
  // Timeout cho upload (ms)
  UPLOAD: 120000, // 2 minutes
  
  // Timeout cho download (ms)
  DOWNLOAD: 180000, // 3 minutes
  
  // Timeout cho exam (ms)
  EXAM: 300000, // 5 minutes
  
  // Debounce delay cho search (ms)
  SEARCH_DEBOUNCE: 500,
  
  // Toast auto close duration (ms)
  TOAST_DURATION: 3000,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  // Authentication
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  
  // Settings
  THEME: 'theme',
  LANGUAGE: 'language',
  
  // Exam
  EXAM_PROGRESS: 'exam_progress',
  EXAM_ANSWERS: 'exam_answers',
  
  // Course
  COURSE_PROGRESS: 'course_progress',
  LAST_WATCHED_LESSON: 'last_watched_lesson',
  
  // UI State
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  TABLE_COLUMNS: 'table_columns',
} as const;

/**
 * Session Storage Keys
 */
export const SESSION_KEYS = {
  // Exam session
  EXAM_SESSION: 'exam_session',
  EXAM_START_TIME: 'exam_start_time',
  
  // Form data
  FORM_DRAFT: 'form_draft',
  
  // Redirect
  REDIRECT_URL: 'redirect_url',
} as const;

/**
 * File Upload Settings
 */
export const FILE_UPLOAD = {
  // Max file size (bytes)
  MAX_SIZE: {
    AVATAR: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    IMAGE: 5 * 1024 * 1024, // 5MB
  },
  
  // Allowed file types
  ALLOWED_TYPES: {
    AVATAR: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  // File extensions
  ALLOWED_EXTENSIONS: {
    AVATAR: ['.jpg', '.jpeg', '.png', '.gif'],
    DOCUMENT: ['.pdf', '.doc', '.docx'],
    VIDEO: ['.mp4', '.mpeg', '.mov'],
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  // Password
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 50,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  
  // Username
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  USERNAME_PATTERN: /^[a-zA-Z0-9_]+$/,
  
  // Email
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone
  PHONE_PATTERN: /^(\+84|0)[0-9]{9,10}$/,
  
  // OTP
  OTP_LENGTH: 6,
  OTP_PATTERN: /^[0-9]{6}$/,
  
  // ID Number (CMND/CCCD)
  ID_NUMBER_PATTERN: /^[0-9]{9,12}$/,
} as const;

/**
 * Date & Time Formats
 */
export const DATE_FORMAT = {
  // Display formats
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_TIME: 'HH:mm:ss',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm:ss',
  DISPLAY_DATE_SHORT: 'DD/MM/YY',
  
  // API formats
  API_DATE: 'YYYY-MM-DD',
  API_TIME: 'HH:mm:ss',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
  
  // Relative time
  RELATIVE_TIME: 'relative',
} as const;

/**
 * Status Constants
 */
export const STATUS = {
  // Common status
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  
  // Exam status
  EXAM_NOT_STARTED: 'not_started',
  EXAM_IN_PROGRESS: 'in_progress',
  EXAM_SUBMITTED: 'submitted',
  EXAM_GRADED: 'graded',
  
  // Payment status
  PAYMENT_PENDING: 'pending',
  PAYMENT_PROCESSING: 'processing',
  PAYMENT_SUCCESS: 'success',
  PAYMENT_FAILED: 'failed',
  PAYMENT_REFUNDED: 'refunded',
  
  // Course enrollment status
  ENROLLED: 'enrolled',
  COMPLETED_COURSE: 'completed',
  EXPIRED: 'expired',
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  GUEST: 'guest',
} as const;

/**
 * Exam Difficulty Levels
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
  
  // Vietnamese
  CO_BAN: 'Cơ bản',
  TRUNG_BINH: 'Trung bình',
  NANG_CAO: 'Nâng cao',
  DE: 'Dễ',
  KHO: 'Khó',
} as const;

/**
 * Course Levels
 */
export const COURSE_LEVELS = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  ALL_LEVELS: 'Tất cả cấp độ',
  BEGINNER_TO_ADVANCED: 'Cơ bản đến nâng cao',
} as const;

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  MOMO: 'momo',
  VNPAY: 'vnpay',
  CREDIT_CARD: 'credit-card',
  BANK_TRANSFER: 'bank-transfer',
  PAYPAL: 'paypal',
} as const;

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

/**
 * Toast Positions
 */
export const TOAST_POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right',
} as const;

/**
 * Theme Modes
 */
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

/**
 * Languages
 */
export const LANGUAGES = {
  VIETNAMESE: 'vi',
  ENGLISH: 'en',
} as const;

/**
 * Sort Orders
 */
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

/**
 * Question Types
 */
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  ESSAY: 'essay',
  FILL_IN_BLANK: 'fill-in-blank',
} as const;

/**
 * Lesson Types
 */
export const LESSON_TYPES = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  LIVE_SESSION: 'live-session',
} as const;

/**
 * Categories
 */
export const CATEGORIES = {
  EXAM: {
    CLOUD_COMPUTING: 'Cloud Computing',
    ENGLISH_LANGUAGE: 'English Language',
    CYBERSECURITY: 'Cybersecurity',
    NETWORKING: 'Networking',
    PROGRAMMING: 'Programming',
    DATA_SCIENCE: 'Data Science',
  },
  
  COURSE: {
    PROGRAMMING: 'programming',
    DATA_SCIENCE: 'data-science',
    BUSINESS: 'business',
    LANGUAGE: 'language',
    DESIGN: 'design',
    MARKETING: 'marketing',
  },
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  TIMEOUT_ERROR: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  
  // Authentication errors
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập tài nguyên này.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  
  // Validation errors
  REQUIRED_FIELD: 'Trường này là bắt buộc.',
  INVALID_EMAIL: 'Email không hợp lệ.',
  INVALID_PHONE: 'Số điện thoại không hợp lệ.',
  PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 6 ký tự.',
  PASSWORD_NOT_MATCH: 'Mật khẩu xác nhận không khớp.',
  
  // File upload errors
  FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file nhỏ hơn.',
  INVALID_FILE_TYPE: 'Loại file không được hỗ trợ.',
  
  // Generic error
  SOMETHING_WENT_WRONG: 'Có lỗi xảy ra. Vui lòng thử lại.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  REGISTER_SUCCESS: 'Đăng ký thành công!',
  LOGOUT_SUCCESS: 'Đăng xuất thành công!',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công!',
  PASSWORD_RESET: 'Đặt lại mật khẩu thành công!',
  
  // Profile
  PROFILE_UPDATED: 'Cập nhật thông tin thành công!',
  AVATAR_UPDATED: 'Cập nhật ảnh đại diện thành công!',
  
  // Exam
  EXAM_REGISTERED: 'Đăng ký thi thành công!',
  EXAM_SUBMITTED: 'Nộp bài thành công!',
  
  // Course
  COURSE_ENROLLED: 'Đăng ký khóa học thành công!',
  LESSON_COMPLETED: 'Hoàn thành bài học!',
  
  // Payment
  PAYMENT_SUCCESS: 'Thanh toán thành công!',
  
  // Generic
  OPERATION_SUCCESS: 'Thao tác thành công!',
  SAVED: 'Đã lưu!',
  DELETED: 'Đã xóa!',
} as const;

/**
 * Regex Patterns
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+84|0)[0-9]{9,10}$/,
  USERNAME: /^[a-zA-Z0-9_]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  NUMBER: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
} as const;

/**
 * App Metadata
 */
export const APP_METADATA = {
  NAME: 'Online Exam Website',
  VERSION: '1.0.0',
  DESCRIPTION: 'Hệ thống thi trực tuyến và quản lý khóa học',
  AUTHOR: 'Your Team Name',
  COPYRIGHT: `© ${new Date().getFullYear()} Online Exam Website. All rights reserved.`,
} as const;

/**
 * Social Media Links
 */
export const SOCIAL_LINKS = {
  FACEBOOK: 'https://facebook.com/yourpage',
  TWITTER: 'https://twitter.com/yourpage',
  INSTAGRAM: 'https://instagram.com/yourpage',
  LINKEDIN: 'https://linkedin.com/company/yourpage',
  YOUTUBE: 'https://youtube.com/yourchannel',
} as const;

/**
 * Contact Information
 */
export const CONTACT_INFO = {
  EMAIL: 'support@onlineexam.com',
  PHONE: '1900-xxxx',
  ADDRESS: 'Địa chỉ văn phòng',
  SUPPORT_HOURS: 'T2-T6: 8:00 - 17:00',
} as const;

// ==================== EXPORT DEFAULT ====================

export default {
  PAGINATION,
  TIMEOUT,
  STORAGE_KEYS,
  SESSION_KEYS,
  FILE_UPLOAD,
  VALIDATION,
  DATE_FORMAT,
  STATUS,
  USER_ROLES,
  DIFFICULTY_LEVELS,
  COURSE_LEVELS,
  PAYMENT_METHODS,
  NOTIFICATION_TYPES,
  TOAST_POSITIONS,
  THEME_MODES,
  LANGUAGES,
  SORT_ORDERS,
  QUESTION_TYPES,
  LESSON_TYPES,
  CATEGORIES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX_PATTERNS,
  APP_METADATA,
  SOCIAL_LINKS,
  CONTACT_INFO,
};

