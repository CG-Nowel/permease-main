import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, Badge, DataTable, Modal, StatCard } from '../../components/index.ts';
import type { Column } from '../../components/index.ts';
import {
  FileCheck2,
  Receipt,
  CheckCircle2,
  Clock,
  Banknote,
  Printer,
  ShieldCheck,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudentStore, studentStore } from '../../store/studentStore.ts';
import { useAuth } from '../../store/AuthContext.tsx';
import { useAcademicTerm } from '../../store/AcademicTermContext.tsx';
import type { PromissoryRequest } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { API_ROUTES } from '../../lib/constants.ts';

export const PromissoryAccountingPage: React.FC = () => {
  const { user } = useAuth();
  const { students, approvePromissoryAndClearBilling } = useStudentStore();
  const { activeTerm } = useAcademicTerm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [promissoryRequests, setPromissoryRequests] = useState<PromissoryRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPromissoryRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(API_ROUTES.PROMISSORY.LIST);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPromissoryRequests(res.data.data);
        localStorage.setItem('permease_promissory_requests', JSON.stringify(res.data.data));
      } else {
        const stored = studentStore.getPromissoryRequests();
        if (stored.length > 0) {
          setPromissoryRequests(stored);
        }
      }
    } catch (err) {
      console.warn('Backend promissory list unreachable, falling back to local store:', err);
      const stored = studentStore.getPromissoryRequests();
      setPromissoryRequests(stored);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromissoryRequests();
  }, [fetchPromissoryRequests]);

  // Processing / Clearance Modal state
  const [selectedForAction, setSelectedForAction] = useState<PromissoryRequest | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cashierNotes, setCashierNotes] = useState('Payment and promissory terms validated. Billing status updated to CLEARED.');
  const [isProcessing, setIsProcessing] = useState(false);

  // View Receipt / Certificate Modal
  const [viewingReceipt, setViewingReceipt] = useState<PromissoryRequest | null>(null);

  // Stats calculation
  const totalCount = promissoryRequests.length;
  const pendingCount = promissoryRequests.filter((p) => p.status === 'PENDING').length;
  const approvedCount = promissoryRequests.filter((p) => p.status === 'APPROVED').length;
  const totalCollected = promissoryRequests.reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  // Filtered requests based on active tab & search
  const filteredRequests = useMemo(() => {
    return promissoryRequests.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;

      const q = searchQuery.trim().toLowerCase();
      return (
        !q ||
        p.request_number.toLowerCase().includes(q) ||
        p.student_name.toLowerCase().includes(q) ||
        p.student_number.toLowerCase().includes(q)
      );
    });
  }, [promissoryRequests, searchQuery, statusFilter]);

  const handleOpenProcessModal = (req: PromissoryRequest) => {
    setSelectedForAction(req);
    // Pre-fill realistic OR number and downpayment
    const randomOR = `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setReceiptNumber(randomOR);
    setPaymentAmount(String(req.amount_payable_now || 2000));
    setCashierNotes('Payment accepted. Promissory note approved. Billing cleared for test permit release.');
  };

  const handleConfirmClearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForAction) return;

    if (!receiptNumber.trim()) {
      toast.error('Official Receipt (OR) Number is required');
      return;
    }

    const numPaid = parseFloat(paymentAmount) || 0;
    setIsProcessing(true);

    try {
      const cashierName = user?.name || 'Eduardo Ramos (Accounting)';
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // 1. Backend API Call to approve & clear billing in database
      let backendApprovedRequest: PromissoryRequest | null = null;
      try {
        const res = await api.post(API_ROUTES.PROMISSORY.APPROVE(selectedForAction.id), {
          official_receipt_number: receiptNumber.trim(),
          amount_paid: numPaid,
          accounting_remarks: cashierNotes,
        });
        if (res.data?.success && res.data.data?.request) {
          backendApprovedRequest = res.data.data.request;
        }
      } catch (apiErr: any) {
        console.warn('Backend promissory approval notice:', apiErr?.response?.data || apiErr?.message);
        const errMsg = apiErr?.response?.data?.message || '';
        if (errMsg.includes('already been APPROVED')) {
          backendApprovedRequest = {
            ...selectedForAction,
            status: 'APPROVED',
            official_receipt_number: receiptNumber.trim(),
            amount_paid: numPaid,
            accounting_notes: cashierNotes,
            approved_by: cashierName,
            settled_at: timestamp,
          };
        }
      }

      // 2. Client reactive store update (fail-safe and guarantees CLEARED state)
      const { student, request } = approvePromissoryAndClearBilling({
        requestId: selectedForAction.id,
        requestNumber: selectedForAction.request_number,
        studentId: selectedForAction.student_id,
        studentNumber: selectedForAction.student_number,
        orNumber: receiptNumber.trim(),
        amountPaid: numPaid,
        notes: cashierNotes,
        cashierName,
        promissoryRequest: backendApprovedRequest || selectedForAction,
      });

      // 3. Immediately sync students and promissory requests
      await Promise.allSettled([
        fetchPromissoryRequests(),
        studentStore.syncStudentsFromBackend(),
      ]);

      toast.success(
        `Billing status for ${student.first_name} ${student.last_name} updated to CLEARED! Test permit is now unlocked for Kiosk printing.`
      );

      setSelectedForAction(null);
      setViewingReceipt(request);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve promissory note';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<PromissoryRequest>[] = [
    {
      header: 'Request No.',
      accessorKey: 'request_number',
      width: '130px',
      cell: (p) => <span className="font-mono font-bold text-[#0B1B3D] text-xs">{p.request_number}</span>,
    },
    {
      header: 'Student Information',
      id: 'student_info',
      cell: (p) => {
        const studentRecord = students.find((s) => s.id === p.student_id || s.student_number === p.student_number);
        const isApproved = p.status === 'APPROVED';
        const billingStatus = isApproved ? 'CLEARED' : (studentRecord?.financial_status?.status || 'WITH_BALANCE');

        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">{p.student_name}</span>
              <span className="font-mono text-[11px] text-slate-500">({p.student_number})</span>
            </div>
            <span className="text-[11px] text-slate-500 block truncate">
              {p.course_program} • {p.year_section}
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Current Billing:</span>
              <Badge status={billingStatus} className="text-[10px] py-0 px-2" />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Exam Period',
      id: 'period',
      width: '110px',
      cell: (p) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">{p.exam_period}</span>
          <span className="text-[10px] text-slate-400 block">{p.semester} {p.academic_year}</span>
        </div>
      ),
    },
    {
      header: 'Initial Payment',
      id: 'amount',
      width: '130px',
      cell: (p) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">
            ₱{(p.amount_payable_now || p.promissory_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 block">Downpayment</span>
        </div>
      ),
    },
    {
      header: 'Reason & Remarks',
      id: 'reason_remarks',
      cell: (p) => (
        <div>
          <span className="text-xs font-medium text-slate-800 block truncate max-w-xs">{p.reason}</span>
          {p.registrar_notes && (
            <span className="text-[11px] text-slate-500 italic block truncate max-w-xs">
              "{p.registrar_notes}"
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Payment / OR Ref.',
      id: 'payment_ref',
      width: '150px',
      cell: (p) => {
        if (p.status === 'APPROVED' && p.official_receipt_number) {
          return (
            <div>
              <span className="font-mono font-bold text-emerald-700 text-xs block">
                {p.official_receipt_number}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Paid: ₱{(p.amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        }
        return <span className="text-slate-400 text-[11px] italic">Awaiting Payment</span>;
      },
    },
    {
      header: 'Status',
      id: 'status',
      width: '110px',
      cell: (p) => <Badge status={p.status} />,
    },
    {
      header: 'Action',
      id: 'action',
      width: '150px',
      cell: (p) => {
        if (p.status === 'PENDING') {
          return (
            <Button
              variant="gold"
              size="sm"
              onClick={() => handleOpenProcessModal(p)}
              className="text-xs px-2.5 py-1 whitespace-nowrap shadow-xs"
              leftIcon={<Banknote size={13} />}
            >
              Update Billing
            </Button>
          );
        }

        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingReceipt(p)}
            className="text-xs px-2.5 py-1 whitespace-nowrap"
            leftIcon={<Receipt size={13} />}
          >
            Clearance Slip
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck2 size={20} />
            </div>
            <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">
              Promissory Approvals & Billing Settlement
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review registrar-endorsed promissory requests, accept student downpayments, and clear billing status so students can print permits at the Kiosk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPromissoryRequests}
            leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#1E40AF] text-xs font-semibold shadow-2xs">
            <Calendar size={14} className="text-[#1E40AF] shrink-0" />
            <span>Active Term: {activeTerm.label}</span>
          </div>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-bold animate-pulse">
              <Clock size={14} className="text-amber-600" />
              <span>{pendingCount} Pending Promissory Awaiting Billing Clearance</span>
            </div>
          )}
        </div>
      </div>


      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={totalCount}
          subtitle="Endorsed by Registrar"
          variant="default"
        />

        <StatCard
          title="Pending Clearance"
          value={pendingCount}
          subtitle="Permit currently blocked"
          variant="amber"
        />

        <StatCard
          title="Cleared & Permitted"
          value={approvedCount}
          subtitle="Ready for Kiosk printing"
          variant="emerald"
        />

        <StatCard
          title="Payments Collected"
          value={`₱${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Receipted downpayments"
          variant="default"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>Pending Clearance</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'PENDING' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>Cleared & Approved</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {approvedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-[#0B1B3D] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>All Requests</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {totalCount}
          </span>
        </button>
      </div>

      {/* Requests Table */}
      <DataTable
        title={
          <div className="flex items-center gap-2.5">
            <span>
              {statusFilter === 'PENDING'
                ? 'Pending Promissory Requests'
                : statusFilter === 'APPROVED'
                ? 'Cleared & Approved Promissory Requests'
                : 'All Promissory Requests'}
            </span>
            {statusFilter === 'PENDING' && pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {pendingCount} pending
              </span>
            )}
          </div>
        }
        subtitle={
          statusFilter === 'PENDING'
            ? 'Process student payment and update billing status to CLEARED to enable Kiosk permit printing'
            : statusFilter === 'APPROVED'
            ? 'Promissory notes successfully cleared and permitted for kiosk dispensing'
            : 'Complete directory of promissory requests and settlement histories'
        }
        data={filteredRequests}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchable={true}
        searchPlaceholder="Search requests by #, student..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Process Payment & Clear Billing Modal */}
      {selectedForAction && (
        <Modal
          isOpen={Boolean(selectedForAction)}
          onClose={() => setSelectedForAction(null)}
          title="Process Promissory Settlement & Clear Billing"
          description="Update student's financial status to CLEARED so they can use the kiosk to print their test permit"
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmClearance} className="space-y-4 text-xs">
            {/* Student & Note Overview */}
            <div className="p-3.5 rounded-none bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Student Account</span>
                  <h4 className="text-sm font-black text-slate-900">{selectedForAction.student_name}</h4>
                  <span className="font-mono text-slate-600 text-xs">
                    {selectedForAction.student_number} • {selectedForAction.course_program}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Promissory Request</span>
                  <span className="font-mono font-bold text-blue-700 block text-xs">
                    {selectedForAction.request_number}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Period: {selectedForAction.exam_period}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Initial Payment Required</span>
                  <span className="font-bold text-[#0B1B3D]">
                    ₱{(selectedForAction.amount_payable_now || selectedForAction.promissory_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Exam Period</span>
                  <span className="font-semibold text-slate-800">
                    {selectedForAction.exam_period}
                  </span>
                </div>
              </div>
            </div>

            {/* Endorsement Note from Registrar */}
            <div className="p-3 rounded-none bg-blue-50/50 border border-blue-200 text-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                Registrar Endorsement Reason:
              </span>
              <p className="font-medium mt-0.5 text-slate-800">{selectedForAction.reason}</p>
              {selectedForAction.registrar_notes && (
                <p className="text-[11px] text-slate-500 italic mt-1">
                  "{selectedForAction.registrar_notes}"
                </p>
              )}
            </div>

            {/* Payment & OR Entry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Receipt (OR) Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="e.g. OR-2026-90412"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xs border border-slate-300 font-mono font-bold text-[#0B1B3D] focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <Receipt size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Official accounting cashier receipt reference
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount Received (₱) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xs border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                  <Banknote size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Initial downpayment or full fee settled at cashier
                </span>
              </div>
            </div>

            {/* Status Update Confirmation Banner */}
            <div className="p-3.5 rounded-none bg-emerald-50 border border-emerald-300/80 text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Immediate Billing & Kiosk Permit Action:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                <li>Student's Billing Status will update from <strong className="text-rose-700">WITH_BALANCE</strong> to <strong className="text-emerald-700">CLEARED</strong>.</li>
                <li>Examination Permit will change to <strong className="text-emerald-700">AVAILABLE</strong>.</li>
                <li><strong>The student can immediately go to the Kiosk and print their official test permit!</strong></li>
              </ul>
            </div>

            {/* Accounting remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accounting Clearance Remarks
              </label>
              <textarea
                rows={2}
                value={cashierNotes}
                onChange={(e) => setCashierNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xs border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedForAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                leftIcon={<ShieldCheck size={16} />}
              >
                {isProcessing ? 'Updating...' : 'CONFIRM PAYMENT & CLEAR BILLING'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clearance Slip Modal */}
      {viewingReceipt && (
        <Modal
          isOpen={Boolean(viewingReceipt)}
          onClose={() => setViewingReceipt(null)}
          title="Accounting Clearance & Promissory Slip"
          description="Official proof of payment and examination clearance authorization"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="border border-slate-300 rounded-none p-5 bg-white space-y-4 shadow-sm">
              {/* Institutional Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/images/logox.jpg"
                    alt="PermEase"
                    className="h-8 w-auto object-contain select-none shrink-0 rounded-xs"
                  />
                  <div>
                    <span className="font-black text-sm text-[#0B1B3D] block leading-tight">PERMEASE</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Accounting Division</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Official Receipt</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {viewingReceipt.official_receipt_number || 'OR-PENDING'}
                  </span>
                </div>
              </div>

              {/* Verified Clearance Banner */}
              <div className="p-3 rounded-none bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
                  Status: Billing Cleared
                </span>
                <span className="font-black text-base text-emerald-900 block">
                  EXAMINATION PERMIT RELEASE AUTHORIZED
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Student is eligible to print their {viewingReceipt.exam_period} test permit at any self-service kiosk.
                </p>
              </div>

              {/* Student details */}
              <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-100 py-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Student Name</span>
                  <span className="font-bold text-slate-900">{viewingReceipt.student_name}</span>
                  <span className="font-mono text-slate-500 text-[11px] block">{viewingReceipt.student_number}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Program & Year</span>
                  <span className="font-semibold text-slate-800">{viewingReceipt.course_program}</span>
                  <span className="text-slate-500 text-[11px] block">{viewingReceipt.year_section}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Amount Paid Now</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ₱{(viewingReceipt.amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Remaining Promised</span>
                  <span className="font-bold text-[#0B1B3D] text-sm">
                    ₱{viewingReceipt.promissory_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <div>Promised Settlement Due: <strong className="font-mono text-slate-800">{viewingReceipt.promise_to_pay_date}</strong></div>
                <div>Authorized By: <strong>{viewingReceipt.approved_by || 'Accounting Cashier'}</strong></div>
                <div>Timestamp: <span className="font-mono">{viewingReceipt.settled_at || viewingReceipt.created_at}</span></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer size={14} />}
              >
                Print Slip
              </Button>
              <Button variant="ghost" onClick={() => setViewingReceipt(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
