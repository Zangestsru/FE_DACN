/**
 * Validation utility functions
 */

import { VALIDATION } from '../constants';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate email address
 * @param email - Email to validate
 * @returns Validation result
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: 'Email là bắt buộc' };
  }
  
  if (!VALIDATION.EMAIL_PATTERN.test(email)) {
    return { isValid: false, message: 'Email không hợp lệ' };
  }
  
  return { isValid: true };
};

/**
 * Validate phone number
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, message: 'Số điện thoại là bắt buộc' };
  }
  
  if (!VALIDATION.PHONE_PATTERN.test(phone)) {
    return { isValid: false, message: 'Số điện thoại không hợp lệ' };
  }
  
  return { isValid: true };
};

/**
 * Validate password
 * @param password - Password to validate
 * @returns Validation result
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Mật khẩu là bắt buộc' };
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `Mật khẩu phải có ít nhất ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự` 
    };
  }
  
  if (password.length > VALIDATION.PASSWORD_MAX_LENGTH) {
    return { 
      isValid: false, 
      message: `Mật khẩu không được vượt quá ${VALIDATION.PASSWORD_MAX_LENGTH} ký tự` 
    };
  }
  
  return { isValid: true };
};

/**
 * Validate password confirmation
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export const validatePasswordConfirmation = (
  password: string, 
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Xác nhận mật khẩu là bắt buộc' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Mật khẩu xác nhận không khớp' };
  }
  
  return { isValid: true };
};

/**
 * Validate username
 * @param username - Username to validate
 * @returns Validation result
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, message: 'Tên đăng nhập là bắt buộc' };
  }
  
  if (username.length < VALIDATION.USERNAME_MIN_LENGTH) {
    return { 
      isValid: false, 
      message: `Tên đăng nhập phải có ít nhất ${VALIDATION.USERNAME_MIN_LENGTH} ký tự` 
    };
  }
  
  if (username.length > VALIDATION.USERNAME_MAX_LENGTH) {
    return { 
      isValid: false, 
      message: `Tên đăng nhập không được vượt quá ${VALIDATION.USERNAME_MAX_LENGTH} ký tự` 
    };
  }
  
  if (!VALIDATION.USERNAME_PATTERN.test(username)) {
    return { 
      isValid: false, 
      message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới' 
    };
  }
  
  return { isValid: true };
};

/**
 * Validate OTP code
 * @param otp - OTP code to validate
 * @returns Validation result
 */
export const validateOTP = (otp: string): ValidationResult => {
  if (!otp) {
    return { isValid: false, message: 'Mã OTP là bắt buộc' };
  }
  
  if (otp.length !== VALIDATION.OTP_LENGTH) {
    return { 
      isValid: false, 
      message: `Mã OTP phải có ${VALIDATION.OTP_LENGTH} số` 
    };
  }
  
  if (!VALIDATION.OTP_PATTERN.test(otp)) {
    return { isValid: false, message: 'Mã OTP chỉ được chứa số' };
  }
  
  return { isValid: true };
};

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Validation result
 */
export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `${fieldName} là bắt buộc` };
  }
  
  return { isValid: true };
};

/**
 * Validate email or phone (for login/registration)
 * @param value - Email or phone to validate
 * @param type - Type of validation ('email' or 'phone')
 * @returns Validation result
 */
export const validateEmailOrPhone = (
  value: string, 
  type: 'email' | 'phone'
): ValidationResult => {
  if (type === 'email') {
    return validateEmail(value);
  } else {
    return validatePhone(value);
  }
};

/**
 * Validate form data with multiple fields
 * @param formData - Object containing form data
 * @param rules - Validation rules for each field
 * @returns Object with validation results for each field
 */
export const validateForm = (
  formData: Record<string, any>,
  rules: Record<string, (value: any) => ValidationResult>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};
  
  Object.keys(rules).forEach(field => {
    results[field] = rules[field](formData[field]);
  });
  
  return results;
};

/**
 * Check if all validation results are valid
 * @param results - Validation results object
 * @returns True if all validations passed
 */
export const isFormValid = (results: Record<string, ValidationResult>): boolean => {
  return Object.values(results).every(result => result.isValid);
};

/**
 * Get first validation error message
 * @param results - Validation results object
 * @returns First error message or null
 */
export const getFirstError = (results: Record<string, ValidationResult>): string | null => {
  const firstError = Object.values(results).find(result => !result.isValid);
  return firstError?.message || null;
};