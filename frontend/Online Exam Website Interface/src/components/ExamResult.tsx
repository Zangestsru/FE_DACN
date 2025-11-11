import React from 'react';
import { formatSecondsToHumanReadable } from '../utils/time';

interface ExamResultProps {
  exam: any;
  result: any;
  onBackToHome: () => void;
}

const ExamResult: React.FC<ExamResultProps> = ({ exam, result, onBackToHome }) => {
  if (!exam || !result) return null;

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
              <p className="mb-0 text-muted">Bài thi: {exam.title}</p>
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
                        <strong>{exam.passingScore}%</strong>
                      </p>
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
                          <small className="text-muted">Đúng</small>
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
                          <small className="text-muted">Sai</small>
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
                          <small className="text-muted">Thời gian</small>
                        </div>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="mt-auto">
                      <div className="row g-2">
                        <div className="col-12 col-sm-6 col-md-4">
                          <button
                            className="btn w-100 fw-bold py-3"
                            style={{
                              backgroundColor: mainColor,
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                            }}
                            onClick={onBackToHome}
                          >
                            Về trang chủ
                          </button>
                        </div>
                        <div className="col-12 col-sm-6 col-md-4">
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
                        <div className="col-12 col-sm-12 col-md-4">
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

              {/* THÔNG TIN BÀI THI */}
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
                    <div className="mb-3">
                      <img
                        src={exam.image}
                        alt={exam.title}
                        className="img-fluid rounded-3"
                        style={{
                          height: '150px',
                          width: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                    <h6
                      className="fw-bold mb-3 text-center"
                      style={{ color: mainColor }}
                    >
                      {exam.title}
                    </h6>
                    <div className="d-flex flex-column gap-2 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Danh mục:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {exam.category}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Độ khó:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {exam.difficulty}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                        <span className="fw-medium text-muted">Thời gian:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {exam.duration}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center py-2">
                        <span className="fw-medium text-muted">Điểm đạt:</span>
                        <span className="fw-bold" style={{ color: mainColor }}>
                          {exam.passingScore}%
                        </span>
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
