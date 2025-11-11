import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
import { AuthProvider, ExamProvider, useAuthContext } from './contexts';
import { authService } from './services';
import { STORAGE_KEYS } from './constants';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/responsive-layout.css';
import './styles/custom.css';

// Create Material-UI theme
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

/**
 * Main App Component
 * Wrapped với AuthProvider và ExamProvider cho global state management
 */
function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpData, setOTPData] = useState({ type: '', phone: '', email: '' });
  const [examResult, setExamResult] = useState(null);
  const { updateUser } = useAuthContext();

  const handleOTPVerification = (type: string, contact: string) => {
    setOTPData({ 
      type, 
      phone: type === 'phone' ? contact : '',
      email: type === 'email' ? contact : ''
    });
    setShowOTPModal(true);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login 
          onBackToHome={() => setCurrentPage('home')} 
          onOTPRequest={handleOTPVerification}
          onForgotPassword={() => setCurrentPage('forgot-password')}
          onRegister={() => setCurrentPage('register')}
        />;
      case 'register':
        return <Register 
          onBackToHome={() => setCurrentPage('home')} 
          onOTPRequest={handleOTPVerification}
          onLogin={() => setCurrentPage('login')}
        />;
      case 'forgot-password':
        return <ForgotPassword 
          onBackToHome={() => setCurrentPage('home')}
          onOTPRequest={handleOTPVerification}
        />;
      case 'study-materials':
        return <StudyMaterials 
          onCourseSelect={(course) => {
            setSelectedCourse(course);
            setCurrentPage('study-detail');
          }}
        />;
      case 'study-detail':
        return <StudyDetail 
          course={selectedCourse}
          onBackToList={() => setCurrentPage('study-materials')}
          onRegister={() => setCurrentPage('study-payment')}
          onStartLearning={() => setCurrentPage('study-lesson')}
        />;
      case 'study-lesson':
        return <StudyLesson 
          course={selectedCourse}
          onBackToCourse={() => setCurrentPage('study-detail')}
        />;
      case 'study-payment':
        return <Payment 
          exam={selectedCourse}
          onPaymentSuccess={() => setCurrentPage('study-lesson')}
          onCancel={() => setCurrentPage('study-detail')}
        />;
      case 'certification-exams':
        return <CertificationExams 
          onExamSelect={(exam) => {
            setSelectedExam(exam);
            setCurrentPage('exam-detail');
          }}
        />;
      case 'exam-detail':
        if (!selectedExam) {
          setCurrentPage('certification-exams');
          return null;
        }
        return <ExamDetail 
          exam={selectedExam}
          onBackToList={() => setCurrentPage('certification-exams')}
          onRegister={() => setCurrentPage('payment')}
        />;
      case 'payment':
        if (!selectedExam) {
          setCurrentPage('certification-exams');
          return null;
        }
        return <Payment 
          exam={selectedExam}
          onPaymentSuccess={() => setCurrentPage('pre-exam')}
          onCancel={() => setCurrentPage('exam-detail')}
        />;
      case 'pre-exam':
        if (!selectedExam) {
          // Nếu không có exam được chọn, chuyển về trang certification-exams
          setCurrentPage('certification-exams');
          return null;
        }
        return <ExamInfoForm 
          exam={selectedExam}
          onStartExam={() => setCurrentPage('exam-taking')}
          showBackButton={true}
          onCancel={() => setCurrentPage('exam-detail')}
          mode="preexam"
        />;
      case 'exam-taking':
        if (!selectedExam) {
          setCurrentPage('certification-exams');
          return null;
        }
        return (
          <div style={{ minHeight: '100vh', height: 'auto' }}>
            <ExamTaking 
              exam={selectedExam}
              onSubmitExam={(result) => {
                setExamResult(result);
                setCurrentPage('exam-result');
              }}
            />
          </div>
        );
      case 'exam-result':
        if (!selectedExam || !examResult) {
          setCurrentPage('certification-exams');
          return null;
        }
        return <ExamResult 
          exam={selectedExam}
          result={examResult}
          onBackToHome={() => setCurrentPage('home')}
        />;
      default:
        return <HomePage 
          onCertificationClick={() => setCurrentPage('certification-exams')}
          onTestExamStart={() => setCurrentPage('exam-start')}
        />;
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* ScrollToTop component để tự động cuộn lên đầu trang khi chuyển trang */}
      <ScrollToTop currentPage={currentPage} />
      
      {currentPage !== 'exam-taking' && currentPage !== 'study-lesson' && currentPage !== 'exam-start' && (
        <Header 
          onCertificationClick={() => setCurrentPage('certification-exams')}
          onStudyClick={() => setCurrentPage('study-materials')}
          onHomeClick={() => setCurrentPage('home')}
          onLoginClick={() => setCurrentPage('login')}
          onRegisterClick={() => setCurrentPage('register')}
        />
      )}
      <main className={currentPage !== 'exam-taking' && currentPage !== 'study-lesson' && currentPage !== 'exam-start' ? 'main-content' : ''}>
        {renderCurrentPage()}
      </main>
      {currentPage !== 'exam-taking' && currentPage !== 'study-lesson' && currentPage !== 'exam-start' && <Footer />}
      
      {/* Chat Widget - không hiển thị khi đang thi hoặc học */}
      <ChatWidget isVisible={currentPage !== 'exam-taking' && currentPage !== 'study-lesson' && currentPage !== 'exam-start'} />
      
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
                // If server returns a fresh token, authService already saved it
                // Mark user as verified in context/localStorage
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

/**
 * App with Providers
 * Wrap AppContent với tất cả providers theo đúng hierarchy
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ExamProvider>
          <AppContent />
        </ExamProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}