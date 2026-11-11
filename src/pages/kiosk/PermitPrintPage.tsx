import React, { useState, useEffect } from 'react';
import { Button } from '../../components/index.ts';
import { Printer, ArrowLeft, AlertCircle, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { TestPermitDocument } from '../../components/permits/TestPermitDocument.tsx';
import { useAcademicTerm } from '../../store/AcademicTermContext.tsx';
import { useStudentStore } from '../../store/studentStore.ts';
import { api } from '../../lib/api.ts';
import type { Student } from '../../types/index.ts';

export const PermitPrintPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { activeTerm } = useAcademicTerm();
  const { students } = useStudentStore();

  const [student, setStudent] = useState<Student | null>(() => {
    return students.find((s) => s.id === Number(id)) || null;
  });
  const [loading, setLoading] = useState(!student);

  useEffect(() => {
    if (!student && id) {
      setLoading(true);
      api
        .get(`/api/students/${id}`)
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setStudent(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load student for permit print:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, student]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-xs text-slate-600 font-medium">Preparing Examination Permit Document...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={32} className="text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-slate-800">Student Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            The requested student permit could not be located in the database.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            Return to Terminal
          </Button>
        </div>
      </div>
    );
  }

  const permit = student.current_permit ? {
    ...student.current_permit,
    academic_year: student.current_permit.academic_year || activeTerm.academic_year,
    semester: student.current_permit.semester || activeTerm.semester,
  } : {
    id: student.id,
    student_id: student.id,
    permit_number: 'TP-2026-' + String(student.id).padStart(6, '0'),
    academic_year: activeTerm.academic_year,
    semester: activeTerm.semester,
    exam_period: 'Midterm Examination',
    status: 'PRINTED' as const,
    print_count: 0,
    reprint_allowed: false,
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl flex items-center justify-between mb-6 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft size={16} />}
        >
          Return to Terminal
        </Button>
        <div className="flex items-center gap-2">
          <a
            href={`/permits/${student.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <FileText size={15} className="text-red-600" />
            <span>Open Official A6 PDF</span>
          </a>
          <Button
            variant="gold"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer size={16} />}
          >
            Print Test Permit
          </Button>
        </div>
      </div>

      <TestPermitDocument student={student} permit={permit} />
    </div>
  );
};
