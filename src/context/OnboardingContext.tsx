import React, { createContext, useContext, useState, useCallback } from 'react';

export type UserRole = 'student' | 'coordinator' | null;

export interface StudentProfile {
  fullName: string;
  rollNumber: string;
  classCode: string;
}

export interface CoordinatorProfile {
  institution: string;
  branch: string;
  semester: string;
}

export type CRProfile = CoordinatorProfile;

interface OnboardingContextValue {
  isOnboarded: boolean;
  userRole: UserRole;
  studentProfile: StudentProfile | null;
  coordinatorProfile: CoordinatorProfile | null;
  crProfile?: CoordinatorProfile | null; // legacy alias
  completeOnboarding: (role: 'student' | 'coordinator', profileData?: StudentProfile | CoordinatorProfile) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const LS_KEY_ONBOARDED = 'academicsync_isOnboarded';
const LS_KEY_ROLE = 'academicsync_userRole';
const LS_KEY_STUDENT = 'academicsync_studentProfile';
const LS_KEY_COORDINATOR = 'academicsync_coordinatorProfile';
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
      if (stored === 'student') return 'student';
      if (stored === 'coordinator' || stored === 'cr') return 'coordinator';
      return null;
    } catch {
      return null;
    }
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_STUDENT);
      return stored ? JSON.parse(stored) : { fullName: 'Gaurav Bisht', rollNumber: '21CS045', classCode: 'CS-8849' };
    } catch {
      return { fullName: 'Gaurav Bisht', rollNumber: '21CS045', classCode: 'CS-8849' };
    }
  });

  const [coordinatorProfile, setCoordinatorProfile] = useState<CoordinatorProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_COORDINATOR) || localStorage.getItem(LS_KEY_CR);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const completeOnboarding = useCallback((role: 'student' | 'coordinator', profileData?: StudentProfile | CoordinatorProfile) => {
    try {
      localStorage.setItem(LS_KEY_ONBOARDED, 'true');
      localStorage.setItem(LS_KEY_ROLE, role);
      if (role === 'student' && profileData) {
        localStorage.setItem(LS_KEY_STUDENT, JSON.stringify(profileData));
        setStudentProfile(profileData as StudentProfile);
      } else if (role === 'coordinator' && profileData) {
        localStorage.setItem(LS_KEY_COORDINATOR, JSON.stringify(profileData));
        setCoordinatorProfile(profileData as CoordinatorProfile);
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
      localStorage.removeItem(LS_KEY_COORDINATOR);
      localStorage.removeItem(LS_KEY_CR);
    } catch {
      // noop
    }
    setIsOnboarded(false);
    setUserRole(null);
    setStudentProfile(null);
    setCoordinatorProfile(null);
  }, []);

  return (
    <OnboardingContext.Provider value={{ 
      isOnboarded, 
      userRole, 
      studentProfile, 
      coordinatorProfile, 
      crProfile: coordinatorProfile,
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


