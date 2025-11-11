/**
 * Payment Service
 * Xử lý tất cả các chức năng liên quan đến thanh toán
 */

import { apiClient } from './api.service';
import { PAYMENT_ENDPOINTS } from '@/constants/endpoints';
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
    // TODO: Uncomment khi có API thật
    // const response = await apiService.get<IPaymentInfo[]>(
    //   PAYMENT_ENDPOINTS.HISTORY
    // );

    // Mock response
    return Promise.resolve([
      mockPayment,
      {
        ...mockPayment,
        id: 'payment-2',
        amount: 800000,
        method: 'vnpay',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
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
    paymentMethod: 'momo' | 'vnpay' | 'credit-card' | 'bank-transfer' | 'paypal',
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
    paymentMethod: 'momo' | 'vnpay' | 'credit-card' | 'bank-transfer' | 'paypal',
    customerInfo: any
  ): Promise<IPaymentResponse> {
    return this.createPayment({
      courseId,
      amount,
      paymentMethod,
      customerInfo,
    });
  }
}

// ==================== EXPORT ====================

export const paymentService = new PaymentService();
export default paymentService;

