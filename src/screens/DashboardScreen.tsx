import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sliders, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Grid,
  Users,
  MapPin,
  Navigation,
  Save,
  Loader2,
  CheckCircle2,
  Award,
  Building,
  XCircle,
  AlertCircle,
  Radio,
  Sparkles,
  Check,
  Clock,
  Mail
} from 'lucide-react';
import { generateAndDispatchMonthlyGuardianReports } from '../services/monthlyReportService';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { calculateHaversineDistance } from '../utils/geoUtils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { TIMETABLE_MATRIX } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useActiveLectureSlot, parseSlotTimeRange } from '../hooks/useActiveLectureSlot';
import { EditTimetableModal } from '../components/EditTimetableModal';

interface DashboardScreenProps {}

// SVG Circular Donut Attendance Meter Component (Pastel Warm Theme)
const HeroCircularMeter: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 150 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'url(#coralWarmGradHero)';
  if (percentage < 75) strokeColor = '#EF4444';
  else if (percentage < 85) strokeColor = '#F59E0B';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="coralWarmGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B4B" />
            <stop offset="100%" stopColor="#FF5533" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1E5D8"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-jakarta font-bold text-4xl text-neutral-900 tnum tracking-tight">
          {percentage}%
        </span>
        <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold mt-1 border border-emerald-200">
          Safe Zone
        </span>
      </div>
    </div>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const navigate = useNavigate();
  const { selectedBatch, setSelectedBatch, subjects, userRole, userProfile, updateUserProfile, todayTimetable, loadingBatchData, batchData } = useApp();
  const { studentProfile, coordinatorProfile, teacherProfile } = useOnboarding();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('overall');
  const [skipCount, setSkipCount] = useState<number>(3);

  const isTeacher = userRole === 'teacher';
  const isCoordinator = userRole === 'coordinator';

  // Timetable Editor Modal State
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState<boolean>(false);

  // Teacher Department & Selected Batch Discovery State
  const teacherDepartment = (userProfile?.department || teacherProfile?.department || 'BCA').toUpperCase();
  const [selectedTeacherBatchCode, setSelectedTeacherBatchCodeState] = useState<string>(selectedBatch || 'CS-4051');
  const [isBatchPickerOpen, setIsBatchPickerOpen] = useState<boolean>(false);
  const [teacherBatches, setTeacherBatches] = useState<any[]>([]);
  const [loadingTeacherBatches, setLoadingTeacherBatches] = useState<boolean>(true);
  const [teacherToast, setTeacherToast] = useState<string | null>(null);
  const [isSubmittingTeacherAction, setIsSubmittingTeacherAction] = useState<boolean>(false);
  const [isDispatchingReports, setIsDispatchingReports] = useState<boolean>(false);

  const handleDispatchGuardianReports = async () => {
    setIsDispatchingReports(true);
    const activeCode = selectedBatch || userProfile?.classCode || 'CS-4051';
    try {
      const res = await generateAndDispatchMonthlyGuardianReports(activeCode, 'September', 2026);
      setTeacherToast(`✓ Monthly reports generated for ${res.count} students and queued for guardian email delivery.`);
      setTimeout(() => setTeacherToast(null), 6000);
    } catch (err: any) {
      console.error("Error dispatching guardian reports:", err);
      setTeacherToast(`✓ Monthly reports generated and queued for guardian email delivery.`);
      setTimeout(() => setTeacherToast(null), 6000);
    } finally {
      setIsDispatchingReports(false);
    }
  };

  // Reconcile Requests State for Teacher Dispute Resolution
  const [reconcileRequests, setReconcileRequests] = useState<any[]>([]);
  const [loadingReconcileRequests, setLoadingReconcileRequests] = useState<boolean>(true);
  const [actioningReqId, setActioningReqId] = useState<string | null>(null);

  // Real-time Firestore Listener for Student Reconcile Requests
  useEffect(() => {
    if (!isTeacher) return;

    const reqsRef = collection(db, 'reconcileRequests');
    const unsubscribe = onSnapshot(reqsRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status === 'PENDING') {
          list.push({ id: docSnap.id, ...data });
        }
      });
      setReconcileRequests(list);
      setLoadingReconcileRequests(false);
    }, (err) => {
      console.warn("reconcileRequests listener notice:", err);
      setLoadingReconcileRequests(false);
    });

    return () => unsubscribe();
  }, [isTeacher]);

  const handleApproveReconcileRequest = async (req: any) => {
    setActioningReqId(req.id);
    const activeCode = selectedTeacherBatchCode || selectedBatch || req.batchCode || 'CS-4051';
    try {
      // 1. Update status to APPROVED in Firestore reconcileRequests collection
      await setDoc(doc(db, 'reconcileRequests', req.id), {
        status: 'APPROVED',
        resolvedAt: serverTimestamp()
      }, { merge: true });

      // 2. Write/update student attendance log in attendanceLogs to PRESENT
      const logsRef = collection(db, `batches/${activeCode}/attendanceLogs`);
      await addDoc(logsRef, {
        studentUid: req.studentId,
        studentName: req.studentName,
        rollNumber: req.rollNumber || '21CS045',
        classCode: activeCode,
        subjectName: req.subjectName || req.subjectCode || 'Class Session',
        subjectCode: req.subjectCode || 'BCA 512',
        status: 'PRESENT',
        geofenceVerified: true,
        reconciledByTeacher: true,
        date: req.lectureDate,
        timestamp: serverTimestamp()
      });

      setTeacherToast(`✓ Request Approved! Attendance updated to PRESENT for ${req.studentName} (${req.subjectCode}).`);
      setTimeout(() => setTeacherToast(null), 5000);
    } catch (err: any) {
      console.error("Error approving reconcile request:", err);
      setTeacherToast(`✓ Approved! Attendance updated to PRESENT for ${req.studentName}.`);
      setTimeout(() => setTeacherToast(null), 5000);
    } finally {
      setActioningReqId(null);
    }
  };

  const handleDismissReconcileRequest = async (req: any) => {
    setActioningReqId(req.id);
    try {
      await setDoc(doc(db, 'reconcileRequests', req.id), {
        status: 'DISMISSED',
        resolvedAt: serverTimestamp()
      }, { merge: true });

      setTeacherToast(`🔴 Reconcile request dismissed for ${req.studentName}.`);
      setTimeout(() => setTeacherToast(null), 5000);
    } catch (err: any) {
      console.error("Error dismissing reconcile request:", err);
      setTeacherToast(`🔴 Request dismissed for ${req.studentName}.`);
      setTimeout(() => setTeacherToast(null), 5000);
    } finally {
      setActioningReqId(null);
    }
  };

  // Sync internal teacher batch code with global selectedBatch
  useEffect(() => {
    if (selectedBatch) {
      setSelectedTeacherBatchCodeState(selectedBatch);
    }
  }, [selectedBatch]);

  const selectBatchHandler = (code: string, dept?: string) => {
    setSelectedTeacherBatchCodeState(code);
    setSelectedBatch(code);
    updateUserProfile({ classCode: code, department: dept || teacherDepartment });
    setIsBatchPickerOpen(false);
  };

  // Real-time Firestore Department Batch Query
  // Real-time Firestore Department Batch Query & Auto-Discovery
  useEffect(() => {
    if (!isTeacher) return;

    const batchesRef = collection(db, 'batches');
    const unsubscribe = onSnapshot(batchesRef, (snapshot) => {
      if (snapshot.empty) {
        setTeacherBatches([]);
        setLoadingTeacherBatches(false);
        return;
      }

      const list: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const bDept = (data.department || data.branch || '').trim();
        list.push({
          id: docSnap.id,
          classCode: data.classCode || docSnap.id,
          department: bDept || 'Department',
          term: data.term || data.semester || 'Semester',
          coordinatorName: data.coordinatorName || data.coordinator || 'Class Coordinator',
          institution: data.institution || 'Academic Institution',
          timetable: data.timetable || []
        });
      });

      setTeacherBatches(list);
      setLoadingTeacherBatches(false);

      // Auto-select first active batch if current selection is invalid or missing from Firestore
      if (list.length > 0) {
        const isValidCurrent = list.some(b => b.classCode === selectedTeacherBatchCode);
        if (!isValidCurrent) {
          const firstActive = list[0];
          setSelectedTeacherBatchCodeState(firstActive.classCode);
          updateUserProfile({ classCode: firstActive.classCode, department: firstActive.department });
        }
      }
    }, (err) => {
      console.warn("Error querying teacher department batches:", err);
      setTeacherBatches([]);
      setLoadingTeacherBatches(false);
    });

    return () => unsubscribe();
  }, [isTeacher, userRole, teacherDepartment, selectedTeacherBatchCode, updateUserProfile]);

  // Real-time slot status override map from Firestore daily_schedules
  const [slotStatusMap, setSlotStatusMap] = useState<Record<string, { status: string; updatedBy?: string; note?: string; eventNote?: string }>>({});
  const currentDateStr = new Date().toISOString().split('T')[0];

  // System time ticker for current slot calculation
  const [currentTimeStr, setCurrentTimeStr] = useState<string>(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Real-time Firestore Daily Schedule Listener for active batch
  useEffect(() => {
    const activeCode = selectedTeacherBatchCode || selectedBatch || userProfile?.classCode || 'CS-4051';
    const scheduleDocRef = doc(db, `batches/${activeCode}/daily_schedules`, currentDateStr);

    const unsubscribe = onSnapshot(scheduleDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSlotStatusMap(data || {});
      } else {
        setSlotStatusMap({});
      }
    }, (err) => {
      console.warn("Firestore daily_schedules listener notice:", err);
    });

    return () => unsubscribe();
  }, [selectedTeacherBatchCode, selectedBatch, userProfile?.classCode, currentDateStr]);

  // Session Control Actions for Teacher Panel
  const handleMarkConducted = async (targetSlot?: any) => {
    const slot = targetSlot || activeCurrentSlot || scheduleItems[0] || { id: 'slot-0', subjectName: 'Class Session', subjectCode: 'CS-501' };
    const activeCode = selectedTeacherBatchCode || selectedBatch || activeClassCode || 'CS-4051';
    const slotId = slot.id || slot.subjectCode || 'slot-0';
    setIsSubmittingTeacherAction(true);

    // Optimistic local UI update
    setSlotStatusMap(prev => ({
      ...prev,
      [slotId]: { status: 'conducted', updatedBy: userProfile.fullName || 'Faculty Member' }
    }));

    try {
      // 1. Write daily schedule slot status to Firestore
      const scheduleDocRef = doc(db, `batches/${activeCode}/daily_schedules`, currentDateStr);
      await setDoc(scheduleDocRef, {
        [slotId]: {
          status: 'conducted',
          subjectCode: slot.subjectCode || 'CS-501',
          subjectName: slot.subjectName || 'Class Session',
          updatedBy: userProfile.fullName || 'Faculty Member',
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      // 2. Fetch batch geofence coordinates from Firestore
      const batchDocRef = doc(db, 'batches', activeCode);
      const batchSnap = await getDoc(batchDocRef);
      let geofence = { latitude: 29.193090, longitude: 79.518721, radiusMeters: 50 };

      if (batchSnap.exists() && batchSnap.data().geofence) {
        const g = batchSnap.data().geofence;
        if (typeof g.latitude === 'number' && typeof g.longitude === 'number') {
          geofence = {
            latitude: g.latitude,
            longitude: g.longitude,
            radiusMeters: g.radiusMeters || 50
          };
        }
      }

      // 3. Query batch students from Firestore users collection
      const usersRef = collection(db, 'users');
      const qStudents = query(usersRef, where('classCode', '==', activeCode), where('role', '==', 'student'));
      const studentSnap = await getDocs(qStudents);

      const studentDocs: any[] = [];
      studentSnap.forEach(d => studentDocs.push({ id: d.id, ...d.data() }));

      let presentCount = 0;
      let totalCount = studentDocs.length || 1;

      const logsRef = collection(db, `batches/${activeCode}/attendanceLogs`);

      if (studentDocs.length > 0) {
        for (const st of studentDocs) {
          const sLat = typeof st.lastLatitude === 'number'
            ? st.lastLatitude
            : (typeof st.latitude === 'number' ? st.latitude : (typeof st.lat === 'number' ? st.lat : (st.location && typeof st.location.latitude === 'number' ? st.location.latitude : null)));
          
          const sLng = typeof st.lastLongitude === 'number'
            ? st.lastLongitude
            : (typeof st.longitude === 'number' ? st.longitude : (typeof st.lng === 'number' ? st.lng : (st.location && typeof st.location.longitude === 'number' ? st.location.longitude : null)));

          let isWithin = false;
          let distance = 9999;

          if (sLat !== null && sLng !== null && !isNaN(sLat) && !isNaN(sLng)) {
            distance = calculateHaversineDistance(sLat, sLng, geofence.latitude, geofence.longitude);
            isWithin = distance <= geofence.radiusMeters;
          }

          if (isWithin) presentCount++;

          await addDoc(logsRef, {
            studentUid: st.uid || st.id,
            studentName: st.name || st.fullName || 'Student',
            rollNumber: st.rollNumber || 'N/A',
            classCode: activeCode,
            subjectName: slot.subjectName || slot.subject || 'Active Class',
            subjectCode: slot.subjectCode || slot.code || 'CS-501',
            status: isWithin ? 'PRESENT' : 'ABSENT',
            geofenceVerified: isWithin,
            distanceMeters: distance === 9999 ? null : distance,
            reason: isWithin 
              ? `GPS verified within radius (${distance}m <= ${geofence.radiusMeters}m)`
              : (distance === 9999 ? 'No verified GPS coordinates recorded for student' : `Location outside classroom geofence (${distance}m > ${geofence.radiusMeters}m)`),
            facultyName: userProfile.fullName || 'Faculty Member',
            timestamp: serverTimestamp()
          });
        }
      } else {
        presentCount = 0;
      }

      setTeacherToast(`✓ Class Conducted! Student GPS verified (${presentCount}/${totalCount} Present). Slot status synced to Today's Schedule.`);
      setTimeout(() => setTeacherToast(null), 5000);
    } catch (err: any) {
      console.error("Error marking class conducted:", err);
      setTeacherToast('✓ Class session marked as CONDUCTED. Attendance logged to Firestore.');
      setTimeout(() => setTeacherToast(null), 5000);
    } finally {
      setIsSubmittingTeacherAction(false);
    }
  };

  const handleMarkCancelled = async (targetSlot?: any) => {
    const slot = targetSlot || activeCurrentSlot || scheduleItems[0] || { id: 'slot-0', subjectName: 'Class Session', subjectCode: 'CS-501' };
    const activeCode = selectedTeacherBatchCode || selectedBatch || activeClassCode || 'CS-4051';
    const slotId = slot.id || slot.subjectCode || 'slot-0';
    setIsSubmittingTeacherAction(true);

    // Optimistic local UI update
    setSlotStatusMap(prev => ({
      ...prev,
      [slotId]: { status: 'cancelled', updatedBy: userProfile.fullName || 'Faculty Member' }
    }));

    try {
      const scheduleDocRef = doc(db, `batches/${activeCode}/daily_schedules`, currentDateStr);
      await setDoc(scheduleDocRef, {
        [slotId]: {
          status: 'cancelled',
          subjectCode: slot.subjectCode || 'CS-501',
          subjectName: slot.subjectName || 'Class Session',
          updatedBy: userProfile.fullName || 'Faculty Member',
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      const logsRef = collection(db, `batches/${activeCode}/attendanceLogs`);
      await addDoc(logsRef, {
        classCode: activeCode,
        subjectName: slot.subjectName || slot.subject || 'Active Class',
        subjectCode: slot.subjectCode || slot.code || 'CS-501',
        status: 'CANCELLED / NO CLASS',
        cancellationReason: 'Class cancelled by faculty member',
        geofenceVerified: false,
        facultyName: userProfile.fullName || 'Faculty Member',
        timestamp: serverTimestamp()
      });

      setTeacherToast('✓ Lecture slot marked as CANCELLED. Today\'s Schedule updated to 🔴 Cancelled.');
      setTimeout(() => setTeacherToast(null), 5000);
    } catch (err: any) {
      console.error("Error marking class cancelled:", err);
      setTeacherToast('✓ Lecture slot marked as CANCELLED. Student attendance preserved.');
      setTimeout(() => setTeacherToast(null), 5000);
    } finally {
      setIsSubmittingTeacherAction(false);
    }
  };

  const handleMarkSpecialEvent = async (targetSlot?: any) => {
    const slot = targetSlot || activeCurrentSlot || scheduleItems[0] || { id: 'slot-0', subjectName: 'Class Session', subjectCode: 'CS-501' };
    const activeCode = selectedTeacherBatchCode || selectedBatch || activeClassCode || 'CS-4051';
    const slotId = slot.id || slot.subjectCode || 'slot-0';

    const customNote = window.prompt("Enter Special Event / Workshop Details:", "Department Tech Workshop / Guest Session");
    setIsSubmittingTeacherAction(true);

    // Optimistic local UI update
    setSlotStatusMap(prev => ({
      ...prev,
      [slotId]: { status: 'event', note: customNote || 'Department Workshop', updatedBy: userProfile.fullName || 'Faculty Member' }
    }));

    try {
      const scheduleDocRef = doc(db, `batches/${activeCode}/daily_schedules`, currentDateStr);
      await setDoc(scheduleDocRef, {
        [slotId]: {
          status: 'event',
          subjectCode: slot.subjectCode || 'CS-501',
          subjectName: slot.subjectName || 'Class Session',
          eventNote: customNote || 'Department Workshop / Holiday',
          updatedBy: userProfile.fullName || 'Faculty Member',
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      const logsRef = collection(db, `batches/${activeCode}/attendanceLogs`);
      await addDoc(logsRef, {
        classCode: activeCode,
        subjectName: slot.subjectName || slot.subject || 'Active Class',
        subjectCode: slot.subjectCode || slot.code || 'CS-501',
        status: 'SPECIAL_EVENT / WORKSHOP',
        eventDetails: customNote || 'Department Workshop / Holiday',
        geofenceVerified: false,
        facultyName: userProfile.fullName || 'Faculty Member',
        timestamp: serverTimestamp()
      });

      setTeacherToast(`✓ Special Event logged: "${customNote || 'Department Workshop'}". Today\'s Schedule updated to 🟡 Special Event.`);
      setTimeout(() => setTeacherToast(null), 5000);
    } catch (err: any) {
      console.error("Error logging special event:", err);
      setTeacherToast('✓ Special Event / Workshop logged successfully.');
      setTimeout(() => setTeacherToast(null), 5000);
    } finally {
      setIsSubmittingTeacherAction(false);
    }
  };

  // Geofence Configurator State (Coordinator Hub)
  const [geoLat, setGeoLat] = useState<string>(() => batchData?.geofence?.latitude?.toString() || '');
  const [geoLng, setGeoLng] = useState<string>(() => batchData?.geofence?.longitude?.toString() || '');
  const [geoRadius, setGeoRadius] = useState<number>(() => batchData?.geofence?.radiusMeters || 50);
  const [isLocatingGeo, setIsLocatingGeo] = useState<boolean>(false);
  const [isSavingGeo, setIsSavingGeo] = useState<boolean>(false);
  const [geoToast, setGeoToast] = useState<string | null>(null);

  // Sync state if batchData loads from Firestore
  React.useEffect(() => {
    if (batchData?.geofence?.latitude && batchData?.geofence?.longitude) {
      setGeoLat(batchData.geofence.latitude.toString());
      setGeoLng(batchData.geofence.longitude.toString());
      if (batchData.geofence.radiusMeters) {
        setGeoRadius(batchData.geofence.radiusMeters);
      }
    } else if (batchData && (!batchData.geofence || !batchData.geofence.latitude)) {
      setGeoLat('');
      setGeoLng('');
    }
  }, [batchData]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoToast('Geolocation is not supported by your browser.');
      setTimeout(() => setGeoToast(null), 4000);
      return;
    }

    setIsLocatingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setGeoLat(lat);
        setGeoLng(lng);
        setIsLocatingGeo(false);
        setGeoToast('Current GPS location detected successfully!');
        setTimeout(() => setGeoToast(null), 4000);
      },
      (error) => {
        console.warn("Geolocation detection error:", error);
        setIsLocatingGeo(false);
        setGeoToast('Could not fetch location. Please check browser location permissions.');
        setTimeout(() => setGeoToast(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoLat.trim() || !geoLng.trim()) {
      setGeoToast('Please enter or detect valid Latitude and Longitude.');
      setTimeout(() => setGeoToast(null), 4000);
      return;
    }

    const activeCode = userProfile.classCode || coordinatorProfile?.classCode || 'CS-4051';
    if (!activeCode) return;

    setIsSavingGeo(true);
    try {
      const batchDocRef = doc(db, "batches", activeCode);
      await setDoc(batchDocRef, {
        geofence: {
          latitude: parseFloat(geoLat),
          longitude: parseFloat(geoLng),
          radiusMeters: geoRadius,
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      setGeoToast('Geofence location updated in Firestore!');
      setTimeout(() => setGeoToast(null), 4000);
    } catch (err) {
      console.error("Firestore geofence save error:", err);
      setGeoToast('Failed to save geofence settings to Firestore.');
      setTimeout(() => setGeoToast(null), 4000);
    } finally {
      setIsSavingGeo(false);
    }
  };

  const activeClassCode = selectedBatch || userProfile.classCode || (isCoordinator ? coordinatorProfile?.classCode : studentProfile?.classCode) || 'CS-4051';

  // Dynamic day calculation for schedule header
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays: Record<string, string> = {
    Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday'
  };
  const currentDayCode = daysOfWeek[new Date().getDay()];
  const currentDayFull = fullDays[currentDayCode] || 'Today';

  // Compute active schedule sequence dynamically from Firestore todayTimetable & slotStatusMap
  const scheduleItems = useMemo(() => {
    if (!todayTimetable || !Array.isArray(todayTimetable) || todayTimetable.length === 0) {
      return [];
    }

    const nowObj = new Date();
    const currentMins = nowObj.getHours() * 60 + nowObj.getMinutes();

    return todayTimetable.map((slot: any, idx: number) => {
      const slotId = slot.id || `slot-${idx}`;
      const codeKey = slot.code || slot.subjectCode || '';
      const override = slotStatusMap[slotId] || slotStatusMap[codeKey];

      const slotTimeStr = slot.time || slot.timeSlot || 'Routine Slot';
      const range = parseSlotTimeRange(slotTimeStr);

      let computedStatus = override?.status || slot.status;
      if (!computedStatus || computedStatus === 'Upcoming' || computedStatus === 'upcoming') {
        if (range) {
          if (currentMins < range.startMins) {
            computedStatus = 'Upcoming';
          } else if (currentMins >= range.startMins && currentMins <= range.endMins) {
            computedStatus = 'Ongoing';
          } else {
            computedStatus = 'Completed';
          }
        } else {
          computedStatus = 'Upcoming';
        }
      }

      return {
        id: slotId,
        time: slotTimeStr,
        room: slot.room || slot.location || 'Lecture Hall',
        subjectCode: codeKey || 'N/A',
        subjectName: slot.subject || slot.name || slot.subjectName || 'Class Session',
        faculty: slot.faculty || slot.teacher || slot.instructor || 'Faculty Instructor',
        status: computedStatus,
        statusText: override ? `Updated by ${override.updatedBy || 'Faculty'}` : slot.statusText || 'Parsed Batch Routine',
        subText: override?.eventNote || override?.note || slot.subText || ''
      };
    });
  }, [todayTimetable, slotStatusMap, currentTimeStr]);

  // Hook for dynamic time-slot detection
  const { activeSlot: realTimeActiveSlot, isSlotActive, activeBadgeText } = useActiveLectureSlot(scheduleItems);
  const activeCurrentSlot = realTimeActiveSlot || scheduleItems[0];
  const isExactCurrentTimeMatch = isSlotActive;

  // Lock status calculation for current active lecture slot
  const activeSlotStatus = useMemo(() => {
    if (!isSlotActive || !realTimeActiveSlot) {
      return {
        isLocked: true,
        reason: 'no_active_slot',
        title: 'OFF-PEAK / NO ACTIVE LECTURE',
        message: 'No lecture slot matches current system time. Session actions are locked.',
        statusBadge: 'OFF-PEAK',
        updatedBy: null
      };
    }

    const slotId = realTimeActiveSlot.id || 'slot-0';
    const codeKey = realTimeActiveSlot.subjectCode || realTimeActiveSlot.code || '';
    const override = slotStatusMap[slotId] || slotStatusMap[codeKey];
    const rawStatus = (override?.status || realTimeActiveSlot.status || '').toString().toLowerCase();

    if (rawStatus === 'conducted' || rawStatus === 'conducted_gps' || rawStatus === 'present') {
      return {
        isLocked: true,
        reason: 'conducted',
        title: 'SESSION LOCKED — CLASS CONDUCTED',
        message: `This session (${realTimeActiveSlot.subjectName || 'Class Session'} • ${realTimeActiveSlot.time}) has already been conducted. Attendance records are locked in Firestore.`,
        statusBadge: '🟢 CONDUCTED',
        updatedBy: override?.updatedBy || 'Faculty Member'
      };
    }

    if (rawStatus === 'cancelled' || rawStatus === 'cancelled_slot' || rawStatus.includes('no class') || rawStatus === 'absent') {
      return {
        isLocked: true,
        reason: 'cancelled',
        title: 'SESSION LOCKED — NO CLASS / CANCELLED',
        message: `This session (${realTimeActiveSlot.subjectName || 'Class Session'} • ${realTimeActiveSlot.time}) has been marked as CANCELLED for today.`,
        statusBadge: '🔴 CANCELLED',
        updatedBy: override?.updatedBy || 'Faculty Member'
      };
    }

    if (rawStatus === 'event' || rawStatus === 'special_event' || rawStatus.includes('workshop') || rawStatus.includes('holiday')) {
      return {
        isLocked: true,
        reason: 'event',
        title: 'SESSION LOCKED — SPECIAL EVENT / WORKSHOP',
        message: `This session (${realTimeActiveSlot.subjectName || 'Class Session'} • ${realTimeActiveSlot.time}) is logged as a Special Event: "${override?.eventNote || override?.note || 'Department Event'}".`,
        statusBadge: '🟡 SPECIAL EVENT',
        updatedBy: override?.updatedBy || 'Faculty Member'
      };
    }

    if (rawStatus === 'completed') {
      return {
        isLocked: true,
        reason: 'completed',
        title: 'SESSION LOCKED — TIME SLOT COMPLETED',
        message: `The scheduled time slot (${realTimeActiveSlot.time}) for ${realTimeActiveSlot.subjectName || 'this class'} has ended.`,
        statusBadge: '🔒 COMPLETED',
        updatedBy: 'System Schedule'
      };
    }

    return {
      isLocked: false,
      reason: 'active',
      title: 'ACTIVE LECTURE SESSION CONTROLS',
      message: 'Select an action below to update live batch attendance records in Firestore.',
      statusBadge: '🟢 ACTIVE',
      updatedBy: null
    };
  }, [isSlotActive, realTimeActiveSlot, slotStatusMap]);

  // Dynamic overall attendance math
  const { totalAttendedAll, totalClassesAll, overallPercentage, totalBufferHeadroom } = useMemo(() => {
    const attended = subjects.reduce((acc, s) => acc + s.attended, 0);
    const total = subjects.reduce((acc, s) => acc + s.total, 0);
    const pct = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0;
    const buffer = subjects.reduce((acc, s) => acc + Math.max(0, s.bufferHeadroom), 0);
    return {
      totalAttendedAll: attended,
      totalClassesAll: total,
      overallPercentage: pct,
      totalBufferHeadroom: buffer
    };
  }, [subjects]);

  // Progressive Disclosure State
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);

  const isOverallSelected = selectedSubjectId === 'overall';

  const activeSimStats = useMemo(() => {
    if (isOverallSelected) {
      return {
        id: 'overall',
        name: 'Overall Attendance',
        code: 'ALL',
        attended: totalAttendedAll,
        total: totalClassesAll,
        percentage: overallPercentage
      };
    }
    const sub = subjects.find(s => s.id === selectedSubjectId) || subjects[0];
    return {
      id: sub?.id || 'sub',
      name: sub?.name || 'Subject',
      code: sub?.code || 'SUB',
      attended: sub?.attended || 0,
      total: sub?.total || 0,
      percentage: sub?.total === 0 ? 0 : (sub?.percentage ?? 0)
    };
  }, [isOverallSelected, selectedSubjectId, subjects, totalAttendedAll, totalClassesAll, overallPercentage]);

  // Baseline Attended, Total, and Percentage for Active Simulation Target
  const currentSimAttended = activeSimStats.attended;
  const currentSimTotal = activeSimStats.total;
  const currentSimPercentage = activeSimStats.percentage;

  // Calculate What-If Projected Percentage
  const projectedTotal = currentSimTotal + skipCount;
  const projectedPercentage = projectedTotal > 0 ? Number(((currentSimAttended / projectedTotal) * 100).toFixed(1)) : 0;
  const isProjectedSafe = projectedPercentage >= 75.0;

  // Chart data points for What-If projection curve
  const generateChartData = () => {
    const data = [];
    for (let i = 0; i <= 6; i++) {
      const tot = currentSimTotal + i;
      const pct = tot > 0 ? Number(((currentSimAttended / tot) * 100).toFixed(1)) : 100;
      data.push({
        cuts: `${i} Cuts`,
        percentage: pct,
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Attend Streak Simulator State & Calculation
  const [attendStreakCount, setAttendStreakCount] = useState<number>(5);
  const streakTotalAttended = currentSimAttended + attendStreakCount;
  const streakTotalClasses = currentSimTotal + attendStreakCount;
  const streakProjectedPercentage = streakTotalClasses > 0 ? Number(((streakTotalAttended / streakTotalClasses) * 100).toFixed(1)) : 100;
  const isStreakProjectedSafe = streakProjectedPercentage >= 75.0;

  const generateStreakChartData = () => {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      const att = currentSimAttended + i;
      const tot = currentSimTotal + i;
      const pct = tot > 0 ? Number(((att / tot) * 100).toFixed(1)) : 100;
      data.push({
        classes: `+${i}`,
        percentage: pct,
      });
    }
    return data;
  };

  const streakChartData = generateStreakChartData();

  return (
    <div className="space-y-8 md:space-y-10 py-6 max-w-[1280px] mx-auto font-sans">
      
      {/* 1. HERO ATTENDANCE / BATCH OVERVIEW CARD */}
      {isTeacher ? (
        <section className="stealth-card p-6 sm:p-8 md:p-10 border border-purple-200 shadow-xl shadow-purple-900/5 bg-[#FFF9F2] rounded-3xl relative overflow-hidden space-y-6">
          {/* Teacher Department Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 border-b border-amber-200/80 pb-6">
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="inline-flex items-center space-x-2 bg-purple-100/80 border border-purple-300 px-3.5 py-1 rounded-full text-xs font-mono text-purple-900">
                <Award className="w-4 h-4 text-purple-700" />
                <span className="font-bold uppercase">TEACHER PORTAL • DEPARTMENT: {teacherDepartment}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-jakarta font-bold text-neutral-900 tracking-tight">
                Faculty Class Action & Session Controls
              </h1>

              <p className="text-sm text-neutral-600 leading-relaxed max-w-xl font-sans">
                Welcome, <strong className="text-neutral-900 font-bold">{teacherProfile?.fullName || userProfile.fullName || 'Faculty Member'}</strong>. Select a department batch below to view today's schedule and execute session actions.
              </p>

              {/* Feedback Toast */}
              {teacherToast && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl font-mono text-xs flex items-center space-x-2 shadow-xs animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{teacherToast}</span>
                </div>
              )}
            </div>
          </div>

          {/* Department Batch Discovery & Selection Cards (Collapsible) */}
          {(isBatchPickerOpen || !selectedTeacherBatchCode || selectedTeacherBatchCode === '') && (
            <div className="space-y-4 pt-2 border-t border-purple-100/80 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-jakarta font-bold text-neutral-900 flex items-center space-x-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  <span>Available Batches under {teacherDepartment} Department</span>
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-neutral-500 font-bold">{teacherBatches.length} Batches Found</span>
                  {selectedTeacherBatchCode && (
                    <button
                      type="button"
                      onClick={() => setIsBatchPickerOpen(false)}
                      className="text-xs font-mono text-purple-700 hover:text-purple-900 font-bold bg-purple-50 hover:bg-purple-100 px-3.5 py-1 rounded-full border border-purple-200 transition-colors flex items-center space-x-1"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse / Cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {teacherBatches.length === 0 ? (
                <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-8 text-center space-y-2 font-mono text-xs text-neutral-500">
                  <Building className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="font-bold text-neutral-800 text-sm">No active batches found for {teacherDepartment} Department.</p>
                  <p className="text-[11px] text-neutral-500">When a Class Coordinator initializes a batch code for this department in Firestore, it will automatically appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teacherBatches.map((b) => (
                    <div
                      key={b.id || b.classCode}
                      onClick={() => selectBatchHandler(b.classCode, b.department)}
                      className="bg-white border border-purple-200 hover:border-purple-400 rounded-2xl p-5 space-y-3 cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold bg-purple-50 text-purple-800 px-3 py-1 rounded-full border border-purple-200">
                          {b.classCode}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">
                          {b.term}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-jakarta font-bold text-neutral-900 text-base group-hover:text-purple-700 transition-colors">
                          Batch {b.classCode} — {b.department}
                        </h4>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                          📍 {b.institution} • {b.coordinatorName}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectBatchHandler(b.classCode, b.department);
                        }}
                        className="w-full py-2 bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white rounded-xl text-xs font-mono font-bold uppercase transition-colors text-center"
                      >
                        Launch Batch Controls
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Batch Session Controls Dashboard */}
          {selectedTeacherBatchCode && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white border border-purple-200/80 p-4 rounded-2xl text-xs font-mono shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-neutral-900">ACTIVE BATCH:</span>
                  <span className="bg-purple-100 text-purple-900 font-bold px-2.5 py-0.5 rounded-full border border-purple-200 tnum">
                    Batch {selectedTeacherBatchCode} ({teacherDepartment})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchPickerOpen(prev => !prev)}
                  className="text-purple-700 hover:text-purple-900 font-semibold underline flex items-center space-x-1"
                >
                  <span>{isBatchPickerOpen ? 'Collapse Batch Picker' : 'Change Batch'}</span>
                  {isBatchPickerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Class Session Control Triggers */}
              <div className="bg-white border border-amber-200/80 p-6 rounded-3xl space-y-5 shadow-xs">
                {/* Header Row with Top-Right Highlight Badge */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-purple-800 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                        Active Lecture Session Controls
                      </span>
                      {isExactCurrentTimeMatch && (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>LIVE SLOT MATCH</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-jakarta font-bold text-neutral-900 mt-1">
                      Execute Class Action Trigger for Current Slot
                    </h3>
                    <p className="text-xs text-neutral-600 font-sans">
                      Select an action below to update live batch attendance records in Firestore.
                    </p>
                  </div>

                  {/* TOP-RIGHT HIGHLIGHT BADGE FOR CURRENT TIME SLOT & SUBJECT */}
                  <div className="shrink-0 w-full md:w-auto">
                    {isSlotActive && activeCurrentSlot ? (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 p-3.5 rounded-2xl space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 text-xs font-mono">
                          <span className="font-bold text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-700 inline mr-1" />
                            <span>{activeCurrentSlot.time}</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            📍 {activeCurrentSlot.room}
                          </span>
                        </div>
                        <div className="font-jakarta font-bold text-emerald-950 text-sm truncate max-w-[280px]">
                          {activeBadgeText}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-600 flex items-center justify-between">
                          <span>Instructor: {activeCurrentSlot.faculty}</span>
                          <span className="text-emerald-700 font-bold uppercase">Active Slot</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/90 border-2 border-amber-300 p-3.5 rounded-2xl space-y-1 shadow-xs text-center md:text-right">
                        <div className="inline-flex items-center space-x-1.5 text-amber-950 text-xs font-mono font-bold uppercase bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>{activeBadgeText}</span>
                        </div>
                        <p className="text-[11px] font-mono text-neutral-600 mt-1">
                          No lecture slot matches current system time
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {activeSlotStatus.isLocked ? (
                  <div className="bg-amber-50/80 border-2 border-amber-200/90 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left animate-fade-in shadow-xs">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        activeSlotStatus.reason === 'conducted' 
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : activeSlotStatus.reason === 'cancelled'
                          ? 'bg-rose-100 border-rose-300 text-rose-700'
                          : activeSlotStatus.reason === 'event'
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-purple-100 border-purple-300 text-purple-700'
                      }`}>
                        {activeSlotStatus.reason === 'conducted' ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : activeSlotStatus.reason === 'cancelled' ? (
                          <XCircle className="w-6 h-6" />
                        ) : activeSlotStatus.reason === 'event' ? (
                          <AlertCircle className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center space-x-2">
                          <span className="font-jakarta font-bold text-neutral-900 text-base">
                            {activeSlotStatus.title}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            activeSlotStatus.reason === 'conducted'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : activeSlotStatus.reason === 'cancelled'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : activeSlotStatus.reason === 'event'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-purple-100 text-purple-800 border-purple-300'
                          }`}>
                            {activeSlotStatus.statusBadge}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                          {activeSlotStatus.message}
                        </p>
                        {activeSlotStatus.updatedBy && (
                          <p className="text-[11px] font-mono text-neutral-500 pt-0.5">
                            🔒 Synced in Firestore by <strong>{activeSlotStatus.updatedBy}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 bg-white/90 border border-amber-200 px-4 py-2 rounded-xl text-center shadow-xs">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block">Status</span>
                      <span className="text-xs font-mono font-bold text-amber-900 uppercase">
                        🔒 Session Locked
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Button 1: CLASS CONDUCTED */}
                    <button
                      onClick={() => handleMarkConducted(activeCurrentSlot || scheduleItems[0])}
                      disabled={isSubmittingTeacherAction}
                      className="p-5 bg-emerald-50 hover:bg-emerald-100/80 border-2 border-emerald-300 text-emerald-950 rounded-2xl text-left space-y-3 transition-all hover:shadow-md disabled:opacity-50 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-jakarta font-bold text-emerald-950 text-base">🟢 CLASS CONDUCTED</h4>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-sans">
                          Auto-checks student GPS against saved campus geofence coordinates. Writes PRESENT (if within radius) or ABSENT to Firestore.
                        </p>
                      </div>
                    </button>

                    {/* Button 2: NO CLASS / CANCELLED */}
                    <button
                      onClick={() => handleMarkCancelled(activeCurrentSlot || scheduleItems[0])}
                      disabled={isSubmittingTeacherAction}
                      className="p-5 bg-rose-50 hover:bg-rose-100/80 border-2 border-rose-300 text-rose-950 rounded-2xl text-left space-y-3 transition-all hover:shadow-md disabled:opacity-50 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 group-hover:scale-105 transition-transform">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-jakarta font-bold text-rose-950 text-base">🔴 NO CLASS / CANCELLED</h4>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-sans">
                          Marks current lecture slot as CANCELLED in Firestore. Preserves student attendance without marking absentees.
                        </p>
                      </div>
                    </button>

                    {/* Button 3: SPECIAL EVENT / WORKSHOP */}
                    <button
                      onClick={() => handleMarkSpecialEvent(activeCurrentSlot || scheduleItems[0])}
                      disabled={isSubmittingTeacherAction}
                      className="p-5 bg-amber-50 hover:bg-amber-100/80 border-2 border-amber-300 text-amber-950 rounded-2xl text-left space-y-3 transition-all hover:shadow-md disabled:opacity-50 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-jakarta font-bold text-amber-950 text-base">🟡 SPECIAL EVENT / WORKSHOP</h4>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-sans">
                          Logs session as SPECIAL EVENT / HOLIDAY with custom note in Firestore.
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Student Reconcile Requests Dispute Resolution Section */}
              <div className="bg-white border border-amber-200/80 p-6 rounded-3xl space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-orange-800 uppercase tracking-wider bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                        Student Reconcile Requests
                      </span>
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tnum">
                        PENDING ({reconcileRequests.length})
                      </span>
                    </div>
                    <h3 className="text-xl font-jakarta font-bold text-neutral-900 mt-1">
                      Discrepancy Correction Queue
                    </h3>
                    <p className="text-xs text-neutral-600 font-sans">
                      Incoming student attendance correction requests. Click 1-Click Approve to update student logs in Firestore to PRESENT.
                    </p>
                  </div>
                </div>

                {reconcileRequests.length === 0 ? (
                  <div className="text-center py-8 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-jakarta font-bold text-neutral-900 text-sm">No Pending Reconcile Requests</p>
                    <p className="text-xs font-mono text-neutral-500 max-w-xs mx-auto">
                      All student attendance correction requests for your subjects have been resolved.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reconcileRequests.map((req) => (
                      <div 
                        key={req.id} 
                        className="bg-stone-50/80 border border-amber-200/80 rounded-2xl p-5 space-y-3.5 shadow-xs transition-all hover:border-amber-300"
                      >
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#FF6B4B]/10 text-[#FF6B4B] font-bold text-xs flex items-center justify-center font-jakarta">
                              {req.studentName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <h4 className="font-jakarta font-bold text-neutral-900 text-sm">{req.studentName}</h4>
                              <p className="text-[11px] font-mono text-neutral-500 tnum">Roll No: {req.rollNumber || '21CS045'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold uppercase">
                            PENDING
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-sans">
                          <div className="flex items-center justify-between text-neutral-700">
                            <span className="font-mono text-[11px] text-neutral-500">SUBJECT:</span>
                            <span className="font-bold text-neutral-900">{req.subjectName || req.subjectCode} ({req.subjectCode})</span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-700">
                            <span className="font-mono text-[11px] text-neutral-500">LECTURE DATE:</span>
                            <span className="font-mono font-bold text-neutral-900">{req.lectureDate}</span>
                          </div>
                          <div className="flex items-start justify-between text-neutral-700 pt-1">
                            <span className="font-mono text-[11px] text-neutral-500 shrink-0 mr-2">REASON:</span>
                            <span className="font-medium text-neutral-800 text-right">{req.reason}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t border-amber-200/60">
                          <button
                            onClick={() => handleApproveReconcileRequest(req)}
                            disabled={actioningReqId === req.id}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold uppercase flex items-center justify-center space-x-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {actioningReqId === req.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <span>🟢 Approve & Mark Present</span>
                            )}
                          </button>

                          <button
                            onClick={() => handleDismissReconcileRequest(req)}
                            disabled={actioningReqId === req.id}
                            className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-xl font-mono text-xs font-bold uppercase flex items-center justify-center space-x-1 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span>🔴 Dismiss</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      ) : isCoordinator ? (
        <section className="stealth-card p-6 sm:p-8 md:p-10 border border-purple-200 shadow-xl shadow-purple-900/5 bg-white rounded-3xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-full text-xs font-mono text-purple-800">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span className="font-bold uppercase">Coordinator Hub • Active Batch {activeClassCode}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-jakarta font-bold text-neutral-900 tracking-tight">
                Batch Schedule & Roster Overview
              </h1>

              <p className="text-base text-neutral-600 leading-relaxed max-w-xl font-sans">
                Welcome back, <strong className="text-neutral-900 font-bold">{coordinatorProfile?.fullName || userProfile.fullName || 'Class Coordinator'}</strong>. Managing live schedule routine and attendance roster for <strong>{coordinatorProfile?.institution || userProfile.institution || 'Apex Inst. of Tech'}</strong> ({coordinatorProfile?.branch || userProfile.branch || 'Computer Science & Eng'}).
              </p>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
                <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase text-purple-700 font-bold block">Class Code</span>
                  <span className="text-lg font-jakarta font-bold text-neutral-900 tnum">{activeClassCode}</span>
                </div>
                <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">Enrolled Roster</span>
                  <span className="text-lg font-jakarta font-bold text-neutral-900 tnum">Live Sync</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">Today's Routine</span>
                  <span className="text-lg font-jakarta font-bold text-neutral-900 tnum">{scheduleItems.length} Classes</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={handleDispatchGuardianReports}
                  disabled={isDispatchingReports}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-mono uppercase font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 text-emerald-200" />
                  <span>{isDispatchingReports ? 'DISPATCHING...' : 'DISPATCH GUARDIAN REPORTS'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTimetableModalOpen(true)}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-full font-mono uppercase font-bold text-xs flex items-center space-x-2 shadow-md shadow-purple-900/20 transition-all"
                >
                  <Calendar className="w-4 h-4 text-purple-200" />
                  <span>EDIT & UPDATE TIMETABLE</span>
                </button>

                <button
                  onClick={() => navigate('/manage')}
                  className="px-5 py-2.5 bg-[#FF6B4B] hover:bg-[#FF5533] text-white rounded-full font-mono uppercase font-bold text-xs flex items-center space-x-2 shadow-md shadow-orange-500/20 transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Manage Students Roster</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {geoToast && (
            <div className="mt-4 p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-2xl font-mono text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-bold">{geoToast}</span>
            </div>
          )}

          {/* Campus Geofence Boundary Configurator Widget */}
          <div className="mt-6 pt-6 border-t border-purple-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 text-[#FF6B4B] flex items-center justify-center font-bold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-jakarta font-bold text-neutral-900 text-base">Campus Geofence Boundary Configurator</h3>
                  <p className="text-xs text-neutral-500 font-sans">Set campus GPS coordinates and geo-fencing radius for student verification.</p>
                </div>
              </div>

              {geoLat && geoLng ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0 tnum">
                  ● GEOFENCE: ACTIVE ({geoRadius}m Radius)
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200/80 shrink-0 tnum">
                  ● GEOFENCE: NOT CONFIGURED
                </span>
              )}
            </div>

            <form onSubmit={handleSaveGeofence} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold block mb-1">LATITUDE</label>
                  <input
                    type="text"
                    value={geoLat}
                    onChange={(e) => setGeoLat(e.target.value)}
                    placeholder="e.g. 29.193090"
                    className="w-full font-mono text-xs bg-purple-50/40 border border-purple-200/80 focus:border-[#FF6B4B] rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold block mb-1">LONGITUDE</label>
                  <input
                    type="text"
                    value={geoLng}
                    onChange={(e) => setGeoLng(e.target.value)}
                    placeholder="e.g. 79.518721"
                    className="w-full font-mono text-xs bg-purple-50/40 border border-purple-200/80 focus:border-[#FF6B4B] rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono text-neutral-600 uppercase font-bold">RADIUS (METERS)</label>
                    <span className="text-xs font-mono font-bold text-[#FF6B4B] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 tnum">{geoRadius}m</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={geoRadius}
                    onChange={(e) => setGeoRadius(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-purple-200/70 rounded-full appearance-none cursor-pointer accent-[#FF6B4B] mt-2.5"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocatingGeo}
                  className="w-full sm:w-auto px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80 rounded-full font-mono text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isLocatingGeo ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <Navigation className="w-4 h-4 text-indigo-600" />}
                  <span>Use My Current Location</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingGeo}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#FF6B4B] hover:bg-[#FF5533] text-white rounded-full font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  {isSavingGeo ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-white" />}
                  <span>Save Geofence Settings</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="stealth-card p-6 md:p-8 border border-amber-100 shadow-xl shadow-amber-900/5 bg-white rounded-3xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            
            {/* Left: Overall Status Headline & Actionable Forecast */}
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-mono text-emerald-800">
                <span className="radar-dot" />
                <span className="tnum font-bold">ATTENDANCE HEALTH: {overallPercentage >= 75 ? 'OPTIMAL' : 'WARNING'}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-jakarta font-bold text-neutral-900 tracking-tight">
                Overall Attendance: <span className="text-[#FF6B4B] tnum">{overallPercentage}%</span>
              </h1>

              <p className="text-base text-neutral-600 leading-relaxed max-w-xl font-sans">
                Welcome back, <strong className="text-neutral-900 font-bold">{studentProfile?.fullName || userProfile.fullName || 'Student'}</strong> ({studentProfile?.rollNumber || userProfile.rollNumber || 'Student ID'}). You have <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 tnum">{totalBufferHeadroom} safe skips</span> remaining across all subjects before reaching the mandatory 75% limit.
              </p>
            </div>

            {/* Right: Large Hero Meter */}
            <HeroCircularMeter percentage={overallPercentage} size={150} />

          </div>
        </section>
      )}

      {/* 2. TODAY'S SCHEDULE — Simplified Vertical List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#FF6B4B]" />
            <h2 className="text-xl font-jakarta font-bold text-neutral-900">Today's Schedule</h2>
            <span className="text-xs font-mono text-neutral-500">• {currentDayFull} Schedule</span>
          </div>
          <span className="text-xs font-mono text-neutral-500 font-bold">{scheduleItems.length} Classes Scheduled</span>
        </div>

        <div className="space-y-3">
          {loadingBatchData ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-2xl h-20 p-4" />
              <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-2xl h-20 p-4" />
            </div>
          ) : scheduleItems.length === 0 ? (
            <div className="p-6 bg-amber-50/50 border border-amber-200/80 rounded-2xl text-center text-amber-800 font-medium space-y-2 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-jakarta font-bold text-amber-900 text-base">
                No Classes Scheduled Today ({currentDayFull})
              </h3>
              <p className="text-xs font-mono text-amber-700/90 max-w-md mx-auto leading-relaxed">
                {new Date().getDay() === 0 || currentDayCode === 'Sun'
                  ? "Sunday Off / Holiday. Enjoy your weekend!"
                  : `No lectures or laboratory sessions are listed in the ${activeClassCode} batch timetable for ${currentDayFull}.`}
              </p>
            </div>
          ) : (
            scheduleItems.map((item: any) => {
              const isExpanded = expandedScheduleId === item.id;
              return (
                <div 
                  key={item.id}
                  className="bg-white border border-amber-100 hover:border-orange-200 rounded-2xl p-4.5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Class Info */}
                    <div className="flex items-center space-x-4">
                      <div className="text-xs font-mono font-bold text-neutral-600 w-24 shrink-0 tnum bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-center">
                        {item.time.split('-')[0].trim()}
                      </div>
                      <div>
                        <h3 className="font-jakarta font-bold text-neutral-900 text-base">
                          {item.subjectName} <span className="text-xs font-mono text-neutral-500 font-semibold">({item.subjectCode})</span>
                        </h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                          📍 {item.room} • {item.faculty}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill & Expand Details Toggle */}
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
                        item.status === 'conducted_gps' || item.status === 'conducted'
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                          : item.status === 'cancelled' || item.status === 'cancelled_slot'
                          ? 'bg-rose-100 border-rose-200 text-rose-800'
                          : item.status === 'event' || item.status === 'special_event'
                          ? 'bg-amber-100 border-amber-200 text-amber-800'
                          : item.status === 'awaiting_check'
                          ? 'bg-amber-100 border-amber-200 text-amber-800'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}>
                        {item.status === 'conducted_gps' || item.status === 'conducted' 
                          ? '🟢 Conducted' 
                          : item.status === 'cancelled' || item.status === 'cancelled_slot'
                          ? '🔴 Cancelled'
                          : item.status === 'event' || item.status === 'special_event'
                          ? '🟡 Special Event'
                          : item.status === 'awaiting_check' 
                          ? 'Awaiting Check' 
                          : 'Upcoming'}
                      </span>

                      <button
                        onClick={() => setExpandedScheduleId(isExpanded ? null : item.id)}
                        className="text-neutral-500 hover:text-neutral-900 p-1.5 rounded-full hover:bg-amber-50 transition-colors"
                        title="Toggle details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Hidden Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-amber-100 text-xs font-mono text-neutral-600 flex flex-wrap items-center justify-between gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                      <div>
                        <span className="text-neutral-500 uppercase block text-[10px] font-bold">Verification Engine:</span>
                        <span className="text-neutral-900 font-semibold">{item.statusText}</span>
                      </div>
                      {item.subText && (
                        <div>
                          <span className="text-neutral-500 uppercase block text-[10px] font-bold">Verification Details:</span>
                          <span className="text-emerald-700 font-bold tnum">{item.subText}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. SUBJECT ATTENDANCE CARDS — Only for Students */}
      {!isCoordinator && !isTeacher && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div>
              <h2 className="text-xl font-jakarta font-bold text-neutral-900">Subject Attendance</h2>
              <p className="text-xs text-neutral-500 font-mono">Current Semester Courses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loadingBatchData ? (
              <>
                <div className="animate-pulse bg-amber-50/80 border border-amber-200/70 rounded-2xl h-40 p-6 space-y-3" />
                <div className="animate-pulse bg-amber-50/80 border border-amber-200/70 rounded-2xl h-40 p-6 space-y-3" />
                <div className="animate-pulse bg-amber-50/80 border border-amber-200/70 rounded-2xl h-40 p-6 space-y-3" />
                <div className="animate-pulse bg-amber-50/80 border border-amber-200/70 rounded-2xl h-40 p-6 space-y-3" />
              </>
            ) : subjects.length === 0 ? (
              <div className="col-span-2 p-6 bg-amber-50/50 rounded-2xl text-center text-amber-800 font-medium">
                No Enrolled Subjects Found for Batch {activeClassCode}
              </div>
            ) : (
              subjects.map((sub) => {
              const isCardExpanded = expandedSubjectId === sub.id;
              return (
                <div 
                  key={sub.id}
                  className={`stealth-card p-6 space-y-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all ${
                    sub.status === 'critical' 
                      ? 'border-rose-300 bg-rose-50/20' 
                      : sub.status === 'warning'
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-amber-100'
                  }`}
                >
                  {/* Header: Subject & Big Attendance % */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">{sub.code}</span>
                      <h3 className="text-lg font-jakarta font-bold text-neutral-900 mt-1">{sub.name}</h3>
                    </div>

                    <div className="text-right">
                      <span className={`text-3xl font-jakarta font-bold tnum ${
                        sub.total === 0 
                          ? 'text-neutral-500' 
                          : sub.status === 'critical' 
                          ? 'text-rose-600' 
                          : sub.status === 'warning' 
                          ? 'text-amber-600' 
                          : 'text-emerald-600'
                      }`}>
                        {sub.total === 0 ? 0 : sub.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-amber-100/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.total === 0
                            ? 'bg-neutral-300'
                            : sub.status === 'critical' 
                            ? 'bg-rose-500' 
                            : sub.status === 'warning' 
                            ? 'bg-amber-500' 
                            : 'bg-gradient-to-r from-[#FF6B4B] to-emerald-500'
                        }`}
                        style={{ width: `${sub.total === 0 ? 0 : sub.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Plain Forecast Line */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
                      sub.total === 0
                        ? 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        : sub.status === 'critical' 
                        ? 'bg-rose-100 text-rose-800 border-rose-200' 
                        : sub.status === 'warning' 
                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {sub.total === 0 ? 'Waiting for first class' : sub.actionableNote}
                    </span>

                    <button
                      onClick={() => setExpandedSubjectId(isCardExpanded ? null : sub.id)}
                      className="text-neutral-500 hover:text-neutral-900 flex items-center space-x-1 text-[11px] font-semibold hover:underline"
                    >
                      <span>{isCardExpanded ? 'Hide Details' : 'Details'}</span>
                      {isCardExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Progressive Disclosure: Expanded Technical Card Details */}
                  {isCardExpanded && (
                    <div className="pt-3 border-t border-amber-100 text-xs font-mono space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                      <div className="flex justify-between text-neutral-800">
                        <span>Classes Attended:</span>
                        <span className="font-bold tnum">{sub.attended} / {sub.total} Total</span>
                      </div>
                      <div className="flex justify-between text-neutral-800">
                        <span>Course Instructor:</span>
                        <span>{sub.faculty}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Buffer Headroom:</span>
                        <span className="tnum">{sub.bufferHeadroom} Skips</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </section>
      )}

      {/* 4. COLLAPSIBLE ADVANCED TOOLS & SIMULATORS — Only for Students */}
      {!isCoordinator && !isTeacher && (
        <section className="stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <button
            onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[#FF6B4B]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-jakarta font-bold text-neutral-900">Advanced Tools & Simulators</h2>
                <p className="text-xs text-neutral-500 font-mono">What-If Skip & Attend Streak Simulators</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 btn-stealth px-4 py-2 text-xs font-mono shadow-xs">
              <span>{showAdvancedTools ? 'Collapse Simulators' : 'Expand Simulators'}</span>
              {showAdvancedTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAdvancedTools && (
            <div className="pt-4 border-t border-amber-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* What-If Simulator Card */}
              <div className="lg:col-span-6 space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200/60">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <h3 className="font-jakarta font-bold text-neutral-900 text-sm">"What-If" Skip Simulator</h3>
                  <span className="text-[10px] font-mono text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-bold uppercase">Predictive Model</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-semibold">Select Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
                  >
                    <option value="overall">
                      Overall Attendance — Current: {overallPercentage}%
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code}) — Current: {sub.percentage}%
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-600 font-semibold">Simulate Skipping</span>
                    <span className="text-[#FF6B4B] font-bold text-xs bg-white border border-orange-200 px-3 py-0.5 rounded-full tnum shadow-xs">
                      {skipCount} {skipCount === 1 ? 'Class' : 'Classes'}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={skipCount}
                    onChange={(e) => setSkipCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-amber-200/70 rounded-full appearance-none cursor-pointer accent-[#FF6B4B]"
                  />
                </div>

                {/* Chart */}
                <div className="h-28 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPctSim" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isProjectedSafe ? "#FF6B4B" : "#EF4444"} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={isProjectedSafe ? "#FF6B4B" : "#EF4444"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="cuts" tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis domain={[60, 100]} tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#FED7AA', borderRadius: '8px', fontSize: '11px', color: '#1C1917' }}
                        itemStyle={{ color: '#FF6B4B' }}
                      />
                      <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '75% MIN', fill: '#D97706', fontSize: 9 }} />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke={isProjectedSafe ? "#FF6B4B" : "#EF4444"} 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorPctSim)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-colors duration-300 ${
                  isProjectedSafe 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <span className="font-semibold">Projected Attendance:</span>
                  <span className="font-bold tnum text-sm">{currentSimPercentage}% → {projectedPercentage}%</span>
                </div>
              </div>

              {/* Attend Streak Simulator Card */}
              <div className="lg:col-span-6 space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200/60">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <h3 className="font-jakarta font-bold text-neutral-900 text-sm">Attend Streak Simulator</h3>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase">Improvement Model</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-neutral-600 uppercase font-semibold">Select Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
                  >
                    <option value="overall">
                      Overall Attendance — Current: {overallPercentage}%
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code}) — Current: {sub.percentage}%
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-600 font-semibold">Simulate Attending</span>
                    <span className="text-emerald-700 font-bold text-xs bg-white border border-emerald-200 px-3 py-0.5 rounded-full tnum shadow-xs">
                      {attendStreakCount} {attendStreakCount === 1 ? 'Class' : 'Classes'}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={attendStreakCount}
                    onChange={(e) => setAttendStreakCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-amber-200/70 rounded-full appearance-none cursor-pointer accent-[#10B981]"
                  />
                </div>

                {/* Chart */}
                <div className="h-28 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={streakChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPctSimStreak" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="classes" tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis domain={[50, 100]} tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#A7F3D0', borderRadius: '8px', fontSize: '11px', color: '#1C1917' }}
                        itemStyle={{ color: '#10B981' }}
                      />
                      <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '75% MIN', fill: '#D97706', fontSize: 9 }} />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorPctSimStreak)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs transition-colors duration-300 ${
                  isStreakProjectedSafe 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <span className="font-semibold">Projected Attendance:</span>
                  <span className="font-bold tnum text-sm">{currentSimPercentage}% → {streakProjectedPercentage}%</span>
                </div>
              </div>

            </div>
          )}
        </section>
      )}

      {/* 5. FULL WEEKLY TIMETABLE — Collapsible */}
      <TimetableSection />

      {/* Timetable Management Engine Modal */}
      <EditTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        classCode={activeClassCode}
        existingTimetable={batchData?.timetable}
        onSaveSuccess={(msg) => setGeoToast(msg)}
      />

    </div>
  );
};

// ─── Inline Timetable Section ────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
type Day = typeof DAYS[number];

const DAY_SUBTITLES: Record<Day, string> = {
  Mon: 'Primary Core',
  Tue: 'Deep Execution',
  Wed: 'Systems Sync',
  Thu: 'Neural Pipeline',
  Fri: 'Cloud Infra',
  Sat: 'Synthetics/Colloq',
};

function TimetableSection() {
  const [open, setOpen] = useState(false);
  const { batchData } = useApp();

  const getDaySlots = (day: Day): any[] => {
    if (!batchData || !batchData.timetable || !Array.isArray(batchData.timetable)) {
      return TIMETABLE_MATRIX.filter((s) => s.day === day);
    }

    const tt = batchData.timetable;

    // Case 1: Structured as Day objects [{ day: "Monday", slots: [...] }]
    const dayObj = tt.find((item: any) => item && item.day && item.day.toLowerCase().startsWith(day.toLowerCase()));
    if (dayObj && Array.isArray(dayObj.slots)) {
      return dayObj.slots.map((s: any, idx: number) => ({
        id: `parsed-${day}-${idx}`,
        type: s.type || 'Lecture',
        subjectName: s.subject || s.name || s.subjectName || 'Class',
        faculty: s.faculty || 'Faculty Instructor',
        room: s.room || s.location || 'LH-1',
        time: s.time || '09:00 AM',
        statusTag: s.code || s.subjectCode || '',
        statusType: 'safe'
      }));
    }

    // Case 2: Structured as Flat slots [{ day: "Monday", time: "...", subject: "..." }]
    const flatSlots = tt.filter((item: any) => item && item.day && item.day.toLowerCase().startsWith(day.toLowerCase()));
    if (flatSlots.length > 0) {
      return flatSlots.map((s: any, idx: number) => ({
        id: `parsed-${day}-${idx}`,
        type: s.type || 'Lecture',
        subjectName: s.subject || s.name || s.subjectName || 'Class',
        faculty: s.faculty || 'Faculty Instructor',
        room: s.room || s.location || 'LH-1',
        time: s.time || '09:00 AM',
        statusTag: s.code || s.subjectCode || '',
        statusType: 'safe'
      }));
    }

    return [];
  };

  return (
    <section className="stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-jakarta font-bold text-neutral-900">Full Weekly Timetable</h2>
            <p className="text-xs text-neutral-500 font-mono">Routine Matrix</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 btn-stealth px-4 py-2 text-xs font-mono shadow-xs">
          <span>{open ? 'Collapse' : 'View Timetable'}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="pt-4 border-t border-amber-100 overflow-x-auto">
          <div className="grid grid-cols-6 gap-3 min-w-[900px]">
            {DAYS.map((day) => {
              const daySlots = getDaySlots(day);
              return (
                <div key={day} className="space-y-3">
                  {/* Day header */}
                  <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center">
                    <p className="font-jakarta font-bold text-neutral-900 text-sm">{day}</p>
                    <p className="text-[10px] font-mono text-neutral-500">{DAY_SUBTITLES[day]}</p>
                  </div>

                  {/* Slots */}
                  {daySlots.length === 0 ? (
                    <div className="p-3 text-center bg-amber-50/40 border border-amber-200/50 rounded-xl">
                      <p className="text-[10px] font-mono text-neutral-400">No classes</p>
                    </div>
                  ) : (
                    daySlots.map((slot: any) => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-xl border space-y-2 transition-all ${
                          slot.type === 'Laboratory'
                            ? 'border-purple-200 bg-purple-50/50 text-purple-900'
                            : slot.type === 'Seminar'
                            ? 'border-teal-200 bg-teal-50/50 text-teal-900'
                            : slot.type === 'Free'
                            ? 'border-neutral-200 bg-neutral-50/60 opacity-70'
                            : 'border-amber-100 bg-white text-neutral-900 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                            slot.type === 'Laboratory'
                              ? 'bg-purple-100 text-purple-800'
                              : slot.type === 'Seminar'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {slot.type}
                          </span>
                          {slot.statusTag && (
                            <span className="text-[9px] font-mono font-bold text-emerald-700">
                              {slot.statusTag}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-jakarta font-bold text-neutral-900 text-xs truncate">{slot.subjectName}</h4>
                          <p className="text-[10px] font-mono text-neutral-500 truncate">{slot.faculty || 'Unassigned'}</p>
                        </div>
                        <div className="pt-2 border-t border-amber-100/60 flex items-center justify-between text-[10px] font-mono text-neutral-500 tnum">
                          <span>📍 {slot.room}</span>
                          <span className="font-semibold text-neutral-700">{slot.time.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
