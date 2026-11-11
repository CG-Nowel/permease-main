import React, { useState, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import {
  Wifi,
  ArrowDown,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Cpu,
  RotateCw,
  QrCode,
  Barcode,
} from 'lucide-react';
import { KioskAudio } from '../../../lib/audio.ts';

interface KioskTapStationProps {
  onOpenTutorial?: () => void;
  onScanCard?: (uid: string) => void;
}

export const KioskTapStation: React.FC<KioskTapStationProps> = ({
  onOpenTutorial,
  onScanCard,
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isDispensingTriggered, setIsDispensingTriggered] = useState<boolean>(false);
  const isTriggeredRef = useRef<boolean>(false);

  // Toggle card flip (Front <-> Back) with tactile audio
  const handleToggleFlip = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    KioskAudio.playCardFlip();
    setIsFlipped((prev) => !prev);
  };

  // Handle swipe / drag gestures to flip card
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 35;
    const velocityThreshold = 250;
    const horizontalSwipe =
      Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocityThreshold;
    const verticalSwipe =
      Math.abs(info.offset.y) > threshold || Math.abs(info.velocity.y) > velocityThreshold;

    if (horizontalSwipe || verticalSwipe) {
      KioskAudio.playCardFlip();
      setIsFlipped((prev) => !prev);
    }
  };

  // Trigger permit scan / dispense
  const handleDispenseScan = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isTriggeredRef.current) return;
    isTriggeredRef.current = true;
    setIsDispensingTriggered(true);

    KioskAudio.playKeyClick();
    setTimeout(() => {
      KioskAudio.playSuccessChime();
    }, 200);

    setTimeout(() => {
      if (onScanCard) {
        onScanCard('CLEARED_INITIAL');
      }
    }, 500);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-0 m-0 select-none relative overflow-hidden bg-transparent">
      {/* ============================================================== */}
      {/* 1. CALM HIGH-TECH CONTACTLESS BACKGROUND (NO GOLDEN SWEEPS)     */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Focused Sapphire Spotlight Behind Floating 3D Card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(20,60,135,0.35)_0%,rgba(7,19,43,0)_70%)] blur-3xl pointer-events-none" />

        {/* Electromagnetic RFID Radar Wave Pulses Emanating From Bottom Sensor */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          {[0, 1.4, 2.8].map((delay, idx) => (
            <motion.div
              key={idx}
              animate={{
                scale: [0.6, 2.5],
                opacity: [0.35, 0],
              }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                delay: delay,
                ease: 'easeOut',
              }}
              className="absolute w-[460px] h-[460px] rounded-full border border-emerald-400/25"
            />
          ))}

          {/* Soft Hardware Halo Glow at Physical Sensor Position */}
          <div className="w-96 h-36 bg-gradient-to-t from-emerald-500/18 via-teal-500/10 to-transparent blur-3xl rounded-full" />
        </div>

        {/* Subtle Institutional Grid Dots (Calm, 4% Opacity) */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #60A5FA 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. TOP HARDWARE STATUS STRIP (FLUSH EDGE-TO-EDGE, NO PADDING)  */}
      {/* ============================================================== */}
      <div className="relative z-10 w-full px-6 sm:px-10 py-2.5 flex items-center justify-between border-b border-white/5 bg-white/[0.015] text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_12px_#10b981]" />
          </span>
          <span className="font-mono font-bold tracking-wider text-slate-200 uppercase text-xs sm:text-sm">
            RFID HARDWARE SENSOR ONLINE • 13.56 MHz
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="hidden sm:inline text-slate-300">Reader Ready •</span>
          <span className="font-bold">Contactless 13.56 MHz Active</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. CENTER 3D CARD STAGE: FLIPPABLE 3D STUDENT RFID PASS        */}
      {/* ============================================================== */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-auto py-2 w-full">
        {/* 3D Perspective Container */}
        <div
          className="relative flex flex-col items-center justify-center"
          style={{ perspective: '1600px', perspectiveOrigin: 'center center' }}
        >
          {/* Draggable & Swipable 3D Card Wrapper */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            onClick={handleToggleFlip}
            animate={{
              y: [-8, 8, -8],
              rotateX: isFlipped ? [-15, -17, -15] : [15, 17, 15],
              rotateY: isFlipped ? 180 : 0,
              scale: isDispensingTriggered ? 0.96 : 1,
            }}
            transition={{
              rotateY: { duration: 0.65, ease: [0.23, 1, 0.32, 1] },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              rotateX: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 0.15 },
            }}
            className={`relative w-[350px] h-[220px] sm:w-[490px] sm:h-[305px] md:w-[540px] md:h-[335px] rounded-3xl select-none cursor-grab active:cursor-grabbing will-change-transform ${
              isDispensingTriggered
                ? 'shadow-[0_0_90px_#10b981]'
                : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: isDispensingTriggered
                ? '0 0 90px rgba(16, 185, 129, 0.85), -1px 1px 0 #34d399, -2px 2px 0 #059669, -3px 3px 0 #047857'
                : isFlipped
                ? '1px 1px 0 #e6c86e, 2px 2px 0 #d4af37, 3px 3px 0 #b38f26, 4px 4px 0 #8c6f1a, 5px 5px 0 #5c470e, 15px 25px 60px rgba(0,0,0,0.9), 30px 50px 90px rgba(0,0,0,0.7), 0 0 45px rgba(212,175,55,0.2)'
                : '-1px 1px 0 #e6c86e, -2px 2px 0 #d4af37, -3px 3px 0 #b38f26, -4px 4px 0 #8c6f1a, -5px 5px 0 #5c470e, -15px 25px 60px rgba(0,0,0,0.9), -30px 50px 90px rgba(0,0,0,0.7), 0 0 45px rgba(212,175,55,0.2)',
            }}
          >
            {/* ============================================================ */}
            {/* 3A. CARD FRONT FACE (PERMEASE SMART PASS)                    */}
            {/* ============================================================ */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#142C5B] via-[#0B1C3F] to-[#040C1D] border-2 border-[#D4AF37] p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(0deg)',
              }}
            >
              {/* Dynamic Diagonal Light Reflection */}
              <div className="absolute inset-0 w-3/4 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none rounded-3xl" />

              {/* Surface Glass Texture Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 rounded-3xl pointer-events-none" />

              {/* Card Header: Brand Monogram & Contactless NFC Waves */}
              <div
                className="flex items-center justify-between z-10"
                style={{ transform: 'translateZ(24px)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-300 to-[#D4AF37] text-slate-950 flex items-center justify-center font-black text-base shadow-md border border-amber-200 shrink-0">
                    P
                  </div>
                  <div>
                    <span className="font-serif-brand font-black text-base sm:text-lg text-[#FFF2B2] tracking-wider uppercase block leading-none drop-shadow-sm">
                      PERMEASE SMART PASS
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono text-[#D4AF37] uppercase tracking-widest block mt-1 font-bold">
                      OFFICIAL STUDENT RFID BADGE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#D4AF37] shadow-inner">
                  <Wifi size={18} className="rotate-90 text-[#D4AF37] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#FFF2B2]">NFC</span>
                </div>
              </div>

              {/* Card Center: High-Relief EMV Microchip & Student Photo Silhouette */}
              <div
                className="flex items-center justify-between z-10 px-1 my-auto"
                style={{ transform: 'translateZ(30px)' }}
              >
                {/* Embossed Metallic Smart Chip */}
                <div className="w-14 h-10 sm:w-16 sm:h-12 rounded-xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200 shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.7)] flex items-center justify-center relative overflow-hidden">
                  <div className="w-full h-[1px] bg-amber-900/50 absolute top-3 sm:top-3.5" />
                  <div className="w-full h-[1px] bg-amber-900/50 absolute bottom-3 sm:bottom-3.5" />
                  <div className="h-full w-[1px] bg-amber-900/50 absolute left-4 sm:left-5" />
                  <div className="h-full w-[1px] bg-amber-900/50 absolute right-4 sm:right-5" />
                  <Cpu size={20} className="text-amber-950/85" />
                </div>

                {/* Status Badge */}
                <div className="px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs sm:text-sm font-mono font-black uppercase tracking-wider shadow-sm flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                  <span>READY FOR SCAN</span>
                </div>

                {/* Student Photo Silhouette Box */}
                <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-slate-800/90 border-2 border-white/20 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-400/80 mt-1.5" />
                  <div className="w-11 h-8 sm:w-12 sm:h-9 rounded-t-full bg-slate-500/80 mt-1" />
                </div>
              </div>

              {/* Card Footer: Student ID & Validity Period */}
              <div
                className="flex items-end justify-between z-10 border-t border-white/15 pt-2.5 text-xs font-mono"
                style={{ transform: 'translateZ(22px)' }}
              >
                <div>
                  <span className="text-[10px] text-slate-400 block leading-none uppercase font-bold tracking-wider">
                    STUDENT NUMBER
                  </span>
                  <span className="font-bold text-[#FFF2B2] tracking-wider text-base sm:text-lg mt-0.5 block">
                    2026-00001
                  </span>
                </div>

                {/* Flip Hint */}
                <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  <RotateCw size={12} className="text-[#D4AF37]" />
                  <span>Tap or swipe to flip</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-400/40">
                  <ShieldCheck size={15} />
                  <span>AY 2026–2027</span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3B. CARD BACK FACE (MAGNETIC STRIPE, BARCODE & SIGNATURE)     */}
            {/* ============================================================ */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0B1A38] via-[#071329] to-[#030814] border-2 border-[#D4AF37] flex flex-col justify-between overflow-hidden shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Glossy Black Magnetic Stripe (Across Top) */}
              <div className="w-full h-11 sm:h-13 bg-slate-950 mt-5 border-y border-white/10 shadow-inner relative flex items-center justify-end px-4">
                <span className="text-[9px] font-mono tracking-widest text-slate-500">ISO/IEC 7810 MAGSTRIPE TRACK 1-2-3</span>
              </div>

              {/* Back Content Area */}
              <div className="px-6 pb-5 flex-1 flex flex-col justify-between">
                {/* Signature Strip & Holographic Seal */}
                <div className="flex items-center justify-between gap-4 mt-3">
                  {/* Signature Box */}
                  <div className="flex-1 bg-slate-100/90 rounded-md p-1.5 border border-slate-300 text-slate-900 shadow-inner">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-slate-500 leading-none">
                      Authorized Student Signature
                    </span>
                    <span className="font-serif italic font-black text-sm sm:text-base text-slate-900 tracking-wide block mt-0.5">
                      Juan Dela Cruz
                    </span>
                  </div>

                  {/* Security Hologram Sticker */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-300 via-rose-300 to-cyan-300 border-2 border-amber-200 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-950/80 flex items-center justify-center">
                      <QrCode size={18} className="text-[#FFF2B2]" />
                    </div>
                  </div>
                </div>

                {/* Institutional Terms & Instructions */}
                <div className="text-[9px] text-slate-400 leading-tight space-y-1 font-sans">
                  <p>
                    • This smart pass is non-transferable and remains official property of the Institution.
                  </p>
                  <p>
                    • Present this badge at the Kiosk sensor below to dispense your examination permit.
                  </p>
                  <p className="text-amber-300/80 font-mono">
                    • In case of loss or damaged chip, report immediately to Registrar Window 1.
                  </p>
                </div>

                {/* Barcode & Flip Return Action */}
                <div className="flex items-end justify-between border-t border-white/15 pt-2">
                  <div className="flex items-center gap-2">
                    <Barcode size={34} className="text-slate-300" />
                    <div>
                      <span className="text-[8px] font-mono text-slate-500 block leading-none">RFID ENCODED UID</span>
                      <span className="text-xs font-mono font-bold text-[#FFF2B2] tracking-wider block mt-0.5">
                        *2026-00001*
                      </span>
                    </div>
                  </div>

                  {/* Flip Back Action Pill */}
                  <button
                    type="button"
                    onClick={handleToggleFlip}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[#FFF2B2] text-xs font-mono font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <RotateCw size={13} className="text-[#D4AF37]" />
                    <span>Flip to Front</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Realistic Floor Contact Shadow */}
          <motion.div
            animate={{
              scaleX: [0.94, 1.06, 0.94],
              scaleY: [0.94, 1.06, 0.94],
              opacity: [0.55, 0.75, 0.55],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-80 h-9 sm:w-[480px] sm:h-12 rounded-full bg-black/90 blur-2xl mt-6 pointer-events-none transform -skew-x-12"
          />
        </div>

        {/* ============================================================== */}
        {/* 4. DIRECTIONAL PROMPT POINTING TO PHYSICAL RFID SENSOR BELOW   */}
        {/* ============================================================== */}
        <div className="flex flex-col items-center gap-2 mt-5 select-none text-center">
          <button
            type="button"
            onClick={() => handleDispenseScan()}
            className="group flex items-center justify-center gap-3 text-[#FFF2B2] font-black text-lg sm:text-2xl tracking-wider uppercase drop-shadow-md hover:text-amber-200 transition-colors cursor-pointer"
          >
            <ArrowDown size={26} className="animate-bounce text-[#D4AF37] group-hover:text-amber-300 shrink-0" />
            <span>Tap ID to the RFID sensor to dispense permit</span>
            <ArrowDown size={26} className="animate-bounce text-[#D4AF37] group-hover:text-amber-300 shrink-0" />
          </button>

          <p className="text-xs sm:text-base font-mono text-emerald-400 font-extrabold tracking-wide">
            Physical RFID sensor is located directly below the screen
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. FOOTER: INTERACTIVE TUTORIAL INVITATION (FLUSH)             */}
      {/* ============================================================== */}
      {onOpenTutorial && (
        <div className="relative z-10 pb-3 w-full flex justify-center">
          <button
            type="button"
            onClick={onOpenTutorial}
            className="px-6 py-2 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs sm:text-sm font-semibold text-[#D4AF37] hover:text-[#FFF2B2] border border-white/15 inline-flex items-center gap-2.5 cursor-pointer transition-all shadow-md"
          >
            <HelpCircle size={16} className="text-[#D4AF37]" />
            <span>First time using the kiosk? Watch 30-Second Tutorial</span>
            <Sparkles size={14} className="text-amber-300" />
          </button>
        </div>
      )}
    </div>
  );
};
