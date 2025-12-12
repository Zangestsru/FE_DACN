import React, { useState } from 'react';
import { ICourse } from '@/types';
import { useCourses } from '@/hooks';
import { CourseCardWithStats } from './CourseCardWithStats';

interface StudyMaterialsProps {
  onCourseSelect: (course: ICourse) => void;
}

export const StudyMaterials: React.FC<StudyMaterialsProps> = ({ onCourseSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sử dụng hook để lấy courses (không cần selectedCategory nữa)
  const { data: coursesData, loading, error } = useCourses();

  const studyMaterials = coursesData?.data || [];

  // Local filtering theo searchTerm
  const filteredMaterials = searchTerm.trim()
    ? studyMaterials.filter(course => {
      const search = searchTerm.toLowerCase().trim();
      const title = (course.title || '').toLowerCase();
      const description = (course.description || '').toLowerCase();
      const instructor = ((course as any).instructor || (course as any).teacherName || '').toLowerCase();
      const category = (course.category || '').toLowerCase();

      return title.includes(search)
        || description.includes(search)
        || instructor.includes(search)
        || category.includes(search);
    })
    : studyMaterials;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container-fluid" style={{
      minHeight: '100vh'
    }}>
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '80px' }}>




        {/* Search Bar */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="flex-grow-1 position-relative">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Tìm kiếm khóa học theo tên, giảng viên, chủ đề..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        borderRadius: '12px',
                        border: '2px solid #e9ecef',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-link position-absolute top-50 translate-middle-y p-0"
                        style={{ right: '16px', color: '#6c757d', textDecoration: 'none' }}
                        onClick={() => setSearchTerm('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="text-muted small">
                    {filteredMaterials.length} khóa học
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-white" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3 text-white">Đang tải khóa học...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error instanceof Error ? error.message : String(error)}
          </div>
        )}

        {/* Courses Grid */}
        {!loading && !error && (
          <div className="row">
            {filteredMaterials.map(material => (
              <CourseCardWithStats
                key={material.id}
                course={material}
                onSelect={onCourseSelect}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMaterials.length === 0 && (
          <div className="text-center text-white py-5">
            <div className="mb-4">
              <i className="bi bi-inbox" style={{ fontSize: '4rem' }}></i>
            </div>
            <h4>Không tìm thấy khóa học phù hợp</h4>
            <p>Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
          </div>
        )}
      </div>


    </div>
  );
};