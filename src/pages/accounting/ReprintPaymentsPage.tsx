import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Modal, Badge, DataTable } from '../../components/index.ts';
import type { Column } from '../../components/index.ts';
import { Banknote, Receipt, RefreshCw, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { ReprintPayment, Student } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../store/AuthContext.tsx';
import { syncStudentsFromBackend } from '../../store/studentStore.ts';

export const ReprintPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('50.00');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('Lost original examination permit copy');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<ReprintPayment[]>([]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reprints');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPayments(res.data.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load reprint transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/api/students');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setStudents(res.data.data);
        if (res.data.data.length > 0 && selectedStudentId === '') {
          setSelectedStudentId(res.data.data[0].id);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load students:', err);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
  }, [fetchPayments, fetchStudents]);

  const openNewAuthorizationModal = () => {
    setReferenceNumber(`OR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
    setAmount('50.00');
    setNotes('Misplaced or damaged examination permit copy');
    if (students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
    setIsModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select an enrolled student.');
      return;
    }
    if (!referenceNumber.trim()) {
      toast.error('Official receipt / reference number is required');
      return;
    }

    try {
      const cashierName = user?.name || 'Accounting Office';
      const res = await api.post('/api/reprints', {
        student_id: Number(selectedStudentId),
        amount: parseFloat(amount) || 50.0,
        reference_number: referenceNumber.trim(),
        notes: notes.trim(),
        cashier_name: cashierName,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Reprint payment confirmed! 1 reprint copy authorized.');
        setIsModalOpen(false);
        await Promise.all([fetchPayments(), fetchStudents(), syncStudentsFromBackend()]);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Failed to authorize reprint payment.';
      toast.error(msg);
    }
  };

  const selectedStudentObj = students.find((s) => s.id === Number(selectedStudentId));

  const columns: Column<ReprintPayment>[] = [
    {
      header: 'Receipt Ref.',
      accessorKey: 'reference_number',
      width: '160px',
      cell: (p) => (
        <span className="font-mono font-bold text-[#0B1B3D]">{p.reference_number}</span>
      ),
    },
    {
      header: 'Student / Permit',
      id: 'student_permit',
      width: '260px',
      cell: (p) => {
        const studentName = (p as unknown as { student_name?: string }).student_name;
        const studentNumber = (p as unknown as { student_number?: string }).student_number;
        const permitNumber = (p as unknown as { permit_number?: string }).permit_number;

        return (
          <div>
            <div className="font-bold text-slate-800 text-xs">
              {studentName || `Student #${p.student_id}`}
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              {studentNumber ? `${studentNumber} • ` : ''}
              {permitNumber || `Permit #${p.test_permit_id}`}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Fee Amount',
      id: 'amount',
      width: '130px',
      cell: (p) => (
        <span className="font-bold text-slate-900">₱{Number(p.amount || 0).toFixed(2)}</span>
      ),
    },
    {
      header: 'Token Status',
      id: 'status',
      width: '140px',
      cell: (p) => <Badge status={p.status} />,
    },
    {
      header: 'Cashier',
      accessorKey: 'cashier_name',
      width: '200px',
      cell: (p) => <span className="text-slate-600">{p.cashier_name || 'Accounting Office'}</span>,
    },
    {
      header: 'Paid Timestamp',
      accessorKey: 'paid_at',
      width: '180px',
      cell: (p) => <span className="text-slate-400 font-mono text-[11px]">{p.paid_at}</span>,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">Permit Reprint Authorizations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Collect official examination reprint fees and authorize single-use kiosk re-prints
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={fetchPayments}
            leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button
            variant="gold"
            size="md"
            onClick={openNewAuthorizationModal}
            leftIcon={<Banknote size={16} />}
          >
            ALLOW PERMIT REPRINT
          </Button>
        </div>
      </div>

      <DataTable
        title="Reprint Transactions Ledger"
        subtitle="Real-time log of collected reprint fees and issued authorizations from database"
        data={payments}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchable
        searchPlaceholder="Filter reference, cashier, or student..."
        filterFn={(p, query) => {
          const q = query.toLowerCase();
          const studentName = (p as unknown as { student_name?: string }).student_name?.toLowerCase() || '';
          const studentNumber = (p as unknown as { student_number?: string }).student_number?.toLowerCase() || '';
          return (
            p.reference_number.toLowerCase().includes(q) ||
            (p.cashier_name?.toLowerCase().includes(q) ?? false) ||
            studentName.includes(q) ||
            studentNumber.includes(q) ||
            String(p.student_id).includes(q)
          );
        }}
      />

      {/* Authorize Reprint Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Authorize Test Permit Reprint"
        description="One reprint fee payment authorizes exactly ONE additional kiosk reprint"
        maxWidth="md"
      >
        <form onSubmit={handleProcessPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            >
              {students.length === 0 ? (
                <option value="">No enrolled students found</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_number} - {s.first_name} {s.last_name} ({s.course} {s.grade_year_level})
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedStudentObj && (
            <div className="p-3.5 rounded-md bg-blue-50 border border-blue-200 text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-bold mb-1">
                <UserCheck size={14} />
                <span>Student Summary</span>
              </div>
              <span className="font-bold text-slate-800 text-sm block">
                {selectedStudentObj.first_name} {selectedStudentObj.last_name} ({selectedStudentObj.student_number})
              </span>
              <span className="block text-slate-600 mt-0.5">
                Program: {selectedStudentObj.course} {selectedStudentObj.program} • {selectedStudentObj.grade_year_level}
              </span>
              <span className="block text-slate-600">
                Billing Status: <span className="font-bold text-slate-800">{selectedStudentObj.financial_status?.status || 'CLEARED'}</span>
              </span>
            </div>
          )}

          <Input
            label="Reprint Fee Amount (PHP) *"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Input
            label="Official Receipt / Reference No. *"
            placeholder="e.g. OR-2026-90412"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            leftIcon={<Receipt size={16} />}
            required
          />

          <Input
            label="Remarks / Authorization Reason"
            placeholder="e.g. Water damaged, misplaced permit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Confirm & Issue Token
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
