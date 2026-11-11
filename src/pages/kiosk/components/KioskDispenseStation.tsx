import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { KioskAudio } from '../../../lib/audio.ts';
import {
  Printer,
  CheckCircle2,
  ArrowDown,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import type { Student } from '../../../types/index.ts';

gsap.registerPlugin(useGSAP);

interface KioskDispenseStationProps {
  student: Student;
  examPeriod: string;
  onFinish: () => void;
}

const PRINT_STEPS = [
  { threshold: 0, label: 'Initializing High-Speed Thermal Print Engine...', badge: 'STARTING' },
  { threshold: 22, label: 'Feeding Official Examination Permit from Top Slot...', badge: 'FEEDING' },
  { threshold: 50, label: 'Encoding Cryptographic Clearance Signature & QR...', badge: 'PRINTING' },
  { threshold: 82, label: 'Actuating Guillotine Precision Paper Cutter...', badge: 'CUTTING' },
  { threshold: 100, label: 'Permit Dispensed! Please Collect From Tray Below.', badge: 'DISPENSED' },
];

export const KioskDispenseStation: React.FC<KioskDispenseStationProps> = ({
  student,
  examPeriod,
  onFinish,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperTicketRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>(PRINT_STEPS[0].label);
  const [currentBadge, setCurrentBadge] = useState<string>(PRINT_STEPS[0].badge);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [autoResetCountdown, setAutoResetCountdown] = useState<number>(8);

  useGSAP(
    () => {
      // 1. Kinetic sound pulses during printing feed
      const soundInterval = setInterval(() => {
        KioskAudio.playDispenseTick();
      }, 550);

      // 2. Animate Progress from 0% to 100% over 4.2 seconds
      const progressObj = { value: 0 };

      gsap.to(progressObj, {
        value: 100,
        duration: 4.2,
        ease: 'power1.inOut',
        onUpdate: () => {
          const currentVal = Math.round(progressObj.value);
          setProgress(currentVal);

          // Update stage descriptor
          const matchedStep = [...PRINT_STEPS]
            .reverse()
            .find((step) => currentVal >= step.threshold);
          if (matchedStep) {
            setCurrentStepText(matchedStep.label);
            setCurrentBadge(matchedStep.badge);
          }

          // Continuous downward paper feed out of the top slot
          // Starts tucked up at -200px, feeds down to +190px (390px total travel)
          if (paperTicketRef.current) {
            const feedY = -200 + (currentVal / 100) * 390;
            gsap.set(paperTicketRef.current, { y: feedY });
          }

          // Thermal laser burn scan line sweeps downward
          if (scanLineRef.current) {
            const scanY = ((currentVal % 25) / 25) * 140;
            gsap.set(scanLineRef.current, { y: scanY });
          }
        },
        onComplete: () => {
          clearInterval(soundInterval);
          setIsCompleted(true);
          KioskAudio.playSuccessChime();

          // Elastic paper settle into dispenser tray
          if (paperTicketRef.current) {
            gsap.to(paperTicketRef.current, {
              y: 195,
              duration: 0.5,
              ease: 'elastic.out(1.2, 0.4)',
            });
          }
        },
      });

      return () => {
        clearInterval(soundInterval);
      };
    },
    { scope: containerRef }
  );

  // Auto-reset countdown once finished
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isCompleted) {
      timer = setInterval(() => {
        setAutoResetCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timer);
    };
  }, [isCompleted, onFinish]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-0 select-none"
    >
      {/* ============================================================== */}
      {/* 1. TOP HARDWARE TERMINAL HOUSING (MATCHES STEP 2 SLOT)         */}
      {/* ============================================================== */}
      <div className="w-full bg-[#08152D] border-2 border-[#D4AF37] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col items-center text-center">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Top Hardware Status Strip */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isCompleted ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-[#D4AF37] shadow-[0_0_10px_#f59e0b]'
                }`}
              />
            </span>
            <span className="font-mono text-xs sm:text-sm font-black text-slate-100 uppercase tracking-widest">
              {isCompleted ? 'PRINT CYCLE COMPLETE' : 'THERMAL HEAD ACTIVE • 203 DPI'}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-black tracking-wider uppercase border transition-colors ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-[#FFF2B2] border-amber-500/30'
            }`}
          >
            {currentBadge}
          </span>
        </div>

        {/* ============================================================== */}
        {/* 2. PRINTER HEAD SLOT MOUTH (WHERE PERMIT FEEDS DOWNWARD)       */}
        {/* ============================================================== */}
        <div className="w-full mt-4 flex flex-col items-center">
          {/* Top Machined Bezel Slot Mouth */}
          <div className="relative z-30 w-full h-4 rounded-full bg-gradient-to-b from-black via-[#040B18] to-black border border-[#D4AF37]/70 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)] flex items-center justify-center">
            <div className="w-5/6 h-1 rounded-full bg-amber-400/50 shadow-[0_0_12px_#d4af37]" />
          </div>

          {/* Paper Guide Canopy Slot: Paper feeds down smoothly out of slot */}
          <div className="relative z-20 w-full h-[230px] overflow-hidden -mt-2 pt-2 flex justify-center">
            {/* The Physical Permit Ticket feeding downward */}
            <div
              ref={paperTicketRef}
              className="w-[94%] bg-white text-slate-900 rounded-b-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8)] border-x-2 border-b-2 border-slate-300 p-5 flex flex-col justify-between font-mono text-xs will-change-transform relative"
              style={{ transform: 'translateY(-200px)' }}
            >
              {/* Laser Thermal Scanline Effect */}
              {!isCompleted && (
                <div
                  ref={scanLineRef}
                  className="pointer-events-none absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75 shadow-[0_0_10px_#38bdf8]"
                />
              )}

              {/* Document Header */}
              <div className="border-b-2 border-dashed pb-2.5 border-slate-300 flex items-center justify-between">
                <div>
                  <span className="font-serif-brand font-black text-sm text-[#0B1B3D] block leading-none">
                    PERMEASE
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                    Official Student Test Permit
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">
                    VALIDATED
                  </span>
                </div>
              </div>

              {/* Student Metadata Strip */}
              <div className="space-y-1.5 text-xs text-slate-800 py-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">STUDENT:</span>
                  <strong className="text-slate-900 font-black text-sm truncate max-w-[220px]">
                    {student.first_name} {student.last_name}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">ID NUMBER:</span>
                  <strong className="text-blue-700 font-black text-sm">{student.student_number}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">EXAM TERM:</span>
                  <strong className="text-[#aa851e] font-black uppercase text-sm">{examPeriod}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">PERMIT SERIAL:</span>
                  <span className="font-black text-slate-800">
                    {student.current_permit?.permit_number || `PRM-2026-${String(student.id).padStart(5, '0')}`}
                  </span>
                </div>
              </div>

              {/* Bottom Security Barcode Pattern */}
              <div className="border-t-2 border-dashed border-slate-300 pt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Institutional Clearance Seal</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 font-bold">AY 2026-2027</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. DYNAMIC STATUS & SUCCESS CELEBRATION OVERLAY                */}
        {/* ============================================================== */}
        <div className="w-full space-y-3 mt-4">
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="complete-banner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                {/* Glowing Circular Green Checkmark */}
                <div className="flex items-center justify-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.4], opacity: [0.7, 0] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                      className="absolute w-12 h-12 rounded-full border-2 border-emerald-400"
                    />
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_20px_#10b981]">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-mono font-black text-emerald-300 uppercase tracking-wider block">
                      PRINTER ALREADY PRINTED
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                      Permit Successfully Dispensed!
                    </h3>
                  </div>
                </div>

                {/* Prominent Collection Guide */}
                <div className="flex items-center justify-center gap-2 text-emerald-300 font-mono font-black text-xs sm:text-sm tracking-wider uppercase bg-emerald-500/15 py-2.5 px-4 rounded-2xl border border-emerald-400/40">
                  <ArrowDown size={18} className="text-emerald-400 animate-bounce" />
                  <span>Please retrieve physical permit at bottom output tray</span>
                  <ArrowDown size={18} className="text-emerald-400 animate-bounce" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="printing-banner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2.5"
              >
                {/* Progress Percent & Title */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Printer size={18} className="text-[#D4AF37] animate-pulse" />
                    <span>Dispensing Document...</span>
                  </span>
                  <span className="font-mono font-black text-base text-[#FFF2B2]">{progress}%</span>
                </div>

                {/* High-Tech Glowing Progress Track */}
                <div className="w-full h-3.5 bg-black/70 rounded-full border border-white/20 overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-[#D4AF37] to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_12px_#d4af37]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Subtitle Status */}
                <p className="text-xs font-mono text-slate-300 tracking-wide">
                  {currentStepText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ============================================================== */}
        {/* 4. FOOTER CONTROLS & AUTO-RESET COUNTDOWN                      */}
        {/* ============================================================== */}
        <div className="w-full pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            {isCompleted ? (
              <>
                Kiosk ready for next student in{' '}
                <strong className="text-emerald-400 font-bold text-sm">{autoResetCountdown}s</strong>
              </>
            ) : (
              <span className="text-amber-300/80">Dispense cycle in progress...</span>
            )}
          </span>

          <button
            type="button"
            onClick={onFinish}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer border border-white/15 shadow-sm"
          >
            <RotateCcw size={14} className="text-[#D4AF37]" />
            <span>Finish & Clear Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
