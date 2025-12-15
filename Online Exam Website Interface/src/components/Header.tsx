import React, { useEffect, useState } from 'react';
import './Header.css';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services';

interface HeaderProps {
  onCertificationClick: () => void;
  onStudyClick: () => void;
  onHomeClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onProfileClick?: () => void; // điều hướng đến trang hồ sơ
  // Mới: các mục lịch sử
  onPaymentHistoryClick?: () => void;
  onPurchasedExamsClick?: () => void;
  onEnrolledCoursesClick?: () => void; // Khóa học đã đăng ký
  onExamHistoryClick?: () => void;
  onChatClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onCertificationClick, 
  onStudyClick, 
  onHomeClick, 
  onLoginClick, 
  onRegisterClick,
  onProfileClick,
  onPaymentHistoryClick,
  onPurchasedExamsClick,
  onEnrolledCoursesClick,
  onExamHistoryClick,
  onChatClick,
}) => {
  // State MỚI cho menu hamburger, theo yêu cầu của CSS
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State MỚI cho mobile search overlay
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  // State cho search input header
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  // Desktop: bỏ chế độ mở rộng thanh tìm kiếm để tránh layout bị nhảy sang bên
  // State cho user dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Listen for unread messages
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to SignalR if not connected
      chatService.connect().catch(console.error);
      
      const unsub = chatService.onMessageReceived((msg) => {
        // If message is not from current user, show notification
        if (user && String(msg.senderId) !== String(user.id)) {
          setHasUnreadMessages(true);
        }
      });
      return unsub;
    }
  }, [isAuthenticated, user]);

  // Hàm MỚI để bật/tắt menu di động
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };


  // Hàm MỚI để bật/tắt mobile search overlay
  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
  };

  // Desktop search: không dùng mở rộng inline nữa

  const toggleUserMenu = () => {
    setIsUserMenuOpen(prev => !prev);
  };

  const closeUserMenu = () => setIsUserMenuOpen(false);

  const handleLogout = async () => {
    try {
      // Hỏi BE-style: đăng xuất mọi thiết bị hay chỉ thiết bị hiện tại
      const logoutAll = window.confirm(
        'Bạn có muốn đăng xuất khỏi TẤT CẢ thiết bị không?\n\nOK: Đăng xuất khỏi tất cả thiết bị\nCancel: Chỉ đăng xuất trên thiết bị này'
      );

      await logout(logoutAll);
      // Phát sự kiện đăng xuất để các phần khác có thể cập nhật nếu cần
      window.dispatchEvent(new CustomEvent('auth:logged-out'));
      closeUserMenu();
      onHomeClick();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Chuyển đến trang yêu cầu vai trò giáo viên
  const handleRequestTeacherRoleClick = () => {
    closeUserMenu();
    navigate('/request-teacher-role');
  };

  // Xác định tài khoản có quyền quản trị (roleid = 1 theo DB hoặc role = 'admin')
  // Hỗ trợ cả các trường tên khác nhau từ BE: roleId/RoleId, roleName/RoleName
  const userRole = user?.role?.toLowerCase() || '';
  const userRoleId = (user as any)?.roleId ?? (user as any)?.RoleId;
  
  const isAdminUser = !!(
    isAuthenticated && user && (
      userRole === 'admin' ||
      userRoleId === 1 ||
      ((user as any)?.roleName || (user as any)?.RoleName)?.toString()?.toLowerCase() === 'admin'
    )
  );

  const isTeacherUser = !!(
    isAuthenticated && user && (
      userRole === 'teacher' ||
      userRoleId === 2 ||
      ((user as any)?.roleName || (user as any)?.RoleName)?.toString()?.toLowerCase() === 'teacher'
    )
  );

  // Kiểm tra user thường (không phải admin và teacher)
  const isRegularUser = isAuthenticated && user && !isAdminUser && !isTeacherUser;

  // Debug log để kiểm tra role
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔍 Header - User role check:', {
        user,
        role: user?.role,
        roleId: userRoleId,
        userRole,
        isAdminUser,
        isTeacherUser,
        'user?.role === "admin"': user?.role === 'admin',
        'user?.role === "teacher"': (user?.role as string) === 'teacher',
        'userRoleId === 1': userRoleId === 1,
        'userRoleId === 2': userRoleId === 2,
      });
    } else if (isAuthenticated && !user) {
      console.warn('⚠️ Header - User is authenticated but user data is null');
    }
  }, [user, isAuthenticated, isAdminUser, isTeacherUser, userRole, userRoleId]);


  // Lắng nghe sự kiện đăng nhập để refresh user trong Header
  useEffect(() => {
    const onLoggedIn = () => { refreshUser(); };
    const onProfileUpdated = () => { refreshUser(); };
    window.addEventListener('auth:logged-in', onLoggedIn);
    window.addEventListener('auth:profile-updated', onProfileUpdated);
    return () => {
      window.removeEventListener('auth:logged-in', onLoggedIn);
      window.removeEventListener('auth:profile-updated', onProfileUpdated);
    };
  }, [refreshUser]);

  // Hàm tạo hiệu ứng ripple
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  // Hàm xử lý click nút tìm kiếm với hiệu ứng
  const handleSearchClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    
    // Mở mobile search inline
    setIsMobileSearchOpen(true);
  };



  // Hàm xử lý search submit
  const handleSearchSubmit = () => {
    if (headerSearchQuery.trim()) {
      navigate(`/certification-exams?q=${encodeURIComponent(headerSearchQuery.trim())}`);
      // Nếu đang ở mobile thì đóng search overlay
      setIsMobileSearchOpen(false);
    }
  };

  // Hàm xử lý search enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // Hàm xử lý nhấp chuột trên menu di động (để đóng menu sau khi nhấp)
  const handleMobileNavClick = (callback: () => void) => {
    callback();
    toggleMobileMenu();
  };

  return (
    <> {/* Sử dụng Fragment để chứa header, nav di động và overlay */}
      
      {/* 1. THANH HEADER CHÍNH */}
      <header className="header">
        <div className="header-container">

          {/* --- A. CHẾ ĐỘ XEM DESKTOP --- */}
          <div className="header-top d-none d-lg-flex">
            {/* Logo (Desktop) */}
            <div className="header-logo">
              <button 
                className="logo-button"
                onClick={onHomeClick}
              >
                <div className="logo-icon">
                  <svg viewBox="0 0 24 24" fill="white">
                    <path d="M4 4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4zm0 2h16v12H4V6zm2 2v2h12V8H6zm0 4v2h12v-2H6zm0 4v2h8v-2H6z"/>
                  </svg>
                </div>
                <div className={"logo-text"}>
                  <h1>THI CHỨNG CHỈ</h1>
                  <small>TRẮC NGHIỆM TRỰC TUYẾN</small>
                </div>
              </button>
            </div>


            {/* Navigation (Desktop) */}
            <nav className="desktop-nav">
              <ul className="nav-menu-horizontal">
                <li className="nav-menu-item-horizontal">
                  <button className="nav-menu-link-horizontal" onClick={onHomeClick}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                    </svg>
                    TRANG CHỦ
                  </button>
                </li>
                <li className="nav-menu-item-horizontal">
                  <button className="nav-menu-link-horizontal" onClick={onCertificationClick}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 4.24L10.2 9.13l-3.22.47 2.33 2.27-.55 3.21L12 13.77l3.24 1.31-.55-3.21 2.33-2.27-3.22-.47L12 6.24z"/>
                    </svg>
                    THI CHỨNG CHỈ
                  </button>
                </li>
                <li className="nav-menu-item-horizontal">
                  <button className="nav-menu-link-horizontal" onClick={onStudyClick}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    ÔN TẬP
                  </button>
                </li>
              </ul>
            </nav>

            {/* Phía phải (Desktop) */}
            <div className="header-right">
              {/* Search (Desktop) - giữ nguyên tại chỗ, không mở rộng khi click */}
              <div className="search-container-header" style={{ width: '250px' }}>
                <div className="position-relative w-100">
                  <input 
                    type="search" 
                    className="form-control search-input-header w-100" 
                    placeholder="Tìm kiếm..."
                    value={headerSearchQuery}
                    onChange={(e) => setHeaderSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      cursor: 'text',
                      paddingRight: '40px'
                    }}
                  />
                  <button 
                    className="search-btn-header"
                    type="button"
                    onClick={handleSearchSubmit}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    aria-label="Tìm kiếm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Auth / User (Desktop) */}
              {!isAuthenticated ? (
                <div className="auth-buttons">
                  <button 
                    className="btn btn-outline-light me-2"
                    onClick={onLoginClick}
                  >
                    ĐĂNG NHẬP
                  </button>
                  <button 
                    className="btn btn-light"
                    onClick={onRegisterClick}
                  >
                    ĐĂNG KÝ
                  </button>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-3">
                  <button 
                    className="relative flex items-center justify-center transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:bg-gray-100 h-10 w-10 dark:border-gray-800 dark:bg-gray-900"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => {
                      setHasUnreadMessages(false);
                    }}
                  >
                    {hasUnreadMessages && (
                      <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">New alerts</span>
                      </span>
                    )}
                    <svg className="fill-current text-gray-600 dark:text-white" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill="currentColor"></path>
                    </svg>
                  </button>

                  <div className="position-relative">
                  <button 
                    className="btn btn-light d-flex align-items-center"
                    onClick={toggleUserMenu}
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                    style={{ borderRadius: '999px', gap: '8px' }}
                  >
                    {/* User icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                    </svg>
                    <span style={{ fontWeight: 600 }}>
                      {isAuthenticated ? (user?.fullName || user?.username || user?.email) : 'Người dùng'}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="position-fixed top-0 start-0 w-100 h-100" 
                        onClick={closeUserMenu}
                        style={{ backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 998 }}
                      />
                      {/* Dropdown */}
                      <div 
                        className="card shadow" 
                        style={{ position: 'absolute', right: 0, top: '110%', minWidth: '220px', zIndex: 999, borderRadius: '12px' }}
                        role="menu"
                      >
                        <div className="card-body p-2">
                          <div className="px-2 py-2 text-muted small">
                            Đã đăng nhập: {isAuthenticated ? user?.email : 'Chưa xác thực'}
                          </div>
                          <hr className="my-2" />
                          {isAdminUser && (
                            <button
                              className="btn btn-link w-100 text-start"
                              style={{ textDecoration: 'none' }}
                              onClick={() => { navigate('/admin/'); closeUserMenu(); }}
                            >
                              Quản trị
                            </button>
                          )}
                          {isTeacherUser && (
                            <button
                              className="btn btn-link w-100 text-start"
                              style={{ textDecoration: 'none' }}
                              onClick={() => { navigate('/teacher/'); closeUserMenu(); }}
                            >
                              Quản lý
                            </button>
                          )}
                          {/* Yêu cầu vai trò giáo viên - chỉ hiển thị với user thường */}
                          {isRegularUser && (
                            <>
                              <button
                                className="btn btn-link w-100 text-start"
                                style={{ textDecoration: 'none' }}
                                onClick={handleRequestTeacherRoleClick}
                              >
                                Yêu cầu vai trò giáo viên
                              </button>
                              <button
                                className="btn btn-link w-100 text-start"
                                style={{ textDecoration: 'none' }}
                                onClick={() => { onChatClick?.(); closeUserMenu(); }}
                              >
                                Đoạn chat
                              </button>
                            </>
                          )}
                          {/* Các mục lịch sử */}
                          <button
                            className="btn btn-link w-100 text-start"
                            style={{ textDecoration: 'none' }}
                            onClick={() => { onPaymentHistoryClick?.(); closeUserMenu(); }}
                          >
                            Lịch sử thanh toán
                          </button>
                          <button
                            className="btn btn-link w-100 text-start"
                            style={{ textDecoration: 'none' }}
                            onClick={() => { onPurchasedExamsClick?.(); closeUserMenu(); }}
                          >
                            Bài thi đã mua
                          </button>
                          <button
                            className="btn btn-link w-100 text-start"
                            style={{ textDecoration: 'none' }}
                            onClick={() => { onEnrolledCoursesClick?.(); closeUserMenu(); }}
                          >
                            Khóa học đã đăng ký
                          </button>
                          <button
                            className="btn btn-link w-100 text-start"
                            style={{ textDecoration: 'none' }}
                            onClick={() => { onExamHistoryClick?.(); closeUserMenu(); }}
                          >
                            Lịch sử làm bài
                          </button>
                          <button className="btn btn-link w-100 text-start" style={{ textDecoration: 'none' }} onClick={() => { onProfileClick?.(); closeUserMenu(); }}>
                            Hồ sơ
                          </button>
                          <button className="btn btn-link w-100 text-start text-danger" style={{ textDecoration: 'none' }} onClick={handleLogout}>
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- B. CHẾ ĐỘ XEM MOBILE/TABLET --- */}
          <div className="d-lg-none">
            {/* Hàng logo và điều khiển cho di động */}
            <div className="header-top">
              <div className={`header-logo ${isMobileSearchOpen ? 'logo-hidden' : ''}`}>
                <button 
                  className="logo-button"
                  onClick={onHomeClick}
                >
                  <div className="logo-icon">
                    <svg viewBox="0 0 24 24" fill="white">
                      <path d="M4 4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4zm0 2h16v12H4V6zm2 2v2h12V8H6zm0 4v2h12v-2H6zm0 4v2h8v-2H6z"/>
                    </svg>
                  </div>
                  <div className="logo-text">
                    <h1>THI CHỨNG CHỈ</h1>
                    <small>TRẮC NGHIỆM TRỰC TUYẾN</small>
                  </div>
                </button>
              </div>

              {/* Mobile Search Expanded Inline */}
              {isMobileSearchOpen && (
                <div className="mobile-search-expanded-inline">
                  <input 
                    type="search" 
                    placeholder="Tìm kiếm..." 
                    autoFocus
                    className="mobile-search-input-inline"
                    value={headerSearchQuery}
                    onChange={(e) => setHeaderSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  <button 
                    className="mobile-search-close-inline"
                    onClick={handleSearchSubmit}
                    aria-label="Tìm kiếm"
                    style={{ right: '40px' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  </button>
                  <button 
                    className="mobile-search-close-inline"
                    onClick={toggleMobileSearch}
                    aria-label="Đóng tìm kiếm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Mobile Controls */}
              <div className="mobile-controls">
                {/* Search Icon */}
                <button 
                  className="mobile-search-toggle-btn"
                  onClick={handleSearchClick}
                  aria-label="Tìm kiếm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>

                {/* Hamburger Menu */}
                <button 
                  className="mobile-menu-toggle-btn"
                  onClick={toggleMobileMenu} 
                  aria-label="Open menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Mobile Menu Overlay */}
          <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
            
            {/* Mobile Navigation - sử dụng CSS có sẵn */}
            <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <div className="nav-container">
                {/* Mobile Menu Header */}
                <div className="mobile-menu-header">
                  <button 
                    className="mobile-menu-close-btn"
                    onClick={toggleMobileMenu}
                    aria-label="Đóng menu"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>

                {/* Mobile Menu Items */}
                <ul className="nav-menu">
                  <li className="nav-menu-item">
                    <button className="nav-menu-link" onClick={() => { onHomeClick(); toggleMobileMenu(); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                      </svg>
                      TRANG CHỦ
                    </button>
                  </li>
                  <li className="nav-menu-item">
                    <button className="nav-menu-link" onClick={() => { onCertificationClick(); toggleMobileMenu(); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 4.24L10.2 9.13l-3.22.47 2.33 2.27-.55 3.21L12 13.77l3.24 1.31-.55-3.21 2.33-2.27-3.22-.47L12 6.24z"/>
                      </svg>
                      THI CHỨNG CHỈ
                    </button>
                  </li>
                  <li className="nav-menu-item">
                    <button className="nav-menu-link" onClick={() => { onStudyClick(); toggleMobileMenu(); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                      </svg>
                      ÔN TẬP
                    </button>
                  </li>
                </ul>

                {/* Mobile Auth / User */}
                {!isAuthenticated ? (
                  <div className="mobile-auth-buttons">
                    <button className="btn btn-outline-light" onClick={() => { onLoginClick(); toggleMobileMenu(); }}>
                      ĐĂNG NHẬP
                    </button>
                    <button className="btn btn-light" onClick={() => { onRegisterClick(); toggleMobileMenu(); }}>
                      ĐĂNG KÝ
                    </button>
                  </div>
                ) : (
                  <div className="mobile-auth-buttons">
                    <div className="d-flex align-items-center gap-2 mb-3 text-white">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                      </svg>
                      <span>{isAuthenticated ? (user?.fullName || user?.username || user?.email) : 'Người dùng'}</span>
                    </div>
                    {/* Các mục cho mobile */}
                    {isAdminUser && (
                      <button className="btn btn-light w-100 mb-2" onClick={() => { navigate('/admin/'); toggleMobileMenu(); }}>
                        Quản trị
                      </button>
                    )}
                    {isTeacherUser && (
                      <button className="btn btn-light w-100 mb-2" onClick={() => { navigate('/teacher/'); toggleMobileMenu(); }}>
                        Quản lý
                      </button>
                    )}
                    {/* Yêu cầu vai trò giáo viên - chỉ hiển thị với user thường */}
                    {isRegularUser && (
                      <>
                        <button className="btn btn-light w-100 mb-2" onClick={() => {
                          toggleMobileMenu();
                          handleRequestTeacherRoleClick();
                        }}>
                          Yêu cầu vai trò giáo viên
                        </button>
                        <button className="btn btn-light w-100 mb-2" onClick={() => {
                          onChatClick?.();
                          toggleMobileMenu();
                        }}>
                          Đoạn chat
                        </button>
                      </>
                    )}
                    <button className="btn btn-light w-100 mb-2" onClick={() => { onPaymentHistoryClick?.(); toggleMobileMenu(); }}>
                      Lịch sử thanh toán
                    </button>
                    <button className="btn btn-light w-100 mb-2" onClick={() => { onPurchasedExamsClick?.(); toggleMobileMenu(); }}>
                      Bài thi đã mua
                    </button>
                    <button className="btn btn-light w-100 mb-2" onClick={() => { onEnrolledCoursesClick?.(); toggleMobileMenu(); }}>
                      Khóa học đã đăng ký
                    </button>
                    <button className="btn btn-light w-100 mb-2" onClick={() => { onExamHistoryClick?.(); toggleMobileMenu(); }}>
                      Lịch sử làm bài
                    </button>
                    <button className="btn btn-light w-100 mb-2" onClick={() => { onProfileClick?.(); toggleMobileMenu(); }}>
                      Hồ sơ
                    </button>
                    <button className="btn btn-outline-light w-100" onClick={() => { handleLogout(); toggleMobileMenu(); }}>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </nav>

        </>
      )}

    </>
  );
};
