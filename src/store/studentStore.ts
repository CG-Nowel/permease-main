import { useState, useEffect, useCallback } from 'react';
import type { Student, PromissoryRequest, FinancialStatusHistory, FinancialStatusType } from '../types/index.ts';
import { api } from '../lib/api.ts';
import { INITIAL_STUDENTS } from '../mock/seedStudents.ts';

const STORAGE_KEYS = {
  STUDENTS: 'permease_students_data',
  PROMISSORY: 'permease_promissory_requests',
  HISTORY: 'permease_financial_history',
};

const DATA_CHANGE_EVENT = 'permease_student_data_changed';

// Helper to get stored students (defaults to seeded mock students if empty)
export const getStoredStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored students', e);
  }
  return INITIAL_STUDENTS;
};

// Helper to get stored promissory requests
export const getStoredPromissoryRequests = (): PromissoryRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMISSORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored promissory requests', e);
  }
  return [];
};

// Helper to get stored history
export const getStoredHistory = (): FinancialStatusHistory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored history', e);
  }
  return [];
};

// Broadcast local event
const notifyDataChanged = () => {
  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT));
};

// Sync students directly from Laravel backend database
export const syncStudentsFromBackend = async (): Promise<Student[]> => {
  try {
    const res = await api.get('/api/students');
    if (res.data?.success && Array.isArray(res.data.data)) {
      const currentRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      const newRaw = JSON.stringify(res.data.data);
      if (currentRaw !== newRaw) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, newRaw);
        notifyDataChanged();
      }
      return res.data.data;
    }
  } catch (err) {
    console.error('Failed to sync students from API:', err);
  }
  return getStoredStudents();
};

export const studentStore = {
  getStudents: getStoredStudents,
  getPromissoryRequests: getStoredPromissoryRequests,
  getHistory: getStoredHistory,
  syncStudentsFromBackend,

  getStudentById(id: number): Student | undefined {
    return getStoredStudents().find((s) => s.id === id);
  },

  getStudentByNumberOrRfid(query: string): Student | undefined {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return getStoredStudents().find(
      (s) =>
        s.student_number.toLowerCase() === q ||
        s.rfid_card?.rfid_uid?.toLowerCase() === q ||
        `${s.first_name} ${s.last_name}`.toLowerCase() === q
    );
  },

  async fetchLiveStudentForKiosk(identifier: string): Promise<Student | null> {
    const query = identifier.trim();
    if (!query) return null;

    try {
      const res = await api.get(`/api/students/${encodeURIComponent(query)}`);
      if (res.data?.success && res.data.data) {
        const liveStudent = res.data.data as Student;
        const students = getStoredStudents();
        const exists = students.some((s) => s.id === liveStudent.id);
        const updated = exists
          ? students.map((s) => (s.id === liveStudent.id ? liveStudent : s))
          : [liveStudent, ...students];
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
        notifyDataChanged();
        return liveStudent;
      }
      return null;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      // Fall back to local cache only if backend is unreachable
      return studentStore.getStudentByNumberOrRfid(query) || null;
    }
  },

  createPromissoryRequest(data: {
    id?: number;
    requestNumber?: string;
    studentId: number;
    examPeriod: string;
    academicYear?: string;
    semester?: string;
    currentBalance?: number;
    amountPayableNow?: number;
    promissoryAmount?: number;
    reason: string;
    promiseToPayDate?: string;
    guarantorName?: string;
    guarantorContact?: string;
    guarantorRelationship?: string;
    requestedBy?: string;
    registrarNotes?: string;
  }): PromissoryRequest {
    const students = getStoredStudents();
    const student = students.find((s) => s.id === data.studentId);
    if (!student) throw new Error('Student not found');

    const existingRequests = getStoredPromissoryRequests();
    const nextNumber = existingRequests.length + 1;
    const requestNumber = data.requestNumber || `PN-2026-${String(nextNumber).padStart(4, '0')}`;

    const newRequest: PromissoryRequest = {
      id: data.id || Date.now(),
      request_number: requestNumber,
      student_id: student.id,
      student_number: student.student_number,
      student_name: `${student.first_name} ${student.last_name}`,
      course_program: `${student.course} ${student.program}`,
      year_section: `${student.grade_year_level} - ${student.section}`,
      exam_period: data.examPeriod || 'Prelim',
      academic_year: data.academicYear || '2026-2027',
      semester: data.semester || '1st Sem',
      current_balance: data.currentBalance ?? 0,
      amount_payable_now: data.amountPayableNow || 0,
      promissory_amount: data.promissoryAmount ?? (data.amountPayableNow || 0),
      reason: data.reason,
      promise_to_pay_date: data.promiseToPayDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      guarantor_name: data.guarantorName || '',
      guarantor_contact: data.guarantorContact || '',
      guarantor_relationship: data.guarantorRelationship || '',
      requested_by: data.requestedBy || 'Registrar Staff',
      registrar_notes: data.registrarNotes || '',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'PENDING',
    };

    student.active_promissory = newRequest;
    const updatedStudents = students.map((s) => (s.id === student.id ? student : s));
    const updatedRequests = [newRequest, ...existingRequests.filter((r) => r.request_number !== requestNumber)];

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    localStorage.setItem(STORAGE_KEYS.PROMISSORY, JSON.stringify(updatedRequests));

    notifyDataChanged();
    return newRequest;
  },

  approvePromissoryAndClearBilling(data: {
    requestId: number;
    requestNumber?: string;
    studentId?: number;
    studentNumber?: string;
    orNumber: string;
    amountPaid: number;
    notes?: string;
    cashierName: string;
    promissoryRequest?: PromissoryRequest;
  }): { student: Student; request: PromissoryRequest } {
    const requests = getStoredPromissoryRequests();
    const students = getStoredStudents();
    const history = getStoredHistory();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Locate the promissory request by ID, request_number, or studentId
    const reqIndex = requests.findIndex(
      (r) =>
        r.id === data.requestId ||
        (data.requestNumber && r.request_number === data.requestNumber) ||
        (data.studentId && r.student_id === data.studentId && r.status === 'PENDING')
    );

    let baseReq: PromissoryRequest;
    if (reqIndex !== -1) {
      baseReq = requests[reqIndex];
    } else if (data.promissoryRequest) {
      baseReq = data.promissoryRequest;
    } else {
      baseReq = {
        id: data.requestId,
        request_number: data.requestNumber || `PN-2026-${String(data.requestId).padStart(4, '0')}`,
        student_id: data.studentId || 0,
        student_number: data.studentNumber || 'N/A',
        student_name: 'Student',
        course_program: '',
        year_section: '',
        exam_period: 'Prelim',
        academic_year: '2026-2027',
        semester: '1st Sem',
        current_balance: 0,
        amount_payable_now: data.amountPaid,
        promissory_amount: data.amountPaid,
        amount_paid: data.amountPaid,
        reason: 'Promissory note clearance',
        status: 'PENDING',
        created_at: timestamp,
      };
    }

    const updatedRequest: PromissoryRequest = {
      ...baseReq,
      status: 'APPROVED',
      official_receipt_number: data.orNumber,
      amount_paid: data.amountPaid,
      accounting_notes: data.notes || baseReq.accounting_notes,
      approved_by: data.cashierName,
      settled_at: timestamp,
    };

    if (reqIndex !== -1) {
      requests[reqIndex] = updatedRequest;
    } else {
      requests.unshift(updatedRequest);
    }

    // 2. Locate target student by studentId, studentNumber, or request association
    const targetStudentId = data.studentId || baseReq.student_id;
    const targetStudentNum = (data.studentNumber || baseReq.student_number || '').trim().toLowerCase();

    let studentIndex = students.findIndex(
      (s) =>
        (targetStudentId && s.id === targetStudentId) ||
        (targetStudentNum && s.student_number.toLowerCase() === targetStudentNum)
    );

    let student: Student;
    if (studentIndex !== -1) {
      student = students[studentIndex];
    } else {
      student = {
        id: targetStudentId || Date.now(),
        student_number: baseReq.student_number || `2026-${String(targetStudentId || 1).padStart(5, '0')}`,
        first_name: baseReq.student_name.split(' ')[0] || 'Student',
        last_name: baseReq.student_name.split(' ').slice(1).join(' ') || 'Record',
        course: baseReq.course_program?.split(' ')[0] || 'BS',
        program: baseReq.course_program?.split(' ').slice(1).join(' ') || 'Information Technology',
        grade_year_level: baseReq.year_section?.split(' - ')[0] || '1st Year',
        section: baseReq.year_section?.split(' - ')[1] || 'Section A',
        status: 'ACTIVE',
        balance_amount: 0,
        financial_status: { id: Date.now(), student_id: targetStudentId || 1, status: 'CLEARED' },
        current_permit: {
          id: Date.now(),
          student_id: targetStudentId || 1,
          permit_number: `TP-2026-${String(targetStudentId || 1).padStart(6, '0')}`,
          academic_year: baseReq.academic_year || '2026-2027',
          semester: baseReq.semester || '1st Semester',
          exam_period: baseReq.exam_period || 'Prelim',
          status: 'AVAILABLE',
          print_count: 0,
          reprint_allowed: false,
        },
      };
      students.unshift(student);
      studentIndex = 0;
    }

    const prevFinancial = student.financial_status?.status || 'WITH_BALANCE';

    // Update financial status to CLEARED
    student.financial_status = {
      id: student.financial_status?.id || Date.now(),
      student_id: student.id,
      status: 'CLEARED',
      updated_at: timestamp,
    };

    // Deduct downpayment from student balance
    if (typeof student.balance_amount === 'number') {
      student.balance_amount = Math.max(0, student.balance_amount - data.amountPaid);
    }

    // Unlock exam permit to AVAILABLE
    if (student.current_permit) {
      student.current_permit.status = 'AVAILABLE';
      student.current_permit.exam_period = baseReq.exam_period || student.current_permit.exam_period || 'Prelim';
    } else {
      student.current_permit = {
        id: Date.now(),
        student_id: student.id,
        permit_number: `TP-2026-${String(student.id).padStart(6, '0')}`,
        academic_year: baseReq.academic_year || student.academic_year || '2026-2027',
        semester: baseReq.semester || student.semester || '1st Semester',
        exam_period: baseReq.exam_period || 'Prelim',
        status: 'AVAILABLE',
        print_count: 0,
        reprint_allowed: false,
      };
    }

    student.active_promissory = updatedRequest;
    students[studentIndex] = student;

    // 3. Append to clearance audit trail
    const newHistoryLog: FinancialStatusHistory = {
      id: Date.now(),
      student_id: student.id,
      previous_status: prevFinancial,
      new_status: 'CLEARED',
      notes: `Promissory Note ${baseReq.request_number} Approved (OR: ${data.orNumber}, Paid: ₱${data.amountPaid.toFixed(2)}). Billing cleared and permit unlocked.`,
      updated_by: 2,
      operator_name: data.cashierName,
      created_at: timestamp,
    };

    const updatedHistory = [newHistoryLog, ...history];

    localStorage.setItem(STORAGE_KEYS.PROMISSORY, JSON.stringify(requests));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

    notifyDataChanged();
    return { student, request: updatedRequest };
  },

  async updateStudentBillingStatus(
    studentId: number,
    newStatus: FinancialStatusType,
    notes: string,
    operatorName: string
  ): Promise<Student> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    try {
      // Persist directly to backend database
      const res = await api.post(`/api/students/${studentId}/billing-status`, {
        status: newStatus,
        notes,
        operator_name: operatorName,
      });

      if (res.data?.success && res.data.data?.history) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(res.data.data.history));
      }
    } catch (e) {
      console.warn('Backend billing update failed, updating local state:', e);
    }

    const students = getStoredStudents();
    const history = getStoredHistory();
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const prev = student.financial_status?.status || 'WITH_BALANCE';

    student.financial_status = {
      id: student.financial_status?.id || Date.now(),
      student_id: student.id,
      status: newStatus,
      updated_at: timestamp,
    };

    if (student.current_permit) {
      student.current_permit.status = newStatus === 'CLEARED' ? 'AVAILABLE' : 'BLOCKED';
    }

    const updatedStudents = students.map((s) => (s.id === student.id ? student : s));

    const newLog: FinancialStatusHistory = {
      id: Date.now(),
      student_id: student.id,
      previous_status: prev,
      new_status: newStatus,
      notes: notes || `Status changed to ${newStatus}`,
      updated_by: 2,
      operator_name: operatorName,
      created_at: timestamp,
    };

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    if (!history.some((h) => h.created_at === timestamp && h.student_id === student.id)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([newLog, ...history]));
    }

    notifyDataChanged();
    return student;
  },

  markPermitPrinted(studentId: number): Student {
    const students = getStoredStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (student.current_permit) {
      student.current_permit.status = 'PRINTED';
      student.current_permit.print_count = (student.current_permit.print_count || 0) + 1;
      student.current_permit.reprint_allowed = false;
      student.current_permit.last_printed_at = timestamp;
      if (!student.current_permit.first_printed_at) {
        student.current_permit.first_printed_at = timestamp;
      }
    } else {
      student.current_permit = {
        id: student.id,
        student_id: student.id,
        permit_number: `TP-2026-${String(student.id).padStart(6, '0')}`,
        academic_year: student.academic_year || '2026-2027',
        semester: student.semester || '1st Semester',
        exam_period: 'Prelim',
        status: 'PRINTED',
        print_count: 1,
        reprint_allowed: false,
        first_printed_at: timestamp,
        last_printed_at: timestamp,
      };
    }

    const updatedStudents = students.map((s) => (s.id === student.id ? student : s));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));

    notifyDataChanged();

    // Persist print status & consume authorized reprint token on backend
    void api
      .post(`/api/students/${studentId}/record-print`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const syncedStudent = res.data.data as Student;
          const current = getStoredStudents();
          const next = current.map((s) => (s.id === syncedStudent.id ? syncedStudent : s));
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
          notifyDataChanged();
        }
      })
      .catch((err) => {
        console.warn('Backend record-print sync failed, kept local state:', err);
      });

    return student;
  },

  addStudent(newStudent: Student): void {
    const students = getStoredStudents();
    const filtered = students.filter(
      (s) => s.id !== newStudent.id && s.student_number !== newStudent.student_number
    );
    const updated = [newStudent, ...filtered];
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
    notifyDataChanged();
  },

  updateStudent(updatedStudent: Student): void {
    const students = getStoredStudents();
    const next = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
    notifyDataChanged();
  },

  resetStore() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.PROMISSORY);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    notifyDataChanged();
  },
};

// React hook for reactive consumption across components
export const useStudentStore = () => {
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [promissoryRequests, setPromissoryRequests] = useState<PromissoryRequest[]>(getStoredPromissoryRequests);
  const [history, setHistory] = useState<FinancialStatusHistory[]>(getStoredHistory);

  const refresh = useCallback(() => {
    setStudents(getStoredStudents());
    setPromissoryRequests(getStoredPromissoryRequests());
    setHistory(getStoredHistory());
  }, []);

  useEffect(() => {
    // Initial sync from Laravel backend database
    syncStudentsFromBackend().then((backendStudents) => {
      if (backendStudents.length > 0) {
        setStudents(backendStudents);
      }
    });

    const handleSync = () => refresh();
    window.addEventListener(DATA_CHANGE_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    const handleFocus = () => {
      void syncStudentsFromBackend();
    };
    window.addEventListener('focus', handleFocus);

    // Auto-sync polling every 4 seconds to reflect prints occurring on external kiosks/terminals
    const pollInterval = setInterval(() => {
      void syncStudentsFromBackend();
    }, 4000);

    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [refresh]);

  return {
    students,
    promissoryRequests,
    history,
    refresh,
    getStudentById: studentStore.getStudentById,
    getStudentByNumberOrRfid: studentStore.getStudentByNumberOrRfid,
    fetchLiveStudentForKiosk: studentStore.fetchLiveStudentForKiosk,
    createPromissoryRequest: studentStore.createPromissoryRequest,
    approvePromissoryAndClearBilling: studentStore.approvePromissoryAndClearBilling,
    updateStudentBillingStatus: studentStore.updateStudentBillingStatus,
    addStudent: studentStore.addStudent,
    updateStudent: studentStore.updateStudent,
    markPermitPrinted: studentStore.markPermitPrinted,
    resetStore: studentStore.resetStore,
  };
};
