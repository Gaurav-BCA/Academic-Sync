import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'student' | 'coordinator' | 'teacher' | null;

export interface StudentProfile {
  uid?: string;
  email?: string;
  fullName: string;
  rollNumber: string;
  classCode: string;
}

export interface CoordinatorProfile {
  uid?: string;
  email?: string;
  fullName?: string;
  institution: string;
  branch: string;
  semester: string;
  term?: string;
  classCode?: string;
  department?: string;
}

export interface TeacherProfile {
  uid?: string;
  email?: string;
  fullName: string;
  department: string;
  classCode?: string;
}

export type CRProfile = CoordinatorProfile;

export interface OnboardingContextValue {
  isOnboarded: boolean;
  userRole: UserRole;
  authLoading: boolean;
  studentProfile: StudentProfile | null;
  coordinatorProfile: CoordinatorProfile | null;
  teacherProfile: TeacherProfile | null;
  crProfile?: CoordinatorProfile | null; // legacy alias
  completeOnboarding: (role: 'student' | 'coordinator' | 'teacher', profileData?: any) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const LS_KEY_ONBOARDED = 'academicsync_isOnboarded';
const LS_KEY_ROLE = 'academicsync_userRole';
const LS_KEY_STUDENT = 'academicsync_studentProfile';
const LS_KEY_COORDINATOR = 'academicsync_coordinatorProfile';
const LS_KEY_TEACHER = 'academicsync_teacherProfile';
const LS_KEY_CR = 'academicsync_crProfile';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authLoading, setAuthLoading] = useState<boolean>(true);

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
      if (stored === 'teacher') return 'teacher';
      if (stored === 'coordinator' || stored === 'cr') return 'coordinator';
      return null;
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

  const [coordinatorProfile, setCoordinatorProfile] = useState<CoordinatorProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_COORDINATOR) || localStorage.getItem(LS_KEY_CR);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_TEACHER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const wasOnboarded = localStorage.getItem(LS_KEY_ONBOARDED) === 'true';
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            const role: UserRole = data.role === 'teacher' ? 'teacher' : data.role === 'coordinator' ? 'coordinator' : 'student';
            const status = data.status || 'APPROVED';

            if (role === 'teacher' && status === 'PENDING_APPROVAL') {
              // Pending teacher account — block onboarding until coordinator approves
              setIsOnboarded(false);
              setUserRole(null);
            } else if (wasOnboarded) {
              setIsOnboarded(true);
              setUserRole(role);
              localStorage.setItem(LS_KEY_ONBOARDED, 'true');
              localStorage.setItem(LS_KEY_ROLE, role);

              if (role === 'student') {
                const profile: StudentProfile = {
                  uid: user.uid,
                  email: user.email || data.email || '',
                  fullName: data.name || data.fullName || 'Student',
                  rollNumber: data.rollNumber || '21CS045',
                  classCode: data.classCode || 'CS-8849'
                };
                setStudentProfile(profile);
                localStorage.setItem(LS_KEY_STUDENT, JSON.stringify(profile));
              } else if (role === 'teacher') {
                const profile: TeacherProfile = {
                  uid: user.uid,
                  email: user.email || data.email || '',
                  fullName: data.name || data.fullName || 'Faculty Member',
                  department: data.department || 'BCA',
                  classCode: data.classCode
                };
                setTeacherProfile(profile);
                localStorage.setItem(LS_KEY_TEACHER, JSON.stringify(profile));
              } else {
                const profile: CoordinatorProfile = {
                  uid: user.uid,
                  email: user.email || data.email || '',
                  fullName: data.name || data.fullName || 'Class Coordinator',
                  institution: data.institution || 'Apex Inst. of Tech',
                  branch: data.branch || 'Computer Science & Eng',
                  semester: data.term || data.semester || 'Sem VI',
                  term: data.term || data.semester || 'Sem VI',
                  classCode: data.classCode || 'CS-8849',
                  department: data.department || 'BCA'
                };
                setCoordinatorProfile(profile);
                localStorage.setItem(LS_KEY_COORDINATOR, JSON.stringify(profile));
              }
            }
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile on Auth state change:', err);
        } finally {
          setAuthLoading(false);
        }
      } else {
        setIsOnboarded(false);
        setUserRole(null);
        setStudentProfile(null);
        setCoordinatorProfile(null);
        setTeacherProfile(null);
        try {
          localStorage.removeItem(LS_KEY_ONBOARDED);
          localStorage.removeItem(LS_KEY_ROLE);
          localStorage.removeItem(LS_KEY_STUDENT);
          localStorage.removeItem(LS_KEY_COORDINATOR);
          localStorage.removeItem(LS_KEY_TEACHER);
          localStorage.removeItem(LS_KEY_CR);
        } catch {
          // noop
        }
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const completeOnboarding = useCallback((role: 'student' | 'coordinator' | 'teacher', profileData?: any) => {
    try {
      localStorage.setItem(LS_KEY_ONBOARDED, 'true');
      localStorage.setItem(LS_KEY_ROLE, role);
      if (role === 'student' && profileData) {
        localStorage.setItem(LS_KEY_STUDENT, JSON.stringify(profileData));
        setStudentProfile(profileData as StudentProfile);
      } else if (role === 'teacher' && profileData) {
        localStorage.setItem(LS_KEY_TEACHER, JSON.stringify(profileData));
        setTeacherProfile(profileData as TeacherProfile);
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
      localStorage.removeItem(LS_KEY_TEACHER);
      localStorage.removeItem(LS_KEY_CR);
    } catch {
      // noop
    }
    setIsOnboarded(false);
    setUserRole(null);
    setStudentProfile(null);
    setCoordinatorProfile(null);
    setTeacherProfile(null);
  }, []);

  return (
    <OnboardingContext.Provider value={{ 
      isOnboarded, 
      userRole, 
      authLoading,
      studentProfile, 
      coordinatorProfile, 
      teacherProfile,
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



