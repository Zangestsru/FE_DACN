import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
// import { uploadEvidenceImage } from '@/services/upload.service'; // This service doesn't exist
import { paymentService } from '@/services/payment.service';
import { userService } from '@/services/user.service';
import { apiService } from '@/services/api.service';

// Utility for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Internal helper for uploading image (until upload.service is created/restored)
const uploadEvidenceImage = async (file: File): Promise<string> => {
  try {
    // Using user avatar upload endpoint as a temporary solution or generic upload if available
    const result = await apiService.upload<{ avatarUrl?: string; url?: string }>(
      '/Users/upload-avatar', 
      file
    );
    return result.avatarUrl || result.url || '';
  } catch (error: any) {
    console.error('Error uploading evidence:', error);
    throw new Error('Upload failed: ' + (error.message || 'Unknown error'));
  }
};

const RequestTeacherRole: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    realName: '',
    cccdOrTeacherCard: '',
    evidenceImageUrl: '',
    reason: '',
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const TEACHER_ROLE_PRICE: number = 50000;

  useEffect(() => {
    if (user) {
      setRequestFormData(prev => ({
        ...prev,
        realName: prev.realName || user?.fullName || '',
      }));
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequestTeacherRole = async () => {
    if (!requestFormData.realName.trim()) { toast.error('Vui lòng nhập tên thật'); return; }
    if (!requestFormData.reason.trim()) { toast.error('Vui lòng nhập lý do'); return; }
    if (!evidenceFile) { toast.error('Vui lòng tải lên ảnh minh chứng'); return; }
    if (!termsAccepted) { toast.error('Vui lòng đồng ý với điều khoản'); return; }

    try {
      setIsSubmittingRequest(true);
      let evidenceImageUrl = '';
      if (evidenceFile) {
        try {
          evidenceImageUrl = await uploadEvidenceImage(evidenceFile);
          setRequestFormData(prev => ({ ...prev, evidenceImageUrl }));
        } catch (uploadError: any) {
          toast.error(uploadError.message || 'Không thể upload ảnh.');
          return;
        }
      }

      const pendingData: any = {
        FullName: requestFormData.realName.trim(),
        BankName: 'N/A - Test Mode',
        BankAccountName: 'N/A - Test Mode',
        BankAccountNumber: 'N/A - Test Mode',
        EvidenceImageUrl: evidenceImageUrl || undefined,
        Reason: requestFormData.reason.trim() || undefined,
        PaymentAmount: TEACHER_ROLE_PRICE,
        PaymentMethod: 'PayOS',
      };

      try {
        sessionStorage.setItem('teacher_role_upgrade_pending', JSON.stringify(pendingData));
        sessionStorage.setItem('payos_teacher_role', '1');
      } catch {}

      try {
        const returnUrl = `${window.location.origin}/payment-success`;
        const cancelUrl = `${window.location.origin}/request-teacher-role?canceled=1`;
        const description = 'Nâng cấp giảng viên';
        let checkoutResponse: any;
        try {
            checkoutResponse = await paymentService.createPayOSPaymentLink({
                description,
                amount: TEACHER_ROLE_PRICE,
                returnUrl,
                cancelUrl,
                bookingInfo: { type: 'teacher_role_upgrade', userId: user?.id, fullName: requestFormData.realName },
            });
        } catch (e) {
            checkoutResponse = await paymentService.createFoodDrinkPayOSLink({
                description,
                amount: TEACHER_ROLE_PRICE,
                orderCode: Date.now(),
                returnUrl,
                cancelUrl,
                bookingInfo: { type: 'teacher_role_upgrade', userId: user?.id, fullName: requestFormData.realName },
            });
        }

        const data = (checkoutResponse as any)?.data?.data || (checkoutResponse as any)?.data || checkoutResponse;
        const checkoutUrl = data?.checkoutUrl ?? data?.CheckoutUrl;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          paymentService.redirectToPayOS(data);
        }
      } catch (payErr: any) {
        toast.error(payErr?.message || 'Không thể tạo liên kết thanh toán');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi xử lý yêu cầu.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"/></div>;

  return (
    <div className="container py-5" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5 animate__animated animate__fadeInDown">
        <h2 className="fw-bold mb-3 text-dark">Đăng ký trở thành Giảng viên</h2>
        <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
          Chia sẻ kiến thức của bạn, tạo bài thi và kiếm thu nhập từ cộng đồng học tập của chúng tôi.
        </p>
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
            <div className="card-body p-4 p-md-5">
              <h5 className="fw-bold mb-4">Thông tin đăng ký</h5>
              
              <div className="mb-4">
                <label className="form-label fw-medium text-muted small text-uppercase">Họ và tên thật</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="fas fa-user text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0 py-2"
                    placeholder="Nhập họ và tên đầy đủ..."
                    value={requestFormData.realName}
                    onChange={e => setRequestFormData({ ...requestFormData, realName: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium text-muted small text-uppercase">Lý do đăng ký</label>
                <textarea
                  className="form-control bg-light py-2"
                  rows={4}
                  placeholder="Tại sao bạn muốn trở thành giảng viên? Kinh nghiệm của bạn là gì?"
                  value={requestFormData.reason}
                  onChange={e => setRequestFormData({ ...requestFormData, reason: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium text-muted small text-uppercase">Minh chứng (Thẻ GV / CCCD / Bằng cấp)</label>
                <div 
                  className="border-2 border-dashed rounded-3 p-4 text-center" 
                  style={{ 
                    borderColor: '#e0e0e0', 
                    cursor: 'pointer',
                    backgroundColor: '#fafafa' 
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {evidencePreview ? (
                    <div className="position-relative d-inline-block">
                      <img src={evidencePreview} alt="Preview" className="img-fluid rounded shadow-sm" style={{ maxHeight: '200px' }} />
                      <button 
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEvidencePreview('');
                          setEvidenceFile(null);
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="py-3">
                      <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3 opacity-50"></i>
                      <p className="text-muted mb-0">Nhấn để tải lên ảnh minh chứng</p>
                      <small className="text-muted opacity-75">(JPG, PNG, max 5MB)</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="termsCheck"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="termsCheck">
                  Tôi cam kết các thông tin trên là chính xác và đồng ý với <a href="#" className="text-primary text-decoration-none">Điều khoản & Chính sách</a> của nền tảng.
                </label>
              </div>

              <button
                className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm"
                onClick={handleSubmitRequestTeacherRole}
                disabled={isSubmittingRequest}
              >
                {isSubmittingRequest ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Thanh toán & Gửi yêu cầu <i className="fas fa-arrow-right ms-2"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm sticky-top" style={{ top: '2rem', borderRadius: '15px' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Chi phí đăng ký</h5>
              
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Phí xét duyệt</span>
                <span className="fw-bold">{formatCurrency(TEACHER_ROLE_PRICE)}</span>
              </div>
              
              <hr className="my-3 text-muted opacity-25" />
              
              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold text-dark h5 mb-0">Tổng cộng</span>
                <span className="fw-bold text-primary h4 mb-0">{formatCurrency(TEACHER_ROLE_PRICE)}</span>
              </div>

              <div className="alert alert-light border-0 small mb-0 rounded-3">
                <div className="d-flex mb-2">
                  <i className="fas fa-shield-alt text-success mt-1 me-2"></i>
                  <div>Bảo mật thanh toán 100% qua PayOS</div>
                </div>
                <div className="d-flex">
                  <i className="fas fa-clock text-warning mt-1 me-2"></i>
                  <div>Thời gian xét duyệt: 1-3 ngày làm việc</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTeacherRole;
