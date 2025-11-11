/**
 * Common Types
 * Chứa các types dùng chung trong toàn bộ ứng dụng
 */

// ==================== COMMON UI TYPES ====================

/**
 * Generic callback function type
 */
export type TCallback<T = void> = () => T;

/**
 * Generic callback with parameter
 */
export type TCallbackWithParam<P, R = void> = (param: P) => R;

/**
 * Generic event handler
 */
export type TEventHandler<T = any> = (event: T) => void;

/**
 * Generic change handler
 */
export type TChangeHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

/**
 * Generic submit handler
 */
export type TSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

/**
 * Generic click handler
 */
export type TClickHandler = (event: React.MouseEvent<HTMLElement>) => void;

// ==================== STATUS & STATE TYPES ====================

/**
 * Generic status type
 */
export type TStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic loading state
 */
export interface ILoadingState {
  isLoading: boolean;
  error?: string | null;
}

/**
 * Generic async state
 */
export interface IAsyncState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic form state
 */
export interface IFormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ==================== PAGINATION TYPES ====================

/**
 * Pagination params
 */
export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination info
 */
export interface IPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ==================== FILTER & SEARCH TYPES ====================

/**
 * Generic filter params
 */
export interface IFilterParams {
  search?: string;
  category?: string;
  level?: string;
  difficulty?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  [key: string]: any;
}

/**
 * Sort params
 */
export interface ISortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Search params
 */
export interface ISearchParams {
  query: string;
  filters?: IFilterParams;
  sort?: ISortParams;
  pagination?: IPaginationParams;
}

// ==================== MODAL & DIALOG TYPES ====================

/**
 * Modal props base
 */
export interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Confirm dialog props
 */
export interface IConfirmDialogProps extends IModalProps {
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

/**
 * Alert props
 */
export interface IAlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  title?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

// ==================== DROPDOWN & SELECT TYPES ====================

/**
 * Option type for select/dropdown
 */
export interface IOption<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * Select props
 */
export interface ISelectProps<T = string | number> {
  options: IOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

// ==================== TABLE TYPES ====================

/**
 * Table column definition
 */
export interface ITableColumn<T = any> {
  key: string;
  title: string;
  dataIndex: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Table props
 */
export interface ITableProps<T = any> {
  columns: ITableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: IPaginationInfo;
  onPageChange?: (page: number) => void;
  onSort?: (column: string, order: 'asc' | 'desc') => void;
}

// ==================== BREADCRUMB TYPES ====================

/**
 * Breadcrumb item
 */
export interface IBreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
  active?: boolean;
}

// ==================== TAB TYPES ====================

/**
 * Tab item
 */
export interface ITabItem {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  content?: React.ReactNode;
}

/**
 * Tab props
 */
export interface ITabProps {
  tabs: ITabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

// ==================== CARD TYPES ====================

/**
 * Card props base
 */
export interface ICardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// ==================== BADGE & TAG TYPES ====================

/**
 * Badge type
 */
export type TBadgeType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

/**
 * Badge props
 */
export interface IBadgeProps {
  type?: TBadgeType;
  text: string;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ==================== TOAST & NOTIFICATION TYPES ====================

/**
 * Toast type
 */
export type TToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast message
 */
export interface IToastMessage {
  id?: string;
  type: TToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}

// ==================== VALIDATION TYPES ====================

/**
 * Validation rule
 */
export interface IValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
  message?: string;
}

/**
 * Validation result
 */
export interface IValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ==================== DATE & TIME TYPES ====================

/**
 * Date range
 */
export interface IDateRange {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Time range
 */
export interface ITimeRange {
  startTime: string;
  endTime: string;
}

// ==================== FILE TYPES ====================

/**
 * File info
 */
export interface IFileInfo {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt?: Date | string;
}

/**
 * File upload progress
 */
export interface IFileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// ==================== UTILITY TYPES ====================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Pick properties by type
 */
export type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

/**
 * Omit properties by type
 */
export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

// ==================== PAYMENT TYPES ====================

/**
 * Payment method type
 */
export type TPaymentMethod = 'momo' | 'vnpay' | 'credit-card' | 'bank-transfer' | 'paypal';

/**
 * Payment status
 */
export type TPaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded';

/**
 * Payment info
 */
export interface IPaymentInfo {
  id: string;
  amount: number;
  method: TPaymentMethod;
  status: TPaymentStatus;
  createdAt: Date | string;
  paidAt?: Date | string;
}

// ==================== THEME TYPES ====================

/**
 * Theme mode
 */
export type TThemeMode = 'light' | 'dark' | 'auto';

/**
 * Color scheme
 */
export interface IColorScheme {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
}

