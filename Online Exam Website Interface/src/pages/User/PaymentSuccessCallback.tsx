import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { examService } from '@/services/exam.service';
import { courseService } from '@/services/course.service';
import { paymentService } from '@/services/payment.service';
import { userService } from '@/services/user.service';
import { toast } from 'sonner';

const PaymentSuccessCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        // Lấy orderCode từ query params
        const orderCode = searchParams.get('orderCode') || searchParams.get('OrderCode');
        const status = searchParams.get('status') || searchParams.get('Status');

        if (!orderCode) {
          setError('Không tìm thấy mã đơn hàng');
          setChecking(false);
          return;
        }

        // Kiểm tra nếu bị hủy
        if (status && status.toUpperCase() === 'CANCELLED') {
          navigate('/payment-history');
          return;
        }

        const savedCourseIdSession = sessionStorage.getItem('payos_course_id');
        const isCourse = !!savedCourseIdSession;
        const teacherPendingJson = sessionStorage.getItem('teacher_role_upgrade_pending');
        let orderInfo: any;
        if (teacherPendingJson) {
          orderInfo = await paymentService.getPayOSOrder(orderCode);
        } else {
          orderInfo = isCourse
            ? await courseService.getPayOSOrder(orderCode)
            : await examService.getPayOSOrder(orderCode);
        }
        const paymentStatus = orderInfo?.status || orderInfo?.Status;
        const amountPaid = orderInfo?.amountPaid ?? orderInfo?.AmountPaid;
        const amount = orderInfo?.amount ?? orderInfo?.Amount;
        const st = String(paymentStatus || '').toUpperCase();
        const isPaid = st === 'PAID' || st === 'SUCCESS' || (amountPaid != null && amount != null && Number(amountPaid) >= Number(amount));

        if (!isPaid) {
          // Nếu chưa thanh toán, chuyển về payment-history
          toast.warning('Thanh toán chưa hoàn tất. Vui lòng kiểm tra lại.');
          navigate('/payment-history');
          return;
        }

        // Lấy examId/courseId từ sessionStorage (đã lưu trước khi redirect đến PayOS)
        let savedExamId = sessionStorage.getItem('payos_exam_id');
        let savedSlug = sessionStorage.getItem('payos_exam_slug');
        let savedCourseId = savedCourseIdSession;

        // Nếu không có trong sessionStorage, thử lấy từ payment transaction
        if (isCourse ? !savedCourseId : !savedExamId) {
          // Lấy thông tin payment từ API để tìm examId
          const { paymentService } = await import('@/services/payment.service');
          const paymentData = await paymentService.getMyPayments(1, 50);
          const items = Array.isArray(paymentData.items) ? paymentData.items : [];
          const payment = items.find((p: any) => {
            const pOrderId = p.orderId ?? p.OrderId;
            return pOrderId === orderCode || pOrderId === String(orderCode);
          });
          
          if (payment) {
            // Thử parse payload để lấy examId
            try {
              const payload = payment.payload ?? payment.Payload;
              if (payload) {
                const payloadObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
                if (payloadObj?.examId) {
                  savedExamId = String(payloadObj.examId);
                  if (payloadObj.examTitle) {
                    savedSlug = String(payloadObj.examTitle)
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, '')
                      .trim()
                      .replace(/\s+/g, '-');
                  } else {
                    savedSlug = 'exam';
                  }
                } else if (payloadObj?.courseId) {
                  savedCourseId = String(payloadObj.courseId);
                }
              }
            } catch (e) {
              console.error('Error parsing payment payload:', e);
            }
          }
        }

        if (teacherPendingJson) {
          try {
            const pending = JSON.parse(teacherPendingJson);
            const submitPayload: any = { ...pending, PaymentStatus: 'paid' };
            const resp = await userService.requestTeacherRole(submitPayload);
            toast.success(resp?.message || 'Đã gửi yêu cầu nâng cấp giáo viên thành công');
          } catch (e: any) {
            toast.error(e?.message || 'Không thể gửi yêu cầu nâng cấp giáo viên');
          } finally {
            try {
              sessionStorage.removeItem('teacher_role_upgrade_pending');
              sessionStorage.removeItem('payos_teacher_role');
            } catch {}
          }
        }
        try {
          sessionStorage.removeItem('payos_exam_id');
          sessionStorage.removeItem('payos_exam_slug');
          sessionStorage.removeItem('payos_course_id');
          sessionStorage.removeItem('payos_last_order_code');
        } catch {}

        if (!isCourse && savedExamId && savedSlug) {
          toast.success('Thanh toán thành công! Bạn có thể bắt đầu làm bài thi.');
          navigate(`/exam-start/${savedSlug}/${savedExamId}`);
          return;
        }

        if (isCourse && savedCourseId) {
          toast.success('Thanh toán thành công! Khóa học đã được kích hoạt.');
          navigate(`/study-lesson/${savedCourseId}`);
          return;
        }

        toast.success('Thanh toán thành công!');
        navigate('/payment-history');
      } catch (e: any) {
        console.error('Error handling payment callback:', e);
        setError(e.message || 'Có lỗi xảy ra khi xử lý thanh toán');
        // Vẫn chuyển về payment-history để user có thể kiểm tra
        setTimeout(() => {
          navigate('/payment-history');
        }, 3000);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [searchParams, navigate]);

  if (checking) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang xử lý...</span>
          </div>
          <p className="mt-3">Đang xử lý thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Lỗi xử lý thanh toán</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            <a href="/payment-history" className="btn btn-primary">
              Xem lịch sử thanh toán
            </a>
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccessCallback;
