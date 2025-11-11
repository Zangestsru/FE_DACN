import React, { useEffect, useState } from 'react';
import { paymentService } from '@/services/payment.service';
import type { IPaymentInfo } from '@/types';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const PurchasedExams: React.FC = () => {
  const [items, setItems] = useState<IPaymentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="container py-4">
      <h2 className="mb-3">Bài thi đã mua</h2>
      <p className="text-muted mb-4">Danh sách bài thi bạn đã thanh toán thành công. Khi API thật sẵn sàng, hệ thống sẽ hiển thị tên bài thi tương ứng.</p>

      {loading && (
        <div className="text-center py-5"><div className="spinner-border" role="status"/><div className="mt-2">Đang tải...</div></div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="card"><div className="card-body text-center text-muted">Chưa có bài thi nào được mua.</div></div>
      )}

      <div className="row">
        {items.map((item) => (
          <div className="col-md-6 col-lg-4" key={item.id}>
            <div className="card mb-3 h-100">
              <div className="card-body">
                <h5 className="card-title">Bài thi đã mua</h5>
                <p className="card-text text-muted mb-2">Mã giao dịch: {item.id}</p>
                <ul className="list-unstyled mb-3">
                  <li><strong>Số tiền:</strong> {currency.format(item.amount)}</li>
                  <li><strong>Phương thức:</strong> <span className="text-uppercase">{item.method}</span></li>
                  <li><strong>Ngày thanh toán:</strong> {item.paidAt ? new Date(item.paidAt).toLocaleString('vi-VN') : new Date(item.createdAt).toLocaleString('vi-VN')}</li>
                </ul>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" disabled>
                    Bắt đầu thi
                  </button>
                  <button className="btn btn-outline-secondary" disabled>
                    Xem chi tiết
                  </button>
                </div>
                <div className="mt-3 text-muted small">
                  Lưu ý: Chưa liên kết được tên bài thi từ lịch sử thanh toán mock. Sẽ cập nhật khi BE trả về examId và tên bài thi.
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchasedExams;