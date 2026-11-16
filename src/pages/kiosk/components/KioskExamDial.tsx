import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { useGSAP } from '@gsap/react';
import { KioskAudio } from '../../../lib/audio.ts';
import { Calendar, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(Draggable, InertiaPlugin, useGSAP);

import { ExamPeriod } from '../../../lib/constants.ts';

export type { ExamPeriod };

interface KioskExamDialProps {
  selectedPeriod: ExamPeriod;
  onPeriodChange: (period: ExamPeriod) => void;
  disabled?: boolean;
}

const PERIODS: { name: ExamPeriod; angle: number; short: string; date: string }[] = [
  { name: 'Prelim', angle: 0, short: 'PRE', date: 'Sept 15–18' },
  { name: 'Midterms', angle: 90, short: 'MID', date: 'Oct 26–29' },
  { name: 'Pre-Finals', angle: 180, short: 'PRF', date: 'Dec 07–10' },
  { name: 'Finals', angle: 270, short: 'FIN', date: 'Jan 18–22' },
];

export const KioskExamDial: React.FC<KioskExamDialProps> = ({
  selectedPeriod,
  onPeriodChange,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const draggableInstanceRef = useRef<Draggable[] | null>(null);
  const lastDetentAngleRef = useRef<number>(0);
  const [activePeriod, setActivePeriod] = useState<ExamPeriod>(selectedPeriod);

  // Sync state if controlled from outside
  useEffect(() => {
    setActivePeriod(selectedPeriod);
    const target = PERIODS.find((p) => p.name === selectedPeriod);
    if (target && dialRef.current) {
      gsap.to(dialRef.current, {
        rotation: target.angle,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      lastDetentAngleRef.current = target.angle;
    }
  }, [selectedPeriod]);

  useGSAP(
    () => {
      if (!dialRef.current || disabled) return;

      const angleStep = 90;

      const normalizeToPeriod = (rotationDeg: number): ExamPeriod => {
        const positiveAngle = ((Math.round(rotationDeg / angleStep) % 4) + 4) % 4;
        return PERIODS[positiveAngle].name;
      };

      draggableInstanceRef.current = Draggable.create(dialRef.current, {
        type: 'rotation',
        inertia: true,
        throwResistance: 3200,
        minDuration: 0.3,
        maxDuration: 1.2,
        snap: (endValue: number) => Math.round(endValue / angleStep) * angleStep,
        onDrag() {
          const currentDetent = Math.round(this.rotation / angleStep) * angleStep;
          if (currentDetent !== lastDetentAngleRef.current) {
            lastDetentAngleRef.current = currentDetent;
            KioskAudio.playKeyClick();
            const period = normalizeToPeriod(this.rotation);
            setActivePeriod(period);
          }
        },
        onThrowUpdate() {
          const currentDetent = Math.round(this.rotation / angleStep) * angleStep;
          if (currentDetent !== lastDetentAngleRef.current) {
            lastDetentAngleRef.current = currentDetent;
            KioskAudio.playKeyClick();
            const period = normalizeToPeriod(this.rotation);
            setActivePeriod(period);
          }
        },
        onThrowComplete() {
          const finalPeriod = normalizeToPeriod(this.rotation);
          setActivePeriod(finalPeriod);
          onPeriodChange(finalPeriod);
        },
        onDragEnd() {
          if (!this.tween) {
            const finalPeriod = normalizeToPeriod(this.rotation);
            setActivePeriod(finalPeriod);
            onPeriodChange(finalPeriod);
          }
        },
      });

      return () => {
        if (draggableInstanceRef.current) {
          draggableInstanceRef.current.forEach((d) => d.kill());
          draggableInstanceRef.current = null;
        }
      };
    },
    { scope: containerRef, dependencies: [disabled] }
  );

  // Direct touch jump to a specific period
  const handleSelectPeriod = (period: ExamPeriod) => {
    if (disabled || !dialRef.current) return;
    const target = PERIODS.find((p) => p.name === period);
    if (!target) return;

    KioskAudio.playKeyClick();
    setActivePeriod(period);
    onPeriodChange(period);

    // Calculate shortest angular rotation distance
    const currentRotation = gsap.getProperty(dialRef.current, 'rotation') as number;
    const currentNorm = ((currentRotation % 360) + 360) % 360;
    let diff = target.angle - currentNorm;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    gsap.to(dialRef.current, {
      rotation: currentRotation + diff,
      duration: 0.6,
      ease: 'power3.out',
      force3D: true,
      onComplete: () => {
        lastDetentAngleRef.current = target.angle;
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center p-3 sm:p-4 select-none touch-none"
    >
      {/* Top Header Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
        <Compass size={12} className="animate-spin-slow" />
        <span>Rotary Term Selector • Drag to Spin</span>
      </div>

      {/* Main Dial Stage with Concentric Bezel */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Outer Static Track Ring with Graduation Ticks */}
        <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] pointer-events-none" />

        {/* 4 External Quick-Touch Targets (Min 64px Ergonomic Zones) */}
        {PERIODS.map((p) => {
          const isSelected = activePeriod === p.name;
          // Calculate positions around dial perimeter
          let posClass = '';
          if (p.angle === 0) posClass = 'top-0 left-1/2 -translate-x-1/2 -translate-y-4';
          else if (p.angle === 90) posClass = 'right-0 top-1/2 translate-x-4 -translate-y-1/2';
          else if (p.angle === 180) posClass = 'bottom-0 left-1/2 -translate-x-1/2 translate-y-4';
          else if (p.angle === 270) posClass = 'left-0 top-1/2 -translate-x-4 -translate-y-1/2';

          return (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPeriod(p.name)}
              className={`kiosk-target absolute z-20 ${posClass} transition-all cursor-pointer`}
              aria-label={`Select ${p.name}`}
            >
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg border transition-all ${
                  isSelected
                    ? 'bg-[#D4AF37] text-slate-950 border-amber-200 shadow-[0_0_15px_rgba(212,175,55,0.6)] scale-105'
                    : 'bg-[#0B1B3D] text-slate-300 border-white/15 hover:border-white/30'
                }`}
              >
                <span>{p.short}</span>
              </div>
            </button>
          );
        })}

        {/* Rotating Dial Plate (Driven by GSAP Draggable) */}
        <div
          ref={dialRef}
          className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-[#122A55] via-[#0B1B3D] to-[#050D1E] border-4 border-[#D4AF37] shadow-[0_16px_36px_rgba(0,0,0,0.8),inset_0_2px_12px_rgba(255,255,255,0.2)] flex items-center justify-center cursor-grab active:cursor-grabbing will-change-transform"
        >
          {/* Radial Machined Notches around the wheel */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div
              key={deg}
              className="absolute w-1 h-3 rounded-full bg-[#D4AF37]/50"
              style={{
                transform: `rotate(${deg}deg) translateY(-84px)`,
              }}
            />
          ))}

          {/* Primary Top Pointer Arrow Indicator */}
          <div className="absolute top-2 w-3 h-3 rounded-xs bg-[#D4AF37] rotate-45 shadow-sm border border-amber-200" />

          {/* Inner Central Static Core (Does not spin with text for readability) */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#07132B] border-2 border-[#D4AF37]/60 shadow-inner flex flex-col items-center justify-center text-center p-2 pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none">
              TERM
            </span>
            <span className="font-serif-brand font-black text-sm sm:text-base text-[#FFF2B2] uppercase tracking-wider leading-tight mt-1">
              {activePeriod}
            </span>
            <span className="text-[8px] font-mono text-[#D4AF37] font-semibold mt-0.5">
              {PERIODS.find((p) => p.name === activePeriod)?.date}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Period Descriptor & Confirmation */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
        <Calendar size={14} className="text-[#D4AF37]" />
        <span>
          Selected Period:{' '}
          <strong className="text-white font-bold">{activePeriod} Examination</strong>
        </span>
      </div>
    </div>
  );
};
