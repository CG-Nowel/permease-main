import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, ShieldCheck, Cpu } from 'lucide-react';

export const KioskFloatingRfidCard: React.FC = () => {
  return (
    <div className="relative w-56 h-36 sm:w-64 sm:h-40 perspective-[1000px] flex items-center justify-center">
      {/* Stable, Pleasing Level Floating Motion Card */}
      <motion.div
        animate={{
          y: [-3, 3, -3],
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#1A376B] via-[#0E2145] to-[#071329] border-2 border-[#D4AF37] shadow-[0_20px_45px_rgba(0,0,0,0.85),inset_0_1px_4px_rgba(255,255,255,0.3)] p-3.5 flex flex-col justify-between overflow-hidden select-none cursor-pointer"
      >
        {/* Diagonal Holographic Sweep Light Sheen */}
        <motion.div
          animate={{ x: ['-150%', '220%'] }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
          className="absolute inset-0 w-2/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
        />

        {/* Card Header: PermEase Logo Mark & Contactless Chip Status */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black text-[10px] shadow-sm">
              P
            </div>
            <span className="font-serif-brand font-black text-[10px] sm:text-[11px] text-[#FFF2B2] tracking-wider uppercase drop-shadow-sm">
              PERMEASE SMART PASS
            </span>
          </div>

          <div className="flex items-center gap-1 text-[#D4AF37]">
            <Wifi size={14} className="rotate-90 text-[#D4AF37] animate-pulse" />
            <span className="text-[8px] font-mono font-bold tracking-widest text-[#FFF2B2]">RFID</span>
          </div>
        </div>

        {/* Card Center: Gold EMV Chip & Student Photo Silhouette */}
        <div className="flex items-center justify-between z-10 px-1">
          {/* Authentic Gold Smart Chip */}
          <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200 shadow-sm flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-[1px] bg-amber-900/40 absolute top-2" />
            <div className="w-full h-[1px] bg-amber-900/40 absolute bottom-2" />
            <div className="h-full w-[1px] bg-amber-900/40 absolute left-2.5" />
            <div className="h-full w-[1px] bg-amber-900/40 absolute right-2.5" />
            <Cpu size={12} className="text-amber-950/70" />
          </div>

          {/* Student Photo Badge Frame */}
          <div className="w-9 h-11 rounded-md bg-slate-800/80 border border-white/20 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            <div className="w-4 h-4 rounded-full bg-slate-400/80 mt-1" />
            <div className="w-7 h-4 rounded-t-full bg-slate-500/80 mt-0.5" />
          </div>
        </div>

        {/* Card Footer: Student Number & Verified Tag */}
        <div className="flex items-end justify-between z-10 border-t border-white/10 pt-1 text-[9px] font-mono">
          <div>
            <span className="text-[7px] text-slate-400 block leading-none uppercase font-bold">STUDENT NUMBER</span>
            <span className="font-bold text-[#FFF2B2] tracking-wider">2026-XXXXX</span>
          </div>

          <div className="flex items-center gap-1 text-[8px] text-emerald-300 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-400/40 shadow-xs">
            <ShieldCheck size={10} />
            <span>ENCRYPTED</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
