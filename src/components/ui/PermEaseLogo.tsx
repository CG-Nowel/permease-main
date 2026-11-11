import React from 'react';

export interface PermEaseLogoProps {
  variant?: 'dark' | 'light' | 'badge' | 'plain';
  mode?: 'combined' | 'mark' | 'text';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  iconOnly?: boolean;
}

export const PermEaseLogo: React.FC<PermEaseLogoProps> = ({
  variant = 'dark',
  mode = 'combined',
  size = 'md',
  showSubtitle = false,
  subtitleText = 'RFID STUDENT TEST PERMIT SYSTEM',
  className = '',
  iconOnly = false,
}) => {
  // Dimension definitions for mark and typography
  const sizeConfig = {
    xs: {
      markH: 'h-6',
      title: 'text-sm tracking-wider',
      sub: 'text-[7px] tracking-[0.2em]',
      gap: 'gap-2',
      badgePad: 'px-2.5 py-1',
    },
    sm: {
      markH: 'h-8',
      title: 'text-base tracking-wider',
      sub: 'text-[8px] tracking-[0.2em]',
      gap: 'gap-2.5',
      badgePad: 'px-3 py-1.5',
    },
    md: {
      markH: 'h-10 sm:h-11',
      title: 'text-lg sm:text-xl tracking-wider',
      sub: 'text-[9px] sm:text-[10px] tracking-[0.25em]',
      gap: 'gap-3',
      badgePad: 'px-4 py-2',
    },
    lg: {
      markH: 'h-14 sm:h-16',
      title: 'text-2xl sm:text-3xl tracking-widest',
      sub: 'text-[11px] sm:text-xs tracking-[0.3em]',
      gap: 'gap-4',
      badgePad: 'px-5 py-2.5',
    },
    xl: {
      markH: 'h-20 sm:h-24',
      title: 'text-3xl sm:text-4xl tracking-widest',
      sub: 'text-xs sm:text-sm tracking-[0.3em]',
      gap: 'gap-5',
      badgePad: 'px-6 py-3',
    },
  }[size];

  // Standalone Mark Only
  if (iconOnly || mode === 'mark') {
    const markSrc =
      variant === 'dark'
        ? '/images/permease-mark-lightrim.png'
        : '/images/permease-mark.png';

    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src={markSrc}
          alt="PermEase Mark"
          className={`${sizeConfig.markH} w-auto object-contain drop-shadow-md select-none`}
        />
      </div>
    );
  }

  // Pure Wordmark Text Only
  if (mode === 'text') {
    return (
      <div className={`inline-flex flex-col select-none ${className}`}>
        <span
          className={`font-serif-brand font-black uppercase ${sizeConfig.title} ${
            variant === 'light' ? 'text-[#0B1B3D]' : 'text-white'
          }`}
        >
          PERM<span className="text-[#D4AF37]">EASE</span>
        </span>
        {showSubtitle && (
          <span
            className={`font-sans font-bold uppercase ${sizeConfig.sub} ${
              variant === 'light' ? 'text-slate-600' : 'text-[#D4AF37]'
            }`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    );
  }

  // Badge Variant: High-end frosted white/gold shield tile
  if (variant === 'badge') {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/40 via-amber-200/50 to-[#D4AF37]/40 rounded-2xl blur-md opacity-80 transition duration-500" />
          <div
            className={`relative ${sizeConfig.badgePad} rounded-2xl bg-white border-2 border-[#D4AF37] shadow-2xl flex items-center ${sizeConfig.gap}`}
          >
            <img
              src="/images/permease-mark.png"
              alt="PermEase Mark"
              className={`${sizeConfig.markH} w-auto object-contain drop-shadow-sm select-none`}
            />
            <div className="flex flex-col text-left">
              <span className={`font-serif-brand font-black text-[#0B1B3D] uppercase ${sizeConfig.title}`}>
                PERM<span className="text-[#C89D2E]">EASE</span>
              </span>
              <span className={`font-sans font-extrabold uppercase text-[#C89D2E] -mt-0.5 ${sizeConfig.sub}`}>
                SMART TEST PERMIT
              </span>
            </div>
          </div>
        </div>
        {showSubtitle && (
          <span
            className={`font-serif-brand font-bold uppercase text-[#D4AF37] mt-2.5 text-center ${sizeConfig.sub}`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    );
  }

  // Combined Dark Variant: Clean icon with rim light + bold typography
  if (variant === 'dark') {
    return (
      <div className={`inline-flex items-center ${sizeConfig.gap} select-none ${className}`}>
        <div className="relative flex items-center justify-center shrink-0">
          <div className="absolute inset-0 bg-[#D4AF37]/15 blur-lg rounded-full pointer-events-none" />
          <img
            src="/images/permease-mark-lightrim.png"
            alt="PermEase Mark"
            className={`${sizeConfig.markH} w-auto object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.25)] select-none`}
          />
        </div>
        <div className="flex flex-col text-left">
          <span className={`font-serif-brand font-black text-white uppercase tracking-wider ${sizeConfig.title}`}>
            PERM<span className="text-[#D4AF37]">EASE</span>
          </span>
          {showSubtitle ? (
            <span
              className={`font-sans font-bold uppercase tracking-[0.2em] text-[#D4AF37] -mt-0.5 ${sizeConfig.sub}`}
            >
              {subtitleText}
            </span>
          ) : (
            <span
              className={`font-sans font-bold uppercase tracking-[0.2em] text-slate-400 -mt-0.5 ${sizeConfig.sub}`}
            >
              STUDENT KIOSK
            </span>
          )}
        </div>
      </div>
    );
  }

  // Light Variant: For pure white paper / document previews
  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} select-none ${className}`}>
      <img
        src="/images/permease-mark.png"
        alt="PermEase Mark"
        className={`${sizeConfig.markH} w-auto object-contain select-none`}
      />
      <div className="flex flex-col text-left">
        <span className={`font-serif-brand font-black text-[#0B1B3D] uppercase tracking-wider ${sizeConfig.title}`}>
          PERM<span className="text-[#C89D2E]">EASE</span>
        </span>
        {showSubtitle && (
          <span
            className={`font-sans font-bold uppercase tracking-[0.2em] text-slate-600 -mt-0.5 ${sizeConfig.sub}`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
