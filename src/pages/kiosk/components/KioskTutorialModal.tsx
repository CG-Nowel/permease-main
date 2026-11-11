import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Wifi,
  ShieldCheck,
  Printer,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  ArrowDown,
  ChevronsDown,
  RotateCw,
} from 'lucide-react';
import { KioskAudio } from '../../../lib/audio.ts';

interface KioskTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryDemo?: () => void;
}

export const KioskTutorialModal: React.FC<KioskTutorialModalProps> = ({
  isOpen,
  onClose,
  onTryDemo,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const tutorialSteps = [
    {
      stepNumber: 1,
      tag: 'STEP 1: CONTACTLESS IDENTIFICATION',
      title: 'Tap ID Badge on Physical RFID Sensor',
      description:
        'Hold your official student RFID card against the physical hardware sensor mounted directly below the monitor. The 13.56 MHz contactless reader will authenticate your badge instantly. On screen, you can also swipe or tap the 3D card to flip and inspect both sides.',
      tip: 'Hold your card steady against the reader until you hear the confirmation chime. No manual typing required!',
      icon: (
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
          {/* Electromagnetic Radar Wave Rings */}
          <motion.div
            animate={{ scale: [0.7, 1.4], opacity: [0.8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full border-2 border-emerald-400"
          />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#10254C] to-[#061022] border-2 border-[#D4AF37] flex flex-col items-center justify-center text-[#D4AF37] shadow-2xl relative z-10">
            <Wifi size={34} className="rotate-90 text-[#FFF2B2] mb-1 animate-pulse" />
            <span className="text-[9px] font-mono font-black tracking-widest text-[#FFF2B2] uppercase">
              RFID SENSOR
            </span>
          </div>
          {/* Floating 3D Badge Preview with Flip indicator */}
          <motion.div
            animate={{ y: [-6, 6, -6], rotateY: [0, 180, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-3 -right-2 px-3 py-1.5 rounded-xl bg-[#0F2752] text-[#FFF2B2] border-2 border-[#D4AF37] shadow-lg flex items-center gap-1.5 text-xs font-bold z-20"
          >
            <CreditCard size={14} className="text-amber-300" />
            <span className="text-[10px] font-mono">3D BADGE</span>
            <RotateCw size={11} className="text-emerald-400" />
          </motion.div>
        </div>
      ),
    },
    {
      stepNumber: 2,
      tag: 'STEP 2: FINANCIAL CLEARANCE',
      title: 'Real-Time Academic & Accounting Check',
      description:
        'The kiosk connects securely with the university registry to verify your financial standing and exam eligibility. When your account is in good standing or supported by an endorsed promissory note, you are instantly marked as ACCOUNT CLEARED.',
      tip: 'The screen will present your full name, student number, and official midterm/final permit details.',
      icon: (
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-emerald-950/70 to-[#061426] border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-400 shadow-2xl">
            <ShieldCheck size={42} className="text-emerald-400 mb-1" />
            <span className="text-[9px] font-mono font-black tracking-widest text-emerald-300 uppercase">
              CLEARED
            </span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="absolute -bottom-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider shadow-md uppercase border border-emerald-300"
          >
            Verified 100%
          </motion.div>
        </div>
      ),
    },
    {
      stepNumber: 3,
      tag: 'STEP 3: PULL-DOWN DISPENSING',
      title: 'Pull Down Permit From Top Slot',
      description:
        'Once cleared, your examination permit appears peeking out of the top thermal slot. Grab the gold handle and drag downward from top to bottom (or tap the button) to trigger the high-speed thermal dispenser mechanism.',
      tip: 'Drag downward anywhere on the permit paper or simply tap the gold bar to release your permit.',
      icon: (
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
          {/* Top Slot Representation */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#142C5B] to-[#061022] border-2 border-[#D4AF37] flex flex-col items-center justify-between p-2 shadow-2xl relative overflow-hidden">
            <div className="w-full h-2 bg-black rounded-full border border-slate-700 shadow-inner" />
            {/* Sliding Ticket */}
            <motion.div
              animate={{ y: [-4, 12, -4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-4/5 bg-white rounded-b-md p-1 shadow-md border border-slate-300 text-slate-900 flex flex-col items-center"
            >
              <div className="w-full h-1 bg-slate-300 rounded-full mb-1" />
              <ChevronsDown size={14} className="text-[#D4AF37] animate-bounce" />
            </motion.div>
            <span className="text-[8px] font-mono font-black text-amber-300 uppercase">PULL DOWN</span>
          </div>
        </div>
      ),
    },
    {
      stepNumber: 4,
      tag: 'STEP 4: OUTPUT COLLECTION',
      title: 'Permit Dispensed & Physical Collection',
      description:
        'The thermal head feeds the printed permit downward out of the top slot into view. When printing finishes, the circular green checkmark confirms completion. Take your printed physical permit from the output tray below.',
      tip: 'If your ID card is unregistered, visit Registrar (Window 1). For balance inquiries or reprint fees, visit Accounting (Window 3).',
      icon: (
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-blue-950/70 to-[#061226] border-2 border-[#D4AF37] flex flex-col items-center justify-center text-[#D4AF37] shadow-2xl relative">
            <Printer size={38} className="text-[#FFF2B2] mb-1" />
            <span className="text-[9px] font-mono font-black tracking-widest text-[#FFF2B2] uppercase">
              DISPENSER
            </span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-2 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-emerald-200"
          >
            <CheckCircle2 size={18} />
          </motion.div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-3 w-8 h-8 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-lg border border-amber-200"
          >
            <ArrowDown size={16} className="stroke-[3]" />
          </motion.div>
        </div>
      ),
    },
  ];

  const current = tutorialSteps[currentStep];

  const handleNext = () => {
    KioskAudio.playKeyClick();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      KioskAudio.playSuccessChime();
      onClose();
    }
  };

  const handlePrev = () => {
    KioskAudio.playKeyClick();
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepSelect = (index: number) => {
    KioskAudio.playKeyClick();
    setCurrentStep(index);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#091733] via-[#0B1B3D] to-[#071329] border-2 border-[#D4AF37]/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 text-white flex flex-col space-y-4 overflow-hidden"
        >
          {/* Subtle gold grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Modal Header */}
          <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black shadow-md">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white font-serif-brand tracking-wide">
                  How To Use The PermEase Kiosk
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Official 4-Step Contactless Guide & Tutorial
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                KioskAudio.playKeyClick();
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
              aria-label="Close tutorial"
            >
              <X size={20} />
            </button>
          </div>

          {/* Step Progress Indicators */}
          <div className="relative z-10 grid grid-cols-4 gap-2">
            {tutorialSteps.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;

              return (
                <button
                  key={step.stepNumber}
                  type="button"
                  onClick={() => handleStepSelect(idx)}
                  className={`py-2 px-2.5 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                    isActive
                      ? 'bg-[#D4AF37] text-slate-950 border-[#FFF2B2] font-black shadow-md'
                      : isPast
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {isPast ? (
                      <CheckCircle2 size={13} className="text-emerald-400 stroke-[3]" />
                    ) : (
                      <span className="text-xs font-mono font-black">0{step.stepNumber}</span>
                    )}
                  </div>
                  <div
                    className={`h-1 w-full rounded-full transition-all ${
                      isActive ? 'bg-slate-950' : isPast ? 'bg-emerald-400' : 'bg-white/10'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Tutorial Step Body */}
          <div className="relative z-10 min-h-[250px] sm:min-h-[270px] rounded-2xl bg-black/40 border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Visual Icon Illustration */}
            <div className="shrink-0 flex items-center justify-center">
              {current.icon}
            </div>

            {/* Content Text */}
            <div className="flex-1 text-center sm:text-left space-y-2.5">
              <span className="inline-block px-3 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFF2B2] text-[10px] font-mono font-black uppercase tracking-widest">
                {current.tag}
              </span>

              <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                {current.title}
              </h4>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {current.description}
              </p>

              <div className="pt-2 flex items-start gap-2 text-xs text-amber-200 bg-white/5 p-3 rounded-xl border border-white/10">
                <Sparkles size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong className="text-white font-bold">Pro Tip: </strong>
                  {current.tip}
                </span>
              </div>
            </div>
          </div>

          {/* Action Navigation Footer */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Left: Previous Button or Skip */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="min-h-[50px] px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    KioskAudio.playKeyClick();
                    onClose();
                  }}
                  className="min-h-[50px] px-4 py-2.5 rounded-2xl text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Skip Tutorial
                </button>
              )}

              {/* Quick Demo Trigger if provided */}
              {onTryDemo && (
                <button
                  type="button"
                  onClick={() => {
                    KioskAudio.playSuccessChime();
                    onClose();
                    onTryDemo();
                  }}
                  className="min-h-[50px] px-4 py-2.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600/35 active:scale-95 border border-blue-400/40 text-blue-300 hover:text-blue-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Simulate instant cleared student scan"
                >
                  <PlayCircle size={16} className="text-blue-300" />
                  <span>Try Demo Scan</span>
                </button>
              )}
            </div>

            {/* Right: Next / Finish Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto min-h-[52px] px-8 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-[#D4AF37]/25 border border-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{currentStep === tutorialSteps.length - 1 ? 'Got It! Start Kiosk' : 'Next Step'}</span>
              <ChevronRight size={18} className="stroke-[3]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
