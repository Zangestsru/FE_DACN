import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuthContext } from '@/contexts'
import { examService } from '@/services'
import { toast } from 'sonner'

export default function PayOSTest() {
  const { examId } = useParams()
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const qrUrl = useMemo(() => {
    try {
      const qrData = result?.qrCode ?? result?.QrCode ?? orderInfo?.qrCode ?? orderInfo?.QrCode
      const orderCode = result?.orderCode ?? result?.OrderCode ?? orderInfo?.orderCode ?? orderInfo?.OrderCode
      const amount = result?.amount ?? result?.Amount ?? orderInfo?.amount ?? orderInfo?.Amount
      const payload = qrData || (orderCode && amount ? `PAYOS:${orderCode}:${amount}:VND` : null)
      if (!payload) return null
      return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`
    } catch {
      return null
    }
  }, [result, orderInfo])

  const handleCreate = async () => {
    if (!examId) return
    setLoading(true)
    setResult(null)
    setOrderInfo(null)
    try {
      const ret = `${window.location.origin}/payment-history`
      const cancel = `${window.location.origin}/payment/${'exam'}/${examId}?canceled=true`
      const link = await examService.createExamPayOSLink(parseInt(examId as string), `Test PayOS cho bài thi ${examId}`, ret, cancel, { name: user?.fullName || user?.FullName || 'User' })
      setResult(link)
      const orderCode = link?.orderCode ?? link?.OrderCode
      if (orderCode) {
        const info = await examService.getPayOSOrder(orderCode)
        setOrderInfo(info)
      }
      const checkoutUrl = link?.checkoutUrl ?? link?.CheckoutUrl
      if (checkoutUrl) {
        toast.success('Đã tạo checkoutUrl')
        window.open(checkoutUrl, '_blank')
      } else {
        if (qrUrl) {
          toast.success('Tạo QR URL thành công (mô phỏng)')
          window.open(qrUrl, '_blank')
        } else {
          toast.warning('Không có checkoutUrl, đang mô phỏng QR từ dữ liệu đơn')
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'Tạo link thất bại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const auto = async () => {
      if (!examId) return
      if (result || orderInfo || loading) return
      try {
        await handleCreate()
      } catch {}
    }
    auto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId])

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Kiểm tra tạo PayOS URL</h5>
          <div className="mb-2">ExamId: {examId}</div>
          <button className="btn btn-primary" disabled={loading} onClick={handleCreate}>
            {loading ? 'Đang tạo...' : 'Tạo liên kết PayOS'}
          </button>
          <div className="mt-3">
            <div className="mb-2">Kết quả tạo:</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{result ? JSON.stringify(result, null, 2) : 'Chưa có'}</pre>
          </div>
          <div className="mt-3">
            <div className="mb-2">Trạng thái đơn:</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{orderInfo ? JSON.stringify(orderInfo, null, 2) : 'Chưa có'}</pre>
          </div>
          <div className="mt-3">
            <div className="mb-2">QR URL:</div>
            <div>{qrUrl || 'Chưa có'}</div>
            {qrUrl && (
              <div className="mt-2">
                <img src={qrUrl} alt="QR" style={{ width: 220, height: 220 }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}