export type UserRole = 'REGISTRAR' | 'ACCOUNTING';

export type FinancialStatusType = 'CLEARED' | 'WITH_BALANCE';

export type PermitStatusType = 'AVAILABLE' | 'PRINTED' | 'BLOCKED';

export type PrintType = 'INITIAL' | 'REPRINT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  rfid_uid?: string | null;
  rfid_card?: RfidCard | null;
  created_at?: string;
  updated_at?: string;
}

export interface RfidCard {
  id?: number;
  student_id?: number | null;
  user_id?: number | null;
  rfid_uid: string;
  status: 'ACTIVE' | 'LOST' | 'DEACTIVATED';
  registered_by?: number;
  registered_at?: string;
}

export interface FinancialStatusRecord {
  id: number;
  student_id: number;
  status: FinancialStatusType;
  updated_by?: number;
  updated_at?: string;
}

export interface TestPermit {
  id: number;
  student_id: number;
  permit_number: string;
  academic_year: string;
  semester: string;
  exam_period: string;
  status: PermitStatusType;
  print_count: number;
  reprint_allowed: boolean;
  first_printed_at?: string | null;
  last_printed_at?: string | null;
}

export interface Student {
  id: number;
  student_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  grade_year_level: string;
  section: string;
  course: string;
  program: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  student_type?: 'Regular' | 'Irregular';
  semester?: string;
  academic_year?: string;
  units?: number;
  rfid_card?: RfidCard | null;
  financial_status?: FinancialStatusRecord | null;
  current_permit?: TestPermit | null;
  subjects?: PresetSubject[];
  balance_amount?: number;
  active_promissory?: PromissoryRequest | null;
  created_at?: string;
  updated_at?: string;
}


export type PromissoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED';

export interface PromissoryRequest {
  id: number;
  request_number: string;
  student_id: number;
  student_number: string;
  student_name: string;
  course_program: string;
  year_section: string;
  exam_period: string;
  academic_year: string;
  semester: string;
  current_balance: number;
  amount_payable_now?: number;
  promissory_amount: number;
  reason: string;
  promise_to_pay_date: string;
  guarantor_name?: string;
  guarantor_contact?: string;
  guarantor_relationship?: string;
  requested_by: string;
  registrar_notes?: string;
  created_at: string;
  status: PromissoryStatus;
  
  // Accounting resolution fields
  approved_by?: string;
  accounting_notes?: string;
  official_receipt_number?: string;
  amount_paid?: number;
  settled_at?: string;
}

export interface PresetSubject {
  code: string;
  title: string;
  units: number;
  type: 'Major' | 'General Education' | 'Elective' | 'Institutional';
}

export interface FinancialStatusHistory {
  id: number;
  student_id: number;
  previous_status: FinancialStatusType;
  new_status: FinancialStatusType;
  notes?: string;
  updated_by: number;
  operator_name?: string;
  created_at: string;
}

export interface ReprintPayment {
  id: number;
  student_id: number;
  test_permit_id: number;
  amount: number;
  reference_number: string;
  status: 'PAID' | 'CONSUMED' | 'VOID';
  processed_by: number;
  cashier_name?: string;
  paid_at: string;
  consumed_at?: string | null;
}

export interface PermitPrintLog {
  id: number;
  student_id: number;
  test_permit_id: number;
  print_type: PrintType;
  reprint_payment_id?: number | null;
  kiosk_identifier: string;
  printed_at: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number | null;
  user_name?: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}
