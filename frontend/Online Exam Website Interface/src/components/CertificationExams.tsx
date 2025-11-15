import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ICertificationExam } from '@/types';
import { useExams } from '@/hooks';

interface CertificationExamsProps {
  onExamSelect: (exam: ICertificationExam) => void;
}

export const CertificationExams: React.FC<CertificationExamsProps> = ({ onExamSelect }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const itemsPerPage = 6;

  // Sử dụng hook để lấy data từ service
  const { data: examsData, loading, error, refetch } = useExams({
    page: currentPage,
    limit: itemsPerPage,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    level: selectedLevel !== 'all' ? selectedLevel : undefined,
  });

  const exams = examsData?.data || [];
  
  // Debug logs
  console.log('📊 CertificationExams component:', {
    examsData,
    loading,
    error,
    examsCount: exams.length,
    total: examsData?.total
  });

  const categories = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'Cloud Computing', label: 'Điện toán đám mây' },
    { value: 'English Language', label: 'Tiếng Anh' },
    { value: 'Cybersecurity', label: 'An ninh mạng' },
    { value: 'Networking', label: 'Mạng máy tính' }
  ];

  const levels = [
    { value: 'all', label: 'Tất cả cấp độ' },
    { value: 'Entry', label: 'Cơ bản' },
    { value: 'Associate', label: 'Trung cấp' },
    { value: 'Professional', label: 'Chuyên nghiệp' }
  ];

  const filteredExams = exams.filter(exam => {
    const categoryMatch = selectedCategory === 'all' || exam.category === selectedCategory;
    const levelMatch = selectedLevel === 'all' || exam.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExams = filteredExams.slice(startIndex, startIndex + itemsPerPage);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Cơ bản': return 'success';
      case 'Trung bình': return 'warning';
      case 'Nâng cao': return 'danger';
      default: return 'secondary';
    }
  };

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="col-lg-4 col-md-6">
      <div className="exam-card-enhanced">
        <div className="card-image-wrapper">
          <div className="skeleton" style={{ height: '200px', backgroundColor: '#e0e0e0' }}></div>
        </div>
        <div className="card-content">
          <div className="skeleton mb-2" style={{ height: '24px', width: '80%', backgroundColor: '#e0e0e0' }}></div>
          <div className="skeleton mb-3" style={{ height: '16px', width: '100%', backgroundColor: '#e0e0e0' }}></div>
          <div className="skeleton mb-2" style={{ height: '16px', width: '60%', backgroundColor: '#e0e0e0' }}></div>
          <div className="skeleton" style={{ height: '40px', width: '100%', backgroundColor: '#e0e0e0' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="certification-exams-page">
      <div className="container-fluid py-5">
        {/* Enhanced Header Section */}
        <div className="page-header-modern mb-5">
          <div className="container px-3 px-md-4">
            <div className="row align-items-center g-4">
              <div className="col-lg-8 col-md-12 order-2 order-lg-1">
                <div className="header-content text-center text-lg-start">
                  <h1 className="display-4 fw-bold mb-3 text-dark">
                    Thi Chứng Chỉ Quốc Tế
                  </h1>
                  <p className="lead text-muted mb-4">
                    Nâng cao kỹ năng chuyên môn với các chứng chỉ được công nhận toàn cầu. 
                    Hơn <span className="fw-bold text-primary">50,000+</span> học viên đã tin tưởng và thành công.
                  </p>
                  <div className="d-flex gap-3 gap-md-4 mb-3 justify-content-center justify-content-lg-start flex-wrap">
                    <div className="stats-item text-center">
                      <h3 className="fw-bold mb-1 text-primary">20+</h3>
                      <p className="small text-muted mb-0">Chứng chỉ</p>
                    </div>
                    <div className="stats-item text-center">
                      <h3 className="fw-bold mb-1 text-success">98%</h3>
                      <p className="small text-muted mb-0">Tỷ lệ đỗ</p>
                    </div>
                    <div className="stats-item text-center">
                      <h3 className="fw-bold mb-1 text-info">24/7</h3>
                      <p className="small text-muted mb-0">Hỗ trợ</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-12 order-1 order-lg-2">
                <div className="header-illustration text-center">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1758685848208-e108b6af94cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMG1hdGVyaWFscyUyMGJvb2tzJTIwbGFwdG9wfGVufDF8fHx8MTc1OTIyMjI5M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Study materials"
                    className="img-fluid rounded-3 shadow-lg"
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="filters-section-modern mb-5">
          <div className="container px-3 px-md-4">
            <div className="row align-items-center g-3">
              <div className="col-lg-8 col-md-12">
                <div className="d-flex gap-3 flex-wrap">
                  <select 
                    className="form-select modern-select flex-fill" 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <select 
                    className="form-select modern-select flex-fill"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-lg-4 col-md-12 text-center text-lg-end">
                <span className="results-count-modern d-block d-sm-inline">
                  Hiển thị <strong>{currentExams.length}</strong> trong tổng số <strong>{filteredExams.length}</strong> chứng chỉ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Exam Cards Grid */}
        <div className="container px-3 px-md-4">
          {/* Error Message */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
              <div>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Lỗi:</strong> {error}
              </div>
              <button className="btn btn-sm btn-outline-danger" onClick={refetch}>
                Thử lại
              </button>
            </div>
          )}

          <div className="row g-4">
            {/* Loading State */}
            {loading && (
              <>
                {[...Array(6)].map((_, index) => (
                  <LoadingSkeleton key={index} />
                ))}
              </>
            )}

            {/* Exams Data */}
            {!loading && !error && currentExams.map((exam) => (
              <div key={exam.id} className="col-lg-4 col-md-6 col-sm-12">
                <div className="exam-card-enhanced h-100">
                  <div className="card-image-wrapper">
                    <ImageWithFallback
                      src={exam.image}
                      alt={exam.title}
                      className="card-image"
                    />
                    <div className="card-overlay">
                      <div className="provider-badge">{exam.provider}</div>
                      <div className="rating-info">
                        <div className="stars">★★★★★</div>
                        <span className="rating-text">{exam.rating} ({exam.students.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-header-info">
                      <h3 className="card-title">{exam.title}</h3>
                      <span className={`difficulty-pill pill-${getDifficultyColor(exam.difficulty)}`}>
                        {exam.difficulty}
                      </span>
                    </div>
                    
                    <p className="card-description">{exam.description}</p>
                    
                    <div className="exam-specs">
                      <div className="spec-row">
                        <span className="spec-label">Thời gian:</span>
                        <span className="spec-value">{exam.duration}</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">Câu hỏi:</span>
                        <span className="spec-value">{exam.questions} câu</span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-label">Điểm đạt:</span>
                        <span className="spec-value">{exam.passingScore}%</span>
                      </div>
                    </div>
                    
                    <div className="features-list">
                      {exam.features?.slice(0, 2).map((feature, index) => (
                        <span key={index} className="feature-pill">{feature}</span>
                      ))}
                    </div>
                    
                    <div className="card-footer-info">
                      <div className="pricing">
                        {exam.originalPrice && (
                          <span className="old-price">{exam.originalPrice.toLocaleString()}đ</span>
                        )}
                        <span className="current-price">{exam.price.toLocaleString()}đ</span>
                      </div>
                      <button 
                        className="btn btn-primary modern-btn"
                        onClick={() => onExamSelect(exam)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && !error && currentExams.length === 0 && (
              <div className="col-12">
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                  </div>
                  <h4 className="text-muted">Không tìm thấy chứng chỉ phù hợp</h4>
                  <p className="text-muted">Vui lòng thử thay đổi bộ lọc hoặc tìm kiếm lại</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-modern mt-5">
            <div className="container px-3 px-md-4">
              <nav>
                <ul className="pagination justify-content-center mb-0 flex-wrap">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link modern-page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <span className="d-none d-sm-inline">Trước</span>
                      <span className="d-inline d-sm-none">‹</span>
                    </button>
                  </li>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link modern-page-link"
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link modern-page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <span className="d-none d-sm-inline">Sau</span>
                      <span className="d-inline d-sm-none">›</span>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};