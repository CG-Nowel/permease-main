import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PermEaseLogo } from '../../components/ui/PermEaseLogo.tsx';
import {
  KioskAttractorScreen,
  KioskTapStation,
  KioskStepper,
  KioskTutorialModal,
  KioskExamDial,
  ExamPeriod,
  KioskLiquidPullTray,
  KioskDispenseStation,
  KioskReceiptPullDown,
} from './components/index.ts';
import { KioskAudio } from '../../lib/audio.ts';
import {
  Printer,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Building2,
  Receipt,
  Clock,
  FileText,
  Volume2,
  VolumeX,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  ArrowDown,
  User,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStudentStore } from '../../store/studentStore.ts';
import type { Student } from '../../types/index.ts';

type KioskScreenState =
  | 'IDLE_WAITING'
  | 'CARD_NOT_RECOGNIZED'
  | 'STUDENT_RECOGNIZED_ELIGIBLE'
  | 'STUDENT_WITH_BALANCE'
  | 'ALREADY_PRINTED_REPRINT_REQUIRED'
  | 'REPRINT_APPROVED_ELIGIBLE'
  | 'PRINTING_SUCCESS';

export interface KioskStudentProfile {
  id?: number;
  name: string;
  studentNumber: string;
  courseProgram: string;
  yearLevel: string;
  section: string;
  financialStatus: 'CLEARED' | 'WITH_BALANCE';
  permitNumber: string;
  printCount: number;
  isPromissoryCleared?: boolean;
  promissoryNoteNumber?: string;
  promissoryOrNumber?: string;
  promissoryPending?: boolean;
}

export const KioskPage: React.FC = () => {
  const { students, getStudentById, getStudentByNumberOrRfid, markPermitPrinted } = useStudentStore();
  const [screenState, setScreenState] = useState<KioskScreenState>('IDLE_WAITING');
  const [currentStudent, setCurrentStudent] = useState<KioskStudentProfile | null>(null);
  const [countdown, setCountdown] = useState<number>(7);
  const [selectedExamPeriod, setSelectedExamPeriod] = useState<ExamPeriod>('Midterms');
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [isAttractorMode, setIsAttractorMode] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live campus clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Idle screensaver trigger: KioskTapStation is the permanent animated idle station
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    const handleUserActivity = () => resetIdleTimer();
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [resetIdleTimer]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    KioskAudio.setMuted(newMuted);
    if (!newMuted) {
      KioskAudio.playKeyClick();
    }
  };

  // Auto-reset countdown timer for warning/alert screens
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (
      screenState === 'CARD_NOT_RECOGNIZED' ||
      screenState === 'STUDENT_WITH_BALANCE' ||
      screenState === 'ALREADY_PRINTED_REPRINT_REQUIRED'
    ) {
      setCountdown(9);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setScreenState('IDLE_WAITING');
            setCurrentStudent(null);
            return 7;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [screenState]);

  // Process student record into Kiosk screen state
  const handleProcessStudent = useCallback((student: Student) => {
    setIsAttractorMode(false);
    setIsHelpOpen(false);
    setIsTutorialOpen(false);

    const isCleared = student.financial_status?.status === 'CLEARED';
    const isPrinted = student.current_permit?.status === 'PRINTED';
    const reprintAllowed = Boolean(student.current_permit?.reprint_allowed);
    const hasPromissory = student.active_promissory;
    const isPromissoryApproved = hasPromissory?.status === 'APPROVED';
    const isPromissoryPending = hasPromissory?.status === 'PENDING';

    const profile: KioskStudentProfile = {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`.toUpperCase(),
      studentNumber: student.student_number,
      courseProgram: `${student.course} ${student.program}`.toUpperCase(),
      yearLevel: student.grade_year_level,
      section: student.section,
      financialStatus: isCleared ? 'CLEARED' : 'WITH_BALANCE',
      permitNumber: student.current_permit?.permit_number || `PRM-2026-${String(student.id).padStart(5, '0')}`,
      printCount: student.current_permit?.print_count || 0,
      isPromissoryCleared: isCleared && isPromissoryApproved,
      promissoryNoteNumber: hasPromissory?.request_number,
      promissoryOrNumber: hasPromissory?.official_receipt_number,
      promissoryPending: !isCleared && isPromissoryPending,
    };

    setCurrentStudent(profile);

    if (!isCleared) {
      KioskAudio.playWarningTone();
      setScreenState('STUDENT_WITH_BALANCE');
    } else if (isPrinted && !reprintAllowed) {
      KioskAudio.playWarningTone();
      setScreenState('ALREADY_PRINTED_REPRINT_REQUIRED');
    } else if (reprintAllowed) {
      KioskAudio.playSuccessChime();
      setScreenState('REPRINT_APPROVED_ELIGIBLE');
    } else {
      KioskAudio.playSuccessChime();
      setScreenState('STUDENT_RECOGNIZED_ELIGIBLE');
    }
  }, []);

  // Simulate or process RFID Card Scan
  const handleScanCard = useCallback(
    (uid: string) => {
      setIsAttractorMode(false);
      setIsHelpOpen(false);

      if (uid === 'UNKNOWN' || uid === '0') {
        KioskAudio.playWarningTone();
        setScreenState('CARD_NOT_RECOGNIZED');
        return;
      }

      if (uid === 'CLEARED_INITIAL' || uid === '1') {
        const student1 = getStudentById(1);
        if (student1) {
          handleProcessStudent(student1);
          return;
        }
      }

      if (uid === 'WITH_BALANCE' || uid === '2' || uid === 'A9B8C7D6' || uid === '2026-00002') {
        const student2 = getStudentById(2);
        if (student2) {
          handleProcessStudent(student2);
          return;
        }
      }

      if (uid === 'ALREADY_PRINTED' || uid === '3') {
        const student3 = getStudentById(3);
        if (student3) {
          handleProcessStudent(student3);
          return;
        }
      }

      if (uid === 'REPRINT_APPROVED' || uid === '4') {
        const student3 = getStudentById(3);
        if (student3) {
          const studentCopy: Student = {
            ...student3,
            current_permit: student3.current_permit ? { ...student3.current_permit, reprint_allowed: true } : null,
          };
          handleProcessStudent(studentCopy);
          return;
        }
      }

      const found = getStudentByNumberOrRfid(uid);
      if (found) {
        handleProcessStudent(found);
      } else {
        KioskAudio.playWarningTone();
        setScreenState('CARD_NOT_RECOGNIZED');
      }
    },
    [getStudentById, getStudentByNumberOrRfid, handleProcessStudent]
  );

  // Hardware RFID Reader (HID keyboard wedge listener) & hotkeys
  useEffect(() => {
    let rfidBuffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAttractorMode) {
        setIsAttractorMode(false);
      }

      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        KioskAudio.playKeyClick();
        setScreenState('IDLE_WAITING');
        setCurrentStudent(null);
        setIsHelpOpen(false);
        setIsTutorialOpen(false);
        rfidBuffer = '';
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 300) {
        rfidBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (rfidBuffer.trim().length > 0) {
          handleScanCard(rfidBuffer.trim());
          rfidBuffer = '';
        }
        return;
      }

      if (e.key.length === 1) {
        rfidBuffer += e.key;

        // Quick demo shortcuts when single key pressed
        if (rfidBuffer.length === 1) {
          if (e.key === '1') handleScanCard('CLEARED_INITIAL');
          else if (e.key === '2') handleScanCard('WITH_BALANCE');
          else if (e.key === '3') handleScanCard('ALREADY_PRINTED');
          else if (e.key === '4') handleScanCard('REPRINT_APPROVED');
          else if (e.key === '0') handleScanCard('UNKNOWN');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScanCard, isAttractorMode]);

  const handlePrintPermit = useCallback(() => {
    if (currentStudent?.id) {
      KioskAudio.playKeyClick();
      markPermitPrinted(currentStudent.id);
      setIsDispensing(true);
      setScreenState('PRINTING_SUCCESS');
    }
  }, [currentStudent, markPermitPrinted]);

  // Safety session timeout for active student screen: returns to idle after 60s of complete inactivity (NO auto-print)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (
      (screenState === 'STUDENT_RECOGNIZED_ELIGIBLE' || screenState === 'REPRINT_APPROVED_ELIGIBLE') &&
      currentStudent
    ) {
      timer = setTimeout(() => {
        handleResetToIdle();
      }, 60000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [screenState, currentStudent]);

  const handleResetToIdle = () => {
    KioskAudio.playKeyClick();
    setScreenState('IDLE_WAITING');
    setCurrentStudent(null);
    setIsHelpOpen(false);
    setIsTutorialOpen(false);
  };

  // Determine current step for progress indicator
  const currentStep =
    screenState === 'IDLE_WAITING' || screenState === 'CARD_NOT_RECOGNIZED'
      ? 1
      : screenState === 'PRINTING_SUCCESS'
      ? 3
      : 2;

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-0 m-0 select-none overflow-hidden">
      {/* 1. Attractor Mode Screensaver */}
      {isAttractorMode && (
        <KioskAttractorScreen onWake={() => setIsAttractorMode(false)} />
      )}

      {/* 2. Interactive Step-by-Step Kiosk Tutorial Modal */}
      <KioskTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onTryDemo={() => handleScanCard('CLEARED_INITIAL')}
      />

      {/* 4. Kiosk Help / Information Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0B172E] border-2 border-[#D4AF37]/50 rounded-3xl p-6 text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-bold">
                    <Info size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white font-serif-brand">Student Kiosk Guide</h3>
                    <p className="text-xs text-slate-300">Self-Service Instructions & Office Locations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-[#FFF2B2] mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>How to Print Your Permit:</span>
                  </h4>
                  <p className="text-slate-300">
                    Tap your student RFID badge on the scanner pad. If your financial clearance is verified, your official test permit will dispense from the printer tray below.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                    <Building2 size={14} className="text-rose-400" />
                    <span>Card Not Registered?</span>
                  </h4>
                  <p className="text-slate-300">
                    Visit the <strong className="text-white">Registrar's Office (Window 1)</strong> to encode and link your physical ID card to your enrollment profile.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                    <Receipt size={14} className="text-amber-400" />
                    <span>Balance Due or Need a Permit Reprint?</span>
                  </h4>
                  <p className="text-slate-300">
                    Visit the <strong className="text-white">Accounting Office (Window 3)</strong> to settle tuition obligations or pay the ₱50 permit reprint fee.
                  </p>
                </div>
              </div>

              {/* Interactive Tutorial Shortcut */}
              <button
                type="button"
                onClick={() => {
                  KioskAudio.playKeyClick();
                  setIsHelpOpen(false);
                  setIsTutorialOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-xs text-[#FFF2B2] font-bold border border-[#D4AF37]/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Sparkles size={15} className="text-[#D4AF37]" />
                <span>Launch Interactive Visual Tutorial (Step-by-Step)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-full min-h-[48px] rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide active:scale-98 transition-all cursor-pointer"
              >
                Close Guide
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* 🏛️ FLUSH TOP BAR (EDGE-TO-EDGE, NO PADDING GAPS) */}
      <header className="w-full shrink-0 flex items-center justify-between px-6 sm:px-10 py-2.5 bg-[#050E20] border-b border-white/10 shadow-sm z-30">
        {/* Left: Brand Lockup with Logo Mark (Single line, never collides) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/images/permease-mark-lightrim.png"
            alt="PermEase"
            className="h-7 sm:h-8 w-auto object-contain select-none"
          />
          <div className="flex flex-col text-left">
            <span className="font-serif-brand font-black text-white text-sm sm:text-base tracking-wider whitespace-nowrap leading-tight">
              PERM<span className="text-[#D4AF37]">EASE</span>
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase whitespace-nowrap leading-none mt-0.5">
              STATION #01 • AY 2026–2027
            </span>
          </div>
        </div>

        {/* Center: Linear 3-Step Process Indicator */}
        <div className="hidden md:flex items-center justify-center shrink-0 mx-2">
          <KioskStepper currentStep={currentStep} />
        </div>

        {/* Right: Clock, Tutorial, Sound & Help (Reach & Contrast removed) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Campus Time */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-slate-200">
            <Clock size={12} className="text-[#D4AF37]" />
            <span>{currentTime || '08:00 AM'}</span>
          </div>

          {/* Interactive Tutorial Button */}
          <button
            type="button"
            onClick={() => {
              KioskAudio.playKeyClick();
              setIsTutorialOpen(true);
            }}
            className="h-7 sm:h-8 px-2.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 active:scale-95 border border-[#D4AF37]/50 text-[#FFF2B2] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Step-by-step interactive tutorial"
          >
            <Sparkles size={13} className="text-[#D4AF37]" />
            <span className="text-[11px] uppercase tracking-wider">Tutorial</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="h-7 sm:h-8 px-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} className="text-[#D4AF37]" />}
            <span className="hidden sm:inline text-[11px]">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>

          {/* Help Button */}
          <button
            type="button"
            onClick={() => {
              KioskAudio.playKeyClick();
              setIsHelpOpen(true);
            }}
            className="h-7 sm:h-8 px-2 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Info size={13} className="text-blue-400" />
            <span className="hidden sm:inline text-[11px]">Help</span>
          </button>
        </div>
      </header>

      {/* ================================================================ */}
      {/* 🎯 MAIN ACTION VIEWPORT (PERFECT VERTICAL BUDGET FOR 15.6")       */}
      {/* ================================================================ */}
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 my-auto px-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ============================================================== */}
          {/* 1. IDLE STATE: Grounded Physical Card Tap Station              */}
          {/* ============================================================== */}
          {screenState === 'IDLE_WAITING' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1 flex flex-col items-center justify-center my-auto"
            >
              <KioskTapStation
                onOpenTutorial={() => {
                  KioskAudio.playKeyClick();
                  setIsTutorialOpen(true);
                }}
                onScanCard={(uid) => handleScanCard(uid)}
              />
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* 2. CARD NOT RECOGNIZED                                         */}
          {/* ============================================================== */}
          {screenState === 'CARD_NOT_RECOGNIZED' && (
            <motion.div
              key="unrecognized"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-lg bg-[#0C1935] border-2 border-rose-500/60 rounded-3xl p-4 sm:p-5 shadow-xl text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border-2 border-rose-500/40">
                <AlertOctagon size={26} />
              </div>

              <div className="space-y-1">
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                  Unregistered Card Tag
                </div>
                <h3 className="text-xl font-black text-white leading-tight">
                  Student ID Card Not Recognized
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  This card badge is not linked to any student account in the PERMEASE registry.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-left flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-200 leading-relaxed">
                  <strong className="block text-white font-bold mb-0.5">Required Action:</strong>
                  Please present your physical student ID at the <span className="underline font-bold text-white">Registrar's Office (Window 1)</span> to register and encode your RFID chip.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1.5 flex items-center justify-between gap-3 border-t border-white/10">
                <span className="text-slate-400 font-mono text-[11px]">
                  Auto-reset in <strong className="text-rose-400 font-bold">{countdown}s</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResetToIdle}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>Tap Another Card</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* 3. CLEARED STUDENT: ROTARY TERM DIAL & RECEIPT PULL STAGE       */}
          {/* ============================================================== */}
          {screenState === 'STUDENT_RECOGNIZED_ELIGIBLE' && currentStudent && (
            <motion.div
              key="eligible"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl sm:max-w-3xl flex flex-col items-center justify-center gap-4 my-auto"
            >
              {/* Prominent Account Cleared & Ready to Dispense Banner (Spacious & Aligned) */}
              <div className="w-full bg-[#081B34] border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_12px_36px_rgba(16,185,129,0.2)] text-left space-y-3">
                {/* Top Status & ID Row */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-black tracking-wider uppercase whitespace-nowrap flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ACCOUNT CLEARED
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
                        • READY TO DISPENSE
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-right shrink-0">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block leading-none">
                        STUDENT NUMBER
                      </span>
                      <span className="text-base sm:text-lg font-mono font-black text-[#D4AF37] tracking-wider leading-tight block mt-0.5">
                        {currentStudent.studentNumber}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-mono font-bold text-slate-200 uppercase whitespace-nowrap">
                      {currentStudent.yearLevel || '3rd Year'}
                    </span>
                  </div>
                </div>

                {/* Bottom Student Name & Instruction Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white font-serif-brand tracking-wide leading-tight">
                      {currentStudent.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-300 font-medium mt-0.5">
                      Permit release authorized • Pull down the receipt below to dispense
                    </p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">COURSE & PROGRAM</span>
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase block">{currentStudent.courseProgram || 'BSIT'}</span>
                  </div>
                </div>
              </div>

              {/* Physical Permit Pull-Down Dispenser: Drag receipt down out of printer slot */}
              <div className="w-full flex flex-col items-center gap-2">
                <KioskReceiptPullDown
                  student={currentStudent}
                  examPeriod={selectedExamPeriod}
                  onTriggerDispense={handlePrintPermit}
                  disabled={isDispensing}
                  isDispensing={isDispensing}
                />

                {/* Cancel / Reset Button */}
                <div className="text-center pt-2 w-full">
                  <button
                    type="button"
                    onClick={handleResetToIdle}
                    className="kiosk-target px-4 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors active:scale-95"
                  >
                    <RotateCcw size={13} />
                    <span>Cancel & Return to Idle</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* 4. STUDENT WITH BALANCE: GROUNDED BLOCKED CARD                  */}
          {/* ============================================================== */}
          {screenState === 'STUDENT_WITH_BALANCE' && currentStudent && (
            <motion.div
              key="balance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-2xl bg-[#0C1935] border-2 border-rose-500/60 rounded-3xl p-5 sm:p-6 shadow-xl text-left space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h4 className="text-base sm:text-lg font-black text-white">{currentStudent.name}</h4>
                  <p className="text-[11px] font-mono text-rose-300 font-bold">{currentStudent.studentNumber}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                  BALANCE DUE
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/40">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-black text-rose-200">Examination Permit Withheld</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
                  Your student record has an unsettled tuition or miscellaneous fee balance. Examination permits can only be released upon financial settlement.
                </p>
              </div>

              {currentStudent.promissoryPending ? (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Clock size={13} />
                    <span>Promissory Note ({currentStudent.promissoryNoteNumber}) Pending Accounting Approval</span>
                  </div>
                  <p className="text-amber-100/90 leading-relaxed">
                    Your promissory note is endorsed. Please proceed to the <strong className="text-white">Accounting Office (Window 3)</strong> to finalize clearance.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3 text-xs flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-white block font-bold mb-0.5">To Clear This Hold:</strong>
                    Please proceed to the <span className="text-[#D4AF37] font-bold">Accounting Office (Window 3)</span> to settle payment or file an endorsed promissory note.
                  </div>
                </div>
              )}

              <div className="pt-1.5 flex items-center justify-between gap-3 border-t border-white/10">
                <span className="text-slate-400 font-mono text-[11px]">
                  Auto-reset in <strong className="text-rose-400 font-bold">{countdown}s</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResetToIdle}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>Done / Dismiss</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* 5. ALREADY PRINTED - REPRINT REQUIRED                           */}
          {/* ============================================================== */}
          {screenState === 'ALREADY_PRINTED_REPRINT_REQUIRED' && currentStudent && (
            <motion.div
              key="already_printed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-2xl bg-[#0C1935] border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-xl text-left space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h4 className="text-base sm:text-lg font-black text-white">{currentStudent.name}</h4>
                  <p className="text-[11px] font-mono text-amber-300 font-bold">{currentStudent.studentNumber}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase">
                  PERMIT ISSUED
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-black text-amber-200">Permit Already Issued</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-md mx-auto">
                  Your official examination permit was already printed. To prevent duplicate copies, reprinting requires authorized accounting payment.
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3 text-xs flex items-start gap-2">
                <Receipt className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  <strong className="text-white block font-bold mb-0.5">Reprint Procedure:</strong>
                  1. Pay the ₱50 reprint fee at the <span className="text-amber-300 font-bold">Accounting Office (Window 3)</span>.
                  <br />
                  2. Once authorized, tap your card here again to dispense your reprint copy.
                </div>
              </div>

              <div className="pt-1.5 flex items-center justify-between gap-3 border-t border-white/10">
                <span className="text-slate-400 font-mono text-[11px]">
                  Auto-reset in <strong className="text-amber-400 font-bold">{countdown}s</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResetToIdle}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>Done / Dismiss</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* 6. REPRINT APPROVED & ELIGIBLE                                  */}
          {/* ============================================================== */}
          {screenState === 'REPRINT_APPROVED_ELIGIBLE' && currentStudent && (
            <motion.div
              key="reprint_approved"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5 border-4 border-[#D4AF37]"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/images/permease-mark.png"
                    alt="PermEase"
                    className="h-8 w-auto object-contain"
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block leading-none">
                      AUTHORIZED REPRINT
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[#0B1B3D] mt-0.5">
                      Reprint Receipt Confirmed
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-xs">
                  FEE PAID
                </span>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none">STUDENT</span>
                    <h4 className="text-lg sm:text-xl font-black text-[#0B1B3D] leading-tight">{currentStudent.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block leading-none">ID NUMBER</span>
                    <span className="font-mono text-base font-black text-blue-700 block leading-tight">
                      {currentStudent.studentNumber}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium pt-1 border-t border-slate-200">
                  {currentStudent.courseProgram} • {currentStudent.yearLevel} ({currentStudent.section})
                </p>
              </div>

              {/* Massive Gold Print Button */}
              <button
                type="button"
                onClick={handlePrintPermit}
                className="w-full min-h-[56px] sm:min-h-[60px] py-2.5 px-5 rounded-2xl bg-[#D4AF37] hover:bg-[#c29e2e] active:scale-98 text-slate-950 font-black text-lg sm:text-xl tracking-wide shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 border-[#b59226]"
              >
                <Printer size={24} className="shrink-0" />
                <span>PRINT AUTHORIZED REPRINT</span>
              </button>

              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={handleResetToIdle}
                  className="px-3 py-1 rounded-xl text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Cancel Session</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================================== */}
          {/* 7. PRINTING SUCCESS: SIMULATED PRINTER DISPENSER FEED           */}
          {/* ============================================================== */}
          {screenState === 'PRINTING_SUCCESS' && currentStudent && (
            <motion.div
              key="dispense_station"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl mx-auto flex flex-col items-center justify-center my-auto"
            >
              <KioskDispenseStation
                student={
                  getStudentById(currentStudent.id || 1) || {
                    id: currentStudent.id || 1,
                    student_number: currentStudent.studentNumber,
                    first_name: currentStudent.name.split(' ')[0] || 'Juan',
                    last_name: currentStudent.name.split(' ').slice(1).join(' ') || 'Dela Cruz',
                    grade_year_level: currentStudent.yearLevel,
                    section: currentStudent.section,
                    course: currentStudent.courseProgram.split(' ')[0] || 'BS',
                    program: currentStudent.courseProgram.split(' ').slice(1).join(' ') || 'IT',
                    status: 'ACTIVE',
                    balance_amount: 0,
                    financial_status: { id: 1, student_id: currentStudent.id || 1, status: 'CLEARED' },
                    current_permit: {
                      id: 1,
                      student_id: currentStudent.id || 1,
                      permit_number: currentStudent.permitNumber,
                      academic_year: '2026-2027',
                      semester: '1st Semester',
                      exam_period: selectedExamPeriod,
                      status: 'PRINTED',
                      print_count: (currentStudent.printCount || 0) + 1,
                      reprint_allowed: false,
                    },
                  }
                }
                examPeriod={selectedExamPeriod}
                onFinish={handleResetToIdle}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {screenState !== 'IDLE_WAITING' && screenState !== 'STUDENT_RECOGNIZED_ELIGIBLE' && screenState !== 'PRINTING_SUCCESS' ? (
        <div className="w-full shrink-0 pt-0.5 pb-0.5">
          <button
            type="button"
            onClick={handleResetToIdle}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-slate-300 hover:text-white transition-all cursor-pointer border border-white/20"
          >
            <RotateCcw size={13} />
            <span>Cancel Session • Return to Home</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
