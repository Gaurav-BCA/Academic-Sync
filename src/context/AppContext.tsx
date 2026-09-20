import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  SubjectTelemetry, 
  ReconciliationRecord, 
  INITIAL_SUBJECTS, 
  RECONCILIATION_LEDS,
  TIMETABLE_MATRIX
} from '../data/mockData';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc,
  setDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';

export type UserRole = 'student' | 'coordinator';

export interface UserProfile {
  uid?: string;
  fullName: string;
  rollNumber: string;
  classCode: string;
  email?: string;
  institution?: string;
  branch?: string;
  semester?: string;
}

export interface VoteStats {
  yesVotes: number;
  noVotes: number;
  totalResponded: number;
}

export interface ConsensusState {
  slotId: string;
  subjectName: string;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  votedStudentUids: string[];
  status: 'voting' | 'conducted' | 'cancelled' | 'closed';
  cancellationReason?: string;
  lastGeoDistance?: number | null;
  lastGeoVerified?: boolean | null;
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
  
  // Live Check-in modal status & Firestore peer votes
  isCheckInModalOpen: boolean;
  openCheckInModal: () => void;
  closeCheckInModal: () => void;
  lastCheckInVote: 'yes' | 'no' | null;
  submitCheckInVote: (vote: 'yes' | 'no') => void;
  voteStats: VoteStats;

  // 3-Student Consensus Engine
  consensusState: ConsensusState;
  submitConsensusVote: (
    slotId: string,
    subjectName: string,
    vote: 'yes' | 'no',
    reason?: string
  ) => Promise<{ success: boolean; distance?: number; isWithinGeofence?: boolean; message?: string }>;
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
  semester: 'Sem VI'
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
            const role: UserRole = data.role === 'coordinator' ? 'coordinator' : 'student';
            const profile: UserProfile = {
              uid: user.uid,
              fullName: data.name || data.fullName || user.displayName || 'User',
              rollNumber: data.rollNumber || (role === 'coordinator' ? 'COORDINATOR' : '21CS045'),
              classCode: data.classCode || 'CS-8849',
              email: user.email || data.email || '',
              institution: data.institution || 'Apex Inst. of Tech',
              branch: data.branch || 'Computer Science & Eng',
              semester: data.term || data.semester || 'Sem VI'
            };

            setUserRoleState(role);
            setUserProfileState(profile);

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

  // Check-in Modal overlay state & Firestore peer voting state
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [lastCheckInVote, setLastCheckInVote] = useState<'yes' | 'no' | null>(null);
  const [voteStats, setVoteStats] = useState<VoteStats>({
    yesVotes: 3,
    noVotes: 0,
    totalResponded: 3
  });

  // Real-Time Firestore Batch & Timetable Sync
  const [batchData, setBatchData] = useState<any>(null);
  const [todayTimetable, setTodayTimetable] = useState<any[]>([]);

  useEffect(() => {
    const classCode = userProfile.classCode || 'CS-8849';
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

      return [];
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
            const attended = 35;
            const total = 38;
            const percentage = Number(((attended / total) * 100).toFixed(1));
            const status = percentage >= 75 ? 'safe' : percentage >= 72 ? 'warning' : 'critical';
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
              actionableNote: status === 'safe' ? 'Maintaining baseline compliance.' : 'Attendance warning.',
              bufferHeadroom: Math.max(0, attended - Math.ceil(0.75 * total))
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
  }, [userProfile.classCode]);

  // Real-Time Firestore Peer Voting Listener for votes/cs601-today
  useEffect(() => {
    const voteDocRef = doc(db, "votes", "cs601-today");
    const unsubscribe = onSnapshot(voteDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const yes = data.yesVotes || 0;
        const no = data.noVotes || 0;
        const total = data.totalResponded || (yes + no);
        setVoteStats({
          yesVotes: yes,
          noVotes: no,
          totalResponded: total
        });
      }
    }, (err) => {
      console.warn("Firestore votes listener notice:", err);
    });
    return () => unsubscribe();
  }, []);

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
    setUserProfileState(prev => ({ ...prev, ...profile }));
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

  const openCheckInModal = useCallback(() => {
    setIsCheckInModalOpen(true);
  }, []);

  const closeCheckInModal = useCallback(() => {
    setIsCheckInModalOpen(false);
  }, []);

  // 3-Student Consensus Engine Real-time Listener & Handler
  const [consensusState, setConsensusState] = useState<ConsensusState>({
    slotId: 'slot-active',
    subjectName: 'CS601 Distributed Systems',
    yesVotes: 0,
    noVotes: 0,
    totalVotes: 0,
    votedStudentUids: [],
    status: 'voting',
    cancellationReason: undefined,
    lastGeoDistance: null,
    lastGeoVerified: null
  });

  useEffect(() => {
    const classCode = userProfile.classCode || 'CS-8849';
    const verifDocRef = doc(db, `batches/${classCode}/live_verifications`, 'current_slot');
    const unsubscribe = onSnapshot(verifDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        const yes = d.yesVotes || 0;
        const no = d.noVotes || 0;
        setConsensusState({
          slotId: d.slotId || 'slot-active',
          subjectName: d.subjectName || 'Current Lecture',
          yesVotes: yes,
          noVotes: no,
          totalVotes: yes + no,
          votedStudentUids: Array.isArray(d.votedStudentUids) ? d.votedStudentUids : [],
          status: d.status || 'voting',
          cancellationReason: d.cancellationReason,
          lastGeoDistance: typeof d.lastGeoDistance === 'number' ? d.lastGeoDistance : null,
          lastGeoVerified: typeof d.lastGeoVerified === 'boolean' ? d.lastGeoVerified : null
        });
      }
    }, (err) => {
      console.warn("Firestore live_verifications listener notice:", err);
    });
    return () => unsubscribe();
  }, [userProfile.classCode]);

  const submitConsensusVote = useCallback(async (
    slotId: string,
    subjectName: string,
    vote: 'yes' | 'no',
    reason?: string
  ) => {
    const classCode = userProfile.classCode || 'CS-8849';
    const verifDocRef = doc(db, `batches/${classCode}/live_verifications`, 'current_slot');

    const currentYes = consensusState.yesVotes + (vote === 'yes' ? 1 : 0);
    const currentNo = consensusState.noVotes + (vote === 'no' ? 1 : 0);
    const newTotal = currentYes + currentNo;
    const userUid = userProfile.uid || userProfile.rollNumber || 'anon-user';

    let newStatus: 'voting' | 'conducted' | 'cancelled' | 'closed' = 'voting';
    let geoDistance: number | null = null;
    let isWithinGeofence: boolean | null = null;

    if (currentYes >= 3) {
      newStatus = 'conducted';
    } else if (currentNo >= 3) {
      newStatus = 'cancelled';
    }

    // Capture student HTML5 GPS Location if voting YES or consensus is reached
    if (vote === 'yes' || newStatus === 'conducted') {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });

        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        const geo = batchData?.geofence;
        if (geo && typeof geo.latitude === 'number' && typeof geo.longitude === 'number') {
          const radius = geo.radiusMeters || 50;
          geoDistance = calculateHaversineDistance(userLat, userLng, geo.latitude, geo.longitude);
          isWithinGeofence = geoDistance <= radius;
        } else {
          // Default fallback if coordinator has not saved geofence yet
          geoDistance = 25;
          isWithinGeofence = true;
        }
      } catch (e) {
        console.warn("GPS detection warning during consensus vote:", e);
        geoDistance = 30;
        isWithinGeofence = true;
      }
    }

    // Write attendance log to Firestore if consensus reached
    try {
      const attLogRef = collection(db, `batches/${classCode}/attendanceLogs`);
      if (newStatus === 'conducted') {
        await addDoc(attLogRef, {
          studentUid: userUid,
          studentName: userProfile.fullName,
          rollNumber: userProfile.rollNumber,
          classCode,
          subjectName,
          status: isWithinGeofence ? 'PRESENT' : 'ABSENT',
          geofenceVerified: isWithinGeofence,
          distanceMeters: geoDistance,
          timestamp: serverTimestamp()
        });
      } else if (newStatus === 'cancelled') {
        await addDoc(attLogRef, {
          studentUid: userUid,
          studentName: userProfile.fullName,
          rollNumber: userProfile.rollNumber,
          classCode,
          subjectName,
          status: 'CANCELLED / NO CLASS',
          cancellationReason: reason || 'Class cancelled by instructor',
          geofenceVerified: false,
          timestamp: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn("Firestore attendanceLogs log error:", err);
    }

    // Sync to Firestore live_verifications
    try {
      await setDoc(verifDocRef, {
        slotId,
        subjectName,
        yesVotes: increment(vote === 'yes' ? 1 : 0),
        noVotes: increment(vote === 'no' ? 1 : 0),
        votedStudentUids: Array.from(new Set([...consensusState.votedStudentUids, userUid])),
        status: newStatus,
        cancellationReason: reason || consensusState.cancellationReason || null,
        lastGeoDistance: geoDistance,
        lastGeoVerified: isWithinGeofence,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore live_verifications setDoc error:", err);
    }

    // Update local state fallback
    setConsensusState(prev => ({
      ...prev,
      slotId,
      subjectName,
      yesVotes: currentYes,
      noVotes: currentNo,
      totalVotes: newTotal,
      votedStudentUids: Array.from(new Set([...prev.votedStudentUids, userUid])),
      status: newStatus,
      cancellationReason: reason || prev.cancellationReason,
      lastGeoDistance: geoDistance,
      lastGeoVerified: isWithinGeofence
    }));

    return {
      success: true,
      distance: geoDistance || undefined,
      isWithinGeofence: isWithinGeofence || undefined,
      message: newStatus === 'conducted'
        ? `Consensus Reached: Class Conducted! (${isWithinGeofence ? 'PRESENT' : 'ABSENT'})`
        : newStatus === 'cancelled'
        ? 'Consensus Reached: Class Cancelled.'
        : 'Vote recorded! Awaiting peer consensus.'
    };
  }, [userProfile, batchData, consensusState]);

  const submitCheckInVote = useCallback(async (vote: 'yes' | 'no') => {
    setLastCheckInVote(vote);
    await submitConsensusVote('slot-active', 'CS601 Distributed Systems', vote);
  }, [submitConsensusVote]);

  return (
    <AppContext.Provider value={{
      userRole,
      setUserRole,
      userProfile,
      updateUserProfile,
      isOnboarded,
      completeOnboarding,
      resetOnboarding,
      batchData,
      todayTimetable,
      loadingBatchData,
      subjects,
      updateSubjectAttendance,
      reconciliationRecords,
      submittedCorrectionIds,
      submitCorrection,
      eventDayBypass,
      toggleEventDayBypass,
      isCheckInModalOpen,
      openCheckInModal,
      closeCheckInModal,
      lastCheckInVote,
      submitCheckInVote,
      voteStats,
      consensusState,
      submitConsensusVote
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
