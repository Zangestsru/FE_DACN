import React, { useState } from 'react';
import { useAuthContext } from '@/contexts';
import { useRegister } from '@/hooks';
import './Register.css';

interface RegisterProps {
  onBackToHome: () => void;
  onOTPRequest: (type: string, contact: string) => void;
  onLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBackToHome, onOTPRequest, onLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    captcha: ''
  });

  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sử dụng hook register
  const { register, loading, error } = useRegister();
  const { isAuthenticated } = useAuthContext();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error khi user nhập
    if (validationError) setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Mật khẩu xác nhận không khớp!');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    try {
      const result = await register({
        fullName: formData.fullName,
        username: formData.username,
        emailOrPhone: formData.emailOrPhone,
        password: formData.password,
        loginType
      });

      if (result.success) {
        // Chuyển đến trang OTP
        onOTPRequest(loginType, formData.emailOrPhone);
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <>
      <style>{`
        .register-fullscreen-bg {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%), 
                      url("/images/background.png");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          min-height: 100vh;
        }
        @media (max-width: 576px) {
          .register-form-container {
            margin: 1rem !important;
            border-radius: 1rem !important;
          }
          .register-fullscreen-bg {
            background-attachment: scroll;
            padding-top: 4vh !important;
            padding-bottom: 4vh !important;
          }
        }
        @media (max-width: 768px) {
          .register-fullscreen-bg {
            padding-top: 6vh !important;
            padding-bottom: 6vh !important;
          }
        }
      `}</style>
      <div className="register-fullscreen-bg d-flex align-items-start justify-content-center" style={{ paddingTop: '8vh', paddingBottom: '8vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8 col-sm-10">
              <div className="mx-auto" style={{ maxWidth: '480px' }}>
                <div className="bg-white rounded-3 shadow-lg border p-4 p-sm-5 register-form-container" style={{ 
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  marginTop: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold mb-2" style={{ color: '#333', fontSize: 'clamp(1.5rem, 4vw, 1.75rem)' }}>Tạo tài khoản</h1>
                    <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}>Điền thông tin để bắt đầu hành trình học tập</p>
                  </div>

                  {/* Error Messages */}
                  {(error || validationError) && (
                    <div className="alert alert-danger mb-3" style={{ 
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '0.9rem',
                      border: '1px solid #fecaca'
                    }}>
                      {error || validationError}
                    </div>
                  )}

                  {/* Login Type Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-medium mb-3" style={{ color: '#374151', fontSize: '0.95rem' }}>
                      Phương thức đăng ký
                    </label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="loginType"
                          id="email"
                          checked={loginType === 'email'}
                          onChange={() => setLoginType('email')}
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <label className="form-check-label" htmlFor="email" style={{ fontSize: '0.9rem', color: '#374151' }}>
                          Email
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="loginType"
                          id="phone"
                          checked={loginType === 'phone'}
                          onChange={() => setLoginType('phone')}
                          style={{ borderColor: '#d1d5db' }}
                        />
                        <label className="form-check-label" htmlFor="phone" style={{ fontSize: '0.9rem', color: '#374151' }}>
                          Số điện thoại
                        </label>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div className="mb-3">
                      <label htmlFor="fullName" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          padding: '12px 16px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fff'
                        }}
                        placeholder="Nhập họ và tên của bạn"
                      />
                    </div>

                    {/* Username */}
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>
                        Tên đăng nhập
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          padding: '12px 16px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fff'
                        }}
                        placeholder="Nhập tên đăng nhập"
                      />
                    </div>

                    {/* Email/Phone */}
                    <div className="mb-3">
                      <label htmlFor="emailOrPhone" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>
                        {loginType === 'email' ? 'Email' : 'Số điện thoại'}
                      </label>
                      <input
                        type={loginType === 'email' ? 'email' : 'tel'}
                        className="form-control"
                        id="emailOrPhone"
                        name="emailOrPhone"
                        value={formData.emailOrPhone}
                        onChange={handleInputChange}
                        required
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          padding: '12px 16px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fff'
                        }}
                        placeholder={loginType === 'email' ? 'Nhập địa chỉ email' : 'Nhập số điện thoại'}
                      />
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>
                        Mật khẩu
                      </label>
                      <div className="position-relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            padding: '12px 16px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fff',
                            paddingRight: '45px'
                          }}
                          placeholder="Nhập mật khẩu"
                        />
                        <button
                          type="button"
                          className="btn position-absolute"
                          style={{
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'none',
                            color: '#6b7280',
                            padding: '4px'
                          }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>
                        Xác nhận mật khẩu
                      </label>
                      <div className="position-relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-control"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            padding: '12px 16px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fff',
                            paddingRight: '45px'
                          }}
                          placeholder="Nhập lại mật khẩu"
                        />
                        <button
                          type="button"
                          className="btn position-absolute"
                          style={{
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'none',
                            color: '#6b7280',
                            padding: '4px'
                          }}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="mb-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="terms" required />
                        <label className="form-check-label" htmlFor="terms" style={{ 
                          fontSize: '0.9rem', 
                          color: '#6b7280',
                          lineHeight: '1.4'
                        }}>
                          Tôi đồng ý với <a href="#" className="text-decoration-none">Điều khoản sử dụng</a> và <a href="#" className="text-decoration-none">Chính sách bảo mật</a>
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn w-100 mb-3"
                      disabled={loading}
                      style={{
                        borderRadius: '8px',
                        padding: '12px 24px',
                        backgroundColor: '#007bff',
                        border: 'none',
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        color: '#fff'
                      }}
                    >
                      {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                    </button>

                    {/* Login Link */}
                    <div className="text-center">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Đã có tài khoản? </span>
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={onLogin}
                        style={{
                          color: '#007bff',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          textDecoration: 'none'
                        }}
                      >
                        Đăng nhập ngay
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};