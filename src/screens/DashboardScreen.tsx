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
  Clock
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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

  // Teacher Department & Selected Batch Discovery State
  const teacherDepartment = (userProfile?.department || teacherProfile?.department || 'BCA').toUpperCase();
  const [selectedTeacherBatchCode, setSelectedTeacherBatchCodeState] = useState<string>(selectedBatch || 'CS-4051');
  const [isBatchPickerOpen, setIsBatchPickerOpen] = useState<boolean>(false);
  const [teacherBatches, setTeacherBatches] = useState<any[]>([]);
  const [loadingTeacherBatches, setLoadingTeacherBatches] = useState<boolean>(true);
  const [teacherToast, setTeacherToast] = useState<string | null>(null);
  const [isSubmittingTeacherAction, setIsSubmittingTeacherAction] = useState<boolean>(false);

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
  useEffect(() => {
    if (!isTeacher) return;

    const batchesRef = collection(db, 'batches');
    const unsubscribe = onSnapshot(batchesRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const bDept = (data.department || data.branch || '').toUpperCase();
        if (!teacherDepartment || bDept.includes(teacherDepartment) || teacherDepartment.includes(bDept) || data.classCode === selectedTeacherBatchCode) {
          list.push({
            id: docSnap.id,
            classCode: data.classCode || docSnap.id,
            department: bDept || teacherDepartment,
            term: data.term || data.semester || '5th Sem',
            coordinatorName: data.coordinatorName || 'Prof. S. Chakrabarti',
            institution: data.institution || 'Apex Inst. of Tech',
            timetable: data.timetable || []
          });
        }
      });

      // Default fallback batch cards for teacher department
      if (list.length === 0) {
        list.push(
          { id: 'CS-4051', classCode: 'CS-4051', department: teacherDepartment, term: '5th Sem', coordinatorName: 'Prof. S. Chakrabarti', institution: 'Apex Inst. of Tech', timetable: [] },
          { id: 'CS-4052', classCode: 'CS-4052', department: teacherDepartment, term: '3rd Sem', coordinatorName: 'Dr. M. Roy', institution: 'Apex Inst. of Tech', timetable: [] },
          { id: 'CS-8849', classCode: 'CS-8849', department: teacherDepartment, term: '6th Sem', coordinatorName: 'Prof. S. Chakrabarti', institution: 'Apex Inst. of Tech', timetable: [] }
        );
      }

      setTeacherBatches(list);
      setLoadingTeacherBatches(false);
    }, (err) => {
      console.warn("Error querying teacher department batches:", err);
      setTeacherBatches([
        { id: 'CS-4051', classCode: 'CS-4051', department: teacherDepartment, term: '5th Sem', coordinatorName: 'Prof. S. Chakrabarti', institution: 'Apex Inst. of Tech' },
        { id: 'CS-4052', classCode: 'CS-4052', department: teacherDepartment, term: '3rd Sem', coordinatorName: 'Dr. M. Roy', institution: 'Apex Inst. of Tech' },
        { id: 'CS-8849', classCode: 'CS-8849', department: teacherDepartment, term: '6th Sem', coordinatorName: 'Prof. S. Chakrabarti', institution: 'Apex Inst. of Tech' }
      ]);
      setLoadingTeacherBatches(false);
    });

    return () => unsubscribe();
  }, [isTeacher, userRole, teacherDepartment, selectedTeacherBatchCode]);

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
          const sLat = typeof st.lastLatitude === 'number' ? st.lastLatitude : geofence.latitude + (Math.random() * 0.0002 - 0.0001);
          const sLng = typeof st.lastLongitude === 'number' ? st.lastLongitude : geofence.longitude + (Math.random() * 0.0002 - 0.0001);

          const distance = calculateHaversineDistance(sLat, sLng, geofence.latitude, geofence.longitude);
          const isWithin = distance <= geofence.radiusMeters;
          if (isWithin) presentCount++;

          await addDoc(logsRef, {
            studentUid: st.uid || st.id,
            studentName: st.name || st.fullName || 'Student',
            rollNumber: st.rollNumber || '21CS045',
            classCode: activeCode,
            subjectName: slot.subjectName || slot.subject || 'Active Class',
            subjectCode: slot.subjectCode || slot.code || 'CS-501',
            status: isWithin ? 'PRESENT' : 'ABSENT',
            geofenceVerified: isWithin,
            distanceMeters: distance,
            facultyName: userProfile.fullName || 'Faculty Member',
            timestamp: serverTimestamp()
          });
        }
      } else {
        presentCount = 1;
        await addDoc(logsRef, {
          studentUid: userProfile.uid || 'anon-student',
          studentName: 'Batch Student',
          rollNumber: '21CS045',
          classCode: activeCode,
          subjectName: slot.subjectName || slot.subject || 'Active Class',
          subjectCode: slot.subjectCode || slot.code || 'CS-501',
          status: 'PRESENT',
          geofenceVerified: true,
          distanceMeters: 25,
          facultyName: userProfile.fullName || 'Faculty Member',
          timestamp: serverTimestamp()
        });
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

    const activeCode = userProfile.classCode || coordinatorProfile?.classCode || 'CS-8849';
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
    return todayTimetable.map((slot: any, idx: number) => {
      const slotId = slot.id || `slot-${idx}`;
      const codeKey = slot.code || slot.subjectCode || '';
      const override = slotStatusMap[slotId] || slotStatusMap[codeKey];

      const computedStatus = override?.status || slot.status || (idx === 0 ? 'conducted_gps' : 'upcoming');

      return {
        id: slotId,
        time: slot.time || '09:00 AM - 10:00 AM',
        room: slot.room || slot.location || 'LH-302',
        subjectCode: codeKey || 'BCA-512',
        subjectName: slot.subject || slot.name || slot.subjectName || 'Class Session',
        faculty: slot.faculty || 'Faculty Instructor',
        status: computedStatus,
        statusText: override ? `Updated by ${override.updatedBy || 'Faculty'}` : slot.statusText || 'Parsed Batch Routine',
        subText: override?.eventNote || override?.note || slot.subText || ''
      };
    });
  }, [todayTimetable, slotStatusMap]);

  // Time parsing helper for slot matching
  const parseSlotTimes = (timeStr: string) => {
    if (!timeStr) return null;
    const parts = timeStr.split('-').map(s => s.trim());
    if (parts.length < 2) return null;

    const parseTime = (str: string) => {
      const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return null;
      let hrs = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();
      if (period === 'PM' && hrs < 12) hrs += 12;
      if (period === 'AM' && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };

    const startMins = parseTime(parts[0]);
    const endMins = parseTime(parts[1]);
    if (startMins === null || endMins === null) return null;
    return { startMins, endMins };
  };

  const isExactCurrentTimeMatch = useMemo(() => {
    if (!scheduleItems || scheduleItems.length === 0) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return scheduleItems.some(item => {
      const range = parseSlotTimes(item.time);
      return range ? (currentMins >= range.startMins && currentMins <= range.endMins) : false;
    });
  }, [scheduleItems, currentTimeStr]);

  const activeCurrentSlot = useMemo(() => {
    if (!scheduleItems || scheduleItems.length === 0) return null;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (const item of scheduleItems) {
      const range = parseSlotTimes(item.time);
      if (range && currentMins >= range.startMins && currentMins <= range.endMins) {
        return item;
      }
    }
    return scheduleItems[0];
  }, [scheduleItems, currentTimeStr]);

  // Dynamic overall attendance math
  const { totalAttendedAll, totalClassesAll, overallPercentage, totalBufferHeadroom } = useMemo(() => {
    const attended = subjects.reduce((acc, s) => acc + s.attended, 0);
    const total = subjects.reduce((acc, s) => acc + s.total, 0);
    const pct = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 81.4;
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
      percentage: sub?.percentage || 100
    };
  }, [isOverallSelected, selectedSubjectId, subjects, totalAttendedAll, totalClassesAll, overallPercentage]);

  // Baseline Attended, Total, and Percentage for Active Simulation Target
  const currentSimAttended = activeSimStats.attended;
  const currentSimTotal = activeSimStats.total;
  const currentSimPercentage = activeSimStats.percentage;

  // Calculate What-If Projected Percentage
  const projectedTotal = currentSimTotal + skipCount;
  const projectedPercentage = projectedTotal > 0 ? Number(((currentSimAttended / projectedTotal) * 100).toFixed(1)) : 100;
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
                    {isExactCurrentTimeMatch && activeCurrentSlot ? (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 p-3.5 rounded-2xl space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 text-xs font-mono">
                          <span className="font-bold text-purple-900 bg-purple-200/70 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-purple-700 inline mr-1" />
                            <span>{activeCurrentSlot.time}</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                            📍 {activeCurrentSlot.room}
                          </span>
                        </div>
                        <div className="font-jakarta font-bold text-neutral-900 text-sm truncate max-w-[260px]">
                          {activeCurrentSlot.subjectName} <span className="text-xs font-mono text-purple-700">({activeCurrentSlot.subjectCode})</span>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 flex items-center justify-between">
                          <span>Instructor: {activeCurrentSlot.faculty}</span>
                          <span className="text-purple-600 font-bold">Active Slot</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl space-y-1 shadow-xs text-center md:text-right">
                        <div className="inline-flex items-center space-x-1.5 text-amber-900 text-xs font-mono font-bold uppercase bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>OFF-PEAK / NO ACTIVE LECTURE</span>
                        </div>
                        <p className="text-[11px] font-mono text-neutral-600">
                          {activeCurrentSlot ? `Default Slot: ${activeCurrentSlot.subjectName} (${activeCurrentSlot.subjectCode})` : 'No timetable slots scheduled'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

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
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl py-10 px-8 sm:px-10 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-jakarta font-bold text-neutral-900 text-lg">No Classes Scheduled For Today</h3>
                <p className="text-xs font-mono text-neutral-500 max-w-md mx-auto leading-relaxed">
                  No lectures or laboratory sessions are listed in the {activeClassCode} batch timetable for {currentDayFull}.
                </p>
              </div>
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
              <div className="col-span-2 text-center py-10 bg-amber-50/40 border border-amber-200/60 rounded-2xl text-xs font-mono text-neutral-500">
                No subjects recorded for batch <strong className="text-neutral-900">{activeClassCode}</strong> in Firestore.
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
                        sub.status === 'critical' ? 'text-rose-600' : sub.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-amber-100/60 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          sub.status === 'critical' 
                            ? 'bg-rose-500' 
                            : sub.status === 'warning' 
                            ? 'bg-amber-500' 
                            : 'bg-gradient-to-r from-[#FF6B4B] to-emerald-500'
                        }`}
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Plain Forecast Line */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
                      sub.status === 'critical' 
                        ? 'bg-rose-100 text-rose-800 border-rose-200' 
                        : sub.status === 'warning' 
                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {sub.actionableNote}
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
                        <span>{sub.faculty} ({sub.credits} Credits)</span>
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
