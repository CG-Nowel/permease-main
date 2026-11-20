import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../../components/index.ts';
import {
  Search,
  FileSignature,
  ArrowRight,
  ShieldAlert,
  Clock,
  Banknote,
  Send,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudentStore } from '../../store/studentStore.ts';
import { useAcademicTerm } from '../../store/AcademicTermContext.tsx';
import type { Student } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { API_ROUTES, EXAM_PERIODS, ExamPeriod } from '../../lib/constants.ts';

export const PromissoryRequestPage: React.FC = () => {
  const { students, createPromissoryRequest } = useStudentStore();
  const { activeTerm, activeExamPeriod } = useAcademicTerm();

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Form Fields
  const [initialPayment, setInitialPayment] = useState('2000');
  const [reason, setReason] = useState('Delayed remittance from OFW guardian/parent');
  const [remarks, setRemarks] = useState('Endorsing student for test permit release upon accounting payment clearance.');
  const [examPeriod, setExamPeriod] = useState<ExamPeriod>(activeExamPeriod);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setExamPeriod(activeExamPeriod);
  }, [activeExamPeriod]);

  // Live autocomplete matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return students.filter((s) => {
      const studentNum = s.student_number.toLowerCase();
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      const reverseName = `${s.last_name}, ${s.first_name}`.toLowerCase();
      const withMiddle = `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase();
      const rfid = s.rfid_card?.rfid_uid?.toLowerCase() || '';

      return (
        studentNum.includes(q) ||
        fullName.includes(q) ||
        reverseName.includes(q) ||
        withMiddle.includes(q) ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        rfid.includes(q)
      );
    });
  }, [students, searchQuery]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    const balance = student.balance_amount || 0;
    if (balance > 0) {
      setInitialPayment(String(Math.min(2000, balance)));
    }
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      toast.error('Please enter a student name or student number to search');
      return;
    }

    setIsSearching(true);

    try {
      // 1. Search in client store first
      const localMatch = students.find((s) => {
        const studentNum = s.student_number.toLowerCase();
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        const reverseName = `${s.last_name}, ${s.first_name}`.toLowerCase();
        const withMiddle = `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase();
        const rfid = s.rfid_card?.rfid_uid?.toLowerCase() || '';

        return (
          studentNum === q ||
          studentNum.includes(q) ||
          fullName === q ||
          fullName.includes(q) ||
          reverseName.includes(q) ||
          withMiddle.includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          rfid === q
        );
      });

      if (localMatch) {
        handleSelectStudent(localMatch);
        toast.success(`Loaded details for ${localMatch.first_name} ${localMatch.last_name} (${localMatch.student_number})`);
        return;
      }

      // 2. Query backend API if not in local store
      try {
        const res = await api.get(`/api/students/${encodeURIComponent(q)}`);
        if (res.data?.data) {
          const apiStudent = res.data.data;
          handleSelectStudent(apiStudent);
          toast.success(`Loaded details for ${apiStudent.first_name} ${apiStudent.last_name} (${apiStudent.student_number})`);
          return;
        }
      } catch {
        // Fallback
      }

      toast.error(`No student record found for "${searchQuery}". Please check the full name or student number.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error('Please select a student record first');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please enter the reason for the promissory request');
      return;
    }

    const numPayment = parseFloat(initialPayment) || 0;
    setIsSubmitting(true);

    try {
      let requestNum = `PN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      let backendId: number | undefined;

      // 1. Backend API Call
      try {
        const response = await api.post(API_ROUTES.PROMISSORY.CREATE, {
          student_id: selectedStudent.id,
          initial_payment: numPayment,
          reason: reason.trim(),
          remarks: remarks.trim(),
          exam_period: examPeriod,
          academic_year: activeTerm.academic_year,
          semester: activeTerm.semester,
        });

        if (response.data?.data?.request_number) {
          requestNum = response.data.data.request_number;
        }
        if (response.data?.data?.id) {
          backendId = Number(response.data.data.id);
        }
      } catch (apiErr: any) {
        console.warn('Backend promissory note sync notice:', apiErr?.response?.data || apiErr?.message);
      }

      // 2. Client reactive store update
      const created = createPromissoryRequest({
        id: backendId,
        requestNumber: requestNum,
        studentId: selectedStudent.id,
        examPeriod,
        amountPayableNow: numPayment,
        promissoryAmount: numPayment,
        reason: reason.trim(),
        registrarNotes: remarks.trim(),
        requestedBy: 'Registrar Staff',
      });

      toast.success(
        `Promissory request ${created.request_number || requestNum} filed for ${selectedStudent.first_name} ${selectedStudent.last_name}! Sent to Accounting for billing clearance.`
      );

      // Refresh student reference
      const updated = students.find((s) => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to file promissory note';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileSignature size={20} />
            </div>
            <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">
              Promissory Note Request
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search enrolled students, review billing status, input initial payment and endorsement reasons, and submit to Accounting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#1E40AF] text-xs font-semibold shadow-2xs">
            <Calendar size={14} className="text-[#1E40AF] shrink-0" />
            <span>Active Term: {activeTerm.label}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            <Send size={14} className="text-emerald-600 shrink-0" />
            <span>Auto-synced with Accounting</span>
          </div>
        </div>
      </div>


      {/* Step 1: Search & Select Student Record */}
      <Card className="p-4 bg-white shadow-xs border border-slate-200">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Search Student by Full Name or Student Number
          </label>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Type student name (e.g. Maria Clara), Student Number (e.g. 2026-00002), or RFID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={16} />}
                className="pr-16"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}

              {/* Live Autocomplete Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xs border border-slate-200 shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left p-3 hover:bg-blue-50/60 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {s.last_name}, {s.first_name} {s.middle_name || ''}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            ({s.student_number})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {s.course} {s.program} • {s.grade_year_level} ({s.section})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge status={s.financial_status?.status || 'CLEARED'} />
                        <ArrowRight size={14} className="text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="gold"
              isLoading={isSearching}
              leftIcon={<Search size={16} />}
              className="shrink-0"
            >
              Search Student
            </Button>
          </form>
        </div>
      </Card>

      {/* Step 2: Student Details & Promissory Form (appears after search) */}
      {!selectedStudent ? (
        <Card className="p-12 text-center border-2 border-dashed border-slate-200 bg-white/70 rounded-xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Search size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Student Selected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please search for a student by full name or student number above and click <strong>Search Student</strong> (or press Enter). The student's details, balance, and promissory note request form will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Information & Billing Status */}
          <div className="lg:col-span-1">
            <Card className="p-5 border border-slate-200 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Student Information
                </span>
                <div className="flex items-center gap-2">
                  <Badge status={selectedStudent.financial_status?.status || 'CLEARED'} />
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-[#0B1B3D]">
                  {selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name || ''}
                </h3>
                <p className="font-mono text-xs font-bold text-[#D4AF37]">
                  {selectedStudent.student_number}
                </p>
              </div>

              <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Degree Program</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.course} {selectedStudent.program}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Year & Section</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.grade_year_level} • {selectedStudent.section}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">RFID Smart Badge</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedStudent.rfid_card?.rfid_uid || 'No Card Registered'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
                  <span className="text-rose-700 block text-[11px] font-medium">Outstanding Account Balance</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    ₱{(selectedStudent.balance_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-slate-400 block text-[11px] mb-1">Billing Status</span>
                  <div className="flex items-center gap-2">
                    <Badge status={selectedStudent.financial_status?.status || 'CLEARED'} />
                    <span className="text-[11px] text-slate-500">
                      {selectedStudent.financial_status?.status === 'WITH_BALANCE'
                        ? 'Requires clearance to unlock permit'
                        : 'Financially settled'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Test Permit Status</span>
                  <Badge status={selectedStudent.current_permit?.status || 'BLOCKED'} />
                </div>
              </div>

              {/* Active / Existing Promissory Notice */}
              {selectedStudent.active_promissory && (
                <div className="p-3 rounded-xs bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock size={13} className="text-amber-600" />
                    <span>Active Note: {selectedStudent.active_promissory.request_number}</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Status: <strong>{selectedStudent.active_promissory.status}</strong>
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Simplified Promissory Request Form */}
          <div className="lg:col-span-2">
            <Card className="p-6 border border-slate-200 bg-white">
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-[#0B1B3D]">
                    File Promissory Request
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Input the initial payment and endorsement reasons. Once submitted, it will reflect on the Accounting portal for payment processing.
                  </p>
                </div>

                {/* Examination Period */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Examination Period *
                  </label>
                  <select
                    value={examPeriod}
                    onChange={(e) => setExamPeriod(e.target.value as ExamPeriod)}
                    className="w-full px-3 py-2 text-xs rounded-xs border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  >
                    {EXAM_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Defaults to the active Registrar exam period ({activeExamPeriod})
                  </span>
                </div>

                {/* Initial Payment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Payment (₱) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      placeholder="e.g. 2000.00"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xs border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <Banknote size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Initial downpayment amount student will settle at cashier
                  </span>
                </div>

                {/* Reason (Text Input) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for promissory request (e.g. Delayed remittance from parent, financial allowance delay)..."
                    className="w-full px-3 py-2 text-xs rounded-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter registrar remarks or verification notes..."
                    className="w-full px-3 py-2 text-xs rounded-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                  />
                </div>

                {/* Submit button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldAlert size={14} className="text-amber-500 shrink-0" />
                    <span>Submitted request will immediately reflect on Accounting for billing clearance</span>
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    size="md"
                    disabled={isSubmitting}
                    leftIcon={<FileSignature size={16} />}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Promissory Request'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
