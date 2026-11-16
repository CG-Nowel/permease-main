import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PermEaseLogo } from '../../../components/ui/PermEaseLogo.tsx';
import { ArrowDown, CreditCard, Radio, Printer, ShieldCheck, Sparkles, Clock, Touchpad, Wifi } from 'lucide-react';
import { KioskAudio } from '../../../lib/audio.ts';
import { KioskFloatingRfidCard } from './KioskFloatingRfidCard.tsx';

interface KioskAttractorScreenProps {
  onWake: () => void;
}

export const KioskAttractorScreen: React.FC<KioskAttractorScreenProps> = ({ onWake }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScreenTouch = () => {
    KioskAudio.playSuccessChime();
    onWake();
  };

  return (
    <div
      onClick={handleScreenTouch}
      className="fixed inset-0 z-40 bg-[#061226] text-white flex flex-col justify-between items-center p-6 sm:p-10 cursor-pointer select-none overflow-hidden"
    >
      {/* Crisp institutional grid & radial accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #D4AF37 1.5px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Ambient Golden Lights Passing Left-to-Right */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -bottom-40 w-96 bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent blur-3xl transform -skew-x-12"
        />
        <motion.div
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 10, repeat: Infinity, delay: 3.8, ease: 'easeInOut' }}
          className="absolute -top-40 -bottom-40 w-96 bg-gradient-to-r from-transparent via-[#FFF2B2]/10 to-transparent blur-2xl transform -skew-x-12"
        />
      </div>

      {/* Top Bar: Campus Live Time & System Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl flex items-center justify-between z-10 pt-2"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.07] border border-white/15 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-300">
            STATION #01 • READY FOR TAP
          </span>
        </div>

        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#D4AF37] tracking-wider drop-shadow-sm">
            {timeStr}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-300 font-medium">{dateStr}</div>
        </div>
      </motion.div>

      {/* Center Stage: Hero PermEase Brand + Concentric Contactless Sensor Target */}
      <div className="flex flex-col items-center justify-center text-center z-10 space-y-6 sm:space-y-8 my-auto max-w-2xl">
        {/* Brand Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center space-y-3"
        >
          {/* Official Monogram Mark with Elegant Rim and Badge */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/95 border-2 border-[#D4AF37] shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex items-center gap-4">
            <img
              src="/images/logox.jpg"
              alt="PermEase Monogram"
              className="h-16 sm:h-20 w-auto object-contain select-none rounded-xl"
            />
            <div className="flex flex-col text-left pr-2">
              <span className="font-serif-brand font-black text-2xl sm:text-3xl text-[#0B1B3D] tracking-wider">
                PERM<span className="text-[#C89D2E]">EASE</span>
              </span>
              <span className="font-sans font-black text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#C89D2E]">
                SMART TEST PERMIT SYSTEM
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stable, Pleasing Student Card */}
        <div className="relative flex flex-col items-center justify-center my-4 select-none">
          <div className="transform transition-transform active:scale-95">
            <KioskFloatingRfidCard />
          </div>
        </div>

        {/* Directional Callout to Physical RFID Sensor Below */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-[#D4AF37]/20 border border-amber-200">
            <ArrowDown size={18} className="text-slate-950 animate-bounce" />
            <span>Tap ID to the RFID sensor to dispense permit</span>
            <ArrowDown size={18} className="text-slate-950 animate-bounce" />
          </div>
          <p className="text-xs sm:text-sm text-emerald-300 font-mono font-bold tracking-wide">
            Physical RFID sensor is located directly below the screen
          </p>
        </motion.div>
      </div>

      {/* Bottom Status Ribbon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl z-10 flex flex-wrap items-center justify-around gap-4 pt-3 border-t border-white/10 text-xs text-slate-300"
      >
        <div className="flex items-center gap-2">
          <Radio size={15} className="text-[#D4AF37]" />
          <span>Contactless Reader Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <Printer size={15} className="text-emerald-400" />
          <span>Thermal Dispenser Loaded</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-blue-400" />
          <span>Academic Year 2026–2027</span>
        </div>
      </motion.div>
    </div>
  );
};
