import React, { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { courseService } from '@/services/course.service';
import { useCourseEnroll, useCourseDetail } from '@/hooks/useCourses';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// CSS để đảm bảo star rating không bị override
const starRatingCSS = `
  .star-rating-item.star-gray {
    color: #dee2e6 !important;
    -webkit-text-fill-color: #dee2e6 !important;
    filter: grayscale(100%) !important;
    opacity: 0.5 !important;
  }
  .star-rating-item.star-yellow {
    color: #ffc107 !important;
    -webkit-text-fill-color: #ffc107 !important;
    filter: none !important;
    opacity: 1 !important;
  }
`;

interface StudyDetailProps {
  onBackToList: () => void;
}

export const StudyDetail: React.FC<StudyDetailProps> = ({ 
  onBackToList
}) => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // ✅ Debug: Log courseId from URL
  console.log('📚 StudyDetail - courseId from URL params:', courseId);
  
  // ✅ Fetch course data from API using courseId from URL
  const { data: course, loading: loadingCourse, error: courseError } = useCourseDetail(courseId || null);

  // Hook để đăng ký khóa học
  const { mutate: enrollCourse } = useCourseEnroll({
    onSuccess: (data) => {
      console.log('✅ Course enrolled:', data);
      toast.success(data.message || 'Đăng ký khóa học thành công!');
      setEnrolling(false);
      // Cập nhật enrollment status
      setIsEnrolled(true);
      // Điều hướng đến trang học với courseId
      if (courseId) {
        navigate(`/study-lesson/${courseId}`);
      }
    },
    onError: (error) => {
      console.error('❌ Error enrolling course:', error);
      toast.error(error.message || 'Lỗi khi đăng ký khóa học');
      setEnrolling(false);
    },
  });

  // Handler cho nút đăng ký
  const handleRegister = async () => {
    if (!courseId || !course?.id) {
      toast.error('Không tìm thấy thông tin khóa học');
      return;
    }

    // Nếu khóa học có phí, điều hướng đến trang thanh toán với courseId
    if (course.price && course.price > 0) {
      navigate(`/study-payment?courseId=${courseId}`);
      return;
    }

    // Nếu khóa học miễn phí, đăng ký trực tiếp
    try {
      setEnrolling(true);
      await enrollCourse(course.id);
    } catch (error) {
      console.error('Error in handleRegister:', error);
      setEnrolling(false);
    }
  };
  
  // Handler cho nút bắt đầu học
  const handleStartLearning = () => {
    if (courseId) {
      // Chỉ áp dụng trial mode cho khóa học có phí
      const isPaidCourse = course?.price && Number(course.price) > 0;
      
      // Nếu chưa enroll và khóa học có phí, navigate với trial=true để học thử bài đầu tiên
      if (!isEnrolled && isPaidCourse) {
        navigate(`/study-lesson/${courseId}?trial=true`);
      } else {
        navigate(`/study-lesson/${courseId}`);
      }
    }
  };

  // Load lessons và kiểm tra enrollment từ API khi có courseId
  useEffect(() => {
    if (courseId && course?.id) {
      loadCourseLessons();
      if (isAuthenticated) {
        checkEnrollment();
        loadCourseReviews();
      }
    }
  }, [courseId, course?.id, isAuthenticated]);

  // Refresh enrollment status và reviews khi chuyển sang tab Reviews
  useEffect(() => {
    if (activeTab === 'reviews' && isAuthenticated && courseId && course?.id) {
      checkEnrollment();
      loadCourseReviews();
    }
  }, [activeTab, isAuthenticated, courseId, course?.id]);

  const loadCourseLessons = async () => {
    if (!courseId || !course?.id) return;
    try {
      setLoadingLessons(true);
      const lessons = await courseService.getCourseLessons(course.id);
      setCourseLessons(lessons || []);
    } catch (error) {
      console.error('Error loading course lessons:', error);
      setCourseLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const checkEnrollment = async () => {
    if (!courseId || !course?.id) return;
    try {
      setCheckingEnrollment(true);
      const enrollmentStatus = await courseService.getEnrollmentStatus(course.id);
      setIsEnrolled(enrollmentStatus.isEnrolled);
      setIsCourseCompleted(enrollmentStatus.isCompleted);
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
      setIsCourseCompleted(false);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const loadCourseReviews = async () => {
    if (!courseId || !course?.id) return;
    try {
      setLoadingReviews(true);
      const courseReviews = await courseService.getCourseReviews(course.id);
      console.log('📝 Loaded reviews:', courseReviews);
      setReviews(courseReviews || []);
    } catch (error) {
      console.error('Error loading course reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // ✅ Calculate actual rating from reviews
  const validReviews = reviews.filter(r => r && typeof r.rating === 'number' && r.rating > 0);
  const reviewCount = validReviews.length;
  const actualRating = reviewCount > 0 
    ? validReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount 
    : 0;
  const roundedRating = actualRating > 0 ? Math.round(actualRating * 10) / 10 : 0;
  
  // Use actual rating from reviews if available, otherwise fallback to course default
  const displayRating = roundedRating > 0 ? roundedRating : (course?.rating || 0);
  
  // For students count: Use course.students from API if available, otherwise use reviewCount as proxy
  // (If there are reviews, at least that many students have enrolled and reviewed)
  const displayStudents = course?.students && course.students > 0 
    ? course.students 
    : (reviewCount > 0 ? reviewCount : 0);

  // ✅ Calculate total duration from lessons
  const calculateTotalDuration = () => {
    if (courseLessons.length === 0) {
      return course?.duration || 'N/A';
    }

    // Parse duration from each lesson (format: "MM:SS" or "HH:MM:SS")
    let totalSeconds = 0;
    courseLessons.forEach((lesson) => {
      const duration = lesson.duration || '0:00';
      const parts = duration.split(':').map(Number);
      
      if (parts.length === 2) {
        // Format: "MM:SS"
        totalSeconds += parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        // Format: "HH:MM:SS"
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    });

    if (totalSeconds === 0) {
      return course?.duration || 'N/A';
    }

    // Format total duration
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ''}`;
    } else {
      return `${minutes} phút`;
    }
  };

  const displayDuration = calculateTotalDuration();

  // Loading state
  if (loadingCourse) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (courseError || !course) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Lỗi!</h4>
          <p>{courseError?.message || 'Không tìm thấy khóa học'}</p>
          <button className="btn btn-primary" onClick={onBackToList}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const curriculum = [
    {
      module: 'Module 1: Giới thiệu cơ bản',
      lessons: [
        { title: 'Bài 1: Tổng quan về khóa học', duration: '15 phút', type: 'video', completed: false },
        { title: 'Bài 2: Cài đặt môi trường', duration: '30 phút', type: 'video', completed: false },
        { title: 'Tài liệu: Setup Guide', duration: '10 phút', type: 'document', completed: false }
      ]
    },
    {
      module: 'Module 2: Kiến thức nền tảng',
      lessons: [
        { title: 'Bài 3: Khái niệm cơ bản', duration: '45 phút', type: 'video', completed: false },
        { title: 'Bài 4: Thực hành đầu tiên', duration: '60 phút', type: 'video', completed: false },
        { title: 'Bài tập: Quiz kiểm tra', duration: '20 phút', type: 'quiz', completed: false }
      ]
    },
    {
      module: 'Module 3: Thực hành nâng cao',
      lessons: [
        { title: 'Bài 5: Dự án thực tế', duration: '90 phút', type: 'video', completed: false },
        { title: 'Bài 6: Best practices', duration: '40 phút', type: 'video', completed: false },
        { title: 'Tài liệu: Code examples', duration: '15 phút', type: 'document', completed: false }
      ]
    }
  ];

  const instructor = {
    name: course.instructor,
    title: 'Senior Developer & Educator',
    experience: '8+ năm kinh nghiệm',
    students: '25,000+ học viên',
    courses: '15 khóa học',
    rating: '4.9/5',
    bio: 'Chuyên gia với hơn 8 năm kinh nghiệm trong lĩnh vực công nghệ. Đã giảng dạy cho hơn 25,000 học viên và tạo ra nhiều khóa học chất lượng cao.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  };

  // Component form đánh giá
  const CourseReviewForm: React.FC<{ courseId: string | number; onSuccess: () => void }> = ({ courseId, onSuccess }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isAuthenticated) {
        toast.error('Vui lòng đăng nhập để gửi đánh giá');
        return;
      }

      if (rating === 0) {
        toast.error('Vui lòng chọn số sao đánh giá');
        return;
      }

      setSubmitting(true);
      try {
        await courseService.addCourseReview(courseId, rating, comment.trim() || '');
        toast.success('Cảm ơn bạn đã đánh giá!');
        setRating(0);
        setComment('');
        await loadCourseReviews();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        console.error('Error submitting review:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể gửi đánh giá';
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h5 className="mb-3" style={{ color: '#1a4b8c' }}>Đánh giá của bạn</h5>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium">Số sao đánh giá *</label>
            <div className="d-flex align-items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="btn btn-link p-0 border-0"
                  style={{ 
                    fontSize: '2rem',
                    lineHeight: '1',
                    color: star <= (hoveredRating || rating) ? '#ffc107' : '#dee2e6',
                    transition: 'color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={submitting}
                >
                  ★
                </button>
              ))}
              {rating > 0 && (
                <span className="ms-2 text-muted small">
                  {rating === 1 && 'Rất không hài lòng'}
                  {rating === 2 && 'Không hài lòng'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 4 && 'Hài lòng'}
                  {rating === 5 && 'Rất hài lòng'}
                </span>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="review-comment" className="form-label fw-medium">
              Nhận xét của bạn
            </label>
            <textarea
              id="review-comment"
              className="form-control"
              rows={4}
              placeholder="Chia sẻ ý kiến của bạn về khóa học này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              maxLength={1000}
              style={{ resize: 'vertical' }}
            />
            <div className="form-text text-end">
              {comment.length}/1000 ký tự
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang gửi...
                </>
              ) : (
                'Gửi đánh giá'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return '';
      case 'document': return '';
      case 'quiz': return '';
      default: return '';
    }
  };

  const getTotalDuration = () => {
    return curriculum.reduce((total, module) => 
      total + module.lessons.reduce((modTotal, lesson) => 
        modTotal + parseInt(lesson.duration), 0), 0
    );
  };

  return (
    <>
      <style>{starRatingCSS}</style>
      <div className="container-fluid py-4">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a 
                href="#" 
                className="text-decoration-none" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  onBackToList(); 
                }}
              >
                Tài liệu ôn tập
              </a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {course.title}
            </li>
          </ol>
        </nav>

        <div className="row">
          <div className="col-lg-8">
            {/* Course Header */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="row g-0">
                <div className="col-md-5">
                  <ImageWithFallback
                    src={course.image}
                    alt={course.title}
                    className="img-fluid h-100"
                    style={{ objectFit: 'cover', borderRadius: '8px 0 0 8px' }}
                  />
                </div>
                <div className="col-md-7">
                  <div className="card-body h-100 d-flex flex-column">
                    <div>
                      <span className="badge bg-primary mb-2">{course.level}</span>
                      <h2 className="card-title mb-2">{course.title}</h2>
                      <p className="text-primary mb-2">{course.subtitle}</p>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="d-flex align-items-center">
                            <span className="text-warning me-1">★</span>
                            <span className="fw-bold me-2">{displayRating > 0 ? displayRating.toFixed(1) : 'N/A'}</span>
                            <small className="text-muted">({displayStudents > 0 ? displayStudents.toLocaleString() : 0} học viên)</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">
                            {courseLessons.length > 0 ? courseLessons.length : (course?.lessons || 0)} bài học • {displayDuration}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <ul className="nav nav-tabs card-header-tabs">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Tổng quan
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'curriculum' ? 'active' : ''}`}
                      onClick={() => setActiveTab('curriculum')}
                    >
                      Chương trình học
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'instructor' ? 'active' : ''}`}
                      onClick={() => setActiveTab('instructor')}
                    >
                      Giảng viên
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                      onClick={() => setActiveTab('reviews')}
                    >
                      Đánh giá
                    </button>
                  </li>
                </ul>
              </div>
              
              <div className="card-body">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    {course?.description ? (
                      <div>
                        <h5 className="mb-3">Mô tả khóa học</h5>
                        <div 
                          className="text-muted" 
                          style={{ 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: '1.8',
                            fontSize: '16px',
                            color: '#333'
                          }}
                        >
                          {course.description}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted">
                        <p>Khóa học này chưa có mô tả.</p>
                      </div>
                    )}

                    {/* Tính năng khóa học - chỉ hiển thị nếu có features */}
                    {course?.features && course.features.length > 0 && (
                      <>
                        <h5 className="mb-3 mt-4">Tính năng khóa học</h5>
                        <div className="row">
                          {course.features.map((feature: string, index: number) => (
                            <div key={index} className="col-md-6 col-lg-4 mb-2">
                              <span className="badge bg-light text-dark">
                                {feature}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Curriculum Tab */}
                {activeTab === 'curriculum' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Danh sách bài học</h5>
                      <div className="text-muted">
                        {loadingLessons ? 'Đang tải...' : `${courseLessons.length} bài học`}
                      </div>
                    </div>

                    {loadingLessons ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Đang tải...</span>
                        </div>
                      </div>
                    ) : courseLessons.length > 0 ? (
                      <div className="list-group">
                        {courseLessons.map((lesson, index) => {
                          const lessonType = lesson.type || 'video';
                          const lessonDuration = lesson.duration || '0:00';
                          const lessonTitle = lesson.title || `Bài học ${index + 1}`;
                          
                          return (
                            <div key={lesson.id || lesson.lessonId || index} className="list-group-item">
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  {lessonType === 'video' ? '▶️' : 
                                   lessonType === 'document' ? '📄' : 
                                   lessonType === 'quiz' ? '📝' : 
                                   lessonType === 'assignment' ? '📋' : '📎'}
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">{lessonTitle}</h6>
                                  <div className="d-flex align-items-center gap-3">
                                    <small className="text-muted">
                                      {lessonType === 'video' ? 'Video' : 
                                       lessonType === 'document' ? 'Tài liệu' : 
                                       lessonType === 'quiz' ? 'Quiz' : 
                                       lessonType === 'assignment' ? 'Bài tập' : 'Khác'}
                                    </small>
                                    {lessonDuration && (
                                      <small className="text-muted">• {lessonDuration}</small>
                                  )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted">
                        <p>Chưa có bài học nào cho khóa học này</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructor Tab */}
                {activeTab === 'instructor' && (
                  <div>
                    <div className="row">
                      <div className="col-md-4 text-center">
                        <ImageWithFallback
                          src={instructor.image}
                          alt={instructor.name}
                          className="rounded-circle mb-3"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        />
                        <h5>{instructor.name}</h5>
                        <p className="text-muted">{instructor.title}</p>
                      </div>
                      <div className="col-md-8">
                        <div className="row g-3 mb-4">
                          <div className="col-6">
                            <div className="text-center p-3 bg-light rounded">
                              <div className="fw-bold">{instructor.experience}</div>
                              <small className="text-muted">Kinh nghiệm</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-3 bg-light rounded">
                              <div className="fw-bold">{instructor.students}</div>
                              <small className="text-muted">Học viên</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-3 bg-light rounded">
                              <div className="fw-bold">{instructor.courses}</div>
                              <small className="text-muted">Khóa học</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="text-center p-3 bg-light rounded">
                              <div className="fw-bold text-warning">{instructor.rating}</div>
                              <small className="text-muted">Đánh giá</small>
                            </div>
                          </div>
                        </div>
                        <p>{instructor.bio}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div key={`reviews-${reviews.length}-${JSON.stringify(reviews.map(r => r.rating))}`}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Đánh giá học viên</h5>
                      {(() => {
                        console.log('🔍 Current reviews state:', reviews);
                        const validReviews = reviews.filter(r => r && typeof r.rating === 'number' && r.rating > 0);
                        const reviewCount = validReviews.length;
                        console.log('🔍 Valid reviews:', validReviews, 'Count:', reviewCount);
                        
                        if (reviewCount === 0) {
                          return (
                            <div className="d-flex align-items-center">
                              <span className="text-muted">Chưa có lượt đánh giá</span>
                            </div>
                          );
                        }
                        
                        const avgRating = validReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount;
                        const roundedRating = Math.round(avgRating * 10) / 10;
                        const fullStars = Math.floor(avgRating);
                        const hasHalfStar = (avgRating % 1) >= 0.5;
                        
                        console.log('🔍 Avg rating:', avgRating, 'Rounded:', roundedRating, 'Full stars:', fullStars, 'Has half:', hasHalfStar);
                        
                        return (
                          <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center me-2" style={{ fontSize: '18px', lineHeight: '1' }}>
                              {[1, 2, 3, 4, 5].map((star) => {
                                const shouldBeYellow = star <= fullStars || (star === fullStars + 1 && hasHalfStar);
                                const starColor = shouldBeYellow ? '#ffc107' : '#dee2e6';
                                
                                console.log(`⭐ Star ${star}: shouldBeYellow=${shouldBeYellow}, color=${starColor}, fullStars=${fullStars}`);
                                
                                return (
                                  <span
                                    key={`star-${star}-${fullStars}-${avgRating}`}
                                    style={{
                                      color: `${starColor} !important`,
                                      marginRight: '2px',
                                      display: 'inline-block',
                                      WebkitTextFillColor: `${starColor} !important`,
                                      WebkitTextStroke: '0px transparent',
                                      filter: shouldBeYellow ? 'none' : 'grayscale(100%)',
                                      opacity: shouldBeYellow ? 1 : 0.5,
                                      // Force override any CSS
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      padding: 0,
                                      margin: '0 2px 0 0',
                                      lineHeight: '1',
                                      fontSize: '18px'
                                    }}
                                    className={`star-rating-item star-${star} ${shouldBeYellow ? 'star-yellow' : 'star-gray'}`}
                                    data-star-index={star}
                                    data-rating={avgRating}
                                    data-full-stars={fullStars}
                                    data-should-be-yellow={shouldBeYellow}
                                  >
                                    ★
                                  </span>
                                );
                              })}
                            </div>
                            <span className="fw-bold me-2">
                              {roundedRating.toFixed(1)}
                            </span>
                            <span className="text-muted">({reviewCount} đánh giá)</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Form đánh giá - chỉ hiển thị nếu đã hoàn thành khóa học */}
                    {isAuthenticated && isEnrolled && isCourseCompleted && (
                      <CourseReviewForm 
                        courseId={course.id} 
                        onSuccess={() => {
                          // Reload reviews sau khi submit thành công
                          loadCourseReviews();
                        }} 
                      />
                    )}

                    {/* Thông báo nếu chưa hoàn thành khóa học */}
                    {isAuthenticated && !checkingEnrollment && isEnrolled && !isCourseCompleted && (
                      <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
                        <div className="text-center">
                          <p className="mb-0 text-muted">
                            Vui lòng hoàn thành khóa học để có thể đánh giá.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Thông báo nếu chưa đăng ký */}
                    {isAuthenticated && !checkingEnrollment && !isEnrolled && (
                      <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
                        <div className="text-center">
                          <p className="mb-0 text-muted">
                            Vui lòng đăng ký khóa học để có thể đánh giá.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Thông báo nếu chưa đăng nhập */}
                    {!isAuthenticated && (
                      <div className="mt-4 p-4 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                        <div className="text-center">
                          <p className="mb-0 text-muted">Vui lòng đăng nhập và đăng ký khóa học để có thể đánh giá.</p>
                        </div>
                      </div>
                    )}

                    {/* Danh sách đánh giá */}
                    <div className="mt-4">
                      {loadingReviews ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Đang tải...</span>
                          </div>
                        </div>
                      ) : reviews.length > 0 ? (
                        reviews.map((review, index) => {
                          const rating = review.rating || 0;
                          const formattedDate = review.date 
                            ? new Date(review.date).toLocaleDateString('vi-VN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'Vừa xong';
                          
                          return (
                            <div key={review.id || index} className="border-bottom pb-3 mb-3">
                              <div className="d-flex align-items-start">
                                <ImageWithFallback
                                  src={review.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                                  alt={review.name || 'Người dùng'}
                                  className="rounded-circle me-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                      <h6 className="mb-1">{review.name || 'Người dùng'}</h6>
                                      <div className="d-flex align-items-center">
                                        <div className="me-2" style={{ fontSize: '16px', lineHeight: '1' }}>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                              key={star}
                                              style={{
                                                color: star <= rating ? '#ffc107' : '#dee2e6',
                                                marginRight: '2px'
                                              }}
                                            >
                                              ★
                                            </span>
                                          ))}
                                        </div>
                                        <small className="text-muted">{formattedDate}</small>
                                      </div>
                                    </div>
                                  </div>
                                  {review.comment && (
                                    <p className="mb-0">{review.comment}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <p>Chưa có lượt đánh giá</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px', zIndex: 100 }}>
              <div className="card-body">
                <div className="text-center mb-4">
                  <h3 className={`mb-2 ${Number(course.price) > 0 ? 'text-primary' : 'text-success'}`}>
                    {Number(course.price) > 0 ? formatPrice(course.price) : 'Miễn phí'}
                  </h3>
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <span className="text-warning me-1">★</span>
                    <span className="fw-bold me-2">{displayRating > 0 ? displayRating.toFixed(1) : 'N/A'}</span>
                    <span className="text-muted">({displayStudents > 0 ? displayStudents.toLocaleString() : 0} học viên)</span>
                  </div>
                </div>

                <div className="d-grid gap-2 mb-4">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={handleRegister}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
                  </button>
                  {/* Chỉ hiển thị nút học thử khi khóa học có phí */}
                  {Number(course?.price) > 0 && (
                    <button 
                      className="btn btn-outline-primary"
                      onClick={handleStartLearning}
                    >
                      Học thử miễn phí
                    </button>
                  )}
                </div>

                <div className="border-top pt-4">
                  <h6 className="mb-3">Khóa học bao gồm:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <small>{courseLessons.length > 0 ? courseLessons.length : (course?.lessons || 0)} video bài giảng</small>
                    </li>
                    <li className="mb-2">
                      <small>Tài liệu học tập</small>
                    </li>
                    <li className="mb-2">
                      <small>Chứng chỉ hoàn thành</small>
                    </li>
                    <li className="mb-2">
                      <small>Truy cập vĩnh viễn</small>
                    </li>
                    <li className="mb-2">
                      <small>Học trên mobile</small>
                    </li>
                    <li className="mb-2">
                      <small>Hỗ trợ Q&A</small>
                    </li>
                  </ul>
                </div>

                <div className="border-top pt-4">
                  <h6 className="mb-3">Chia sẻ khóa học:</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm flex-fill">
                      Facebook
                    </button>
                    <button className="btn btn-outline-info btn-sm flex-fill">
                      Twitter
                    </button>
                    <button className="btn btn-outline-success btn-sm flex-fill">
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};