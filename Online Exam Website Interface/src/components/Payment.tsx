import React, { useState } from 'react';

interface PaymentProps {
  exam: any;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const Payment: React.FC<PaymentProps> = ({ exam, onPaymentSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isInfoComplete = formData.fullName && formData.email && formData.phone && formData.address;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async () => {
    if (!isInfoComplete || !paymentMethod || !termsAccepted) {
      alert('Vui lòng điền đầy đủ thông tin và chọn phương thức thanh toán');
      return;
    }

    // Chuyển trang ngay lập tức
    onPaymentSuccess();
  };

  if (!exam) return null;

  return (
    <>
      <style>{`
        .payment-fullscreen-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
        }
        
        @media (max-width: 768px) {
          .payment-fullscreen-bg {
            padding-top: 4vh !important;
            padding-bottom: 4vh !important;
          }
          
          .payment-form-container {
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
      <div className="payment-fullscreen-bg d-flex align-items-start justify-content-center" style={{ paddingTop: '8vh', paddingBottom: '8vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-md-11 col-sm-12">
              <div className="mx-auto" style={{ maxWidth: '1000px' }}>
                <div className="bg-white rounded-3 shadow-lg border p-4 p-sm-5 payment-form-container" style={{ 
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  marginTop: '2rem',
                  marginBottom: '2rem'
                }}>


                  <div className="row g-5">
                    <div className="col-lg-8">
                      <div className="card shadow-lg payment-form-card h-100 border-0" style={{ borderRadius: '16px' }}>
                        <div className="card-body p-5">
                          <div className="mb-6 d-flex align-items-center gap-4 flex-wrap">
                            <button 
                              className="btn btn-outline-secondary btn-lg px-4 py-3 rounded-pill shadow-sm" 
                              onClick={onCancel}
                              style={{ transition: 'all 0.3s ease' }}
                            >
                              ← Quay lại
                            </button>
                            <div className="alert alert-info border-0 mb-0 rounded-pill px-4 py-2" style={{ backgroundColor: '#e3f2fd' }}>
                              <i className="fas fa-info-circle me-2"></i>Thanh toán an toàn với SSL
                            </div>
                          </div>

                          <div className="mb-5">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <div className={`rounded-circle d-flex align-items-center justify-content-center ${isInfoComplete ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>1</div>
                              <div className="text-dark fw-semibold me-2">Thông tin</div>
                              <div className="flex-grow-1 border-top" style={{ opacity: isInfoComplete ? 1 : 0.3 }}></div>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center ${paymentMethod ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>2</div>
                              <div className="text-dark fw-semibold me-2">Phương thức</div>
                              <div className="flex-grow-1 border-top" style={{ opacity: termsAccepted ? 1 : 0.3 }}></div>
                              <div className={`rounded-circle d-flex align-items-center justify-content-center ${termsAccepted ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>3</div>
                              <div className="text-dark fw-semibold">Xác nhận</div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="fw-bold mb-3" style={{ color: '#333' }}>1. Thông tin cá nhân</h5>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ color: '#555', fontSize: '0.9rem' }}>Họ và tên *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="fullName"
                                  value={formData.fullName}
                                  onChange={handleInputChange}
                                  placeholder="Nhập họ và tên"
                                  style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px 16px',
                                    fontSize: '0.95rem',
                                    backgroundColor: '#fafafa'
                                  }}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ color: '#555', fontSize: '0.9rem' }}>Email *</label>
                                <input
                                  type="email"
                                  className="form-control"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  placeholder="Nhập email"
                                  style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px 16px',
                                    fontSize: '0.95rem',
                                    backgroundColor: '#fafafa'
                                  }}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ color: '#555', fontSize: '0.9rem' }}>Số điện thoại *</label>
                                <input
                                  type="tel"
                                  className="form-control"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  placeholder="Nhập số điện thoại"
                                  style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px 16px',
                                    fontSize: '0.95rem',
                                    backgroundColor: '#fafafa'
                                  }}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-medium" style={{ color: '#555', fontSize: '0.9rem' }}>Địa chỉ *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="address"
                                  value={formData.address}
                                  onChange={handleInputChange}
                                  placeholder="Nhập địa chỉ"
                                  style={{
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    padding: '12px 16px',
                                    fontSize: '0.95rem',
                                    backgroundColor: '#fafafa'
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h5 className="fw-bold mb-3" style={{ color: '#333' }}>2. Phương thức thanh toán</h5>
                            <div className="row g-3">
                              <div className="col-md-6">
                                 <div 
                                   className={`card h-100 cursor-pointer ${paymentMethod === 'momo' ? 'border-primary bg-light' : 'border-light'}`}
                                   onClick={() => setPaymentMethod('momo')}
                                   style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                 >
                                   <div className="card-body text-center p-4">
                                     <div className="fw-bold text-dark fs-6">MoMo Wallet</div>
                                     <small className="text-muted">Thanh toán qua ví MoMo</small>
                                   </div>
                                 </div>
                               </div>
                              <div className="col-md-6">
                                <div 
                                  className={`card h-100 cursor-pointer ${paymentMethod === 'bank' ? 'border-primary bg-light' : 'border-light'}`}
                                  onClick={() => setPaymentMethod('bank')}
                                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                >
                                  <div className="card-body text-center p-4">
                                    <div className="mb-3">
                                      <i className="fas fa-university text-primary" style={{ fontSize: '40px' }}></i>
                                    </div>
                                    <div className="fw-bold text-dark fs-6">Chuyển khoản</div>
                                    <small className="text-muted">Chuyển khoản ngân hàng</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{
                                  borderRadius: '4px',
                                  border: '1px solid #ddd'
                                }}
                              />
                              <label className="form-check-label" htmlFor="terms" style={{ color: '#555', fontSize: '0.9rem' }}>
                                Tôi đồng ý với <a href="#" style={{ color: '#007bff' }}>điều khoản sử dụng</a> và <a href="#" style={{ color: '#007bff' }}>chính sách bảo mật</a>
                              </label>
                            </div>
                          </div>

                          <button
                            className="btn btn-primary btn-lg w-100 py-3 fw-bold"
                            onClick={handlePayment}
                            disabled={!isInfoComplete || !paymentMethod || !termsAccepted || processing}
                            style={{
                              backgroundColor: '#007bff',
                              borderColor: '#007bff',
                              borderRadius: '12px',
                              padding: '16px',
                              fontSize: '1.1rem',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {processing ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Đang xử lý...
                              </>
                            ) : (
                              'Thanh toán ngay'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-4">
                      <div className="card shadow-lg border-0 sticky-top" style={{ borderRadius: '16px', top: '20px' }}>
                        <div className="card-header bg-light border-0" style={{ borderRadius: '16px 16px 0 0' }}>
                          <h5 className="mb-0 fw-bold text-dark">Thông tin đơn hàng</h5>
                        </div>
                        <div className="card-body p-4">
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <div className="fw-bold text-dark">Chi tiết bài thi</div>
                              </div>
                            </div>
                            <div className="row g-3 text-sm">
                              <div className="col-6">
                                <div className="text-muted small">Thời gian:</div>
                                <div className="text-primary fw-bold">{exam.duration}</div>
                              </div>
                              <div className="col-6">
                                <div className="text-muted small">Số câu:</div>
                                <div className="text-primary fw-bold">{exam.questions}</div>
                              </div>
                              <div className="col-6">
                                <div className="text-muted small">Điểm đạt:</div>
                                <div className="text-primary fw-bold">{exam.passingScore}%</div>
                              </div>
                              <div className="col-6">
                                <div className="text-muted small">Lĩnh vực:</div>
                                <div className="text-primary fw-bold text-truncate" title={exam.category}>{exam.category}</div>
                              </div>
                            </div>
                          </div>

                          <hr className="my-4" />

                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted">Phí thi:</span>
                              <span className="fw-bold">{exam.price?.toLocaleString('vi-VN')}đ</span>
                            </div>

                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold text-dark fs-5">Tổng cộng:</span>
                              <span className="fw-bold text-primary fs-4">{exam.price?.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>

                          <div className="bg-light rounded-3 p-3 text-center">
                            <div className="text-success fw-bold mb-1">Ưu đãi đặc biệt</div>
                            <div className="fw-medium">Miễn phí thi lại nếu không đạt</div>
                            <small className="text-muted d-block mt-1">
                              Có hiệu lực trong 30 ngày
                            </small>
                          </div>
                        </div>
                      </div>
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