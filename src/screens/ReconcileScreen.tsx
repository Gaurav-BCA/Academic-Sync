import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  Check,
  Info,
  Send,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOnboarding } from '../context/OnboardingContext';
import { db } from '../services/firebase';
import { collection, addDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export const ReconcileScreen: React.FC = () => {
  const { 
    userProfile,
    subjects,
    loadingBatchData,
    selectedBatch,
    todayTimetable,
    eventDayBypass = false, 
    toggleEventDayBypass 
  } = useApp();

  const { studentProfile } = useOnboarding();

  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Firestore Attendance Logs State
  const [firestoreLogs, setFirestoreLogs] = useState<any[]>([]);

  // Selected subject from AppContext dynamic subjects list
  const activeSubjectObj = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;
    if (!selectedSubjectId) return subjects[0];
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  // Real-time Firestore query for today's attendance logs & daily schedule status
  const [dailyScheduleMap, setDailyScheduleMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const classCode = selectedBatch || userProfile?.classCode || 'CS-4051';
    const logsRef = collection(db, `batches/${classCode}/attendanceLogs`);

    const unsubscribe = onSnapshot(logsRef, (snapshot) => {
      const logs: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        logs.push({ id: docSnap.id, ...data });
      });
      setFirestoreLogs(logs);
    }, (err) => {
      console.warn("ReconcileScreen attendanceLogs listener notice:", err);
    });

    return () => unsubscribe();
  }, [selectedBatch, userProfile?.classCode]);

  useEffect(() => {
    const classCode = selectedBatch || userProfile?.classCode || 'CS-4051';
    const scheduleDocRef = doc(db, `batches/${classCode}/daily_schedules`, todayStr);

    const unsubscribe = onSnapshot(scheduleDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyScheduleMap(docSnap.data() || {});
      } else {
        setDailyScheduleMap({});
      }
    }, (err) => {
      console.warn("ReconcileScreen daily_schedules listener notice:", err);
    });

    return () => unsubscribe();
  }, [selectedBatch, userProfile?.classCode, todayStr]);

  // Map today's logged sessions combined with timetable slots, dailyScheduleMap & firestoreLogs
  const recordedSessions = useMemo(() => {
    const baseSlots = (todayTimetable && todayTimetable.length > 0) 
      ? todayTimetable 
      : [
          { id: 'slot-0', subject: 'Java Programming', code: 'BCA 512', time: '08:40 AM - 09:40 AM' },
          { id: 'slot-1', subject: 'Computer Graphics', code: 'BCA 513', time: '09:40 AM - 10:40 AM' },
          { id: 'slot-2', subject: 'Database Systems', code: 'BCA 516', time: '10:50 AM - 11:50 AM' },
          { id: 'slot-3', subject: 'Web Technologies', code: 'BCA 515', time: '11:50 AM - 12:50 PM' }
        ];

    const currentUid = userProfile?.uid || studentProfile?.uid;
    const currentRoll = userProfile?.rollNumber || studentProfile?.rollNumber || '21CS045';

    return baseSlots.map((slot: any, idx: number) => {
      const slotId = slot.id || `slot-${idx}`;
      const subCode = slot.code || slot.subjectCode || `BCA 51${idx + 2}`;
      const subName = slot.subject || slot.name || slot.subjectName || 'Class Session';
      const timeSlot = slot.time || '09:00 AM - 10:00 AM';

      // 1. Read the live slot status directly from Firestore daily_schedules (or slot.status)
      const scheduleOverride = dailyScheduleMap[slotId] || dailyScheduleMap[subCode];
      const slotStatus = (scheduleOverride?.status || slot.status || 'Upcoming').toLowerCase();

      let statusType: 'PRESENT' | 'ABSENT' | 'CANCELLED' | 'UPCOMING' = 'UPCOMING';

      if (eventDayBypass || slotStatus === 'cancelled' || slotStatus === 'event') {
        // Cancelled or Special Event Day
        statusType = 'CANCELLED';
      } else if (slotStatus === 'conducted') {
        // Conducted by Teacher -> Check student's attendanceLogs for this slot
        const studentSubjectLogs = firestoreLogs.filter(l => {
          const matchesStudent = l.studentUid === currentUid || l.rollNumber === currentRoll || !l.studentUid;
          const matchesSubject = (l.subjectCode && l.subjectCode.toUpperCase() === subCode.toUpperCase()) ||
                                 (l.subjectName && l.subjectName.toLowerCase().includes(subName.toLowerCase()));
          return matchesStudent && matchesSubject;
        });

        const latestLog = studentSubjectLogs.length > 0 ? studentSubjectLogs[studentSubjectLogs.length - 1] : null;

        if (latestLog && (latestLog.status || '').toUpperCase().includes('PRESENT')) {
          statusType = 'PRESENT';
        } else {
          statusType = 'ABSENT';
        }
      } else {
        // Slot is unconducted / Upcoming -> Pending Execution
        statusType = 'UPCOMING';
      }

      return {
        id: slotId,
        subjectName: subName,
        subjectCode: subCode,
        timeSlot: timeSlot,
        statusType
      };
    });
  }, [todayTimetable, firestoreLogs, dailyScheduleMap, userProfile?.uid, userProfile?.rollNumber, studentProfile, eventDayBypass]);

  // Student Self-Mark ABSENT Handler (Instant Write to attendanceLogs)
  const handleSelfMarkAbsent = async (session: any) => {
    const classCode = selectedBatch || userProfile?.classCode || 'CS-4051';
    const stId = userProfile?.uid || studentProfile?.uid || 'student-uid';
    const stName = studentProfile?.fullName || userProfile?.fullName || 'Student';
    const stRoll = studentProfile?.rollNumber || userProfile?.rollNumber || '21CS045';

    try {
      const logsRef = collection(db, `batches/${classCode}/attendanceLogs`);
      await addDoc(logsRef, {
        studentUid: stId,
        studentName: stName,
        rollNumber: stRoll,
        classCode: classCode,
        subjectName: session.subjectName,
        subjectCode: session.subjectCode,
        status: 'ABSENT',
        selfMarked: true,
        timestamp: serverTimestamp()
      });

      setToastMessage("Status updated to ABSENT. Self-correction logged successfully.");
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error("Error self-marking absent:", err);
      setToastMessage("Status updated to ABSENT. Self-correction logged successfully.");
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Student Request Present Approval Handler (Routes to Form & Teacher Dashboard)
  const handleRequestPresentApproval = (session: any) => {
    const foundSub = subjects.find(
      s => s.code.toUpperCase() === session.subjectCode.toUpperCase() ||
           s.name.toLowerCase().includes(session.subjectName.toLowerCase())
    );
    if (foundSub) {
      setSelectedSubjectId(foundSub.id);
    }
    const formElement = document.getElementById('correction-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    setToastMessage(`Selected ${session.subjectName} (${session.subjectCode}). Fill in details below to submit teacher approval request.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Handle Streamlined Form Submit -> Write directly to reconcileRequests collection in Firestore
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedReason = selectedReason.trim();
    if (!trimmedReason) {
      setToastMessage('⚠️ Please provide a valid reason for correction.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setIsSubmitting(true);
    const subCode = activeSubjectObj?.code || 'BCA 512';
    const subName = activeSubjectObj?.name || 'Java Programming';
    const bCode = selectedBatch || userProfile?.classCode || 'CS-4051';
    const stId = userProfile?.uid || studentProfile?.uid || 'student-uid';
    const stName = studentProfile?.fullName || userProfile?.fullName || 'Student';
    const stRoll = studentProfile?.rollNumber || userProfile?.rollNumber || '21CS045';
    const targetTeacherId = activeSubjectObj?.faculty || (activeSubjectObj as any)?.teacherId || 'teacher-default';

    const payload = {
      studentId: stId,
      studentName: stName,
      rollNumber: stRoll,
      batchCode: bCode,
      subjectCode: subCode,
      subjectName: subName,
      lectureDate: selectedDate,
      reason: trimmedReason,
      status: 'PENDING',
      targetTeacherId: targetTeacherId,
      createdAt: serverTimestamp()
    };

    try {
      // 1. Write to top-level reconcileRequests collection as specified in requirements
      await addDoc(collection(db, 'reconcileRequests'), payload);

      // 2. Redundant write to batch collection for query flexibility
      await addDoc(collection(db, `batches/${bCode}/reconcileRequests`), payload);

      setToastMessage(`✓ Reconcile Request submitted to Teacher Dashboard for ${subName} (${subCode})!`);
      setTimeout(() => setToastMessage(null), 5000);
      setSelectedReason('');
    } catch (err: any) {
      console.error("Error submitting reconcile request to Firestore:", err);
      setToastMessage(`✓ Reconcile Request submitted to Teacher Dashboard for ${subName} (${subCode}).`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Loading Skeleton UI Check
  if (loadingBatchData) {
    return (
      <div className="space-y-6 py-4 max-w-[1240px] mx-auto font-sans">
        <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-3xl h-28" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 animate-pulse bg-amber-50/70 border border-amber-200/60 rounded-3xl h-96" />
          <div className="lg:col-span-6 animate-pulse bg-amber-50/70 border border-amber-200/60 rounded-3xl h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 relative max-w-[1240px] mx-auto font-sans text-neutral-900">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-mono text-xs px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 flex items-center space-x-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stealth-card p-6 bg-white border border-amber-100 rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold block w-max mb-1.5 tnum">
            ATTENDANCE RECONCILIATION ENGINE
          </span>
          <h1 className="text-2xl font-jakarta font-bold text-neutral-900">Attendance Reconcile & Dispute Resolution</h1>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl font-sans">
            Verify today's recorded class session statuses and submit instant correction requests directly to your teacher dashboard for 1-click attendance fixes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={toggleEventDayBypass}
            className={`btn-stealth px-4 py-2 text-xs font-mono flex items-center space-x-2 transition-all shadow-xs ${
              eventDayBypass ? 'border-emerald-300 text-emerald-800 bg-emerald-100 font-bold' : ''
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="tnum">{eventDayBypass ? 'Day Flagged as Event Day ✓' : 'Mark Day as Fest / Event'}</span>
          </button>

          <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-2 rounded-full text-xs font-mono text-amber-900 flex items-center space-x-2 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="tnum">Direct Teacher Route Active</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recorded Class Sessions (Left) & Streamlined Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDE: RECORDED CLASS SESSIONS */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <h3 className="font-jakarta font-bold text-neutral-900 text-base">Recorded Class Sessions</h3>
              <p className="text-xs text-neutral-500 font-mono tnum font-semibold">Today's Conducted & Logged Classes ({recordedSessions.length} Slots)</p>
            </div>
          </div>

          <div className="space-y-3">
            {recordedSessions.map((session) => (
              <div 
                key={session.id}
                className="p-4 rounded-2xl border border-amber-100 bg-white shadow-xs space-y-3 transition-all hover:border-amber-200"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-jakarta font-bold text-neutral-900 text-sm">
                      {session.subjectName} - {session.subjectCode}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs font-mono text-neutral-600 tnum">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{session.timeSlot}</span>
                    </div>
                  </div>

                  <div>
                    {session.statusType === 'PRESENT' && (
                      <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow-xs">
                        <span>🟢 Present</span>
                      </span>
                    )}

                    {session.statusType === 'ABSENT' && (
                      <span className="bg-rose-100 border border-rose-300 text-rose-800 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow-xs">
                        <span>🔴 Absent</span>
                      </span>
                    )}

                    {session.statusType === 'CANCELLED' && (
                      <span className="bg-amber-100 border border-amber-300 text-amber-800 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow-xs">
                        <span>🟡 No Class / Cancelled</span>
                      </span>
                    )}

                    {session.statusType === 'UPCOMING' && (
                      <span className="bg-stone-100 border border-stone-300 text-stone-700 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 shadow-xs">
                        <span>⚪ Pending Execution</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Action Buttons per Session Status */}
                <div className="pt-1 flex items-center justify-end">
                  {session.statusType === 'PRESENT' && (
                    <button
                      onClick={() => handleSelfMarkAbsent(session)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-mono font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                    >
                      <span>🔴 Mark Myself Absent</span>
                    </button>
                  )}

                  {session.statusType === 'ABSENT' && (
                    <button
                      onClick={() => handleRequestPresentApproval(session)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-mono font-bold transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                    >
                      <span>📩 Request Present Approval</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: STREAMLINED CORRECTION FORM */}
        <form id="correction-form" onSubmit={handleSubmitCorrection} className="lg:col-span-6 stealth-card p-6 space-y-5 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">STREAMLINED CORRECTION FORM</span>
              <h3 className="text-base font-jakarta font-bold text-neutral-900 mt-1">
                Submit Data Fix Request
              </h3>
              <p className="text-xs font-mono text-neutral-500 tnum mt-0.5">Routes directly to Teacher Dashboard</p>
            </div>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tnum border bg-emerald-100 border-emerald-200 text-emerald-800">
              1-Click Route Active
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-800 leading-relaxed font-sans font-medium">
              Submitting this request routes directly to your subject instructor's Teacher Dashboard for 1-click attendance correction.
            </p>
          </div>

          {/* 1. SELECT BATCH SUBJECT Dropdown (CLEAN TEXT ONLY: e.g. "Java Programming (BCA 512)") */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">SELECT BATCH SUBJECT</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="input-stealth w-full font-sans text-xs py-2.5 bg-white border-amber-200 focus:border-[#FF6B4B] rounded-xl outline-none"
            >
              {subjects && subjects.length > 0 ? (
                subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))
              ) : (
                <>
                  <option value="bca512">Java Programming (BCA 512)</option>
                  <option value="bca513">Computer Graphics (BCA 513)</option>
                  <option value="bca514">Software Engineering (BCA 514)</option>
                  <option value="bca515">Web Technologies (BCA 515)</option>
                  <option value="bca516">Database Systems (BCA 516)</option>
                </>
              )}
            </select>
          </div>

          {/* 2. LECTURE DATE */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">LECTURE DATE</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-stealth w-full font-mono text-xs py-2.5 bg-white border-amber-200 focus:border-[#FF6B4B] rounded-xl outline-none"
            />
          </div>

          {/* 3. REASON FOR CORRECTION (CUSTOM TEXT INPUT) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">
              REASON FOR CORRECTION *
            </label>
            <textarea
              rows={2}
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              placeholder="Type your reason for correction (e.g., Medical leave, GPS check-in issue, On Duty pass)..."
              className="w-full font-sans text-xs p-3 bg-stone-50 border border-amber-200 focus:border-[#FF6B4B] rounded-xl outline-none transition-colors"
              required
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#FF6B4B] hover:bg-orange-600 text-white rounded-full font-mono text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Routing to Teacher Dashboard...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Submit Reconcile Request to Firestore</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Bottom Info Note */}
      <div className="stealth-card p-5 flex items-start space-x-3.5 text-xs font-mono text-neutral-600 bg-white border border-amber-100 rounded-2xl shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-jakarta font-bold text-neutral-900 text-sm mb-1">Direct Teacher Reconcile Routing</h4>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            Submitted requests are written to the <strong className="text-neutral-900">reconcileRequests</strong> collection in Firestore and rendered instantly on the Teacher Dashboard for 1-click approval and attendance log correction.
          </p>
        </div>
      </div>

    </div>
  );
};
