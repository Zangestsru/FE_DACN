import React, { useEffect, useState } from 'react';
import { paymentService } from '@/services/payment.service';
import type { IPaymentInfo } from '@/types';
import { useNavigate } from 'react-router-dom';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const PurchasedExams: React.FC = () => {
  const [items, setItems] = useState<IPaymentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    paymentService.getPaymentHistory()
      .then((data) => {
        if (!mounted) return;
        // Tạm thời: coi các payment success là bài thi đã mua
        setItems(data.filter((p) => p.status === 'success'));
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError('Không thể tải danh sách đã mua.');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container py-5" style={{ maxWidth: '1200px' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 animate__animated animate__fadeInDown">
        <div>
          <h2 className="fw-bold mb-2 text-dark">Thư viện của tôi</h2>
          <p className="text-muted mb-0">Các bài thi và khóa học bạn đã sở hữu</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button className="btn btn-primary rounded-pill px-4 shadow-sm" onClick={() => navigate('/')}>
            <i className="fas fa-search me-2"></i>Tìm thêm bài thi
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải dữ liệu...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger rounded-3 shadow-sm d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-triangle me-3 fs-4"></i>
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-5 animate__animated animate__fadeIn">
          <div className="mb-4">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
              <i className="fas fa-shopping-bag fa-3x text-muted opacity-50"></i>
            </div>
          </div>
          <h4 className="text-dark fw-bold">Chưa có bài thi nào</h4>
          <p className="text-muted">Bạn chưa mua bài thi nào. Hãy khám phá kho bài thi của chúng tôi!</p>
          <button className="btn btn-primary rounded-pill px-4 mt-2" onClick={() => navigate('/')}>
            Khám phá ngay
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="row g-4 animate__animated animate__fadeInUp">
          {items.map((item) => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div 
                className="card h-100 border-0 shadow-sm hover-card"
                style={{ borderRadius: '15px', overflow: 'hidden', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
                }}
              >
                <div className="card-header bg-white border-0 pt-4 px-4 pb-0">
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success px-3 py-2 fw-bold">
                      Đã sở hữu
                    </span>
                    <small className="text-muted">
                      {item.paidAt ? new Date(item.paidAt).toLocaleDateString('vi-VN') : new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </small>
                  </div>
                </div>
                <div className="card-body px-4 py-3">
                  <h5 className="card-title fw-bold mb-2 text-dark" style={{ fontSize: '1.2rem' }}>
                    Bài thi #{item.id}
                  </h5>
                  <p className="text-muted small mb-3">
                    <i className="fas fa-receipt me-2"></i>Mã giao dịch: {item.id}
                  </p>
                  <div className="d-flex align-items-center mb-3">
                    <div className="me-3">
                      <div className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="fas fa-tag text-primary"></i>
                      </div>
                    </div>
                    <div>
                      <div className="small text-muted">Giá trị</div>
                      <div className="fw-bold text-dark">{currency.format(item.amount)}</div>
                    </div>
                  </div>
                  <div className="alert alert-light border-0 small text-muted mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    Tên bài thi sẽ được cập nhật sớm.
                  </div>
                </div>
                <div className="card-footer bg-white border-0 p-4 pt-0">
                  <button className="btn btn-primary w-100 rounded-pill py-2 fw-medium shadow-sm">
                    <i className="fas fa-play me-2"></i>Vào làm bài
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchasedExams;
