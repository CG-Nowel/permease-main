export const BRAND_COLORS = {
  navyDark: '#0B1B3D',
  royalBlue: '#1E40AF',
  metallicGold: '#D4AF37',
  champagneGold: '#F3E5AB',
  white: '#FFFFFF',
  bgBase: '#F8FAFC',
  statusCleared: '#10B981',
  statusBalance: '#EF4444',
  statusWarning: '#F59E0B',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  KIOSK: '/kiosk',
  REGISTRAR: {
    STUDENTS: '/registrar/students',
    REGISTER: '/registrar/register',
    PROMISSORY: '/registrar/promissory',
  },
  ACCOUNTING: {
    BALANCES: '/accounting/balances',
    REPRINTS: '/accounting/reprints',
    HISTORY: '/accounting/history',
    PROMISSORY: '/accounting/promissory',
  },
  PRINT_PERMIT: (id: number | string) => `/print/permit/${id}`,
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/login',
    RFID_LOGIN: '/api/login/rfid',
    LOGOUT: '/api/logout',
    USER: '/api/user',
  },
  USERS: {
    LIST: '/api/users',
    ASSIGN_RFID: (id: number) => `/api/users/${id}/rfid`,
  },
  REGISTRAR: {
    STUDENTS: '/api/students',
    ASSIGN_RFID: (id: number) => `/api/students/${id}/rfid`,
  },
  ACCOUNTING: {
    STUDENTS: '/api/accounting/students',
    FINANCIAL_STATUS: (id: number) => `/api/accounting/students/${id}/financial-status`,
    REPRINT_PAYMENT: (id: number) => `/api/accounting/students/${id}/reprint-payment`,
  },
  KIOSK: {
    SCAN: '/api/kiosk/scan',
    PRINT: '/api/kiosk/print',
    REPRINT: '/api/kiosk/reprint',
  },
  DASHBOARD: {
    STATS: '/api/dashboard/statistics',
    ACTIVITY: '/api/activity',
  },
  PROMISSORY: {
    LIST: '/api/promissory-requests',
    CREATE: '/api/promissory-requests',
    SHOW: (id: number | string) => `/api/promissory-requests/${id}`,
    APPROVE: (id: number | string) => `/api/promissory-requests/${id}/approve`,
    REJECT: (id: number | string) => `/api/promissory-requests/${id}/reject`,
  },
  ACADEMIC_TERMS: {
    LIST: '/api/academic-terms',
    CREATE: '/api/academic-terms',
    SET_ACTIVE: '/api/academic-terms/set-active',
    SET_EXAM_PERIOD: '/api/academic-terms/set-exam-period',
  },
} as const;

export const EXAM_PERIODS = ['Prelim', 'Midterms', 'Pre-Finals', 'Finals'] as const;

export type ExamPeriod = (typeof EXAM_PERIODS)[number];

export const normalizeExamPeriod = (value?: string | null): ExamPeriod => {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'prelim' || normalized === 'prelims') return 'Prelim';
  if (normalized === 'midterm' || normalized === 'midterms') return 'Midterms';
  if (normalized === 'pre-final' || normalized === 'pre-finals' || normalized === 'prefinals' || normalized === 'semi-finals') {
    return 'Pre-Finals';
  }
  if (normalized === 'final' || normalized === 'finals') return 'Finals';
  return 'Prelim';
};

