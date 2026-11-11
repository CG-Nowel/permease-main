import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/index.ts';
import type { Student, PresetSubject, FinancialStatusType } from '../../../types/index.ts';
import { presetCurriculums } from '../../../mock/presetCurriculum.ts';
import { useAcademicTerm } from '../../../store/AcademicTermContext.tsx';
import { toast } from 'sonner';
import { CreditCard, RefreshCw, Trash2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';


export interface ManageStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (updatedStudent: Student) => void;
}

export const ManageStudentModal: React.FC<ManageStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSave,
}) => {
  const { activeTerm, getSemesterKey } = useAcademicTerm();
  const [activeTab, setActiveTab] = useState<'placement' | 'subjects' | 'rfid'>('placement');


  // Form states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [gradeYearLevel, setGradeYearLevel] = useState('1st Year');
  const [section, setSection] = useState('Section A');
  const [programId, setProgramId] = useState('bsit');
  const [studentType, setStudentType] = useState<'Regular' | 'Irregular'>('Regular');
  const [selectedSem, setSelectedSem] = useState<'firstSem' | 'secondSem'>('firstSem');
  const [billingStatus, setBillingStatus] = useState<FinancialStatusType>('CLEARED');

  // RFID states & Card Replacement
  const [rfidUid, setRfidUid] = useState('');
  const [isCardDisabled, setIsCardDisabled] = useState(false);
  const [isReplacingCard, setIsReplacingCard] = useState(false);
  const [replacementUid, setReplacementUid] = useState('');
  const [replacementReason, setReplacementReason] = useState('Lost Card (Fee Settled / Endorsed)');
  const [previousReplacedUid, setPreviousReplacedUid] = useState<string | null>(null);

  // Subjects states
  const [subjects, setSubjects] = useState<PresetSubject[]>([]);
  const [subjectToAdd, setSubjectToAdd] = useState('');

  // Synchronize when student changes
  useEffect(() => {
    if (student) {
      setIsReplacingCard(false);
      setReplacementUid('');
      setPreviousReplacedUid(null);
      setFirstName(student.first_name || '');
      setMiddleName(student.middle_name || '');
      setLastName(student.last_name || '');
      setStudentNumber(student.student_number || '');
      setGradeYearLevel(student.grade_year_level || '1st Year');
      setSection(student.section || 'Section A');
      setStudentType(student.student_type || 'Regular');
      setBillingStatus(student.financial_status?.status || 'CLEARED');
      setSelectedSem(getSemesterKey());


      // Match programId
      const matchedProg = presetCurriculums.find(
        (c) =>
          c.program.toLowerCase() === student.program.toLowerCase() ||
          c.shortName.toLowerCase() === student.program.toLowerCase()
      );
      const activeProgId = matchedProg ? matchedProg.id : 'bsit';
      setProgramId(activeProgId);

      // RFID info
      if (student.rfid_card) {
        setRfidUid(student.rfid_card.rfid_uid);
        setIsCardDisabled(student.rfid_card.status === 'DEACTIVATED');
      } else {
        setRfidUid('');
        setIsCardDisabled(false);
      }

      // Initial subjects: use student.subjects or default from curriculum
      if (student.subjects && student.subjects.length > 0) {
        setSubjects(
          student.subjects.map((s: any) => ({
            code: s.code || s.subject_code || '',
            title: s.title || s.subject_title || '',
            units: Number(s.units) || 3,
            type: s.type || s.subject_type || 'Major',
          }))
        );
      } else {
        const curr = matchedProg || presetCurriculums[0];
        const yearCurriculum = curr.years[student.grade_year_level] || curr.years['1st Year'];
        setSubjects(yearCurriculum ? yearCurriculum.firstSem : []);
      }
    }
  }, [student]);

  if (!student) return null;

  // Active curriculum based on programId
  const activeCurriculum =
    presetCurriculums.find((c) => c.id === programId) || presetCurriculums[0];

  // Year level presets based on selected year level and semester
  const yearCurriculum =
    activeCurriculum.years[gradeYearLevel] || activeCurriculum.years['1st Year'];
  const presetSubjectsForYear: PresetSubject[] =
    selectedSem === 'firstSem' ? yearCurriculum.firstSem : yearCurriculum.secondSem;
  const presetUnitsForYear = presetSubjectsForYear.reduce((acc, s) => acc + s.units, 0);

  // Compile all database subjects for the dropdown
  const allAvailableSubjects: PresetSubject[] = [];
  presetCurriculums.forEach((p) => {
    Object.values(p.years).forEach((y) => {
      y.firstSem.forEach((s) => {
        if (!allAvailableSubjects.some((x) => x.code === s.code)) {
          allAvailableSubjects.push(s);
        }
      });
      y.secondSem.forEach((s) => {
        if (!allAvailableSubjects.some((x) => x.code === s.code)) {
          allAvailableSubjects.push(s);
        }
      });
    });
  });

  // Handler for Year Level Change (Automatic Promotion & Subject Load Replacement)
  const handleYearLevelChange = (newYear: string) => {
    setGradeYearLevel(newYear);

    // Retrieve preset curriculum for the newly selected year level
    const targetCurriculum = activeCurriculum.years[newYear] || activeCurriculum.years['1st Year'];
    if (targetCurriculum) {
      const newSubjects = selectedSem === 'firstSem' ? targetCurriculum.firstSem : targetCurriculum.secondSem;
      // Replace old subjects with the new year level's subject load
      setSubjects([...newSubjects]);
      toast.info(
        `Academic placement updated to ${newYear}. Old subjects replaced with ${newSubjects.length} standard subjects for ${newYear}.`
      );
    }
  };

  // Handler for Degree Program Change
  const handleProgramChange = (newProgId: string) => {
    setProgramId(newProgId);
    const matched = presetCurriculums.find((c) => c.id === newProgId) || presetCurriculums[0];
    const targetCurriculum = matched.years[gradeYearLevel] || matched.years['1st Year'];
    if (targetCurriculum) {
      const newSubjects = selectedSem === 'firstSem' ? targetCurriculum.firstSem : targetCurriculum.secondSem;
      setSubjects([...newSubjects]);
      toast.info(`Switched degree program to ${matched.shortName}. Loaded ${gradeYearLevel} subjects.`);
    }
  };

  // Handler for Semester Switch in Subject Load tab
  const handleSemesterSwitch = (sem: 'firstSem' | 'secondSem') => {
    setSelectedSem(sem);
    const targetCurriculum = activeCurriculum.years[gradeYearLevel] || activeCurriculum.years['1st Year'];
    if (targetCurriculum) {
      const newSubjects = sem === 'firstSem' ? targetCurriculum.firstSem : targetCurriculum.secondSem;
      setSubjects([...newSubjects]);
      toast.info(
        `Switched to ${sem === 'firstSem' ? '1st' : '2nd'} Semester. Loaded ${newSubjects.length} subjects for ${gradeYearLevel}.`
      );
    }
  };

  // Handler for Student Type Toggle (Regular / Irregular)
  const handleStudentTypeChange = (type: 'Regular' | 'Irregular') => {
    setStudentType(type);
  };

  const handleAddSubject = (code: string) => {
    if (!code) return;
    const found = allAvailableSubjects.find((s) => s.code === code);
    if (!found) return;
    if (subjects.some((s) => s.code === found.code)) {
      toast.error('Subject is already enrolled');
      return;
    }
    setSubjects((prev) => [...prev, found]);
    setSubjectToAdd('');
    toast.success(`Added ${found.code} (${found.title})`);
  };

  const handleRemoveSubject = (code: string) => {
    setSubjects((prev) => prev.filter((s) => s.code !== code));
    toast.info(`Removed ${code}`);
  };

  const handleApplyCurrentPresets = () => {
    setSubjects(presetSubjectsForYear);
    toast.success(`Loaded standard subjects for ${gradeYearLevel} (${selectedSem === 'firstSem' ? '1st Sem' : '2nd Sem'})`);
  };

  // Card Replacement Handlers
  const handleApplyCardReplacement = () => {
    const cleanUid = replacementUid.trim().toUpperCase();
    if (!cleanUid) {
      toast.error('Please enter or scan a new RFID Card UID');
      return;
    }
    if (cleanUid === rfidUid) {
      toast.error('New card UID must be different from current card UID');
      return;
    }

    setPreviousReplacedUid(rfidUid || 'None');
    setRfidUid(cleanUid);
    setIsCardDisabled(false);
    setIsReplacingCard(false);
    setReplacementUid('');
    toast.success(`RFID Card replaced with new UID [${cleanUid}]. Reason: ${replacementReason}. Click "Save Changes" to commit.`);
  };

  const handleSimulateScanNewCard = () => {
    const chars = '0123456789ABCDEF';
    let generated = '';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setReplacementUid(generated);
    toast.info(`Simulated card scan detected UID [${generated}]`);
  };

  const handleUnpairCard = () => {
    setPreviousReplacedUid(rfidUid);
    setRfidUid('');
    setIsCardDisabled(false);
    setIsReplacingCard(false);
    toast.info('RFID Card detached from student. Student has no card assigned.');
  };

  const totalUnits = subjects.reduce((acc, s) => acc + s.units, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProg =
      presetCurriculums.find((c) => c.id === programId) || presetCurriculums[0];

    const updatedStudent: Student = {
      ...student,
      first_name: firstName.trim(),
      middle_name: middleName.trim() || undefined,
      last_name: lastName.trim(),
      student_number: studentNumber.trim(),
      grade_year_level: gradeYearLevel,
      section: section.trim(),
      course: selectedProg.course,
      program: selectedProg.program,
      student_type: studentType,
      semester: activeTerm.semester,
      academic_year: activeTerm.academic_year,
      units: totalUnits,
      subjects: subjects,
      financial_status: student.financial_status,
      current_permit: student.current_permit
        ? {
            ...student.current_permit,
            academic_year: activeTerm.academic_year,
            semester: activeTerm.semester,
            status: isCardDisabled
              ? 'BLOCKED'
              : student.financial_status?.status === 'WITH_BALANCE'
              ? 'BLOCKED'
              : student.current_permit.status,
          }
        : null,

      rfid_card: rfidUid
        ? {
            id: student.rfid_card?.id || Date.now(),
            student_id: student.id,
            rfid_uid: rfidUid.trim(),
            status: isCardDisabled ? 'DEACTIVATED' : 'ACTIVE',
          }
        : null,
    };

    onSave(updatedStudent);
    toast.success(`Updated profile for ${updatedStudent.first_name} ${updatedStudent.last_name}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Student Record"
      description={`Manage academic placement, study load, and RFID card settings for ${student.first_name} ${student.last_name}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('placement')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'placement'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Academic Placement
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'subjects'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Subject Load</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] ${
                activeTab === 'subjects' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {subjects.length} ({totalUnits}.0u)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rfid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rfid'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>RFID Smart Card</span>
            {isCardDisabled && (
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            )}
          </button>
        </div>

        {/* TAB 1: ACADEMIC PLACEMENT & BASIC INFO */}
        {activeTab === 'placement' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Student Number</label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>

            {/* Academic Placement Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Year Level (Promotion)
                </label>
                <select
                  value={gradeYearLevel}
                  onChange={(e) => handleYearLevelChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer font-medium"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Selecting a year level automatically loads standard subjects and clears previous subjects.
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 p-1.5 px-2 bg-blue-50/80 border border-blue-200/60 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-[11px] text-blue-900 font-medium">
                    Active Study Load: <strong>{subjects.length} subjects</strong> ({totalUnits}.0u) for <strong>{gradeYearLevel}</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Assign Section</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Section A"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Section grouping for class roster and schedule segregation.
                </p>
              </div>
            </div>

            {/* Degree Program */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Degree Program</label>
              <select
                value={programId}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {presetCurriculums.map((curr) => (
                  <option key={curr.id} value={curr.id}>
                    {curr.course} {curr.program} ({curr.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Classification (Regular vs Irregular Status) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700">
                Student Classification & Academic Standing
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleStudentTypeChange('Regular')}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    studentType === 'Regular'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      studentType === 'Regular' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span>Regular Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStudentTypeChange('Irregular')}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    studentType === 'Irregular'
                      ? 'bg-white text-amber-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      studentType === 'Irregular' ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  />
                  <span>Irregular Student</span>
                </button>
              </div>
            </div>

            {/* Billing & Accounting Status (Read-Only) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Billing & Accounting Status
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Read-Only (Accounting Only)
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    billingStatus === 'CLEARED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {billingStatus === 'CLEARED' ? 'CLEARED • ELIGIBLE' : 'WITH BALANCE • ON HOLD'}
                </span>
              </div>
              <div
                className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-lg border border-slate-200 cursor-not-allowed select-none"
                title="Only accountants can edit billing and accounting status"
              >
                <div
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 pointer-events-none transition ${
                    billingStatus === 'CLEARED'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      billingStatus === 'CLEARED' ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span>Cleared</span>
                </div>
                <div
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 pointer-events-none transition ${
                    billingStatus === 'WITH_BALANCE'
                      ? 'bg-white text-rose-800 shadow-2xs font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      billingStatus === 'WITH_BALANCE' ? 'bg-rose-500' : 'bg-slate-300'
                    }`}
                  />
                  <span>With Balance</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Billing clearance is managed by the Accounting Office. Only accountants can modify payment records and clearance holds.
              </p>
            </div>

            {/* Unit Count, Curriculum & Billing Status Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Total Enrolled Units
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-slate-900">{totalUnits}.0</span>
                  <span className="text-xs text-slate-500">Units Total</span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {subjects.length} active subject{subjects.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Curriculum Status
                </span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      studentType === 'Regular'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {studentType} Load
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block pt-0.5">
                  {studentType === 'Regular'
                    ? 'Standard academic load'
                    : 'Custom subject assortment'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Billing Status
                </span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      billingStatus === 'CLEARED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {billingStatus === 'CLEARED' ? 'Cleared' : 'With Balance'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block pt-0.5">
                  {billingStatus === 'CLEARED' ? 'Permit ready' : 'Hold / Blocked'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBJECT LOAD */}
        {activeTab === 'subjects' && (
          <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
            {/* Header with year level preset quick sync */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {gradeYearLevel} Curriculum Presets
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                      studentType === 'Regular'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {studentType} Student
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {activeCurriculum.shortName} • {selectedSem === 'firstSem' ? '1st Sem' : '2nd Sem'} Standard Load: {presetUnitsForYear}.0 Units
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={selectedSem}
                  onChange={(e) =>
                    handleSemesterSwitch(e.target.value as 'firstSem' | 'secondSem')
                  }
                  className="rounded-md border border-slate-300 bg-white py-1 px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 cursor-pointer shadow-2xs"
                >
                  <option value="firstSem">1st Semester {getSemesterKey() === 'firstSem' ? '★ Active' : ''}</option>
                  <option value="secondSem">2nd Semester {getSemesterKey() === 'secondSem' ? '★ Active' : ''}</option>
                </select>

                <button
                  type="button"
                  onClick={handleApplyCurrentPresets}
                  className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-md transition cursor-pointer"
                >
                  Load {gradeYearLevel} Presets
                </button>
              </div>
            </div>

            {/* Add Subject from Catalog */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-medium text-slate-800 block">
                Assign Custom / Backlog Subject
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={subjectToAdd}
                  onChange={(e) => setSubjectToAdd(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="">-- Choose a subject from database to assign --</option>
                  {allAvailableSubjects.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.title} ({s.units}.0 Units • {s.type})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAddSubject(subjectToAdd)}
                  disabled={!subjectToAdd}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  Add Subject
                </button>
              </div>
            </div>

            {/* Current Subjects List */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-800">
                Enrolled Subjects ({subjects.length})
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {totalUnits}.0 Total Units
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
              {subjects.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No subjects enrolled yet. Use the dropdown or preset buttons to assign subjects.
                </div>
              ) : (
                subjects.map((s) => (
                  <div
                    key={s.code}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-slate-900">{s.code}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {s.type}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate" title={s.title}>
                        {s.title}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="font-mono text-slate-600 text-[11px] font-medium">
                        {s.units}.0 Units
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(s.code)}
                        className="text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-0.5 rounded hover:bg-rose-50 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RFID SMART CARD & SECURITY */}
        {activeTab === 'rfid' && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Pending Replacement Notice */}
            {previousReplacedUid && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Pending Card Replacement</p>
                  <p className="text-[11px] text-amber-800">
                    Old Card [<strong>{previousReplacedUid}</strong>] will be permanently replaced with new Card [<strong>{rfidUid}</strong>] upon clicking <strong>Save Changes</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Current Active RFID Card Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Contactless Smart Card UID</h4>
                  <p className="text-[11px] text-slate-500">Hardware identifier paired with student</p>
                </div>
                {rfidUid ? (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      isCardDisabled
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {isCardDisabled ? 'DISABLED' : 'ACTIVE'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-500">
                    UNASSIGNED
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={rfidUid}
                    onChange={(e) => setRfidUid(e.target.value.toUpperCase())}
                    placeholder="No Card Assigned (e.g. E4A28B10)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 pl-8"
                  />
                  <CreditCard size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplacingCard(!isReplacingCard);
                      setReplacementUid('');
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isReplacingCard
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <RefreshCw size={14} className={isReplacingCard ? 'animate-spin' : ''} />
                    <span>{isReplacingCard ? 'Cancel Replace' : 'Replace Card'}</span>
                  </button>

                  {rfidUid && (
                    <button
                      type="button"
                      onClick={handleUnpairCard}
                      title="Detaches current card"
                      className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-600 text-xs font-semibold transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable "Replace a Card" Option Box */}
            {isReplacingCard && (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <RefreshCw size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0B1B3D]">Replace Student RFID Card</h4>
                      <p className="text-[11px] text-slate-600">
                        Scan or enter a new replacement card. The current card [{rfidUid || 'None'}] will be invalidated.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Replacement Reason *
                    </label>
                    <select
                      value={replacementReason}
                      onChange={(e) => setReplacementReason(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                    >
                      <option value="Lost Card (Fee Settled / Endorsed)">Lost Card (Fee Settled / Endorsed)</option>
                      <option value="Damaged / Defective Physical Chip">Damaged / Defective Physical Chip</option>
                      <option value="Card Reissue / Upgrade">Card Reissue / Upgrade</option>
                      <option value="Incorrect Card Previously Assigned">Incorrect Card Previously Assigned</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        New Card UID *
                      </label>
                      <button
                        type="button"
                        onClick={handleSimulateScanNewCard}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} />
                        <span>Simulate Tap</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={replacementUid}
                        onChange={(e) => setReplacementUid(e.target.value.toUpperCase())}
                        placeholder="Tap card reader or type UID (e.g. 8A3F12C9)"
                        className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 pl-8 uppercase"
                        autoFocus
                      />
                      <CreditCard size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-blue-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplacingCard(false);
                      setReplacementUid('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCardReplacement}
                    disabled={!replacementUid.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 size={14} />
                    <span>Apply New Card</span>
                  </button>
                </div>
              </div>
            )}

            {/* Disable Card Toggle Box */}
            <div
              className={`p-4 rounded-xl border transition-colors ${
                isCardDisabled
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">
                    {isCardDisabled ? 'RFID Card Disabled' : 'Disable RFID Smart Card'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isCardDisabled
                      ? 'This student card is currently deactivated. The student will be blocked from tapping to print test permits at self-service kiosk terminals.'
                      : 'Deactivating this card will immediately prevent the student from using contactless kiosks until re-enabled.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isCardDisabled;
                    setIsCardDisabled(next);
                    if (next) {
                      toast.warning('Card marked as DISABLED. Student permit access suspended.');
                    } else {
                      toast.success('Card re-enabled successfully.');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                    isCardDisabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-2xs'
                  }`}
                >
                  {isCardDisabled ? 'Enable Card' : 'Disable Card'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
