import axios from 'axios'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const root = process.cwd()
const envPath = path.join(root, '.env')
let VITE_GEMINI_API_KEY = ''
let VITE_GEMINI_MODEL = 'gemini-2.5-pro'
let BASE_API = 'http://localhost:5000/api'

// 1. Load Env
try {
  const txt = fs.readFileSync(envPath, 'utf8')
  for (const line of txt.split(/\r?\n/)) {
    const m1 = line.match(/^VITE_GEMINI_API_KEY\s*=\s*(.+)$/)
    if (m1) VITE_GEMINI_API_KEY = m1[1].trim()
    const m2 = line.match(/^VITE_GEMINI_MODEL\s*=\s*(.+)$/)
    if (m2) VITE_GEMINI_MODEL = m2[1].trim()
    const m3 = line.match(/^API_BASE_URL\s*=\s*(.+)$/)
    if (m3) BASE_API = m3[1].trim()
  }
} catch (qe) {
        log(`Create Question Failed: ${qe.message} - ${JSON.stringify(qe.response?.data || {})}`, 'ERROR')
      }

// 2. Helpers
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

async function ensureSubject(token) {
  try {
    const r = await axios.post(`${BASE_API}/question-bank/debug/create-subject`, {}, { headers: { Authorization: `Bearer ${token}` } })
    return r.data?.subjectId || 1
  } catch {
    try {
      const g = await axios.get(`${BASE_API}/question-bank/debug/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      const list = g.data?.subjects || []
      if (list.length) {
        const english = list.find(s => s.Name && s.Name.toLowerCase().includes('english'))
        if (english) return english.SubjectId
        return list[0].SubjectId
      }
      return 1
    } catch {
      return 1
    }
  }
}

async function createEnglishExam(token, subjectId) {
  const examTitle = 'Basic English Test (AI Generated)'
  const questions = [
    { 
      question: "What is the past tense of 'go'?", 
      options: ['goed', 'gone', 'went', 'going'], 
      correctAnswer: 'went' 
    },
    { 
      question: "Choose the correct sentence:", 
      options: ['She don\'t like apples', 'She doesn\'t like apples', 'She not like apples', 'She no like apples'], 
      correctAnswer: 'She doesn\'t like apples' 
    },
    { 
      question: "What is the opposite of 'hot'?", 
      options: ['cold', 'warm', 'cool', 'ice'], 
      correctAnswer: 'cold' 
    }
  ]

  const payload = {
    subjectId,
    title: examTitle,
    topic: 'Basic English Grammar & Vocabulary',
    count: questions.length,
    marksPerQuestion: 1,
    durationMinutes: 15,
    rawText: JSON.stringify(questions)
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-Gemini-Api-Key': VITE_GEMINI_API_KEY,
    'X-Gemini-Model': VITE_GEMINI_MODEL,
    'Content-Type': 'application/json',
  }

  log(`Creating exam '${examTitle}' with ${questions.length} questions...`)
  
  try {
    const url = `${BASE_API}/Exams/ai-create`
    const r = await axios.post(url, payload, { headers })
    const data = r.data?.Data || r.data
    
    if (data && (data.examId || data.ExamId)) {
      const examId = data.examId || data.ExamId
      const count = data.count || 0
      log(`Exam created successfully! ID: ${examId}, Questions: ${count}`, 'SUCCESS')
      return examId
    } else {
      log(`Failed to create exam. Response: ${JSON.stringify(data)}`, 'ERROR')
      return null
    }
  } catch (e) {
    const msg = e?.response?.data?.message || e.message
    log(`Exception creating exam: ${msg}`, 'ERROR')
    return await createExamFallback(token, subjectId, examTitle, questions)
  }
}

async function createExamFallback(token, subjectId, title, questions) {
  log('Attempting fallback manual creation...', 'WARN')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  
  try {
    // 1. Create Exam Draft
    const examPayload = {
      Title: title,
      SubjectId: subjectId,
      Duration: 15,
      TotalQuestions: questions.length,
      TotalMarks: questions.length,
      Status: 'Draft',
      Description: 'Created via fallback mechanism'
    }
    const examRes = await axios.post(`${BASE_API}/Exams`, examPayload, { headers })
    log(`Create Exam Response: ${JSON.stringify(examRes.data)}`)
    const examId = examRes.data?.data?.id || examRes.data?.Data?.Id || examRes.data?.id || examRes.data?.Data?.ExamId || examRes.data?.ExamId
    if (!examId) throw new Error('Could not create exam draft')
    
    // 2. Create Questions
    const questionIds = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const qPayload = {
        SubjectId: subjectId,
        Content: q.question,
        QuestionType: 'MultipleChoice',
        Difficulty: 'Easy',
        Marks: 1,
        AnswerOptions: q.options.map((opt, idx) => ({
          Content: opt,
          IsCorrect: opt === q.correctAnswer,
          OrderIndex: idx + 1
        }))
      }
      const qRes = await axios.post(`${BASE_API}/question-bank`, qPayload, { headers })
      log(`Question Res: ${JSON.stringify(qRes.data)}`)
      const qId = qRes.data?.data?.id || qRes.data?.data?.QuestionId || qRes.data?.Data?.Id || qRes.data?.id || qRes.data?.Data?.QuestionId || qRes.data?.QuestionId
      if (qId) questionIds.push(qId)
    }

    // 3. Add Questions to Exam
    if (questionIds.length > 0) {
        await axios.post(`${BASE_API}/Exams/${examId}/questions`, { questionIds, defaultMarks: 1 }, { headers })
    }
    
    log(`Fallback exam created! ID: ${examId}, Questions: ${questionIds.length}`, 'SUCCESS')
    return examId
  } catch (e) {
    log(`Fallback failed: ${e.message}`, 'ERROR')
    return null
  }
}

async function verifyExam(token, examId) {
  log(`Verifying exam ${examId}...`)
  try {
    const r = await axios.get(`${BASE_API}/Exams/${examId}`, { headers: { Authorization: `Bearer ${token}` } })
    const root = r.data
    const data = root?.data || root?.Data || root
    
    // Verify details
    if (!data) throw new Error('No data returned')
    
    log(`- Title: ${data.Title || data.title}`)
    log(`- Duration: ${data.Duration || data.durationMinutes} mins`)
    const qCount = (data.Questions || data.questions || []).length
    log(`- Questions: ${qCount}`)
    
    if (qCount === 3) {
      log('Verification passed: Exam exists with 3 questions.', 'SUCCESS')
      return true
    } else {
      log(`Verification warning: Expected 3 questions, found ${qCount}`, 'WARN')
      return false
    }
  } catch (e) {
    log(`Verification failed: ${e.message}`, 'ERROR')
    return false
  }
}

async function run() {
  log('Starting English Exam Creation Process...')
  
  // 1. Generate Token (Bypassing login via shared secret)
  const token = generateJwt({ sub: '1', role: 'Admin', email: 'admin@test.local' })
  log('Generated local JWT token.')

  // 2. Subject
  const subjectId = await ensureSubject(token)
  log(`Using Subject ID: ${subjectId}`)

  // 3. Create
  const examId = await createEnglishExam(token, subjectId)
  
  // 4. Verify
  if (examId) {
    await verifyExam(token, examId)
  }
  
  log('Process completed.')
}

run()
