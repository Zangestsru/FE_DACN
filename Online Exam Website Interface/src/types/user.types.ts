/**
 * User & Authentication Types
 * Chứa tất cả các types liên quan đến người dùng và xác thực
 */

// ==================== USER TYPES ====================

/**
 * Interface cho thông tin người dùng
 */
export interface IUser {
  id: string | number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  
  // Thông tin bổ sung
  bio?: string;
  dateOfBirth?: string;
  address?: string;
  idNumber?: string;
  
  // Thông tin tài khoản
  createdAt?: Date | string;
  updatedAt?: Date | string;
  isVerified?: boolean;
  isActive?: boolean;
}

/**
 * Interface cho thông tin đăng nhập
 */
export interface ILoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Interface cho form đăng ký
 */
export interface IRegisterForm {
  fullName: string;
  username: string;
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
  captcha?: string;
  agreeToTerms?: boolean;
}

/**
 * Interface cho thông tin khách hàng (thanh toán)
 */
export interface ICustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  address?: string;
}

/**
 * Interface cho thông tin thí sinh
 */
export interface IExaminee {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  studentCode?: string;
  idNumber?: string;
}

// ==================== AUTHENTICATION TYPES ====================

/**
 * Interface cho OTP verification
 */
export interface IOTPVerification {
  type: 'email' | 'phone' | 'sms';
  contact: string;
  code: string;
  expiresAt?: Date;
}

/**
 * Interface cho forgot password
 */
export interface IForgotPasswordForm {
  emailOrPhone: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
  captcha?: string;
}

/**
 * Interface cho password reset
 */
export interface IPasswordReset {
  recoveryType: 'email' | 'phone';
  contact: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface cho auth token
 */
export interface IAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Interface cho auth response
 */
export interface IAuthResponse {
  user: IUser;
  token: IAuthToken;
  message?: string;
}

/**
 * Interface cho verify OTP request
 */
export interface IVerifyOtpRequest {
  email: string;
  otp: string;
}

// ==================== PROPS TYPES ====================

/**
 * Props cho component Login
 */
export interface ILoginProps {
  onBackToHome: () => void;
  onOTPRequest: (type: string, contact: string) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

/**
 * Props cho component Register
 */
export interface IRegisterProps {
  onBackToHome: () => void;
  onOTPRequest: (type: string, contact: string) => void;
  onLogin: () => void;
}

/**
 * Props cho component ForgotPassword
 */
export interface IForgotPasswordProps {
  onBackToHome: () => void;
  onOTPRequest: (type: string, contact: string) => void;
}

/**
 * Props cho component OTPModal
 */
export interface IOTPModalProps {
  type: string;
  contact: string;
  onClose: () => void;
  onVerify: () => void;
}

// ==================== STATE TYPES ====================

/**
 * Type cho login type
 */
export type TLoginType = 'email' | 'phone';

/**
 * Type cho recovery type
 */
export type TRecoveryType = 'email' | 'phone';

/**
 * Type cho forgot password steps
 */
export type TForgotPasswordStep = 'input' | 'verify' | 'reset';

/**
 * Type cho user role
 */
export type TUserRole = 'student' | 'instructor' | 'admin';

