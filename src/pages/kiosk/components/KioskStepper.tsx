import React from 'react';
import { Check } from 'lucide-react';

interface KioskStepperProps {
  currentStep: 1 | 2 | 3;
}

export const KioskStepper: React.FC<KioskStepperProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Identify' },
    { number: 2, label: 'Clearance' },
    { number: 3, label: 'Dispense' },
  ];

  return (
    <div className="inline-flex items-center justify-center">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-[#D4AF37] text-slate-950 ring-2 ring-[#D4AF37]/30 font-black'
                      : 'bg-white/10 text-slate-400 border border-white/15'
                  }`}
                >
                  {isCompleted ? <Check size={12} className="stroke-[3]" /> : step.number}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] font-bold tracking-tight hidden sm:inline whitespace-nowrap ${
                    isActive
                      ? 'text-white font-black'
                      : isCompleted
                      ? 'text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`w-5 sm:w-8 h-0.5 transition-colors shrink-0 ${
                    step.number < currentStep ? 'bg-emerald-500' : 'bg-white/15'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
