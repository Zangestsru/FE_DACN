import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatSecondsToHumanReadable } from '../utils/time';
import { useExamResult, useExamDetail } from '../hooks';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { examService } from '@/services/exam.service';
import { toast } from 'sonner';

interface ExamResultProps {
  onBackToHome: () => void;
}

const ExamResult: React.FC<ExamResultProps> = ({ onBackToHome }) => {
  const { slug, attemptId } = useParams<{ slug: string; attemptId: string }>();
  
  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  
  // Fetch exam result from backend
  const { data: resultData, loading, error } = useExamResult(attemptId as string);
  
  // ✅ Fetch full exam details using examId from result
  const examId = resultData?.examId;
  const { data: examDetail, loading: examDetailLoading } = useExamDetail(examId?.toString() || '', !!examId);
  
  // Debug: log the actual data received
  console.log('📊 ExamResult received data:', resultData);
  console.log('📊 Exam detail data:', examDetail);
  console.log('📊 URL params - slug:', slug, 'attemptId:', attemptId);
  
  // Loading state
  if (loading || !resultData || examDetailLoading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Lỗi!</h4>
          <p>{error.message}</p>
          <button className="btn btn-primary" onClick={onBackToHome}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // ✅ Use examDetail if available, otherwise fallback to resultData
  const exam = examDetail || {
    title: resultData?.examTitle || resultData?.title || 'Không xác định',
    id: resultData?.examId || 0,
    image: resultData?.examImage || resultData?.image || '',
    category: resultData?.examCategory || resultData?.category || 'Khác',
    difficulty: resultData?.examDifficulty || resultData?.difficulty || 'Chưa xác định',
    duration: resultData?.examDuration || resultData?.duration || 'N/A',
    passingScore: resultData?.examPassingScore || resultData?.passingScore || 0,
    price: 0,
    originalPrice: undefined,
    level: undefined,
    provider: undefined,
    validPeriod: undefined,
    features: undefined,
  };

  // ✅ Calculate time spent accurately - Priority: Use TimeSpentSeconds from backend (MOST ACCURATE)
  let actualTimeSpent = 0;
  
  // Priority 1: Use TimeSpentSeconds from backend (exact seconds, most accurate)
  const timeSpentSeconds = resultData?.timeSpentSeconds || resultData?.TimeSpentSeconds;
  if (timeSpentSeconds !== undefined && timeSpentSeconds !== null && timeSpentSeconds >= 0) {
    actualTimeSpent = timeSpentSeconds;
    console.log('✅ Using TimeSpentSeconds from backend (exact seconds):', {
      seconds: actualTimeSpent,
      formatted: formatSecondsToHumanReadable(actualTimeSpent)
    });
  }
  // Priority 2: Use TimeSpentMinutes from backend (convert to seconds)
  else {
    const timeSpentMinutes = resultData?.timeSpentMinutes || resultData?.TimeSpentMinutes;
    if (timeSpentMinutes !== undefined && timeSpentMinutes !== null && timeSpentMinutes >= 0) {
      actualTimeSpent = timeSpentMinutes * 60; // Convert minutes to seconds
      console.log('✅ Using TimeSpentMinutes from backend (converted to seconds):', {
        minutes: timeSpentMinutes,
        seconds: actualTimeSpent,
        formatted: formatSecondsToHumanReadable(actualTimeSpent)
      });
    }
  }
  
  // Priority 3: Use timeSpent (already in seconds) - fallback
  if (actualTimeSpent === 0) {
    const timeSpent = resultData?.timeSpent || resultData?.TimeSpent;
    if (timeSpent !== undefined && timeSpent !== null && timeSpent > 0) {
      actualTimeSpent = timeSpent;
      console.log('✅ Using timeSpent (seconds):', {
        seconds: actualTimeSpent,
        formatted: formatSecondsToHumanReadable(actualTimeSpent)
      });
    }
  }
  
  // Priority 4: Calculate from StartTime and SubmittedAt (LAST RESORT - may be inaccurate if user left exam open)
  if (actualTimeSpent === 0) {
    const startTimeValue = resultData?.startTime || resultData?.StartTime;
    const submittedAtValue = resultData?.submittedAt || resultData?.SubmittedAt;
    
    if (startTimeValue && submittedAtValue) {
      try {
        const startTime = new Date(startTimeValue);
        const submittedAt = new Date(submittedAtValue);
        const diffSeconds = Math.floor((submittedAt.getTime() - startTime.getTime()) / 1000);
        if (diffSeconds > 0) {
          actualTimeSpent = diffSeconds;
          console.warn('⚠️ Using StartTime-SubmittedAt calculation (may be inaccurate if exam was left open):', {
            startTime: startTime.toISOString(),
            submittedAt: submittedAt.toISOString(),
            diffSeconds,
            formatted: formatSecondsToHumanReadable(diffSeconds)
          });
        }
      } catch (e) {
        console.warn('❌ Failed to calculate time from StartTime/SubmittedAt:', e);
      }
    }
  }
  
  // Debug log if still 0
  if (actualTimeSpent === 0) {
    console.warn('⚠️ Could not determine time spent, using 0. Data:', {
      timeSpentSeconds: resultData?.timeSpentSeconds || resultData?.TimeSpentSeconds,
      timeSpentMinutes: resultData?.timeSpentMinutes || resultData?.TimeSpentMinutes,
      timeSpent: resultData?.timeSpent || resultData?.TimeSpent,
      startTime: resultData?.startTime || resultData?.StartTime,
      submittedAt: resultData?.submittedAt || resultData?.SubmittedAt,
      resultDataKeys: Object.keys(resultData || {})
    });
  }

  // ✅ Calculate correct/incorrect answers from QuestionResults if available
  // Otherwise, use exam.questions as total and estimate from score
  const questionResults = resultData?.questionResults || resultData?.QuestionResults || resultData?.answers || [];
  const totalQuestions = exam?.questions || 
                        (Array.isArray(questionResults) ? questionResults.length : 0) ||
                        resultData?.totalQuestions || 
                        resultData?.TotalQuestions || 0;
  
  // Count correct answers from QuestionResults
  let correctAnswers = 0;
  if (Array.isArray(questionResults) && questionResults.length > 0) {
    correctAnswers = questionResults.filter((q: any) => 
      q.isCorrect || q.IsCorrect === true
    ).length;
  } else {
    // Fallback: if no QuestionResults, we can't accurately count
    // Use exam.questions and percentage to estimate (not ideal but better than using score)
    const percentage = resultData?.percentage || 0;
    if (totalQuestions > 0 && percentage > 0) {
      correctAnswers = Math.round((percentage / 100) * totalQuestions);
    } else {
      // Last resort: assume score = correct answers (only if score <= totalQuestions)
      const score = resultData?.score || resultData?.Score || 0;
      correctAnswers = score <= totalQuestions ? Math.round(score) : 0;
    }
  }
  
  const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers);

  const result = {
    score: resultData?.percentage || 0,
    passed: resultData?.isPassed || (resultData?.percentage >= (exam.passingScore || 0)) || false,
    correctAnswers: correctAnswers,
    incorrectAnswers: incorrectAnswers,
    totalQuestions: totalQuestions,
    timeSpent: actualTimeSpent, // ✅ Use actual time spent by student
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'cơ bản': return 'success';
      case 'intermediate':
      case 'trung bình': return 'warning';
      case 'advanced':
      case 'nâng cao': return 'info';
      case 'expert': return 'danger';
      default: return 'secondary';
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleShareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Kết quả bài thi',
        text: `Tôi vừa hoàn thành bài thi ${exam.title} với điểm số ${result.score}%`,
        url: window.location.href,
      });
    }
  };

  const handleDownloadCertificate = async () => {
    if (!resultData?.examId && !exam?.id) {
      toast.error('Không tìm thấy thông tin bài thi');
      return;
    }

    // Get userId from localStorage
    const userStr = localStorage.getItem('user_info');
    let userId: number | null = null;

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user.userId || user.UserId || user.id;
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }

    if (!userId) {
      toast.error('Vui lòng đăng nhập để tải chứng chỉ');
      return;
    }

    const examId = resultData?.examId || exam?.id;
    if (!examId) {
      toast.error('Không tìm thấy ID bài thi');
      return;
    }

    setDownloadingCertificate(true);
    try {
      console.log('📜 Downloading certificate for:', { userId, examId });
      // Pass exam result data so PDF can be generated even if API fails
      await examService.downloadExamCertificate(userId, Number(examId), resultData);
      toast.success('Đã tải chứng chỉ thành công!');
    } catch (error: any) {
      console.error('❌ Error downloading certificate:', error);
      toast.error(error.message || 'Không thể tải chứng chỉ');
    } finally {
      setDownloadingCertificate(false);
    }
  };

  const mainColor = '#0073e6';
  const failColor = '#dc3545';
  const passColor = '#28a745';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px 0' }}>
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-11 col-xl-10">

            {/* Header */}
            <div
              className="text-center rounded-4 py-4 mb-4"
              style={{
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              }}
            >
              <h2
                className="fw-bold mb-2"
                style={{ color: result.passed ? passColor : failColor }}
              >
                {result.passed ? 'BẠN ĐÃ ĐẠT' : 'BẠN CHƯA ĐẠT'}
              </h2>
              <p className="mb-0 text-muted">
                Bài thi: {resultData?.examTitle || resultData?.title || 
                         (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : exam.title)}
              </p>
            </div>

            <div className="row g-4 align-items-stretch">
              {/* KẾT QUẢ BÀI THI */}
              <div className="col-12 col-lg-8 d-flex">
                <div
                  className="rounded-4 border-0 flex-fill d-flex flex-column"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0,115,230,0.1)',
                  }}
                >
                  <div
                    className="text-white text-center py-3 rounded-top-4"
                    style={{ backgroundColor: mainColor }}
                  >
                    <h3 className="fw-bold mb-0">KẾT QUẢ BÀI THI</h3>
                  </div>

                  <div className="p-4 d-flex flex-column flex-grow-1">
                    <div className="text-center mb-4">
                      <div
                        className="fw-bold mb-2"
                        style={{
                          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                          color: result.passed ? passColor : failColor,
                        }}
                      >
                        {result.score}%
                      </div>
                      <p className="text-muted mb-0">
                        Điểm tối thiểu để đạt:{' '}
                        <strong>
                          {(() => {
                            // Calculate passingMark from passingScore percentage
                            const passingMark = (exam as any).passingMark || 
                              (exam.passingScore && result.totalQuestions 
                                ? Math.ceil((exam.passingScore / 100) * result.totalQuestions) 
                                : exam.passingScore || 0);
                            return `${passingMark} điểm`;
                          })()}
                        </strong>
                      </p>
                      {result.correctAnswers < (() => {
                        const passingMark = (exam as any).passingMark || 
                          (exam.passingScore && result.totalQuestions 
                            ? Math.ceil((exam.passingScore / 100) * result.totalQuestions) 
                            : exam.passingScore || 0);
                        return passingMark;
                      })() && (
                        <p className="text-danger mb-0 mt-2">
                          <small>
                            Bạn cần đạt ít nhất {(() => {
                              const passingMark = (exam as any).passingMark || 
                                (exam.passingScore && result.totalQuestions 
                                  ? Math.ceil((exam.passingScore / 100) * result.totalQuestions) 
                                  : exam.passingScore || 0);
                              return `${passingMark} điểm`;
                            })()} để qua bài thi
                          </small>
                        </p>
                      )}
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-12 col-sm-6 col-md-3">
                        <div
                          className="text-center p-3 rounded-3"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="h4 fw-bold mb-1" style={{ color: passColor }}>
                            {result.correctAnswers}
                          </div>
                          <small className="text-muted">Số câu đúng</small>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-md-3">
                        <div
                          className="text-center p-3 rounded-3"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="h4 fw-bold mb-1" style={{ color: failColor }}>
                            {result.incorrectAnswers}
                          </div>
                          <small className="text-muted">Số câu sai</small>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-md-3">
                        <div
                          className="text-center p-3 rounded-3"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="h4 fw-bold mb-1" style={{ color: '#6c757d' }}>
                            {result.totalQuestions}
                          </div>
                          <small className="text-muted">Tổng câu</small>
                        </div>
                      </div>
                      <div className="col-12 col-sm-6 col-md-3">
                        <div
                          className="text-center p-3 rounded-3"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="h4 fw-bold mb-1" style={{ color: mainColor }}>
                            {formatSecondsToHumanReadable(result.timeSpent)}
                          </div>
                          <small className="text-muted">Thời gian làm bài</small>
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="mt-auto">
                      <div 
                        className={`row g-2 ${!result.passed ? 'justify-content-center' : ''}`}
                      >
                        {/* ✅ Tải chứng chỉ - chỉ hiển thị khi đã đạt - vị trí đầu tiên */}
                        {result.passed && (
                          <div className="col-12 col-sm-6 col-md-4">
                            <button
                              className="btn w-100 fw-bold py-3"
                              style={{
                                backgroundColor: '#ffc107',
                                color: '#000',
                                border: 'none',
                                borderRadius: '12px',
                              }}
                              onClick={handleDownloadCertificate}
                              disabled={downloadingCertificate}
                            >
                              {downloadingCertificate ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Đang tải...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-download me-2"></i>
                                  Tải chứng chỉ
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        <div className={`col-12 col-sm-6 ${result.passed ? 'col-md-4' : 'col-md-5'}`}>
                          <button
                            className="btn w-100 fw-bold py-3"
                            style={{
                              backgroundColor: '#f8f9fa',
                              color: mainColor,
                              border: `2px solid ${mainColor}`,
                              borderRadius: '12px',
                            }}
                            onClick={handlePrintCertificate}
                          >
                            In kết quả
                          </button>
                        </div>
                        <div className={`col-12 col-sm-6 ${result.passed ? 'col-md-4' : 'col-md-5'}`}>
                          <button
                            className="btn w-100 fw-bold py-3"
                            style={{
                              backgroundColor: passColor,
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                            }}
                            onClick={handleShareResult}
                          >
                            Chia sẻ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* THÔNG TIN BÀI THI - ✅ Updated to match ExamDetail */}
              <div className="col-12 col-lg-4 d-flex">
                <div
                  className="rounded-4 border-0 flex-fill d-flex flex-column"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0,115,230,0.1)',
                  }}
                >
                  <div
                    className="text-white text-center py-3 rounded-top-4"
                    style={{ backgroundColor: mainColor }}
                  >
                    <h5 className="fw-bold mb-0">THÔNG TIN BÀI THI</h5>
                  </div>

                  <div className="p-4 d-flex flex-column flex-grow-1">
                    {/* ✅ Cover Image */}
                    <div className="mb-3">
                      <ImageWithFallback
                        src={exam.image || exam.imageUrl || '/images/background.png'}
                        alt={exam.title}
                        className="img-fluid rounded-3"
                        style={{
                          height: '200px',
                          width: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    {/* ✅ Title with badges */}
                    <div className="mb-3">
                      <h6
                        className="fw-bold mb-2"
                        style={{ color: mainColor }}
                      >
                        {exam.title}
                      </h6>
                      <div className="d-flex gap-2 flex-wrap">
                        {exam.provider && (
                          <span className="badge bg-info">{exam.provider}</span>
                        )}
                        {exam.level && (
                          <span className="badge bg-secondary">{exam.level}</span>
                        )}
                        {exam.validPeriod && (
                          <span className="badge bg-success">Hiệu lực: {exam.validPeriod}</span>
                        )}
                      </div>
                    </div>

                    {/* ✅ Exam Details */}
                    <div className="d-flex flex-column gap-2 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Danh mục:</span>
                        <span className="badge bg-primary">{exam.category}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Độ khó:</span>
                        <span className={`badge bg-${getDifficultyColor(exam.difficulty || '')}`}>
                          {exam.difficulty || 'Chưa xác định'}
                        </span>
                      </div>
                      {exam.level && (
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="fw-medium text-muted">Level:</span>
                          <span className="badge bg-secondary">{exam.level}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Thời gian:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {exam.duration || 'N/A'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Câu hỏi:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {exam.questions || 0} câu
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Điểm đạt:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {(() => {
                            // Calculate passingMark from passingScore percentage
                            const passingMark = (exam as any).passingMark || 
                              (exam.passingScore && result.totalQuestions 
                                ? Math.ceil((exam.passingScore / 100) * result.totalQuestions) 
                                : exam.passingScore || 0);
                            return `${passingMark} điểm`;
                          })()}
                        </span>
                      </div>
                      {exam.validPeriod && (
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="fw-medium text-muted">Thời hạn:</span>
                          <span className="fw-bold" style={{ color: mainColor }}>
                            {exam.validPeriod}
                          </span>
                        </div>
                      )}
                      {(exam.price || 0) > 0 && (
                        <div className="d-flex justify-content-between align-items-center py-2">
                          <span className="fw-medium text-muted">Phí thi:</span>
                          <div className="text-end">
                            {exam.originalPrice && exam.originalPrice > (exam.price || 0) ? (
                              <>
                                <div className="fw-bold" style={{ color: mainColor }}>
                                  {(exam.price || 0).toLocaleString('vi-VN')}đ
                                </div>
                                <div className="text-decoration-line-through text-muted small">
                                  {exam.originalPrice.toLocaleString('vi-VN')}đ
                                </div>
                              </>
                            ) : (
                              <span className="fw-bold" style={{ color: mainColor }}>
                                {(exam.price || 0).toLocaleString('vi-VN')}đ
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ✅ Features List */}
                    {exam.features && exam.features.length > 0 && (
                      <div className="mt-3 pt-3 border-top">
                        <h6 className="fw-bold mb-2" style={{ fontSize: '14px' }}>Tính năng:</h6>
                        <ul className="list-unstyled mb-0">
                          {exam.features.slice(0, 3).map((feature: string, index: number) => (
                            <li key={index} className="mb-2 d-flex align-items-start">
                              <span className="text-success me-2">✓</span>
                              <small>{feature}</small>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
