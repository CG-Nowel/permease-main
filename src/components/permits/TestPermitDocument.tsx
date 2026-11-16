import React from 'react';
import type { Student, TestPermit } from '../../types/index.ts';

export interface TestPermitDocumentProps {
  student: Student;
  permit: TestPermit;
}

export const TestPermitDocument: React.FC<TestPermitDocumentProps> = ({ student, permit }) => {
  const subjects = student.subjects && student.subjects.length > 0 ? student.subjects : [
    { id: 1, subject_code: 'IT 101', subject_title: 'Introduction to Computing', units: 3 },
    { id: 2, subject_code: 'IT 102', subject_title: 'Computer Programming 1', units: 3 },
    { id: 3, subject_code: 'IT 103', subject_title: 'Data Structures & Algorithms', units: 3 },
    { id: 4, subject_code: 'GE 101', subject_title: 'Understanding the Self', units: 3 },
    { id: 5, subject_code: 'GE 102', subject_title: 'Readings in Philippine History', units: 3 },
  ];

  const examPeriod = permit.exam_period || 'PRELIM';
  const dateIssued = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg p-6 sm:p-8 border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-sans">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[#0B1B3D]">
          EXAMINATION PERMIT
        </h1>
      </div>

      {/* Student Details Block */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-4 pb-3 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex">
            <span className="font-bold text-slate-800 w-24">Name:</span>
            <span className="font-medium text-slate-900 uppercase">
              {student.last_name}, {student.first_name} {student.middle_name || ''}
            </span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-24">Student No:</span>
            <span className="font-mono font-bold text-slate-900">{student.student_number}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-24">Program:</span>
            <span className="font-medium text-slate-900">
              {student.course} {student.program} ({student.grade_year_level || '1st Year'} - {student.section || 'A'})
            </span>
          </div>
        </div>

        <div className="space-y-1 sm:pl-6">
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">Semester:</span>
            <span className="font-medium text-slate-900">{permit.semester || '1st Semester'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">S.Y:</span>
            <span className="font-medium text-slate-900">{permit.academic_year || '2026-2027'}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-slate-800 w-20">Permit No:</span>
            <span className="font-mono font-bold text-[#1E40AF]">{permit.permit_number}</span>
          </div>
        </div>
      </div>

      {/* Examination Period Centered Heading */}
      <div className="text-center font-black text-sm uppercase tracking-widest text-[#0B1B3D] mb-2">
        {examPeriod.toUpperCase()}
      </div>

      {/* 3-Column Table matching hand-drawn sketch */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-left border-collapse border border-slate-800 text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-800">
              <th className="py-2 px-3 border-r border-slate-800 w-1/4">SUBJECT CODE</th>
              <th className="py-2 px-3 border-r border-slate-800 w-1/2">SUBJECT DESCRIPTION</th>
              <th className="py-2 px-3 text-center w-1/4">PROCTOR SIGNATURE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {subjects.map((subj, idx) => {
              const code = (subj as { subject_code?: string; code?: string }).subject_code || (subj as { subject_code?: string; code?: string }).code || '';
              const title = (subj as { subject_title?: string; title?: string }).subject_title || (subj as { subject_title?: string; title?: string }).title || '';
              return (
                <tr key={idx} className="border-b border-slate-800">
                  <td className="py-2.5 px-3 font-mono font-bold border-r border-slate-800">
                    {code}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-800">
                    {title}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-300 font-mono text-[10px]">
                    &nbsp;
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Date Issued */}
      <div className="flex items-center justify-between text-xs pt-2">
        <div>
          <span className="font-bold text-slate-800">Date Issued: </span>
          <span className="font-medium text-slate-900">{dateIssued}</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
          PERMEASE OFFICIAL KIOSK AUTHORIZATION
        </div>
      </div>
    </div>
  );
};
