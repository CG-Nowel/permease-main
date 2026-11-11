import React, { useState, useEffect, useMemo, useRef } from 'react';
import { presetCurriculums, type ProgramCurriculum, type PresetSubject } from '../../../mock/presetCurriculum.ts';
import { useAcademicTerm } from '../../../store/AcademicTermContext.tsx';
import { toast } from 'sonner';

interface PresetCurriculumCardProps {
  currentYearLevel: string;
  currentProgram: string;
  selectedProgramId?: string;
  studentType?: 'Regular' | 'Irregular';
  onStudentTypeChange?: (type: 'Regular' | 'Irregular') => void;
  onApplyPreset?: (
    course: string,
    program: string,
    yearLevel: string,
    subjects?: PresetSubject[],
    studentType?: 'Regular' | 'Irregular'
  ) => void;
  onSubjectsChange?: (subjects: PresetSubject[]) => void;
}

interface DatabaseSubjectOption extends PresetSubject {
  programId: string;
  programShortName: string;
  course: string;
  yearLevel: string;
  semName: string;
}

// Compile all unique preset subjects across all programs from the database
const allDatabaseSubjects: DatabaseSubjectOption[] = [];
presetCurriculums.forEach((p) => {
  Object.entries(p.years).forEach(([year, sems]) => {
    sems.firstSem.forEach((s) => {
      allDatabaseSubjects.push({
        ...s,
        programId: p.id,
        programShortName: p.shortName,
        course: p.course,
        yearLevel: year,
        semName: '1st Sem',
      });
    });
    sems.secondSem.forEach((s) => {
      allDatabaseSubjects.push({
        ...s,
        programId: p.id,
        programShortName: p.shortName,
        course: p.course,
        yearLevel: year,
        semName: '2nd Sem',
      });
    });
  });
});

export const PresetCurriculumCard: React.FC<PresetCurriculumCardProps> = ({
  currentYearLevel,
  currentProgram,
  selectedProgramId: externalProgramId,
  studentType: externalStudentType,
  onStudentTypeChange,
  onApplyPreset: _onApplyPreset,
  onSubjectsChange,
}) => {
  const initialProgram =
    presetCurriculums.find(
      (c) =>
        (externalProgramId && c.id === externalProgramId) ||
        c.program.toLowerCase().includes(currentProgram.toLowerCase()) ||
        currentProgram.toLowerCase().includes(c.shortName.toLowerCase())
    ) || presetCurriculums[0];

  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    externalProgramId || initialProgram.id
  );
  const hasYearLevel = Boolean(
    currentYearLevel && ['1st Year', '2nd Year', '3rd Year', '4th Year'].includes(currentYearLevel)
  );
  const activeYear = hasYearLevel ? currentYearLevel : '';
  const { activeTerm, getSemesterKey } = useAcademicTerm();
  const [selectedSem, setSelectedSem] = useState<'firstSem' | 'secondSem'>(getSemesterKey());

  useEffect(() => {
    setSelectedSem(getSemesterKey());
  }, [activeTerm]);

  const [localStudentType, setLocalStudentType] = useState<'Regular' | 'Irregular'>(
    externalStudentType || 'Regular'
  );
  const activeStudentType = externalStudentType || localStudentType;
  const isIrregular = activeStudentType === 'Irregular';

  const [removedSubjectsMap, setRemovedSubjectsMap] = useState<Record<string, string[]>>({});
  const currentPresetKey = `${selectedProgramId}_${activeYear}_${selectedSem}`;
  const removedCodes = removedSubjectsMap[currentPresetKey] || [];

  const [irregularSubjects, setIrregularSubjects] = useState<PresetSubject[]>([]);
  const [selectedSubjectCodeToAdd, setSelectedSubjectCodeToAdd] = useState<string>('');

  useEffect(() => {
    if (externalStudentType) {
      setLocalStudentType(externalStudentType);
    }
  }, [externalStudentType]);

  useEffect(() => {
    if (externalProgramId) {
      setSelectedProgramId(externalProgramId);
    } else {
      const matched = presetCurriculums.find(
        (c) =>
          c.program.toLowerCase().includes(currentProgram.toLowerCase()) ||
          currentProgram.toLowerCase().includes(c.shortName.toLowerCase())
      );
      if (matched) {
        setSelectedProgramId(matched.id);
      }
    }
  }, [externalProgramId, currentProgram]);

  const activeCurriculum: ProgramCurriculum =
    presetCurriculums.find((c) => c.id === selectedProgramId) || presetCurriculums[0];

  const yearData = hasYearLevel && activeCurriculum.years[activeYear]
    ? activeCurriculum.years[activeYear]
    : null;

  const allCurriculumSubjects: PresetSubject[] = useMemo(() => {
    return yearData ? (selectedSem === 'firstSem' ? yearData.firstSem : yearData.secondSem) : [];
  }, [yearData, selectedSem]);

  const regularDisplayedSubjects = useMemo(() => {
    return allCurriculumSubjects.filter(
      (subject) => !removedCodes.includes(subject.code)
    );
  }, [allCurriculumSubjects, removedCodes]);

  const displayedSubjects = useMemo(() => {
    return !hasYearLevel ? [] : isIrregular ? irregularSubjects : regularDisplayedSubjects;
  }, [hasYearLevel, isIrregular, irregularSubjects, regularDisplayedSubjects]);

  const totalUnits = useMemo(() => {
    return displayedSubjects.reduce((sum, s) => sum + s.units, 0);
  }, [displayedSubjects]);

  const totalSubjectsCount = displayedSubjects.length;

  const prevSignatureRef = useRef<string>('');
  useEffect(() => {
    const signature = displayedSubjects.map((s) => `${s.code}-${s.units}`).join(',');
    if (onSubjectsChange && prevSignatureRef.current !== signature) {
      prevSignatureRef.current = signature;
      onSubjectsChange(displayedSubjects);
    }
  }, [displayedSubjects, onSubjectsChange]);

  const irregularEnrolledCodes = new Set(irregularSubjects.map((s) => s.code));

  const availableSubjectsForIrregular = allDatabaseSubjects.filter(
    (s, idx, self) =>
      !irregularEnrolledCodes.has(s.code) &&
      self.findIndex((other) => other.code === s.code && other.programId === s.programId) === idx
  );

  const handleStudentTypeToggle = (type: 'Regular' | 'Irregular') => {
    setLocalStudentType(type);
    if (onStudentTypeChange) {
      onStudentTypeChange(type);
    }
  };

  const handleAddIrregularSubject = (code: string) => {
    if (!code) return;
    const subjectToAdd = allDatabaseSubjects.find((s) => s.code === code);
    if (!subjectToAdd) return;

    setIrregularSubjects((prev) => [...prev, subjectToAdd]);
    toast.success(`Added ${subjectToAdd.code} (${subjectToAdd.title})`);
    setSelectedSubjectCodeToAdd('');
  };

  const handleRemoveIrregularSubject = (code: string) => {
    setIrregularSubjects((prev) => prev.filter((s) => s.code !== code));
    toast.info(`Removed ${code} from irregular load`);
  };

  const handleRemoveRegularSubject = (subject: PresetSubject) => {
    setRemovedSubjectsMap((prev) => ({
      ...prev,
      [currentPresetKey]: [...(prev[currentPresetKey] || []), subject.code],
    }));
    toast.success(`Removed ${subject.code}`, {
      action: {
        label: 'Undo',
        onClick: () => {
          setRemovedSubjectsMap((prev) => ({
            ...prev,
            [currentPresetKey]: (prev[currentPresetKey] || []).filter((c) => c !== subject.code),
          }));
        },
      },
    });
  };

  const handleRestoreAllRegular = () => {
    setRemovedSubjectsMap((prev) => ({
      ...prev,
      [currentPresetKey]: [],
    }));
    toast.info(`Restored standard curriculum presets for ${activeYear}`);
  };

  const getSubjectTypeBadge = (type: PresetSubject['type']) => {
    switch (type) {
      case 'Major':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Major</span>;
      case 'General Education':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">GE</span>;
      case 'Elective':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Elective</span>;
      case 'Institutional':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">PE / NSTP</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Clean Card Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Curriculum & Subject Presets
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {!hasYearLevel
              ? 'Select a year level to view curriculum and preset subjects'
              : isIrregular
              ? 'Custom subject load configuration for irregular student'
              : 'Pre-approved subjects based on course and year'}
          </p>
        </div>

        <span className="text-[11px] font-semibold text-[#1E40AF] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 shadow-2xs">
          A.Y. {activeTerm.academic_year} • {activeTerm.semester}
        </span>
      </div>

      {/* Student Classification Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-700">
          Student Classification
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleStudentTypeToggle('Regular')}
            className={`py-1.5 px-3 rounded-md transition text-center ${
              !isIrregular
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Regular Student
          </button>
          <button
            type="button"
            onClick={() => handleStudentTypeToggle('Irregular')}
            className={`py-1.5 px-3 rounded-md transition text-center ${
              isIrregular
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Irregular Student
          </button>
        </div>
      </div>

      {!hasYearLevel ? (
        /* Empty State: Awaiting Year Level Selection */
        <div className="py-12 px-4 rounded-lg border border-dashed border-slate-200 text-center space-y-2.5 bg-slate-50/50">
          <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">No Year Level Selected</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
              Please choose a year level from the academic placement dropdown to display the curriculum presets and subjects.
            </p>
          </div>
        </div>
      ) : isIrregular ? (
        /* Irregular Student View */
        <div className="space-y-3.5">
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <label className="block text-xs font-medium text-slate-700">
              Add Subject from Database
            </label>

            <select
              value={selectedSubjectCodeToAdd}
              onChange={(e) => handleAddIrregularSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            >
              <option value="">Select subject to add...</option>
              {presetCurriculums.map((prog) => {
                const subjectsForProg = availableSubjectsForIrregular.filter(
                  (s) => s.programId === prog.id
                );
                if (subjectsForProg.length === 0) return null;
                return (
                  <optgroup
                    key={prog.id}
                    label={`${prog.course} ${prog.program} (${prog.shortName})`}
                  >
                    {subjectsForProg.map((s) => (
                      <option key={`${prog.id}_${s.code}`} value={s.code}>
                        {s.code} - {s.title} ({s.units}.0 Units • {s.type})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500">
              Choose from pre-approved curricula to add to the student's study load.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span className="font-medium">Enrolled Subjects ({irregularSubjects.length})</span>
            <span className="font-semibold text-slate-900">{totalUnits}.0 Total Units</span>
          </div>

          <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-0.5">
            {irregularSubjects.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center space-y-1 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-600">No subjects added yet</p>
                <p className="text-[11px] text-slate-400">
                  Select subjects from the dropdown above to build the schedule.
                </p>
              </div>
            ) : (
              irregularSubjects.map((subject) => (
                <div
                  key={subject.code}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {subject.code}
                      </span>
                      {getSubjectTypeBadge(subject.type)}
                    </div>
                    <p className="text-xs text-slate-700 truncate" title={subject.title}>
                      {subject.title}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {subject.units}.0 Units
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIrregularSubject(subject.code)}
                      className="text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-0.5 rounded hover:bg-rose-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Regular Student View */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-800 border border-slate-200">
                {activeYear}
              </span>

              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSem('firstSem')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition ${
                    selectedSem === 'firstSem'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  1st Sem
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSem('secondSem')}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition ${
                    selectedSem === 'secondSem'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  2nd Sem
                </button>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600">
              <span className="font-medium">
                {totalSubjectsCount} Subjects • {totalUnits} Units
              </span>
            </div>
          </div>

          <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-0.5">
            {displayedSubjects.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                <p className="text-xs text-slate-500 font-medium">All subjects have been removed for this term.</p>
                <button
                  type="button"
                  onClick={handleRestoreAllRegular}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Restore Standard Curriculum
                </button>
              </div>
            ) : (
              displayedSubjects.map((subject) => (
                <div
                  key={subject.code}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {subject.code}
                      </span>
                      {getSubjectTypeBadge(subject.type)}
                    </div>
                    <p className="text-xs text-slate-700 truncate" title={subject.title}>
                      {subject.title}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {subject.units}.0 Units
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRegularSubject(subject)}
                      className="text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-0.5 rounded hover:bg-rose-50 transition"
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

      {/* Card Summary Footer (No Apply Button) */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="leading-tight truncate">
          {!hasYearLevel ? (
            <span className="text-slate-400 italic">No year level selected</span>
          ) : isIrregular ? (
            <span>Irregular • {irregularSubjects.length} subjects ({totalUnits} units)</span>
          ) : (
            <span>{activeCurriculum.shortName} • {activeYear} ({selectedSem === 'firstSem' ? '1st Sem' : '2nd Sem'})</span>
          )}
        </div>
        <span className="text-[10px] text-slate-400 font-medium shrink-0">
          {!hasYearLevel ? 'Awaiting selection' : 'Auto-synced'}
        </span>
      </div>
    </div>
  );
};
