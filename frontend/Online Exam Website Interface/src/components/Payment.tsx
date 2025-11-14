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

    onPaymentSuccess();
  };

  if (!exam) return null;

  return (
    <>
      <style>{`
        .payment-bg {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding-top: 6vh;
          padding-bottom: 6vh;
        }

        .payment-form-container {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
          padding: 2.5rem;
        }

        @media (max-width: 768px) {
          .payment-form-container {
            padding: 1.5rem;
            border-radius: 12px;
          }
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-select {
          transition: all 0.3s ease;
          border: 2px solid transparent;
          cursor: pointer;
        }

        .card-select:hover {
          border-color: #cfe2ff;
          background-color: #f8f9fa;
        }

        .card-select.active {
          border-color: #007bff;
          background-color: #f0f8ff;
        }

        .order-summary {
          border-radius: 20px;
          box-shadow: 0 6px 28px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
          padding: 2rem;
          position: sticky;
          top: 30px;
          transition: all 0.3s ease;
        }

        .order-summary h5 {
          font-size: 1.25rem;
        }

        .order-summary .fs-5 {
          font-size: 1.3rem;
        }

        .order-summary .fs-4 {
          font-size: 1.6rem;
        }

      `}</style>

      <div className="payment-bg d-flex align-items-start justify-content-center">
        <div className="container px-3 px-md-4">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-md-11 col-12">
              <div className="payment-form-container mx-auto">

                <div className="row g-4 g-lg-5">
                  {/* LEFT FORM */}
                  <div className="col-lg-8 col-12">
                    <div className="mb-4 d-flex align-items-center gap-3 flex-wrap">
                      <button
                        className="btn btn-outline-secondary rounded-pill px-4 py-2"
                        onClick={onCancel}
                      >
                        ← Quay lại
                      </button>
                      <div className="badge bg-light text-dark rounded-pill px-3 py-2 shadow-sm">
                        <i className="fas fa-lock me-2 text-success"></i>
                        Thanh toán an toàn
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="mb-5 d-flex align-items-center gap-3 flex-wrap">
                      <div className={`step-circle ${isInfoComplete ? 'bg-primary text-white' : 'bg-light text-muted'}`}>1</div>
                      <span className="fw-semibold text-dark small">Thông tin</span>
                      <div className="flex-grow-1 border-top d-none d-md-block" style={{opacity: isInfoComplete ? 1 : 0.3}}></div>
                      <div className={`step-circle ${paymentMethod ? 'bg-primary text-white' : 'bg-light text-muted'}`}>2</div>
                      <span className="fw-semibold text-dark small">Phương thức</span>
                      <div className="flex-grow-1 border-top d-none d-md-block" style={{opacity: termsAccepted ? 1 : 0.3}}></div>
                      <div className={`step-circle ${termsAccepted ? 'bg-primary text-white' : 'bg-light text-muted'}`}>3</div>
                      <span className="fw-semibold text-dark small">Xác nhận</span>
                    </div>

                    {/* Personal Info */}
                    <h5 className="fw-bold mb-3 text-dark">1. Thông tin cá nhân</h5>
                    <div className="row g-3 mb-5">
                      {['fullName','email','phone','address'].map((field, i) => (
                        <div key={i} className="col-md-6 col-12">
                          <label className="form-label text-muted small">
                            {field === 'fullName' ? 'Họ và tên *' :
                              field === 'email' ? 'Email *' :
                              field === 'phone' ? 'Số điện thoại *' :
                              'Địa chỉ *'}
                          </label>
                          <input
                            type={field === 'email' ? 'email' : 'text'}
                            className="form-control py-2"
                            name={field}
                            value={(formData as any)[field]}
                            onChange={handleInputChange}
                            placeholder={
                              field === 'fullName' ? 'Nhập họ và tên' :
                              field === 'email' ? 'Nhập email' :
                              field === 'phone' ? 'Nhập số điện thoại' :
                              'Nhập địa chỉ'
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* Payment Method */}
                    <h5 className="fw-bold mb-3 text-dark">2. Phương thức thanh toán</h5>
                    <div className="row g-3 mb-5">
                      <div className="col-md-6">
                        <div
                          className={`card card-select ${paymentMethod === 'momo' ? 'active' : ''}`}
                          onClick={() => setPaymentMethod('momo')}
                        >
                          <div className="card-body text-center py-4">
                            <div className="fw-semibold">Ví MoMo</div>
                            <small className="text-muted">Thanh toán nhanh chóng</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div
                          className={`card card-select ${paymentMethod === 'bank' ? 'active' : ''}`}
                          onClick={() => setPaymentMethod('bank')}
                        >
                          <div className="card-body text-center py-4">
                            <i className="fas fa-university text-primary mb-2" style={{ fontSize: '28px' }}></i>
                            <div className="fw-semibold">Chuyển khoản</div>
                            <small className="text-muted">Ngân hàng nội địa</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="form-check mb-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <label className="form-check-label small text-muted" htmlFor="terms">
                        Tôi đồng ý với <a href="#">điều khoản</a> và <a href="#">chính sách bảo mật</a>
                      </label>
                    </div>

                    <button
                      className="btn btn-primary w-100 py-3 fw-bold rounded-3"
                      disabled={!isInfoComplete || !paymentMethod || !termsAccepted || processing}
                      onClick={handlePayment}
                    >
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Đang xử lý...
                        </>
                      ) : (
                        'Thanh toán ngay'
                      )}
                    </button>
                  </div>

                  {/* RIGHT ORDER SUMMARY */}
                  <div className="col-lg-4 col-12">
                    <div className="order-summary bg-white">
                      <h5 className="fw-bold text-dark mb-4">Thông tin đơn hàng</h5>
                      
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Thời gian:</span>
                          <span className="fw-semibold">{exam.duration}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Số câu:</span>
                          <span className="fw-semibold">{exam.questions}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Điểm đạt:</span>
                          <span className="fw-semibold">{exam.passingScore}%</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Lĩnh vực:</span>
                          <span className="fw-semibold">{exam.category}</span>
                        </div>
                      </div>

                      <hr />

                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Phí thi:</span>
                        <span className="fw-semibold">{exam.price?.toLocaleString('vi-VN')}đ</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="fw-bold">Tổng cộng:</span>
                        <span className="text-primary fw-bold fs-4">{exam.price?.toLocaleString('vi-VN')}đ</span>
                      </div>

                      <div className="bg-light text-center rounded-3 py-3 mt-3">
                        <div className="text-success fw-semibold">Miễn phí thi lại nếu không đạt</div>
                        <small className="text-muted">Có hiệu lực trong 30 ngày</small>
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
