import axios from 'axios'

async function tryCreate(base) {
  const url = `${base}/api/payments/payos/create`
  const body = {
    Amount: 12000,
    Description: `AutoTest PayOS ${Date.now()}`,
    ReturnUrl: 'http://localhost:4020/payment/success',
    CancelUrl: 'http://localhost:4020/payment/cancel'
  }
  try {
    const res = await axios.post(url, body, { timeout: 15000 })
    const data = res.data?.data || res.data
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e }
  }
}

function buildQrUrl(payload) {
  if (!payload) return null
  const data = encodeURIComponent(payload)
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${data}`
}

function normalizeCheckoutUrl(url) {
  if (!url || typeof url !== 'string') return ''
  if (url.startsWith('https://dev.pay.payos.vn')) {
    return url.replace('https://dev.pay.payos.vn', 'https://next.dev.pay.payos.vn')
  }
  if (url.startsWith('https://pay.payos.vn')) {
    return url.replace('https://pay.payos.vn', 'https://next.pay.payos.vn')
  }
  return url
}

async function withRetry(fn, attempts = 3, delayMs = 500) {
  let lastErr
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastErr
}

async function main() {
  const bases = [
    'http://localhost:5000',
    'http://localhost:5006'
  ]

  let created = null
  for (const b of bases) {
    try {
      const r = await withRetry(() => tryCreate(b), 2, 400)
      if (r.ok) {
        created = { base: b, data: r.data }
        break
      }
    } catch {}
  }

  if (!created) {
    const fallbackOrder = Date.now()
    const fallbackAmount = 12000
    const payload = `PAYOS:${fallbackOrder}:${fallbackAmount}:VND`
    const qrUrl = buildQrUrl(payload)
    console.log('create:fail')
    console.log('qr_url:', qrUrl)
    process.exit(0)
  }

  const d = created.data
  const orderCode = d?.orderCode ?? d?.OrderCode
  const amount = d?.amount ?? d?.Amount
  const qrData = d?.qrCode ?? d?.QrCode
  const checkoutUrl = normalizeCheckoutUrl(d?.checkoutUrl ?? d?.CheckoutUrl ?? d?.url ?? d?.Url)

  let qrUrl = null
  if (typeof qrData === 'string' && qrData.length > 0) {
    if (qrData.startsWith('http')) {
      qrUrl = qrData
    } else {
      qrUrl = buildQrUrl(qrData)
    }
  } else if (orderCode && amount) {
    const payload = `PAYOS:${orderCode}:${amount}:VND`
    qrUrl = buildQrUrl(payload)
  }

  const isValidUrl = (u) => typeof u === 'string' && /^https?:\/\//.test(u)
  if (!isValidUrl(qrUrl)) {
    const payload = qrData || (orderCode && amount ? `PAYOS:${orderCode}:${amount}:VND` : '')
    qrUrl = buildQrUrl(payload)
    console.log('fix:qr_url_built_from_payload')
  }

  console.log('create:ok')
  console.log('base:', created.base)
  console.log('order_code:', orderCode)
  console.log('checkout_url:', checkoutUrl || '')
  console.log('qr_url:', qrUrl || '')

  if (orderCode) {
    const statusBases = [created.base, 'http://localhost:5000', 'http://localhost:5006']
    for (const sb of statusBases) {
      try {
        const s = await axios.get(`${sb}/api/payments/payos/status/${orderCode}`, { timeout: 10000 })
        const info = s.data?.data || s.data
        const st = info?.status || info?.Status || ''
        console.log('status:', st)
        break
      } catch {}
    }
  }
}

main()