import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatSecondsToHumanReadable } from '../utils/time';
import { useExamResult, useExamDetail, useExamQuestions } from '../hooks';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { examService } from '@/services/exam.service';
import { toast } from 'sonner';
import { IExam } from '@/types';

interface ExamResultProps {
  onBackToHome: () => void;
}

const ExamResult: React.FC<ExamResultProps> = ({ onBackToHome }) => {
  const { slug, attemptId } = useParams<{ slug: string; attemptId: string }>();

  const [downloadingCertificate, setDownloadingCertificate] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch exam result from backend
  const { data: resultData, loading, error } = useExamResult(attemptId as string);

  // Fetch full exam details using examId from result
  const examId = resultData?.examId;
  const { data: examDetail, loading: examDetailLoading } = useExamDetail(examId?.toString() || '', !!examId);
  const { data: examQuestions } = useExamQuestions(examId?.toString() || '', !!examId);

  // Loading state - only wait for resultData, handle examDetail silently
  if (loading || !resultData) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3 text-muted fw-medium">Đang tổng hợp kết quả...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm border-0 rounded-3">
          <h4 className="fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Lỗi!</h4>
          <p>{error.message}</p>
          <button className="btn btn-primary rounded-pill px-4" onClick={onBackToHome}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const exam = (examDetail || {
    title: resultData?.examTitle || resultData?.title || 'Không xác định',
    id: resultData?.examId || 0,
    image: resultData?.examImage || resultData?.image || '',
    category: resultData?.examCategory || resultData?.category || 'Khác',
    difficulty: resultData?.examDifficulty || resultData?.difficulty || 'Chưa xác định',
    duration: resultData?.examDuration || resultData?.duration || 'N/A',
    passingScore: resultData?.examPassingScore || resultData?.passingScore || 0,
    questions: resultData?.totalQuestions || resultData?.TotalQuestions || 0,
    price: 0,
  }) as IExam;

  // Calculate time spent
  let actualTimeSpent = 0;
  const timeSpentSeconds = resultData?.timeSpentSeconds || resultData?.TimeSpentSeconds;
  const timeSpentMinutes = resultData?.timeSpentMinutes || resultData?.TimeSpentMinutes;
  const startTimeValue = resultData?.startTime || resultData?.StartTime;
  const submittedAtValue = resultData?.submittedAt || resultData?.SubmittedAt;

  if (startTimeValue && submittedAtValue) {
    try {
      const startTime = new Date(startTimeValue);
      const submittedAt = new Date(submittedAtValue);
      const diffSeconds = Math.floor((submittedAt.getTime() - startTime.getTime()) / 1000);
      if (diffSeconds > 0 && diffSeconds < 86400) actualTimeSpent = diffSeconds;
    } catch (e) { }
  }

  if (actualTimeSpent === 0 || actualTimeSpent > 3600) {
    if (timeSpentSeconds !== undefined && timeSpentSeconds !== null && timeSpentSeconds >= 0 && timeSpentSeconds < 86400) {
      actualTimeSpent = timeSpentSeconds;
    } else if (timeSpentMinutes !== undefined && timeSpentMinutes !== null && timeSpentMinutes >= 0 && timeSpentMinutes < 1440) {
      actualTimeSpent = timeSpentMinutes * 60;
    }
  }

  const score = Number(resultData?.score || 0);
  const correctAnswers = Number(resultData?.correctAnswers || score || 0);

  const totalQuestionsFromExam = exam?.questions || (examQuestions?.length || 0);
  const totalQuestionsFromBackend = Number(resultData?.totalQuestions || resultData?.maxScore || 0);
  const totalQuestions = totalQuestionsFromExam > 0 ? totalQuestionsFromExam : totalQuestionsFromBackend;

  const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers);
  const displayScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10 : 0;

  const result = {
    score: displayScore,
    passed: resultData?.isPassed || (displayScore >= (exam.passingScore || 0)) || false,
    correctAnswers: correctAnswers,
    incorrectAnswers: incorrectAnswers,
    totalQuestions: totalQuestions,
    timeSpent: actualTimeSpent,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': case 'cơ bản': return 'success';
      case 'intermediate': case 'trung bình': return 'warning';
      case 'advanced': case 'nâng cao': return 'info';
      case 'expert': return 'danger';
      default: return 'secondary';
    }
  };

  const handleDownloadCertificate = async () => {
    if (!result.passed) return;
    setDownloadingCertificate(true);
    try {
      // Get userId from localStorage
      const userStr = localStorage.getItem('user_info');
      let userId: number | null = null;
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.userId || user.UserId || user.id;
      }

      if (!userId) {
        toast.error('Vui lòng đăng nhập để tải chứng chỉ');
        return;
      }

      const examId = resultData?.examId || exam?.id;
      await examService.downloadExamCertificate(userId, Number(examId), resultData);
      toast.success('Đã tải chứng chỉ thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải chứng chỉ');
    } finally {
      setDownloadingCertificate(false);
    }
  };

  const passColor = '#10b981'; // Emerald 500
  const failColor = '#ef4444'; // Red 500
  const statusColor = result.passed ? passColor : failColor;

  // Circular Progress Component
  const CircularProgress = ({ value, color }: { value: number, color: string }) => {
    const safeValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (safeValue / 100) * circumference;

    return (
      <div className="position-relative d-inline-flex align-items-center justify-content-center">
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="position-absolute text-center">
          <span className="h2 fw-bold mb-0 d-block" style={{ color: color }}>{Math.round(safeValue)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="container">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold text-dark mb-1">Kết Quả Bài Thi</h4>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><a href="/" className="text-decoration-none text-muted">Trang chủ</a></li>
                <li className="breadcrumb-item active" aria-current="page">Kết quả</li>
              </ol>
            </nav>
          </div>
          <button
            className="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-2"
            onClick={onBackToHome}
          >
            <i className="bi bi-house-door"></i> Về trang chủ
          </button>
        </div>

        <div className="row g-4">
          {/* Left Column: Result Summary */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
              <div className="card-body p-0">
                <div className="row g-0">
                  {/* Status & Score */}
                  <div className="col-md-5 bg-white p-4 d-flex flex-column align-items-center justify-content-center border-end-md">
                    <CircularProgress value={result.score} color={statusColor} />
                    <h3 className="fw-bold mt-4 mb-1" style={{ color: statusColor }}>
                      {result.passed ? 'BẠN ĐÃ ĐẠT!' : 'RẤT TIẾC!'}
                    </h3>
                    <p className="text-muted text-center mb-0 px-3">
                      {result.passed
                        ? 'Chúc mừng bạn đã hoàn thành xuất sắc bài thi này.'
                        : `Bạn cần đạt ${Math.ceil((totalQuestions * (exam.passingScore || 0)) / 100)} điểm để vượt qua bài thi này.`}
                    </p>
                  </div>

                  {/* Detailed Stats */}
                  <div className="col-md-7 p-4 bg-light">
                    <h5 className="fw-bold mb-4">Chi tiết kết quả</h5>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="p-3 bg-white rounded-3 h-100 border border-light shadow-sm">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-check-circle-fill text-success fs-5"></i>
                            <span className="text-muted small fw-bold text-uppercase">Số câu đúng</span>
                          </div>
                          <h4 className="fw-bold mb-0 text-dark">{result.correctAnswers}</h4>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white rounded-3 h-100 border border-light shadow-sm">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                            <span className="text-muted small fw-bold text-uppercase">Số câu sai</span>
                          </div>
                          <h4 className="fw-bold mb-0 text-dark">{result.incorrectAnswers}</h4>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white rounded-3 h-100 border border-light shadow-sm">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-stopwatch-fill text-primary fs-5"></i>
                            <span className="text-muted small fw-bold text-uppercase">Thời gian</span>
                          </div>
                          <h4 className="fw-bold mb-0 text-dark">{formatSecondsToHumanReadable(result.timeSpent)}</h4>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white rounded-3 h-100 border border-light shadow-sm">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-trophy-fill text-warning fs-5"></i>
                            <span className="text-muted small fw-bold text-uppercase">Điểm đạt</span>
                          </div>
                          <h4 className="fw-bold mb-0 text-dark">{result.correctAnswers}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 d-flex gap-2">
                      {result.passed && (
                        <button
                          className="btn btn-warning text-dark fw-bold flex-grow-1 rounded-3 py-2"
                          onClick={handleDownloadCertificate}
                          disabled={downloadingCertificate}
                        >
                          {downloadingCertificate ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Đang tải...</>
                          ) : (
                            <><i className="bi bi-award me-2"></i>Tải chứng chỉ</>
                          )}
                        </button>
                      )}
                      <button
                        className={`btn ${result.passed ? 'btn-outline-primary' : 'btn-primary'} fw-bold flex-grow-1 rounded-3 py-2`}
                        onClick={() => setShowDetails(!showDetails)}
                      >
                        {showDetails ? 'Ẩn chi tiết' : 'Xem lại bài thi'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions Review Section */}
            {showDetails && (
              <div className="animate-fade-in">
                <h5 className="fw-bold mb-3">Chi tiết câu trả lời</h5>
                {(() => {
                  // Logic to render questions (reused from previous implementation but cleaned up)
                  const questionResults = resultData?.questionResults || resultData?.QuestionResults || [];
                  const answers = resultData?.answers || resultData?.Answers || [];

                  // Build map
                  const examQuestionsMap = new Map();
                  if (examQuestions && examQuestions.length > 0) {
                    examQuestions.forEach((q: any) => {
                      const qId = q.questionId || q.QuestionId;
                      if (qId) examQuestionsMap.set(qId, q);
                    });
                  }

                  let questionsToDisplay: any[] = [];
                  if (questionResults && questionResults.length > 0) {
                    questionsToDisplay = questionResults.map((qr: any, index: number) => {
                      const qId = qr.questionId || qr.QuestionId;
                      const examQuestion = examQuestionsMap.get(qId);
                      let options = qr.options || qr.Options || [];
                      if (options.length === 0 && examQuestion) options = examQuestion.answerOptions || examQuestion.AnswerOptions || [];

                      let content = qr.content || qr.Content || (examQuestion?.content || examQuestion?.Content || `Câu hỏi ${index + 1}`);

                      return {
                        questionId: qId,
                        content,
                        isCorrect: qr.isCorrect || qr.IsCorrect,
                        selectedOptionIds: qr.selectedOptionIds || qr.SelectedOptionIds || [],
                        correctOptionIds: qr.correctOptionIds || qr.CorrectOptionIds || [],
                        options,
                        textAnswer: qr.textAnswer || qr.TextAnswer,
                        correctTextAnswer: qr.correctTextAnswer || qr.CorrectTextAnswer,
                        index
                      };
                    });
                  } else if (examQuestions && examQuestions.length > 0) {
                    questionsToDisplay = examQuestions.map((q: any, index: number) => {
                      const qId = q.questionId || q.QuestionId;
                      const answer = answers.find((a: any) => (Number(a.questionId) === Number(qId)) || (Number(a.QuestionId) === Number(qId)));

                      const selectedOptionIds = (answer?.selectedOptionIds || answer?.SelectedOptionIds || []).map((id: any) => Number(id));
                      const correctOptionIds = (q.answerOptions || q.AnswerOptions || []).filter((opt: any) => opt.isCorrect || opt.IsCorrect).map((opt: any) => Number(opt.optionId || opt.OptionId));

                      const selectedSet = new Set(selectedOptionIds);
                      const correctSet = new Set(correctOptionIds);
                      const isCorrect = correctSet.size > 0 && selectedSet.size === correctSet.size &&
                        [...correctSet].every(id => selectedSet.has(id));

                      return {
                        questionId: qId,
                        content: q.content || q.Content || '',
                        isCorrect,
                        selectedOptionIds,
                        correctOptionIds,
                        options: q.answerOptions || q.AnswerOptions || [],
                        textAnswer: answer?.textAnswer || answer?.TextAnswer,
                        index
                      };
                    });
                  }

                  return questionsToDisplay.map((q: any, idx: number) => (
                    <div key={idx} className="card border-0 shadow-sm rounded-4 mb-3">
                      <div className={`card-body p-4 border-start border-5 ${q.isCorrect ? 'border-success' : 'border-danger'}`}>
                        <div className="d-flex gap-3">
                          <span className={`badge rounded-pill align-self-start ${q.isCorrect ? 'bg-success' : 'bg-danger'}`}>
                            Câu {idx + 1}
                          </span>
                          <div className="flex-grow-1">
                            <h6 className="fw-bold mb-3">{q.content}</h6>
                            <div className="d-flex flex-column gap-2">
                              {q.options.map((opt: any) => {
                                const optId = Number(opt.optionId || opt.OptionId);
                                const isSelected = q.selectedOptionIds.includes(optId);
                                const isCorrectOpt = q.correctOptionIds.includes(optId);

                                let optClass = "p-2 rounded border";
                                let icon = null;

                                if (isCorrectOpt) {
                                  optClass = "p-2 rounded border border-success bg-success-subtle text-success-emphasis fw-medium";
                                  icon = <i className="bi bi-check-circle-fill ms-auto"></i>;
                                } else if (isSelected && !isCorrectOpt) {
                                  optClass = "p-2 rounded border border-danger bg-danger-subtle text-danger-emphasis";
                                  icon = <i className="bi bi-x-circle-fill ms-auto"></i>;
                                } else {
                                  optClass = "p-2 rounded border bg-light text-muted";
                                }

                                return (
                                  <div key={optId} className={`d-flex align-items-center ${optClass}`}>
                                    <span>{opt.content || opt.Content}</span>
                                    {icon}
                                  </div>
                                );
                              })}

                              {q.textAnswer && (
                                <div className="mt-2 p-3 bg-white rounded border">
                                  <strong>Câu trả lời của bạn:</strong> {q.textAnswer}
                                </div>
                              )}
                              {q.correctTextAnswer && !q.isCorrect && (
                                <div className="mt-2 p-3 bg-success-subtle rounded border border-success text-success-emphasis">
                                  <strong>Đáp án đúng:</strong> {q.correctTextAnswer}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Right Column: Exam Info */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 sticky-top" style={{ top: '20px', zIndex: 1 }}>
              <div className="position-relative">
                <ImageWithFallback
                  src={exam.image || '/images/background.png'}
                  alt={exam.title}
                  className="card-img-top"
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="position-absolute top-0 end-0 m-3">
                  <span className={`badge rounded-pill bg-${getDifficultyColor(exam.difficulty)}`}>
                    {exam.difficulty}
                  </span>
                </div>
              </div>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">{exam.title}</h5>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="text-muted"><i className="bi bi-tag me-2"></i>Danh mục</span>
                    <span className="fw-medium">{exam.category}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="text-muted"><i className="bi bi-clock me-2"></i>Thời lượng</span>
                    <span className="fw-medium">{exam.duration}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                    <span className="text-muted"><i className="bi bi-question-circle me-2"></i>Số câu hỏi</span>
                    <span className="fw-medium">{exam.questions} câu</span>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary fw-medium" onClick={() => window.print()}>
                    <i className="bi bi-printer me-2"></i>In kết quả
                  </button>
                  <button className="btn btn-outline-dark fw-medium" onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Kết quả bài thi',
                        text: `Tôi vừa hoàn thành bài thi ${exam.title} với điểm số ${result.score}%`,
                        url: window.location.href,
                      });
                    } else {
                      toast.success('Đã sao chép liên kết!');
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}>
                    <i className="bi bi-share me-2"></i>Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-success-subtle { background-color: #d1fae5 !important; }
        .text-success-emphasis { color: #065f46 !important; }
        .bg-danger-subtle { background-color: #fee2e2 !important; }
        .text-danger-emphasis { color: #991b1b !important; }
        .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ExamResult;