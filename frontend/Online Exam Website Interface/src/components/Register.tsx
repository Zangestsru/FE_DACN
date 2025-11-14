import React, { useState } from 'react';
import './Register.css';
import '@/index.css';
import backgroundImage from '/images/background.png';
import { RegisterForm } from './RegisterForm';
import { RegisterSuccess } from './RegisterSuccess';

interface RegisterProps {
  onBackToHome: () => void;
  onLogin: () => void;
  onRegisterSuccess: (email: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onBackToHome, onLogin, onRegisterSuccess }) => {
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleRegisterSuccess = (email: string) => {
    setRegisterSuccess(true);
    setEmail(email);
    setTimeout(() => {
      onRegisterSuccess(email);
    }, 2000);
  };

  return (
    <>
      <style>{`
        .register-fullscreen-bg {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%), 
                      url("${backgroundImage}");
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          min-height: 100vh;
        }
        @media (max-width: 576px) {
          .register-form-container {
            margin: 1rem !important;
            border-radius: 1rem !important;
          }
          .register-fullscreen-bg {
            background-attachment: scroll;
            padding-top: 4vh !important;
            padding-bottom: 4vh !important;
          }
        }
        @media (max-width: 768px) {
          .register-fullscreen-bg {
            padding-top: 6vh !important;
            padding-bottom: 6vh !important;
          }
        }
      `}</style>
      
      <div className="register-fullscreen-bg d-flex align-items-start justify-content-center" style={{ paddingTop: '8vh', paddingBottom: '8vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="mx-auto" style={{ maxWidth: '480px' }}>
                <div className="bg-white rounded-3 shadow-lg border p-4 p-sm-5 register-form-container" style={{ 
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  marginTop: '2rem',
                  marginBottom: '2rem'
                }}>
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold mb-2" style={{ color: '#333', fontSize: 'clamp(1.5rem, 4vw, 1.75rem)' }}>Tạo Tài Khoản Mới</h1>
                  </div>

                  {registerSuccess ? (
                    <RegisterSuccess onLogin={onLogin} />
                  ) : (
                    <RegisterForm 
                      onRegisterSuccess={handleRegisterSuccess} 
                      onLogin={onLogin} 
                      onBackToHome={onBackToHome} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};