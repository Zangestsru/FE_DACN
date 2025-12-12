import React, { useEffect, useState } from 'react';
import { paymentService } from '@/services/payment.service';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/useAuth';
import type { IPaymentInfo } from '@/types';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function statusBadgeClass(status: IPaymentInfo['status']) {
  switch (status) {
    case 'success':
      return 'bg-success bg-opacity-10 text-success';
    case 'failed':
      return 'bg-danger bg-opacity-10 text-danger';
    case 'pending':
      return 'bg-warning bg-opacity-10 text-warning';
    case 'processing':
      return 'bg-info bg-opacity-10 text-info';
    case 'refunded':
      return 'bg-secondary bg-opacity-10 text-secondary';
    case 'cancelled':
      return 'bg-secondary bg-opacity-10 text-secondary';
    default:
      return 'bg-light text-dark';
  }
}

function statusText(status: IPaymentInfo['status']) {
    switch (status) {
      case 'success': return 'Thành công';
      case 'failed': return 'Thất bại';
      case 'pending': return 'Đang chờ';
      case 'processing': return 'Đang xử lý';
      case 'refunded': return 'Đã hoàn tiền';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<IPaymentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const { user, isAuthenticated } = useAuth();

  const isAdmin = isAuthenticated && (user?.role === 'admin' || (user as any)?.roleId === 1);
  const isTeacher = isAuthenticated && (user?.role === 'instructor' || (user as any)?.roleId === 2);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status') || params.get('Status');
        const orderCode = params.get('orderCode') || params.get('OrderCode');
        if (orderCode && status && status.toUpperCase() === 'CANCELLED') {
          try { await examService.cancelPayOSOrder(orderCode, 'User canceled'); } catch {}
        }
        const data = await paymentService.getPaymentHistory();
        if (!mounted) return;
        setPayments(data);
        
        const pendingPayOSPayments = data.filter((p) => p.status === 'pending' && p.orderId);
        if (pendingPayOSPayments.length > 0) {
          const checkPromises = pendingPayOSPayments.map(async (payment) => {
            if (!payment.orderId) return;
            try { await examService.getPayOSOrder(payment.orderId); } catch (e) { console.error(e); }
          });
          await Promise.allSettled(checkPromises);
          if (mounted) {
            const updatedData = await paymentService.getPaymentHistory();
            setPayments(updatedData);
          }
        }
      } catch (e) {
        if (!mounted) return;
        setError('Không thể tải lịch sử thanh toán.');
      } finally {
        mounted && setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleRefreshStatus = async () => {
    setCheckingStatus(true);
    try {
      const data = await paymentService.getPaymentHistory();
      const pendingPayOSPayments = data.filter((p) => p.status === 'pending' && p.orderId);
      if (pendingPayOSPayments.length > 0) {
        const checkPromises = pendingPayOSPayments.map(async (payment) => {
          if (!payment.orderId) return;
          try { await examService.getPayOSOrder(payment.orderId); } catch (e) { console.error(e); }
        });
        await Promise.allSettled(checkPromises);
      }
      const updatedData = await paymentService.getPaymentHistory();
      setPayments(updatedData);
    } catch (e) {
      setError('Không thể kiểm tra trạng thái thanh toán.');
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: '1200px' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-5 animate__animated animate__fadeInDown">
        <div>
          <h2 className="fw-bold mb-2 text-dark">Lịch sử giao dịch</h2>
          <p className="text-muted mb-0">Theo dõi chi tiêu và trạng thái thanh toán của bạn</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button 
            className="btn btn-outline-primary rounded-pill px-4"
            onClick={handleRefreshStatus}
            disabled={checkingStatus || loading}
          >
            {checkingStatus ? <span className="spinner-border spinner-border-sm me-2"/> : <i className="fas fa-sync-alt me-2"></i>}
            {checkingStatus ? 'Đang kiểm tra...' : 'Cập nhật trạng thái'}
          </button>
           {(isAdmin || isTeacher) && (
            <button 
              className="btn btn-primary rounded-pill px-4"
              onClick={() => window.location.href = isAdmin ? '/admin/payments' : '/teacher/payments'}
            >
              <i className="fas fa-cog me-2"></i>Quản lý
            </button>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm animate__animated animate__fadeInUp" style={{ borderRadius: '15px', overflow: 'hidden' }}>
        <div className="card-body p-0">
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary"/></div>}
          {error && <div className="alert alert-danger m-4">{error}</div>}
          {!loading && !error && payments.length === 0 && (
             <div className="text-center py-5">
                <div className="mb-3 text-muted opacity-50"><i className="fas fa-receipt fa-3x"></i></div>
                <h5>Chưa có giao dịch nào</h5>
             </div>
          )}
          {!loading && !error && payments.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 ps-4 border-0 text-muted small fw-bold text-uppercase">Mã giao dịch</th>
                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Số tiền</th>
                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Phương thức</th>
                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Trạng thái</th>
                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Ngày tạo</th>
                    <th className="py-3 pe-4 border-0 text-muted small fw-bold text-uppercase text-end">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ cursor: 'pointer' }}>
                      <td className="ps-4 py-3 fw-medium text-dark">#{p.id}</td>
                      <td className="py-3 fw-bold text-dark">{currency.format(p.amount)}</td>
                      <td className="py-3"><span className="badge bg-light text-dark border">{p.method}</span></td>
                      <td className="py-3">
                        <span className={`badge rounded-pill px-3 py-2 ${statusBadgeClass(p.status)}`}>
                            {statusText(p.status)}
                        </span>
                      </td>
                      <td className="py-3 text-muted small">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="pe-4 py-3 text-end">
                        <button className="btn btn-sm btn-light rounded-circle" title="Xem chi tiết">
                            <i className="fas fa-chevron-right text-muted"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
