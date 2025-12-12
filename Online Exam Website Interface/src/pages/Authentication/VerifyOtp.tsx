import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';
import { OTPModal } from '../../components/OTPModal';

interface VerifyOtpProps {
  email: string;
  onLogin: () => void;
}

// Dùng chung form nhập OTP với đăng nhập bằng cách tái sử dụng OTPModal
export const VerifyOtp: React.FC<VerifyOtpProps> = ({ email, onLogin }) => {
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const { mutateAsync: verifyOTP, isPending } = useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyOTP('email', email, otp),
  });

  const handleVerify = async (code: string) => {
    if (!email) {
      toast.error('Không tìm thấy địa chỉ email. Vui lòng thử đăng ký lại.');
      return;
    }
    try {
      setVerifyError(null);
      const res = await verifyOTP({ email, otp: code });
      if (res?.verified) {
        toast.success('Xác thực OTP thành công! Vui lòng đăng nhập.');
        onLogin();
      } else {
        const message = res?.message || 'OTP không hợp lệ hoặc đã hết hạn.';
        setVerifyError(message);
        toast.error(message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'OTP không hợp lệ hoặc đã hết hạn.';
      setVerifyError(message);
      toast.error(message);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendOTP('email', email);
      toast.success('Mã OTP mới đã được gửi.');
    } catch (error) {
      toast.error('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    }
  };

  // Hiển thị cùng form OTP với đăng nhập (OTPModal)
  return (
    <OTPModal
      type="email"
      contact={email}
      onClose={onLogin}
      onVerify={handleVerify}
      loading={isPending}
      error={verifyError}
      onResend={handleResend}
    />
  );
};

export default VerifyOtp;