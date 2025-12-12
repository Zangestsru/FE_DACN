import React, { useEffect, useState, Suspense } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import ChatPage from './pages/Chat/ChatPage';
import ProfilePage from './pages/Profile';
import { VerifyOtp } from './pages/Authentication/VerifyOtp';
import { UpdateProfile } from './pages/Authentication/UpdateProfile';
import { AuthProvider, ExamProvider, useAuthContext } from './contexts';
import { authService } from './services';
import { STORAGE_KEYS } from './constants';
import OtpVerification from './pages/auth/OtpVerification';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './routes/ProtectedRoute';
import Forbidden from './pages/Forbidden';
import PayOSTest from './pages/Dev/PayOSTest';
const ExternalRedirect: React.FC<{ to: 'admin' | 'teacher' }> = ({ to }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const target = to === 'admin' ? '/admin/' : '/teacher/';
      window.location.href = target;
    }
  }, [to]);
  return null;
};
// New history pages
import PaymentHistory from './pages/User/PaymentHistory';
import PaymentSuccessCallback from './pages/User/PaymentSuccessCallback';
import PurchasedExams from './pages/User/PurchasedExams';
import EnrolledCourses from './pages/User/EnrolledCourses';
import ExamHistory from './pages/User/ExamHistory';
import RequestTeacherRole from './pages/User/RequestTeacherRole';
import AdminChat from './pages/Admin/Chat';

// @source "./node_modules/flyonui/dist/index.js"; /* Require only if you want to use FlyonUI JS component */
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
  const location = useLocation();

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
        onChatClick={() => navigate('/chat')}
        onPaymentHistoryClick={() => navigate('/payment-history')}
        onPurchasedExamsClick={() => navigate('/purchased-exams')}
        onEnrolledCoursesClick={() => navigate('/enrolled-courses')}
        onExamHistoryClick={() => navigate('/exam-history')}
      />
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<HomePage onCertificationClick={() => navigate('/certification-exams')} />} />
          <Route path="/home" element={<HomePage onCertificationClick={() => navigate('/certification-exams')} />} />
          <Route path="/login" element={<Login onBackToHome={() => navigate('/')} onOTPRequest={handleOTPVerification} onForgotPassword={() => navigate('/forgot-password')} onRegister={() => navigate('/register')} />} />
          <Route path="/register" element={<Register onBackToHome={() => navigate('/')} onLogin={() => navigate('/login')} onRegisterSuccess={(email) => { setEmailForOtp(email); navigate('/verify-otp'); }} />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/verify-otp" element={<VerifyOtp email={emailForOtp} onLogin={() => navigate('/login')} />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/forgot-password" element={<ForgotPassword onBackToHome={() => navigate('/')} onOTPRequest={handleOTPVerification} />} />
          <Route path="/study-materials" element={<StudyMaterials onCourseSelect={(course) => { navigate(`/study-detail/${course.id}`); }} />} />
          <Route path="/study-detail/:courseId" element={<StudyDetail onBackToList={() => navigate('/study-materials')} />} />
          <Route path="/study-lesson/:courseId" element={<StudyLesson onBackToCourse={(courseId) => navigate(`/study-detail/${courseId}`)} />} />
          <Route path="/study-payment" element={<Payment onPaymentSuccess={(examId, slug, courseId) => { if (courseId) navigate(`/study-lesson/${courseId}`); else if (examId && slug) navigate(`/exam-start/${slug}/${examId}`); }} onCancel={() => navigate(-1)} />} />
          <Route path="/certification-exams" element={<CertificationExams onExamSelect={(exam) => { setSelectedExam(exam); const slug = String(exam?.title || 'exam').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'); navigate(`/exam-detail/${slug}/${exam.id}`); }} />} />
          <Route path="/exam-detail/:slug/:examId" element={<ExamDetail onBackToList={() => navigate('/certification-exams')} onRegister={(examId, slug) => navigate(`/payment/${slug}/${examId}`)} onStartExam={(examId, slug) => navigate(`/exam-start/${slug}/${examId}`)} />} />
          <Route path="/exam-detail/:examId" element={<ExamDetail onBackToList={() => navigate('/certification-exams')} onRegister={(examId) => { const slug = 'exam'; navigate(`/payment/${slug}/${examId}`); }} onStartExam={(examId) => { const slug = 'exam'; navigate(`/exam-start/${slug}/${examId}`); }} />} />
          <Route path="/payment/:slug/:examId" element={<ProtectedRoute element={<Payment onPaymentSuccess={(examId, slug) => navigate(`/exam-start/${slug}/${examId}`)} onCancel={() => navigate(-1)} />} />} />
          <Route path="/exam-start/:slug/:examId" element={<ProtectedRoute element={<ExamStart onCancel={() => navigate(-1)} />} />} />
          <Route path="/exam-taking/:slug/:attemptId" element={<ProtectedRoute element={<div style={{ minHeight: '100vh', height: 'auto' }}><ExamTaking onSubmitExam={(result) => { 
            setExamResult(result); 
            const currentSlug = location.pathname.split('/')[2] || 'exam'; 
            const attemptId = result?.examAttemptId || location.pathname.split('/')[3] || '1';
            navigate(`/exam-result/${currentSlug}/${attemptId}`); 
          }} /></div>} />} />
          <Route path="/exam-result/:slug/:attemptId" element={<ProtectedRoute element={<ExamResult onBackToHome={() => navigate('/')} />} />} />
          <Route path="/exam-start" element={<ExamStart />} />
          <Route path="/chat" element={<ProtectedRoute element={<ChatPage />} />} />
          <Route path="/chat/support" element={<ProtectedRoute element={<ChatPage />} />} />
          <Route path="/chat/room/:roomId" element={<ProtectedRoute element={<ChatPage />} />} />
          <Route path="/chat/:targetUserId" element={<ProtectedRoute element={<ChatPage />} />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* History routes */}
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/payment-success" element={<PaymentSuccessCallback />} />
          <Route path="/purchased-exams" element={<PurchasedExams />} />
          <Route path="/enrolled-courses" element={<EnrolledCourses />} />
          <Route path="/exam-history" element={<ExamHistory />} />
          <Route path="/request-teacher-role" element={<ProtectedRoute element={<RequestTeacherRole />} />} />
          <Route path="/dev/payos-test/:examId" element={<ProtectedRoute element={<PayOSTest />} />} />
          <Route path="/403" element={<Forbidden />} />
          <Route
            path="/admin/chat"
            element={<ProtectedRoute allowedRoles={["admin"]} element={<AdminChat />} />}
          />
          <Route
            path="/admin/*"
            element={<ProtectedRoute allowedRoles={["admin"]} element={<ExternalRedirect to="admin" />} />}
          />
          <Route
            path="/teacher/*"
            element={<ProtectedRoute allowedRoles={["teacher"]} element={<ExternalRedirect to="teacher" />} />}
          />
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
