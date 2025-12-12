import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ICertificationExam } from '@/types';
import { useExamDetail, useMyExamResults } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/payment.service';
import { chatService } from '@/services/chat.service';
import { FeedbackForm } from './FeedbackForm';

interface ExamDetailProps {
  onBackToList: () => void;
  onRegister: (examId: string, slug?: string) => void;
  onStartExam: (examId: string, slug?: string) => void;
}

export const ExamDetail: React.FC<ExamDetailProps> = ({ onBackToList, onRegister, onStartExam }) => {
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);
  const [checkingEligibility, setCheckingEligibility] = useState<boolean>(true);
  const [myFeedback, setMyFeedback] = useState<any>(null);
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState<boolean>(false);
  const { slug, examId } = useParams<{ slug: string; examId: string }>();
  const { isAuthenticated, user } = useAuth();

  // Sử dụng hook để lấy chi tiết exam từ URL params
  const { data: examDetailData, loading, error } = useExamDetail(examId as string);
  
  // Lấy kết quả thi của user
  const { data: examResults } = useMyExamResults();

  // Dùng data từ hook
  const exam = examDetailData;

  // Kiểm tra điều kiện: đã mua và đã thi
  useEffect(() => {
    if (!isAuthenticated || !examId || !exam) {
      setCheckingEligibility(false);
      setHasPurchased(false);
      setHasCompleted(false);
      return;
    }

    async function checkEligibility() {
      setCheckingEligibility(true);
      try {
        const examIdNum = parseInt(examId, 10);
        
        // 2. Kiểm tra đã thi (có exam result cho exam này) - check trước vì nếu đã thi thì chắc chắn đã mua
        const hasResult = examResults?.some((result: any) => {
          const resultExamId = result.examId ?? result.ExamId ?? result.exam?.examId ?? result.exam?.ExamId;
          return resultExamId === examIdNum || String(resultExamId) === String(examId);
        }) || false;

        // Nếu đã thi thì chắc chắn đã mua (vì phải mua mới thi được)
        if (hasResult) {
          setHasPurchased(true);
          setHasCompleted(true);
          setCheckingEligibility(false);
          return;
        }

        // 1. Kiểm tra đã mua (có payment success cho exam này)
        // Chỉ check nếu chưa thi (vì nếu đã thi thì đã set purchased = true ở trên)
        const payments = await paymentService.getPaymentHistory();
        const hasPayment = payments.some((p: any) => {
          // Kiểm tra payment success
          if (p.status !== 'success') return false;
          
          // Kiểm tra nếu payment có examId (nếu backend trả về)
          const paymentData = p as any;
          if (paymentData.examId === examIdNum || String(paymentData.examId) === String(examId)) {
            return true;
          }
          
          // Nếu không có examId trực tiếp, có thể check từ orderId hoặc payload
          // Tạm thời: nếu có payment success gần đây và exam là có phí thì coi như đã mua
          // (Logic này có thể cải thiện khi backend trả về examId trong payment data)
          return false;
        });

        setHasPurchased(hasPayment);
        setHasCompleted(false);
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setHasPurchased(false);
        setHasCompleted(false);
      } finally {
        setCheckingEligibility(false);
      }
    }

    checkEligibility();
  }, [isAuthenticated, examId, exam, examResults]);

  // Tính toán xem có thể rating không
  const canRate = useMemo(() => {
    return isAuthenticated && hasPurchased && hasCompleted && !checkingEligibility;
  }, [isAuthenticated, hasPurchased, hasCompleted, checkingEligibility]);

  // Load feedback cho exam này
  const loadFeedback = async () => {
    if (!examId) return;
    
    setLoadingFeedback(true);
    try {
      // Lấy feedback của user hiện tại (chỉ khi đã đăng nhập)
      if (isAuthenticated) {
        try {
          const myFeedbackData = await chatService.getMyFeedbackForExam(examId);
          console.log('📥 My feedback data:', myFeedbackData);
          if (myFeedbackData?.data !== null && myFeedbackData?.data !== undefined) {
            setMyFeedback(myFeedbackData.data);
          } else {
            setMyFeedback(null);
          }
        } catch (e) {
          console.error('Could not load my feedback:', e);
          setMyFeedback(null);
        }
      }

      // Lấy tất cả feedback cho exam này (không cần đăng nhập)
      try {
        const allFeedbackData = await chatService.getFeedbackByExam(examId);
        console.log('📥 All feedbacks data:', allFeedbackData);
        if (allFeedbackData?.data) {
          const feedbacks = Array.isArray(allFeedbackData.data) ? allFeedbackData.data : [];
          setAllFeedbacks(feedbacks);
          console.log('✅ Loaded feedbacks:', feedbacks.length);
        } else if (Array.isArray(allFeedbackData)) {
          setAllFeedbacks(allFeedbackData);
        } else {
          setAllFeedbacks([]);
        }
      } catch (e: any) {
        // Nếu lỗi 404, có thể endpoint chưa tồn tại
        if (e?.statusCode === 404 || e?.status === 404) {
          console.warn('Feedback API endpoint not found. Backend may need to be restarted.');
          setAllFeedbacks([]);
        } else {
          console.error('Could not load all feedbacks:', e);
          setAllFeedbacks([]);
        }
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Load feedback khi examId thay đổi
  useEffect(() => {
    if (examId) {
      loadFeedback();
    }
  }, [examId]);

  // Tính số sao trung bình
  const averageRating = useMemo(() => {
    if (!allFeedbacks || allFeedbacks.length === 0) return 0;
    const sum = allFeedbacks.reduce((acc: number, fb: any) => {
      const stars = fb.stars ?? fb.Stars ?? 0;
      return acc + stars;
    }, 0);
    return sum / allFeedbacks.length;
  }, [allFeedbacks]);

  useEffect(() => {
    // Show promo modal after 2 seconds
    const timer = setTimeout(() => {
      setShowPromoModal(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải thông tin chi tiết...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Lỗi!</h4>
          <p>{error.message}</p>
          <hr />
          <button className="btn btn-outline-danger" onClick={onBackToList}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'info';
      case 'Expert': return 'danger';
      default: return 'secondary';
    }
  };


  return (
    <div className="container-fluid py-4 exam-detail-container">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 exam-detail-header">
            <button className="btn btn-outline-primary" onClick={onBackToList}>
              ← Quay lại danh sách
            </button>
            <span className="badge bg-primary fs-6 exam-detail-category">{exam.category}</span>
          </div>

          <div className="row g-4">
            {/* Main Content - Bên trái */}
            <div className="col-lg-8 col-md-7 col-12">
              <div className="card shadow-sm exam-detail-main">
                <ImageWithFallback
                  src={exam.image}
                  alt={exam.title}
                  className="card-img-top exam-detail-cover"
                  style={{ height: '300px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3 exam-detail-titlebar">
                    <div>
                      <h2 className="card-title">{exam.title}</h2>
                      {/* Hiển thị số sao trung bình */}
                      <div className="mt-2">
                        {averageRating > 0 && allFeedbacks.length > 0 ? (
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ fontSize: '1.2rem', color: '#ffc107' }}>
                              {'★'.repeat(Math.round(averageRating))}
                              {'☆'.repeat(5 - Math.round(averageRating))}
                            </div>
                            <span className="fw-bold" style={{ color: '#1a4b8c' }}>
                              {averageRating.toFixed(1)} ({allFeedbacks.length} đánh giá)
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">Chưa có lượt đánh giá</span>
                        )}
                      </div>
                      {/* ✅ NEW: Provider & Level */}
                      <div className="d-flex gap-2 mt-2 flex-wrap">
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
                    <span className={`badge bg-${getDifficultyColor(exam.difficulty || 'Beginner')} fs-6`}>
                      {exam.difficulty || 'Beginner'}
                    </span>
                  </div>

                  {/* Exam Stats */}
                  <div className="row text-center mb-5 exam-detail-stats">
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">{exam.duration || 'N/A'}</div>
                        <small className="text-muted">Thời gian</small>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">{exam.questions || 0}</div>
                        <small className="text-muted">Câu hỏi</small>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">
                          {(() => {
                            // Calculate passingMark from passingScore percentage
                            // If passingMark exists, use it; otherwise calculate from passingScore and totalQuestions
                            const passingMark = (exam as any).passingMark || 
                              (exam.passingScore && exam.questions 
                                ? Math.ceil((exam.passingScore / 100) * exam.questions) 
                                : exam.passingScore || 0);
                            return passingMark;
                          })()} điểm
                        </div>
                        <small className="text-muted">Điểm đạt</small>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">
                          {(exam.price || 0).toLocaleString('vi-VN')}đ
                          {exam.originalPrice && exam.originalPrice > (exam.price || 0) && (
                            <div className="text-decoration-line-through text-muted small">
                              {exam.originalPrice.toLocaleString('vi-VN')}đ
                            </div>
                          )}
                        </div>
                        <small className="text-muted">Phí thi</small>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {exam.description && (
                    <div className="mb-5">
                      <h5 className="mb-3">Mô tả</h5>
                      <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {exam.description}
                      </p>
                    </div>
                  )}

                  {/* ✅ NEW: Features from backend */}
                  {exam.features && exam.features.length > 0 && (
                    <div className="mb-4">
                      <h5 className="mb-3">Tính năng</h5>
                      <ul className="list-unstyled">
                        {exam.features.map((feature, index) => (
                          <li key={index} className="mb-3 d-flex align-items-start">
                            <span className="text-success me-3 fs-5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Bên phải */}
            <div className="col-lg-4 col-md-5 col-12">
              <div className="card shadow-lg border-0 exam-detail-sidebar">
                <div className="card-header text-white text-center border-0" style={{ backgroundColor: '#1a4b8c', borderRadius: '12px 12px 0 0' }}>
                  <h5 className="mb-0 fw-bold">ĐĂNG KÝ THI NGAY</h5>
                </div>
                <div className="card-body p-4 d-flex flex-column">
                  <div className="text-center mb-4">
                    {exam.originalPrice && exam.originalPrice > (exam.price || 0) ? (
                      <>
                        <div className="h2 fw-bold" style={{ color: '#1a4b8c' }}>
                          {(exam.price || 0).toLocaleString('vi-VN')}đ
                        </div>
                        <div className="text-decoration-line-through text-muted small mb-1">
                          {exam.originalPrice.toLocaleString('vi-VN')}đ
                        </div>
                        <div className="badge bg-danger small">
                          Giảm {Math.round(((exam.originalPrice - (exam.price || 0)) / exam.originalPrice) * 100)}%
                        </div>
                      </>
                    ) : (
                      <div className="h2 fw-bold" style={{ color: '#1a4b8c' }}>
                        {(exam.price || 0).toLocaleString('vi-VN')}đ
                      </div>
                    )}
                    <small className="text-muted fw-medium">Phí thi một lần</small>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Thời gian thi:</small>
                      <small className="fw-bold" style={{ color: '#1a4b8c' }}>{exam.duration || 'N/A'}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Số câu hỏi:</small>
                      <small className="fw-bold" style={{ color: '#1a4b8c' }}>{exam.questions || 0}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Điểm đạt:</small>
                      <small className="fw-bold" style={{ color: '#1a4b8c' }}>
                        {(() => {
                          // Calculate passingMark from passingScore percentage
                          const passingMark = (exam as any).passingMark || 
                            (exam.passingScore && exam.questions 
                              ? Math.ceil((exam.passingScore / 100) * exam.questions) 
                              : exam.passingScore || 0);
                          return `${passingMark} điểm`;
                        })()}
                      </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Độ khó:</small>
                      <span className={`badge bg-${getDifficultyColor(exam.difficulty || 'Beginner')} small`}>
                        {exam.difficulty || 'Beginner'}
                      </span>
                    </div>
                    {/* ✅ NEW: Level */}
                    {exam.level && (
                      <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                        <small className="fw-medium">Level:</small>
                        <span className="badge bg-secondary small">{exam.level}</span>
                      </div>
                    )}
                    {/* ✅ NEW: Valid Period */}
                    {exam.validPeriod && (
                      <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                        <small className="fw-medium">Thời hạn:</small>
                        <small className="fw-bold" style={{ color: '#1a4b8c' }}>{exam.validPeriod}</small>
                      </div>
                    )}
                  </div>

                  <div className="d-grid gap-3 exam-detail-actions mt-4">
                    <button 
                      className="btn btn-lg fw-bold"
                      style={{ 
                        backgroundColor: '#1a4b8c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 24px',
                        boxShadow: '0 4px 8px rgba(26, 75, 140, 0.3)'
                      }}
                      onClick={() => {
                        if (examId) {
                          // Luôn chuyển đến trang thanh toán trước, kể cả khi miễn phí
                          onRegister(examId, slug);
                        }
                      }}
                    >
                      Đăng ký thi ngay
                    </button>
                    <button 
                      className="btn btn-lg fw-bold w-100"
                      style={{ 
                        backgroundColor: '#1a4b8c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 24px',
                        boxShadow: '0 4px 8px rgba(26, 75, 140, 0.3)'
                      }}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-chat-widget', {
                          detail: {
                            targetUserId: exam.createdById,
                            initialMessage: `Tôi muốn được tư vấn về bài thi "${exam.title}"`
                          }
                        }));
                      }}
                    >
                      Tư vấn miễn phí
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-3" style={{ backgroundColor: '#e8f4fd', border: '1px solid #b3d9f7' }}>
                    <div className="text-center">
                      <div className="fw-bold mb-2" style={{ color: '#1a4b8c' }}>Ưu đãi đặc biệt</div>
                      <div className="small fw-medium" style={{ color: '#2c5282' }}>Miễn phí thi lại nếu không đạt lần đầu</div>
                    </div>
                  </div>

                  {/* Hiển thị feedback đã gửi của user */}
                  {myFeedback && (
                    <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#d1ecf1', border: '1px solid #bee5eb' }}>
                      <h6 className="mb-3" style={{ color: '#1a4b8c' }}>Đánh giá của bạn</h6>
                      <div className="mb-2">
                        <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                          {'★'.repeat(myFeedback.stars ?? myFeedback.Stars ?? 0)}
                          {'☆'.repeat(5 - (myFeedback.stars ?? myFeedback.Stars ?? 0))}
                        </div>
                      </div>
                      {(myFeedback.comment ?? myFeedback.Comment) && (
                        <div className="mt-2">
                          <p className="mb-0 text-muted">{myFeedback.comment ?? myFeedback.Comment}</p>
                          <small className="text-muted">
                            {myFeedback.createdAt ? new Date(myFeedback.createdAt).toLocaleDateString('vi-VN') : ''}
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hiển thị các đánh giá trước đó */}
                  {allFeedbacks && allFeedbacks.length > 0 && (
                    <div className="mt-4">
                      <h6 className="mb-3" style={{ color: '#1a4b8c' }}>
                        Đánh giá từ người dùng khác ({allFeedbacks.length})
                      </h6>
                      <div className="d-flex flex-column gap-3">
                        {allFeedbacks
                          .filter((fb: any) => {
                            // Lọc bỏ feedback của user hiện tại (đã hiển thị ở trên)
                            if (myFeedback && (fb.feedbackId === myFeedback.feedbackId || fb.FeedbackId === myFeedback.FeedbackId)) {
                              return false;
                            }
                            return true;
                          })
                          .map((fb: any, index: number) => {
                            const stars = fb.stars ?? fb.Stars ?? 0;
                            const comment = fb.comment ?? fb.Comment;
                            const userName = fb.userName ?? fb.UserName ?? 'Người dùng';
                            const createdAt = fb.createdAt ?? fb.CreatedAt;
                            
                            return (
                              <div 
                                key={fb.feedbackId ?? fb.FeedbackId ?? index}
                                className="p-3 rounded-3" 
                                style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <div className="fw-medium mb-1" style={{ color: '#1a4b8c' }}>
                                      {userName}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', color: '#ffc107' }}>
                                      {'★'.repeat(stars)}
                                      {'☆'.repeat(5 - stars)}
                                    </div>
                                  </div>
                                  {createdAt && (
                                    <small className="text-muted">
                                      {new Date(createdAt).toLocaleDateString('vi-VN')}
                                    </small>
                                  )}
                                </div>
                                {comment && (
                                  <p className="mb-0 mt-2 text-muted" style={{ fontSize: '0.9rem' }}>
                                    {comment}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                      {allFeedbacks.filter((fb: any) => {
                        if (myFeedback && (fb.feedbackId === myFeedback.feedbackId || fb.FeedbackId === myFeedback.FeedbackId)) {
                          return false;
                        }
                        return true;
                      }).length === 0 && (
                        <p className="text-muted text-center py-3">Chưa có đánh giá nào từ người dùng khác.</p>
                      )}
                    </div>
                  )}

                  {/* Feedback Form - Chỉ hiển thị cho người đã mua và đã thi, và chưa có feedback */}
                  {checkingEligibility ? (
                    <div className="mt-4 p-4 rounded-3 text-center" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      <span className="text-muted">Đang kiểm tra...</span>
                    </div>
                  ) : canRate && !myFeedback ? (
                    <FeedbackForm examId={examId} onSuccess={async () => {
                      // Reload feedback sau khi submit thành công
                      if (examId) {
                        // Đợi một chút để backend xử lý xong
                        await new Promise(resolve => setTimeout(resolve, 500));
                        await loadFeedback();
                      }
                    }} />
                  ) : isAuthenticated ? (
                    <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
                      <div className="text-center">
                        <p className="mb-0 text-muted">
                          {!hasPurchased && !hasCompleted && 'Vui lòng mua và hoàn thành bài thi để có thể đánh giá.'}
                          {hasPurchased && !hasCompleted && 'Vui lòng hoàn thành bài thi để có thể đánh giá.'}
                          {!hasPurchased && hasCompleted && 'Vui lòng mua bài thi để có thể đánh giá.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                      <div className="text-center">
                        <p className="mb-0 text-muted">Vui lòng đăng nhập, mua và hoàn thành bài thi để có thể đánh giá.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Modal */}
      {showPromoModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 d-flex justify-content-center align-items-center position-relative" style={{ backgroundColor: '#1a4b8c' }}>
                <h5 className="modal-title text-white mb-0">
                  ÔN TẬP HIỆU QUẢ
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white position-absolute" 
                  style={{ right: '1rem' }}
                  onClick={() => setShowPromoModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="mb-4">
                  <div className="mb-3">
                    <img 
                      src="https://images.unsplash.com/photo-1758685848208-e108b6af94cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHN0dWR5JTIwcHJlcGFyYXRpb258ZW58MXx8fHwxNzU5MTQ0NDc3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="Ôn tập VIP"
                      className="img-fluid rounded"
                      style={{ height: '120px', width: '200px', objectFit: 'cover' }}
                    />
                  </div>
                  <h4>Gói ôn tập VIP</h4>
                  <p className="text-muted">Tăng 85% cơ hội đạt chứng chỉ ngay lần đầu</p>
                </div>

                <div className="row text-center mb-4">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <div className="fw-bold">500+</div>
                      <small>Câu hỏi thực tế</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded">
                      <div className="fw-bold">20h</div>
                      <small>Video giảng dạy</small>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-4">
                  <div className="h4 text-danger">
                    <del>2,000,000đ</del>
                    <span className="ms-2 text-success">990,000đ</span>
                  </div>
                  <div className="text-success fw-bold">Tiết kiệm 50%!</div>
                </div>

                <div className="d-grid gap-2">
                  <button className="btn btn-lg text-white" style={{ backgroundColor: '#1a4b8c' }}>
                    Mua gói ôn tập ngay
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPromoModal(false)}
                  >
                    Để sau
                  </button>
                </div>

                <div className="mt-3">
                  <small className="text-muted">
                    Ưu đãi có hạn - Chỉ còn 3 ngày
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};