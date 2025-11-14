import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { SocialLogins } from './SocialLogins';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { OTPModal } from './OTPModal';

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
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { needsVerification, verifyLoginOtp, loginEmail } = useAuth();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (needsVerification) {
      setShowOtpModal(true);
    }
  }, [needsVerification]);

  const handleLoginSuccess = (payload: { email: string; requiresVerification: boolean }) => {
    setLoginSuccess(true);
    setPendingEmail(payload.email);
    if (payload.requiresVerification) {
      setShowOtpModal(true);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    try {
      setVerifying(true);
      setVerifyError(null);
      const emailToVerify = pendingEmail || loginEmail;
      const result = await verifyLoginOtp(emailToVerify, otp);
      if (result && result.token) {
        // Thông báo cho các thành phần khác (Header) cập nhật trạng thái đăng nhập
        window.dispatchEvent(new CustomEvent('auth:logged-in'));
        setShowOtpModal(false);
        console.log(`User ${emailToVerify} logged in successfully.`);
        navigate('/');
      }
      setVerifying(false);
    } catch (error: any) {
      console.error('OTP verification failed', error);
      setVerifying(false);
      const message = error?.response?.data?.message || error?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.';
      setVerifyError(message);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authService.resendOTP('email', pendingEmail);
    } catch (error) {
      console.error('Resend OTP failed', error);
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

                  {loginSuccess && (
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

                  <LoginForm onLoginSuccess={handleLoginSuccess} />

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

                  <SocialLogins />

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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <OTPModal
          type="email"
          contact={pendingEmail || loginEmail}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleOtpVerify}
          loading={verifying}
          error={verifyError}
          onResend={handleResendOtp}
        />
      )}
    </>
  );
};
import authService from '../services/auth.service';
