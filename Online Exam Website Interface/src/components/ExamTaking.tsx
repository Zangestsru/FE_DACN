import React, { useState, useEffect, useRef } from 'react';
import { IExam, IQuestion, IExamResult } from '@/types';
import { useExamContext } from '@/contexts';
import { useExamQuestions, useExamSubmit } from '@/hooks';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  type?: 'multiple-choice' | 'multiple-select';
  image?: string;
}

interface ExamTakingProps {
  exam: IExam | any;
  onSubmitExam: (result: any) => void;
}

export const ExamTaking: React.FC<ExamTakingProps> = ({ exam, onSubmitExam }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number | number[] }>({});
  const [timeRemaining, setTimeRemaining] = useState(exam?.duration === '60 phút' ? 3600 : exam?.duration === '90 phút' ? 5400 : 7200); // Convert to seconds
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [reportData, setReportData] = useState({
    description: '',
    attachments: null as FileList | null
  });
  
  const [isZoomed, setIsZoomed] = useState(false);

  // Fetch questions from service
  const { data: questionsData, loading: questionsLoading } = useExamQuestions(exam?.id);

  // Handle viewport changes for better iPad/tablet support
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isZoomedView = window.visualViewport.scale > 1;
        setIsZoomed(isZoomedView);
        document.body.classList.toggle('zoomed-view', isZoomedView);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Use questions from service or fallback to mock data
  const questions: Question[] = questionsData || Array.from({ length: exam?.questions || 10 }, (_, i) => ({
    id: i + 1,
    question: `Câu hỏi ${i + 1}: Đây là nội dung câu hỏi số ${i + 1} trong bài thi ${exam?.title}. Hãy chọn đáp án đúng nhất từ các phương án dưới đây?`,
    options: [
      `Đáp án A cho câu ${i + 1}`,
      `Đáp án B cho câu ${i + 1}`,
      `Đáp án C cho câu ${i + 1}`,
      `Đáp án D cho câu ${i + 1}`
    ],
    correctAnswer: Math.floor(Math.random() * 4),
    type: 'multiple-choice'
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Detect visual viewport changes (zoom / UI bars) and toggle class to avoid fixed nav blocking content
  useEffect(() => {
    const rootEl = document.querySelector('.exam-taking-root');
    if (!rootEl) return;

    const onViewportChange = () => {
      try {
        const vv = (window as any).visualViewport;
        let small = false;
        if (vv) {
          // If scale > 1 (zoom) or visual viewport height is much smaller than layout height
          small = (vv.scale && vv.scale > 1) || (vv.height && vv.height < 700);
        } else {
          // Fallback: if innerHeight is small (mobile UI) compared to outerHeight
          small = !!(window.innerHeight && window.innerHeight < 700);
        }

        if (small) rootEl.classList.add('vp-small'); else rootEl.classList.remove('vp-small');
      } catch (e) {
        // ignore
      }
    };

    // initial check
    onViewportChange();

    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', onViewportChange);
      (window as any).visualViewport.addEventListener('scroll', onViewportChange);
    } else {
      window.addEventListener('resize', onViewportChange);
    }

    return () => {
      if ((window as any).visualViewport) {
        (window as any).visualViewport.removeEventListener('resize', onViewportChange);
        (window as any).visualViewport.removeEventListener('scroll', onViewportChange);
      } else {
        window.removeEventListener('resize', onViewportChange);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData?.type === 'multiple-select') {
      // Handle multiple selection
      setAnswers(prev => {
        const currentAnswers = prev[currentQuestion] as number[] || [];
        const newAnswers = currentAnswers.includes(answerIndex)
          ? currentAnswers.filter(idx => idx !== answerIndex)
          : [...currentAnswers, answerIndex];
        
        return {
          ...prev,
          [currentQuestion]: newAnswers
        };
      });
    } else {
      // Handle single selection
      setAnswers(prev => ({
        ...prev,
        [currentQuestion]: answerIndex
      }));
    }
  };

  const handleQuestionNavigation = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const toggleQuestionFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const correctAnswers = questions.filter((q, index) => {
      const userAnswer = answers[index];
      const correctAnswer = q.correctAnswer;
      
      if (q.type === 'multiple-select') {
        // For multiple selection, check if arrays are equal
        if (!Array.isArray(userAnswer) || !Array.isArray(correctAnswer)) return false;
        return userAnswer.length === correctAnswer.length && 
               userAnswer.every(ans => correctAnswer.includes(ans));
      } else {
        // For single selection
        return userAnswer === correctAnswer;
      }
    }).length;
    
    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= exam.passingScore;

    const result = {
      score,
      correctAnswers,
      totalQuestions,
      passed,
      answers,
      timeSpent: (exam?.duration === '60 phút' ? 3600 : exam?.duration === '90 phút' ? 5400 : 7200) - timeRemaining
    };

    onSubmitExam(result);
  };

  const handleReport = () => {
    console.log('Report submitted:', reportData);
    setShowReportModal(false);
  };

  const getQuestionStatus = (index: number) => {
    const answer = answers[index];
    const hasAnswer = answer !== undefined && 
      (Array.isArray(answer) ? answer.length > 0 : true);
    
    if (hasAnswer) return 'answered';
    if (flaggedQuestions.has(index)) return 'flagged';
    return 'unanswered';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'success';
      case 'flagged': return 'danger';
      default: return 'outline-secondary';
    }
  };

  if (!exam) return null;

  return (
    <div className="exam-taking-container d-flex exam-taking-root" style={{ minHeight: '100vh', height: 'auto', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="exam-sidebar bg-light border-end exam-taking-sidebar" style={{ width: '300px', height: '100vh', position: 'fixed', top: 0, left: 0, overflow: 'auto', zIndex: 1000 }}>
        <div className="p-3 border-bottom">
          <h6 className="mb-0 text-center">THÔNG TIN BÀI THI</h6>
        </div>
        
        {/* Timer */}
        <div className="p-3 text-center border-bottom">
          <div className="h5 text-danger mb-0">{formatTime(timeRemaining)}</div>
          <small className="text-muted">Thời gian còn lại</small>
        </div>

        {/* Progress */}
        <div className="p-3 border-bottom">
          <div className="d-flex justify-content-between mb-2">
            <small>Tiến độ:</small>
            <small>{Object.keys(answers).length}/{questions.length}</small>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-3">
          <h6 className="mb-3">DANH SÁCH CÂU HỎI</h6>
          <div className="row g-2">
            {questions.map((_, index) => {
              const status = getQuestionStatus(index);
              return (
                <div key={index} className="col-3">
                  <button
                    className={`btn btn-sm w-100 btn-${getQuestionStatusColor(status)} ${
                      currentQuestion === index ? 'border-primary border-2' : ''
                    }`}
                    onClick={() => handleQuestionNavigation(index)}
                  >
                    {index + 1}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 border-top" style={{ position: 'sticky', bottom: 0, background: '#f8f9fa' }}>
          <div className="d-grid gap-2">
            <button 
              className="btn btn-danger"
              onClick={() => setShowReportModal(true)}
            >
              Báo cáo sự cố
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowSubmitConfirm(true)}
            >
              Nộp bài
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="exam-content flex-grow-1 d-flex flex-column exam-taking-content" style={{ minHeight: '100vh', height: 'auto', marginLeft: '300px' }}>
        <div className="p-4 border-bottom bg-white" style={{ position: 'relative', zIndex: 1 }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{exam.title}</h5>
            <div className="d-flex align-items-center gap-3">
              <span 
                className="badge" 
                style={{ 
                  backgroundColor: '#0073e6', 
                  color: 'white', 
                  fontSize: '20px', 
                  padding: '10px 16px',
                  fontWeight: '600'
                }}
              >
                Câu {currentQuestion + 1}/{questions.length}
              </span>
              <button
                className={`btn ${flaggedQuestions.has(currentQuestion) ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => toggleQuestionFlag(currentQuestion)}
                style={{
                  fontWeight: '500',
                  fontSize: '16px',
                  padding: '6px 12px'
                }}
              >
                Đánh dấu
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 p-4 bg-light overflow-auto exam-taking-main">
          {/* Question */}
          <div className="mb-4">
            <h3 className="mb-3" style={{ 
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Câu {currentQuestion + 1}: 
              {questions[currentQuestion]?.type === 'multiple-select' && (
                <span className="badge bg-info ms-2" style={{ fontSize: '12px' }}>
                  Chọn nhiều đáp án
                </span>
              )}
            </h3>
            <p className="mb-3" style={{ 
              fontSize: '18px',
              lineHeight: '1.6',
              fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              fontWeight: '400',
              color: '#34495e'
            }}>{questions[currentQuestion]?.question}</p>
            
            {/* Question Image */}
            {questions[currentQuestion]?.image && (
              <div className="mt-3 mb-4">
                <img 
                  src={questions[currentQuestion].image} 
                  alt="Question illustration"
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: '300px', maxWidth: '100%', height: 'auto' }}
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="mb-5">
            <div className="row g-3">
              {questions[currentQuestion]?.options.map((option, index) => {
                const currentQuestionData = questions[currentQuestion];
                const isMultipleSelect = currentQuestionData?.type === 'multiple-select';
                const isSelected = isMultipleSelect 
                  ? (answers[currentQuestion] as number[] || []).includes(index)
                  : answers[currentQuestion] === index;
                
                return (
                  <div key={index} className="col-12 col-lg-6">
                    <div 
                      className={`border rounded p-3 ${isSelected ? 'border-primary bg-light' : 'border'}`}
                      style={{ 
                        cursor: 'pointer',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'all 0.2s ease',
                        backgroundColor: isSelected ? '#e3f2fd' : 'white'
                      }}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="d-flex align-items-center w-100">
                        <input
                          className="form-check-input me-3"
                          type={isMultipleSelect ? "checkbox" : "radio"}
                          name={`question-${currentQuestion}`}
                          id={`option-${index}`}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(index)}
                        />
                        <label className="form-check-label w-100 m-0" htmlFor={`option-${index}`}>
                          <span className="fw-bold me-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="d-flex justify-content-between mt-4 pt-3 border-top">
            <button
              className="btn btn-outline-primary"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              style={{ 
                minWidth: '140px',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              ← Câu trước
            </button>
            <button
              className="btn btn-outline-primary"
              disabled={currentQuestion === questions.length - 1}
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              style={{ 
                minWidth: '140px',
                fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                fontWeight: '500',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              Câu tiếp → 
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">BÁO CÁO SỰ CỐ</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowReportModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Mô tả sự cố *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Vui lòng mô tả chi tiết sự cố bạn gặp phải..."
                    value={reportData.description}
                    onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Đính kèm ảnh/video (tùy chọn)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => setReportData({...reportData, attachments: e.target.files})}
                  />
                  <div className="form-text">Chỉ chấp nhận file ảnh (.jpg, .png) hoặc video (.mp4, .mov)</div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowReportModal(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleReport}
                >
                  Gửi báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              {/* Header */}
              <div className="text-white text-center py-4" style={{ backgroundColor: '#0073e6' }}>
                <div className="mb-2">
                  <i className="fas fa-clipboard-check" style={{ fontSize: '48px' }}></i>
                </div>
                <h4 className="fw-bold mb-0">XÁC NHẬN NỘP BÀI</h4>
                <p className="mb-0 opacity-90">Bạn có chắc chắn muốn nộp bài thi không?</p>
                <button 
                  type="button" 
                  className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                  onClick={() => setShowSubmitConfirm(false)}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-4" style={{ backgroundColor: '#ffffff' }}>
                {/* Statistics */}
                <div className="row g-3 mb-4">
                  <div className="col-4">
                    <div className="text-center p-4 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="fw-bold mb-2" style={{ fontSize: '32px', color: '#0073e6' }}>
                        {Object.keys(answers).length}
                      </div>
                      <div className="fw-medium" style={{ color: '#0073e6' }}>Đã trả lời</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-4 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="fw-bold mb-2" style={{ fontSize: '32px', color: '#0073e6' }}>
                        {flaggedQuestions.size}
                      </div>
                      <div className="fw-medium" style={{ color: '#0073e6' }}>Đánh dấu</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-4 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="fw-bold mb-2" style={{ fontSize: '32px', color: '#0073e6' }}>
                        {questions.length - Object.keys(answers).length}
                      </div>
                      <div className="fw-medium" style={{ color: '#0073e6' }}>Chưa trả lời</div>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="text-center p-3 rounded-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="fw-bold mb-2" style={{ color: '#0073e6' }}>Lưu ý quan trọng</div>
                  <div style={{ color: '#6c757d' }}>Sau khi nộp bài, bạn sẽ không thể thay đổi câu trả lời</div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 p-4 d-flex gap-3 justify-content-center" style={{ backgroundColor: '#ffffff' }}>
                <button 
                  type="button" 
                  className="btn px-4 py-3 fw-medium"
                  style={{ 
                    backgroundColor: '#f8f9fa', 
                    color: '#6c757d',
                    border: 'none',
                    borderRadius: '12px',
                    minWidth: '160px'
                  }}
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  Tiếp tục làm bài
                </button>
                <button 
                  type="button" 
                  className="btn text-white px-4 py-3 fw-bold"
                  style={{ 
                    backgroundColor: '#0073e6',
                    border: 'none',
                    borderRadius: '12px',
                    minWidth: '160px'
                  }}
                  onClick={handleSubmit}
                >
                  Nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};