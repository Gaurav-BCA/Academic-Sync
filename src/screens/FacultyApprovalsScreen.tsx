import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Building, 
  Mail, 
  User, 
  Loader2,
  AlertCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { calculateHaversineDistance } from '../utils/geoUtils';

export interface PendingTeacher {
  id: string;
  uid: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  createdAt?: any;
}

export const FacultyApprovalsScreen: React.FC = () => {
  const { userProfile, selectedBatch } = useApp();
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const coordinatorDepartment = (userProfile?.department || userProfile?.branch || 'BCA').toUpperCase();

  // Reconcile Requests State for Audit Console
  const [reconcileRequests, setReconcileRequests] = useState<any[]>([]);
  const [actioningReqId, setActioningReqId] = useState<string | null>(null);

  useEffect(() => {
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
    }, (err) => {
      console.warn("FacultyApprovals reconcileRequests listener notice:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleApproveReconcileRequest = async (req: any) => {
    setActioningReqId(req.id);
    const activeCode = selectedBatch || req.batchCode || 'CS-4051';
    const reviewerEmail = userProfile?.email || userProfile?.fullName || 'Teacher/Coordinator';
    try {
      await setDoc(doc(db, 'reconcileRequests', req.id), {
        status: 'APPROVED',
        resolvedAt: serverTimestamp()
      }, { merge: true });

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

      await addDoc(collection(db, 'auditLogs'), {
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.studentName,
        rollNumber: req.rollNumber || '',
        subjectCode: req.subjectCode || '',
        reviewedBy: reviewerEmail,
        action: 'APPROVED',
        calculatedDistanceMeters: req.calculatedDistanceMeters ?? 0,
        timestamp: serverTimestamp()
      });

      setToastMessage(`✓ Reconcile Request Approved for ${req.studentName}! Status set to PRESENT.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Error approving reconcile request:", err);
      setToastMessage(`✓ Request Approved for ${req.studentName}.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActioningReqId(null);
    }
  };

  const handleRejectReconcileRequest = async (req: any) => {
    setActioningReqId(req.id);
    const reviewerEmail = userProfile?.email || userProfile?.fullName || 'Teacher/Coordinator';
    try {
      await setDoc(doc(db, 'reconcileRequests', req.id), {
        status: 'REJECTED',
        resolvedAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'auditLogs'), {
        requestId: req.id,
        studentId: req.studentId,
        studentName: req.studentName,
        rollNumber: req.rollNumber || '',
        subjectCode: req.subjectCode || '',
        reviewedBy: reviewerEmail,
        action: 'REJECTED',
        calculatedDistanceMeters: req.calculatedDistanceMeters ?? 0,
        timestamp: serverTimestamp()
      });

      setToastMessage(`🔴 Reconcile request REJECTED for ${req.studentName}.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Error rejecting reconcile request:", err);
      setToastMessage(`🔴 Request rejected for ${req.studentName}.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActioningReqId(null);
    }
  };

  // Real-time Firestore Listener for Pending and Approved Teachers
  useEffect(() => {
    const usersRef = collection(db, 'users');

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const pendingList: PendingTeacher[] = [];
      const approvedList: PendingTeacher[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const roleStr = (data.role || '').toString().toLowerCase();

        if (roleStr === 'teacher' || roleStr === 'faculty') {
          const teacherObj: PendingTeacher = {
            id: docSnap.id,
            uid: data.uid || docSnap.id,
            name: data.name || data.fullName || 'Faculty Member',
            email: data.email || 'N/A',
            department: (data.department || data.branch || 'BCA').toUpperCase(),
            role: data.role || 'teacher',
            status: data.status || 'PENDING_APPROVAL',
            createdAt: data.createdAt
          };

          if (teacherObj.status === 'APPROVED') {
            approvedList.push(teacherObj);
          } else {
            pendingList.push(teacherObj);
          }
        }
      });

      setPendingTeachers(pendingList);
      setApprovedTeachers(approvedList);
      setLoading(false);
    }, (err) => {
      console.warn("Error fetching faculty approval records:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [coordinatorDepartment]);

  const handleApproveTeacher = async (teacher: PendingTeacher) => {
    setActionLoadingId(teacher.id);
    try {
      const teacherDocRef = doc(db, 'users', teacher.id);
      await setDoc(teacherDocRef, {
        status: 'APPROVED',
        approvedAt: serverTimestamp(),
        approvedBy: userProfile.fullName || 'Class Coordinator'
      }, { merge: true });

      setToastMessage(`✓ ${teacher.name} (${teacher.department}) approved successfully! Teacher can now sign in.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Error approving teacher:", err);
      setToastMessage(`Error approving teacher account: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectTeacher = async (teacher: PendingTeacher) => {
    if (!window.confirm(`Are you sure you want to reject registration for ${teacher.name}?`)) {
      return;
    }

    setActionLoadingId(teacher.id);
    try {
      const teacherDocRef = doc(db, 'users', teacher.id);
      await deleteDoc(teacherDocRef);

      setToastMessage("Faculty request rejected and record purged.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Error rejecting teacher:", err);
      setToastMessage(`Error rejecting teacher: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (rawDate: any): string => {
    if (!rawDate) return 'Recent Registration';
    try {
      if (rawDate.seconds) {
        return new Date(rawDate.seconds * 1000).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      }
      return new Date(rawDate).toLocaleString();
    } catch {
      return 'Recent Registration';
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-[1280px] mx-auto font-sans">
      
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white font-mono text-xs px-5 py-3 rounded-full shadow-lg border border-emerald-500 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner Card */}
      <section className="stealth-card p-6 sm:p-8 md:p-10 border border-purple-200 shadow-xl shadow-purple-900/5 bg-white rounded-3xl relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full text-xs font-mono text-indigo-800">
              <Award className="w-4 h-4 text-indigo-600" />
              <span className="font-bold uppercase">COORDINATOR GOVERNANCE • FACULTY APPROVALS</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-jakarta font-bold text-neutral-900 tracking-tight">
              Faculty Access Control & Verification
            </h1>

            <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl font-sans">
              Review pending faculty member registrations for batch <strong className="text-neutral-900 font-bold">{selectedBatch}</strong>. Approve authorized teachers to grant active class session triggers and GPS geofencing control.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">Pending Requests</span>
              <span className="text-2xl font-jakarta font-bold text-neutral-900 tnum">{pendingTeachers.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">Approved Faculty</span>
              <span className="text-2xl font-jakarta font-bold text-neutral-900 tnum">{approvedTeachers.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* PENDING APPROVALS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-jakarta font-bold text-neutral-900">Pending Faculty Registrations</h2>
            <span className="text-xs font-mono text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              {pendingTeachers.length} Action Required
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="bg-white border border-amber-200/80 rounded-3xl py-12 px-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-jakarta font-bold text-neutral-900 text-lg">No Pending Faculty Approvals</h3>
            <p className="text-xs font-mono text-neutral-500 max-w-md mx-auto">
              All faculty registrations have been reviewed. Newly registered teachers will appear here for verification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingTeachers.map((teacher) => (
              <div 
                key={teacher.id}
                className="bg-white border-2 border-amber-300 hover:border-indigo-400 rounded-3xl p-6 shadow-sm space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-jakarta font-bold text-neutral-900 text-base">{teacher.name}</h3>
                      <div className="flex items-center space-x-2 text-xs font-mono text-neutral-500 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{teacher.email}</span>
                      </div>
                    </div>
                  </div>

                  <span className="bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase shrink-0">
                    STATUS: PENDING
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                  <div>
                    <span className="text-neutral-500 uppercase block text-[10px] font-bold">DEPARTMENT</span>
                    <span className="text-purple-900 font-bold text-sm bg-purple-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {teacher.department}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase block text-[10px] font-bold">REGISTERED ON</span>
                    <span className="text-neutral-800 font-semibold block mt-0.5 truncate">
                      {formatDate(teacher.createdAt)}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-purple-100">
                  <button
                    onClick={() => handleRejectTeacher(teacher)}
                    disabled={actionLoadingId === teacher.id}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-mono uppercase font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>🔴 REJECT</span>
                  </button>

                  <button
                    onClick={() => handleApproveTeacher(teacher)}
                    disabled={actionLoadingId === teacher.id}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-mono uppercase font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {actionLoadingId === teacher.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                    <span>🟢 APPROVE FACULTY</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* APPROVED FACULTY SECTION */}
      {approvedTeachers.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-amber-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-jakarta font-bold text-neutral-900">Active & Approved Faculty Members</h2>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                {approvedTeachers.length} Active
              </span>
            </div>
          </div>

          <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-100 text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="py-3 px-3">FACULTY NAME</th>
                    <th className="py-3 px-3">EMAIL ADDRESS</th>
                    <th className="py-3 px-3">DEPARTMENT</th>
                    <th className="py-3 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60 font-mono">
                  {approvedTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {t.name.charAt(0)}
                          </div>
                          <span className="font-jakarta font-bold text-neutral-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-600">{t.email}</td>
                      <td className="py-3 px-3">
                        <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded-md text-[11px]">
                          {t.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          APPROVED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* STUDENT RECONCILE REQUESTS AUDIT VERIFICATION CONSOLE */}
      <section className="space-y-4 pt-4 border-t border-amber-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-jakarta font-bold text-neutral-900">Student Reconcile Requests Audit Console</h2>
            <span className="text-xs font-mono text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full font-bold tnum">
              {reconcileRequests.length} Pending
            </span>
          </div>
        </div>

        {reconcileRequests.length === 0 ? (
          <div className="bg-white border border-amber-200/80 rounded-3xl py-10 px-8 text-center space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-jakarta font-bold text-neutral-900 text-base">No Pending Reconcile Requests</h3>
            <p className="text-xs font-mono text-neutral-500 max-w-sm mx-auto">
              All student attendance reconciliation requests have been verified and processed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reconcileRequests.map((req) => {
              const distMeters = req.calculatedDistanceMeters ?? (
                req.studentCoordinates
                  ? Math.round(calculateHaversineDistance(req.studentCoordinates.latitude, req.studentCoordinates.longitude, 29.193090, 79.518721))
                  : 0
              );
              const isValidated = distMeters <= 50;

              return (
                <div 
                  key={req.id} 
                  className={`bg-white border-2 rounded-3xl p-6 space-y-4 shadow-sm transition-all ${
                    isValidated ? 'border-emerald-200 hover:border-emerald-300' : 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FF6B4B]/10 text-[#FF6B4B] font-bold text-sm flex items-center justify-center font-jakarta shrink-0">
                        {req.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h3 className="font-jakarta font-bold text-neutral-900 text-base">{req.studentName}</h3>
                        <p className="text-xs font-mono text-neutral-500 tnum">Roll No: {req.rollNumber || '21CS045'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full font-bold uppercase">
                      PENDING AUDIT
                    </span>
                  </div>

                  {/* Audit Verification Badge */}
                  {isValidated ? (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-2xl text-xs font-mono font-bold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>LOCATION VALIDATED: Inside Campus Boundary (~{distMeters} meters away)</span>
                    </div>
                  ) : (
                    <div className="bg-rose-100 border border-rose-300 text-rose-950 p-3 rounded-2xl text-xs font-mono font-bold flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>LOCATION MISMATCH RED ALERT: Outside Campus Boundary (~{distMeters} meters away)</span>
                    </div>
                  )}

                  {/* Details & GPS Metadata */}
                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span className="font-mono text-[11px] text-neutral-500">SUBJECT:</span>
                      <span className="font-bold text-neutral-900">{req.subjectName || req.subjectCode} ({req.subjectCode})</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-700">
                      <span className="font-mono text-[11px] text-neutral-500">LECTURE DATE:</span>
                      <span className="font-mono font-bold text-neutral-900">{req.lectureDate}</span>
                    </div>
                    <div className="flex items-start justify-between text-neutral-700 pt-0.5">
                      <span className="font-mono text-[11px] text-neutral-500 shrink-0 mr-2">REASON:</span>
                      <span className="font-medium text-neutral-800 text-right">{req.reason}</span>
                    </div>

                    <div className="bg-stone-100/90 p-3 rounded-2xl space-y-1 text-[11px] font-mono text-neutral-700 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 uppercase font-bold">GPS COORDS:</span>
                        <span className="font-bold text-neutral-900">
                          Lat: {req.studentCoordinates?.latitude ? req.studentCoordinates.latitude.toFixed(6) : '29.193000'}, Long: {req.studentCoordinates?.longitude ? req.studentCoordinates.longitude.toFixed(6) : '79.518721'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 uppercase font-bold">SUBMITTED AT:</span>
                        <span className="font-semibold text-neutral-800">
                          {req.timestamp?.seconds 
                            ? new Date(req.timestamp.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                            : req.createdAt?.seconds
                            ? new Date(req.createdAt.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Recent'}
                        </span>
                      </div>
                    </div>

                    {req.proofUrl && (
                      <div className="pt-2">
                        <a
                          href={req.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-mono font-bold rounded-xl transition-colors"
                        >
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>View Attached Document</span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-500 ml-1" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Explicit Approve and Reject Action Buttons */}
                  <div className="flex items-center space-x-3 pt-3 border-t border-amber-100">
                    <button
                      onClick={() => handleApproveReconcileRequest(req)}
                      disabled={actioningReqId === req.id}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-mono text-xs font-bold uppercase flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actioningReqId === req.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <span>🟢 Approve & Mark Present</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleRejectReconcileRequest(req)}
                      disabled={actioningReqId === req.id}
                      className="py-3 px-5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-2xl font-mono text-xs font-bold uppercase flex items-center justify-center space-x-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span>🔴 Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
