import React from 'react';
import { ExamInfoForm } from '../components/ExamInfoForm';

interface ExamStartProps {
  onStartExam?: () => void;
  onCancel?: () => void;
}

export const ExamStart: React.FC<ExamStartProps> = ({ onStartExam, onCancel }) => {
  const handleStartExam = () => {
    if (onStartExam) {
      onStartExam();
    } else {
      // Logic để bắt đầu thi - có thể chuyển đến trang làm bài
      // TODO: Implement default start exam logic
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Logic mặc định khi không có onCancel
      // TODO: Implement default cancel logic
    }
  };

  return (
    <ExamInfoForm 
      onStartExam={handleStartExam}
      onCancel={handleCancel}
      mode="examstart"
    />
  );
};