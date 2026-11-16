import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { useGSAP } from '@gsap/react';
import { KioskAudio } from '../../../lib/audio.ts';
import {
  Printer,
  ArrowDown,
  ChevronsDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { KioskStudentProfile } from '../KioskPage.tsx';

gsap.registerPlugin(Observer, useGSAP);

interface KioskReceiptPullDownProps {
  student: KioskStudentProfile;
  examPeriod: string;
  onTriggerDispense: () => void;
  disabled?: boolean;
  isDispensing?: boolean;
}

export const KioskReceiptPullDown: React.FC<KioskReceiptPullDownProps> = ({
  student,
  examPeriod,
  onTriggerDispense,
  disabled = false,
  isDispensing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperMoverRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [pullProgress, setPullProgress] = useState<number>(0);
  const isTriggeredRef = useRef<boolean>(false);
  const lastSoundTickRef = useRef<number>(0);

  const threshold = 130; // Drag displacement in px to trigger automatic dispense

  useGSAP(
    () => {
      if (!paperMoverRef.current || disabled || isDispensing) return;

      let currentY = 0;

      const observer = Observer.create({
        target: containerRef.current,
        type: 'touch,pointer',
        dragMinimum: 4,
        onPress() {
          isTriggeredRef.current = false;
        },
        onDrag(self) {
          if (isTriggeredRef.current) return;

          // Drag downwards only
          const delta = self.deltaY * 0.7;
          currentY = Math.max(0, Math.min(threshold + 40, currentY + delta));
          const progress = Math.min(1, currentY / threshold);
          setPullProgress(progress);

          // Audio clicks as paper feeds out
          if (Math.abs(currentY - lastSoundTickRef.current) > 22) {
            KioskAudio.playDispenseTick();
            lastSoundTickRef.current = currentY;
          }

          // Move the permit paper downward out of the top slot
          gsap.to(paperMoverRef.current, {
            y: currentY,
            duration: 0.08,
            overwrite: 'auto',
            force3D: true,
          });

          // Trigger point reached!
          if (currentY >= threshold && !isTriggeredRef.current) {
            isTriggeredRef.current = true;
            KioskAudio.playDispenseTick();

            // Smoothly feed the permit paper downward out of the slot into dispense
            gsap.to(paperMoverRef.current, {
              y: threshold + 220,
              opacity: 0.3,
              duration: 0.4,
              ease: 'power2.in',
              onComplete: () => {
                onTriggerDispense();
                gsap.set(paperMoverRef.current, { y: 0, opacity: 1 });
                setPullProgress(0);
              },
            });
          }
        },
        onDragEnd() {
          if (!isTriggeredRef.current) {
            // Elastic snap-back to top slot if released early
            gsap.to(paperMoverRef.current, {
              y: 0,
              duration: 0.5,
              ease: 'elastic.out(1.1, 0.4)',
              force3D: true,
            });
            currentY = 0;
            setPullProgress(0);
            lastSoundTickRef.current = 0;
          }
        },
      });

      return () => {
        observer.kill();
      };
    },
    { scope: containerRef, dependencies: [disabled, isDispensing] }
  );

  const handleDirectTap = () => {
    if (!disabled && !isDispensing && !isTriggeredRef.current) {
      isTriggeredRef.current = true;
      KioskAudio.playDispenseTick();

      if (paperMoverRef.current) {
        gsap.to(paperMoverRef.current, {
          y: threshold + 200,
          opacity: 0.3,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => {
            onTriggerDispense();
            gsap.set(paperMoverRef.current, { y: 0, opacity: 1 });
            setPullProgress(0);
          },
        });
      } else {
        onTriggerDispense();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center select-none touch-none"
    >
      {/* ============================================================== */}
      {/* 1. TOP THERMAL PRINTER HEAD FEED SLOT (EDGE-TO-EDGE)           */}
      {/* ============================================================== */}
      <div className="w-full relative z-30">
        <div className="w-full bg-[#08152E] border-2 border-[#D4AF37] rounded-2xl px-6 py-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.7)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </span>
            <span className="text-xs font-mono font-black tracking-wider uppercase text-emerald-300">
              PRINTER READY • THERMAL FEED SLOT
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FFF2B2]">
            <Printer size={14} className="text-[#D4AF37]" />
            <span>DIRECT RELEASE</span>
          </div>
        </div>

        {/* The Black Recessed Slot Mouth where the permit feeds down */}
        <div className="relative mx-auto w-[94%] h-3 bg-black rounded-b-lg shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)] border-x-2 border-b-2 border-slate-700/80 z-30 flex items-center justify-center">
          <div className="w-4/5 h-[1.5px] bg-amber-400/40 blur-[0.5px]" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PERMIT FEED VIEWPORT (Emerging from top slot downward)       */}
      {/* ============================================================== */}
      <div className="relative w-full overflow-hidden pt-1 pb-2 -mt-1.5 z-20 flex flex-col items-center">
        {/* Animated Container for Permit Paper + Pull Handle */}
        <div
          ref={paperMoverRef}
          className="relative w-full flex flex-col items-center will-change-transform cursor-grab active:cursor-grabbing"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {/* Authentic Examination Permit Ticket */}
          <div className="w-[92%] bg-gradient-to-b from-[#FFFDF8] via-white to-[#FDF9F0] text-slate-900 rounded-b-xl shadow-[0_16px_36px_rgba(0,0,0,0.55)] border-x-2 border-b-2 border-slate-300 px-6 pt-5 pb-4 relative">
            {/* Header: Institutional Seal & Exam Period */}
            <div className="border-b-2 border-dashed border-slate-300 pb-2.5 mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/logox.jpg"
                  alt="PermEase"
                  className="h-7 w-auto object-contain opacity-95 rounded-xs"
                />
                <div>
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 block leading-tight">
                    OFFICIAL EXAMINATION PERMIT
                  </span>
                  <span className="text-sm font-black text-[#0B1B3D] tracking-tight block">
                    AY 2026–2027 • {examPeriod.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-700" />
                <span>CLEARED</span>
              </div>
            </div>

            {/* Student Preview Details on Paper */}
            <div className="grid grid-cols-2 gap-4 text-left py-1 text-xs font-mono">
              <div>
                <span className="text-[9px] uppercase text-slate-400 block font-bold tracking-wider">
                  STUDENT NAME
                </span>
                <span className="font-black text-slate-900 text-sm truncate block mt-0.5">
                  {student.name}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 block font-bold tracking-wider">
                  STUDENT NO.
                </span>
                <span className="font-black text-[#0B1B3D] text-sm block mt-0.5">
                  {student.studentNumber}
                </span>
              </div>
            </div>

            {/* Security Line & Verification */}
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-slate-700 font-bold">DIGITALLY SIGNED & VERIFIED</span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-slate-600 font-bold">
                |||| | ||| || ||||
              </span>
            </div>

            {/* Perforated Tear Line indicator */}
            <div className="absolute -bottom-2 left-0 right-0 h-4 flex items-center justify-center pointer-events-none">
              <div className="w-full border-b-2 border-dashed border-amber-400/90" />
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. TACTILE PULL HANDLE ATTACHED DIRECTLY TO PERMIT BOTTOM     */}
          {/* ============================================================ */}
          <div
            ref={handleRef}
            onClick={handleDirectTap}
            className={`w-[96%] mt-2 rounded-2xl bg-gradient-to-b from-[#183464] via-[#0D2042] to-[#08152D] border-2 border-[#D4AF37] px-5 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.7),inset_0_1px_8px_rgba(255,255,255,0.15)] flex items-center justify-between transition-colors ${
              disabled ? 'opacity-50 pointer-events-none' : 'hover:border-amber-300'
            }`}
          >
            {/* Left: Printer Icon */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-[#D4AF37] text-slate-950 flex items-center justify-center shadow-md border border-amber-200 shrink-0">
              <Printer size={22} className="stroke-[2.5]" />
            </div>

            {/* Center: Instruction & Dynamic Pull Gauge */}
            <div className="flex-1 flex flex-col text-center px-3">
              <span className="font-serif-brand font-black text-sm sm:text-base text-[#FFF2B2] tracking-wider uppercase drop-shadow-sm leading-tight flex items-center justify-center gap-2">
                <span>PULL DOWN TO DISPENSE PERMIT</span>
                <ChevronsDown size={18} className="text-[#D4AF37] animate-bounce" />
              </span>

              {/* Progress gauge bar */}
              <div className="w-full mt-2 flex items-center gap-2.5">
                <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-[#D4AF37] transition-all duration-75"
                    style={{ width: `${Math.round(pullProgress * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-black text-[#D4AF37] shrink-0 w-8 text-right">
                  {Math.round(pullProgress * 100)}%
                </span>
              </div>
            </div>

            {/* Right: Touch Arrow Indicator */}
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
              <ArrowDown size={20} className="animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Helpful subtle footer hint */}
      <div className="mt-2 text-xs text-slate-400 font-mono tracking-wide text-center">
        Drag downward on the permit or tap the gold button to release permit
      </div>
    </div>
  );
};
