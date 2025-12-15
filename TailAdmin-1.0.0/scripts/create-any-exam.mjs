import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const root = process.cwd()
const envPath = path.join(root, '.env')
let VITE_GROQ_API_KEY = ''
let VITE_GROQ_MODEL = 'llama-3.3-70b-versatile'
let BASE_API = 'http://localhost:5000/api'

// 1. Load Env
try {
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const m1 = line.match(/^VITE_GROQ_API_KEY\s*=\s*(.+)$/)
      if (m1) VITE_GROQ_API_KEY = m1[1].trim()
      const m2 = line.match(/^VITE_GROQ_MODEL\s*=\s*(.+)$/)
      if (m2) VITE_GROQ_MODEL = m2[1].trim()
      const m3 = line.match(/^VITE_API_BASE_URL\s*=\s*(.+)$/)
      if (m3) {
        let val = m3[1].trim()
        if (!val.endsWith('/api')) val += '/api'
        BASE_API = val
      }
    }
  }
} catch (e) {
  console.error('Error loading env:', e)
}

function log(msg, type = 'INFO') {
  const ts = new Date().toISOString()
  console.log(`[${ts}] [${type}] ${msg}`)
}

function b64url(input) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(String(input))
  return b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function generateJwt({ sub = '1', email = 'admin@example.com', name = 'Admin', role = 'Admin', minutes = 30 }) {
  const iss = 'AuthService'
  const aud = 'AuthService_Client'
  const key = 'CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_32+_CHARS'
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

async function callAiToGenerateQuestions(topic, count = 5) {
  if (!VITE_GROQ_API_KEY) throw new Error('Missing VITE_GROQ_API_KEY')
  
  const prompt = `Create ${count} multiple-choice questions about "${topic}" in Vietnamese.\n  Return ONLY a valid JSON array of objects. No markdown, no explanation.\n  Format: [{"question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string (matching one option)"}]`

  log(`Calling AI (${VITE_GROQ_MODEL}) to generate ${count} questions on '${topic}'...`)

  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: VITE_GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const content = res.data?.choices?.[0]?.message?.content || ''
    const clean = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const json = JSON.parse(clean)
    
    if (!Array.isArray(json) || json.length === 0) throw new Error('Invalid JSON from AI')
    log(`AI generated ${json.length} questions.`, 'SUCCESS')
    return json
  } catch (e) {
    log(`AI Generation failed: ${e.message}`, 'ERROR')
    if (e.response) log(`AI Response: ${JSON.stringify(e.response.data)}`, 'DEBUG')
    throw e
  }
}

async function ensureSubject(token, topic) {
  let subjectName = topic
  if (topic.toLowerCase().includes('toán') || topic.toLowerCase().includes('math')) subjectName = 'Toán Học'
  else subjectName = topic.split(' ').slice(0, 3).join(' ') // Use first 3 words of topic

  try {
    // Try to find existing
    const g = await axios.get(`${BASE_API}/subjects`, { headers: { Authorization: `Bearer ${token}` } })
    const list = g.data?.data || g.data?.Data || []
    const existing = list.find(s => s.name?.toLowerCase() === subjectName.toLowerCase())
    if (existing) return existing.subjectId

    // Create new
    log(`Creating new subject: ${subjectName}`)
    try {
       const c = await axios.post(`${BASE_API}/subjects`, { name: subjectName, description: `Topic: ${topic}` }, { headers: { Authorization: `Bearer ${token}` } })
       return c.data?.data?.subjectId || c.data?.subjectId
    } catch {
       const d = await axios.post(`${BASE_API}/question-bank/debug/create-subject`, { name: subjectName }, { headers: { Authorization: `Bearer ${token}` } })
       return d.data?.subjectId || 1
    }
  } catch {
    return 1 // Fallback to default
  }
}

async function createExamFlow(topic, count = 3) {
  log(`Starting Exam Creation Flow for topic: "${topic}"`)
  
  const token = generateJwt({ sub: '1', role: 'Admin' })
  
  // 1. Generate Content
  let questionsData
  try {
    questionsData = await callAiToGenerateQuestions(topic, count)
  } catch (e) {
    log('Aborting due to AI failure.', 'FATAL')
    return
  }

  // 2. Subject
  const subjectId = await ensureSubject(token, topic)
  log(`Subject ID: ${subjectId}`)

  // 3. Save Questions to DB (QuestionBank)
  const questionIds = []
  for (const q of questionsData) {
    try {
      const payload = {
        SubjectId: subjectId,
        Content: q.question,
        QuestionType: 'MultipleChoice',
        Difficulty: 'Medium',
        Marks: 1,
        AnswerOptions: q.options.map((opt, idx) => ({
          Content: opt,
          IsCorrect: opt === q.correctAnswer,
          OrderIndex: idx + 1
        }))
      }
      const res = await axios.post(`${BASE_API}/question-bank`, payload, { headers: { Authorization: `Bearer ${token}` } })
      const qId = res.data?.data?.questionId || res.data?.data?.QuestionId || res.data?.Data?.QuestionId || res.data?.data?.id
      if (qId) questionIds.push(qId)
    } catch (e) {
      log(`Failed to save question: "${q.question}". Error: ${e.message}`, 'WARN')
    }
  }

  if (questionIds.length === 0) {
    log('No questions saved. Aborting.', 'FATAL')
    return
  }
  log(`Saved ${questionIds.length} questions to database.`, 'SUCCESS')

  // 4. Create Exam
  try {
    const examQuestions = questionIds.map((qid, index) => ({
      QuestionId: qid,
      Marks: 1,
      SequenceIndex: index + 1
    }))

    const examPayload = {
      Title: `Bài thi: ${topic}`,
      SubjectId: subjectId,
      DurationMinutes: 15,
      TotalQuestions: questionIds.length,
      TotalMarks: questionIds.length,
      Status: 'Published',
      Description: `Generated by AI (${VITE_GROQ_MODEL}) on ${new Date().toLocaleString()}`,
      Questions: examQuestions
    }
    
    log(`Creating exam with payload: ${JSON.stringify(examPayload, null, 2)}`)
    const examRes = await axios.post(`${BASE_API}/Exams`, examPayload, { headers: { Authorization: `Bearer ${token}` } })
    const examId = examRes.data?.data?.id || examRes.data?.Data?.Id || examRes.data?.data?.examId || examRes.data?.Data?.ExamId
    
    if (!examId) {
        log(`Response: ${JSON.stringify(examRes.data)}`, 'DEBUG')
        throw new Error('No Exam ID returned')
    }
    
    log(`Exam created successfully! ID: ${examId} - "${examPayload.Title}"`, 'SUCCESS')
    
    // Verify
    const verify = await axios.get(`${BASE_API}/Exams/${examId}`, { headers: { Authorization: `Bearer ${token}` } })
    const vData = verify.data?.data || verify.data?.Data
    log(`Verification: Exam has ${vData?.questions?.length || vData?.Questions?.length} questions.`, 'INFO')

    return examId
  } catch (e) {
    log(`Failed to create exam: ${e.message}`, 'ERROR')
    if (e.response) {
        log(`Status: ${e.response.status}`, 'ERROR')
        log(`Data: ${JSON.stringify(e.response.data)}`, 'ERROR')
    }
    return null
  }
}

// Run with args or default
const args = process.argv.slice(2)
const topic = args[0] || 'Lịch sử Việt Nam thời nhà Trần'
createExamFlow(topic)
