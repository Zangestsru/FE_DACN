import React, { useState } from 'react';
import { useRegister } from '@/hooks';
import DatePicker from './ui/date-picker';
import { format, isValid } from 'date-fns';

interface RegisterFormProps {
  onRegisterSuccess: (email: string) => void;
  onLogin: () => void;
  onBackToHome: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess, onLogin, onBackToHome }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: 'Nam',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: register, loading, error } = useRegister({
    onSuccess: () => {
      onRegisterSuccess(formData.email);
    },
    onError: (err) => {
      const msg = err?.message || '';
      const lower = msg.toLowerCase();
      const next = { ...errors } as Record<string, string>;
      if (lower.includes('email') && (lower.includes('tồn tại') || lower.includes('exists'))) {
        next.email = 'Email đã tồn tại';
      }
      if (lower.includes('phone') || lower.includes('số điện thoại')) {
        if (lower.includes('tồn tại') || lower.includes('exists')) next.phoneNumber = 'Số điện thoại đã tồn tại';
        if (lower.includes('không hợp lệ') || lower.includes('invalid')) next.phoneNumber = 'Số điện thoại không hợp lệ';
      }
      if (lower.includes('mật khẩu') && lower.includes('yếu')) {
        next.password = 'Mật khẩu không đáp ứng yêu cầu bảo mật';
      }
      if (lower.includes('ngày sinh')) {
        next.dateOfBirth = 'Ngày sinh không hợp lệ';
      }
      setErrors(next);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateAndSetError(name, value);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // yyyy-MM-dd
    const parsed = value ? new Date(`${value}T00:00:00`) : undefined;
    const valid = parsed ? isValid(parsed) : false;
    setDateOfBirth(valid ? parsed : undefined);
    setFormData(prev => ({
      ...prev,
      dateOfBirth: valid ? format(parsed as Date, 'dd/MM/yyyy') : ''
    }));
    validateAndSetError('dateOfBirth', valid ? format(parsed as Date, 'dd/MM/yyyy') : '');
  };

  const getFieldError = (name: string, value: string) => {
    if (name === 'fullName') {
      if (!value.trim()) return 'Họ và tên là bắt buộc';
      if (value.length > 150) return 'Họ và tên tối đa 150 ký tự';
      return '';
    }
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) return 'Email là bắt buộc';
      if (!emailRegex.test(value)) return 'Email không hợp lệ';
      return '';
    }
    if (name === 'phoneNumber') {
      const phoneRegex = /^(03|05|07|08|09)\d{8,9}$/;
      if (!value.trim()) return 'Số điện thoại là bắt buộc';
      if (!phoneRegex.test(value)) return 'Số điện thoại phải bắt đầu 03/05/07/08/09 và gồm 10–11 số';
      return '';
    }
    if (name === 'gender') {
      if (value !== 'Nam' && value !== 'Nữ') return 'Giới tính phải là Nam hoặc Nữ';
      return '';
    }
    if (name === 'dateOfBirth') {
      if (!value.trim()) return 'Ngày sinh là bắt buộc';
      const parts = value.split('/');
      if (parts.length !== 3) return 'Ngày sinh phải có định dạng dd/MM/yyyy';
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      const now = new Date();
      if (!isValid(dt) || dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return 'Ngày sinh không hợp lệ';
      if (y < 1900) return 'Năm sinh phải từ 1900 trở lên';
      if (dt > now) return 'Ngày sinh không được lớn hơn hiện tại';
      return '';
    }
    if (name === 'password') {
      const minLen = value.length >= 6;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasDigit = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);
      if (!value.trim()) return 'Mật khẩu là bắt buộc';
      if (!minLen || !hasUpper || !hasLower || !hasDigit || !hasSpecial) return 'Mật khẩu tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
      return '';
    }
    if (name === 'confirmPassword') {
      if (!value.trim()) return 'Xác nhận mật khẩu là bắt buộc';
      if (value !== formData.password) return 'Mật khẩu xác nhận không khớp';
      return '';
    }
    return '';
  };

  const validateAndSetError = (name: string, value: string) => {
    const message = getFieldError(name, value);
    setErrors(prev => ({ ...prev, [name]: message }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
    const nextErrors = {
      fullName: getFieldError('fullName', formData.fullName),
      email: getFieldError('email', formData.email),
      phoneNumber: getFieldError('phoneNumber', formData.phoneNumber),
      gender: getFieldError('gender', formData.gender),
      dateOfBirth: getFieldError('dateOfBirth', formData.dateOfBirth),
      password: getFieldError('password', formData.password),
      confirmPassword: getFieldError('confirmPassword', formData.confirmPassword),
    } as Record<string, string>;
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(m => m)) return;
    await register(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger mb-3" style={{ borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
          {error.message}
        </div>
      )}
      <div className="mb-3">
        <label htmlFor="fullName" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Họ và tên</label>
        <input type="text" className="form-control" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }} placeholder="Nhập họ và tên của bạn" />
        {errors.fullName && (<div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{errors.fullName}</div>)}
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Email</label>
        <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }} placeholder="Nhập địa chỉ email" />
        {errors.email && (<div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{errors.email}</div>)}
      </div>

      <div className="mb-3">
        <label htmlFor="phoneNumber" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Số điện thoại</label>
        <input type="tel" className="form-control" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }} placeholder="Nhập số điện thoại" />
        <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>Bắt đầu 03/05/07/08/09, 10–11 số</div>
        {errors.phoneNumber && (<div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{errors.phoneNumber}</div>)}
      </div>
      <div className="mb-3">
        <label htmlFor="dateOfBirth" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Ngày sinh</label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          className="form-control"
          value={dateOfBirth && isValid(dateOfBirth) ? format(dateOfBirth, 'yyyy-MM-dd') : ''}
          onChange={handleDateInputChange}
          required
          style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }}
        />
        <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>Định dạng dd/MM/yyyy, năm từ 1900 đến hiện tại</div>
        {errors.dateOfBirth && (<div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{errors.dateOfBirth}</div>)}
      </div>
      
      <div className="mb-3">
        <label className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Giới tính</label>
        <div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="gender" id="male" value="Nam" checked={formData.gender === 'Nam'} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="male">Nam</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="gender" id="female" value="Nữ" checked={formData.gender === 'Nữ'} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="female">Nữ</label>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Mật khẩu</label>
        <div className="position-relative">
          <input type={showPassword ? 'text' : 'password'} className="form-control" id="password" name="password" value={formData.password} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff', paddingRight: '45px' }} placeholder="Nhập mật khẩu" />
          <button type="button" className="btn position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#6b7280', padding: '4px' }} onClick={() => setShowPassword(!showPassword)}>
            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>Tối thiểu 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt</div>
        {errors.password && (<div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{errors.password}</div>)}
      </div>
      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Xác nhận mật khẩu</label>
        <div className="position-relative">
          <input type={showConfirmPassword ? 'text' : 'password'} className="form-control" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff', paddingRight: '45px' }} placeholder="Nhập lại mật khẩu" />
          <button type="button" className="btn position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#6b7280', padding: '4px' }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {errors.confirmPassword && (<div className="text-danger mt-1" style={{ fontSize: '0.85rem' }}>{errors.confirmPassword}</div>)}
      </div>

      <div className="form-check mb-4">
        <input className="form-check-input" type="checkbox" id="agreeTerms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
        <label className="form-check-label" htmlFor="agreeTerms" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          Tôi đồng ý với <a href="/terms" target="_blank" className="text-primary">Điều khoản sử dụng</a> và <a href="/privacy" target="_blank" className="text-primary">Chính sách bảo mật</a>
        </label>
      </div>

      <button type="submit" className="btn w-100 mb-3" disabled={loading} style={{ borderRadius: '8px', padding: '12px 24px', backgroundColor: '#007bff', border: 'none', fontSize: '0.95rem', fontWeight: '500', color: '#fff' }}>
        {loading ? 'Đang xử lý...' : 'Đăng ký'}
      </button>

      <div className="text-center">
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Đã có tài khoản? </span>
        <button type="button" className="btn btn-link p-0" onClick={onLogin} style={{ color: '#007bff', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' }}>
          Đăng nhập ngay
        </button>
      </div>
      
      <div className="text-center mt-3">
        <button type="button" className="btn btn-outline-secondary" onClick={onBackToHome} style={{ borderRadius: '8px', padding: '8px 16px', fontSize: '0.9rem', fontWeight: '500' }}>
          Về trang chủ
        </button>
      </div>
    </form>
  );
};