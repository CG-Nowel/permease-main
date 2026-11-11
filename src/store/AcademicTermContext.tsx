import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api.ts';
import { API_ROUTES } from '../lib/constants.ts';
import { toast } from 'sonner';


export interface AcademicTerm {
  id: number;
  code: string;
  academic_year: string;
  semester: string;
  label: string;
  status: 'Active Term' | 'Previous' | 'Archived';
  is_active: boolean;
}

const DEFAULT_TERMS: AcademicTerm[] = [
  {
    id: 1,
    code: '2025-2026-2nd',
    academic_year: '2025–2026',
    semester: '2nd Sem',
    label: 'A.Y. 2025–2026 • 2nd Sem',
    status: 'Active Term',
    is_active: true,
  },
  {
    id: 2,
    code: '2025-2026-1st',
    academic_year: '2025–2026',
    semester: '1st Sem',
    label: 'A.Y. 2025–2026 • 1st Sem',
    status: 'Previous',
    is_active: false,
  },
  {
    id: 3,
    code: '2024-2025-summer',
    academic_year: '2024–2025',
    semester: 'Summer',
    label: 'A.Y. 2024–2025 • Summer',
    status: 'Archived',
    is_active: false,
  },
  {
    id: 4,
    code: '2024-2025-2nd',
    academic_year: '2024–2025',
    semester: '2nd Sem',
    label: 'A.Y. 2024–2025 • 2nd Sem',
    status: 'Archived',
    is_active: false,
  },
  {
    id: 5,
    code: '2024-2025-1st',
    academic_year: '2024–2025',
    semester: '1st Sem',
    label: 'A.Y. 2024–2025 • 1st Sem',
    status: 'Archived',
    is_active: false,
  },
];

interface AcademicTermContextType {
  terms: AcademicTerm[];
  activeTerm: AcademicTerm;
  isLoading: boolean;
  isUpdating: boolean;
  updateActiveTerm: (target: AcademicTerm | number | string) => Promise<boolean>;
  addAcademicTerm: (newTermData: {
    academic_year: string;
    semester: string;
    is_active?: boolean;
  }) => Promise<boolean>;
  getSemesterKey: () => 'firstSem' | 'secondSem';
}

const AcademicTermContext = createContext<AcademicTermContextType | undefined>(undefined);

const STORAGE_ACTIVE_KEY = 'permease_active_term';
const STORAGE_TERMS_KEY = 'permease_terms_list';

export const AcademicTermProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [terms, setTerms] = useState<AcademicTerm[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TERMS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TERMS;
  });

  const [activeTerm, setActiveTerm] = useState<AcademicTerm>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_TERMS.find((t) => t.is_active) || DEFAULT_TERMS[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync from backend on initial mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(API_ROUTES.ACADEMIC_TERMS.LIST);
        if (res.data && res.data.data) {
          const fetchedTerms: AcademicTerm[] = res.data.data;
          setTerms(fetchedTerms);
          localStorage.setItem(STORAGE_TERMS_KEY, JSON.stringify(fetchedTerms));

          const currentActive =
            res.data.active_term ||
            fetchedTerms.find((t) => t.is_active) ||
            fetchedTerms[0];

          if (currentActive) {
            setActiveTerm(currentActive);
            localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(currentActive));
          }
        }
      } catch (err) {
        console.warn('Could not sync academic terms from server, using local fallback:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  // Set active academic term across the system
  const updateActiveTerm = async (target: AcademicTerm | number | string): Promise<boolean> => {
    setIsUpdating(true);
    let targetTerm: AcademicTerm | undefined;

    if (typeof target === 'object' && target !== null) {
      targetTerm = target;
    } else if (typeof target === 'number') {
      targetTerm = terms.find((t) => t.id === target);
    } else {
      targetTerm = terms.find((t) => t.code === target || t.label === target);
    }

    if (!targetTerm) {
      toast.error('Selected academic term not found.');
      setIsUpdating(false);
      return false;
    }

    try {
      // Call backend API
      const res = await api.post(API_ROUTES.ACADEMIC_TERMS.SET_ACTIVE, {
        id: targetTerm.id,
        code: targetTerm.code,
        label: targetTerm.label,
      });

      if (res.data && res.data.success) {
        const updatedList: AcademicTerm[] = res.data.data || terms.map((t) => ({
          ...t,
          is_active: t.id === targetTerm!.id,
          status: t.id === targetTerm!.id ? 'Active Term' : (t.status === 'Active Term' ? 'Previous' : t.status),
        }));

        const freshActive: AcademicTerm = res.data.active_term || targetTerm;

        setTerms(updatedList);
        setActiveTerm(freshActive);

        localStorage.setItem(STORAGE_TERMS_KEY, JSON.stringify(updatedList));
        localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(freshActive));

        // Dispatch a custom event for any components outside the React tree
        window.dispatchEvent(
          new CustomEvent('permease:term-changed', {
            detail: freshActive,
          })
        );

        toast.success(`Active Term updated to ${freshActive.label}! System synchronized.`);
        return true;
      } else {
        throw new Error(res.data?.message || 'Server returned failure');
      }
    } catch (err: any) {
      console.error('Failed to update academic term on backend, applying local optimistic state:', err);

      // Optimistic fallback if backend is unreachable
      const updatedList: AcademicTerm[] = terms.map((t) => ({
        ...t,
        is_active: t.id === targetTerm!.id,
        status: (t.id === targetTerm!.id ? 'Active Term' : (t.is_active ? 'Previous' : 'Archived')) as any,
      }));

      const freshActive: AcademicTerm = {
        ...targetTerm,
        is_active: true,
        status: 'Active Term',
      };

      setTerms(updatedList);
      setActiveTerm(freshActive);

      localStorage.setItem(STORAGE_TERMS_KEY, JSON.stringify(updatedList));
      localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(freshActive));

      window.dispatchEvent(
        new CustomEvent('permease:term-changed', {
          detail: freshActive,
        })
      );

      toast.success(`Active Term updated to ${freshActive.label}!`);
      return true;
    } finally {
      setIsUpdating(false);
    }
  };

  // Create a new academic term / school year
  const addAcademicTerm = async (newTermData: {
    academic_year: string;
    semester: string;
    is_active?: boolean;
  }): Promise<boolean> => {
    setIsUpdating(true);
    const year = newTermData.academic_year.trim();
    const sem = newTermData.semester.trim();
    const makeActive = !!newTermData.is_active;

    const cleanYear = year.replace(/[–—\s]/g, '-');
    const semCode = sem.toLowerCase().replace(/\s+/g, '');
    const code = `${cleanYear}-${semCode}`;
    const label = `A.Y. ${year} • ${sem}`;

    // Check existing
    const exists = terms.some((t) => t.code === code || t.label.toLowerCase() === label.toLowerCase());
    if (exists) {
      toast.error(`Academic term "${label}" already exists.`);
      setIsUpdating(false);
      return false;
    }

    try {
      const res = await api.post(API_ROUTES.ACADEMIC_TERMS.CREATE, {
        academic_year: year,
        semester: sem,
        is_active: makeActive,
      });

      if (res.data && res.data.success) {
        const updatedList: AcademicTerm[] = res.data.data;
        const freshActive: AcademicTerm =
          res.data.active_term || (makeActive ? res.data.new_term : activeTerm);

        setTerms(updatedList);
        localStorage.setItem(STORAGE_TERMS_KEY, JSON.stringify(updatedList));

        if (makeActive) {
          setActiveTerm(freshActive);
          localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(freshActive));
          window.dispatchEvent(
            new CustomEvent('permease:term-changed', {
              detail: freshActive,
            })
          );
        }

        toast.success(`School Year "${label}" created successfully!`);
        return true;
      } else {
        throw new Error(res.data?.message || 'Server error creating term');
      }
    } catch (err: any) {
      console.warn('API create term failed, falling back to local optimistic state:', err);

      const newId = Math.max(...terms.map((t) => t.id), 0) + 1;
      const createdTerm: AcademicTerm = {
        id: newId,
        code,
        academic_year: year,
        semester: sem,
        label,
        status: makeActive ? 'Active Term' : 'Archived',
        is_active: makeActive,
      };

      const updatedList: AcademicTerm[] = makeActive
        ? [
            createdTerm,
            ...terms.map((t) => ({
              ...t,
              is_active: false,
              status: (t.is_active ? 'Previous' : t.status) as any,
            })),
          ]
        : [createdTerm, ...terms];

      setTerms(updatedList);
      localStorage.setItem(STORAGE_TERMS_KEY, JSON.stringify(updatedList));

      if (makeActive) {
        setActiveTerm(createdTerm);
        localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(createdTerm));
        window.dispatchEvent(
          new CustomEvent('permease:term-changed', {
            detail: createdTerm,
          })
        );
      }

      toast.success(`School Year "${label}" created successfully!`);
      return true;
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to return 'firstSem' or 'secondSem' key for curriculum preset lookups
  const getSemesterKey = (): 'firstSem' | 'secondSem' => {
    if (activeTerm.semester.toLowerCase().includes('2nd') || activeTerm.semester.toLowerCase().includes('second')) {
      return 'secondSem';
    }
    return 'firstSem';
  };

  return (
    <AcademicTermContext.Provider
      value={{
        terms,
        activeTerm,
        isLoading,
        isUpdating,
        updateActiveTerm,
        addAcademicTerm,
        getSemesterKey,
      }}
    >
      {children}
    </AcademicTermContext.Provider>
  );
};

export const useAcademicTerm = (): AcademicTermContextType => {
  const context = useContext(AcademicTermContext);
  if (!context) {
    throw new Error('useAcademicTerm must be used within an AcademicTermProvider');
  }
  return context;
};
