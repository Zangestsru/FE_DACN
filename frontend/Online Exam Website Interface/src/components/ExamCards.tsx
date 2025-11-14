import React from 'react';
import { IExam } from '@/types';
import { useExams } from '@/hooks';

interface ExamCardProps {
  title: string;
  subject: string;
  time: number;
  questionCount: number;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  image: string;
}

const ExamCard: React.FC<ExamCardProps> = ({ title, subject, time, questionCount, difficulty, image }) => {
  const getDifficultyColor = () => {
    switch(difficulty) {
      case 'Dễ': return 'bg-success';
      case 'Trung bình': return 'bg-warning';
      case 'Khó': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-4">
      <div className="card h-100 shadow-sm border-0">
        <div className="position-relative">
          <img 
            src={image} 
            className="card-img-top" 
            alt={title}
            style={{ height: '120px', objectFit: 'cover' }}
          />
          <span className={`position-absolute top-0 end-0 m-2 badge ${getDifficultyColor()}`}>
            {difficulty}
          </span>
        </div>
        <div className="card-body p-3">
          <h6 className="card-title fw-bold text-truncate mb-2" title={title}>{title}</h6>
          <p className="card-text small text-muted mb-2">
            <i className="bi bi-book me-1"></i> {subject}
          </p>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-1">
            <span className="badge bg-light text-dark small">
              <i className="bi bi-clock me-1"></i> {time} phút
            </span>
            <span className="badge bg-light text-dark small">
              {questionCount} câu
            </span>
          </div>
        </div>
        <div className="card-footer bg-white border-0 pt-0 p-3">
          <button className="btn btn-primary btn-sm w-100">
            Đăng Ký Ngay
          </button>
        </div>
      </div>
    </div>
  );
};

const ExamCards: React.FC = () => {
  // Sử dụng hook để lấy danh sách exams
  const { data: examsData, loading, error } = useExams({ limit: 8 });
  const exams = examsData?.data || [];

  // Map data từ API sang format cũ để tương thích với ExamCard component
  const mappedExams = exams.map(exam => ({
    title: exam.title,
    subject: exam.category || 'Chung',
    time: parseInt(exam.duration) || 60,
    questionCount: exam.questions || 0,
    difficulty: (exam.difficulty === 'Cơ bản' ? 'Dễ' : exam.difficulty === 'Trung bình' ? 'Trung bình' : 'Khó') as 'Dễ' | 'Trung bình' | 'Khó',
    image: exam.image || '/images/background.png'
  }));

  return (
    <section className="py-4 bg-light">
      <div className="container-fluid px-3 px-md-4">
        <h4 className="mb-4 fw-bold text-center text-md-start">Đề thi nổi bật</h4>
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Exams Grid */}
        {!loading && !error && (
          <div className="row">
            {mappedExams.map((exam, index) => (
              <ExamCard key={index} {...exam} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && mappedExams.length === 0 && (
          <div className="text-center py-5">
            <p className="text-muted">Không có đề thi nào</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExamCards;
