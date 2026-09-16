import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'student' | 'cr' | null;

export interface StudentProfile {
  fullName: string;
  rollNumber: string;
  classCode: string;
}

export interface CRProfile {
  institution: string;
  branch: string;
  semester: string;
}

interface OnboardingContextValue {
  isOnboarded: boolean;
  userRole: UserRole;
  studentProfile: StudentProfile | null;
  crProfile: CRProfile | null;
  completeOnboarding: (role: 'student' | 'cr', profileData?: StudentProfile | CRProfile) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const LS_KEY_ONBOARDED = 'academicsync_isOnboarded';
const LS_KEY_ROLE = 'academicsync_userRole';
const LS_KEY_STUDENT = 'academicsync_studentProfile';
const LS_KEY_CR = 'academicsync_crProfile';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY_ONBOARDED) === 'true';
    } catch {
      return false;
    }
  });

  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_ROLE);
      return stored === 'student' || stored === 'cr' ? stored : null;
    } catch {
      return null;
    }
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_STUDENT);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [crProfile, setCrProfile] = useState<CRProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_CR);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const completeOnboarding = useCallback((role: 'student' | 'cr', profileData?: StudentProfile | CRProfile) => {
    try {
      localStorage.setItem(LS_KEY_ONBOARDED, 'true');
      localStorage.setItem(LS_KEY_ROLE, role);
      if (role === 'student' && profileData) {
        localStorage.setItem(LS_KEY_STUDENT, JSON.stringify(profileData));
        setStudentProfile(profileData as StudentProfile);
      } else if (role === 'cr' && profileData) {
        localStorage.setItem(LS_KEY_CR, JSON.stringify(profileData));
        setCrProfile(profileData as CRProfile);
      }
    } catch {
      // localStorage unavailable — still update in-memory state
    }
    setIsOnboarded(true);
    setUserRole(role);
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY_ONBOARDED);
      localStorage.removeItem(LS_KEY_ROLE);
      localStorage.removeItem(LS_KEY_STUDENT);
      localStorage.removeItem(LS_KEY_CR);
    } catch {
      // noop
    }
    setIsOnboarded(false);
    setUserRole(null);
    setStudentProfile(null);
    setCrProfile(null);
  }, []);

  return (
    <OnboardingContext.Provider value={{ 
      isOnboarded, 
      userRole, 
      studentProfile, 
      crProfile, 
      completeOnboarding, 
      resetOnboarding 
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}

