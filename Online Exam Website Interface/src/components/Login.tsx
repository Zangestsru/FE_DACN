import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuthContext } from '@/contexts';
import { useLogin } from '@/hooks';

interface LoginProps {
  onBackToHome: () => void;
  onOTPRequest: (type: string, contact: string) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ 
  onBackToHome, 
  onOTPRequest, 
  onForgotPassword,
  onRegister 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Sử dụng hook login
  const { login, loading, error } = useLogin();
  const { isAuthenticated } = useAuthContext();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Gọi login hook
      await login(formData.email, formData.password);
      
      // Nếu thành công, có thể redirect hoặc trigger OTP
      // Hiện tại vẫn giữ logic cũ để tương thích
      onOTPRequest('email', formData.email);
    } catch (err) {
      // Error đã được handle bởi hook
      console.error('Login failed:', err);
    }
  };

  return (
    <>
      <style>{`
        .login-fullscreen-bg {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%), 
                      url("/images/background.png");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          min-height: 100vh;
        }
        @media (max-width: 576px) {
          .login-form-container {
            margin: 1rem !important;
            border-radius: 1rem !important;
          }
          .login-fullscreen-bg {
            background-attachment: scroll;
            padding-top: 4vh !important;
            padding-bottom: 4vh !important;
          }
        }
        @media (max-width: 768px) {
          .login-fullscreen-bg {
            padding-top: 6vh !important;
            padding-bottom: 6vh !important;
          }
        }
      `}</style>
      
      <div className="login-fullscreen-bg d-flex align-items-start justify-content-center" style={{ paddingTop: '8vh', paddingBottom: '8vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8 col-sm-10">
              <div className="mx-auto" style={{ maxWidth: '480px' }}>
                <div className="bg-white rounded-3 shadow-lg border p-4 p-sm-5 login-form-container" style={{ 
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  marginTop: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold mb-2" style={{ color: '#333', fontSize: 'clamp(1.5rem, 4vw, 1.75rem)' }}>Đăng Nhập Tài Khoản</h1>
                  </div>

                  {/* Error Messages */}
                  {error && (
                    <div className="alert alert-danger mb-3" style={{ 
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '0.9rem',
                      border: '1px solid #fecaca'
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {isAuthenticated && (
                    <div className="alert alert-success mb-3" style={{ 
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      fontSize: '0.9rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      Đăng nhập thành công!
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-medium" style={{ color: '#374151', fontSize: '0.95rem' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #d1d5db',
                          padding: '12px 16px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fff'
                        }}
                        placeholder="Nhập địa chỉ email của bạn"
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
                          placeholder="Nhập mật khẩu của bạn"
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

                    {/* Remember Me and Forgot Password */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="rememberMe" />
                        <label className="form-check-label" htmlFor="rememberMe" style={{ 
                          fontSize: '0.9rem', 
                          color: '#6b7280'
                        }}>
                          Ghi nhớ đăng nhập
                        </label>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-link p-0"
                        onClick={onForgotPassword}
                        style={{
                          color: '#007bff',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          textDecoration: 'none'
                        }}
                      >
                        Quên mật khẩu?
                      </button>
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
                       {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                     </button>

                    {/* Divider */}
                    <div className="text-center mb-3">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>hoặc</span>
                    </div>

                    {/* Google Login Button */}
                    <button type="button" className="btn w-100 mb-4" style={{
                      borderRadius: '8px',
                      padding: '12px 24px',
                      backgroundColor: '#fff',
                      border: '1px solid #d1d5db',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Đăng nhập với Google
                    </button>

                    {/* Register Link */}
                    <div className="text-center">
                      <span className="text-muted" style={{ fontSize: '0.9rem' }}>Chưa có tài khoản? </span>
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={onRegister}
                        style={{
                          color: '#007bff',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          textDecoration: 'none'
                        }}
                      >
                        Đăng ký ngay
                      </button>
                    </div>

                    {/* Back to Home */}
                    <div className="text-center mt-3">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={onBackToHome}
                        style={{
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                      >
                        Về trang chủ
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