// API Configuration for TailAdmin
// Connected to API Gateway running on localhost:5000

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {} as any;
const base = (env.VITE_API_BASE_URL && String(env.VITE_API_BASE_URL).trim()) ? String(env.VITE_API_BASE_URL).trim() : 'http://localhost:5000';
const timeout = (env.VITE_API_TIMEOUT && !isNaN(Number(env.VITE_API_TIMEOUT))) ? Number(env.VITE_API_TIMEOUT) : 30000;

export const API_CONFIG = {
  baseURL: `${base}/api`,
  timeout,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Auth endpoints (port 5001 via gateway)
  auth: {
    login: '/Auth/login',
    logout: '/Auth/logout',
    register: '/Auth/register',
    refresh: '/Auth/refresh',
  },
  
  // Users endpoints (port 5001 via gateway) 
  users: {
    getAll: '/Users',
    getById: (id: string) => `/Users/${id}`,
    create: '/Users',
    update: (id: string) => `/Users/${id}`,
    delete: (id: string) => `/Users/${id}`,
  },
  
  // Admin endpoints (port 5001 via gateway)
  admin: {
    users: {
      getAll: '/Admin/users',
      update: (id: string) => `/Admin/users/${id}`,
      lock: (id: string) => `/Admin/users/${id}/lock`,
      unlock: (id: string) => `/Admin/users/${id}/unlock`,
      updateRole: (id: string) => `/Admin/users/${id}/role`,
      delete: (id: string) => `/Admin/${id}`,
    },
    permissions: {
      getRequests: '/Admin/permissions/requests',
      approve: (id: number | string) => `/Admin/permissions/approve/${id}`,
      reject: (id: number | string) => `/Admin/permissions/reject/${id}`,
    },
    statistics: '/Admin/statistics',
    reports: '/Admin/reports',
    updateReport: (id: string) => `/Admin/reports/${id}`,
    payments: {
      getAll: '/Admin/payments',
      getById: (id: string | number) => `/Admin/payments/${id}`,
    }
  },
  
  // Exams endpoints (port 5002 via gateway)
  exams: {
    getAll: '/Exams',
    getById: (id: string) => `/Exams/${id}`,
    create: '/Exams',
    update: (id: string) => `/Exams/${id}`,
    delete: (id: string) => `/Exams/${id}`,
    purchasePayOS: (id: string | number) => `/Exams/${id}/purchase/payos`,
  },
  
  // Question Bank endpoints (port 5002 via gateway)
  questions: {
    getAll: '/question-bank',
    getById: (id: string) => `/question-bank/${id}`,
    create: '/question-bank',
    update: (id: string) => `/question-bank/${id}`,
    delete: (id: string) => `/question-bank/${id}`,
    generateQuestions: '/question-bank/generate-questions',
    generateAI: '/question-bank/generate-ai',
    aiCreateQuestions: '/question-bank/ai-create-questions',
  },
  
  // Subjects endpoints (port 5002 via gateway)
  subjects: {
    getAll: '/subjects',
    getById: (id: string) => `/subjects/${id}`,
    create: '/subjects',
    update: (id: string) => `/subjects/${id}`,
    delete: (id: string) => `/subjects/${id}`,
  },
  
  // Materials endpoints (port 5003 via gateway)
  materials: {
    getAll: '/Materials',
    getById: (id: string) => `/Materials/${id}`,
    getByCourseId: (courseId: string | number) => `/Materials/by-course/${courseId}`,
    create: '/Materials',
    update: (id: string) => `/Materials/${id}`,
    delete: (id: string) => `/Materials/${id}`,
    extractFile: '/Materials/extract-file',
  },
  
  // Courses endpoints (port 5002 via gateway - ExamsService)
  courses: {
    getAll: '/Courses',
    getById: (id: string) => `/Courses/${id}`,
    create: '/Courses',
    update: (id: string) => `/Courses/${id}`,
    delete: (id: string) => `/Courses/${id}`,
    enroll: (id: string | number) => `/Courses/${id}/enroll`,
  },
  
  // Lessons endpoints (port 5002 via gateway - ExamsService)
  lessons: {
    getByCourseId: (courseId: string | number) => `/Lessons/by-course/${courseId}`,
    getById: (id: string) => `/Lessons/${id}`,
    create: '/Lessons',
    update: (id: string) => `/Lessons/${id}`,
    delete: (id: string) => `/Lessons/${id}`,
  },
  
  // Statistics endpoints (aggregated from multiple services)
  statistics: {
    overall: '/Statistics/overall',
    examResults: (examId: string) => `/Statistics/exam/${examId}/results`,
    examStats: (examId: string) => `/Statistics/exam/${examId}`,
    examsList: '/Statistics/exams',
    userStats: (userId: string) => `/Statistics/user/${userId}`,
    subjects: '/Statistics/subjects',
    export: (examId: string) => `/Statistics/exam/${examId}/export`,
  },
  
  // Reports endpoints (aggregated reporting functionality)
  reports: {
    getAll: '/Reports',
    getById: (id: string) => `/Reports/${id}`,
    create: '/Reports',
    update: (id: string) => `/Reports/${id}`,
    delete: (id: string) => `/Reports/${id}`,
    generate: '/Reports/generate',
    export: (id: string) => `/Reports/${id}/export`,
    templates: '/Reports/templates',
  },
  
  // Feedback endpoints (user feedback and support system)
  feedback: {
    getAll: '/Feedback',
    getById: (id: string) => `/Feedback/${id}`,
    create: '/Feedback',
    update: (id: string) => `/Feedback/${id}`,
    delete: (id: string) => `/Feedback/${id}`,
    respond: (id: string) => `/Feedback/${id}/respond`,
    updateStatus: (id: string) => `/Feedback/${id}/status`,
  },
};
