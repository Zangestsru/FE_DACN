import React, { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface StudyDetailProps {
  course: any;
  onBackToList: () => void;
  onRegister: () => void;
  onStartLearning: () => void;
}

export const StudyDetail: React.FC<StudyDetailProps> = ({ 
  course, 
  onBackToList, 
  onRegister,
  onStartLearning 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!course) return null;

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

  const reviews = [
    {
      name: 'Nguyễn Văn A',
      rating: 5,
      date: '2 tuần trước',
      comment: 'Khóa học rất hay và chi tiết. Giảng viên giải thích rất dễ hiểu.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
    },
    {
      name: 'Trần Thị B',
      rating: 5,
      date: '1 tháng trước',
      comment: 'Nội dung cập nhật, phù hợp với thực tế công việc.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b7f2?w=50&h=50&fit=crop&crop=face'
    }
  ];

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
    <div className="container-fluid py-4">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <button className="btn btn-link p-0" onClick={onBackToList}>
                Tài liệu ôn tập
              </button>
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
                      <p className="card-text text-muted mb-3">{course.description}</p>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="row g-3">
                        <div className="col-6">
                          <div className="d-flex align-items-center">
                            <span className="text-warning me-1">★</span>
                            <span className="fw-bold me-2">{course.rating}</span>
                            <small className="text-muted">({course.students.toLocaleString()} học viên)</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">
                            {course.lessons} bài học • {course.duration}
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
                    <h5 className="mb-3">Bạn sẽ học được gì?</h5>
                    <div className="row">
                      <div className="col-md-6">
                        <ul className="list-unstyled">
                          <li className="mb-2">Nắm vững kiến thức cơ bản đến nâng cao</li>
                          <li className="mb-2">Thực hành với các dự án thực tế</li>
                          <li className="mb-2">Áp dụng best practices trong nghề</li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <ul className="list-unstyled">
                          <li className="mb-2">Xây dựng portfolio chuyên nghiệp</li>
                          <li className="mb-2">Được hỗ trợ tìm việc làm</li>
                          <li className="mb-2">Cập nhật xu hướng mới nhất</li>
                        </ul>
                      </div>
                    </div>

                    <h5 className="mb-3 mt-4">Yêu cầu</h5>
                    <ul className="list-unstyled">
                      <li className="mb-2">• Có kiến thức cơ bản về máy tính</li>
                      <li className="mb-2">• Đam mê học hỏi và khám phá</li>
                      <li className="mb-2">• Máy tính có kết nối internet</li>
                    </ul>

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
                  </div>
                )}

                {/* Curriculum Tab */}
                {activeTab === 'curriculum' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Chương trình học</h5>
                      <div className="text-muted">
                        {curriculum.reduce((total, module) => total + module.lessons.length, 0)} bài học • 
                        {getTotalDuration()} phút
                      </div>
                    </div>

                    <div className="accordion" id="curriculumAccordion">
                      {curriculum.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="accordion-item border-0 mb-3">
                          <div className="accordion-header">
                            <button 
                              className="accordion-button bg-light"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#module-${moduleIndex}`}
                            >
                              <div>
                                <h6 className="mb-1">{module.module}</h6>
                                <small className="text-muted">
                                  {module.lessons.length} bài học • 
                                  {module.lessons.reduce((total, lesson) => total + parseInt(lesson.duration), 0)} phút
                                </small>
                              </div>
                            </button>
                          </div>
                          <div 
                            id={`module-${moduleIndex}`}
                            className="accordion-collapse collapse show"
                          >
                            <div className="accordion-body pt-0">
                              {module.lessons.map((lesson, lessonIndex) => (
                                <div key={lessonIndex} className="d-flex align-items-center py-2 border-bottom">
                                  <div className="flex-grow-1">
                                    <div className="fw-medium">{lesson.title}</div>
                                    <small className="text-muted">{lesson.duration}</small>
                                  </div>
                                  <button className="btn btn-sm btn-outline-primary">
                                    Xem trước
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0">Đánh giá học viên</h5>
                      <div className="d-flex align-items-center">
                        <span className="text-warning me-1">★</span>
                        <span className="fw-bold me-2">{course.rating}</span>
                        <span className="text-muted">({course.students.toLocaleString()} đánh giá)</span>
                      </div>
                    </div>

                    {reviews.map((review, index) => (
                      <div key={index} className="border-bottom pb-3 mb-3">
                        <div className="d-flex align-items-start">
                          <ImageWithFallback
                            src={review.avatar}
                            alt={review.name}
                            className="rounded-circle me-3"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">{review.name}</h6>
                                <div className="d-flex align-items-center">
                                  <div className="text-warning me-2">
                                    {'★'.repeat(review.rating)}
                                  </div>
                                  <small className="text-muted">{review.date}</small>
                                </div>
                              </div>
                            </div>
                            <p className="mb-0">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <h3 className="text-primary mb-2">{formatPrice(course.price)}</h3>
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <span className="text-warning me-1">★</span>
                    <span className="fw-bold me-2">{course.rating}</span>
                    <span className="text-muted">({course.students.toLocaleString()} học viên)</span>
                  </div>
                </div>

                <div className="d-grid gap-2 mb-4">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={onRegister}
                  >
                    Đăng ký khóa học
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={onStartLearning}
                  >
                    Học thử miễn phí
                  </button>
                </div>

                <div className="border-top pt-4">
                  <h6 className="mb-3">Khóa học bao gồm:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <small>{course.lessons} video bài giảng</small>
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
  );
};