import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { useGSAP } from '@gsap/react';
import { KioskAudio } from '../../../lib/audio.ts';
import { Printer, ArrowDown, Sparkles, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(Observer, useGSAP);

interface KioskLiquidPullTrayProps {
  onTriggerDispense: () => void;
  disabled?: boolean;
  isDispensing?: boolean;
}

export const KioskLiquidPullTray: React.FC<KioskLiquidPullTrayProps> = ({
  onTriggerDispense,
  disabled = false,
  isDispensing = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const elasticMeshRef = useRef<SVGPathElement>(null);
  const [pullProgress, setPullProgress] = useState<number>(0);
  const isTriggeredRef = useRef<boolean>(false);

  useGSAP(
    () => {
      if (!handleRef.current || disabled || isDispensing) return;

      const threshold = 120;
      let currentY = 0;

      const observer = Observer.create({
        target: handleRef.current,
        type: 'touch,pointer',
        dragMinimum: 2,
        onPress() {
          isTriggeredRef.current = false;
        },
        onDrag(self) {
          if (isTriggeredRef.current) return;

          // Progressive damping resistance: deeper pulls require more force
          const delta = self.deltaY * 0.55;
          currentY = Math.max(0, Math.min(threshold + 40, currentY + delta));
          const progress = Math.min(1, currentY / threshold);
          setPullProgress(progress);

          // Kinetic GSAP GPU transform
          gsap.to(handleRef.current, {
            y: currentY,
            scaleY: 1 + currentY * 0.001,
            duration: 0.08,
            overwrite: 'auto',
            force3D: true,
          });

          // Morph elastic SVG membrane
          if (elasticMeshRef.current) {
            const bend = currentY * 0.8;
            elasticMeshRef.current.setAttribute(
              'd',
              `M 0 0 Q 150 ${bend} 300 0 L 300 12 L 0 12 Z`
            );
          }

          if (currentY >= threshold && !isTriggeredRef.current) {
            isTriggeredRef.current = true;
            KioskAudio.playDispenseTick();

            // Fire dispense ejection sequence
            gsap.to(handleRef.current, {
              y: threshold + 100,
              opacity: 0,
              scale: 0.95,
              duration: 0.35,
              ease: 'power3.in',
              onComplete: () => {
                onTriggerDispense();
                // Reset position after trigger
                gsap.set(handleRef.current, { y: 0, opacity: 1, scale: 1 });
                setPullProgress(0);
              },
            });
          }
        },
        onDragEnd() {
          if (!isTriggeredRef.current) {
            // Elastic snap-back
            gsap.to(handleRef.current, {
              y: 0,
              scaleY: 1,
              duration: 0.6,
              ease: 'elastic.out(1.1, 0.3)',
              force3D: true,
            });

            if (elasticMeshRef.current) {
              gsap.to(elasticMeshRef.current, {
                attr: { d: 'M 0 0 Q 150 0 300 0 L 300 12 L 0 12 Z' },
                duration: 0.6,
                ease: 'elastic.out(1.1, 0.3)',
              });
            }

            currentY = 0;
            setPullProgress(0);
          }
        },
      });

      return () => {
        observer.kill();
      };
    },
    { scope: containerRef, dependencies: [disabled, isDispensing] }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center p-3 select-none touch-none"
    >
      {/* Elastic SVG Top Membrane */}
      <div className="w-full h-3 overflow-visible flex justify-center pointer-events-none">
        <svg
          viewBox="0 0 300 12"
          className="w-full max-w-sm h-6 overflow-visible text-[#D4AF37]/50 fill-current"
        >
          <path
            ref={elasticMeshRef}
            d="M 0 0 Q 150 0 300 0 L 300 12 L 0 12 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Main Draggable Physical Dispense Handle */}
      <div
        ref={handleRef}
        onClick={() => {
          if (!disabled && !isDispensing) {
            KioskAudio.playDispenseTick();
            onTriggerDispense();
          }
        }}
        className={`kiosk-target relative z-10 w-full max-w-md py-4 px-6 rounded-3xl bg-gradient-to-b from-[#132B57] via-[#0D2042] to-[#07132B] border-2 border-[#D4AF37] shadow-[0_12px_30px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.2)] flex items-center justify-between cursor-grab active:cursor-grabbing will-change-transform transition-colors ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {/* Left: Printer Icon & Glow */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-[#D4AF37] text-slate-950 flex items-center justify-center shadow-lg border border-amber-200 shrink-0">
          <Printer size={24} className="stroke-[2.5]" />
        </div>

        {/* Center: Tactile Call to Action */}
        <div className="flex flex-col text-center px-3">
          <span className="font-serif-brand font-black text-sm sm:text-base text-[#FFF2B2] tracking-wider uppercase drop-shadow-sm leading-tight">
            {isDispensing ? 'DISPENSING OFFICIAL PERMIT...' : 'PULL DOWN OR TAP TO PRINT'}
          </span>
          <span className="text-[10px] font-mono text-[#D4AF37] tracking-widest uppercase mt-0.5 font-bold">
            {isDispensing ? 'Please collect at bottom tray' : `Physical Dispenser • ${(pullProgress * 100).toFixed(0)}% Engaged`}
          </span>
        </div>

        {/* Right: Pulsing Arrow */}
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
          <ArrowDown size={20} className="animate-bounce" />
        </div>
      </div>

      {/* Direct Tap Accessibility Secondary Trigger */}
      <div className="mt-2 text-[10px] text-slate-400 font-mono tracking-wide">
        Touch & pull downward or tap directly to trigger silent printer
      </div>
    </div>
  );
};
