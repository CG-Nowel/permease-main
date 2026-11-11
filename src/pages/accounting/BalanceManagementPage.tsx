import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Input } from '../../components/index.ts';
import { Search, CheckCircle2, AlertTriangle, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStudentStore } from '../../store/studentStore.ts';
import { useAuth } from '../../store/AuthContext.tsx';
import type { FinancialStatusType, Student } from '../../types/index.ts';
import { api } from '../../lib/api.ts';

export const BalanceManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { students, history, updateStudentBillingStatus } = useStudentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const selectedStudent = selectedStudentId ? students.find((s) => s.id === selectedStudentId) : null;

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      toast.error('Please enter a student name or student number to search.');
      return;
    }

    setHasSearched(true);

    const matched = students.filter((s) => {
      const studentNum = (s.student_number || '').toLowerCase();
      const fullName = `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.toLowerCase().replace(/\s+/g, ' ');
      const simpleName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const rfid = (s.rfid_card?.rfid_uid || '').toLowerCase();
      const firstName = (s.first_name || '').toLowerCase();
      const lastName = (s.last_name || '').toLowerCase();

      return (
        studentNum.includes(query) ||
        fullName.includes(query) ||
        simpleName.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        rfid.includes(query)
      );
    });

    setSearchResults(matched);

    if (matched.length === 1) {
      setSelectedStudentId(matched[0].id);
      toast.success(`Loaded account for ${matched[0].first_name} ${matched[0].last_name}`);
    } else if (matched.length > 1) {
      const exactMatch = matched.find(
        (s) =>
          s.student_number.toLowerCase() === query ||
          `${s.first_name} ${s.last_name}`.toLowerCase() === query
      );
      if (exactMatch) {
        setSelectedStudentId(exactMatch.id);
        toast.success(`Loaded account for ${exactMatch.first_name} ${exactMatch.last_name}`);
      } else {
        setSelectedStudentId(matched[0].id);
        toast.info(`Found ${matched.length} students matching "${searchQuery.trim()}". Showing first match.`);
      }
    } else {
      setSelectedStudentId(null);
      toast.error(`No student found matching "${searchQuery.trim()}"`);
    }
  };

  const [serverAuditLogs, setServerAuditLogs] = useState<typeof history>([]);

  const fetchStudentAuditLogs = useCallback(async (studentId: number) => {
    try {
      const res = await api.get(`/api/students/${studentId}/clearance-history`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setServerAuditLogs(res.data.data);
      }
    } catch {
      // fallback to store
    }
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentAuditLogs(selectedStudentId);
    } else {
      setServerAuditLogs([]);
    }
  }, [selectedStudentId, fetchStudentAuditLogs]);

  const handleToggleStatus = async (newStatus: FinancialStatusType) => {
    if (!selectedStudent) return;
    const currentStatus = selectedStudent.financial_status?.status || 'WITH_BALANCE';
    if (currentStatus === newStatus) return;

    const operatorName = user?.name || 'Accounting Office';
    const notes = newStatus === 'CLEARED' ? 'Cashier clearance validated' : 'Outstanding dues flagged';

    try {
      await updateStudentBillingStatus(selectedStudent.id, newStatus, notes, operatorName);
      await fetchStudentAuditLogs(selectedStudent.id);
      toast.success(
        `Financial clearance for ${selectedStudent.first_name} ${selectedStudent.last_name} updated to ${newStatus}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update clearance';
      toast.error(msg);
    }
  };

  const studentLogs = serverAuditLogs.length > 0 
    ? serverAuditLogs 
    : history.filter((h) => selectedStudent && h.student_id === selectedStudent.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#0B1B3D] tracking-tight">Financial Balance Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student accounts, adjust clearance status, and monitor permit audit histories
        </p>
      </div>

      {/* Search Header */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex gap-3">
          <Input
            placeholder="Search by Student No (2026-00002), Name (Maria Clara), or RFID (A9B8C7D6)..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (!val.trim()) {
                setHasSearched(false);
                setSearchResults([]);
                setSelectedStudentId(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            leftIcon={<Search size={16} />}
          />
          <Button variant="primary" size="md" onClick={handleSearch}>
            Query
          </Button>
        </div>

        {/* Multiple search results selection if more than 1 student matches */}
        {hasSearched && searchResults.length > 1 && (
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Matching Students ({searchResults.length} found):
            </span>
            <div className="flex flex-wrap gap-2">
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    toast.success(`Loaded account for ${s.first_name} ${s.last_name}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border flex items-center gap-2 ${
                    selectedStudent?.id === s.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-bold">{s.first_name} {s.last_name}</span>
                  <span className="font-mono text-[11px] opacity-80">({s.student_number})</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      s.financial_status?.status === 'WITH_BALANCE'
                        ? selectedStudent?.id === s.id ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                        : selectedStudent?.id === s.id ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {s.financial_status?.status || 'CLEARED'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Initial Empty State before searching */}
      {!selectedStudent && !hasSearched && (
        <Card className="p-12 text-center bg-white border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-xs">
            <Search size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Search Student Account</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Type a student's full name, last name, or student number (e.g. 2026-00002) above and click{' '}
            <span className="font-semibold text-[#1E40AF]">Query</span> to display their financial record and adjust clearance.
          </p>
        </Card>
      )}

      {/* No Results Found State */}
      {!selectedStudent && hasSearched && searchResults.length === 0 && (
        <Card className="p-10 text-center bg-white border border-slate-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Student Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No enrolled student record matched "{searchQuery}". Please verify the name or student ID number and try again.
          </p>
        </Card>
      )}

      {/* Student Account Overview Card */}
      {selectedStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="goldAccent" className="md:col-span-2 bg-white">
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Student Account
                  </span>
                  <h3 className="text-xl font-black text-[#0B1B3D]">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#1E40AF]">
                    {selectedStudent.student_number} • RFID: {selectedStudent.rfid_card?.rfid_uid || 'None'}
                  </p>
                </div>
                <Badge status={selectedStudent.financial_status?.status || 'CLEARED'} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Academic Program</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.course} {selectedStudent.program}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Year & Section</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.grade_year_level} • {selectedStudent.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Permit State</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.current_permit?.status || 'AVAILABLE'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Print Count</span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent.current_permit?.print_count || 0} prints
                  </span>
                </div>
              </div>

              {/* Active Promissory Note Indicator if exists */}
              {selectedStudent.active_promissory && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">
                      Promissory Note {selectedStudent.active_promissory.request_number}
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Promised ₱{selectedStudent.active_promissory.promissory_amount.toLocaleString()} due on {selectedStudent.active_promissory.promise_to_pay_date}
                    </span>
                  </div>
                  <Badge status={selectedStudent.active_promissory.status} />
                </div>
              )}

              {/* Clearance Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Update Financial Clearance:</span>
                <div className="flex gap-2.5">
                  <Button
                    variant={selectedStudent.financial_status?.status === 'WITH_BALANCE' ? 'danger' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleStatus('WITH_BALANCE')}
                    leftIcon={<AlertTriangle size={14} />}
                  >
                    MARK AS WITH BALANCE
                  </Button>
                  <Button
                    variant={selectedStudent.financial_status?.status === 'CLEARED' ? 'gold' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleStatus('CLEARED')}
                    leftIcon={<CheckCircle2 size={14} />}
                  >
                    MARK AS CLEARED
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Audit History Card */}
          <Card header={<h4 className="text-xs font-bold text-[#0B1B3D] uppercase tracking-wider">Clearance Audit Trail</h4>} className="bg-white">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {studentLogs.length > 0 ? (
                studentLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={log.previous_status === 'CLEARED' ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.previous_status}
                      </span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className={log.new_status === 'CLEARED' ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.new_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">"{log.notes}"</p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200">
                      <span>{log.operator_name}</span>
                      <span>{log.created_at}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic p-2 text-center">No history logs recorded for this student</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
