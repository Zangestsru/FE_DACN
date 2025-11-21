// API Configuration for Teacher
// Connected to API Gateway running on localhost:5000

export const API_CONFIG = {
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
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
  
  // Exams endpoints (port 5002 via gateway)
  exams: {
    getAll: '/Exams',
    getById: (id: string) => `/Exams/${id}`,
    create: '/Exams',
    update: (id: string) => `/Exams/${id}`,
    delete: (id: string) => `/Exams/${id}`,
  },
  
  // Question Bank endpoints (port 5002 via gateway)
  questions: {
    getAll: '/question-bank',
    getById: (id: string) => `/question-bank/${id}`,
    create: '/question-bank',
    update: (id: string) => `/question-bank/${id}`,
    delete: (id: string) => `/question-bank/${id}`,
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
    create: '/Materials',
    update: (id: string) => `/Materials/${id}`,
    delete: (id: string) => `/Materials/${id}`,
  },
};

