import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ExamCards from './ExamCards';

interface HomePageProps {
  onCertificationClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onCertificationClick }) => {
  // Danh sách các môn học đã được di chuyển sang component ExamCards
  
  // Bảng xếp hạng
  const leaderboard = [
    { name: 'Nguyễn Văn A', score: 98, subject: 'Toán học' },
    { name: 'Trần Thị B', score: 96, subject: 'Tiếng Anh' },
    { name: 'Lê Văn C', score: 94, subject: 'Vật lý' },
    { name: 'Phạm Thị D', score: 92, subject: 'Hóa học' },
    { name: 'Hoàng Văn E', score: 90, subject: 'Sinh học' }
  ];

  const features = [
    {
      title: 'Thống kê chi tiết',
      description: 'Phân tích kết quả học tập một cách chi tiết và trực quan'
    },
    {
      title: 'Đề thi đa dạng',
      description: 'Hàng nghìn câu hỏi được cập nhật liên tục từ các nguồn uy tín'
    },
    {
      title: 'Thi mọi lúc mọi nơi',
      description: 'Hệ thống hỗ trợ đa nền tảng, học tập mọi lúc mọi nơi'
    },
    {
      title: 'Kết quả chuẩn xác',
      description: 'Chấm điểm tự động với độ chính xác cao và báo cáo chi tiết'
    }
  ];

  const testimonials = [
    {
      name: 'Nguyễn Minh Anh',
      role: 'Học sinh lớp 12',
      content: 'Hệ thống rất tiện lợi, giúp mình ôn tập hiệu quả cho kỳ thi THPT.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=64&h=64&fit=crop&crop=face'
    },
    {
      name: 'Trần Đức Bình',
      role: 'Sinh viên IT',
      content: 'Câu hỏi chất lượng cao, giao diện thân thiện. Rất hài lòng!',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
    },
    {
      name: 'Lê Thị Cường',
      role: 'Nhân viên văn phòng',
      content: 'Luyện thi chứng chỉ tiếng Anh trở nên dễ dàng hơn nhiều.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face'
    }
  ];

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section hero-gradient position-relative">
        <div className="container-fluid py-5">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <div className="hero-content text-white">
                <h1 className="display-4 fw-bold mb-4">
                  Luyện thi trắc nghiệm online – Nhanh chóng, chính xác, tiện lợi
                </h1>
                <p className="lead mb-4 opacity-90">
                  Ngân hàng câu hỏi đa dạng, chấm điểm tức thì, thống kê chi tiết kết quả học tập. 
                  Nâng cao kiến thức và kỹ năng làm bài thi một cách hiệu quả nhất.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <button className="btn btn-primary btn-lg px-4 py-3">
                    Bắt đầu làm bài
                  </button>
                  <button className="btn btn-outline-light btn-lg px-4 py-3">
                    Xem đề thi mẫu
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758612215020-842383aadb9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMHN0dWRlbnRzJTIwbGFwdG9wfGVufDF8fHx8MTc1OTIxNDk5N3ww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Online Learning"
                  className="img-fluid rounded-3 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Đề thi nổi bật */}
      <ExamCards />

      {/* Features Section */}
      <section className="features-section py-5 bg-light">
        <div className="container-fluid">
          <div className="text-center mb-5">
            <h2 className="h1 mb-3">Tính năng nổi bật</h2>
            <p className="lead text-muted">Những tính năng giúp việc học tập trở nên hiệu quả hơn</p>
          </div>
          <div className="row">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-3 col-md-6 mb-4">
                <div className="feature-card text-center p-4">
                  <div className="feature-icon mb-3">
                    <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle" 
                         style={{ width: '60px', height: '60px' }}>
                      <span className="h4 mb-0">{index + 1}</span>
                    </div>
                  </div>
                  <h5 className="mb-3">{feature.title}</h5>
                  <p className="text-muted">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard & Testimonials */}
      <section className="leaderboard-section py-5 bg-white">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-6 mb-5">
              <div className="text-center mb-4">
                <h3 className="mb-3">Bảng xếp hạng tuần</h3>
                <p className="text-muted">Top học viên xuất sắc nhất tuần này</p>
              </div>
              <div className="leaderboard-list">
                {leaderboard.map((user, index) => (
                  <div key={index} className="d-flex align-items-center p-3 mb-3 bg-light rounded">
                    <div className="rank-badge me-3">
                      <span className={`badge ${index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : index === 2 ? 'bg-danger' : 'bg-primary'} rounded-pill`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{user.name}</h6>
                      <small className="text-muted">{user.subject}</small>
                    </div>
                    <div className="score">
                      <span className="h5 text-primary mb-0">{user.score}đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-lg-6 mb-5">
              <div className="text-center mb-4">
                <h3 className="mb-3">Phản hồi học viên</h3>
                <p className="text-muted">Những chia sẻ từ cộng đồng học tập</p>
              </div>
              <div className="testimonials">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="testimonial-card p-4 mb-4 bg-light rounded">
                    <p className="mb-3 fst-italic">"{testimonial.content}"</p>
                    <div className="d-flex align-items-center">
                      <ImageWithFallback
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="rounded-circle me-3"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div>
                        <h6 className="mb-0">{testimonial.name}</h6>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section hero-gradient text-white py-5">
        <div className="container-fluid">
          <div className="text-center">
            <h2 className="display-5 fw-bold mb-4">
              Sẵn sàng kiểm tra trình độ của bạn? Vào thi ngay hôm nay!
            </h2>
            <p className="lead mb-4 opacity-90">
              Tham gia cùng hàng nghìn học viên đã tin tưởng và đạt được kết quả xuất sắc
            </p>
            <button 
              className="btn btn-light btn-lg px-5 py-3"
              onClick={onCertificationClick}
            >
              Thi Ngay
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};