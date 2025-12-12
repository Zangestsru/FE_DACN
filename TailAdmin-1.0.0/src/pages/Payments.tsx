import { useEffect, useState } from 'react';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../components/ui/table";
import Button from "../components/ui/button/Button";
import { EyeIcon, PlusIcon } from "../icons";
import { Modal } from "../components/ui/modal";
import { paymentsService, type PaymentItem } from '../services/payments.service';
import { usersService, type User } from '../services/users.service';
import { examsService, type ExamListItemDto } from '../services/exams.service';

export default function Payments() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [gateway, setGateway] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selected, setSelected] = useState<PaymentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [buyerQuery, setBuyerQuery] = useState('');
  const [buyerOptions, setBuyerOptions] = useState<User[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<User | null>(null);
  const [examQuery, setExamQuery] = useState('');
  const [examOptions, setExamOptions] = useState<ExamListItemDto[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamListItemDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ checkoutUrl: string; qrCode: string; orderCode: number } | null>(null);
  const defaultUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/payments` : 'http://localhost:4000/admin/payments';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsService.getPayments({ page, pageSize, status: status || undefined, gateway: gateway || undefined, search: search || undefined });
      setItems(res.data);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e?.message || 'Không thể tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, pageSize]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (buyerQuery.trim()) {
          const res = await usersService.getUsers({ page: 1, pageSize: 10, search: buyerQuery.trim() });
          setBuyerOptions(res.users);
        } else {
          setBuyerOptions([]);
        }
      } catch { void 0; }
    }, 300);
    return () => clearTimeout(t);
  }, [buyerQuery]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await examsService.getExams({ pageIndex: 1, pageSize: 20 });
        const items = res.items || [];
        const filtered = examQuery.trim() ? items.filter(e => (e.title || '').toLowerCase().includes(examQuery.trim().toLowerCase())) : items;
        setExamOptions(filtered);
      } catch { void 0; }
    }, 300);
    return () => clearTimeout(t);
  }, [examQuery]);

  return (
    <div>
      <PageMeta title="Quản lý thanh toán" description="Xem trạng thái thanh toán, bài thi, giá tiền, người mua" />
      <PageBreadcrumb pageTitle="Quản Lý Thanh Toán" />

      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <Button size="sm" variant="outline" onClick={load} className="mt-2">Thử lại</Button>
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo OrderId, email, tên"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <select
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
          >
            <option value="">Tất cả cổng</option>
            <option value="PayOS">PayOS</option>
            <option value="BankTransfer">BankTransfer</option>
          </select>
          <div className="flex items-center gap-2">
            <Button onClick={() => { setPage(1); load(); }}>Lọc</Button>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus(''); setGateway(''); setPage(1); load(); }}>Xóa lọc</Button>
            <Button variant="primary" onClick={() => { setIsCreateOpen(true); setCreatedLink(null); }} startIcon={<PlusIcon className="h-4 w-4" />}>Tạo link PayOS</Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OrderId</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài thi</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người mua</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cổng</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tạo lúc</TableCell>
                <TableCell isHeader className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thanh toán lúc</TableCell>
                <TableCell isHeader className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-gray-500">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-12 text-center text-gray-500">Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                items.map(it => (
                  <TableRow key={it.transactionId} className="border-t border-gray-100 dark:border-gray-800">
                    <TableCell className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 dark:text-white">{it.orderId}</div>
                        <div className="text-xs text-gray-500">ID: {it.transactionId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-600 dark:text-gray-300">{it.status}</TableCell>
                    <TableCell className="px-6 py-4">{it.examInfo?.examTitle ?? ''}</TableCell>
                    <TableCell className="px-6 py-4">{(it.examInfo?.price ?? it.amount)?.toLocaleString('vi-VN')} {it.currency ?? 'VND'}</TableCell>
                    <TableCell className="px-6 py-4">{it.examInfo?.buyerName ?? it.user?.name} ({it.examInfo?.buyerEmail ?? it.user?.email})</TableCell>
                    <TableCell className="px-6 py-4">{it.gateway}</TableCell>
                    <TableCell className="px-6 py-4">{new Date(it.createdAt).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="px-6 py-4">{it.paidAt ? new Date(it.paidAt).toLocaleString('vi-VN') : '-'}</TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="!p-2"
                          title="Xem"
                          onClick={async () => {
                            try {
                              const detail = await paymentsService.getPaymentById(it.transactionId);
                              setSelected(detail);
                              setIsDetailOpen(true);
                            } catch (e) {
                              setError(e?.message || 'Không thể tải chi tiết giao dịch');
                            }
                          }}
                        >
                          <EyeIcon className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
          <span>Trang {page}/{totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
        </div>
      </div>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-3xl p-6">
        {selected && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Chi Tiết Giao Dịch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">OrderId:</span><span className="font-medium">{selected.orderId}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Trạng thái:</span><span className="font-medium">{selected.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Cổng:</span><span className="font-medium">{selected.gateway}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Số tiền:</span><span className="font-medium">{(selected.examInfo?.price ?? selected.amount)?.toLocaleString('vi-VN')} {selected.currency ?? 'VND'}</span></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Email:</span><span className="font-medium">{selected.examInfo?.buyerEmail ?? selected.user?.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Tạo lúc:</span><span className="font-medium">{new Date(selected.createdAt).toLocaleString('vi-VN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Thanh toán lúc:</span><span className="font-medium">{selected.paidAt ? new Date(selected.paidAt).toLocaleString('vi-VN') : '-'}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} className="max-w-2xl p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Tạo liên kết thanh toán PayOS</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email người dùng</label>
              <input
                value={buyerQuery}
                onChange={(e) => { setBuyerQuery(e.target.value); setSelectedBuyer(null); }}
                placeholder="Nhập để tìm người dùng theo email"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              />
              {buyerOptions.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {buyerOptions.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setSelectedBuyer(u); setBuyerQuery(u.email); setBuyerOptions([]); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedBuyer?.id === u.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                    >
                      <span>{u.fullName} ({u.email})</span>
                      <span className="text-xs text-gray-500">ID: {u.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Chọn bài thi</label>
              <input
                value={examQuery}
                onChange={(e) => { setExamQuery(e.target.value); setSelectedExam(null); }}
                placeholder="Nhập để lọc bài thi theo tiêu đề"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:border-gray-700"
              />
              {examOptions.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {examOptions.map(e => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => { setSelectedExam(e); setExamQuery(e.title || String(e.id)); setExamOptions([]); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedExam?.id === e.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                    >
                      <span className="truncate max-w-[70%]">{e.title}</span>
                      <span className="text-xs text-gray-500">ID: {e.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                disabled={!selectedBuyer || !selectedExam || creating}
                onClick={async () => {
                  try {
                    if (!selectedBuyer || !selectedExam) return;
                    setCreating(true);
                    const link = await paymentsService.createExamPayOSLink(Number(selectedExam.id), {
                      buyerEmail: selectedBuyer.email,
                      description: `Thanh toán bài thi ${selectedExam.title}`,
                      returnUrl: defaultUrl,
                      cancelUrl: defaultUrl,
                    });
                    setCreatedLink(link);
                  } catch (e) {
                    setError(e?.message || 'Không thể tạo liên kết thanh toán');
                  } finally {
                    setCreating(false);
                  }
                }}
              >Tạo liên kết</Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Đóng</Button>
            </div>

            {createdLink && (
              <div className="mt-4 space-y-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Checkout URL</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(createdLink.checkoutUrl)}>Sao chép</Button>
                    <Button size="sm" onClick={() => window.open(createdLink.checkoutUrl, '_blank')}>Mở</Button>
                  </div>
                </div>
                <div className="break-all text-sm text-gray-900 dark:text-white">{createdLink.checkoutUrl}</div>
                <div className="text-xs text-gray-500">OrderCode: {String(createdLink.orderCode)}</div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}