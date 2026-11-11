import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete, CheckCircle2, User, Search, AlertCircle } from 'lucide-react';
import { KioskAudio } from '../../../lib/audio.ts';
import { useStudentStore } from '../../../store/studentStore.ts';
import type { Student } from '../../../types/index.ts';

interface KioskKeypadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: Student) => void;
}

export const KioskKeypadModal: React.FC<KioskKeypadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { students, getStudentByNumberOrRfid } = useStudentStore();
  const [inputVal, setInputVal] = useState<string>('2026-');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Real-time matched student preview
  const matchedStudent = inputVal.trim().length >= 8 ? getStudentByNumberOrRfid(inputVal.trim()) : null;

  const handleKeyPress = (char: string) => {
    KioskAudio.playKeyClick();
    setErrorMsg('');

    if (inputVal.length >= 12) return;

    // Automatically handle dash after year
    if (inputVal.length === 4 && char !== '-') {
      setInputVal((prev) => `${prev}-${char}`);
    } else {
      setInputVal((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    KioskAudio.playKeyClick();
    setErrorMsg('');
    setInputVal((prev) => {
      if (prev.endsWith('-')) {
        return prev.slice(0, -2);
      }
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    KioskAudio.playKeyClick();
    setErrorMsg('');
    setInputVal('2026-');
  };

  const handleLookup = () => {
    const student = getStudentByNumberOrRfid(inputVal.trim());
    if (student) {
      KioskAudio.playSuccessChime();
      onSubmit(student);
      onClose();
    } else {
      KioskAudio.playWarningTone();
      setErrorMsg(`No enrolled student found matching Student ID "${inputVal.trim()}". Please verify your ID or proceed to the Registrar.`);
    }
  };

  const keyPadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-[#0A1835] via-[#0B1B3D] to-[#07132B] border-2 border-[#D4AF37]/50 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/90 text-white flex flex-col space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Search size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-wide font-serif-brand text-white">
                  Manual Student ID Lookup
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Touch the on-screen keypad to enter your ID number
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                KioskAudio.playKeyClick();
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Student ID Display Box */}
          <div className="rounded-2xl bg-black/50 border border-white/15 p-4 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4AF37] block">
              ENTER STUDENT ID (FORMAT: YYYY-XXXXX)
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-[#FFF4BC] min-h-[44px] flex items-center justify-center">
              {inputVal}
              <span className="w-2.5 h-8 bg-[#D4AF37] animate-pulse ml-1 inline-block rounded-xs" />
            </div>

            {/* Live Match Preview */}
            {matchedStudent ? (
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/30">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span className="truncate">
                  Matched: {matchedStudent.last_name}, {matchedStudent.first_name} ({matchedStudent.course})
                </span>
              </div>
            ) : inputVal.length >= 10 ? (
              <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-amber-300/90">
                <AlertCircle size={14} className="shrink-0" />
                <span>Ready to search record</span>
              </div>
            ) : null}

            {errorMsg && (
              <div className="pt-2 text-xs text-rose-300 font-medium bg-rose-500/15 p-2 rounded-xl border border-rose-500/30">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Large Tactile Touchscreen Keypad (48-60px finger targets) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {keyPadButtons.map((btn) => {
              if (btn === 'C') {
                return (
                  <button
                    key={btn}
                    type="button"
                    onClick={handleClear}
                    className="h-14 sm:h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-slate-300 hover:text-white font-black text-lg transition-all flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    CLR
                  </button>
                );
              }

              if (btn === 'DEL') {
                return (
                  <button
                    key={btn}
                    type="button"
                    onClick={handleBackspace}
                    className="h-14 sm:h-16 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 border border-rose-500/30 text-rose-300 font-black text-base transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Delete size={20} />
                  </button>
                );
              }

              return (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handleKeyPress(btn)}
                  className="h-14 sm:h-16 rounded-2xl bg-white/[0.08] hover:bg-white/[0.18] active:scale-95 border border-white/15 text-white font-mono font-black text-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:border-[#D4AF37]/50"
                >
                  {btn}
                </button>
              );
            })}
          </div>

          {/* Quick Enrolled Student Presets for Instant Demo/Testing */}
          <div className="pt-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Sample Enrolled IDs (Tap to autofill):
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {students.slice(0, 3).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    KioskAudio.playKeyClick();
                    setInputVal(st.student_number);
                    setErrorMsg('');
                  }}
                  className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-mono font-bold text-[#D4AF37] truncate cursor-pointer transition-all"
                >
                  {st.student_number}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                KioskAudio.playKeyClick();
                onClose();
              }}
              className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-sm tracking-wide transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleLookup}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#D4AF37] hover:brightness-110 active:scale-95 text-[#0A1833] font-black text-base tracking-wider shadow-lg shadow-[#D4AF37]/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-200"
            >
              <Search size={18} />
              <span>Verify & Continue</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
