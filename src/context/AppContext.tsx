import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  SubjectTelemetry, 
  ReconciliationRecord, 
  RECONCILIATION_LEDS
} from '../data/mockData';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';

export type UserRole = 'student' | 'coordinator' | 'teacher';

export interface UserProfile {
  uid?: string;
  fullName: string;
  rollNumber: string;
  classCode: string;
  email?: string;
  institution?: string;
  branch?: string;
  semester?: string;
  department?: string;
}

interface AppContextValue {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  isOnboarded: boolean;
  completeOnboarding: (role: UserRole, profileData?: Partial<UserProfile>) => void;
  resetOnboarding: () => void;
  
  // Firestore Live Batch & Timetable State
  selectedBatch: string;
  setSelectedBatch: (batchCode: string) => void;
  batchData: any;
  todayTimetable: any[];
  loadingBatchData: boolean;

  // Subjects state & math handlers
  subjects: SubjectTelemetry[];
  updateSubjectAttendance: (subjectId: string, deltaAttended: number, deltaTotal: number) => void;
  
  // Reconcile state & handlers
  reconciliationRecords: ReconciliationRecord[];
  submittedCorrectionIds: string[];
  submitCorrection: (recordId: string, reasonCategory: string, proofDoc?: string | null) => void;
  eventDayBypass: boolean;
  toggleEventDayBypass: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const LS_KEY_ONBOARDED = 'academicsync_isOnboarded';
const LS_KEY_ROLE = 'academicsync_userRole';
const LS_KEY_PROFILE = 'academicsync_userProfile';
const LS_KEY_RECON_SUBMISSIONS = 'academicsync_reconSubmissions';

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'User Account',
  rollNumber: '21CS045',
  classCode: 'CS-8849',
  institution: 'Apex Inst. of Tech',
  branch: 'Computer Science & Eng',
  semester: 'Sem VI',
  department: 'BCA'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Onboarding & User Role state
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY_ONBOARDED) === 'true';
    } catch {
      return false;
    }
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_ROLE);
      if (stored === 'teacher') return 'teacher';
      if (stored === 'coordinator' || stored === 'cr') return 'coordinator';
      return 'student';
    } catch {
      return 'student';
    }
  });

  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_PROFILE);
      return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Global Selected Batch State for cross-component synchronization
  const [selectedBatch, setSelectedBatchState] = useState<string>(() => {
    try {
      const storedProfile = localStorage.getItem(LS_KEY_PROFILE);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.classCode) return parsed.classCode;
      }
    } catch {}
    return 'CS-4051';
  });

  const setSelectedBatch = useCallback((batchCode: string) => {
    if (!batchCode) return;
    setSelectedBatchState(batchCode);
    setUserProfileState(prev => {
      const updated = { ...prev, classCode: batchCode };
      try {
        localStorage.setItem(LS_KEY_PROFILE, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Sync state dynamically with Firebase Auth & Firestore user records
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsOnboarded(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const role: UserRole = data.role === 'teacher' ? 'teacher' : data.role === 'coordinator' ? 'coordinator' : 'student';
            const profileClassCode = data.classCode || (role === 'teacher' ? 'CS-4051' : 'CS-8849');
            const profile: UserProfile = {
              uid: user.uid,
              fullName: data.name || data.fullName || user.displayName || 'User',
              rollNumber: data.rollNumber || (role === 'coordinator' ? 'COORDINATOR' : role === 'teacher' ? 'FACULTY' : '21CS045'),
              classCode: profileClassCode,
              email: user.email || data.email || '',
              institution: data.institution || 'Apex Inst. of Tech',
              branch: data.branch || 'Computer Science & Eng',
              semester: data.term || data.semester || 'Sem VI',
              department: data.department || (data.branch ? (data.branch.includes('BCA') ? 'BCA' : 'CSE') : 'BCA')
            };

            setUserRoleState(role);
            setUserProfileState(profile);
            setSelectedBatchState(profileClassCode);

            try {
              localStorage.setItem(LS_KEY_ONBOARDED, 'true');
              localStorage.setItem(LS_KEY_ROLE, role);
              localStorage.setItem(LS_KEY_PROFILE, JSON.stringify(profile));
            } catch {
              // noop
            }
          }
        } catch (err) {
          console.warn('[AppContext] Error fetching Firestore user record:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subjects & Loading state
  const [subjects, setSubjects] = useState<SubjectTelemetry[]>([]);
  const [loadingBatchData, setLoadingBatchData] = useState<boolean>(true);

  // Reconciliation records state
  const [reconciliationRecords, setReconciliationRecords] = useState<ReconciliationRecord[]>(RECONCILIATION_LEDS);
  const [submittedCorrectionIds, setSubmittedCorrectionIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_RECON_SUBMISSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [eventDayBypass, setEventDayBypass] = useState<boolean>(false);

  // Real-Time Firestore Batch & Timetable Sync
  const [batchData, setBatchData] = useState<any>(null);
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);

  useEffect(() => {
    const classCode = selectedBatch || userProfile.classCode || 'CS-4051';
    setLoadingBatchData(true);
    const batchDocRef = doc(db, "batches", classCode);

    const extractTodaySlots = (timetableData: any[]): any[] => {
      if (!timetableData || !Array.isArray(timetableData) || timetableData.length === 0) {
        return [];
      }

      const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDayIdx = new Date().getDay();
      const currentFull = daysFull[currentDayIdx].toLowerCase();
      const currentShort = daysShort[currentDayIdx].toLowerCase();

      // Case 1: Structured as Day objects [{ day: "Monday", slots: [...] }]
      const dayObj = timetableData.find((item: any) =>
        item && item.day && (item.day.toLowerCase() === currentFull || item.day.toLowerCase() === currentShort)
      );

      if (dayObj && Array.isArray(dayObj.slots)) {
        return dayObj.slots;
      }

      // Case 2: Structured as Flat slots [{ day: "Monday", time: "...", subject: "..." }]
      const flatSlots = timetableData.filter((item: any) =>
        item && item.day && (item.day.toLowerCase() === currentFull || item.day.toLowerCase() === currentShort)
      );

      if (flatSlots.length > 0) {
        return flatSlots;
      }

      // Ensure default status is strictly 'Upcoming' on page load / midnight reset
      return timetableData.map((s: any, idx: number) => ({
        ...s,
        id: s.id || `slot-${idx}`,
        status: s.status || 'Upcoming'
      }));
    };

    const unsubscribe = onSnapshot(batchDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBatchData(data);
        if (data.timetable && Array.isArray(data.timetable)) {
          const slots = extractTodaySlots(data.timetable);
          setTodayTimetable(slots);
        } else {
          setTodayTimetable([]);
        }

        // Dynamically map subjects from batchData if available
        const rawSubs = data.subjects || (Array.isArray(data.timetable) ? data.timetable.flatMap((d: any) => d.slots || []).filter((s: any) => s.code) : []);
        if (Array.isArray(rawSubs) && rawSubs.length > 0) {
          const uniqueMap = new Map<string, any>();
          rawSubs.forEach((s: any) => {
            const code = s.code || s.subjectCode;
            if (code && !uniqueMap.has(code)) {
              uniqueMap.set(code, s);
            }
          });
          const dynamicSubs: SubjectTelemetry[] = Array.from(uniqueMap.values()).map((s: any, idx: number) => {
            const code = s.code || s.subjectCode || `SUB-${idx + 1}`;
            const name = s.name || s.subject || s.subjectName || 'Class Subject';
            const faculty = s.faculty || 'Faculty Instructor';
            const attended = 0;
            const total = 0;
            const percentage = 100;
            const status = 'safe';
            return {
              id: code.toLowerCase().replace(/[^a-z0-9]/g, ''),
              code,
              name,
              credits: 4,
              faculty,
              attended,
              total,
              percentage,
              complianceThreshold: 75,
              status,
              actionableNote: 'No lectures conducted yet.',
              bufferHeadroom: 0
            };
          });
          if (dynamicSubs.length > 0) {
            setSubjects(dynamicSubs);
          }
        }
      } else {
        setBatchData(null);
        setTodayTimetable([]);
      }
      setLoadingBatchData(false);
    }, (err) => {
      console.warn("Firestore batch listener notice:", err);
      setTodayTimetable([]);
      setLoadingBatchData(false);
    });

    return () => unsubscribe();
  }, [selectedBatch, userProfile.classCode]);

  // Real-time Firestore Attendance Logs listener for mathematical counters sync
  useEffect(() => {
    const classCode = selectedBatch || userProfile.classCode || 'CS-4051';
    const logsRef = collection(db, `batches/${classCode}/attendanceLogs`);

    const unsubscribe = onSnapshot(logsRef, (snapshot: any) => {
      const logs: any[] = [];
      snapshot.forEach((docSnap: any) => logs.push({ id: docSnap.id, ...docSnap.data() }));

      setSubjects(prevSubjects => {
        if (!prevSubjects || prevSubjects.length === 0) return prevSubjects;

        return prevSubjects.map(sub => {
          const subCodeUpper = sub.code.toUpperCase();
          const subLogs = logs.filter(l => 
            (l.subjectCode && l.subjectCode.toUpperCase() === subCodeUpper) ||
            (l.subjectName && l.subjectName.toLowerCase().includes(sub.name.toLowerCase()))
          );

          const studentLogs = userRole === 'student' && userProfile.uid 
            ? subLogs.filter(l => l.studentUid === userProfile.uid || l.rollNumber === userProfile.rollNumber)
            : subLogs;

          const attendedCount = studentLogs.filter(l => l.status === 'PRESENT').length;
          const totalConducted = studentLogs.length > 0 ? studentLogs.length : (subLogs.length > 0 ? Array.from(new Set(subLogs.map(l => l.timestamp?.seconds || l.date || l.id))).length : 0);

          const percentage = totalConducted > 0 
            ? Number(((attendedCount / totalConducted) * 100).toFixed(1))
            : 100;

          const status = percentage >= 75 ? 'safe' : percentage >= 72 ? 'warning' : 'critical';

          return {
            ...sub,
            attended: attendedCount,
            total: totalConducted,
            percentage,
            status,
            actionableNote: totalConducted === 0 
              ? 'No lectures conducted yet.' 
              : status === 'safe' 
              ? 'Maintaining baseline compliance.' 
              : 'Attendance warning.',
            bufferHeadroom: Math.max(0, attendedCount - Math.ceil(0.75 * totalConducted))
          };
        });
      });
    }, (err: any) => {
      console.warn("Error listening to attendance logs:", err);
    });

    return () => unsubscribe();
  }, [selectedBatch, userProfile.classCode, userRole, userProfile.uid, userProfile.rollNumber]);

  // Persist role & profile
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_ROLE, userRole);
    } catch {
      // noop
    }
  }, [userRole]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_PROFILE, JSON.stringify(userProfile));
    } catch {
      // noop
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_RECON_SUBMISSIONS, JSON.stringify(submittedCorrectionIds));
    } catch {
      // noop
    }
  }, [submittedCorrectionIds]);

  const setUserRole = useCallback((role: UserRole) => {
    setUserRoleState(role);
  }, []);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    setUserProfileState(prev => {
      const updated = { ...prev, ...profile };
      if (profile.classCode) {
        setSelectedBatchState(profile.classCode);
      }
      return updated;
    });
  }, []);

  const completeOnboarding = useCallback((role: UserRole, profileData?: Partial<UserProfile>) => {
    try {
      localStorage.setItem(LS_KEY_ONBOARDED, 'true');
      localStorage.setItem(LS_KEY_ROLE, role);
    } catch {
      // noop
    }
    setIsOnboarded(true);
    setUserRoleState(role);
    if (profileData) {
      setUserProfileState(prev => ({ ...prev, ...profileData }));
      if (profileData.classCode) {
        setSelectedBatchState(profileData.classCode);
      }
    }
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY_ONBOARDED);
      localStorage.removeItem(LS_KEY_ROLE);
      localStorage.removeItem(LS_KEY_PROFILE);
    } catch {
      // noop
    }
    setIsOnboarded(false);
    setUserRoleState('student');
    setUserProfileState(DEFAULT_PROFILE);
    setSelectedBatchState('CS-4051');
  }, []);

  const updateSubjectAttendance = useCallback((subjectId: string, deltaAttended: number, deltaTotal: number) => {
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      const newAttended = Math.max(0, sub.attended + deltaAttended);
      const newTotal = Math.max(newAttended, sub.total + deltaTotal);
      const newPercentage = Number(((newAttended / newTotal) * 100).toFixed(1));
      const newStatus = newPercentage >= 75 ? 'safe' : newPercentage >= 72 ? 'warning' : 'critical';
      return {
        ...sub,
        attended: newAttended,
        total: newTotal,
        percentage: newPercentage,
        status: newStatus
      };
    }));
  }, []);

  const submitCorrection = useCallback((recordId: string, _reasonCategory: string, _proofDoc?: string | null) => {
    setSubmittedCorrectionIds(prev => Array.from(new Set([...prev, recordId])));
    setReconciliationRecords(prev => prev.map(rec => {
      if (rec.id !== recordId) return rec;
      return {
        ...rec,
        statusText: 'Correction Submitted • Pending Verification'
      };
    }));
  }, []);

  const toggleEventDayBypass = useCallback(() => {
    setEventDayBypass(prev => !prev);
  }, []);

  return (
    <AppContext.Provider value={{
      userRole,
      setUserRole,
      userProfile,
      updateUserProfile,
      isOnboarded,
      completeOnboarding,
      resetOnboarding,
      selectedBatch,
      setSelectedBatch,
      batchData,
      todayTimetable,
      loadingBatchData,
      subjects,
      updateSubjectAttendance,
      reconciliationRecords,
      submittedCorrectionIds,
      submitCorrection,
      eventDayBypass,
      toggleEventDayBypass
    }}>
      {children}
    </AppContext.Provider>
  );

};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
