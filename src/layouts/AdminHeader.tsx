import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  ChevronDown,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Menu,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.tsx';
import { useAcademicTerm, AcademicTerm } from '../store/AcademicTermContext.tsx';
import { toast } from 'sonner';

interface AdminHeaderProps {
  onMobileMenuClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMobileMenuClick }) => {
  const { user } = useAuth();
  const { activeTerm, terms, updateActiveTerm, addAcademicTerm, isUpdating } = useAcademicTerm();

  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);

  // Term update validation confirmation modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingTerm, setPendingTerm] = useState<AcademicTerm | null>(null);

  // Registrar: Add School Year / Academic Term Modal states
  const [isAddTermModalOpen, setIsAddTermModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState<string>(String(currentYear));
  const [endYear, setEndYear] = useState<string>(String(currentYear + 1));
  const [selectedSemester, setSelectedSemester] = useState<'1st Sem' | '2nd Sem' | 'Summer'>('1st Sem');
  const [makeTermActive, setMakeTermActive] = useState<boolean>(false);
  const [isSubmittingTerm, setIsSubmittingTerm] = useState(false);

  const termRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (termRef.current && !termRef.current.contains(event.target as Node)) {
        setIsTermDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startYear.trim() || !endYear.trim()) {
      toast.error('Please enter both Start Year and End Year.');
      return;
    }
    if (Number(endYear) <= Number(startYear)) {
      toast.error('End Year must be greater than Start Year.');
      return;
    }

    setIsSubmittingTerm(true);
    const success = await addAcademicTerm({
      academic_year: `${startYear.trim()}–${endYear.trim()}`,
      semester: selectedSemester,
      is_active: makeTermActive,
    });
    setIsSubmittingTerm(false);

    if (success) {
      setIsAddTermModalOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Sidebar Trigger & Department Indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
              user?.role === 'ACCOUNTING'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                user?.role === 'ACCOUNTING' ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
            />
            {user?.role === 'ACCOUNTING' ? 'Accounting Department' : 'Registrar Department'}
          </span>
        </div>
      </div>

      {/* Right: Academic Year Filter */}
      <div className="flex items-center gap-2.5">
        {/* Academic Year Dropdown Filter */}
        <div ref={termRef} className="relative">
          <button
            onClick={() => setIsTermDropdownOpen(!isTermDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-xs focus:ring-1 focus:ring-[#1E40AF]"
          >
            <Calendar size={14} className="text-[#1E40AF] shrink-0" />
            <span className="font-semibold text-slate-800">{activeTerm.label}</span>
            <ChevronDown
              size={13}
              className={`text-slate-400 transition-transform duration-150 ${
                isTermDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isTermDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-md shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                <span>Filter Academic Term</span>
                <span className="text-[9px] text-[#1E40AF] font-semibold lowercase">system-wide</span>
              </div>
              <div className="space-y-0.5 px-1 max-h-60 overflow-y-auto">
                {terms.map((term) => {
                  const isSelected = activeTerm.id === term.id || activeTerm.label === term.label;
                  const isActiveStatus = term.is_active || term.status === 'Active Term';

                  return (
                    <button
                      key={term.code || term.label}
                      onClick={() => {
                        setIsTermDropdownOpen(false);
                        if (!isSelected) {
                          setPendingTerm(term);
                          setIsConfirmModalOpen(true);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#1E40AF]/10 text-[#1E40AF] font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className={isSelected ? 'text-[#1E40AF]' : 'text-slate-400'} />
                        <span className="truncate">{term.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-xs font-semibold ${
                            isActiveStatus
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isActiveStatus ? 'Active Term' : term.status}
                        </span>
                        {isSelected && <Check size={13} className="text-[#1E40AF]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Registrar Add School Year Action */}
              {user?.role?.toUpperCase() === 'REGISTRAR' && (
                <div className="pt-1.5 mt-1 border-t border-slate-100 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTermDropdownOpen(false);
                      setIsAddTermModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1E40AF] text-xs font-bold transition-colors cursor-pointer border border-blue-200"
                  >
                    <Plus size={13} />
                    <span>Add School Year</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Before Updating Academic Term */}
      {isConfirmModalOpen && pendingTerm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative my-auto bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start gap-3.5 bg-gradient-to-r from-amber-50/70 to-blue-50/50">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0 shadow-xs">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900">
                  Update Active Academic Term?
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Are you sure you want to update the school year and semester?
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isUpdating) {
                    setIsConfirmModalOpen(false);
                    setPendingTerm(null);
                  }
                }}
                disabled={isUpdating}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Term Transition Visualizer */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Current Active
                  </span>
                  <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                    {activeTerm.label}
                  </p>
                  <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                    {activeTerm.status}
                  </span>
                </div>

                <div className="p-2 rounded-full bg-blue-100/60 text-[#1E40AF] shrink-0">
                  <ArrowRight size={16} />
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <span className="text-[10px] uppercase font-bold text-[#1E40AF] tracking-wider block">
                    New Active Term
                  </span>
                  <p className="text-xs font-bold text-[#1E40AF] truncate mt-0.5">
                    {pendingTerm.label}
                  </p>
                  <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    Active Term
                  </span>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="rounded-lg bg-blue-50/70 border border-blue-200/80 p-3 text-xs text-blue-900 leading-relaxed space-y-1">
                <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-[#1E40AF] shrink-0" />
                  System-Wide Impact:
                </p>
                <p className="text-blue-800 text-[11px]">
                  Updating the active term immediately synchronizes the <strong>entire PERMEASE system</strong>. New student registrations, study load curricula presets, promissory note requests, and exam permits will automatically default to <strong>{pendingTerm.label}</strong>.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPendingTerm(null);
                }}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const success = await updateActiveTerm(pendingTerm);
                  if (success) {
                    setIsConfirmModalOpen(false);
                    setPendingTerm(null);
                  }
                }}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-800 active:bg-blue-900 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Updating System...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Yes, Update Term</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Registrar: Add School Year / Academic Term Modal */}
      {isAddTermModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative my-auto bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#1E40AF]/10 text-[#1E40AF] border border-[#1E40AF]/20 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Academic Term / School Year
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Registrar institutional academic calendar setup
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingTerm) setIsAddTermModalOpen(false);
                }}
                disabled={isSubmittingTerm}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddTermSubmit} className="p-5 space-y-4">
              {/* School Year Range */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Year Range
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block mb-1">Start Year</span>
                    <input
                      type="number"
                      min="2020"
                      max="2099"
                      value={startYear}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartYear(val);
                        if (val && !isNaN(Number(val))) {
                          setEndYear(String(Number(val) + 1));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] bg-white text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium block mb-1">End Year</span>
                    <input
                      type="number"
                      min="2020"
                      max="2099"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] bg-white text-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Semester Term
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1st Sem', '2nd Sem', 'Summer'] as const).map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => setSelectedSemester(sem)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        selectedSemester === sem
                          ? 'bg-[#1E40AF] text-white border-[#1E40AF] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Display */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Generated Term Label
                </span>
                <p className="text-xs font-bold text-[#1E40AF]">
                  A.Y. {startYear}–{endYear} • {selectedSemester}
                </p>
              </div>

              {/* Set as Active Term Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={makeTermActive}
                  onChange={(e) => setMakeTermActive(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#1E40AF] focus:ring-[#1E40AF] cursor-pointer"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    Set as active term immediately
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight block">
                    Automatically activates this term across student registration and balances.
                  </span>
                </div>
              </label>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTermModalOpen(false)}
                  disabled={isSubmittingTerm}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTerm || !startYear || !endYear}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] hover:bg-blue-800 active:bg-blue-900 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTerm ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Create Academic Term</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

