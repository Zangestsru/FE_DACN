import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services';
import { useNavigate } from 'react-router-dom';

const OtpVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      try {
        const result = await authService.verifyOTP('email', user.email, otp);
        if (result?.verified) {
          navigate('/');
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        // Xử lý lỗi
      }
    }
  };

  return (
    <div>
      <h2>Enter OTP</h2>
      <p>An OTP has been sent to {user?.email}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
};

export default OtpVerification;
