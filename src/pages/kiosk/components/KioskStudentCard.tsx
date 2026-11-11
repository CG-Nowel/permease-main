import React from 'react';
import { Badge } from '../../../components/index.ts';

export interface KioskStudentCardProps {
  name: string;
  studentNumber: string;
  courseProgram: string;
  yearLevel: string;
  section: string;
  financialStatus: 'CLEARED' | 'WITH_BALANCE';
}

export const KioskStudentCard: React.FC<KioskStudentCardProps> = ({
  name,
  studentNumber,
  courseProgram,
  yearLevel,
  section,
  financialStatus,
}) => {
  return (
    <div className="border-b border-slate-100 pb-6 text-left flex items-start justify-between">
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Verified Student Identity
        </span>
        <h3 className="text-3xl font-black text-[#0B1B3D] tracking-tight">{name}</h3>
        <p className="text-sm font-mono font-bold text-[#1E40AF]">STUDENT NO: {studentNumber}</p>
        <p className="text-xs text-slate-600 mt-1 font-semibold">
          {courseProgram} • {yearLevel} ({section})
        </p>
      </div>
      <Badge status={financialStatus} />
    </div>
  );
};
