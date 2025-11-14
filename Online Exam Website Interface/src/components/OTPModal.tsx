import React, { useState, useEffect } from 'react';

interface OTPModalProps {
  type: string;
  contact: string;
  onClose: () => void;
  onVerify: (code: string) => void;
}

export const OTPModal: React.FC<OTPModalProps> = ({ type, contact, onClose, onVerify }) => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = () => {
    const code = otpCode.join('');
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleResend = () => {
    setCountdown(60);
    setCanResend(false);
    setOtpCode(['', '', '', '', '', '']);
  };

  const maskedContact = type === 'phone' 
    ? contact.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
    : contact.replace(/(.{2})[^@]*(@.*)/, '$1***$2');

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white border-0">
            <h5 className="modal-title d-flex align-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
              </svg>
              XÁC THỰC OTP
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4 text-center">
            <div className="mb-4">
              <div className="mb-3">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="#007bff" className="mx-auto">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                </svg>
              </div>
              <h6>Nhập mã xác thực</h6>
              <p className="text-muted small">
                Mã OTP đã được gửi đến {type === 'phone' ? 'số điện thoại' : 'email'}
              </p>
              <p className="text-primary fw-bold">{maskedContact}</p>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-center gap-2 mb-3">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    className="form-control text-center otp-input"
                    style={{ width: '50px', height: '50px', fontSize: '20px', fontWeight: 'bold' }}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                  />
                ))}
              </div>
              
              <div className="text-center">
                {canResend ? (
                  <button 
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={handleResend}
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <span className="text-muted small">
                    Gửi lại sau {countdown}s
                  </span>
                )}
              </div>
            </div>

            <div className="d-grid gap-2">
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleVerify}
                disabled={otpCode.join('').length !== 6}
              >
                ✅ Xác thực
              </button>
              <button className="btn btn-outline-secondary" onClick={onClose}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};