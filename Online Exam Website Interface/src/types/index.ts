/**
 * Types Index
 * Export tất cả types từ một điểm trung tâm
 * 
 * Cách sử dụng:
 * import { IExam, IUser, ICourse } from '@/types';
 */

// ==================== EXAM TYPES ====================
export * from './exam.types';

// ==================== USER & AUTH TYPES ====================
export * from './user.types';

// ==================== COURSE TYPES ====================
export * from './course.types';

// ==================== API TYPES ====================
export * from './api.types';

// ==================== COMMON TYPES ====================
export * from './common.types';

// ==================== CHAT TYPES ====================
export * from './chat.types';

// ==================== RE-EXPORT COMMONLY USED TYPES ====================

// Exam types
export type {
  IExam,
  ICertificationExam,
  IQuestion,
  IExamResult,
  IExamProgress,
  IExamCard,
} from './exam.types';

// User types
export type {
  IUser,
  ILoginCredentials,
  IRegisterForm,
  ICustomerInfo,
  IOTPVerification,
  IPasswordReset,
  IAuthToken,
  IAuthResponse,
} from './user.types';

// Course types
export type {
  ICourse,
  IStudyMaterial,
  IInstructor,
  ILesson,
  ICourseReview,
  ICourseProgress,
  ICourseCategory,
} from './course.types';

// API types
export type {
  IApiResponse,
  IApiError,
  IPaginatedResponse,
  IPagination,
  ILoginResponse,
  IRegisterResponse,
  IGetExamsResponse,
  IGetCoursesResponse,
  IPaymentResponse,
} from './api.types';

// Common types
export type {
  TCallback,
  TCallbackWithParam,
  TStatus,
  ILoadingState,
  IAsyncState,
  IFormState,
  IPaginationParams,
  IPaginationInfo,
  IFilterParams,
  IModalProps,
  IOption,
  ITableColumn,
  IBreadcrumbItem,
  ITabItem,
  IToastMessage,
  IValidationRule,
  IDateRange,
  IFileInfo,
} from './common.types';

// Chat types
export type {
  ChatMessage,
  ChatRoom,
  SendMessageRequest,
  CreateRoomRequest,
  ChatHistoryResponse,
  UserTypingEvent,
  UserOnlineStatusEvent,
} from './chat.types';

