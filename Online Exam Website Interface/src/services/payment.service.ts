/**
 * Payment Service
 * Xử lý tất cả các chức năng liên quan đến thanh toán
 */

import { apiClient } from './api.service';
import { PAYMENT_ENDPOINTS, EXAM_ENDPOINTS } from '@/constants/endpoints';
import { SUCCESS_MESSAGES } from '@/constants';
import type {
  IPaymentRequest,
  IPaymentResponse,
  IPaymentVerifyResponse,
  IPaymentInfo,
} from '@/types';

// ==================== MOCK DATA ====================

const mockPayment: IPaymentInfo = {
  id: 'payment-' + Date.now(),
  amount: 1200000,
  method: 'momo',
  status: 'success',
  createdAt: new Date().toISOString(),
  paidAt: new Date().toISOString(),
};

// ==================== PAYMENT SERVICE ====================

class PaymentService {
  RETURN_URL: string;
  CANCEL_URL: string;

  constructor() {
    this.RETURN_URL = `${window.location.origin}/booking-confirmation`;
    this.CANCEL_URL = `${window.location.origin}/payment`;
  }
  /**
   * Tạo payment mới
   * @param data - Thông tin thanh toán
   * @returns Promise với thông tin payment
   */
  async createPayment(data: IPaymentRequest): Promise<IPaymentResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IPaymentResponse>(
    //   PAYMENT_ENDPOINTS.CREATE,
    //   data
    // );

    // Mock response
    return Promise.resolve({
      paymentId: 'payment-' + Date.now(),
      orderId: 'order-' + Date.now(),
      amount: data.amount,
      status: 'pending',
      paymentUrl: 'https://sandbox.momo.vn/payment/...',
      qrCode: 'data:image/png;base64,...',
      message: 'Vui lòng hoàn tất thanh toán',
    });
  }

  /**
   * Xác thực payment
   * @param paymentId - ID của payment
   * @returns Promise với kết quả xác thực
   */
  async verifyPayment(paymentId: string): Promise<IPaymentVerifyResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IPaymentVerifyResponse>(
    //   PAYMENT_ENDPOINTS.VERIFY,
    //   { paymentId }
    // );

    // Mock response
    return Promise.resolve({
      paymentId,
      status: 'success',
      transactionId: 'trans-' + Date.now(),
      paidAt: new Date().toISOString(),
      message: SUCCESS_MESSAGES.PAYMENT_SUCCESS,
    });
  }

  /**
   * Lấy lịch sử thanh toán
   * @returns Promise với danh sách payment
   */
  async getPaymentHistory(): Promise<IPaymentInfo[]> {
    const res = await this.getMyPayments(1, 50);
    const items = Array.isArray(res.items) ? res.items : [];
    const toStatus = (s: any): 'pending'|'processing'|'success'|'failed'|'refunded' => {
      const val = String(s || '').toLowerCase();
      if (val === 'success' || val === 'paid') return 'success';
      if (val === 'pending') return 'pending';
      if (val === 'refunded') return 'refunded';
      if (val === 'canceled' || val === 'cancelled' || val === 'failed') return 'failed';
      return 'processing';
    };
    const toMethod = (g: any): 'momo'|'vnpay'|'credit-card'|'bank-transfer'|'paypal' => {
      const val = String(g || '').toLowerCase();
      if (val.includes('momo')) return 'momo';
      if (val.includes('vnpay')) return 'vnpay';
      if (val.includes('paypal')) return 'paypal';
      if (val.includes('card')) return 'credit-card';
      return 'bank-transfer';
    };
    const mapped: IPaymentInfo[] = items.map((t: any) => ({
      id: (t.transactionId ?? t.TransactionId ?? t.orderId ?? t.OrderId ?? '').toString(),
      amount: Number(t.amount ?? t.Amount ?? 0),
      method: toMethod(t.gateway ?? t.Gateway),
      status: toStatus(t.status ?? t.Status),
      createdAt: t.createdAt ?? t.CreatedAt ?? new Date().toISOString(),
      paidAt: t.paidAt ?? t.PaidAt ?? undefined,
      orderId: t.orderId ?? t.OrderId ?? undefined,
    }));
    return mapped;
  }

  /**
   * Lấy chi tiết payment
   * @param id - ID của payment
   * @returns Promise với thông tin payment
   */
  async getPaymentById(id: string | number): Promise<IPaymentInfo> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IPaymentInfo>(
    //   PAYMENT_ENDPOINTS.GET_BY_ID(id)
    // );

    // Mock response
    return Promise.resolve({
      ...mockPayment,
      id: typeof id === 'string' ? id : id.toString(),
    });
  }

  /**
   * Hủy payment
   * @param id - ID của payment
   * @returns Promise với message
   */
  async cancelPayment(id: string | number): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   PAYMENT_ENDPOINTS.CANCEL(id)
    // );

    // Mock response
    return Promise.resolve({
      message: 'Đã hủy thanh toán',
    });
  }

  /**
   * Hoàn tiền
   * @param id - ID của payment
   * @param reason - Lý do hoàn tiền
   * @returns Promise với message
   */
  async refundPayment(id: string | number, reason?: string): Promise<{ message: string }> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<{ message: string }>(
    //   PAYMENT_ENDPOINTS.REFUND(id),
    //   { reason }
    // );

    // Mock response
    return Promise.resolve({
      message: 'Yêu cầu hoàn tiền đã được gửi',
    });
  }

  /**
   * Xử lý callback từ MoMo
   * @param params - Query params từ MoMo
   * @returns Promise với kết quả
   */
  async handleMoMoCallback(params: any): Promise<IPaymentVerifyResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IPaymentVerifyResponse>(
    //   PAYMENT_ENDPOINTS.MOMO_CALLBACK,
    //   params
    // );

    // Mock response
    return Promise.resolve({
      paymentId: params.orderId || 'payment-' + Date.now(),
      status: params.resultCode === '0' ? 'success' : 'failed',
      transactionId: params.transId,
      paidAt: new Date().toISOString(),
      message: params.resultCode === '0' 
        ? SUCCESS_MESSAGES.PAYMENT_SUCCESS 
        : 'Thanh toán thất bại',
    });
  }

  /**
   * Xử lý callback từ VNPay
   * @param params - Query params từ VNPay
   * @returns Promise với kết quả
   */
  async handleVNPayCallback(params: any): Promise<IPaymentVerifyResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IPaymentVerifyResponse>(
    //   PAYMENT_ENDPOINTS.VNPAY_CALLBACK,
    //   params
    // );

    // Mock response
    return Promise.resolve({
      paymentId: params.vnp_TxnRef || 'payment-' + Date.now(),
      status: params.vnp_ResponseCode === '00' ? 'success' : 'failed',
      transactionId: params.vnp_TransactionNo,
      paidAt: new Date().toISOString(),
      message: params.vnp_ResponseCode === '00' 
        ? SUCCESS_MESSAGES.PAYMENT_SUCCESS 
        : 'Thanh toán thất bại',
    });
  }

  /**
   * Xử lý callback từ PayPal
   * @param params - Query params từ PayPal
   * @returns Promise với kết quả
   */
  async handlePayPalCallback(params: any): Promise<IPaymentVerifyResponse> {
    // TODO: Uncomment khi có API thật
    // const response = await apiService.post<IPaymentVerifyResponse>(
    //   PAYMENT_ENDPOINTS.PAYPAL_CALLBACK,
    //   params
    // );

    // Mock response
    return Promise.resolve({
      paymentId: params.token || 'payment-' + Date.now(),
      status: params.PayerID ? 'success' : 'failed',
      transactionId: params.PayerID,
      paidAt: new Date().toISOString(),
      message: params.PayerID 
        ? SUCCESS_MESSAGES.PAYMENT_SUCCESS 
        : 'Thanh toán thất bại',
    });
  }

  /**
   * Tạo payment cho exam
   * @param examId - ID của bài thi
   * @param amount - Số tiền
   * @param paymentMethod - Phương thức thanh toán
   * @param customerInfo - Thông tin khách hàng
   * @returns Promise với thông tin payment
   */
  async createExamPayment(
    examId: string | number,
    amount: number,
    paymentMethod: 'momo' | 'vnpay' | 'credit-card' | 'bank-transfer',
    customerInfo: any
  ): Promise<IPaymentResponse> {
    return this.createPayment({
      examId,
      amount,
      paymentMethod,
      customerInfo,
    });
  }

  /**
   * Tạo payment cho course
   * @param courseId - ID của khóa học
   * @param amount - Số tiền
   * @param paymentMethod - Phương thức thanh toán
   * @param customerInfo - Thông tin khách hàng
   * @returns Promise với thông tin payment
   */
  async createCoursePayment(
    courseId: string | number,
    amount: number,
    paymentMethod: 'momo' | 'vnpay' | 'credit-card' | 'bank-transfer',
    customerInfo: any
  ): Promise<IPaymentResponse> {
    return this.createPayment({
      courseId,
      amount,
      paymentMethod,
      customerInfo,
    });
  }

  async createPayOSPaymentLink(data: {
    description: string;
    amount: number;
    orderCode?: string | number;
    returnUrl?: string;
    cancelUrl?: string;
    bookingInfo?: any;
  }): Promise<any> {
    const body = {
      description: data.description,
      amount: Number(data.amount),
      orderCode: data.orderCode ?? Date.now(),
      returnUrl: data.returnUrl ?? this.RETURN_URL,
      cancelUrl: data.cancelUrl ?? this.CANCEL_URL,
      bookingInfo: data.bookingInfo,
    };
    const response = await apiClient.post(PAYMENT_ENDPOINTS.PAYOS.CREATE_LINK, body);
    return response;
  }

  async createFoodDrinkPayOSLink(data: {
    description: string;
    amount: number;
    orderCode: string | number;
    returnUrl?: string;
    cancelUrl?: string;
    bookingInfo?: any;
  }): Promise<any> {
    const body = {
      description: data.description,
      amount: Number(data.amount),
      orderCode: data.orderCode,
      returnUrl: data.returnUrl ?? this.RETURN_URL,
      cancelUrl: data.cancelUrl ?? this.CANCEL_URL,
      orderInfo: data.bookingInfo,
    };
    const response = await apiClient.post(PAYMENT_ENDPOINTS.PAYOS.CREATE_FOOD_DRINK_LINK, body);
    return response;
  }

  async getPayOSOrder(orderCode: string | number): Promise<any> {
    const response = await apiClient.get(PAYMENT_ENDPOINTS.PAYOS.GET_ORDER(orderCode));
    const payload = response?.data;
    const hasSuccess = payload && (payload.success === true || payload.Success === true);
    const data = hasSuccess ? (payload?.data ?? payload?.Data) : (payload?.data ?? payload?.Data ?? payload);
    return data;
  }

  async getMyPayments(page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number; page: number; pageSize: number; }> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString();
    const response = await apiClient.get(`${EXAM_ENDPOINTS.MY_PAYMENTS}?${query}`);
    const payload = response?.data;
    const hasSuccess = (payload && (payload.success === true || payload.Success === true));
    const backendData: any = hasSuccess ? (payload?.data ?? payload?.Data) : (payload?.data ?? payload?.Data ?? payload);
    return backendData;
  }

  redirectToPayOS(checkoutResponse: any) {
    if (!checkoutResponse) return;
    let url = checkoutResponse.checkoutUrl;
    if (typeof url === 'string') {
      if (url.startsWith('https://dev.pay.payos.vn')) {
        url = url.replace('https://dev.pay.payos.vn', 'https://next.dev.pay.payos.vn');
      } else if (url.startsWith('https://pay.payos.vn')) {
        url = url.replace('https://pay.payos.vn', 'https://next.pay.payos.vn');
      }
      window.location.href = url;
    }
  }

  openPayOSDialog(
    checkoutResponse: any,
    onSuccess?: (eventData: any) => void,
    onCancel?: (eventData: any) => void,
    onExit?: (eventData: any) => void
  ) {
    if (!checkoutResponse || !(window as any).PayOSCheckout) {
      console.error('PayOS Checkout script not loaded or invalid response');
      return;
    }
    let url = checkoutResponse.checkoutUrl;
    if (typeof url === 'string') {
      if (url.startsWith('https://dev.pay.payos.vn')) {
        url = url.replace('https://dev.pay.payos.vn', 'https://next.dev.pay.payos.vn');
      } else if (url.startsWith('https://pay.payos.vn')) {
        url = url.replace('https://pay.payos.vn', 'https://next.pay.payos.vn');
      }
    }
    const { open } = (window as any).PayOSCheckout.usePayOS({
      RETURN_URL: this.RETURN_URL,
      ELEMENT_ID: 'payos_checkout_root',
      CHECKOUT_URL: url,
      onExit: (eventData: any) => {
        if (onExit) onExit(eventData);
      },
      onSuccess: (eventData: any) => {
        if (onSuccess) {
          onSuccess(eventData);
        } else {
          window.location.href = `${this.RETURN_URL}?orderCode=${eventData.orderCode}`;
        }
      },
      onCancel: (eventData: any) => {
        if (onCancel) {
          onCancel(eventData);
        } else {
          window.location.href = `${this.CANCEL_URL}?orderCode=${eventData.orderCode}`;
        }
      },
    });
    open();
  }

  openCustomPaymentUI(checkoutResponse: any, navigate: (path: string, options?: any) => void) {
    if (!checkoutResponse || !navigate) return;
    const { accountName, accountNumber, amount, description, orderCode, qrCode, bin } = checkoutResponse;
    navigate('/qr-payment', {
      state: {
        accountName,
        accountNumber,
        amount,
        description,
        orderCode,
        qrCode,
        bin,
      },
    });
  }
}

// ==================== EXPORT ====================

export const paymentService = new PaymentService();
export default paymentService;
