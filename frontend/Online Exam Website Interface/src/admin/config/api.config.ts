// API Configuration for TailAdmin
// Connected to API Gateway running on localhost:8000

export const API_CONFIG = {
  baseURL: 'http://localhost:5001/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // Auth endpoints (port 5001 via gateway)
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    refresh: '/auth/refresh',
  },
  
  // Users endpoints (port 5001 via gateway) 
  users: {
    getAll: '/users',
    getById: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  
  // Admin endpoints (port 5001 via gateway)
  admin: {
    getAll: '/admin',
    getById: (id: string) => `/admin/${id}`,
    create: '/admin',
    update: (id: string) => `/admin/${id}`,
    delete: (id: string) => `/admin/${id}`,
  },
  
  // Exams endpoints (port 5002 via gateway)
  exams: {
    getAll: '/exams',
    getById: (id: string) => `/exams/${id}`,
    create: '/exams',
    update: (id: string) => `/exams/${id}`,
    delete: (id: string) => `/exams/${id}`,
  },
  
  // Question Bank endpoints (port 5002 via gateway)
  questions: {
    getAll: '/question-bank',
    getById: (id: string) => `/question-bank/${id}`,
    create: '/question-bank',
    update: (id: string) => `/question-bank/${id}`,
    delete: (id: string) => `/question-bank/${id}`,
  },
  
  // Materials endpoints (port 5003 via gateway)
  materials: {
    getAll: '/materials',
    getById: (id: string) => `/materials/${id}`,
    create: '/materials',
    update: (id: string) => `/materials/${id}`,
    delete: (id: string) => `/materials/${id}`,
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