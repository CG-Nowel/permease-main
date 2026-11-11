import React, { useState } from 'react';
import { Badge, SkeletonCard, DataTable, Button, StatCard } from '../../components/index.ts';
import type { Column } from '../../components/index.ts';
import {
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Printer,
  FileSignature,
  FileCheck2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentStore } from '../../store/studentStore.ts';
import { ROUTES } from '../../lib/constants.ts';
import type { Student } from '../../types/index.ts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { students, promissoryRequests } = useStudentStore();
  const [isLoading] = useState(false);
  const pendingPromissory = promissoryRequests.filter((p) => p.status === 'PENDING').length;

  const columns: Column<Student>[] = [
    {
      header: 'Student No.',
      accessorKey: 'student_number',
      width: '140px',
      cell: (s) => (
        <span className="font-mono font-bold text-[#0B1B3D]">{s.student_number}</span>
      ),
    },
    {
      header: 'Student Name',
      id: 'name',
      width: '200px',
      cell: (s) => (
        <span className="font-semibold text-slate-800">
          {s.last_name}, {s.first_name} {s.middle_name ? `${s.middle_name[0]}.` : ''}
        </span>
      ),
    },
    {
      header: 'Year & Section',
      id: 'year_section',
      width: '140px',
      cell: (s) => (
        <span className="text-slate-600">{s.grade_year_level} - {s.section}</span>
      ),
    },
    {
      header: 'Program',
      id: 'program',
      width: '180px',
      cell: (s) => (
        <span className="text-slate-500">{s.course} {s.program}</span>
      ),
    },
    {
      header: 'RFID UID',
      id: 'rfid',
      width: '130px',
      cell: (s) =>
        s.rfid_card ? (
          <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200 text-[11px]">
            {s.rfid_card.rfid_uid}
          </span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">Not Assigned</span>
        ),
    },
    {
      header: 'Financial Status',
      id: 'financial_status',
      width: '140px',
      cell: (s) => <Badge status={s.financial_status?.status || 'WITH_BALANCE'} />,
    },
    {
      header: 'Permit State',
      id: 'permit_state',
      width: '130px',
      cell: (s) => <Badge status={s.current_permit?.status || 'AVAILABLE'} />,
    },
    {
      header: 'Actions',
      id: 'actions',
      width: '90px',
      align: 'right',
      sortable: false,
      cell: () => (
        <button
          onClick={() => navigate(ROUTES.ACCOUNTING.BALANCES)}
          className="text-[#1E40AF] hover:text-[#0B1B3D] font-bold text-xs cursor-pointer"
        >
          Manage
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title with Quick Action Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">System Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time student RFID enrollment, financial clearance, and permit issuance statistics
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate(ROUTES.REGISTRAR.PROMISSORY)}
            leftIcon={<FileSignature size={15} />}
          >
            Promissory Request
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.ACCOUNTING.PROMISSORY)}
            leftIcon={<FileCheck2 size={15} className="text-emerald-600" />}
          >
            <span>Promissory Approvals</span>
            {pendingPromissory > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 text-[10px] font-bold">
                {pendingPromissory}
              </span>
            )}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(ROUTES.KIOSK)}
            leftIcon={<Printer size={15} />}
          >
            Kiosk Terminal
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Students"
            value="1,482"
            subtitle="Active Enrollees"
            icon={<Users size={16} />}
            variant="blue"
          />

          <StatCard
            title="RFID Enrolled"
            value="1,420"
            subtitle="95.8% Tagged"
            icon={<CreditCard size={16} />}
            variant="amber"
          />

          <StatCard
            title="With Balance"
            value="184"
            subtitle="Requires Clearance"
            icon={<AlertCircle size={16} />}
            variant="rose"
          />

          <StatCard
            title="Cleared Accounts"
            value="1,298"
            subtitle="Eligible to Print"
            icon={<CheckCircle2 size={16} />}
            variant="emerald"
          />

          <StatCard
            title="Permits Printed"
            value="942"
            subtitle="Self-Service Terminals"
            icon={<Printer size={16} />}
            variant="purple"
          />
        </div>
      )}

      {/* Shared Modern Data Table */}
      <DataTable
        title="Recent Student Records"
        subtitle="Live test permit and RFID status directory"
        data={students}
        columns={columns}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search student no, name, rfid..."
        filterFn={(s, query) =>
          s.student_number.toLowerCase().includes(query) ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) ||
          Boolean(s.rfid_card?.rfid_uid.toLowerCase().includes(query))
        }
      />
    </div>
  );
};
