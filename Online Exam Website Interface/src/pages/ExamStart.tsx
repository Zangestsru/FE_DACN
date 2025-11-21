import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamInfoForm } from '../components/ExamInfoForm';
import { useExamDetail, useExamQuestions, useStartExam, useAuth } from '../hooks';
import { toast } from 'sonner';

interface ExamStartProps {
  onStartExam?: (attemptId: number) => void;
  onCancel?: () => void;
}

export const ExamStart: React.FC<ExamStartProps> = ({ onStartExam, onCancel }) => {
  const { slug, examId } = useParams<{ slug: string; examId: string }>();
  const [starting, setStarting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch exam details
  const { data: exam, loading: examLoading } = useExamDetail(examId as string);
  // Fetch questions to ensure count reflects actual items
  const { data: questionsData } = useExamQuestions(examId as string);
  
  // Start exam mutation
  const { mutate: startExam, loading: startLoading } = useStartExam();

  const handleStartExam = async () => {
    if (!examId) return;
    
    // Check if user is authenticated
    if (!user) {
      toast.error('Vui lòng đăng nhập trước khi làm bài thi.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    setStarting(true);
    try {
      console.log('🚀 Starting exam:', examId);
      
      const result = await startExam(parseInt(examId));
      
      console.log('✅ Exam started:', result);
      
      if (result && result.examAttemptId) {
        toast.success('Bắt đầu làm bài thành công!');
        const title = exam?.title || 'exam';
        const finalSlug = slug || String(title)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        navigate(`/exam-taking/${finalSlug}/${result.examAttemptId}`);
      } else {
        // If API fails or returns null, create mock attempt for demo
        console.warn('⚠️ API failed or returned null, creating mock attempt for demo');
        const mockAttemptId = Date.now(); // Use timestamp as mock attempt ID
        const title = exam?.title || 'exam';
        const finalSlug = slug || String(title)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        
        // Store current exam ID and mock attempt data in sessionStorage for the exam-taking page
        sessionStorage.setItem('current_exam_id', examId);
        sessionStorage.setItem(`mock_attempt_${examId}`, JSON.stringify({
          examAttemptId: mockAttemptId,
          examId: parseInt(examId),
          startTime: new Date().toISOString(),
          questions: questionsData || [],
          title: title
        }));
        
        toast.success('Bắt đầu làm bài');
        navigate(`/exam-taking/${finalSlug}/${mockAttemptId}`);
      }
    } catch (error: any) {
      console.error('❌ Error starting exam:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // API errors are now handled in the main try block, so we don't need duplicate fallback here
      
      // Xử lý lỗi 403 cụ thể
      if (error.response?.status === 403 || error.status === 403) {
        const errorMessage = error.response?.data?.message || error.message || '';
        
        if (errorMessage.includes('thanh toán') || errorMessage.includes('enrollment')) {
          toast.error('Bạn chưa thanh toán để làm bài thi này. Vui lòng quay lại trang thanh toán.');
          setTimeout(() => {
            const currentSlug = slug || 'exam';
            window.location.href = `/payment/${currentSlug}/${examId}`;
          }, 2000);
        } else {
          toast.error(errorMessage || 'Bạn không có quyền truy cập bài thi này.');
          // Redirect về trang chủ hoặc trang 403
          setTimeout(() => {
            window.location.href = '/403';
          }, 2000);
        }
      } else if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập trước khi làm bài thi.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const msg: string = error.response?.data?.message || error.message || '';
        const lowerMsg = msg.toLowerCase();
        const isOngoing = lowerMsg.includes('đang diễn ra') || lowerMsg.includes('in progress') || lowerMsg.includes('ongoing');
        if (isOngoing && examId) {
          toast.error('Bạn đang có một phiên thi đang diễn ra. Vui lòng hoàn thành hoặc hủy phiên thi hiện tại.');
          return;
        }
        toast.error(msg || 'Không thể bắt đầu bài thi');
      }
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (examLoading || !exam) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải thông tin bài thi...</p>
        </div>
      </div>
    );
  }

  const finalExam = exam ? { ...exam, questions: (Array.isArray(questionsData) ? questionsData.length : exam.questions) } : exam;
  const isSpecial = examId === '1';

  return (
    <ExamInfoForm 
      exam={finalExam}
      onStartExam={handleStartExam}
      onCancel={handleCancel}
      mode="examstart"
      showBackButton={true}
      disabled={starting || startLoading}
    />
  );
};