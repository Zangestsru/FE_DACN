import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Header.css';

interface HeaderProps {
  onCertificationClick: () => void;
  onStudyClick: () => void;
  onHomeClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCertificationClick, onStudyClick, onHomeClick, onLoginClick, onRegisterClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-top">
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
              <div className="logo-text">
                <h1>THI CHỨNG CHỈ</h1>
                <small>TRẮC NGHIỆM TRỰC TUYẾN</small>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile controls row - only visible on mobile */}
        <div className="mobile-controls-row d-lg-none">
          <div className="mobile-menu-toggle">
            <button 
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>

          <div className="mobile-search">
            <div className="search-container-mobile">
              <input 
                type="search" 
                placeholder="Tìm kiếm..."
              />
              <button>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay d-lg-none"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-container">
          {/* Mobile menu close button */}
          <div className="mobile-menu-header d-lg-none">
            <button 
              className="mobile-menu-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <FaTimes size={24} />
            </button>
          </div>
          
          <ul className="nav-menu">
            <li className="nav-menu-item" onClick={() => {
              setIsMobileMenuOpen(false);
              onHomeClick();
            }}>
              <button className="nav-menu-link border-0 bg-transparent w-100 text-start">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                TRANG CHỦ
              </button>
            </li>
            
            <li className="nav-menu-item" onClick={() => {
              setIsMobileMenuOpen(false);
              onCertificationClick();
            }}>
              <button className="nav-menu-link border-0 bg-transparent w-100 text-start">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 4.24L10.2 9.13l-3.22.47 2.33 2.27-.55 3.21L12 13.77l3.24 1.31-.55-3.21 2.33-2.27-3.22-.47L12 6.24z"/>
                </svg>
                THI CHỨNG CHỈ
              </button>
            </li>
            
            <li className="nav-menu-item" onClick={() => {
              setIsMobileMenuOpen(false);
              onStudyClick();
            }}>
              <button className="nav-menu-link border-0 bg-transparent w-100 text-start">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                ÔN TẬP
              </button>
            </li>

            <li className="nav-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="nav-menu-link border-0 bg-transparent w-100 text-start">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="me-2">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                LIÊN HỆ
              </button>
            </li>
            
          </ul>
          
          {/* Right side elements */}
          <div className="nav-right">
            {/* Search Bar */}
            <div className="search-container-header d-none d-lg-flex" style={{ width: '180px' }}>
              <div className="position-relative w-100">
                <input 
                  type="search" 
                  className="form-control search-input-header w-100" 
                  placeholder="Tìm kiếm..."
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: 'white',
                    height: '32px',
                    fontSize: '0.85rem',
                    padding: '0.25rem 2rem 0.25rem 0.75rem',
                    borderRadius: '4px'
                  }}
                />
                <button className="search-btn-header" style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Auth Buttons */}
            <div className="auth-buttons d-flex">
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  onLoginClick();
                }}
              >
                ĐĂNG NHẬP
              </button>
              <button 
                className="btn btn-light btn-sm ms-2"
                onClick={(e) => {
                  e.preventDefault();
                  onRegisterClick();
                }}
              >
                ĐĂNG KÝ
              </button>
            </div>
          </div>
          
          {/* Mobile Auth Buttons */}
          <div className="mobile-auth-buttons d-lg-none">
            <button 
              className="btn btn-outline-light w-100 mb-2"
              onClick={(e) => {
                e.preventDefault();
                onLoginClick();
                setIsMobileMenuOpen(false);
              }}
            >
              ĐĂNG NHẬP
            </button>
            <button 
              className="btn btn-light w-100"
              onClick={(e) => {
                e.preventDefault();
                onRegisterClick();
                setIsMobileMenuOpen(false);
              }}
            >
              ĐĂNG KÝ
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};