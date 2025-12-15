import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { IExam } from '@/types';
import { useExams } from '@/hooks';
import { chatService } from '@/services/chat.service';

interface CertificationExamsProps {
  onExamSelect: (exam: IExam) => void;
}

export const CertificationExams: React.FC<CertificationExamsProps> = ({ onExamSelect }) => {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('q') || '');
  const [examRatings, setExamRatings] = useState<Record<string | number, { rating: number; count: number }>>({});
  const itemsPerPage = 6;

  // Listen to URL changes for search query
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    if (queryFromUrl !== null && queryFromUrl !== searchQuery) {
      setSearchQuery(queryFromUrl);
      setDebouncedSearchQuery(queryFromUrl);
    }
  }, [searchParams]);

  // Debounce search query (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLevel, selectedDifficulty, debouncedSearchQuery]);

  // Sử dụng hook để lấy data từ service
  const { data: examsData, loading, error, refetch } = useExams({
    page: currentPage,
    limit: itemsPerPage,
    level: selectedLevel !== 'all' ? selectedLevel : undefined,
    search: debouncedSearchQuery || undefined,
  });

  const exams = examsData?.data || [];
  
  // Load ratings cho các exam
  useEffect(() => {
    if (exams.length === 0) return;
    
    async function loadRatings() {
      const ratingsMap: Record<string | number, { rating: number; count: number }> = {};
      
      // Load ratings cho từng exam (có thể tối ưu bằng cách batch request)
      const ratingPromises = exams.map(async (exam: IExam) => {
        try {
          const feedbackData = await chatService.getFeedbackByExam(exam.id);
          console.log(`📊 Feedback data for exam ${exam.id}:`, feedbackData);
          const feedbacks = feedbackData?.data || (Array.isArray(feedbackData) ? feedbackData : []);
          
          if (feedbacks.length > 0) {
            const sum = feedbacks.reduce((acc: number, fb: any) => {
              const stars = fb.stars ?? fb.Stars ?? 0;
              return acc + stars;
            }, 0);
            const avg = sum / feedbacks.length;
            ratingsMap[exam.id] = { rating: avg, count: feedbacks.length };
            console.log(`✅ Rating for exam ${exam.id}: ${avg.toFixed(1)} (${feedbacks.length} reviews)`);
          } else {
            // Nếu không có feedback, set rating = 0 và count = 0
            ratingsMap[exam.id] = { rating: 0, count: 0 };
            console.log(`⚠️ No feedback for exam ${exam.id}, setting rating to 0`);
          }
        } catch (error) {
          // Bỏ qua lỗi, giữ rating mặc định
          console.log(`Could not load rating for exam ${exam.id}:`, error);
          if (exam.rating) {
            ratingsMap[exam.id] = { rating: exam.rating, count: exam.students || 0 };
          }
        }
      });
      
      await Promise.allSettled(ratingPromises);
      setExamRatings(ratingsMap);
    }
    
    loadRatings();
  }, [exams]);
  
  // Debug logs
  console.log('📊 CertificationExams component:', {
    examsData,
    loading,
    error,
    examsCount: exams.length,
    total: examsData?.pagination?.total,
    totalPages: examsData?.pagination?.totalPages
  });

  const levels = [
    { value: 'all', label: 'Tất cả Level' },
    { value: 'Entry', label: 'Entry' },
    { value: 'Associate', label: 'Associate' },
    { value: 'Professional', label: 'Professional' }
  ];

  const difficulties = [
    { value: 'all', label: 'Tất cả độ khó' },
    { value: 'Beginner', label: 'Cơ bản' },
    { value: 'Intermediate', label: 'Trung bình' },
    { value: 'Advanced', label: 'Nâng cao' },
    { value: 'Expert', label: 'Chuyên gia' }
  ];

  // Filter exams by level, difficulty, and search (client-side filter)
  const filteredExams = exams.filter(exam => {
    const levelMatch = selectedLevel === 'all' || exam.level === selectedLevel;
    
    // Difficulty filter - check both English and Vietnamese values
    let difficultyMatch = true;
    if (selectedDifficulty !== 'all') {
      const examDifficulty = exam.difficulty || '';
      // Map English to Vietnamese and vice versa
      const difficultyMap: Record<string, string[]> = {
        'Beginner': ['Beginner', 'Cơ bản', 'Dễ'],
        'Intermediate': ['Intermediate', 'Trung bình'],
        'Advanced': ['Advanced', 'Nâng cao'],
        'Expert': ['Expert', 'Chuyên gia']
      };
      
      const allowedValues = difficultyMap[selectedDifficulty] || [selectedDifficulty];
      difficultyMatch = allowedValues.some(val => 
        examDifficulty.toLowerCase() === val.toLowerCase()
      );
    }
    
    // Search filter (case-insensitive)
    const searchMatch = !debouncedSearchQuery || 
      exam.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      exam.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      exam.provider?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    return levelMatch && difficultyMatch && searchMatch;
  });

  // Use server-side pagination info if available, otherwise calculate from filtered results
  // If filters are applied, we need to recalculate pagination based on filtered results
  const totalFromServer = examsData?.pagination?.total || 0;
  const totalPagesFromServer = examsData?.pagination?.totalPages || 0;
  
  // If filters or search are active, recalculate pagination based on filtered results
  const hasActiveFilters = selectedLevel !== 'all' || selectedDifficulty !== 'all' || debouncedSearchQuery !== '';
  
  // Calculate totalPages: use server value if no filters, otherwise calculate from filtered results
  let totalPages: number;
  let totalItems: number;
  
  if (hasActiveFilters) {
    // Client-side filtering: calculate from filtered results
    totalItems = filteredExams.length;
    totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  } else {
    // Server-side pagination: use server values
    totalItems = totalFromServer;
    totalPages = totalPagesFromServer || Math.ceil(totalFromServer / itemsPerPage);
  }
  
  // For client-side pagination when filters are active
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExams = hasActiveFilters
    ? filteredExams.slice(startIndex, startIndex + itemsPerPage)
    : exams;
  
  // Debug pagination info
  console.log('📄 Pagination info:', {
    hasActiveFilters,
    totalFromServer,
    totalPagesFromServer,
    totalItems,
    totalPages,
    currentPage,
    currentExamsLength: currentExams.length
  });

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
            {/* Search Bar Row */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="search-bar-modern position-relative">
                  <i className="bi bi-search position-absolute" style={{ 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    fontSize: '18px',
                    color: '#6c757d',
                    zIndex: 1
                  }}></i>
                  <input
                    type="text"
                    className="form-control modern-search-input"
                    placeholder="Tìm kiếm chứng chỉ theo tên, mô tả, nhà cung cấp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      paddingLeft: '45px',
                      paddingRight: searchQuery ? '45px' : '16px',
                      height: '50px',
                      fontSize: '15px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-link position-absolute"
                      onClick={() => setSearchQuery('')}
                      style={{
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '4px 8px',
                        color: '#6c757d',
                        textDecoration: 'none'
                      }}
                    >
                      <i className="bi bi-x-circle-fill" style={{ fontSize: '18px' }}></i>
                    </button>
                  )}
                </div>
                {searchQuery && debouncedSearchQuery !== searchQuery && (
                  <div className="text-muted small mt-2">
                    <i className="bi bi-hourglass-split me-1"></i>
                    Đang tìm kiếm...
                  </div>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="row align-items-center g-3">
              <div className="col-lg-8 col-md-12">
                <div className="d-flex gap-3 flex-wrap">
                  <select 
                    className="form-select modern-select flex-fill" 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  <select 
                    className="form-select modern-select flex-fill"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
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

            {/* Active Filters Display */}
            {(selectedLevel !== 'all' || selectedDifficulty !== 'all' || debouncedSearchQuery) && (
              <div className="row mt-3">
                <div className="col-12">
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    <span className="text-muted small">Bộ lọc đang áp dụng:</span>
                    {debouncedSearchQuery && (
                      <span className="badge bg-primary" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        <i className="bi bi-search me-1"></i>
                        "{debouncedSearchQuery}"
                        <button 
                          className="btn btn-link p-0 ms-2 text-white"
                          onClick={() => setSearchQuery('')}
                          style={{ fontSize: '12px', textDecoration: 'none' }}
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedLevel !== 'all' && (
                      <span className="badge bg-info" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Level: {levels.find(l => l.value === selectedLevel)?.label}
                        <button 
                          className="btn btn-link p-0 ms-2 text-white"
                          onClick={() => setSelectedLevel('all')}
                          style={{ fontSize: '12px', textDecoration: 'none' }}
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedDifficulty !== 'all' && (
                      <span className="badge bg-warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Độ khó: {difficulties.find(d => d.value === selectedDifficulty)?.label}
                        <button 
                          className="btn btn-link p-0 ms-2 text-dark"
                          onClick={() => setSelectedDifficulty('all')}
                          style={{ fontSize: '12px', textDecoration: 'none' }}
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <button 
                      className="btn btn-link text-danger small"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedLevel('all');
                        setSelectedDifficulty('all');
                      }}
                      style={{ textDecoration: 'none', fontSize: '13px' }}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Xóa tất cả
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Exam Cards Grid */}
        <div className="container px-3 px-md-4">
          {/* Error Message */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
              <div>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Lỗi:</strong> {error.message}
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
                      <div className="provider-badge">{exam.provider || 'Unknown Provider'}</div>
                      <div className="rating-info">
                        {(() => {
                          const examRating = examRatings[exam.id];
                          const rating = examRating?.rating ?? (exam.rating || 0);
                          const count = examRating?.count ?? (exam.students || 0);
                          
                          // Nếu không có đánh giá (rating = 0 và count = 0)
                          if (rating === 0 && count === 0) {
                            return (
                              <span className="rating-text" style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>
                                Chưa có lượt đánh giá
                              </span>
                            );
                          }
                          
                          const fullStars = Math.round(rating);
                          return (
                            <>
                              <div className="stars" style={{ color: '#ffc107' }}>
                                {'★'.repeat(fullStars)}
                                {'☆'.repeat(5 - fullStars)}
                              </div>
                              <span className="rating-text">{rating.toFixed(1)} ({count.toLocaleString()})</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-header-info">
                      <div className="d-flex gap-2 flex-wrap mb-2">
                        <span className={`difficulty-pill pill-${getDifficultyColor(exam.difficulty || 'Cơ bản')}`}>
                          {exam.difficulty || 'Cơ bản'}
                        </span>
                        {/* ✅ NEW: Level badge */}
                        {exam.level && (
                          <span className="badge bg-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                            {exam.level}
                          </span>
                        )}
                      </div>
                      <h3 className="card-title" title={exam.title}>{exam.title}</h3>
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
                        <span className="spec-value">
                          {(() => {
                            // Calculate passingMark from passingScore percentage
                            const passingMark = (exam as any).passingMark || 
                              (exam.passingScore && exam.questions 
                                ? Math.ceil((exam.passingScore / 100) * exam.questions) 
                                : exam.passingScore || 0);
                            return `${passingMark} điểm`;
                          })()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="features-list">
                      {exam.features?.slice(0, 2).map((feature, index) => (
                        <span key={index} className="feature-pill">{feature}</span>
                      )) || null}
                    </div>
                    
                    <div className="card-footer-info">
                      <div className="pricing">
                        {exam.originalPrice && exam.originalPrice > 0 && (
                          <span className="old-price">{exam.originalPrice.toLocaleString()}đ</span>
                        )}
                        <span className="current-price">{(exam.price || 0).toLocaleString()}đ</span>
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
                    {debouncedSearchQuery ? (
                      <i className="bi bi-search" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                    ) : (
                      <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                    )}
                  </div>
                  {debouncedSearchQuery ? (
                    <>
                      <h4 className="text-muted">Không tìm thấy kết quả cho "{debouncedSearchQuery}"</h4>
                      <p className="text-muted mb-3">Vui lòng thử với từ khóa khác hoặc xóa bộ lọc</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedLevel('all');
                          setSelectedDifficulty('all');
                        }}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Xóa bộ lọc và tìm kiếm
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-muted">Không tìm thấy chứng chỉ phù hợp</h4>
                      <p className="text-muted">Vui lòng thử thay đổi bộ lọc hoặc tìm kiếm lại</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-modern mt-5">
            <div className="container px-3 px-md-4">
              <div className="d-flex flex-column align-items-center gap-3">
                <nav>
                  <ul className="pagination justify-content-center mb-0 flex-wrap">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link modern-page-link"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        « Đầu
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link modern-page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        ‹ Trước
                      </button>
                    </li>
                    
                    {/* Hiển thị số trang - tối đa 5 trang */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link modern-page-link"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link modern-page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Sau ›
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link modern-page-link"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Cuối »
                      </button>
                    </li>
                  </ul>
                </nav>
                <div className="d-flex align-items-center gap-3 text-muted small">
                  <span>
                    Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    Hiển thị <strong>{currentExams.length}</strong> trong tổng số <strong>{totalItems}</strong> chứng chỉ
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};