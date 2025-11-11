import React, { useState } from 'react';
import { useRegister } from '@/hooks';
import DatePicker from './ui/date-picker';
import { format } from 'date-fns';

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

  const { mutate: register, loading, error } = useRegister({
    onSuccess: () => {
      onRegisterSuccess(formData.email);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // yyyy-MM-dd
    const parsed = value ? new Date(`${value}T00:00:00`) : undefined;
    setDateOfBirth(parsed);
    setFormData(prev => ({
      ...prev,
      dateOfBirth: parsed ? format(parsed, 'dd/MM/yyyy') : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
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
      </div>
      <div className="mb-3">
        <label htmlFor="email" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Email</label>
        <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }} placeholder="Nhập địa chỉ email" />
      </div>

      <div className="mb-3">
        <label htmlFor="phoneNumber" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Số điện thoại</label>
        <input type="tel" className="form-control" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }} placeholder="Nhập số điện thoại" />
      </div>
      <div className="mb-3">
        <label htmlFor="dateOfBirth" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Ngày sinh</label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          className="form-control"
          value={dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : ''}
          onChange={handleDateInputChange}
          required
          style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff' }}
        />
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
      </div>
      <div className="mb-3">
        <label htmlFor="confirmPassword" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>Xác nhận mật khẩu</label>
        <div className="position-relative">
          <input type={showConfirmPassword ? 'text' : 'password'} className="form-control" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required style={{ borderRadius: '8px', border: '1px solid #d1d5db', padding: '12px 16px', fontSize: '0.95rem', backgroundColor: '#fff', paddingRight: '45px' }} placeholder="Nhập lại mật khẩu" />
          <button type="button" className="btn position-absolute" style={{ right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#6b7280', padding: '4px' }} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
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