import React, { useState } from 'react';
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
import { PreExam } from './components/PreExam';
import { ExamTaking } from './components/ExamTaking';
import ExamResult from './components/ExamResult';
import { Payment } from './components/Payment';
import { OTPModal } from './components/OTPModal';
import { StudyMaterials } from './components/StudyMaterials';
import { StudyDetail } from './components/StudyDetail';
import { StudyLesson } from './components/StudyLesson';
import { ChatWidget } from './components/ChatWidget';
import { AuthProvider, ExamProvider } from './contexts';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';

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
        return <ExamDetail 
          exam={selectedExam}
          onBackToList={() => setCurrentPage('certification-exams')}
          onRegister={() => setCurrentPage('payment')}
        />;
      case 'payment':
        return <Payment 
          exam={selectedExam}
          onPaymentSuccess={() => setCurrentPage('pre-exam')}
          onCancel={() => setCurrentPage('exam-detail')}
        />;
      case 'pre-exam':
        return <PreExam 
          exam={selectedExam}
          onStartExam={() => setCurrentPage('exam-taking')}
        />;
      case 'exam-taking':
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
        return <ExamResult 
          exam={selectedExam}
          result={examResult}
          onBackToHome={() => setCurrentPage('home')}
        />;
      default:
        return <HomePage onCertificationClick={() => setCurrentPage('certification-exams')} />;
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {currentPage !== 'exam-taking' && currentPage !== 'study-lesson' && (
        <Header 
          onCertificationClick={() => setCurrentPage('certification-exams')}
          onStudyClick={() => setCurrentPage('study-materials')}
          onHomeClick={() => setCurrentPage('home')}
          onLoginClick={() => setCurrentPage('login')}
          onRegisterClick={() => setCurrentPage('register')}
        />
      )}
      <main className={currentPage !== 'exam-taking' && currentPage !== 'study-lesson' ? 'main-content' : ''}>
        {renderCurrentPage()}
      </main>
      {currentPage !== 'exam-taking' && currentPage !== 'study-lesson' && <Footer />}
      
      {/* Chat Widget - không hiển thị khi đang thi hoặc học */}
      <ChatWidget isVisible={currentPage !== 'exam-taking' && currentPage !== 'study-lesson'} />
      
      {showOTPModal && (
        <OTPModal
          type={otpData.type}
          contact={otpData.phone || otpData.email}
          onClose={() => setShowOTPModal(false)}
          onVerify={() => {
            setShowOTPModal(false);
            // Handle successful verification
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
    <AuthProvider>
      <ExamProvider>
        <AppContent />
      </ExamProvider>
    </AuthProvider>
  );
}