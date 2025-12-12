import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '@/services/course.service';
import type { ICourse, ICourseProgress } from '@/types';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

interface CourseWithProgress extends ICourse {
  progress?: ICourseProgress;
  isFree?: boolean;
}

const EnrolledCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    const loadCoursesWithProgress = async () => {
      try {
        // Fetch enrolled courses
        const data = await courseService.getMyCourses();
        if (!mounted) return;

        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          data.map(async (course) => {
            try {
              const progress = await courseService.getCourseProgress(course.id);
              return { ...course, progress };
            } catch {
              return { ...course, progress: undefined };
            }
          })
        );

        setCourses(coursesWithProgress);
      } catch (e) {
        console.error('Error loading enrolled courses:', e);
        if (!mounted) return;
        setError('Không thể tải danh sách khóa học đã đăng ký.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCoursesWithProgress();

    return () => { mounted = false; };
  }, []);

  const handleContinueLearning = async (course: CourseWithProgress) => {
    const lastLessonId = course.progress?.currentLesson;

    if (lastLessonId && lastLessonId > 0) {
      // Navigate directly to the last lesson
      navigate(`/study-lesson/${course.id}?lesson=${lastLessonId}`);
    } else {
      // No progress yet, start from beginning
      navigate(`/study-lesson/${course.id}`);
    }
  };

  const handleViewCourse = (courseId: number | string) => {
    navigate(`/study-detail/${courseId}`);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Khóa học đã đăng ký</h2>
      <p className="text-muted mb-4">
        Danh sách các khóa học bạn đã đăng ký. Bạn có thể tiếp tục học tập hoặc xem lại nội dung khóa học.
      </p>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
          <div className="mt-2">Đang tải...</div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="card">
          <div className="card-body text-center text-muted py-5">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3 opacity-50">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <p className="mb-0">Bạn chưa đăng ký khóa học nào.</p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate('/study-materials')}
            >
              Khám phá khóa học
            </button>
          </div>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="row">
          {courses.map((course) => {
            const progressPercent = course.progress?.progressPercentage || 0;
            const isCompleted = course.isCompleted || progressPercent >= 100;

            return (
              <div className="col-md-6 col-lg-4 mb-4" key={course.id}>
                <div className="card h-100 shadow-sm">
                  {course.image && (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={course.image}
                        alt={course.title}
                        className="card-img-top"
                        style={{ height: '200px', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/background.png';
                        }}
                      />
                      {/* Progress overlay */}
                      {progressPercent > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.7)',
                            padding: '8px 12px',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center text-white mb-1">
                            <small>Tiến độ</small>
                            <small className="fw-bold">{progressPercent}%</small>
                          </div>
                          <div className="progress" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                              role="progressbar"
                              style={{ width: `${progressPercent}%` }}
                              aria-valuenow={progressPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{course.title}</h5>
                    {course.subtitle && (
                      <p className="text-muted small mb-2">{course.subtitle}</p>
                    )}
                    {course.description && (
                      <p className="card-text text-muted small flex-grow-1">
                        {course.description.length > 100
                          ? `${course.description.substring(0, 100)}...`
                          : course.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          {course.isFree ? (
                            <span className="badge bg-success">Miễn phí</span>
                          ) : (
                            <span className="text-primary fw-bold">
                              {currency.format(course.price || 0)}
                            </span>
                          )}
                        </div>
                        {isCompleted && (
                          <span className="badge bg-primary">
                            <i className="bi bi-check-circle me-1"></i>
                            Đã hoàn thành
                          </span>
                        )}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className={`btn ${isCompleted ? 'btn-outline-primary' : 'btn-primary'} flex-grow-1`}
                          onClick={() => handleContinueLearning(course)}
                        >
                          {isCompleted ? (
                            <>
                              <i className="bi bi-arrow-repeat me-1"></i>
                              Xem lại
                            </>
                          ) : (
                            <>
                              <i className="bi bi-play-fill me-1"></i>
                              Tiếp tục học
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleViewCourse(course.id)}
                          title="Xem chi tiết khóa học"
                        >
                          <i className="bi bi-info-circle"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;
