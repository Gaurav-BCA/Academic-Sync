import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileText, 
  Calendar,
  Check,
  Info,
  Send,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useOnboarding } from '../context/OnboardingContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const ReconcileScreen: React.FC = () => {
  const { 
    userProfile,
    subjects,
    loadingBatchData,
    reconciliationRecords = [], 
    submittedCorrectionIds = [], 
    submitCorrection, 
    eventDayBypass = false, 
    toggleEventDayBypass 
  } = useApp();

  const { studentProfile, coordinatorProfile } = useOnboarding();

  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedReason, setSelectedReason] = useState<string>('present_issue');
  const [customNote, setCustomNote] = useState<string>('');
  const [fileUploaded, setFileUploaded] = useState<string | null>(null);
  const [fixingClassId, setFixingClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Safe fixingClass reference with optional chaining fallback
  const fixingClass = useMemo(() => {
    if (!reconciliationRecords || reconciliationRecords.length === 0) return null;
    return reconciliationRecords.find(r => r.id === fixingClassId) || reconciliationRecords[0] || null;
  }, [reconciliationRecords, fixingClassId]);

  const isFixingClassSubmitted = fixingClass ? submittedCorrectionIds.includes(fixingClass.id) : false;

  // Selected subject from AppContext dynamic subjects list
  const activeSubjectObj = useMemo(() => {
    if (!subjects || subjects.length === 0) return null;
    if (!selectedSubjectId) return subjects[0];
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0];
  }, [subjects, selectedSubjectId]);

  // Dynamic counter for unhandled flagged items
  const needsActionCount = useMemo(() => {
    if (!reconciliationRecords) return 0;
    return reconciliationRecords.filter(
      r => r && r.status === 'flagged' && !submittedCorrectionIds.includes(r.id) && !eventDayBypass
    ).length;
  }, [reconciliationRecords, submittedCorrectionIds, eventDayBypass]);

  const confirmedPresentCount = useMemo(() => {
    if (!reconciliationRecords) return 0;
    return reconciliationRecords.filter(
      r => r && (r.status === 'immutable' || (r.status === 'flagged' && (submittedCorrectionIds.includes(r.id) || eventDayBypass)))
    ).length;
  }, [reconciliationRecords, submittedCorrectionIds, eventDayBypass]);

  const handleFileUpload = () => {
    setFileUploaded('Attendance_Duty_Pass.pdf');
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const subCode = activeSubjectObj?.code || fixingClass?.subjectCode || 'BCA 512';
    const subName = activeSubjectObj?.name || fixingClass?.subjectName || 'Java Programming';

    try {
      // 1. Write directly to Firestore reconciliations collection
      await addDoc(collection(db, 'reconciliations'), {
        uid: userProfile?.uid || 'guest-uid',
        studentName: studentProfile?.fullName || coordinatorProfile?.fullName || userProfile?.fullName || 'Student',
        rollNumber: studentProfile?.rollNumber || userProfile?.rollNumber || 'N/A',
        classCode: userProfile?.classCode || 'CS-8849',
        subjectCode: subCode,
        subjectName: subName,
        date: selectedDate,
        reasonCategory: selectedReason,
        reasonNote: customNote.trim(),
        proofDoc: fileUploaded || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Update local AppContext state
      if (fixingClass?.id) {
        submitCorrection(fixingClass.id, selectedReason, fileUploaded);
      }

      setToastMessage(`Correction request submitted to Firestore for ${subName} (${subCode}).`);
      setTimeout(() => setToastMessage(null), 4000);
      setCustomNote('');
    } catch (err) {
      console.error("Firestore reconciliation write error:", err);
      setToastMessage(`Failed to record request in Firestore. Please try again.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Loading Skeleton UI Check
  if (loadingBatchData) {
    return (
      <div className="space-y-6 py-4 max-w-[1240px] mx-auto font-sans">
        <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-3xl h-28" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-2xl h-24" />
          <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-2xl h-24" />
          <div className="animate-pulse bg-amber-100/60 border border-amber-200/60 rounded-2xl h-24" />
        </div>
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
          <h1 className="text-2xl font-jakarta font-bold text-neutral-900">Attendance Correction & Peer Review</h1>
          <p className="text-xs text-neutral-600 mt-1 max-w-2xl font-sans">
            Verify lecture presence logs, attach official duty proofs, and submit formal discrepancy correction requests directly to your batch record in Firestore.
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
            <span className="tnum">Same-day corrections window active</span>
          </div>
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stealth-card p-5 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase font-bold">BATCH COURSES</p>
            <p className="text-2xl font-jakarta font-bold text-neutral-900 tnum">
              {String(subjects?.length || 0).padStart(2, '0')} <span className="text-xs text-neutral-500 font-mono font-normal">Active Subjects</span>
            </p>
          </div>
        </div>

        <div className="stealth-card p-5 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase font-bold">CONFIRMED LOGS</p>
            <p className="text-2xl font-jakarta font-bold text-emerald-700 tnum">
              {String(confirmedPresentCount).padStart(2, '0')} <span className="text-xs text-neutral-500 font-mono font-normal">Checked In</span>
            </p>
          </div>
        </div>

        <div className="stealth-card p-5 bg-white border border-amber-100 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase font-bold">NEEDS YOUR ACTION</p>
            <p className="text-2xl font-jakarta font-bold text-rose-600 tnum">
              {String(needsActionCount).padStart(2, '0')} <span className="text-xs text-neutral-500 font-mono font-normal">Flagged / Pending</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Class Records (Left) & Dynamic Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Class Records */}
        <div className="lg:col-span-6 stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <h3 className="font-jakarta font-bold text-neutral-900 text-base">Recorded Class Sessions</h3>
              <p className="text-xs text-neutral-500 font-mono tnum font-semibold">{reconciliationRecords.length} Sessions Logged Today</p>
            </div>
          </div>

          {reconciliationRecords.length === 0 ? (
            <div className="text-center py-10 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-jakarta font-bold text-neutral-900 text-sm">All Class Logs Compliant</p>
              <p className="text-xs font-mono text-neutral-500 max-w-xs mx-auto">No flagged attendance anomalies detected for your user session today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reconciliationRecords.map((rec) => {
                const isFlagged = rec.status === 'flagged';
                const isSubmitted = submittedCorrectionIds.includes(rec.id);
                const isSelected = fixingClassId === rec.id;

                return (
                  <div 
                    key={rec.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      isFlagged && !isSubmitted && !eventDayBypass
                        ? 'bg-rose-50/70 border-rose-200'
                        : rec.status === 'exempted' || eventDayBypass
                        ? 'bg-purple-50/60 border-purple-200'
                        : 'bg-white border-amber-100 shadow-xs'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-xs font-mono text-neutral-500 tnum">
                        <span className="font-bold">{rec.time}</span>
                        <span>•</span>
                        <span className="text-neutral-900 font-bold">{rec.subjectCode}</span>
                      </div>
                      <h4 className="font-jakarta font-bold text-neutral-900 text-sm">{rec.subjectName}</h4>
                      <p className={`text-xs font-mono tnum ${
                        eventDayBypass
                          ? 'text-emerald-700 font-bold'
                          : isFlagged && !isSubmitted
                          ? 'text-rose-600 font-bold'
                          : isFlagged && isSubmitted
                          ? 'text-emerald-700 font-bold'
                          : 'text-neutral-500'
                      }`}>
                        ● {eventDayBypass ? 'Fest / Event Day Override ✓' : isFlagged && isSubmitted ? 'Correction Submitted ✓' : isFlagged ? 'Marked Absent / Check-in Issue' : rec.status === 'exempted' ? 'Free Period / Class Exempted' : 'Present • Auto-Checked'}
                      </p>
                    </div>

                    <div>
                      {rec.status === 'immutable' && (
                        <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-mono flex items-center space-x-1 font-bold tnum">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Confirmed</span>
                        </span>
                      )}
                      {rec.status === 'exempted' && (
                        <span className="bg-purple-100 border border-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-mono font-bold tnum">
                          Exempted
                        </span>
                      )}
                      {isFlagged && !isSubmitted && !eventDayBypass && (
                        <button 
                          onClick={() => {
                            setFixingClassId(rec.id);
                            const foundSub = subjects.find(s => s.code === rec.subjectCode || s.name === rec.subjectName);
                            if (foundSub) setSelectedSubjectId(foundSub.id);
                          }}
                          className={`btn-primary px-4 py-1.5 text-xs font-mono font-bold bg-[#FF6B4B] hover:bg-orange-600 text-white border-none shadow-sm rounded-full ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
                        >
                          Fix This
                        </button>
                      )}
                      {isFlagged && (isSubmitted || eventDayBypass) && (
                        <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-mono font-bold tnum">
                          Submitted ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Form (Real Firestore Write) */}
        <form onSubmit={handleSubmitCorrection} className="lg:col-span-6 stealth-card p-6 space-y-5 bg-white border border-amber-100 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <div>
              <span className="text-[10px] font-mono text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">FIRESTORE CORRECTION FORM</span>
              <h3 className="text-base font-jakarta font-bold text-neutral-900 mt-1">
                {activeSubjectObj ? `${activeSubjectObj.name} (${activeSubjectObj.code})` : fixingClass ? `${fixingClass.subjectName} (${fixingClass.subjectCode})` : 'Select Batch Subject'}
              </h3>
              <p className="text-xs font-mono text-neutral-500 tnum mt-0.5">Cohort Code: {userProfile?.classCode || 'CS-8849'}</p>
            </div>
            <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tnum border ${
              isFixingClassSubmitted 
                ? 'bg-emerald-100 border-emerald-200 text-emerald-800' 
                : 'bg-rose-100 border-rose-200 text-rose-800'
            }`}>
              {isFixingClassSubmitted ? 'Submitted' : 'Form Active'}
            </span>
          </div>

          {/* Explanation Alert Box */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-800 leading-relaxed font-sans font-medium">
              Submitting this form creates an official correction record in Firestore. Your Class Coordinator and course instructor will review the attached proof.
            </p>
          </div>

          {/* 1. SELECT SUBJECT (Dynamic from Firestore batchData) */}
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
                    {sub.name} ({sub.code}) — Faculty: {sub.faculty}
                  </option>
                ))
              ) : (
                <>
                  <option value="bca512">Java Programming (BCA 512)</option>
                  <option value="bca513">Computer Graphics (BCA 513)</option>
                  <option value="bca514">Software Engineering (BCA 514)</option>
                  <option value="bca515">Web Technologies (BCA 515)</option>
                </>
              )}
            </select>
          </div>

          {/* 2. SELECT DATE (Calendar Picker) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">LECTURE DATE</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-stealth w-full font-mono text-xs py-2.5 bg-white border-amber-200 focus:border-[#FF6B4B] rounded-xl outline-none"
            />
          </div>

          {/* 3. REASON CATEGORY */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">CATEGORY / REASON</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="input-stealth w-full font-sans text-xs py-2.5 bg-white border-amber-200 focus:border-[#FF6B4B] rounded-xl outline-none"
            >
              <option value="present_issue">Present in class (Technical / BLE / GPS check-in error)</option>
              <option value="event_day">College Event / Fest / Institutional Duty Leave</option>
              <option value="other_proof">Medical Leave / Special Approval (Proof Document Attached)</option>
            </select>
          </div>

          {/* 4. CUSTOM REASON NOTE (Text Area) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">STUDENT EXPLANATION NOTE</label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Provide context for faculty review (e.g. Attended lecture in LH-302, phone battery died during attendance broadcast)..."
              className="w-full font-sans text-xs p-3 bg-stone-50 border border-amber-200/80 focus:border-[#FF6B4B] rounded-xl outline-none transition-colors"
            />
          </div>

          {/* 5. OPTIONAL PROOF DOCUMENT UPLOAD */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-neutral-700 uppercase block font-bold">ATTACH PROOF DOCUMENT (OPTIONAL)</label>
            <div 
              onClick={handleFileUpload}
              className="border border-dashed border-amber-200 hover:border-[#FF6B4B] bg-amber-50/50 rounded-2xl p-3.5 text-center cursor-pointer transition-colors space-y-1"
            >
              <Upload className="w-5 h-5 mx-auto text-[#FF6B4B]" />
              {fileUploaded ? (
                <p className="text-xs text-emerald-700 font-mono font-bold">✓ Attached: {fileUploaded}</p>
              ) : (
                <>
                  <p className="text-xs text-neutral-800 font-semibold">Click to upload duty slip or medical pass</p>
                  <p className="text-[10px] text-neutral-500 font-mono">PDF, PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#FF6B4B] hover:bg-orange-600 text-white rounded-full font-mono text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Submitting to Firestore...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Submit Reconcile Request to Firestore</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomNote('');
                setFileUploaded(null);
                setSelectedReason('present_issue');
              }}
              className="w-full py-2 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Reset Form Fields
            </button>
          </div>
        </form>

      </div>

      {/* Bottom Info Note */}
      <div className="stealth-card p-5 flex items-start space-x-3.5 text-xs font-mono text-neutral-600 bg-white border border-amber-100 rounded-2xl shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-jakarta font-bold text-neutral-900 text-sm mb-1">Daily Reconciliation Policy</h4>
          <p className="text-xs text-neutral-600 leading-relaxed font-sans">
            Submitted requests are written to the <strong className="text-neutral-900">reconciliations</strong> collection in Firestore and made visible to your Class Coordinator. Ensures transparency and full compliance with institutional attendance policies.
          </p>
        </div>
      </div>

    </div>
  );
};
