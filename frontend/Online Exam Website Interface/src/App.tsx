import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import Footer from './components/Footer.simple';
import { HomePage } from './components/HomePage';
import { Sidebar } from './components/Sidebar';
import { ExamList } from './components/ExamList';
import { Register } from './components/Register';
import { Login } from './components/Login';
import { ForgotPassword } from './components/ForgotPassword';
import { CertificationExams } from './components/CertificationExams';
import { ExamDetail } from './components/ExamDetail';
import { ExamInfoForm } from './components/ExamInfoForm';
import { ExamTaking } from './components/ExamTaking';
import ExamResult from './components/ExamResult';
import { Payment } from './components/Payment';
import { OTPModal } from './components/OTPModal';
import { StudyMaterials } from './components/StudyMaterials';
import { StudyDetail } from './components/StudyDetail';
import { StudyLesson } from './components/StudyLesson';
import { ChatWidget } from './components/ChatWidget';
import { ScrollToTop } from './components/ScrollToTop';
import { ExamStart } from './pages/ExamStart';
import ProfilePage from './pages/Profile';
import { VerifyOtp } from './pages/Authentication/VerifyOtp';
import { UpdateProfile } from './pages/Authentication/UpdateProfile';
import { AuthProvider, ExamProvider, useAuthContext } from './contexts';
import { authService } from './services';
import { STORAGE_KEYS } from './constants';
import OtpVerification from './pages/auth/OtpVerification';
import { Toaster } from './components/ui/sonner';
// New history pages
import PaymentHistory from './pages/User/PaymentHistory';
import PurchasedExams from './pages/User/PurchasedExams';
import ExamHistory from './pages/User/ExamHistory';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function AppContent() {
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpData, setOTPData] = useState({ type: '', phone: '', email: '' });
  const [examResult, setExamResult] = useState(null);
  const [emailForOtp, setEmailForOtp] = useState('');
  const { updateUser } = useAuthContext();
  const navigate = useNavigate();

  const handleOTPVerification = (type: string, contact: string) => {
    setOTPData({ 
      type, 
      phone: type === 'phone' ? contact : '',
      email: type === 'email' ? contact : ''
    });
    setShowOTPModal(true);
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Toaster position="top-right" richColors />
      <ScrollToTop />
      <Header 
        onCertificationClick={() => navigate('/certification-exams')}
        onStudyClick={() => navigate('/study-materials')}
        onHomeClick={() => navigate('/home')}
        onLoginClick={() => navigate('/login')}
        onRegisterClick={() => navigate('/register')}
        onProfileClick={() => navigate('/profile')}
        onPaymentHistoryClick={() => navigate('/payment-history')}
        onPurchasedExamsClick={() => navigate('/purchased-exams')}
        onExamHistoryClick={() => navigate('/exam-history')}
      />
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<HomePage onCertificationClick={() => navigate('/certification-exams')} onTestExamStart={() => navigate('/exam-start')} />} />
          <Route path="/home" element={<HomePage onCertificationClick={() => navigate('/certification-exams')} onTestExamStart={() => navigate('/exam-start')} />} />
          <Route path="/login" element={<Login onBackToHome={() => navigate('/')} onOTPRequest={handleOTPVerification} onForgotPassword={() => navigate('/forgot-password')} onRegister={() => navigate('/register')} />} />
          <Route path="/register" element={<Register onBackToHome={() => navigate('/')} onLogin={() => navigate('/login')} onRegisterSuccess={(email) => { setEmailForOtp(email); navigate('/verify-otp'); }} />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/verify-otp" element={<VerifyOtp email={emailForOtp} onLogin={() => navigate('/login')} />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword onBackToHome={() => navigate('/')} onOTPRequest={handleOTPVerification} />} />
          <Route path="/study-materials" element={<StudyMaterials onCourseSelect={(course) => { setSelectedCourse(course); navigate('/study-detail'); }} />} />
          <Route path="/study-detail" element={<StudyDetail course={selectedCourse} onBackToList={() => navigate('/study-materials')} onRegister={() => navigate('/study-payment')} onStartLearning={() => navigate('/study-lesson')} />} />
          <Route path="/study-lesson" element={<StudyLesson course={selectedCourse} onBackToCourse={() => navigate('/study-detail')} />} />
          <Route path="/study-payment" element={<Payment exam={selectedCourse} onPaymentSuccess={() => navigate('/study-lesson')} onCancel={() => navigate('/study-detail')} />} />
          <Route path="/certification-exams" element={<CertificationExams onExamSelect={(exam) => { setSelectedExam(exam); navigate('/exam-detail'); }} />} />
          <Route path="/exam-detail" element={<ExamDetail exam={selectedExam} onBackToList={() => navigate('/certification-exams')} onRegister={() => navigate('/payment')} />} />
          <Route path="/payment" element={<Payment exam={selectedExam} onPaymentSuccess={() => navigate('/pre-exam')} onCancel={() => navigate('/exam-detail')} />} />
          <Route path="/pre-exam" element={<ExamInfoForm exam={selectedExam} onStartExam={() => navigate('/exam-taking')} showBackButton={true} onCancel={() => navigate('/exam-detail')} mode="preexam" />} />
          <Route path="/exam-taking" element={<div style={{ minHeight: '100vh', height: 'auto' }}><ExamTaking exam={selectedExam} onSubmitExam={(result) => { setExamResult(result); navigate('/exam-result'); }} /></div>} />
          <Route path="/exam-result" element={<ExamResult exam={selectedExam} result={examResult} onBackToHome={() => navigate('/')} />} />
          <Route path="/exam-start" element={<ExamStart />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* History routes */}
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/purchased-exams" element={<PurchasedExams />} />
          <Route path="/exam-history" element={<ExamHistory />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget isVisible={true} />
      {showOTPModal && (
        <OTPModal
          type={otpData.type}
          contact={otpData.phone || otpData.email}
          onClose={() => setShowOTPModal(false)}
          onVerify={async (code) => {
            try {
              const contact = otpData.phone || otpData.email;
              const res = await authService.verifyOTP(
                (otpData.type as 'email' | 'phone'),
                contact,
                code
              );

              if (res.verified) {
                updateUser({ isVerified: true });
                setShowOTPModal(false);
              } else {
                alert(res.message || 'Xác thực OTP không thành công');
              }
            } catch (error) {
              console.error('OTP verification error:', error);
              alert('Xác thực OTP thất bại. Vui lòng thử lại.');
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <ExamProvider>
            <AppContent />
          </ExamProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}