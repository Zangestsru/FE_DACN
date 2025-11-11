import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ICertificationExam } from '@/types';
import { useExamDetail } from '@/hooks';

interface ExamDetailProps {
  exam: ICertificationExam | null;
  onBackToList: () => void;
  onRegister: () => void;
}

export const ExamDetail: React.FC<ExamDetailProps> = ({ exam: examProp, onBackToList, onRegister }) => {
  const [showPromoModal, setShowPromoModal] = useState(false);

  // Sử dụng hook để lấy chi tiết exam nếu có ID
  const examId = examProp?.id;
  const { data: examDetailData, loading, error } = useExamDetail(examId as string);

  // Ưu tiên dùng data từ hook, fallback về prop
  const exam = examDetailData || examProp;

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
          <p>{error}</p>
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

  const examSections = [
    { name: 'Lý thuyết cơ bản', questions: Math.floor(exam.questions * 0.3), time: '30 phút' },
    { name: 'Thực hành ứng dụng', questions: Math.floor(exam.questions * 0.4), time: '45 phút' },
    { name: 'Tình huống thực tế', questions: Math.floor(exam.questions * 0.3), time: '35 phút' }
  ];

  const requirements = [
    'Có kinh nghiệm cơ bản trong lĩnh vực',
    'Đã hoàn thành khóa học cơ bản (khuyến nghị)',
    'Máy tính có kết nối internet ổn định',
    'Trình duyệt web hiện đại (Chrome, Firefox, Safari)',
    'Thời gian tập trung ít nhất 2-3 giờ'
  ];

  const benefits = [
    'Chứng chỉ được công nhận toàn cầu',
    'Tăng cơ hội nghề nghiệp',
    'Xác nhận kiến thức chuyên môn',
    'Mạng lưới cộng đồng chuyên gia',
    'Cập nhật xu hướng công nghệ mới'
  ];

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
                    <h2 className="card-title">{exam.title}</h2>
                    <span className={`badge bg-${getDifficultyColor(exam.difficulty)} fs-6`}>
                      {exam.difficulty}
                    </span>
                  </div>
                  
                  <p className="card-text text-muted mb-4">{exam.description}</p>

                  {/* Exam Stats */}
                  <div className="row text-center mb-5 exam-detail-stats">
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">{exam.duration}</div>
                        <small className="text-muted">Thời gian</small>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">{exam.questions}</div>
                        <small className="text-muted">Câu hỏi</small>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-3 mb-md-0">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">{exam.passingScore}%</div>
                        <small className="text-muted">Điểm đạt</small>
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 col-md-3">
                      <div className="p-3 bg-light rounded shadow-sm">
                        <div className="fw-bold fs-5">{exam.price.toLocaleString('vi-VN')}đ</div>
                        <small className="text-muted">Phí thi</small>
                      </div>
                    </div>
                  </div>

                  {/* Exam Structure */}
                  <div className="mb-5">
                    <h5 className="mb-3">Cấu trúc bài thi</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Phần thi</th>
                            <th>Số câu hỏi</th>
                            <th>Thời gian</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examSections.map((section, index) => (
                            <tr key={index}>
                              <td className="fw-medium">{section.name}</td>
                              <td className="text-center">{section.questions}</td>
                              <td className="text-center">{section.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mb-5">
                    <h5 className="mb-3">Yêu cầu tham gia</h5>
                    <ul className="list-unstyled">
                      {requirements.map((req, index) => (
                        <li key={index} className="mb-3 d-flex align-items-start">
                          <span className="text-success me-3 fs-5">✓</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="mb-4">
                    <h5 className="mb-3">Lợi ích sau khi đạt chứng chỉ</h5>
                    <ul className="list-unstyled">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="mb-3 d-flex align-items-start">
                          <span className="text-primary me-3 fs-5">★</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                    <div className="h2 fw-bold" style={{ color: '#1a4b8c' }}>{exam.price.toLocaleString('vi-VN')}đ</div>
                    <small className="text-muted fw-medium">Phí thi một lần</small>
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Thời gian thi:</small>
                      <small className="fw-bold" style={{ color: '#1a4b8c' }}>{exam.duration}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Số câu hỏi:</small>
                      <small className="fw-bold" style={{ color: '#1a4b8c' }}>{exam.questions}</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Điểm đạt:</small>
                      <small className="fw-bold" style={{ color: '#1a4b8c' }}>{exam.passingScore}%</small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="fw-medium">Độ khó:</small>
                      <span className={`badge bg-${getDifficultyColor(exam.difficulty)} small`}>
                        {exam.difficulty}
                      </span>
                    </div>
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
                      onClick={onRegister}
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