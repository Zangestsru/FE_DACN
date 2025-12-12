import React, { useState, useEffect, useMemo } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ICourse } from '@/types';
import { courseService } from '@/services/course.service';

interface CourseCardWithStatsProps {
  course: ICourse;
  onSelect: (course: ICourse) => void;
  formatPrice: (price: number) => string;
}

export const CourseCardWithStats: React.FC<CourseCardWithStatsProps> = ({ 
  course, 
  onSelect, 
  formatPrice 
}) => {
  const [stats, setStats] = useState<{
    lessons: number;
    duration: string;
    rating: number;
    students: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ✅ Fetch stats when component mounts (lazy load)
  useEffect(() => {
    if (!course.id) return;

    // Only fetch if course doesn't have real data
    const needsFetch = !course.lessons || course.lessons === 0 || 
                      !course.duration || course.duration === 'N/A' ||
                      !course.rating || course.rating === 0 ||
                      !course.students || course.students === 0;

    if (!needsFetch) {
      // Use course data directly
      setStats({
        lessons: course.lessons || 0,
        duration: course.duration || 'N/A',
        rating: course.rating || 0,
        students: course.students || 0,
      });
      return;
    }

    // Fetch stats
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [lessons, reviews] = await Promise.all([
          courseService.getCourseLessons(course.id!).catch(() => []),
          courseService.getCourseReviews(course.id!).catch(() => []),
        ]);

        // Calculate rating from reviews
        const validReviews = (reviews || []).filter((r: any) => r && typeof r.rating === 'number' && r.rating > 0);
        const reviewCount = validReviews.length;
        const actualRating = reviewCount > 0 
          ? validReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount 
          : 0;
        const roundedRating = actualRating > 0 ? Math.round(actualRating * 10) / 10 : 0;

        // Calculate duration from lessons
        let totalSeconds = 0;
        (lessons || []).forEach((lesson: any) => {
          const duration = lesson.duration || '0:00';
          const parts = duration.split(':').map(Number);
          if (parts.length === 2) {
            totalSeconds += parts[0] * 60 + parts[1];
          } else if (parts.length === 3) {
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        });

        let displayDuration = 'N/A';
        if (totalSeconds > 0) {
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          if (hours > 0) {
            displayDuration = `${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ''}`;
          } else {
            displayDuration = `${minutes} phút`;
          }
        }

        setStats({
          lessons: (lessons || []).length,
          duration: displayDuration,
          rating: roundedRating,
          students: reviewCount, // Use review count as proxy for students
        });
      } catch (error) {
        console.error('Error fetching course stats:', error);
        // Use course defaults
        setStats({
          lessons: course.lessons || 0,
          duration: course.duration || 'N/A',
          rating: course.rating || 0,
          students: course.students || 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    // Debounce to avoid too many simultaneous requests
    const timer = setTimeout(fetchStats, 100);
    return () => clearTimeout(timer);
  }, [course.id, course.lessons, course.duration, course.rating, course.students]);

  // Use stats if available, otherwise use course data
  const displayLessons = stats?.lessons ?? (course.lessons || 0);
  const displayDuration = stats?.duration ?? (course.duration || 'N/A');
  const displayRating = stats?.rating ?? (course.rating || 0);
  const displayStudents = stats?.students ?? (course.students || 0);

  return (
    <div className="col-lg-4 col-md-6 mb-4">
      <div className="card h-100 border-0 shadow-sm study-card">
        <div className="position-relative">
          <ImageWithFallback
            src={course.image}
            alt={course.title}
            className="card-img-top"
            style={{ height: '220px', objectFit: 'cover' }}
          />
          <div className="position-absolute top-0 end-0 m-3">
            <span className="badge bg-primary px-3 py-2 rounded-pill">
              {course.level}
            </span>
          </div>
          <div className="position-absolute bottom-0 start-0 m-3">
            <div className="d-flex align-items-center text-white">
              <div className="bg-dark bg-opacity-75 px-2 py-1 rounded">
                <small>
                  {loadingStats ? '...' : `${displayLessons} bài học • ${displayDuration}`}
                </small>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body p-4">
          <h5 className="card-title mb-2">{course.title}</h5>
          <p className="text-primary small mb-2">{course.subtitle}</p>
          <p className="card-text text-muted small mb-3">{course.description}</p>
          
          <div className="d-flex align-items-center mb-3">
            <div className="me-3">
              <div className="d-flex align-items-center">
                <span className="text-warning me-1">★</span>
                <span className="small fw-bold">
                  {loadingStats ? '...' : (displayRating > 0 ? displayRating.toFixed(1) : 'N/A')}
                </span>
              </div>
            </div>
            <div className="text-muted small">
              {loadingStats ? '...' : (displayStudents > 0 ? displayStudents.toLocaleString() : 0)} học viên
            </div>
          </div>

          <div className="mb-3">
            <small className="text-muted">Giảng viên: {course.instructor}</small>
          </div>

          <div className="d-flex flex-wrap gap-1 mb-3">
            {course.features?.slice(0, 3).map((feature, index) => (
              <span key={index} className="badge bg-light text-dark small">
                {feature}
              </span>
            ))}
            {course.features && course.features.length > 3 && (
              <span className="badge bg-light text-dark small">
                +{course.features.length - 3} khác
              </span>
            )}
          </div>
        </div>
        
        <div className="card-footer bg-white border-0 p-4 pt-0">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0 text-primary">{formatPrice(course.price || 0)}</h5>
            </div>
          </div>
          
          <button 
            className="btn btn-primary w-100 rounded-pill study-btn"
            onClick={() => onSelect(course)}
          >
            Xem chi tiết khóa học
          </button>
        </div>
      </div>
    </div>
  );
};

