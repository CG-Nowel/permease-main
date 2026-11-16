import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, DataTable, Button, StatCard } from '../../components/index.ts';
import type { Column } from '../../components/index.ts';
import { FileSignature, UserPlus, Calendar } from 'lucide-react';
import { useStudentStore } from '../../store/studentStore.ts';
import { useAcademicTerm } from '../../store/AcademicTermContext.tsx';
import type { Student } from '../../types/index.ts';
import { ManageStudentModal } from './components/ManageStudentModal.tsx';
import { api } from '../../lib/api.ts';

export const StudentsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { students, updateStudent } = useStudentStore();
  const { activeTerm } = useAcademicTerm();


  // Manage Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Stats calculation
  const totalStudents = students.length;
  const rfidAssignedCount = students.filter((s) => s.rfid_card && s.rfid_card.status === 'ACTIVE').length;
  const clearedCount = students.filter((s) => s.financial_status?.status === 'CLEARED').length;
  const balanceCount = students.filter((s) => s.financial_status?.status === 'WITH_BALANCE').length;
  const totalPrintedPermits = useMemo(() => {
    return students.reduce((sum, s) => {
      const permit = s.current_permit;
      if (!permit) return sum;
      // Count based on actual print records (initial prints + reprints)
      if (typeof permit.print_count === 'number' && permit.print_count > 0) {
        return sum + permit.print_count;
      }
      if (permit.status === 'PRINTED' || permit.first_printed_at || permit.last_printed_at) {
        return sum + 1;
      }
      return sum;
    }, 0);
  }, [students]);

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchYear = yearFilter === 'ALL' || student.grade_year_level === yearFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CLEARED' && student.financial_status?.status === 'CLEARED') ||
        (statusFilter === 'WITH_BALANCE' && student.financial_status?.status === 'WITH_BALANCE');

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        student.student_number.toLowerCase().includes(q) ||
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) ||
        student.program.toLowerCase().includes(q) ||
        Boolean(student.rfid_card?.rfid_uid.toLowerCase().includes(q));

      return matchYear && matchStatus && matchSearch;
    });
  }, [students, searchQuery, yearFilter, statusFilter]);

  const handleSaveStudent = async (updatedStudent: Student) => {
    // 1. Instantly update client reactive store / localStorage
    updateStudent(updatedStudent);

    // 2. Synchronize with Laravel backend database (deletes old subjects & saves new year subjects)
    try {
      await api.put(`/api/students/${updatedStudent.id}`, {
        first_name: updatedStudent.first_name,
        middle_name: updatedStudent.middle_name || null,
        last_name: updatedStudent.last_name,
        student_number: updatedStudent.student_number,
        grade_year_level: updatedStudent.grade_year_level,
        section: updatedStudent.section,
        course: updatedStudent.course,
        program: updatedStudent.program,
        student_type: updatedStudent.student_type,
        rfid_uid: updatedStudent.rfid_card?.rfid_uid || null,
        subjects: updatedStudent.subjects?.map((s) => ({
          code: s.code,
          title: s.title,
          units: s.units,
          type: s.type,
        })),
      });
    } catch (err: any) {
      console.warn('Backend database synchronization notice:', err?.response?.data || err?.message);
    }
  };

  const columns: Column<Student>[] = [
    {
      header: 'Student',
      id: 'student_info',
      cell: (s) => {
        const initials = `${s.first_name[0] || ''}${s.last_name[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-slate-900 block truncate text-xs">
                {s.last_name}, {s.first_name} {s.middle_name ? `${s.middle_name[0]}.` : ''}
              </span>
              <span className="font-mono text-[11px] text-slate-500 block">
                {s.student_number}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Program & Discipline',
      id: 'program',
      cell: (s) => (
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-800 block truncate">
            {s.course} {s.program}
          </span>
          <span className="text-[11px] text-slate-500">
            Undergraduate Degree
          </span>
        </div>
      ),
    },
    {
      header: 'Year & Section',
      id: 'year_section',
      cell: (s) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-800">{s.grade_year_level}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                s.student_type === 'Irregular'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {s.student_type || 'Regular'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
            <span>{s.section}</span>
            <span>•</span>
            <span className="font-mono">{s.units || (s.subjects?.reduce((acc, sub) => acc + sub.units, 0)) || 18}.0 Units</span>
          </div>
        </div>
      ),
    },
    {
      header: 'RFID Smart Card',
      id: 'rfid',
      cell: (s) =>
        s.rfid_card ? (
          s.rfid_card.status === 'DEACTIVATED' ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="font-mono text-xs font-semibold text-rose-700">
                {s.rfid_card.rfid_uid} (Disabled)
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-mono text-xs font-semibold text-slate-800">
                {s.rfid_card.rfid_uid}
              </span>
            </div>
          )
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-xs italic">Unassigned</span>
          </div>
        ),
    },
    {
      header: 'Accounting Status',
      id: 'financial_status',
      cell: (s) => (
        <Badge
          status={s.financial_status?.status || 'WITH_BALANCE'}
          label={s.financial_status?.status === 'CLEARED' ? 'Cleared' : 'With Balance'}
        />
      ),
    },
    {
      header: 'Permit Eligibility',
      id: 'permit_state',
      cell: (s) => {
        const isCardDisabled = s.rfid_card?.status === 'DEACTIVATED';
        if (isCardDisabled) {
          return <Badge status="BLOCKED" label="Card Disabled" />;
        }
        return (
          <Badge
            status={s.current_permit?.status || 'AVAILABLE'}
            label={
              s.current_permit?.status === 'AVAILABLE'
                ? 'Ready to Print'
                : s.current_permit?.status === 'BLOCKED'
                ? 'Blocked'
                : s.current_permit?.status || 'Available'
            }
          />
        );
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      align: 'right',
      sortable: false,
      cell: (s) => (
        <div className="flex items-center justify-end gap-2">
          {s.financial_status?.status === 'WITH_BALANCE' && (
            <button
              type="button"
              onClick={() => navigate('/registrar/promissory')}
              className="px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800 transition shadow-2xs cursor-pointer flex items-center gap-1"
              title="File Promissory Request for this student"
            >
              <FileSignature size={12} className="text-amber-600" />
              <span>Promissory</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedStudent(s);
              setIsManageModalOpen(true);
            }}
            className="px-3 py-1 rounded-md border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            Manage
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header with Action Shortcuts */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Enrolled</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete student roster, contactless RFID card credentials, and permit issuance status
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#1E40AF] text-xs font-semibold shadow-2xs">
            <Calendar size={14} className="text-[#1E40AF] shrink-0" />
            <span>Active Term: {activeTerm.label}</span>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate('/registrar/promissory')}
            leftIcon={<FileSignature size={14} />}
          >
            Promissory Request
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/registrar/register')}
            leftIcon={<UserPlus size={14} />}
          >
            Register Student
          </Button>
        </div>
      </div>


      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled in database"
          variant="default"
        />

        <StatCard
          title="RFID Cards Paired"
          value={rfidAssignedCount}
          subtitle={`${totalStudents > 0 ? Math.round((rfidAssignedCount / totalStudents) * 100) : 0}% paired`}
          variant="default"
        />

        <StatCard
          title="Financially Cleared"
          value={clearedCount}
          subtitle="Permit issuance ready"
          variant="emerald"
        />

        <StatCard
          title="Balance Holds"
          value={balanceCount}
          subtitle="Accounting review needed"
          variant="rose"
        />

        <StatCard
          title="Printed Exam Permits"
          value={totalPrintedPermits}
          subtitle="Actual print records"
          variant="purple"
        />
      </div>

      {/* Table Container with Aligned Search & Filter Header */}
      <DataTable
        title="Enrolled Student"
        data={filteredStudents}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchable
        searchPlaceholder="Search student no, name, program, rfid..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        pageSizePosition="header"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="rounded-md border border-slate-200 py-2 px-2.5 bg-slate-50/70 focus:bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition cursor-pointer"
            >
              <option value="ALL">All Year Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-slate-200 py-2 px-2.5 bg-slate-50/70 focus:bg-white text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition cursor-pointer"
            >
              <option value="ALL">All Financial Statuses</option>
              <option value="CLEARED">Cleared</option>
              <option value="WITH_BALANCE">With Balance</option>
            </select>

            {(yearFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setYearFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        }
        fixedLayout={false}
        minHeight="min-h-[560px]"
        className="rounded-xl border border-slate-200 shadow-xs overflow-hidden"
      />

      <ManageStudentModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSave={handleSaveStudent}
      />
    </div>
  );
};
