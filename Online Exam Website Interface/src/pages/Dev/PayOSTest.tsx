import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services/exam.service';
import { toast } from 'sonner';

const PayOSTest: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [orderCode, setOrderCode] = useState<string>('');

  const [formData, setFormData] = useState({
    description: `Thanh toán bài thi ${examId}`,
    buyerName: 'Test User',
    buyerEmail: 'test@example.com',
    buyerPhone: '0123456789',
    buyerAddress: '123 Test Street',
    price: 100000,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreatePaymentLink = async () => {
    if (!examId) {
      toast.error('Không tìm thấy examId');
      return;
    }

    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/payment-success`;
      const cancelUrl = `${window.location.origin}/dev/payos-test/${examId}?canceled=1`;

      const link = await examService.createExamPayOSLink(
        parseInt(examId),
        formData.description,
        returnUrl,
        cancelUrl,
        {
          name: formData.buyerName,
          email: formData.buyerEmail,
          phone: formData.buyerPhone,
          address: formData.buyerAddress,
        },
        [
          {
            name: formData.description,
            quantity: 1,
            price: parseInt(String(formData.price)) || 0,
          },
        ]
      );

      const orderCodeValue = link?.orderCode ?? link?.OrderCode;
      const checkoutUrl = link?.checkoutUrl || link?.CheckoutUrl;

      if (orderCodeValue) {
        setOrderCode(String(orderCodeValue));
        sessionStorage.setItem('payos_last_order_code', String(orderCodeValue));
      }

      if (checkoutUrl) {
        setOrderInfo(link);
        toast.success('Tạo link thanh toán thành công!');
      } else {
        throw new Error('Không nhận được checkoutUrl từ PayOS');
      }
    } catch (error: any) {
      console.error('Error creating PayOS link:', error);
      toast.error(error.message || 'Không thể tạo liên kết thanh toán PayOS');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOrderStatus = async () => {
    if (!orderCode) {
      toast.error('Vui lòng nhập orderCode');
      return;
    }

    setLoading(true);
    try {
      const order = await examService.getPayOSOrder(orderCode);
      setOrderInfo(order);
      toast.success('Lấy thông tin đơn hàng thành công!');
    } catch (error: any) {
      console.error('Error getting order:', error);
      toast.error(error.message || 'Không thể lấy thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderCode) {
      toast.error('Vui lòng nhập orderCode');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    setLoading(true);
    try {
      await examService.cancelPayOSOrder(orderCode, 'Test cancellation');
      toast.success('Hủy đơn hàng thành công!');
      setOrderInfo(null);
    } catch (error: any) {
      console.error('Error canceling order:', error);
      toast.error(error.message || 'Không thể hủy đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToCheckout = () => {
    const checkoutUrl = orderInfo?.checkoutUrl || orderInfo?.CheckoutUrl;
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      toast.error('Không tìm thấy checkout URL');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-flask me-2"></i>
                PayOS Test Page
              </h4>
              <small>Exam ID: {examId}</small>
            </div>
            <div className="card-body">
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Development Only:</strong> This page is for testing PayOS payment integration.
              </div>

              <h5 className="mb-3">1. Create Payment Link</h5>
              <div className="mb-4">
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Buyer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Buyer Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="buyerEmail"
                      value={formData.buyerEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Buyer Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      name="buyerPhone"
                      value={formData.buyerPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Price (VND)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Buyer Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="buyerAddress"
                    value={formData.buyerAddress}
                    onChange={handleInputChange}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleCreatePaymentLink}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link me-2"></i>
                      Create Payment Link
                    </>
                  )}
                </button>
              </div>

              {orderInfo && (
                <div className="mb-4">
                  <h5 className="mb-3">2. Payment Link Created</h5>
                  <div className="alert alert-success">
                    <strong>Order Code:</strong> {orderInfo.orderCode || orderInfo.OrderCode}
                    <br />
                    <strong>Status:</strong> {orderInfo.status || orderInfo.Status || 'N/A'}
                    <br />
                    {orderInfo.checkoutUrl || orderInfo.CheckoutUrl ? (
                      <>
                        <strong>Checkout URL:</strong>{' '}
                        <a
                          href={orderInfo.checkoutUrl || orderInfo.CheckoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {orderInfo.checkoutUrl || orderInfo.CheckoutUrl}
                        </a>
                        <br />
                        <button
                          className="btn btn-success mt-2"
                          onClick={handleRedirectToCheckout}
                        >
                          <i className="fas fa-external-link-alt me-2"></i>
                          Go to Checkout
                        </button>
                      </>
                    ) : null}
                  </div>
                  <pre className="bg-light p-3 rounded" style={{ fontSize: '0.85rem' }}>
                    {JSON.stringify(orderInfo, null, 2)}
                  </pre>
                </div>
              )}

              <hr />

              <h5 className="mb-3">3. Check Order Status</h5>
              <div className="mb-4">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Order Code"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleCheckOrderStatus}
                    disabled={loading || !orderCode}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Checking...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-search me-2"></i>
                        Check Status
                      </>
                    )}
                  </button>
                </div>
                {orderCode && (
                  <button
                    className="btn btn-danger"
                    onClick={handleCancelOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Canceling...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-times me-2"></i>
                        Cancel Order
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/payment-history')}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Payment History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayOSTest;

