import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Button, DataTable } from '../../components/index.ts';
import type { Column } from '../../components/index.ts';
import { Download, Calendar, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../lib/utils.ts';
import type { ReprintPayment } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { useAcademicTerm } from '../../store/AcademicTermContext.tsx';
import { toast } from 'sonner';

export const PaymentHistoryPage: React.FC = () => {
  const { activeTerm } = useAcademicTerm();
  const [payments, setPayments] = useState<ReprintPayment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reprints');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPayments(res.data.data);
      }
    } catch (err: unknown) {
      console.error('Failed to load payment transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleExportCsv = () => {
    if (payments.length === 0) {
      toast.info('No transactions to export.');
      return;
    }

    const headers = ['Receipt Ref', 'Student ID', 'Student Name', 'Permit Number', 'Amount', 'Status', 'Cashier', 'Paid Timestamp', 'Consumed At'];
    const rows = payments.map((p) => {
      const studentName = (p as unknown as { student_name?: string }).student_name || `Student #${p.student_id}`;
      const permitNumber = (p as unknown as { permit_number?: string }).permit_number || `Permit #${p.test_permit_id}`;
      return [
        `"${p.reference_number}"`,
        `"${p.student_id}"`,
        `"${studentName}"`,
        `"${permitNumber}"`,
        p.amount.toFixed(2),
        `"${p.status}"`,
        `"${p.cashier_name || 'Accounting Office'}"`,
        `"${p.paid_at || ''}"`,
        `"${p.consumed_at || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `permease_payment_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payment ledger exported successfully.');
  };

  const columns: Column<ReprintPayment>[] = [
    {
      header: 'Receipt Ref.',
      accessorKey: 'reference_number',
      width: '150px',
      cell: (pay) => (
        <span className="font-mono font-bold text-[#0B1B3D]">{pay.reference_number}</span>
      ),
    },
    {
      header: 'Student / Account',
      id: 'student_info',
      width: '240px',
      cell: (pay) => {
        const studentName = (pay as unknown as { student_name?: string }).student_name;
        const studentNumber = (pay as unknown as { student_number?: string }).student_number;
        return (
          <div>
            <div className="font-bold text-slate-800 text-xs">
              {studentName || `Student #${pay.student_id}`}
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              {studentNumber || `ID: #${pay.student_id}`}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Test Permit ID',
      accessorKey: 'test_permit_id',
      width: '150px',
      cell: (pay) => {
        const permitNumber = (pay as unknown as { permit_number?: string }).permit_number;
        return <span className="font-mono text-slate-600 text-xs">{permitNumber || `Permit #${pay.test_permit_id}`}</span>;
      },
    },
    {
      header: 'Amount',
      id: 'amount',
      width: '120px',
      cell: (pay) => (
        <span className="font-bold text-slate-900">{formatCurrency(pay.amount)}</span>
      ),
    },
    {
      header: 'Status',
      id: 'status',
      width: '130px',
      cell: (pay) => <Badge status={pay.status} />,
    },
    {
      header: 'Processing Cashier',
      accessorKey: 'cashier_name',
      width: '180px',
      cell: (pay) => <span className="text-slate-600">{pay.cashier_name || 'Accounting Office'}</span>,
    },
    {
      header: 'Payment Timestamp',
      accessorKey: 'paid_at',
      width: '160px',
      cell: (pay) => <span className="text-slate-400 font-mono text-[11px]">{pay.paid_at}</span>,
    },
    {
      header: 'Consumed At',
      id: 'consumed_at',
      width: '160px',
      cell: (pay) => (
        <span className="font-mono text-[11px] text-slate-400">
          {pay.consumed_at || <span className="italic text-amber-600 font-sans">Awaiting Tap</span>}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">Payment Ledger & Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical accounting transactions for examination permit reprints and clearance receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download size={15} />}
          >
            Export Statement (CSV)
          </Button>
        </div>
      </div>

      <DataTable
        title="Payment Transactions"
        subtitle="Complete record of verified transactions with timestamps from database"
        data={payments}
        columns={columns}
        keyExtractor={(p) => p.id}
        searchable
        searchPlaceholder="Search reference, cashier, student..."
        filterFn={(p, query) => {
          const q = query.toLowerCase();
          const studentName = (p as unknown as { student_name?: string }).student_name?.toLowerCase() || '';
          const studentNumber = (p as unknown as { student_number?: string }).student_number?.toLowerCase() || '';
          return (
            p.reference_number.toLowerCase().includes(q) ||
            Boolean(p.cashier_name?.toLowerCase().includes(q)) ||
            studentName.includes(q) ||
            studentNumber.includes(q) ||
            String(p.student_id).includes(q)
          );
        }}
        actions={
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <Calendar size={13} className="text-[#1E40AF]" />
            <span>Current Term ({activeTerm.academic_year} • {activeTerm.semester})</span>
          </div>
        }
      />
    </div>
  );
};
