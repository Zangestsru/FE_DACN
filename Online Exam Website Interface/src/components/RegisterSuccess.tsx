import React from 'react';

interface RegisterSuccessProps {
  onLogin: () => void;
}

export const RegisterSuccess: React.FC<RegisterSuccessProps> = ({ onLogin }) => {
  return (
    <div className="alert alert-success mb-3" style={{ borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>
      Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.
      <div className="text-center mt-3">
        <button type="button" className="btn btn-link p-0" onClick={onLogin} style={{ color: '#007bff', fontSize: '0.9rem', fontWeight: '500', textDecoration: 'none' }}>
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
};