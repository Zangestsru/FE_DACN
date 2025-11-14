import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onLoginSuccess: (payload: { email: string; requiresVerification: boolean }) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginLoading, loginError, needsVerification } = useAuth();

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
      const response = await login(formData.email, formData.password);
      if (response) {
        const requiresVerification = !!(response as any)?.requiresVerification || !((response as any)?.token?.accessToken);
        onLoginSuccess({
          email: formData.email,
          requiresVerification,
        });
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {loginError && (
        <div className="alert alert-danger mb-3" style={{ borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
          {loginError.message}
        </div>
      )}
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
      <button
        type="submit"
        className="btn w-100 mb-3"
        disabled={loginLoading}
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
        {loginLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
};