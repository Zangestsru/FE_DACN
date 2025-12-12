import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ForgotPasswordProps {
  onBackToHome: () => void;
  onOTPRequest?: (type: string, contact: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToHome, onOTPRequest }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'input' | 'verify' | 'reset'>('input');
  const [recoveryType, setRecoveryType] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Mutation cho forgot password (gửi OTP)
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return await authService.forgotPassword(email);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Mã OTP đã được gửi đến email của bạn');
      setStep('verify');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    }
  });

  // Mutation cho reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: { email: string; otp: string; newPassword: string; confirmPassword: string }) => {
      return await authService.resetPassword(payload.email, payload.otp, payload.newPassword, payload.confirmPassword);
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Đặt lại mật khẩu thành công');
      // Chuyển về trang login sau 2 giây
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'input') {
      // Validate email
      if (!formData.emailOrPhone) {
        toast.error('Vui lòng nhập email');
        return;
      }
      if (recoveryType === 'email' && !formData.emailOrPhone.includes('@')) {
        toast.error('Email không hợp lệ');
        return;
      }
      
      // Chỉ hỗ trợ email cho forgot password (backend chỉ hỗ trợ email)
      if (recoveryType === 'phone') {
        toast.error('Hiện tại chỉ hỗ trợ khôi phục mật khẩu qua Email');
        return;
      }
      
      // Gọi API forgot password
      forgotPasswordMutation.mutate(formData.emailOrPhone);
      
      // Không cần gọi onOTPRequest vì forgot password flow có form nhập OTP riêng
      // OTP sẽ được verify trong reset-password endpoint
    } else if (step === 'verify') {
      // Validate OTP
      if (!formData.verificationCode || formData.verificationCode.length !== 6) {
        toast.error('Vui lòng nhập mã OTP 6 số');
        return;
      }
      
      // Chuyển sang step reset (không cần verify riêng, backend sẽ verify trong reset-password)
      setStep('reset');
    } else {
      // Reset password
      if (!formData.newPassword || formData.newPassword.length < 6) {
        toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp');
        return;
      }
      
      // Gọi API reset password
      resetPasswordMutation.mutate({
        email: formData.emailOrPhone,
        otp: formData.verificationCode,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
    }
  };

  const handleResendOTP = () => {
    if (!formData.emailOrPhone) {
      toast.error('Vui lòng nhập email trước');
      return;
    }
    forgotPasswordMutation.mutate(formData.emailOrPhone);
  };

  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <div className="text-center mb-4">
              <h5>Khôi phục mật khẩu</h5>
              <p className="text-muted">Nhập thông tin để lấy lại mật khẩu của bạn</p>
            </div>

            {/* Recovery Type Selection */}
            <div className="mb-4">
              <div className="btn-group w-100" role="group">
                <input 
                  type="radio" 
                  className="btn-check" 
                  name="recoveryType" 
                  id="email-recovery" 
                  checked={recoveryType === 'email'} 
                  onChange={() => setRecoveryType('email')}
                />
                <label className="btn btn-outline-primary" htmlFor="email-recovery">
                  Qua Email
                </label>

                <input 
                  type="radio" 
                  className="btn-check" 
                  name="recoveryType" 
                  id="phone-recovery" 
                  checked={recoveryType === 'phone'} 
                  onChange={() => setRecoveryType('phone')}
                />
                <label className="btn btn-outline-primary" htmlFor="phone-recovery">
                  Qua SMS
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">
                {recoveryType === 'email' ? 'Email đã đăng ký' : 'Số điện thoại đã đăng ký'}
              </label>
              <input
                type={recoveryType === 'email' ? 'email' : 'tel'}
                className="form-control"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleInputChange}
                placeholder={recoveryType === 'email' ? 'Nhập địa chỉ email' : 'Nhập số điện thoại'}
                required
              />
              <div className="form-text">
                {recoveryType === 'email' 
                  ? 'Mã xác nhận sẽ được gửi về email này' 
                  : 'Mã OTP sẽ được gửi về số điện thoại này'
                }
              </div>
            </div>


          </>
        );

      case 'verify':
        return (
          <>
            <div className="text-center mb-4">
              <h5>Xác nhận mã</h5>
              <p className="text-muted">
                Mã xác nhận đã được gửi đến {recoveryType === 'email' ? 'email' : 'số điện thoại'} của bạn
              </p>
              <p className="text-primary small">
                {recoveryType === 'email' ? formData.emailOrPhone : 
                 formData.emailOrPhone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}
              </p>
            </div>

            <div className="mb-4">
              <label className="form-label">Mã xác nhận</label>
              <input
                type="text"
                className="form-control text-center"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="Nhập mã 6 số"
                maxLength={6}
                style={{ fontSize: '1.2rem', letterSpacing: '0.5rem' }}
                required
              />
              <div className="form-text text-center">
                Không nhận được mã? 
                <button 
                  type="button" 
                  className="btn btn-link p-0 ms-1"
                  onClick={handleResendOTP}
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? 'Đang gửi...' : 'Gửi lại'}
                </button>
              </div>
            </div>
          </>
        );

      case 'reset':
        return (
          <>
            <div className="text-center mb-4">
              <h5>Đặt mật khẩu mới</h5>
              <p className="text-muted">Tạo mật khẩu mới cho tài khoản của bạn</p>
            </div>

            <div className="mb-3">
              <label className="form-label">Mật khẩu mới</label>
              <input
                type="password"
                className="form-control"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>
          </>
        );
    }
  };

  const getButtonText = () => {
    switch (step) {
      case 'input':
        return `Gửi mã ${recoveryType === 'email' ? 'qua Email' : 'qua SMS'}`;
      case 'verify':
        return 'Xác nhận mã';
      case 'reset':
        return 'Đặt lại mật khẩu';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center py-3">
              <h4 className="mb-0">QUÊN MẬT KHẨU</h4>
            </div>
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <button 
                  className="btn btn-outline-secondary me-2"
                  onClick={onBackToHome}
                >
                  Về trang chủ
                </button>
                {step !== 'input' && (
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => setStep(step === 'verify' ? 'input' : 'verify')}
                  >
                    ← Quay lại
                  </button>
                )}
              </div>

              {/* Progress Steps */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div className={`step-indicator ${step === 'input' ? 'active' : step === 'verify' || step === 'reset' ? 'completed' : ''}`}>
                    <div className="step-circle">1</div>
                    <small>Nhập thông tin</small>
                  </div>
                  <div className="step-line"></div>
                  <div className={`step-indicator ${step === 'verify' ? 'active' : step === 'reset' ? 'completed' : ''}`}>
                    <div className="step-circle">2</div>
                    <small>Xác nhận</small>
                  </div>
                  <div className="step-line"></div>
                  <div className={`step-indicator ${step === 'reset' ? 'active' : ''}`}>
                    <div className="step-circle">3</div>
                    <small>Đặt lại</small>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {renderStepContent()}
                
                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={forgotPasswordMutation.isPending || resetPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending && step === 'input' && 'Đang gửi...'}
                    {resetPasswordMutation.isPending && step === 'reset' && 'Đang xử lý...'}
                    {!forgotPasswordMutation.isPending && !resetPasswordMutation.isPending && getButtonText()}
                  </button>
                </div>

                <div className="text-center mt-3">
                  <span className="text-muted">Nhớ mật khẩu? </span>
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={onBackToHome}
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
  );
};