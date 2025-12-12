import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '@/services/exam.service';
import { userService } from '@/services/user.service';
import type { IExam } from '@/types';
import { toast } from 'sonner';
import { formatSecondsToHumanReadable } from '@/utils/time';

// --- Helper Functions ---
function formatDuration(
  timeSpentSeconds?: number, 
  timeSpentMinutes?: number, 
  startTime?: string | Date | null,
  submittedAt?: string | Date | null
): string {
  if (startTime && submittedAt) {
    try {
      const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
      const submitted = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
      const diffSeconds = Math.floor((submitted.getTime() - start.getTime()) / 1000);
      if (diffSeconds > 0 && diffSeconds < 86400) {
        return formatSecondsToHumanReadable(diffSeconds);
      }
    } catch (e) {
      console.warn('❌ Failed to calculate time from StartTime/SubmittedAt:', e);
    }
  }
  
  if (timeSpentSeconds !== undefined && timeSpentSeconds !== null && timeSpentSeconds >= 0 && timeSpentSeconds < 86400) {
    return formatSecondsToHumanReadable(timeSpentSeconds);
  }
  
  if (timeSpentMinutes !== undefined && timeSpentMinutes !== null && timeSpentMinutes >= 0 && timeSpentMinutes < 1440) {
    return formatSecondsToHumanReadable(timeSpentMinutes * 60);
  }
  
  return '0h 0m 0s';
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return 'N/A';
  }
}

// --- Components ---
const CircularProgress = ({ value, color, size = 60, strokeWidth = 5 }: { value: number, color: string, size?: number, strokeWidth?: number }) => {
  const safeValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="position-absolute text-center d-flex align-items-center justify-content-center" style={{ inset: 0 }}>
        <span className="fw-bold" style={{ color: color, fontSize: size * 0.25 }}>{Math.round(safeValue)}%</span>
      </div>
    </div>
  );
};

// --- Types ---
interface ResultWithExam {
  exam: IExam;
  examId?: number | string;
  attemptNumber?: number;
  examAttemptId?: number | string;
  id?: number | string;
  examTitle?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;
  passed?: boolean;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpentMinutes?: number;
  timeSpentSeconds?: number;
  submittedAt?: string | Date | null;
  startTime?: string | Date | null;
}

type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low' | 'name-asc' | 'name-desc';
type FilterOption = 'all' | 'passed' | 'failed';

const ExamHistory: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultWithExam[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = results.length;
    const passed = results.filter(r => r.isPassed || r.passed).length;
    const failed = total - passed;
    
    const averageScore = total > 0
      ? results.reduce((sum, r) => {
          const correctAnswers = Number(r.correctAnswers || r.score || 0);
          const totalQuestionsFromExam = r.exam?.questions || 0;
          const totalQuestionsFromBackend = Number(r.totalQuestions || 0);
          const totalQuestionsFromMaxScore = Number(r.maxScore || 0);
          const totalQuestions = totalQuestionsFromExam > 0 
            ? totalQuestionsFromExam 
            : (totalQuestionsFromBackend > 0 ? totalQuestionsFromBackend : totalQuestionsFromMaxScore);
          const percentage = totalQuestions > 0 
            ? (correctAnswers / totalQuestions) * 100 
            : 0;
          return sum + percentage;
        }, 0) / total
      : 0;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
    };
  }, [results]);

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.exam?.title?.toLowerCase().includes(query) ||
        r.examTitle?.toLowerCase().includes(query)
      );
    }

    if (filterBy === 'passed') {
      filtered = filtered.filter(r => r.isPassed || r.passed);
    } else if (filterBy === 'failed') {
      filtered = filtered.filter(r => !(r.isPassed || r.passed));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateB - dateA;
        case 'oldest':
          const dateA2 = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const dateB2 = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return dateA2 - dateB2;
        case 'score-high':
          const getPct = (r: ResultWithExam) => {
             const t = r.exam?.questions || Number(r.totalQuestions || 0) || Number(r.maxScore || 0);
             return t > 0 ? ((Number(r.correctAnswers || r.score || 0)) / t) * 100 : (r.percentage || 0);
          };
          return getPct(b) - getPct(a);
        case 'score-low':
          const getPctLow = (r: ResultWithExam) => {
             const t = r.exam?.questions || Number(r.totalQuestions || 0) || Number(r.maxScore || 0);
             return t > 0 ? ((Number(r.correctAnswers || r.score || 0)) / t) * 100 : (r.percentage || 0);
          };
          return getPctLow(a) - getPctLow(b);
        case 'name-asc':
          return (a.exam?.title || a.examTitle || '').localeCompare(b.exam?.title || b.examTitle || '');
        case 'name-desc':
          return (b.exam?.title || b.examTitle || '').localeCompare(a.exam?.title || a.examTitle || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, sortBy, filterBy, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredAndSortedResults.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterBy, searchQuery, sortBy]);

  // Data Loading
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setError('Vui lòng đăng nhập để xem lịch sử làm bài.');
      setLoading(false);
      return;
    }
    
    let mounted = true;
    setLoading(true);
    
    Promise.all([
      examService.getMyResults(),
      userService.getActivityHistory().catch(() => []),
    ])
      .then(async ([res, acts]) => {
        if (!mounted) return;
        
        const examIds = [...new Set((res || []).map((r: ResultWithExam) => r.examId || r.exam?.id).filter(Boolean))];
        const examDetailsMap = new Map<number | string, IExam>();
        
        // Fetch exam details in parallel (limit to 10 concurrent requests to avoid 500 error)
        const CHUNK_SIZE = 5;
        for (let i = 0; i < examIds.length; i += CHUNK_SIZE) {
          const chunk = examIds.slice(i, i + CHUNK_SIZE);
          await Promise.all(chunk.map(async (examId) => {
            try {
              const examDetail = await examService.getExamById(examId);
              if (examDetail) {
                examDetailsMap.set(examId, examDetail);
              }
            } catch (e) {
              console.warn(`⚠️ Failed to fetch exam detail for examId ${examId}:`, e);
            }
          }));
        }
        
        const updatedResults = (res || []).map((result: ResultWithExam) => {
          const examId = result.examId || result.exam?.id;
          const examDetail = examId ? examDetailsMap.get(examId) : null;
          if (examDetail) {
            return {
              ...result,
              exam: {
                ...result.exam,
                ...examDetail,
                questions: examDetail.questions || result.exam?.questions || 0,
              }
            };
          }
          return result;
        });
        
        setResults(updatedResults);
        
        const examActivities = (acts || []).filter((a: any) => a.type?.includes('exam'));
        setActivities(examActivities);
      })
      .catch((e) => {
        if (!mounted) return;
        setError('Không thể tải lịch sử làm bài. Vui lòng thử lại sau.');
        toast.error('Không thể tải lịch sử làm bài');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const handleViewDetail = (result: ResultWithExam) => {
    const attemptId = result.examAttemptId || result.id;
    const slug = result.exam?.title?.toLowerCase().replace(/\s+/g, '-') || 'exam';
    if (attemptId) {
      navigate(`/exam-result/${slug}/${attemptId}`);
    } else {
      toast.error('Không tìm thấy thông tin kết quả');
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '1200px' }}>
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 animate__animated animate__fadeInDown">
        <div>
          <h2 className="fw-bold mb-2 text-dark">Lịch sử làm bài</h2>
          <p className="text-muted mb-0">Theo dõi tiến độ và kết quả học tập của bạn</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => navigate('/')}>
            <i className="fas fa-plus me-2"></i>Làm bài thi mới
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && !error && results.length > 0 && (
        <div className="row g-4 mb-5 animate__animated animate__fadeInUp">
          {[
            { label: 'Tổng số bài thi', value: statistics.total, color: '#4e73df', bg: 'rgba(78, 115, 223, 0.1)' },
            { label: 'Đã đạt', value: statistics.passed, color: '#1cc88a', bg: 'rgba(28, 200, 138, 0.1)' },
            { label: 'Điểm trung bình', value: `${statistics.averageScore}%`, color: '#36b9cc', bg: 'rgba(54, 185, 204, 0.1)' },
            { label: 'Tỷ lệ đạt', value: `${statistics.passRate}%`, color: '#f6c23e', bg: 'rgba(246, 194, 62, 0.1)' },
          ].map((stat, index) => (
            <div className="col-md-3 col-6" key={index}>
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px', transition: 'transform 0.2s' }}>
                <div className="card-body d-flex align-items-center justify-content-center flex-column text-center p-4">
                  <div className="h2 mb-1 fw-bold text-dark" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="small text-muted fw-bold text-uppercase">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      {!loading && !error && results.length > 0 && (
        <div className="card border-0 shadow-sm mb-4 animate__animated animate__fadeIn" style={{ borderRadius: '15px' }}>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-lg-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0 rounded-end-pill py-2"
                    placeholder="Tìm kiếm bài thi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-8">
                <div className="d-flex gap-3 justify-content-lg-end flex-wrap">
                  <select
                    className="form-select border-0 bg-light rounded-pill py-2"
                    style={{ width: 'auto', minWidth: '140px' }}
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="passed">Đã đạt</option>
                    <option value="failed">Chưa đạt</option>
                  </select>
                  <select
                    className="form-select border-0 bg-light rounded-pill py-2"
                    style={{ width: 'auto', minWidth: '140px' }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="score-high">Điểm cao nhất</option>
                    <option value="score-low">Điểm thấp nhất</option>
                    <option value="name-asc">Tên (A-Z)</option>
                    <option value="name-desc">Tên (Z-A)</option>
                  </select>
                  <select
                    className="form-select border-0 bg-light rounded-pill py-2"
                    style={{ width: 'auto' }}
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="6">6 / trang</option>
                    <option value="12">12 / trang</option>
                    <option value="24">24 / trang</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger rounded-3 shadow-sm d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-triangle me-3 fs-4"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && (
        <>
          {filteredAndSortedResults.length > 0 ? (
            <div className="row g-4">
              {paginatedResults.map((item, idx) => {
                const score = Number(item.score || 0);
                let isPassed = item.isPassed || item.passed || false;
                isPassed = Boolean(isPassed);
                if (score === 0) isPassed = false;
                
                const correctAnswers = Number(item.correctAnswers || score || 0);
                const totalQuestionsFromExam = item.exam?.questions || 0;
                const totalQuestionsFromBackend = Number(item.totalQuestions || 0);
                const totalQuestionsFromMaxScore = Number(item.maxScore || 0);
                
                const totalQuestions = totalQuestionsFromExam > 0 
                  ? totalQuestionsFromExam 
                  : (totalQuestionsFromBackend > 0 ? totalQuestionsFromBackend : totalQuestionsFromMaxScore);
                
                const percentage = totalQuestions > 0 
                  ? Math.round((correctAnswers / totalQuestions) * 100 * 10) / 10 
                  : 0;
                
                const attemptId = item.examAttemptId || item.id;
                const statusColor = isPassed ? '#1cc88a' : '#e74a3b';

                return (
                  <div className="col-md-6 col-lg-4" key={attemptId || idx}>
                    <div 
                      className="card h-100 border-0 shadow-sm hover-card"
                      style={{ borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease' }}
                      onClick={() => handleViewDetail(item)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
                      }}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between mb-3">
                          <span className="badge rounded-pill px-3 py-2" style={{ 
                            backgroundColor: isPassed ? 'rgba(28, 200, 138, 0.1)' : 'rgba(231, 74, 59, 0.1)', 
                            color: statusColor,
                            fontWeight: 600 
                          }}>
                            {isPassed ? 'Đạt yêu cầu' : 'Chưa đạt'}
                          </span>
                          <small className="text-muted">
                            <i className="far fa-clock me-1"></i>
                            {formatDate(item.submittedAt)}
                          </small>
                        </div>
                        
                        <div className="d-flex align-items-center mb-4">
                          <div className="me-3">
                            <CircularProgress value={percentage} color={statusColor} size={60} strokeWidth={6} />
                          </div>
                          <div>
                            <h5 className="card-title fw-bold mb-1 text-dark" style={{ lineHeight: 1.4, fontSize: '1.1rem' }}>
                              {item.exam?.title || item.examTitle || 'Bài thi'}
                            </h5>
                            <div className="small text-muted">
                              {item.exam?.category && <span className="me-2"><i className="fas fa-tag me-1"></i>{item.exam.category}</span>}
                              {item.attemptNumber && item.attemptNumber > 1 && <span><i className="fas fa-history me-1"></i>Lần {item.attemptNumber}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="row g-0 bg-light rounded-3 p-3 mb-3">
                          <div className="col-6 border-end">
                            <div className="text-center">
                              <div className="small text-muted mb-1">Câu đúng</div>
                              <div className="fw-bold text-dark">{correctAnswers}/{totalQuestions}</div>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center">
                              <div className="small text-muted mb-1">Thời gian</div>
                              <div className="fw-bold text-dark">
                                {formatDuration(item.timeSpentSeconds, item.timeSpentMinutes, item.startTime, item.submittedAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button className="btn w-100 rounded-pill fw-medium" style={{ 
                          backgroundColor: 'rgba(78, 115, 223, 0.1)', 
                          color: '#4e73df',
                          border: 'none',
                          padding: '10px'
                        }}>
                          Xem chi tiết <i className="fas fa-arrow-right ms-2"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5 animate__animated animate__fadeIn">
              <div className="mb-4">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                  <i className="fas fa-clipboard-list fa-3x text-muted opacity-50"></i>
                </div>
              </div>
              <h4 className="text-dark fw-bold">Không tìm thấy kết quả</h4>
              <p className="text-muted">
                {searchQuery || filterBy !== 'all' 
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn' 
                  : 'Bạn chưa thực hiện bài thi nào. Hãy bắt đầu ngay!'}
              </p>
              {!(searchQuery || filterBy !== 'all') && (
                <button className="btn btn-primary rounded-pill px-4 mt-2" onClick={() => navigate('/')}>
                  Khám phá bài thi
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-5">
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-circle mx-1 border-0 shadow-sm" style={{ width: '40px', height: '40px' }} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <li key={page} className="page-item">
                          <button
                            className={`page-link rounded-circle mx-1 border-0 shadow-sm ${currentPage === page ? 'bg-primary text-white' : ''}`}
                            style={{ width: '40px', height: '40px' }}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <li key={page} className="page-item disabled"><span className="page-link border-0">...</span></li>;
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link rounded-circle mx-1 border-0 shadow-sm" style={{ width: '40px', height: '40px' }} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Activity History - Simplified */}
      {!loading && !error && activities.length > 0 && (
        <div className="mt-5 pt-4 border-top animate__animated animate__fadeIn">
          <h5 className="fw-bold mb-4 text-dark"><i className="fas fa-history me-2 text-primary"></i>Hoạt động gần đây</h5>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
            <div className="list-group list-group-flush rounded-3">
              {activities.slice(0, 5).map((a, i) => (
                <div className="list-group-item border-0 px-4 py-3 d-flex align-items-center" key={i}>
                  <div className="me-3">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                      <i className="fas fa-clock text-muted"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-medium text-dark">{a.title || a.description || 'Hoạt động'}</div>
                    <small className="text-muted">{a.timestamp ? formatDate(a.timestamp) : 'N/A'}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamHistory;
