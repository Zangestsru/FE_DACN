import React from 'react';

interface ExamResultProps {
  exam: any;
  result: any;
  onBackToHome: () => void;
}

const ExamResult: React.FC<ExamResultProps> = ({ exam, result, onBackToHome }) => {
  if (!exam || !result) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-lg-11 col-xl-10">
            {/* Modern Result Header */}
            <div className="text-center mb-5">
              <div 
                className="rounded-4 border-0 overflow-hidden mx-auto"
                style={{ 
                  backgroundColor: '#ffffff', 
                  boxShadow: '0 8px 32px rgba(0,115,230,0.1)',
                  maxWidth: '600px'
                }}
              >
                <div className="p-5">
                  <div 
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: result.passed ? '#0073e6' : '#dc3545' 
                    }}
                  >
                    <i 
                      className={`fas ${result.passed ? 'fa-trophy' : 'fa-times'} text-white`}
                      style={{ fontSize: '32px' }}
                    ></i>
                  </div>
                  <h2 className="fw-bold mb-2" style={{ color: '#0073e6' }}>
                    {result.passed ? 'CHÚC MỪNG!' : 'CHƯA ĐẠT'}
                  </h2>
                  <h4 className="fw-medium" style={{ color: '#6c757d' }}>
                    {exam.title}
                  </h4>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Main Score Card */}
              <div className="col-lg-8 mb-4">
                <div 
                  className="rounded-4 border-0 overflow-hidden"
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,115,230,0.1)' }}
                >
                  <div 
                    className="text-white text-center py-4"
                    style={{ backgroundColor: '#0073e6' }}
                  >
                    <h3 className="fw-bold mb-0">KẾT QUẢ BÀI THI</h3>
                  </div>
                  <div className="p-5">
                    {/* Score Display */}
                    <div className="text-center mb-5">
                      <div 
                        className="display-1 fw-bold mb-3"
                        style={{ 
                          color: result.passed ? '#0073e6' : '#dc3545',
                          fontSize: '4rem'
                        }}
                      >
                        {result.score}%
                      </div>
                      <p className="lead" style={{ color: '#6c757d' }}>
                        Điểm tối thiểu để đạt: {exam.passingScore}%
                      </p>
                    </div>

                    {/* Statistics Grid */}
                    <div className="row g-4 mb-5">
                      <div className="col-6 col-md-3">
                        <div className="text-center">
                          <div 
                            className="h2 fw-bold mb-1"
                            style={{ color: '#0073e6' }}
                          >
                            {result.correctAnswers}
                          </div>
                          <small className="text-muted">Đúng</small>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="text-center">
                          <div 
                            className="h2 fw-bold mb-1"
                            style={{ color: '#dc3545' }}
                          >
                            {result.incorrectAnswers}
                          </div>
                          <small className="text-muted">Sai</small>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="text-center">
                          <div 
                            className="h2 fw-bold mb-1"
                            style={{ color: '#6c757d' }}
                          >
                            {result.totalQuestions}
                          </div>
                          <small className="text-muted">Tổng câu</small>
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <div className="text-center">
                          <div 
                            className="h2 fw-bold mb-1"
                            style={{ color: '#0073e6' }}
                          >
                            {formatTime(result.timeSpent)}
                          </div>
                          <small className="text-muted">Thời gian</small>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#0073e6', 
                            color: 'white', 
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px',
                            fontSize: '16px'
                          }}
                          onClick={onBackToHome}
                        >
                          <i className="fas fa-home me-2"></i>
                          Về trang chủ
                        </button>
                      </div>
                      <div className="col-md-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            padding: '12px',
                            fontSize: '16px'
                          }}
                          onClick={handlePrintCertificate}
                        >
                          <i className="fas fa-print me-2"></i>
                          In kết quả
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="col-lg-4">
                <div className="d-flex flex-column gap-4">
                  {/* Exam Info */}
                  <div 
                    className="rounded-4 border-0 overflow-hidden"
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,115,230,0.1)' }}
                  >
                    <div 
                      className="text-white text-center py-3"
                      style={{ backgroundColor: '#0073e6' }}
                    >
                      <h5 className="fw-bold mb-0">THÔNG TIN BÀI THI</h5>
                    </div>
                    <div className="p-4">
                      <div className="mb-3">
                        <img 
                          src={exam.image} 
                          alt={exam.title}
                          className="img-fluid rounded-3"
                          style={{ height: '120px', width: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <h6 className="fw-bold mb-3" style={{ color: '#0073e6' }}>{exam.title}</h6>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium" style={{ color: '#6c757d' }}>Danh mục:</span>
                          <span className="fw-bold" style={{ color: '#0073e6' }}>{exam.category}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium" style={{ color: '#6c757d' }}>Độ khó:</span>
                          <span className="fw-bold" style={{ color: '#0073e6' }}>{exam.difficulty}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium" style={{ color: '#6c757d' }}>Thời gian:</span>
                          <span className="fw-bold" style={{ color: '#0073e6' }}>{exam.duration}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium" style={{ color: '#6c757d' }}>Điểm đạt:</span>
                          <span className="fw-bold" style={{ color: '#0073e6' }}>{exam.passingScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div 
                    className="rounded-4 border-0 overflow-hidden"
                    style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,115,230,0.1)' }}
                  >
                    <div 
                      className="text-white text-center py-3"
                      style={{ backgroundColor: '#0073e6' }}
                    >
                      <h5 className="fw-bold mb-0">BƯỚC TIẾP THEO</h5>
                    </div>
                    <div className="p-4">
                      <div className="d-flex flex-column gap-3">
                        <div 
                          className="p-3 rounded-3 d-flex align-items-center"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="me-3">
                            <i className="fas fa-book" style={{ color: '#0073e6', fontSize: '20px' }}></i>
                          </div>
                          <div>
                            <div className="fw-bold" style={{ color: '#0073e6' }}>Xem khóa học khác</div>
                            <small style={{ color: '#6c757d' }}>Khám phá thêm nhiều khóa học</small>
                          </div>
                        </div>
                        <div 
                          className="p-3 rounded-3 d-flex align-items-center"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="me-3">
                            <i className="fas fa-certificate" style={{ color: '#0073e6', fontSize: '20px' }}></i>
                          </div>
                          <div>
                            <div className="fw-bold" style={{ color: '#0073e6' }}>Chứng chỉ liên quan</div>
                            <small style={{ color: '#6c757d' }}>Tìm hiểu chứng chỉ khác</small>
                          </div>
                        </div>
                        <div 
                          className="p-3 rounded-3 d-flex align-items-center"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="me-3">
                            <i className="fas fa-share-alt" style={{ color: '#0073e6', fontSize: '20px' }}></i>
                          </div>
                          <div>
                            <div className="fw-bold" style={{ color: '#0073e6' }}>Chia sẻ kết quả</div>
                            <small style={{ color: '#6c757d' }}>Chia sẻ thành tích của bạn</small>
                          </div>
                        </div>
                        <div 
                          className="p-3 rounded-3 d-flex align-items-center"
                          style={{ backgroundColor: '#f8f9fa' }}
                        >
                          <div className="me-3">
                            <i className="fas fa-chart-bar" style={{ color: '#0073e6', fontSize: '20px' }}></i>
                          </div>
                          <div>
                            <div className="fw-bold" style={{ color: '#0073e6' }}>Thống kê chi tiết</div>
                            <small style={{ color: '#6c757d' }}>Xem phân tích kết quả</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="row mt-5">
              <div className="col-md-6 mb-4">
                <div 
                  className="rounded-4 border-0 overflow-hidden h-100"
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,115,230,0.1)' }}
                >
                  <div 
                    className="text-white text-center py-3"
                    style={{ backgroundColor: '#0073e6' }}
                  >
                    <h6 className="fw-bold mb-0">Email xác nhận</h6>
                  </div>
                  <div className="p-4 text-center">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: '60px', height: '60px', backgroundColor: '#f8f9fa' }}
                    >
                      <i className="fas fa-envelope" style={{ color: '#0073e6', fontSize: '24px' }}></i>
                    </div>
                    <p className="mb-0" style={{ color: '#6c757d' }}>
                      Kết quả chi tiết sẽ được gửi về email trong vòng 15 phút.
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div 
                  className="rounded-4 border-0 overflow-hidden h-100"
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,115,230,0.1)' }}
                >
                  <div 
                    className="text-white text-center py-3"
                    style={{ backgroundColor: '#0073e6' }}
                  >
                    <h6 className="fw-bold mb-0">Chứng chỉ điện tử</h6>
                  </div>
                  <div className="p-4 text-center">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{ width: '60px', height: '60px', backgroundColor: '#f8f9fa' }}
                    >
                      <i className="fas fa-certificate" style={{ color: '#0073e6', fontSize: '24px' }}></i>
                    </div>
                    <p className="mb-0" style={{ color: '#6c757d' }}>
                      {result.passed ? 'Chứng chỉ sẽ được gửi trong 24h.' : 'Thi đạt để nhận chứng chỉ.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="row mt-4">
              <div className="col-12">
                <div 
                  className="rounded-4 border-0 overflow-hidden"
                  style={{ backgroundColor: '#ffffff', boxShadow: '0 8px 32px rgba(0,115,230,0.1)' }}
                >
                  <div 
                    className="text-white text-center py-4"
                    style={{ backgroundColor: '#0073e6' }}
                  >
                    <h4 className="fw-bold mb-1">HỆ THỐNG LUYỆN THI</h4>
                    <h5 className="fw-medium mb-0 opacity-75">TRẮC NGHIỆM TRỰC TUYẾN</h5>
                  </div>
                  <div className="p-5 text-center">
                    <p className="lead mb-4" style={{ color: '#6c757d' }}>
                      Nền tảng luyện thi trắc nghiệm trực tuyến hàng đầu Việt Nam.
                    </p>
                    <div className="row g-3 mb-4">
                      <div className="col-md-2 col-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            padding: '12px 8px'
                          }}
                        >
                          Trang chủ
                        </button>
                      </div>
                      <div className="col-md-2 col-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            padding: '12px 8px'
                          }}
                        >
                          Đề thi
                        </button>
                      </div>
                      <div className="col-md-2 col-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            padding: '12px 8px'
                          }}
                        >
                          Khóa học
                        </button>
                      </div>
                      <div className="col-md-2 col-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            padding: '12px 8px'
                          }}
                        >
                          Tài liệu
                        </button>
                      </div>
                      <div className="col-md-2 col-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            padding: '12px 8px'
                          }}
                        >
                          Hỗ trợ
                        </button>
                      </div>
                      <div className="col-md-2 col-6">
                        <button 
                          className="btn w-100 fw-bold"
                          style={{ 
                            backgroundColor: '#f8f9fa', 
                            color: '#0073e6', 
                            border: '2px solid #0073e6',
                            borderRadius: '12px',
                            fontSize: '18px'
                          }}
                        >
                          Liên hệ
                        </button>
                      </div>
                    </div>
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