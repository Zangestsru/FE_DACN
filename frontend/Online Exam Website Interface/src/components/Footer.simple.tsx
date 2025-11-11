import React from 'react';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#1e40af',
      color: 'white',
      padding: '2rem 0',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem'
      }}>
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}>HỆ THỐNG LUYỆN THI</h3>
          <p style={{
            opacity: 0.8,
            marginBottom: '1rem'
          }}>TRẮC NGHIỆM TRỰC TUYẾN</p>
          <p style={{
            opacity: 0.8,
            marginBottom: '1rem'
          }}>
            Nền tảng luyện thi trắc nghiệm trực tuyến hàng đầu Việt Nam.
          </p>
        </div>

        <div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>Thi thử</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Toán học', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học'].map((item, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  ':hover': {
                    color: 'white'
                  }
                }}>{item}</a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>Liên hệ</h4>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <FaEnvelope style={{ marginRight: '0.5rem', marginTop: '0.25rem' }} />
              <span>support@onthitracnghiem.online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <FaPhoneAlt style={{ marginRight: '0.5rem', marginTop: '0.25rem' }} />
              <span>1900 1234</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <FaMapMarkerAlt style={{ marginRight: '0.5rem', marginTop: '0.25rem' }} />
              <span>Hà Nội, Việt Nam</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        fontSize: '0.875rem',
        opacity: 0.8
      }}>
        © {new Date().getFullYear()} Hệ thống luyện thi trắc nghiệm. Tất cả các quyền được bảo lưu.
      </div>
    </footer>
  );
};

export default Footer;
