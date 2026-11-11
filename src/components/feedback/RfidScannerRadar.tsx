import React from 'react';
import { motion } from 'framer-motion';
import { Radio, CreditCard } from 'lucide-react';

export interface RfidScannerRadarProps {
  statusText?: string;
  subText?: string;
  isProcessing?: boolean;
  isScanning?: boolean;
  onScan?: (uid: string) => void;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RfidScannerRadar: React.FC<RfidScannerRadarProps> = ({
  statusText = 'Waiting for RFID card...',
  subText = "Please tap the student's RFID card on the reader",
  isProcessing = false,
  variant = 'light',
  size = 'md',
  className = '',
}) => {
  const isDark = variant === 'dark';

  const sizeConfig = {
    sm: { container: 'w-36 h-36', inner: 'w-20 h-20', icon: 'w-8 h-8', waveFrom: 45, waveTo: 140 },
    md: { container: 'w-44 h-44', inner: 'w-24 h-24', icon: 'w-10 h-10', waveFrom: 55, waveTo: 175 },
    lg: { container: 'w-52 h-52', inner: 'w-28 h-28', icon: 'w-12 h-12', waveFrom: 65, waveTo: 205 },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-3 sm:p-4 text-center select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${sizeConfig.container} mb-3 sm:mb-4`}>
        {[1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className={`absolute rounded-full pointer-events-none ${
              isDark
                ? 'border-2 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                : 'border border-[#D4AF37]/40'
            }`}
            initial={{ width: sizeConfig.waveFrom, height: sizeConfig.waveFrom, opacity: 0.8 }}
            animate={{
              width: [sizeConfig.waveFrom, sizeConfig.waveTo],
              height: [sizeConfig.waveFrom, sizeConfig.waveTo],
              opacity: [0.85, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: index * 0.65,
              ease: 'easeOut',
            }}
          />
        ))}

        <div
          className={`relative z-10 flex items-center justify-center ${sizeConfig.inner} rounded-full transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-[#0A1633] via-[#122557] to-[#1E3A8A] text-[#D4AF37] ring-4 ring-[#D4AF37]/60 shadow-[0_0_35px_rgba(212,175,55,0.35)]'
              : 'bg-gradient-to-br from-[#0B1B3D] to-[#1E40AF] text-[#D4AF37] shadow-xl border-2 border-[#D4AF37]/50'
          }`}
        >
          {isProcessing ? (
            <Radio className={`${sizeConfig.icon} animate-pulse text-[#D4AF37]`} />
          ) : (
            <CreditCard className={`${sizeConfig.icon} text-[#D4AF37] transition-transform hover:scale-110`} />
          )}
        </div>
      </div>

      {statusText && (
        <h4
          className={`text-base sm:text-lg font-extrabold tracking-wide ${
            isDark ? 'text-white drop-shadow-sm' : 'text-[#0B1B3D]'
          }`}
        >
          {statusText}
        </h4>
      )}
      {subText && (
        <p
          className={`mt-1 text-xs sm:text-sm max-w-xs leading-relaxed ${
            isDark ? 'text-slate-300 font-medium' : 'text-slate-500'
          }`}
        >
          {subText}
        </p>
      )}
    </div>
  );
};
