import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/index.ts';
import { toast } from 'sonner';
import { PresetCurriculumCard } from './components/PresetCurriculumCard.tsx';
import { presetCurriculums, type PresetSubject } from '../../mock/presetCurriculum.ts';
import { api } from '../../lib/api.ts';
import { useStudentStore } from '../../store/studentStore.ts';
import { useAcademicTerm } from '../../store/AcademicTermContext.tsx';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Radio,
  Calendar,
} from 'lucide-react';



/* ─────────────────────────────────────────────────────────── */
/*  Reusable clean field wrapper with error state              */
/* ─────────────────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

const Field: React.FC<FieldProps> = ({ label, required, children, hint, error }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
        <AlertCircle size={12} className="shrink-0" />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p className="text-[11px] text-slate-500">{hint}</p>
    ) : null}
  </div>
);

interface FormErrors {
  firstName?: string;
  lastName?: string;
  gradeYearLevel?: string;
  section?: string;
  studentNumber?: string;
}

export const RegisterStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const { addStudent } = useStudentStore();
  const { activeTerm, getSemesterKey } = useAcademicTerm();

  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);


  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    studentNumber: '',
    studentType: 'Regular' as 'Regular' | 'Irregular',
    gradeYearLevel: '',
    section: 'Section A',
    course: 'BS',
    program: 'Information Technology',
    programId: 'bsit',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [selectedSubjects, setSelectedSubjects] = useState<PresetSubject[]>([]);
  const [registeredStudentData, setRegisteredStudentData] = useState<any>(null);

  // Modal States
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannedRfid, setScannedRfid] = useState('');
  const [collisionError, setCollisionError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Auto-focus first name input on page mount
  useEffect(() => {
    firstNameInputRef.current?.focus();
  }, []);

  // When RFID modal opens, auto-focus the RFID UID input
  useEffect(() => {
    if (isRfidModalOpen && !registrationSuccess && !isSubmitting) {
      setTimeout(() => {
        rfidInputRef.current?.focus();
      }, 150);
    }
  }, [isRfidModalOpen, registrationSuccess, isSubmitting]);

  // Global hardware RFID reader listener when modal is open
  useEffect(() => {
    if (!isRfidModalOpen || registrationSuccess || isSubmitting) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      // USB HID barcode/RFID readers send keys with rapid intervals (<60ms)
      if (now - lastKeyTime > 250) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        const candidate = (buffer.trim() || scannedRfid.trim()).toUpperCase();
        if (candidate.length >= 4) {
          e.preventDefault();
          buffer = '';
          setScannedRfid(candidate);
          handleRegisterWithRfid(candidate);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // If not focused on the text input, collect keys into buffer
        if (document.activeElement !== rfidInputRef.current) {
          buffer += e.key;
          setScannedRfid(buffer.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isRfidModalOpen, registrationSuccess, isSubmitting, scannedRfid, formData, selectedSubjects]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.gradeYearLevel) {
      newErrors.gradeYearLevel = 'Please select a year level';
    }

    if (!formData.section.trim()) {
      newErrors.section = 'Section is required (e.g. Section A)';
    }

    const trimmedStudentNum = formData.studentNumber.trim();
    if (!trimmedStudentNum) {
      newErrors.studentNumber = 'Student number is required';
    } else if (!/^\d{4}-?\d{4,5}$/.test(trimmedStudentNum)) {
      newErrors.studentNumber = 'Format should be YYYY-XXXXX (e.g. 2026-00042)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProgramSelect = (progId: string) => {
    const prog = presetCurriculums.find((c) => c.id === progId) || presetCurriculums[0];
    setFormData((prev) => ({
      ...prev,
      programId: prog.id,
      course: prog.course,
      program: prog.program,
    }));
  };

  const handleApplyPreset = (
    course: string,
    program: string,
    yearLevel: string,
    _subjects?: any[],
    studentType?: 'Regular' | 'Irregular'
  ) => {
    const matched = presetCurriculums.find(
      (c) => c.program.toLowerCase() === program.toLowerCase() || c.course === course
    );
    setFormData((prev) => ({
      ...prev,
      course,
      program,
      gradeYearLevel: yearLevel,
      ...(matched ? { programId: matched.id } : {}),
      ...(studentType ? { studentType } : {}),
    }));

    if (errors.gradeYearLevel) {
      setErrors((prev) => ({ ...prev, gradeYearLevel: undefined }));
    }
  };

  // Next Button Handler: Validates and Opens RFID Tap Modal
  const handleProceedToRfidModal = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      gradeYearLevel: true,
      section: true,
      studentNumber: true,
    });

    if (!validateForm()) {
      toast.error('Please complete all required fields correctly before proceeding.');
      return;
    }

    setCollisionError(null);
    setScannedRfid('');
    setRegistrationSuccess(false);
    setRegisteredStudentData(null);
    setIsRfidModalOpen(true);
  };

  // Automatic registration trigger upon card tap
  const handleRegisterWithRfid = async (uidToRegister: string) => {
    const cleanUid = uidToRegister.trim().toUpperCase();
    if (!cleanUid) {
      toast.error('Please tap a valid RFID card on the reader.');
      return;
    }

    // Ensure form is still valid
    if (!validateForm()) {
      setIsRfidModalOpen(false);
      toast.error('Please complete all required fields.');
      return;
    }

    // Automatically fill the text box
    setScannedRfid(cleanUid);
    setIsSubmitting(true);
    setCollisionError(null);

    // Subjects fallback using active academic term semester
    let subjectsToEnroll = selectedSubjects;
    if (subjectsToEnroll.length === 0 && formData.gradeYearLevel) {
      const prog = presetCurriculums.find((c) => c.id === formData.programId) || presetCurriculums[0];
      const yrData = prog.years[formData.gradeYearLevel];
      const semKey = getSemesterKey();
      if (yrData?.[semKey]) {
        subjectsToEnroll = yrData[semKey];
      } else if (yrData?.firstSem) {
        subjectsToEnroll = yrData.firstSem;
      }
    }

    try {
      const res = await api.post('/api/students', {
        first_name: formData.firstName.trim(),
        middle_name: formData.middleName.trim() || null,
        last_name: formData.lastName.trim(),
        student_number: formData.studentNumber.trim(),
        grade_year_level: formData.gradeYearLevel,
        section: formData.section.trim(),
        course: formData.course,
        program: formData.program,
        student_type: formData.studentType,
        semester: activeTerm.semester,
        academic_year: activeTerm.academic_year,
        rfid_uid: cleanUid,
        subjects: subjectsToEnroll.map((s) => ({
          code: s.code,
          title: s.title,
          units: s.units,
          type: s.type,
        })),
      });

      const studentResult = res.data.data;

      addStudent(studentResult);
      setRegisteredStudentData(studentResult);
      setRegistrationSuccess(true);
      toast.success('Registration successful! Student enrolled with paired RFID card.');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.student_number?.[0] ||
        err.response?.data?.errors?.rfid_uid?.[0] ||
        'Registration failed. Please check form inputs and RFID card.';
      setCollisionError(msg);
      toast.error(msg);
      rfidInputRef.current?.select();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      studentNumber: '',
      studentType: 'Regular',
      gradeYearLevel: '',
      section: 'Section A',
      course: 'BS',
      program: 'Information Technology',
      programId: 'bsit',
    });
    setErrors({});
    setTouched({});
    setSelectedSubjects([]);
    setRegisteredStudentData(null);
    setScannedRfid('');
    setCollisionError(null);
    setIsRfidModalOpen(false);
    setRegistrationSuccess(false);

    setTimeout(() => {
      firstNameInputRef.current?.focus();
    }, 100);
  };

  const getInputClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs ${
      hasError
        ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
        : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
    }`;

  const getSelectClass = (hasError?: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none transition shadow-2xs cursor-pointer ${
      hasError
        ? 'border-rose-400 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
        : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
    }`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Registration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete the student profile information, then click Next to tap and assign their contactless RFID smart card
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-lg text-xs font-semibold text-[#1E40AF] self-start sm:self-auto shadow-2xs">
          <Calendar size={14} className="text-[#1E40AF] shrink-0" />
          <span>Active Term: {activeTerm.label}</span>
        </div>
      </div>


      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sequential Registration Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleProceedToRfidModal} noValidate className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Step 1: Personal Information */}
            <div className="p-6 space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Personal Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Official name as recorded in admissions and civil records</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  Step 1 of 3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <Field label="First Name" required error={touched.firstName ? errors.firstName : undefined}>
                  <input
                    ref={firstNameInputRef}
                    className={getInputClass(touched.firstName && !!errors.firstName)}
                    placeholder="e.g. Juan"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, firstName: true }))}
                  />
                </Field>

                <Field label="Middle Name" hint="Optional">
                  <input
                    className={getInputClass()}
                    placeholder="e.g. Protacio"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                  />
                </Field>

                <Field label="Last Name" required error={touched.lastName ? errors.lastName : undefined}>
                  <input
                    className={getInputClass(touched.lastName && !!errors.lastName)}
                    placeholder="e.g. Dela Cruz"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
                  />
                </Field>
              </div>
            </div>

            {/* Step 2: Academic Placement */}
            <div className="p-6 space-y-4 border-t border-slate-100">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Academic Placement</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Degree program, current academic year level, and assigned section</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  Step 2 of 3
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="sm:col-span-2">
                  <Field label="Degree Program / Course" required>
                    <select
                      className={getSelectClass()}
                      value={formData.programId}
                      onChange={(e) => handleProgramSelect(e.target.value)}
                    >
                      {presetCurriculums.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.course} {curr.program} ({curr.shortName})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Year Level" required error={touched.gradeYearLevel ? errors.gradeYearLevel : undefined}>
                  <select
                    className={getSelectClass(touched.gradeYearLevel && !!errors.gradeYearLevel)}
                    value={formData.gradeYearLevel}
                    onChange={(e) => handleInputChange('gradeYearLevel', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, gradeYearLevel: true }))}
                  >
                    <option value="">-- Select Academic Year Level --</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </Field>

                <Field label="Section" required error={touched.section ? errors.section : undefined}>
                  <input
                    className={getInputClass(touched.section && !!errors.section)}
                    placeholder="e.g. Section A"
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, section: true }))}
                  />
                </Field>
              </div>
            </div>

            {/* Step 3: Student Identification */}
            <div className="p-6 space-y-4 border-t border-slate-100">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Student Identification</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Permanent institutional student ID number</p>
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  Step 3 of 3
                </span>
              </div>

              <div className="pt-1 max-w-sm">
                <Field
                  label="Student Number"
                  required
                  hint="Institutional format: YYYY-XXXXX (e.g. 2026-00042)"
                  error={touched.studentNumber ? errors.studentNumber : undefined}
                >
                  <input
                    className={getInputClass(touched.studentNumber && !!errors.studentNumber)}
                    placeholder="2026-00042"
                    value={formData.studentNumber}
                    onChange={(e) => handleInputChange('studentNumber', e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, studentNumber: true }))}
                  />
                </Field>
              </div>
            </div>

            {/* Form Footer Action Bar: Clear Form & Next Button */}
            <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Clear Form</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Next: Tap RFID Card</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Dynamic Preset Curriculum & Subjects */}
        <div className="lg:col-span-5">
          <PresetCurriculumCard
            currentYearLevel={formData.gradeYearLevel}
            currentProgram={formData.program}
            selectedProgramId={formData.programId}
            studentType={formData.studentType}
            onStudentTypeChange={(type) => handleInputChange('studentType', type)}
            onApplyPreset={handleApplyPreset}
            onSubjectsChange={setSelectedSubjects}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/*  RFID Card Tapping & Registration Modal                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isRfidModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsRfidModalOpen(false);
        }}
        title={registrationSuccess ? 'Registration Successful' : 'Assign RFID Card & Register'}
        maxWidth="md"
      >
        <div className="py-1">
          {!registrationSuccess ? (
            /* State 1: Tap Card on Reader View */
            <div className="space-y-5 text-center">
              {/* Candidate Student Snapshot */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Candidate Student
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {formData.gradeYearLevel} • {formData.section}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      A.Y. {activeTerm.academic_year} • {activeTerm.semester}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {formData.firstName} {formData.middleName ? `${formData.middleName} ` : ''}{formData.lastName}
                  </h4>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Student No: <span className="font-bold text-blue-700">{formData.studentNumber}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formData.course} {formData.program} ({formData.studentType} Student)
                  </p>
                </div>
              </div>

              {/* Contactless Reader Visual Indicator */}
              <div className="relative py-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#0B1B3D] via-[#102A6B] to-[#1E40AF] text-[#D4AF37] flex items-center justify-center shadow-lg border-2 border-[#D4AF37]/50 relative">
                  <div className="absolute inset-0 rounded-full border border-blue-400/40 animate-ping opacity-75 pointer-events-none" />
                  {isSubmitting ? (
                    <Radio size={30} className="text-[#D4AF37] animate-pulse" />
                  ) : (
                    <CreditCard size={30} className="text-[#D4AF37]" />
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">
                  {isSubmitting ? 'Registering Student & Card…' : 'Tap RFID Smart Card on Reader'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Hold or tap the student contactless card on the USB reader. The card UID will{' '}
                  <span className="font-semibold text-blue-700">automatically fill below</span> and submit enrollment!
                </p>
              </div>

              {/* Collision Error Alert */}
              {collisionError && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2 text-left">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span className="flex-1">{collisionError}</span>
                </div>
              )}

              {/* Auto-filled RFID Card UID Textbox */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Scanned RFID Card UID:
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Reader Listening
                  </span>
                </div>

                <div className="relative">
                  <input
                    ref={rfidInputRef}
                    type="text"
                    value={scannedRfid}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setScannedRfid(val);
                      setCollisionError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (scannedRfid.trim()) {
                          handleRegisterWithRfid(scannedRfid.trim());
                        }
                      }
                    }}
                    placeholder="Waiting for card tap (UID auto-fills here)..."
                    disabled={isSubmitting}
                    className="w-full rounded-xl border-2 border-blue-500 bg-blue-50/20 px-4 py-3 text-center text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition shadow-xs tracking-wider"
                  />
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  USB hardware reader will type the card UID and automatically complete registration.
                </p>
              </div>

              {/* Manual Tap Trigger & Demo Simulation */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <button
                  type="button"
                  onClick={() => scannedRfid.trim() && handleRegisterWithRfid(scannedRfid.trim())}
                  disabled={!scannedRfid.trim() || isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Processing Registration…' : 'Confirm & Complete Registration'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* State 2: Successful Registration View */
            <div className="space-y-5 text-center py-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 size={38} className="text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Officially Enrolled!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Student record created with initial billing status{' '}
                  <span className="font-semibold text-rose-600">WITH BALANCE</span> and contactless RFID card paired.
                </p>
              </div>

              {/* Student Summary Info Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left max-w-md mx-auto space-y-2.5 text-xs">
                <div className="pb-2 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Enrolled Student Profile</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Student
                  </span>
                </div>

                {([
                  ['Full Name', `${formData.firstName}${formData.middleName ? ` ${formData.middleName}` : ''} ${formData.lastName}`],
                  ['Student Number', formData.studentNumber],
                  ['Program & Year', `${formData.course} ${formData.program} • ${formData.gradeYearLevel}`],
                  ['Assigned Section', formData.section],
                  ['School Year & Semester', `A.Y. ${activeTerm.academic_year} • ${activeTerm.semester}`],
                  ['Classification', `${formData.studentType} Student`],
                  ['Paired RFID UID', scannedRfid || registeredStudentData?.rfid_card?.rfid_uid || '—'],
                  ['Initial Billing Assessment', registeredStudentData ? `₱${Number(registeredStudentData.balance_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱15,500.00'],
                  ['Financial Status', 'WITH_BALANCE'],
                  ['Test Permit Eligibility', 'BLOCKED (Awaiting Cashier Clearance)'],
                ] as [string, string][]).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 font-medium">{key}</span>
                    <span
                      className={`font-semibold ${
                        key === 'Paired RFID UID'
                          ? 'font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200'
                          : key === 'Financial Status'
                          ? 'text-rose-600'
                          : key === 'Test Permit Eligibility'
                          ? 'text-amber-700'
                          : key === 'Initial Billing Assessment'
                          ? 'font-mono text-slate-900'
                          : 'text-slate-900'
                      }`}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-center items-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck size={14} className="text-slate-600" />
                  <span>Register Another Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRfidModalOpen(false);
                    navigate('/registrar/students');
                  }}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>View in Student Directory</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
