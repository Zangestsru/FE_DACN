import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExamInfoForm } from '../components/ExamInfoForm';
import { useExamDetail, useStartExam } from '../hooks';
import { toast } from 'sonner';

interface ExamStartProps {
  onStartExam?: (attemptId: number) => void;
  onCancel?: () => void;
}

export const ExamStart: React.FC<ExamStartProps> = ({ onStartExam, onCancel }) => {
  const { examId } = useParams<{ examId: string }>();
  const [starting, setStarting] = useState(false);
  
  // Fetch exam details
  const { data: exam, loading: examLoading } = useExamDetail(examId as string);
  
  // Start exam mutation
  const { execute: startExam, loading: startLoading } = useStartExam();

  const handleStartExam = async () => {
    if (!examId || !onStartExam) return;
    
    setStarting(true);
    try {
      console.log('🚀 Starting exam:', examId);
      
      // Call API to start exam
      const result = await startExam(parseInt(examId));
      
      console.log('✅ Exam started:', result);
      
      if (result?.examAttemptId) {
        toast.success('Bắt đầu làm bài thành công!');
        onStartExam(result.examAttemptId);
      } else {
        throw new Error('Không nhận được exam attempt ID');
      }
    } catch (error: any) {
      console.error('❌ Error starting exam:', error);
      toast.error(error.message || 'Không thể bắt đầu bài thi');
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

  return (
    <ExamInfoForm 
      exam={exam}
      onStartExam={handleStartExam}
      onCancel={handleCancel}
      mode="examstart"
      showBackButton={true}
      disabled={starting || startLoading}
    />
  );
};