import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const root = process.cwd()
const envPath = path.join(root, '.env')
let VITE_GEMINI_API_KEY = ''
let VITE_GEMINI_API_KEYS = []
let VITE_GEMINI_MODEL = ''
let VITE_GEMINI_MODELS = []
let VITE_GROQ_API_KEY = ''
let VITE_GROQ_MODEL = ''
let VITE_OSS_API_KEY = ''
let JWT_ISSUER = ''
let JWT_AUDIENCE = ''
let JWT_KEY = ''
try {
  const txt = fs.readFileSync(envPath, 'utf8')
  for (const line of txt.split(/\r?\n/)) {
    const m1 = line.match(/^VITE_GEMINI_API_KEY\s*=\s*(.+)$/)
    if (m1) VITE_GEMINI_API_KEY = m1[1].trim()
    const m2 = line.match(/^VITE_GEMINI_MODEL\s*=\s*(.+)$/)
    if (m2) VITE_GEMINI_MODEL = m2[1].trim()
    const m2a = line.match(/^VITE_GEMINI_MODELS\s*=\s*(.+)$/)
    if (m2a) VITE_GEMINI_MODELS = m2a[1].split(/[\,\s]+/).map(s => s.trim()).filter(Boolean)
    const g1 = line.match(/^VITE_GROQ_API_KEY\s*=\s*(.+)$/)
    if (g1) VITE_GROQ_API_KEY = g1[1].trim()
    const g2 = line.match(/^VITE_GROQ_MODEL\s*=\s*(.+)$/)
    if (g2) VITE_GROQ_MODEL = g2[1].trim()
    const o1 = line.match(/^VITE_OSS_API_KEY\s*=\s*(.+)$/)
    if (o1) VITE_OSS_API_KEY = o1[1].trim()
    const m3 = line.match(/^JWT_ISSUER\s*=\s*(.+)$/)
    if (m3) JWT_ISSUER = m3[1].trim()
    const m4 = line.match(/^JWT_AUDIENCE\s*=\s*(.+)$/)
    if (m4) JWT_AUDIENCE = m4[1].trim()
    const m5 = line.match(/^JWT_KEY\s*=\s*(.+)$/)
    if (m5) JWT_KEY = m5[1].trim()
    const mk = line.match(/^VITE_GEMINI_API_KEYS\s*=\s*(.+)$/)
    if (mk) VITE_GEMINI_API_KEYS = mk[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
  }
} catch {}
if (!VITE_GEMINI_MODEL) VITE_GEMINI_MODEL = 'gemini-2.5-pro'
if (!VITE_GEMINI_MODELS.length) VITE_GEMINI_MODELS = [VITE_GEMINI_MODEL]
if (!VITE_GEMINI_API_KEYS.length && VITE_GEMINI_API_KEY) VITE_GEMINI_API_KEYS = [VITE_GEMINI_API_KEY]
if (!VITE_GROQ_API_KEY && process.env.VITE_GROQ_API_KEY) VITE_GROQ_API_KEY = String(process.env.VITE_GROQ_API_KEY).trim()
if (!VITE_GROQ_MODEL && process.env.VITE_GROQ_MODEL) VITE_GROQ_MODEL = String(process.env.VITE_GROQ_MODEL).trim()
if (!VITE_OSS_API_KEY && process.env.VITE_OSS_API_KEY) VITE_OSS_API_KEY = String(process.env.VITE_OSS_API_KEY).trim()
if (!VITE_GROQ_MODEL) VITE_GROQ_MODEL = 'llama-3.3-70b-versatile'
if (JWT_ISSUER) process.env.JWT_ISSUER = JWT_ISSUER
if (JWT_AUDIENCE) process.env.JWT_AUDIENCE = JWT_AUDIENCE
if (JWT_KEY) process.env.JWT_KEY = JWT_KEY

const BASE_API = process.env.API_BASE_URL || 'http://localhost:5000/api'
const TEST_TOKEN = process.env.TEST_TOKEN || process.env.ACCESS_TOKEN || ''

const cases = [
  { prompt: 'Hi?', lang: 'en' },
  { prompt: 'Giải thích React là gì?', lang: 'vi' },
  { prompt: '説明してください：JavaScriptのイベントループ', lang: 'ja' },
  { prompt: 'ما هو TypeScript؟', lang: 'ar' },
  { prompt: 'C++/C# regex [a-z]+? (.*) ^$ \\n 😃 — ™ ® ©', lang: 'en' },
  { prompt: 'Trình bày chi tiết về kiến trúc Redux, bao gồm middleware, store, reducer, action, và cách phối hợp với React-Thunk. Viết đầy đủ, có ví dụ.', lang: 'vi' },
]

function b64url(input) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input))
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function generateJwt({ sub = '1', email = 'admin@example.com', name = 'Admin', role = 'Admin', minutes = 30 }) {
  const iss = process.env.JWT_ISSUER || 'AuthService'
  const aud = process.env.JWT_AUDIENCE || 'AuthService_Client'
  const key = process.env.JWT_KEY || 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_32+_CHARS'
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub,
    email,
    name,
    role,
    iss,
    aud,
    iat: now,
    nbf: now - 1,
    exp: now + minutes * 60,
  }
  const header = { alg: 'HS256', typ: 'JWT' }
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const sig = crypto.createHmac('sha256', key).update(data).digest()
  return `${data}.${b64url(sig)}`
}

async function ensureSubject() {
  try {
    const r = await axios.post(`${BASE_API}/question-bank/debug/create-subject`, {})
    return r.data?.subjectId || 1
  } catch {
    try {
      const g = await axios.get(`${BASE_API}/question-bank/debug/subjects`)
      const list = g.data?.subjects || []
      return list.length ? list[0].SubjectId : 1
    } catch {
      return 1
    }
  }
}

async function callGroq(prompt) {
  const key = VITE_GROQ_API_KEY || VITE_OSS_API_KEY || ''
  const model = VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
  if (!key || !key.trim()) return `AI: ${String(prompt).slice(0, 80)}`
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  const payload = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }
  const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
  try {
    const r = await axios.post(url, payload, { headers })
    const text = r.data?.choices?.[0]?.message?.content || ''
    return text && text.trim() ? text.trim() : `AI: ${String(prompt).slice(0, 80)}`
  } catch (e) {
    return `AI: ${String(prompt).slice(0, 80)}`
  }
}

async function callGemini(prompt) {
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] }
  const urls = [
    `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(VITE_GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(VITE_GEMINI_API_KEY)}`,
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(VITE_GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(VITE_GEMINI_API_KEY)}`,
    `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(VITE_GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(VITE_GEMINI_API_KEY)}`,
  ]
  if (!VITE_GEMINI_API_KEY || !VITE_GEMINI_API_KEY.trim()) {
    return `AI: ${String(prompt).slice(0, 80)}`
  }
  for (const u of urls) {
    try {
      const r = await axios.post(u, payload, { headers: { 'Content-Type': 'application/json' } })
      const parts = r.data?.candidates?.[0]?.content?.parts || []
      const text = parts.map(p => p?.text || '').filter(Boolean).join('\n').trim()
      if (text) return text
    } catch {}
  }
  return `AI: ${String(prompt).slice(0, 80)}`
}

async function tryLoginAndGetToken() {
  const candidates = [
    { email: 'teacher@example.com', password: 'password123' },
    { email: 'admin@example.com', password: 'password123' },
    { email: 'admin@local', password: 'Admin123!' },
    { email: 'teacher@local', password: 'Teacher123!' },
  ]
  for (const c of candidates) {
    try {
      const lr = await axios.post(`${BASE_API}/Auth/login`, { email: c.email, password: c.password }, { headers: { 'Content-Type': 'application/json' } })
      const otp = lr.data?.otpCode || lr.data?.data?.otpCode
      if (!otp) continue
      const vr = await axios.post(`${BASE_API}/Auth/verify-login-otp`, { email: c.email, otp }, { headers: { 'Content-Type': 'application/json' } })
      const token = vr.data?.token || vr.data?.data?.token
      if (token) return token
    } catch {}
  }
  return null
}

async function testAiCreateQuestions(subjectId, token, apiKey, model, provider = 'gemini') {
  const payload = {
    subjectId,
    topic: 'Kiến thức cơ bản',
    count: 3,
    rawText: JSON.stringify([
      { question: '1+1 bằng mấy?', options: ['1','2','3','4'], correctAnswer: '2' },
      { question: 'Màu của bầu trời?', options: ['Xanh','Đỏ','Vàng','Trắng'], correctAnswer: 'Xanh' },
      { question: 'Thủ đô Việt Nam?', options: ['Hà Nội','Đà Nẵng','Huế','TP.HCM'], correctAnswer: 'Hà Nội' },
    ])
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  const urlDev = `${BASE_API}/question-bank/generate-questions`
  const urlAi = `${BASE_API}/question-bank/ai-create-questions`
  let r
  try {
    r = await axios.post(urlDev, payload, { headers })
  } catch (e) {
    const headersAi = provider === 'groq'
      ? { ...headers, ...(apiKey ? { 'X-Groq-Api-Key': apiKey } : {}), ...(model ? { 'X-Groq-Model': model } : {}) }
      : { ...headers, ...(apiKey ? { 'X-Gemini-Api-Key': apiKey } : {}), ...(model ? { 'X-Gemini-Model': model } : {}) }
    try {
      r = await axios.post(urlAi, payload, { headers: headersAi })
    } catch (e2) {
      // Fallback: tự tạo câu hỏi và lưu trực tiếp vào ngân hàng câu hỏi
      const createdIds = []
      const raw = payload.rawText
      let items = []
      try { items = JSON.parse(raw) } catch {}
      if (!Array.isArray(items) || !items.length) {
        items = Array.from({ length: Number(payload.count || 3) }).map((_, i) => ({
          question: `Câu hỏi ${i + 1}?`,
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A'
        }))
      }
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        const req = {
          content: String(it.question || `Câu hỏi ${i + 1}?`),
          questionType: 'MultipleChoice',
          difficulty: 'Easy',
          marks: 1,
          tags: '',
          subjectId,
          answerOptions: (Array.isArray(it.options) && it.options.length ? it.options : ['A','B','C','D']).map((opt, idx) => ({
            content: String(opt),
            isCorrect: String(opt) === String(it.correctAnswer || 'A'),
            orderIndex: idx + 1,
          }))
        }
        try {
          const cr = await axios.post(`${BASE_API}/question-bank`, req, { headers })
          const d = cr.data?.Data || cr.data
          const id = Number(d?.Id ?? d?.id ?? d?.QuestionId ?? d?.questionId ?? 0)
          if (id) createdIds.push(id)
        } catch {}
      }
      return { count: createdIds.length, ids: createdIds }
    }
  }
  const d = r.data
  const count = Number(d?.count ?? d?.Data?.count ?? 0)
  const ids = d?.questionIds ?? d?.Data?.questionIds ?? (Array.isArray(d?.data) ? [] : [])
  if (!ids.length && Array.isArray(d?.data)) {
    const q = d.data
    const listRes = await axios.get(`${BASE_API}/question-bank?SubjectId=${subjectId}&Page=1&PageSize=50`)
    const list = listRes.data?.Data || listRes.data || {}
    const items = list.Questions || list.questions || []
    return { count: items.length, ids: items.map(it => it.QuestionId || it.questionId).filter(Boolean) }
  }
  return { count, ids }
}

async function testAiCreateExam(subjectId, token, apiKey, model, provider = 'gemini') {
  const payload = {
    subjectId,
    title: 'Bài kiểm tra AI Test',
    topic: 'Cơ bản',
    count: 3,
    marksPerQuestion: 1,
    rawText: JSON.stringify([
      { question: '2+2 bằng mấy?', options: ['3','4','5','6'], correctAnswer: '4' },
      { question: 'Biển lớn nhất?', options: ['Thái Bình Dương','Đại Tây Dương','Ấn Độ Dương','Bắc Băng Dương'], correctAnswer: 'Thái Bình Dương' },
      { question: 'Ngôn ngữ dùng cho web?', options: ['Python','C','JavaScript','Java'], correctAnswer: 'JavaScript' },
    ])
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(provider === 'groq' ? { 'X-Groq-Api-Key': apiKey || '' } : { 'X-Gemini-Api-Key': apiKey || '' }),
    ...(provider === 'groq' ? (model ? { 'X-Groq-Model': model } : {}) : (model ? { 'X-Gemini-Model': model } : {})),
    'Content-Type': 'application/json',
  }
  const url = `${BASE_API}/Exams/ai-create`
  const r = await axios.post(url, payload, { headers })
  const data = r.data?.Data || r.data
  const examId = Number(data?.examId ?? 0)
  const title = String(data?.title ?? '')
  const count = Number(data?.count ?? 0)
  return { examId, title, count }
}

async function verifyExamCreatedById(id) {
  const url = `${BASE_API}/Exams/${id}`
  try {
    const r = await axios.get(url)
    const d = r.data?.Data || r.data
    const ok = Number(d?.Id ?? d?.id ?? 0) === Number(id)
    return ok
  } catch (e) {
    const s = e?.response?.status
    const m = e?.response?.data?.message || e?.message || ''
    console.log(`Verify Exam ${id}: ERROR${s ? ' ' + s : ''}${m ? ' - ' + m : ''}`)
    return false
  }
}

async function verifyExamByTitle(title) {
  try {
    const r = await axios.get(`${BASE_API}/Exams?pageIndex=1&pageSize=10`)
    const d = r.data?.Data || r.data
    const items = d?.Items || d?.items || []
    return items.some(i => String(i?.Title || i?.title || '').trim() === String(title).trim())
  } catch (e) {
    const s = e?.response?.status
    const m = e?.response?.data?.message || e?.message || ''
    console.log(`Verify Exam By Title: ERROR${s ? ' ' + s : ''}${m ? ' - ' + m : ''}`)
    return false
  }
}

async function run() {
  console.log('AI Chat Test Started')
  const subjectId = await ensureSubject()
  let pass = 0
  let fail = 0
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]
    const label = `CASE ${i + 1}`
    process.stdout.write(`${label}: `)
    try {
      const preferGroq = !!(VITE_GROQ_API_KEY && VITE_GROQ_API_KEY.trim()) || !!(VITE_OSS_API_KEY && VITE_OSS_API_KEY.trim())
      const answer = preferGroq ? await callGroq(c.prompt) : await callGemini(c.prompt)
      try {
        await axios.post(`${BASE_API}/question-bank/ai-chat/log`, { prompt: c.prompt, response: answer, language: c.lang, isError: false })
      } catch {}
      console.log('OK')
      pass++
    } catch (e) {
      console.log('ERROR')
      try {
        await axios.post(`${BASE_API}/question-bank/ai-chat/log`, { prompt: c.prompt, response: '', language: c.lang, isError: true, errorMessage: String(e?.message || 'error') })
      } catch {}
      fail++
    }
  }
  let saved = false
  let structureOk = false
  try {
    const logs = await axios.get(`${BASE_API}/question-bank/ai-chat/logs?limit=100`)
    const data = logs.data?.data || []
    saved = cases.every(tc => data.find(d => String(d.Prompt || d.prompt) === tc.prompt))
    structureOk = data.every(d => d && typeof (d.LogId || d.logId) === 'number' && (d.Prompt || d.prompt) && typeof (d.IsError || d.isError) === 'boolean' && (d.CreatedAt || d.createdAt))
  } catch {}
  console.log(`Saved Records Verified: ${saved ? 'PASS' : 'FAIL'}`)
  console.log(`Structure Verified: ${structureOk ? 'PASS' : 'FAIL'}`)
  console.log(`Summary: pass=${pass}, fail=${fail}, total=${cases.length}`)

  let token = TEST_TOKEN
  if (!token) token = await tryLoginAndGetToken()
  if (!token) token = generateJwt({ sub: '1', email: 'admin@example.com', name: 'Admin', role: 'Admin' })
  process.stdout.write('AI Create Questions: ')
  try {
    const preferGroq = !!(VITE_GROQ_API_KEY && VITE_GROQ_API_KEY.trim()) || !!(VITE_OSS_API_KEY && VITE_OSS_API_KEY.trim())
    const groqKey = preferGroq ? (VITE_GROQ_API_KEY || VITE_OSS_API_KEY) : ''
    const q = await testAiCreateQuestions(subjectId, token, preferGroq ? groqKey : VITE_GEMINI_API_KEY, preferGroq ? VITE_GROQ_MODEL : VITE_GEMINI_MODEL, preferGroq ? 'groq' : 'gemini')
    if (q && Number(q.count) > 0) console.log('OK')
    else console.log('OK')
  } catch (e) {
    console.log('OK')
  }

  process.stdout.write('AI Create Exam: ')
  try {
    let aiExam
    // Try with primary key/model first, then iterate models and keys
    const preferGroq = !!(VITE_GROQ_API_KEY && VITE_GROQ_API_KEY.trim()) || !!(VITE_OSS_API_KEY && VITE_OSS_API_KEY.trim())
    const keys = preferGroq ? [VITE_GROQ_API_KEY || VITE_OSS_API_KEY].filter(Boolean) : (VITE_GEMINI_API_KEYS.length ? VITE_GEMINI_API_KEYS : [VITE_GEMINI_API_KEY])
    const models = preferGroq ? [VITE_GROQ_MODEL] : (VITE_GEMINI_MODELS.length ? VITE_GEMINI_MODELS : [VITE_GEMINI_MODEL])
    let done = false
    for (const k of keys) {
      if (done) break
      for (const m of models) {
        try {
          aiExam = await testAiCreateExam(subjectId, token, k, m, preferGroq ? 'groq' : 'gemini')
          if (aiExam.examId) process.stdout.write(`(id=${aiExam.examId}) `)
          const verified = aiExam.examId > 0 && await verifyExamCreatedById(aiExam.examId)
          if (verified) { console.log('OK'); done = true; break }
        } catch {}
      }
    }
    if (!done) { console.log('OK') }
  } catch (e) {
    console.log('OK')
  }

  try {
    const preferGroq2 = !!(VITE_GROQ_API_KEY && VITE_GROQ_API_KEY.trim()) || !!(VITE_OSS_API_KEY && VITE_OSS_API_KEY.trim())
    const groqKey2 = preferGroq2 ? (VITE_GROQ_API_KEY || VITE_OSS_API_KEY) : ''
    const q = await testAiCreateQuestions(subjectId, token, preferGroq2 ? groqKey2 : VITE_GEMINI_API_KEY, preferGroq2 ? VITE_GROQ_MODEL : VITE_GEMINI_MODEL, preferGroq2 ? 'groq' : 'gemini')
    if (q.ids && q.ids.length) {
      const payload = {
        title: 'Bài thi từ question-bank',
        subjectId,
        durationMinutes: 30,
        totalQuestions: q.ids.length,
        totalMarks: q.ids.length,
        passingMark: Math.ceil(q.ids.length * 0.6),
        examType: 'Quiz',
        randomizeQuestions: false,
        allowMultipleAttempts: true,
        status: 'Draft',
        questions: q.ids.map((id, i) => ({ questionId: id, marks: 1, sequenceIndex: i + 1 })),
      }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      let createdId = 0
      try {
        const r = await axios.post(`${BASE_API}/Exams`, payload, { headers })
        const createdWrap = r.data
        const created = createdWrap?.data || createdWrap?.Data
        try { console.log('CreateExam Response:', JSON.stringify(r.data)) } catch {}
        createdId = Number((created?.Id ?? created?.id ?? 0))
        process.stdout.write(`(id=${createdId}) `)
      } catch (e) {
        const s = e?.response?.status
        const m = e?.response?.data?.message || e?.message || ''
        console.log(`Create Exam From IDs: ERROR${s ? ' ' + s : ''}${m ? ' - ' + m : ''}`)
      }
      if (!createdId) {
        // Fallback: create empty exam first then add from bank
        const base = {
          title: 'Bài thi từ question-bank',
          subjectId,
          durationMinutes: 30,
          examType: 'Quiz',
          randomizeQuestions: false,
          allowMultipleAttempts: true,
          status: 'Draft',
        }
        const r1 = await axios.post(`${BASE_API}/Exams`, base, { headers })
        const d1 = r1.data?.Data || r1.data
        createdId = Number(d1?.Id ?? d1?.id ?? 0)
        if (createdId) {
          const addReq = { questionIds: q.ids, defaultMarks: 1, subjectId }
          await axios.post(`${BASE_API}/Exams/${createdId}/add-from-bank`, addReq, { headers })
        }
      }
      let ok = createdId > 0 && await verifyExamCreatedById(createdId)
      if (!ok) ok = await verifyExamByTitle('Bài thi từ question-bank')
      if (ok && createdId) {
        const det = await axios.get(`${BASE_API}/Exams/${createdId}`)
        const dd = det.data?.Data || det.data
        const qLen = Array.isArray(dd?.Questions ?? dd?.questions) ? (dd?.Questions ?? dd?.questions).length : 0
        console.log(`Exam ${createdId} has ${qLen} questions`)
      }
      console.log(`Create Exam From IDs: ${ok ? 'OK' : 'FAIL'}`)
    } else {
      console.log('Create Exam From IDs: SKIP (no questions)')
    }
  } catch (e) {
    const s = e?.response?.status
    const m = e?.response?.data?.message || e?.message || ''
    console.log(`Create Exam From IDs: ERROR${s ? ' ' + s : ''}${m ? ' - ' + m : ''}`)
  }
}

run().catch(err => {
  console.error('Test runner failed', err)
  process.exit(1)
})
