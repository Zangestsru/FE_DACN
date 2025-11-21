import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService } from '@/services/exam.service';
import { userService } from '@/services/user.service';
import type { IExam, IExamResult } from '@/types';
import { toast } from 'sonner';

function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return '0 phút';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours} giờ ${mins} phút`;
  }
  return `${mins} phút`;
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

interface ResultWithExam extends IExamResult {
  exam: IExam;
  attemptNumber?: number;
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

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = results.length;
    const passed = results.filter(r => r.isPassed || r.passed).length;
    const failed = total - passed;
    const averageScore = total > 0
      ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / total
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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.exam?.title?.toLowerCase().includes(query) ||
        r.examTitle?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy === 'passed') {
      filtered = filtered.filter(r => r.isPassed || r.passed);
    } else if (filterBy === 'failed') {
      filtered = filtered.filter(r => !(r.isPassed || r.passed));
    }

    // Apply sort
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
          return (b.percentage || 0) - (a.percentage || 0);
        case 'score-low':
          return (a.percentage || 0) - (b.percentage || 0);
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

  useEffect(() => {
    console.log('🚀 ExamHistory useEffect triggered');
    
    // Check authentication status
    const token = localStorage.getItem('access_token');
    const userInfo = localStorage.getItem('user_info');
    console.log('🔑 Authentication check - token:', token ? 'exists' : 'missing');
    console.log('👤 User info:', userInfo ? 'exists' : 'missing');
    
    if (!token) {
      console.warn('⚠️ User not authenticated - cannot load exam history');
      setError('Vui lòng đăng nhập để xem lịch sử làm bài.');
      setLoading(false);
      return;
    }
    
    let mounted = true;
    setLoading(true);
    console.log('📚 Loading exam history from database...');
    
    // Fetch exam results
    Promise.all([
      examService.getMyResults(),
      userService.getActivityHistory().catch(() => []), // Optional, don't fail if this errors
    ])
      .then(([res, acts]) => {
        if (!mounted) return;
        console.log('📊 Exam results from database:', res);
        console.log('📋 Activity history from database:', acts);
        
        // Use only real data from API/database
        setResults(res || []);
        
        // Chỉ hiển thị các hoạt động liên quan đến bài thi
        const examActivities = (acts || []).filter((a: any) => a.type?.includes('exam'));
        console.log('📝 Filtered exam activities:', examActivities);
        setActivities(examActivities);
      })
      .catch((e) => {
        console.error('❌ Error loading exam history:', e);
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
    <div className="container py-4" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-2" style={{ fontWeight: '600', color: '#2c3e50' }}>Lịch sử làm bài</h2>
        <p className="text-muted mb-0">Xem lại các bài thi bạn đã làm và kết quả chi tiết.</p>
      </div>

      {/* Statistics Cards */}
      {!loading && !error && results.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="small opacity-75">Tổng số bài thi</div>
                    <div className="h4 mb-0 fw-bold">{statistics.total}</div>
                  </div>
                  <div className="fs-1 opacity-50">📊</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="small opacity-75">Đã đạt</div>
                    <div className="h4 mb-0 fw-bold">{statistics.passed}</div>
                  </div>
                  <div className="fs-1 opacity-50">✅</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="small opacity-75">Điểm trung bình</div>
                    <div className="h4 mb-0 fw-bold">{statistics.averageScore}%</div>
                  </div>
                  <div className="fs-1 opacity-50">⭐</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="small opacity-75">Tỷ lệ đạt</div>
                    <div className="h4 mb-0 fw-bold">{statistics.passRate}%</div>
                  </div>
                  <div className="fs-1 opacity-50">🎯</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {!loading && !error && results.length > 0 && (
        <div className="card mb-4 border-0 shadow-sm">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label small fw-medium text-muted">Tìm kiếm</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tên bài thi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-medium text-muted">Lọc theo</label>
                <select
                  className="form-select"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                >
                  <option value="all">Tất cả</option>
                  <option value="passed">Đã đạt</option>
                  <option value="failed">Chưa đạt</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-medium text-muted">Sắp xếp</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="score-high">Điểm cao → thấp</option>
                  <option value="score-low">Điểm thấp → cao</option>
                  <option value="name-asc">Tên A → Z</option>
                  <option value="name-desc">Tên Z → A</option>
                </select>
              </div>
              <div className="col-md-2">
                <div className="text-muted small">
                  Hiển thị: <strong>{filteredAndSortedResults.length}</strong> / {results.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <div className="text-muted">Đang tải lịch sử làm bài...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger border-0 shadow-sm" role="alert">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-circle me-2"></i>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && (
        <>
          {filteredAndSortedResults.length > 0 ? (
            <div className="row g-3">
              {filteredAndSortedResults.map((item, idx) => {
                // ✅ USE SAME LOGIC AS ExamResult component
                // ExamResult uses: resultData?.isPassed || (resultData?.percentage >= (exam.passingScore || 0))
                // But we trust backend's isPassed from ExamResultDto (same source as ExamResult)
                const score = Number(item.score || 0);
                
                // Get isPassed from backend (same as useExamResult hook)
                let isPassed = item.isPassed || item.passed || false;
                isPassed = Boolean(isPassed);
                
                // ✅ CRITICAL VALIDATION: Score = 0 means definitely failed
                // This matches ExamResult logic where score = 0 would never pass
                if (score === 0) {
                  isPassed = false;
                }
                
                const percentage = item.percentage || 0;
                const attemptId = item.examAttemptId || item.id;
                
                return (
                  <div className="col-md-6 col-lg-4" key={attemptId || idx}>
                    <div 
                      className="card h-100 border-0 shadow-sm"
                      style={{ 
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }}
                      onClick={() => handleViewDetail(item)}
                    >
                      <div className="card-body">
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h5 className="card-title mb-1" style={{ 
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              color: '#2c3e50',
                              lineHeight: '1.4'
                            }}>
                              {item.exam?.title || item.examTitle || 'Bài thi'}
                            </h5>
                            {item.exam?.category && (
                              <div className="text-muted small">
                                <i className="fas fa-tag me-1"></i>
                                {item.exam.category}
                                {item.attemptNumber && item.attemptNumber > 1 && (
                                  <span className="ms-2">
                                    <i className="fas fa-redo me-1"></i>
                                    Lần {item.attemptNumber}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span 
                            className={`badge ${isPassed ? 'bg-success' : 'bg-danger'}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {isPassed ? 'Đạt' : 'Chưa đạt'}
                          </span>
                        </div>

                        {/* Score Progress */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-medium">Điểm số</span>
                            <span className="small fw-bold" style={{ color: isPassed ? '#28a745' : '#dc3545' }}>
                              {item.score || 0}/{item.maxScore || 0} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                            <div
                              className={`progress-bar ${isPassed ? 'bg-success' : 'bg-danger'}`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <div className="small text-muted">
                              <i className="fas fa-check-circle me-1"></i>
                              Đúng: <strong>{item.correctAnswers || 0}/{item.totalQuestions || 0}</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="small text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {formatDuration(item.timeSpentMinutes || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Submitted Date */}
                        {item.submittedAt && (
                          <div className="small text-muted mb-3">
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(item.submittedAt)}
                          </div>
                        )}

                        {/* View Detail Button */}
                        <button
                          className="btn btn-outline-primary btn-sm w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(item);
                          }}
                        >
                          <i className="fas fa-eye me-2"></i>
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}>📝</div>
                <h5 className="text-muted mb-2">
                  {searchQuery || filterBy !== 'all' 
                    ? 'Không tìm thấy kết quả phù hợp' 
                    : 'Chưa có kết quả làm bài nào'}
                </h5>
                <p className="text-muted small mb-0">
                  {searchQuery || filterBy !== 'all'
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Bắt đầu làm bài thi để xem kết quả tại đây'}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Activity History (Optional) */}
      {!loading && !error && activities.length > 0 && (
        <div className="mt-5">
          <h5 className="mb-3" style={{ fontWeight: '600' }}>Hoạt động gần đây</h5>
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="list-group list-group-flush">
                {activities.slice(0, 10).map((a, i) => (
                  <div className="list-group-item border-0 px-0" key={i}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{a.title || a.description || 'Hoạt động'}</span>
                      <span className="text-muted small">
                        {a.timestamp ? formatDate(a.timestamp) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamHistory;
