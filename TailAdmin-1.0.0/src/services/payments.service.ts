import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../config/api.config';

export type PaymentItem = {
  transactionId: number;
  orderId?: string;
  status?: string;
  amount: number;
  currency?: string;
  gateway?: string;
  paidAt?: string;
  createdAt: string;
  user?: { id: number; name?: string; email?: string };
  examInfo?: { examId?: number; examTitle?: string; buyerName?: string; buyerEmail?: string; price?: number } | null;
};

class PaymentsService extends ApiService {
  async getPayments(params?: { page?: number; pageSize?: number; status?: string; gateway?: string; search?: string }): Promise<{ data: PaymentItem[]; totalCount: number; page: number; pageSize: number; totalPages: number }>
  {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));
    if (params?.status) query.append('status', params.status);
    if (params?.gateway) query.append('gateway', params.gateway);
    if (params?.search) query.append('search', params.search);
    const endpoint = `${API_ENDPOINTS.admin.payments.getAll}?${query.toString()}`;
    const res = await this.get<unknown>(endpoint);
    const data = res.data ?? res.Data ?? res;
    const rawItemsUnknown = data.data ?? data.items ?? data;
    const arr = Array.isArray(rawItemsUnknown) ? rawItemsUnknown : [];
    const items: PaymentItem[] = arr.map((it) => {
      const obj = it as Record<string, unknown>;
      const src = obj['status'] ?? obj['Status'];
      const normalized = this.normalizeStatus(typeof src === 'string' ? src : String(src ?? ''));
      return { ...(it as PaymentItem), status: normalized };
    });
    return {
      data: items,
      totalCount: data.totalCount ?? 0,
      page: data.page ?? params?.page ?? 1,
      pageSize: data.pageSize ?? params?.pageSize ?? 10,
      totalPages: data.totalPages ?? 1,
    };
  }

  async getPaymentById(id: number | string): Promise<PaymentItem> {
    const res = await this.get<unknown>(API_ENDPOINTS.admin.payments.getById(id));
    const data = res.data ?? res.Data ?? res;
    const normalizedObj: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    const src = normalizedObj['status'] ?? normalizedObj['Status'];
    const normalized = this.normalizeStatus(typeof src === 'string' ? src : String(src ?? ''));
    normalizedObj['status'] = normalized;
    return normalizedObj as PaymentItem;
  }

  async createExamPayOSLink(examId: number, payload: { buyerName?: string; buyerEmail?: string; buyerPhone?: string; description?: string; returnUrl?: string; cancelUrl?: string }): Promise<{ checkoutUrl: string; qrCode: string; orderCode: number }>
  {
    const res = await this.post<unknown>(API_ENDPOINTS.exams.purchasePayOS(examId), payload);
    const data = res.Data ?? res.data ?? res;
    return {
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      orderCode: data.orderCode,
    };
  }

  private normalizeStatus(status?: string): string {
    const s = String(status || '').toLowerCase();
    if (!s) return '';
    if (s === 'completed' || s === 'success') return 'success';
    if (s === 'canceled' || s === 'cancelled') return 'cancelled';
    return s;
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;