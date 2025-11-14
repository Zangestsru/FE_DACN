import React, { useEffect, useState } from 'react';
import { paymentService } from '@/services/payment.service';
import type { IPaymentInfo } from '@/types';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

function statusBadgeClass(status: IPaymentInfo['status']) {
  switch (status) {
    case 'success':
      return 'badge bg-success';
    case 'failed':
      return 'badge bg-danger';
    case 'pending':
      return 'badge bg-warning text-dark';
    case 'processing':
      return 'badge bg-info text-dark';
    case 'refunded':
      return 'badge bg-secondary';
    default:
      return 'badge bg-light text-dark';
  }
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<IPaymentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    paymentService.getPaymentHistory()
      .then((data) => {
        if (!mounted) return;
        setPayments(data);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError('Không thể tải lịch sử thanh toán.');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-3">Lịch sử thanh toán</h2>
      <p className="text-muted mb-4">Xem lại các giao dịch bạn đã thực hiện trên hệ thống.</p>

      <div className="card">
        <div className="card-body">
          {loading && (
            <div className="text-center py-5"><div className="spinner-border" role="status"/><div className="mt-2">Đang tải...</div></div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">{error}</div>
          )}
          {!loading && !error && payments.length === 0 && (
            <div className="text-center text-muted">Chưa có giao dịch nào.</div>
          )}
          {!loading && !error && payments.length > 0 && (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã giao dịch</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thời gian tạo</th>
                    <th>Thời gian thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{currency.format(p.amount)}</td>
                      <td className="text-uppercase">{p.method}</td>
                      <td><span className={statusBadgeClass(p.status)}>{p.status}</span></td>
                      <td>{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                      <td>{p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '-'}</td>
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