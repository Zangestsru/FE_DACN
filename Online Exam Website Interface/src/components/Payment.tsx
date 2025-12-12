import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePurchaseExam, useExamDetail, useCourseDetail, useAuth } from '../hooks';
import { examService } from '../services/exam.service';
import { paymentService } from '../services/payment.service';
import { courseService } from '../services/course.service';
import { toast } from 'sonner';

interface PaymentProps {
  onPaymentSuccess: (examId?: string, slug?: string, courseId?: string) => void;
  onCancel: () => void;
}

export const Payment: React.FC<PaymentProps> = ({ onPaymentSuccess, onCancel }) => {
  const { slug, examId } = useParams<{ slug: string; examId: string }>();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');

  // Determine if this is a course or exam payment
  const isCoursePayment = !!courseId;
  
  // Fetch exam details (if exam)
  const { data: exam, loading: examLoading } = useExamDetail(examId as string, !isCoursePayment);
  
  // Fetch course details (if course)
  const { data: course, loading: courseLoading } = useCourseDetail(courseId, isCoursePayment);
  
  // Purchase exam mutation
  const { mutate: purchaseExam, loading: purchasing } = usePurchaseExam();
  
  // ✅ Lấy thông tin user để tự động điền form
  const { user } = useAuth();

  // ✅ Tự động điền formData từ user khi component mount hoặc user thay đổi
  useEffect(() => {
    if (user && (!formData.fullName || !formData.email || !formData.phone)) {
      setFormData(prev => ({
        fullName: prev.fullName || user.fullName || user.username || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || '',
      }));
    }
  }, [user]);

  const isInfoComplete = formData.fullName && formData.email && formData.phone && formData.address;
  
  // Determine if free based on course or exam
  const isFree = isCoursePayment 
    ? (course && (!course.price || Number(course.price) === 0))
    : (exam && (!exam.price || Number(exam.price) === 0));
  
  const loading = isCoursePayment ? courseLoading : examLoading;
  const item = isCoursePayment ? course : exam;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('canceled')) {
      try {
        const oc = sessionStorage.getItem('payos_last_order_code');
        if (oc) {
          if (isCoursePayment) {
            courseService.cancelPayOSOrder(oc, 'User canceled');
          } else {
            examService.cancelPayOSOrder(oc, 'User canceled');
          }
        } else {
          // Fallback: tìm giao dịch pending mới nhất của user với PayOS và item hiện tại
          paymentService.getMyPayments(1, 20).then(async (res: any) => {
            try {
              const items = Array.isArray(res.items) ? res.items : [];
              if (isCoursePayment) {
                const courseIdNum = parseInt(String(courseId || '0'), 10);
                const match = items
                  .filter((t: any) => String(t.gateway ?? t.Gateway).toLowerCase().includes('payos'))
                  .filter((t: any) => String(t.status ?? t.Status).toLowerCase() === 'pending')
                  .find((t: any) => {
                    try {
                      const p = t.payload ?? t.Payload;
                      const obj = typeof p === 'string' ? JSON.parse(p) : p;
                      return Number(obj?.courseId) === courseIdNum;
                    } catch { return false; }
                  });
                const orderId = match?.orderId ?? match?.OrderId;
                if (orderId) {
                  await courseService.cancelPayOSOrder(orderId, 'User canceled');
                }
              } else {
                const examIdNum = parseInt(String(examId || '0'), 10);
                const match = items
                  .filter((t: any) => String(t.gateway ?? t.Gateway).toLowerCase().includes('payos'))
                  .filter((t: any) => String(t.status ?? t.Status).toLowerCase() === 'pending')
                  .find((t: any) => {
                    try {
                      const p = t.payload ?? t.Payload;
                      const obj = typeof p === 'string' ? JSON.parse(p) : p;
                      return Number(obj?.examId) === examIdNum;
                    } catch { return false; }
                  });
                const orderId = match?.orderId ?? match?.OrderId;
                if (orderId) {
                  await examService.cancelPayOSOrder(orderId, 'User canceled');
                }
              }
            } catch {}
          }).catch(() => {});
        }
      } catch {}
      setMessage('Thanh toán đã được hủy.');
    }
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setMessage('Thanh toán thành công. Cảm ơn bạn đã sử dụng PayOS!');
    }
  }, []);

  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (!e.reason) {
        e.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  const handlePayment = async () => {
    // Nếu miễn phí, chỉ cần thông tin và điều khoản
    if (isFree) {
      if (!isInfoComplete || !termsAccepted) {
        toast.error('Vui lòng điền đầy đủ thông tin và đồng ý với điều khoản');
        return;
      }
    } else {
      // Nếu có phí, cần đầy đủ thông tin, phương thức thanh toán và điều khoản
      if (!isInfoComplete || !paymentMethod || !termsAccepted) {
        toast.error('Vui lòng điền đầy đủ thông tin và chọn phương thức thanh toán');
        return;
      }
    }

    // Check if this is course payment
    if (isCoursePayment) {
      if (!courseId) {
        toast.error('Không tìm thấy thông tin khóa học');
        return;
      }
      
      setProcessing(true);
      try {
        console.log('💳 Processing payment for course:', courseId, isFree ? '(Free)' : '(Paid)');
        
        if (isFree) {
          // Với khóa học miễn phí, đăng ký trực tiếp
          console.log('✅ Free course - enrolling directly');
          try {
            await courseService.enrollCourse(parseInt(courseId));
            toast.success('Đăng ký khóa học thành công!');
            onPaymentSuccess(undefined, undefined, courseId);
          } catch (enrollError: any) {
            console.error('❌ Error enrolling course:', enrollError);
            if (enrollError.message?.includes('đã') || enrollError.message?.includes('already')) {
              toast.success('Đăng ký khóa học thành công!');
              onPaymentSuccess(undefined, undefined, courseId);
            } else {
              throw enrollError;
            }
          }
        } else {
          if (paymentMethod === 'bank') {
            try {
              // Lưu courseId vào sessionStorage để dùng sau khi thanh toán thành công
              try {
                if (courseId) sessionStorage.setItem('payos_course_id', courseId);
              } catch {}

              const ret = `${window.location.origin}/payment-success`;
              const cancel = `${window.location.origin}/study-payment?courseId=${courseId}&canceled=1`;
              const desc = course?.title ? `Thanh toán khóa học ${course.title}` : `Thanh toán khóa học ${courseId}`;
              const link = await courseService.createCoursePayOSLink(
                parseInt(courseId),
                desc,
                ret,
                cancel,
                {
                  name: formData.fullName,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                },
                [
                  {
                    name: course?.title || `Course ${courseId}`,
                    quantity: 1,
                    price: (course?.price as number) || 0,
                  },
                ]
              );
              const orderCode = link?.orderCode ?? link?.OrderCode;
              const checkout = link?.checkoutUrl || link?.CheckoutUrl;
              if (!checkout) throw new Error('Không nhận được checkoutUrl từ PayOS');
              try { sessionStorage.setItem('payos_last_order_code', String(orderCode || '')); } catch {}
              window.location.href = String(checkout);
              return;
            } catch (err: any) {
              throw err;
            }
          } else {
            toast.error('Phương thức thanh toán này chưa được hỗ trợ cho khóa học. Vui lòng chọn chuyển khoản ngân hàng.');
          }
        }
      } catch (error: any) {
        console.error('❌ Error processing course payment:', error);
        toast.error(error.message || 'Không thể xử lý thanh toán');
      } finally {
        setProcessing(false);
      }
      return;
    }
    
    // Exam payment logic
    if (!examId) {
      toast.error('Không tìm thấy thông tin bài thi');
      return;
    }

    setProcessing(true);
    try {
      console.log('💳 Processing payment for exam:', examId, isFree ? '(Free)' : '(Paid)');
      
      if (isFree) {
        // Với bài thi miễn phí, cần đăng ký để tạo enrollment
        console.log('✅ Free exam - registering to create enrollment');
        
        try {
          const result = await examService.registerExam(parseInt(examId));
          console.log('✅ Registration successful:', result);
          
          // ✅ Lưu thông tin cá nhân vào sessionStorage để truyền sang ExamStart
          try {
            const candidateInfo = {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
            };
            console.log('💾 Payment - Saving candidate info to sessionStorage:', candidateInfo);
            sessionStorage.setItem('exam_candidate_info', JSON.stringify(candidateInfo));
            console.log('✅ Payment - Candidate info saved successfully');
          } catch (e) {
            console.error('❌ Payment - Could not save candidate info to sessionStorage:', e);
          }
          
          toast.success('Đăng ký thành công!');
          onPaymentSuccess(examId, slug);
        } catch (registerError: any) {
          console.error('❌ Error registering free exam:', registerError);
          // Nếu lỗi là "đã đăng ký", vẫn cho phép tiếp tục
          if (registerError.message?.includes('đã') || registerError.message?.includes('already')) {
            console.log('⚠️ Already registered, proceeding...');
            
            // ✅ Lưu thông tin cá nhân vào sessionStorage để truyền sang ExamStart
            try {
              sessionStorage.setItem('exam_candidate_info', JSON.stringify({
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
              }));
            } catch (e) {
              console.warn('⚠️ Could not save candidate info to sessionStorage:', e);
            }
            
            toast.success('Đăng ký thành công!');
            onPaymentSuccess(examId, slug);
          } else {
            throw registerError;
          }
        }
      } else {
        if (paymentMethod === 'bank') {
          // Lưu examId và slug vào sessionStorage để dùng sau khi thanh toán thành công
          try {
            if (examId) sessionStorage.setItem('payos_exam_id', examId);
            if (slug) sessionStorage.setItem('payos_exam_slug', slug);
            // ✅ Lưu thông tin cá nhân vào sessionStorage để truyền sang ExamStart
            sessionStorage.setItem('exam_candidate_info', JSON.stringify({
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
            }));
          } catch {}
          
          // Return URL trỏ đến trang callback để xử lý và redirect đến exam-start
          const ret = `${window.location.origin}/payment-success`;
          const cancel = `${window.location.origin}/payment/${slug}/${examId}?canceled=1`;
          const desc = exam?.title ? `Thanh toán bài thi ${exam.title}` : `Thanh toán bài thi ${examId}`;
          const link = await examService.createExamPayOSLink(
            parseInt(examId),
            desc,
            ret,
            cancel,
            {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
            },
            [
              {
                name: exam?.title || `Exam ${examId}`,
                quantity: 1,
                price: (exam?.price as number) || 0,
              },
            ]
          );
          const orderCode = link?.orderCode ?? link?.OrderCode;
          const checkout = link?.checkoutUrl || link?.CheckoutUrl;
          if (!checkout) throw new Error('Không nhận được checkoutUrl từ PayOS');
          try { sessionStorage.setItem('payos_last_order_code', String(orderCode || '')); } catch {}
          window.location.href = String(checkout);
          return;
        }
        if (paymentMethod !== 'bank') {
          const result = await purchaseExam(parseInt(examId), {
            autoConfirm: true,
          });
          if (result?.EnrollmentStatus !== 'Active') {
          }
          
          // ✅ Lưu thông tin cá nhân vào sessionStorage để truyền sang ExamStart
          try {
            const candidateInfo = {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
            };
            console.log('💾 Payment - Saving candidate info to sessionStorage:', candidateInfo);
            sessionStorage.setItem('exam_candidate_info', JSON.stringify(candidateInfo));
            console.log('✅ Payment - Candidate info saved successfully');
          } catch (e) {
            console.error('❌ Payment - Could not save candidate info to sessionStorage:', e);
          }
          
          toast.success('Thanh toán thành công!');
          onPaymentSuccess(examId, slug);
        }
      }
    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      toast.error(error.message || 'Không thể xử lý thanh toán');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !item) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="payment-bg d-flex align-items-start justify-content-center">
        <div className="container px-3 px-md-4">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 col-12">
              <div className="payment-form-container mx-auto">
                <div className="text-center">
                  <div className="product">
                    <p className="mb-4">{message}</p>
                  </div>
                  <a href="/payment-history" className="btn btn-primary" id="create-payment-link-btn">Quay lại trang thanh toán</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

                    <>
                      <h5 className="fw-bold mb-3 text-dark">2. Phương thức thanh toán</h5>
                      <div className="row g-3 mb-5">
                        <div className="col-md-6">
                          <div
                            className={`card card-select ${paymentMethod === 'momo' ? 'active' : ''}`}
                            style={isFree ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                            onClick={() => {
                              if (isFree) {
                                toast.info(isCoursePayment ? 'Khóa học này không cần thanh toán' : 'Bài thi này không cần thanh toán');
                                return;
                              }
                              setPaymentMethod('momo');
                            }}
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
                        style={isFree ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : undefined}
                            onClick={() => {
                              setPaymentMethod('bank');
                            }}
                          >
                            <div className="card-body text-center py-4">
                              <i className="fas fa-university text-primary mb-2" style={{ fontSize: '28px' }}></i>
                              <div className="fw-semibold">Chuyển khoản</div>
                              <small className="text-muted">Ngân hàng nội địa</small>
                              
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                    
                    {isFree && (
                      <div className="alert alert-info mb-5">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Miễn phí:</strong> {isCoursePayment ? 'Khóa học' : 'Bài thi'} này hoàn toàn miễn phí. Bạn chỉ cần điền thông tin để đăng ký.
                      </div>
                    )}

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
                      disabled={
                        !isInfoComplete || 
                        (!isFree && !paymentMethod) || 
                        !termsAccepted || 
                        processing || 
                        purchasing
                      }
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
                      
                      {isCoursePayment ? (
                        <>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Thời lượng:</span>
                              <span className="fw-semibold">{course?.duration || 'N/A'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Cấp độ:</span>
                              <span className="fw-semibold">{course?.level || 'N/A'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Giáo viên:</span>
                              <span className="fw-semibold">{course?.instructor || 'N/A'}</span>
                            </div>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between mb-3">
                            <span className="text-muted">Học phí:</span>
                            <span className="fw-semibold">
                              {isFree ? (
                                <span className="text-success">Miễn phí</span>
                              ) : (
                                `${(course?.price || 0).toLocaleString('vi-VN')}đ`
                              )}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="fw-bold">Tổng cộng:</span>
                            <span className="text-primary fw-bold fs-4">
                              {isFree ? (
                                <span className="text-success">Miễn phí</span>
                              ) : (
                                `${(course?.price || 0).toLocaleString('vi-VN')}đ`
                              )}
                            </span>
                          </div>
                          <div className="bg-light text-center rounded-3 py-3 mt-3">
                            <div className="text-success fw-semibold">Truy cập vĩnh viễn</div>
                            <small className="text-muted">Học mọi lúc, mọi nơi</small>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Thời gian:</span>
                              <span className="fw-semibold">{exam?.duration}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Số câu:</span>
                              <span className="fw-semibold">{exam?.questions}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Điểm đạt:</span>
                              <span className="fw-semibold">
                                {(() => {
                                  // Calculate passingMark from passingScore percentage
                                  const passingMark = (exam as any)?.passingMark || 
                                    (exam?.passingScore && exam?.questions 
                                      ? Math.ceil((exam.passingScore / 100) * exam.questions) 
                                      : exam?.passingScore || 0);
                                  return `${passingMark} điểm`;
                                })()}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Lĩnh vực:</span>
                              <span className="fw-semibold">{exam?.category}</span>
                            </div>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between mb-3">
                            <span className="text-muted">Phí thi:</span>
                            <span className="fw-semibold">
                              {isFree ? (
                                <span className="text-success">Miễn phí</span>
                              ) : (
                                `${(exam?.price || 0).toLocaleString('vi-VN')}đ`
                              )}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="fw-bold">Tổng cộng:</span>
                            <span className="text-primary fw-bold fs-4">
                              {isFree ? (
                                <span className="text-success">Miễn phí</span>
                              ) : (
                                `${(exam?.price || 0).toLocaleString('vi-VN')}đ`
                              )}
                            </span>
                          </div>
                          <div className="bg-light text-center rounded-3 py-3 mt-3">
                            <div className="text-success fw-semibold">Miễn phí thi lại nếu không đạt</div>
                            <small className="text-muted">Có hiệu lực trong 30 ngày</small>
                          </div>
                        </>
                      )}
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
