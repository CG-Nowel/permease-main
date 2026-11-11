import React, { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
import { KioskAudio } from '../../../lib/audio.ts';
import {
  User,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  FileText,
  Calendar,
  Clock,
  Layers,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import type { Student, PresetSubject } from '../../../types/index.ts';

gsap.registerPlugin(Flip, useGSAP);

interface KioskClearanceBentoProps {
  student: Student;
  examPeriod?: string;
  onPrintClick?: () => void;
  isDispensing?: boolean;
}

type BentoTileId = 'identity' | 'financial' | 'permit' | 'subjects' | null;

export const KioskClearanceBento: React.FC<KioskClearanceBentoProps> = ({
  student,
  examPeriod = 'Midterms',
  onPrintClick,
  isDispensing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<BentoTileId>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  const toggleExpand = (id: BentoTileId) => {
    KioskAudio.playKeyClick();

    // 1. Capture FLIP state before DOM updates
    flipStateRef.current = Flip.getState('.bento-tile', {
      props: 'opacity,backgroundColor,borderRadius',
    });

    // 2. Toggle target state
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 3. Animate layout transition after React DOM commit
  useLayoutEffect(() => {
    if (!flipStateRef.current) return;

    Flip.from(flipStateRef.current, {
      duration: 0.55,
      ease: 'power3.out',
      absolute: true,
      nested: true,
      scale: true,
      prune: true,
      onComplete: () => {
        flipStateRef.current = null;
      },
    });
  }, [expandedId]);

  const isCleared = student.financial_status?.status === 'CLEARED';
  const subjects: PresetSubject[] = student.subjects || [];

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto p-2 sm:p-4 select-none touch-manipulation"
    >
      {/* Overlay Backdrop when a tile is expanded */}
      {expandedId && (
        <div
          onClick={() => toggleExpand(null)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Responsive Bento Grid */}
      <div className="relative z-40 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 auto-rows-fr">
        {/* ============================================================== */}
        {/* TILE 1: STUDENT IDENTITY & ACADEMIC CREDENTIALS (Span 7)        */}
        {/* ============================================================== */}
        <div
          data-flip-id="tile-identity"
          onClick={() => expandedId !== 'identity' && toggleExpand('identity')}
          className={`bento-tile rounded-3xl bg-[#09162E] border-2 border-white/10 p-5 shadow-xl transition-all cursor-pointer ${
            expandedId === 'identity'
              ? 'fixed inset-4 sm:inset-12 z-50 overflow-y-auto bg-[#07132B] border-[#D4AF37] shadow-2xl flex flex-col justify-between'
              : expandedId
              ? 'hidden'
              : 'md:col-span-7 flex flex-col justify-between hover:border-[#D4AF37]/50 active:scale-98'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shadow-xs">
                <User size={18} />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block leading-none">
                  Student Profile
                </span>
                <span className="text-xs font-bold text-white tracking-wide leading-tight">
                  Academic Identification
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(expandedId === 'identity' ? null : 'identity');
              }}
              className="kiosk-target w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center cursor-pointer active:scale-90"
              aria-label="Toggle Expand Identity Tile"
            >
              {expandedId === 'identity' ? <Minimize2 size={16} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Student Core Content */}
          <div className="my-3 space-y-2">
            <div>
              <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider block">
                FULL NAME
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {student.first_name} {student.last_name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-slate-400 block font-mono">STUDENT NUMBER</span>
                <span className="font-mono font-black text-sm text-[#FFF2B2]">
                  {student.student_number}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[9px] text-slate-400 block font-mono">PROGRAM</span>
                <span className="font-bold text-slate-200 text-xs truncate block">
                  {student.course} {student.program}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Badge & Expanded Detail View */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="text-[11px]">
              {student.grade_year_level} • {student.section}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-[10px] font-mono text-blue-300">
              {student.student_type || 'Regular'} Student
            </span>
          </div>

          {expandedId === 'identity' && (
            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2">
              <h4 className="font-bold text-[#FFF2B2]">Enrollment Registry Metadata</h4>
              <p className="text-slate-300">
                Semester: <strong>{student.semester || '1st Semester'}</strong> • Academic Year:{' '}
                <strong>{student.academic_year || '2026-2027'}</strong>
              </p>
              <p className="text-slate-300">
                RFID Chip UID:{' '}
                <strong className="font-mono text-[#D4AF37]">
                  {student.rfid_card?.rfid_uid || 'ENCRYPTED_HARDWARE_TAG'}
                </strong>
              </p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* TILE 2: FINANCIAL CLEARANCE & CASHIER LEDGER (Span 5)           */}
        {/* ============================================================== */}
        <div
          data-flip-id="tile-financial"
          onClick={() => expandedId !== 'financial' && toggleExpand('financial')}
          className={`bento-tile rounded-3xl bg-[#09162E] border-2 p-5 shadow-xl transition-all cursor-pointer ${
            isCleared ? 'border-emerald-500/40' : 'border-rose-500/50'
          } ${
            expandedId === 'financial'
              ? 'fixed inset-4 sm:inset-12 z-50 overflow-y-auto bg-[#07132B] border-[#D4AF37] shadow-2xl flex flex-col justify-between'
              : expandedId
              ? 'hidden'
              : 'md:col-span-5 flex flex-col justify-between hover:border-[#D4AF37]/50 active:scale-98'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${
                  isCleared
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-400/30 text-rose-400'
                }`}
              >
                <Receipt size={18} />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block leading-none">
                  Accounting Office
                </span>
                <span className="text-xs font-bold text-white tracking-wide leading-tight">
                  Financial Status
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(expandedId === 'financial' ? null : 'financial');
              }}
              className="kiosk-target w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center cursor-pointer active:scale-90"
              aria-label="Toggle Expand Financial Tile"
            >
              {expandedId === 'financial' ? <Minimize2 size={16} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Balance Core Content */}
          <div className="my-3 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
              OUTSTANDING BALANCE
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                ₱{student.balance_amount ? student.balance_amount.toLocaleString() : '0.00'}
              </span>
            </div>
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                  isCleared
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{isCleared ? 'ACCOUNT CLEARED' : 'BALANCE DUE'}</span>
              </span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400">
            {isCleared ? (
              <span className="text-emerald-300 font-medium">Eligible for test permit issuance</span>
            ) : (
              <span className="text-rose-300 font-medium">Clear balance at Accounting Window 3</span>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TILE 3: TEST PERMIT SERIAL & SECURITY AUTH (Span 5)             */}
        {/* ============================================================== */}
        <div
          data-flip-id="tile-permit"
          onClick={() => expandedId !== 'permit' && toggleExpand('permit')}
          className={`bento-tile rounded-3xl bg-[#09162E] border-2 border-white/10 p-5 shadow-xl transition-all cursor-pointer ${
            expandedId === 'permit'
              ? 'fixed inset-4 sm:inset-12 z-50 overflow-y-auto bg-[#07132B] border-[#D4AF37] shadow-2xl flex flex-col justify-between'
              : expandedId
              ? 'hidden'
              : 'md:col-span-5 flex flex-col justify-between hover:border-[#D4AF37]/50 active:scale-98'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-[#D4AF37] flex items-center justify-center shadow-xs">
                <FileText size={18} />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block leading-none">
                  Official Document
                </span>
                <span className="text-xs font-bold text-white tracking-wide leading-tight">
                  Permit Authentication
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(expandedId === 'permit' ? null : 'permit');
              }}
              className="kiosk-target w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center cursor-pointer active:scale-90"
              aria-label="Toggle Expand Permit Tile"
            >
              {expandedId === 'permit' ? <Minimize2 size={16} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Permit Content */}
          <div className="my-3 space-y-1.5">
            <span className="text-[10px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider block">
              PERMIT SERIAL NUMBER
            </span>
            <div className="font-mono text-lg sm:text-xl font-black text-[#FFF2B2] tracking-wider">
              {student.current_permit?.permit_number || `PRM-2026-${String(student.id).padStart(5, '0')}`}
            </div>
            <div className="text-xs text-slate-400">
              Exam Period: <strong className="text-white font-bold">{examPeriod}</strong>
            </div>
          </div>

          {/* Footer Badge */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Prints Issued: {student.current_permit?.print_count || 0}</span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold">DIGITALLY SIGNED</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TILE 4: ENROLLED SUBJECTS & EXAMINATION MATRIX (Span 7)         */}
        {/* ============================================================== */}
        <div
          data-flip-id="tile-subjects"
          onClick={() => expandedId !== 'subjects' && toggleExpand('subjects')}
          className={`bento-tile rounded-3xl bg-[#09162E] border-2 border-white/10 p-5 shadow-xl transition-all cursor-pointer ${
            expandedId === 'subjects'
              ? 'fixed inset-4 sm:inset-12 z-50 overflow-y-auto bg-[#07132B] border-[#D4AF37] shadow-2xl flex flex-col justify-between'
              : expandedId
              ? 'hidden'
              : 'md:col-span-7 flex flex-col justify-between hover:border-[#D4AF37]/50 active:scale-98'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shadow-xs">
                <GraduationCap size={18} />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase block leading-none">
                  Curriculum Courses
                </span>
                <span className="text-xs font-bold text-white tracking-wide leading-tight">
                  Enrolled Subject Load ({subjects.length} Courses)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(expandedId === 'subjects' ? null : 'subjects');
              }}
              className="kiosk-target w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center cursor-pointer active:scale-90"
              aria-label="Toggle Expand Subjects Tile"
            >
              {expandedId === 'subjects' ? <Minimize2 size={16} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Subjects Preview List */}
          <div className="my-2.5 space-y-1.5 max-h-36 overflow-hidden">
            {subjects.slice(0, 3).map((sub) => (
              <div
                key={sub.code}
                className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-mono font-bold text-[#D4AF37] mr-2">{sub.code}</span>
                  <span className="text-slate-200">{sub.title}</span>
                </div>
                <span className="shrink-0 text-[11px] font-mono text-slate-400">
                  {sub.units} Units
                </span>
              </div>
            ))}
            {subjects.length > 3 && (
              <p className="text-[10px] text-slate-400 text-center font-mono">
                + {subjects.length - 3} additional courses enrolled • Tap to view all
              </p>
            )}
          </div>

          {/* Footer Units Count */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Total Units:{' '}
              <strong className="text-white font-mono">
                {subjects.reduce((sum, s) => sum + s.units, 0)} Units
              </strong>
            </span>
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase">TAP TO INSPECT</span>
          </div>

          {expandedId === 'subjects' && (
            <div className="mt-4 space-y-2">
              <h4 className="font-bold text-[#FFF2B2] text-xs">All Enrolled Courses</h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {subjects.map((sub) => (
                  <div
                    key={sub.code}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#D4AF37] block">{sub.code}</span>
                      <span className="text-slate-200 font-medium">{sub.title}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">
                        {sub.units} Units
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
