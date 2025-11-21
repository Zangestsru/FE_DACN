import React, { useState } from 'react';

interface SidebarProps {
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  onOTPRequest: (type: string, contact: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onRegisterClick, onForgotPasswordClick, onOTPRequest }) => {
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  return (
    <div className="p-3">
      {/* Login Section */}
      <div className="sidebar-section">
        <div className="sidebar-header">
          ĐĂNG NHẬP THÀNH VIÊN
        </div>
        <div className="p-3">
          <p className="small text-muted mb-3">
            Hãy đăng nhập thành viên để trải nghiệm đầy đủ các tính năng site
          </p>
          
          <div className="mb-3">
            <input 
              type="text" 
              className="form-control mb-2" 
              placeholder="Tên đăng nhập hoặc email"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
            />
            <input 
              type="password" 
              className="form-control mb-3" 
              placeholder="Mật khẩu"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            />
          </div>
          
          <div className="d-grid gap-2 mb-3">
            <button 
              className="btn btn-primary login-main-btn"
              onClick={() => onOTPRequest('email', loginData.username)}
            >
              Đăng nhập
            </button>
          </div>
          
          <div className="d-grid gap-2 mb-3">
            <button className="btn btn-google login-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" className="me-2">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập với Google
            </button>
          </div>
          
          <div className="text-center">
            <a 
              href="#" 
              className="small text-decoration-none text-muted d-block mb-2"
              onClick={(e) => {
                e.preventDefault();
                onForgotPasswordClick();
              }}
            >
              Quên mật khẩu
            </a>
            <a 
              href="#" 
              className="small text-decoration-none text-primary"
              onClick={(e) => {
                e.preventDefault();
                onRegisterClick();
              }}
            >
              Đăng ký tài khoản
            </a>
          </div>
        </div>
      </div>

      {/* Ranking Section */}
      <div className="sidebar-section">
        <div className="sidebar-header">
          BẢNG XẾP HẠNG ĐIỂM CAO
        </div>
        <div className="p-3">
          <div className="ranking-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small">🏆 Dương Thị Thanh</div>
                <div className="text-muted small">(Đề Thi Tiếng Anh Ngữ 4)</div>
                <div className="text-muted small">(Ngữ pháp)</div>
              </div>
              <div className="text-primary">
                271/10
              </div>
            </div>
          </div>
          
          <div className="ranking-item">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="small">🥈 Dương Thị Thanh</div>
                <div className="text-muted small">(Đề Thi Tiếng Anh Ngữ 4)</div>
                <div className="text-muted small">(Ngữ pháp)</div>
              </div>
              <div className="text-primary">
                271/10
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="sidebar-section">
        <div className="sidebar-header stats-section">
          THỐNG KÊ TRUY CẬP
        </div>
        <div className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small">📋 Đang truy cập</span>
            <span className="small">7</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small">✏️ Máy chủ bận kiệm</span>
            <span className="small">7</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small">👤 Khách vãng thăm</span>
            <span className="small">75</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small">🎯 Hôm nay</span>
            <span className="small">3,016</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small">📊 Tháng hiện tại</span>
            <span className="small">350,751</span>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="small">📈 Tổng lượt truy cập</span>
            <span className="small">22,507,683</span>
          </div>
        </div>
      </div>
    </div>
  );
};