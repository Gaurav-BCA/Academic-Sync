import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText,
  AlertCircle,
  X,
  History,
  Mail
} from 'lucide-react';
import { 
  StudentDetail, 
  LectureRecord, 
  AuditLogEntry, 
  INITIAL_BATCH_STUDENTS 
} from '../data/manageStudentsData';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { useOnboarding } from '../context/OnboardingContext';

const LS_STUDENTS_KEY = 'academicsync_managedStudents';
const LS_AUDIT_KEY = 'academicsync_auditLogs';

export const ManageStudentsScreen: React.FC = () => {
  const { userProfile } = useApp();
  const { coordinatorProfile } = useOnboarding();
  const currentBatchCode = userProfile?.classCode || coordinatorProfile?.classCode || 'CS-8849';

  // Load students state
  const [students, setStudents] = useState<StudentDetail[]>(() => {
    try {
      const stored = localStorage.getItem(LS_STUDENTS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_BATCH_STUDENTS;
    } catch {
      return INITIAL_BATCH_STUDENTS;
    }
  });

  // Load audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LS_AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Edit modal state
  const [editingLecture, setEditingLecture] = useState<{
    studentId: string;
    lecture: LectureRecord;
  } | null>(null);

  const [newStatus, setNewStatus] = useState<'Present' | 'Absent'>('Present');
  const [editReason, setEditReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuditLogsView, setShowAuditLogsView] = useState(false);

  // ──────────────────────────────────────────
  // REAL-TIME FIRESTORE LISTENER FOR STUDENTS
  // Query users collection where classCode == currentCoordinatorBatchCode and role == "student"
  // ──────────────────────────────────────────
  useEffect(() => {
    if (!currentBatchCode) return;

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('classCode', '==', currentBatchCode),
      where('role', '==', 'student')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveStudents: StudentDetail[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const existingStudent = students.find(s => s.rollNumber === data.rollNumber || s.email === data.email);
        
        liveStudents.push({
          id: docSnap.id,
          name: data.name || data.fullName || 'Student',
          rollNumber: data.rollNumber || 'N/A',
          email: data.email || 'N/A',
          subjects: existingStudent?.subjects || INITIAL_BATCH_STUDENTS[0].subjects,
          lectures: existingStudent?.lectures || INITIAL_BATCH_STUDENTS[0].lectures
        });
      });

      if (liveStudents.length > 0) {
        setStudents(liveStudents);
      }
    }, (err) => {
      console.warn("Firestore student roster listener notice:", err);
    });

    return () => unsubscribe();
  }, [currentBatchCode]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_STUDENTS_KEY, JSON.stringify(students));
    } catch {
      // noop
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_AUDIT_KEY, JSON.stringify(auditLogs));
    } catch {
      // noop
    }
  }, [auditLogs]);

  // Selected student details
  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Filtered students list
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper: compute overall student attendance percentage
  const calculateOverallPct = (student: StudentDetail): number => {
    const totalAttended = student.subjects.reduce((acc, sub) => acc + sub.attended, 0);
    const totalClasses = student.subjects.reduce((acc, sub) => acc + sub.total, 0);
    if (totalClasses === 0) return 0;
    return Math.round((totalAttended / totalClasses) * 1000) / 10;
  };

  // Open edit modal for a lecture
  const handleOpenEditModal = (studentId: string, lecture: LectureRecord) => {
    setEditingLecture({ studentId, lecture });
    setNewStatus(lecture.status);
    setEditReason('');
    setReasonError('');
  };

  // Save edited lecture status with mandatory reason and audit entry
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecture) return;

    if (!editReason.trim()) {
      setReasonError('A valid reason or audit note is required before saving changes.');
      return;
    }

    const { studentId, lecture } = editingLecture;
    const oldStatus = lecture.status;

    if (oldStatus === newStatus && !editReason.trim()) {
      setEditingLecture(null);
      return;
    }

    const timestampStr = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // 1. Create Audit Log entry
    const studentObj = students.find(s => s.id === studentId);
    const newAuditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      studentId,
      studentName: studentObj?.name || 'Unknown Student',
      rollNumber: studentObj?.rollNumber || 'N/A',
      lectureId: lecture.id,
      subjectCode: lecture.subjectCode,
      subjectName: lecture.subjectName,
      date: lecture.date,
      oldStatus,
      newStatus,
      reason: editReason.trim(),
      editedBy: 'Class Coordinator',
      timestamp: timestampStr
    };

    setAuditLogs(prev => [newAuditEntry, ...prev]);

    // 2. Update Students state
    setStudents(prevStudents => {
      return prevStudents.map(student => {
        if (student.id !== studentId) return student;

        // Update lecture record
        const updatedLectures = student.lectures.map(lec => {
          if (lec.id !== lecture.id) return lec;
          return {
            ...lec,
            status: newStatus,
            lastEditedAt: timestampStr,
            lastEditedBy: 'Class Coordinator',
            editReason: editReason.trim()
          };
        });

        // Recalculate subject attendance count if status changed
        let updatedSubjects = student.subjects;
        if (oldStatus !== newStatus) {
          const delta = newStatus === 'Present' ? 1 : -1;
          updatedSubjects = student.subjects.map(sub => {
            if (sub.subjectCode !== lecture.subjectCode) return sub;
            const newAttended = Math.max(0, Math.min(sub.total, sub.attended + delta));
            const newPct = Math.round((newAttended / sub.total) * 1000) / 10;
            return {
              ...sub,
              attended: newAttended,
              percentage: newPct
            };
          });
        }

        return {
          ...student,
          subjects: updatedSubjects,
          lectures: updatedLectures
        };
      });
    });

    // Close modal & display feedback toast
    setEditingLecture(null);
    setToastMessage(`Attendance for ${studentObj?.name} (${lecture.subjectCode}) updated to ${newStatus}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-medium text-xs px-5 py-3 rounded-full shadow-lg shadow-emerald-900/10 border border-emerald-500 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="stealth-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">
              CLASS COORDINATOR MANAGEMENT PORTAL • BATCH {currentBatchCode}
            </span>
            <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-[9px] rounded-full font-mono font-bold uppercase">
              LIVE FIRESTORE SNAPSHOT
            </span>
          </div>
          <h1 className="text-2xl font-jakarta font-bold text-neutral-900">Class Roster & Student Attendance Management</h1>
          <p className="text-xs text-neutral-600 mt-1 font-sans">
            Review live student roster registered under class batch code <strong className="font-mono text-[#FF6B4B]">{currentBatchCode}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAuditLogsView(!showAuditLogsView)}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all ${
              showAuditLogsView 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : 'bg-amber-50 hover:bg-amber-100 text-neutral-800 border border-amber-200/80 shadow-sm'
            }`}
          >
            <History className={`w-4 h-4 ${showAuditLogsView ? 'text-indigo-200' : 'text-indigo-600'}`} />
            <span>{showAuditLogsView ? 'View Roster' : `Audit Trail (${auditLogs.length})`}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Overlay View */}
      {showAuditLogsView ? (
        <div className="stealth-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-amber-100">
            <div>
              <h2 className="text-lg font-jakarta font-bold text-neutral-900 flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Coordinator Edit History & Audit Trail</span>
              </h2>
              <p className="text-xs text-neutral-500 font-sans mt-0.5">
                Complete record of manual attendance overrides and reasons logged by the Class Coordinator.
              </p>
            </div>
            <button
              onClick={() => setShowAuditLogsView(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-neutral-800 border border-amber-200/80 shadow-sm"
            >
              Back to Students List
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-xs text-neutral-400">
              <FileText className="w-10 h-10 mx-auto text-amber-200" />
              <p className="font-semibold text-neutral-600">No manual attendance overrides recorded yet.</p>
              <p className="text-[11px]">When you edit a student's lecture record, a permanent audit entry will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-100 text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="py-3 px-3">TIMESTAMP</th>
                    <th className="py-3 px-3">STUDENT</th>
                    <th className="py-3 px-3">SUBJECT & DATE</th>
                    <th className="py-3 px-3">CHANGE</th>
                    <th className="py-3 px-3">REASON / AUDIT NOTE</th>
                    <th className="py-3 px-3 text-right">EDITED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3 px-3 text-neutral-500 text-[11px] font-mono tnum">{log.timestamp}</td>
                      <td className="py-3 px-3">
                        <span className="text-neutral-900 font-bold block">{log.studentName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono block tnum">{log.rollNumber}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-indigo-600 font-bold font-mono block">{log.subjectCode}</span>
                        <span className="text-[10px] text-neutral-500 block">{log.date}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5 text-[11px] font-mono">
                          <span className={log.oldStatus === 'Present' ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                            {log.oldStatus}
                          </span>
                          <span className="text-neutral-400">→</span>
                          <span className={`font-bold ${log.newStatus === 'Present' ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {log.newStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-neutral-700 text-[11px] max-w-xs leading-normal italic">
                        "{log.reason}"
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-500 text-[11px]">
                        {log.editedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : !selectedStudent ? (
        /* ── Main View: Students Roster List ── */
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stealth-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">ENROLLED BATCH STUDENTS</span>
                <div className="text-3xl font-jakarta font-bold text-neutral-900 mt-1 tnum">{students.length}</div>
                <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">Active Cohort {currentBatchCode}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B4B]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="stealth-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">BATCH AVG ATTENDANCE</span>
                <div className="text-3xl font-jakarta font-bold text-neutral-900 mt-1 tnum">
                  {students.length > 0 ? (Math.round(students.reduce((acc, s) => acc + calculateOverallPct(s), 0) / students.length * 10) / 10) : 0}%
                </div>
                <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">Compliant (&gt;75%)</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="stealth-card p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">AUDIT OVERRIDES LOGGED</span>
                <div className="text-3xl font-jakarta font-bold text-neutral-900 mt-1 tnum">{auditLogs.length}</div>
                <span className="text-[11px] text-indigo-600 font-medium mt-0.5 block">Coordinator Record Log</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Roster Search & Table */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-jakarta font-bold text-neutral-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#FF6B4B]" />
                <span>Class Students Live Roster ({filteredStudents.length})</span>
              </h2>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, roll number, or email..."
                  className="w-full bg-stone-50 border border-amber-200/80 focus:border-[#FF6B4B] text-neutral-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono outline-none transition-colors"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-100 text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-3">FULL NAME</th>
                    <th className="py-3.5 px-3">ROLL NUMBER</th>
                    <th className="py-3.5 px-3">EMAIL ADDRESS</th>
                    <th className="py-3.5 px-3 text-right">OVERALL ATTENDANCE %</th>
                    <th className="py-3.5 px-3 text-center">STATUS</th>
                    <th className="py-3.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60">
                  {filteredStudents.map((student) => {
                    const overallPct = calculateOverallPct(student);
                    const isSafe = overallPct >= 75.0;

                    return (
                      <tr 
                        key={student.id}
                        className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 text-[#FF6B4B] font-bold text-xs flex items-center justify-center shrink-0">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-jakarta font-semibold text-neutral-900 text-sm">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-neutral-600 font-mono tnum">{student.rollNumber}</td>
                        <td className="py-3.5 px-3 text-neutral-600 font-sans text-xs">
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{student.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-jakarta font-bold text-neutral-900 text-sm tnum">
                          {overallPct}%
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono tnum inline-block ${
                            isSafe 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200/60'
                          }`}>
                            {isSafe ? '● SAFE' : '● AT RISK'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentId(student.id);
                            }}
                            className="bg-amber-50 hover:bg-orange-100 text-[#FF6B4B] border border-orange-200/60 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all"
                          >
                            Manage Attendance
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── Detail View: Individual Student Attendance Inspector ── */
        <div className="space-y-6">
          
          {/* Back button & Student Header */}
          <div className="stealth-card p-6 space-y-4">
            <button
              onClick={() => setSelectedStudentId(null)}
              className="bg-amber-50 hover:bg-amber-100 text-neutral-800 border border-amber-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-600" />
              <span>Back to Student Roster</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-amber-100">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6B4B] to-amber-500 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-jakarta font-bold text-neutral-900">{selectedStudent.name}</h2>
                  <div className="flex items-center space-x-3 text-xs font-mono text-neutral-500 mt-0.5">
                    <span>Roll No: <strong className="text-neutral-800 tnum">{selectedStudent.rollNumber}</strong></span>
                    <span>•</span>
                    <span>Email: <strong className="text-neutral-800">{selectedStudent.email || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Batch Code: <strong className="text-[#FF6B4B] font-bold">{currentBatchCode}</strong></span>
                  </div>
                </div>
              </div>

              {/* Overall gauge badge */}
              <div className="bg-amber-50/60 border border-amber-200/60 px-5 py-3 rounded-2xl flex items-center space-x-4 shrink-0">
                <div>
                  <span className="text-[10px] font-mono font-bold text-neutral-400 block uppercase tracking-wider">OVERALL COMPLIANCE</span>
                  <span className="text-2xl font-jakarta font-bold text-neutral-900 tnum">
                    {calculateOverallPct(selectedStudent)}%
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tnum ${
                  calculateOverallPct(selectedStudent) >= 75
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                    : 'bg-rose-100 text-rose-800 border border-rose-200/60'
                }`}>
                  {calculateOverallPct(selectedStudent) >= 75 ? 'Safe Status' : 'At Risk'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Subject-wise Attendance Breakdown */}
          <div className="stealth-card p-6 space-y-4">
            <h3 className="font-jakarta font-bold text-neutral-900 text-base">Subject Attendance Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedStudent.subjects.map((sub) => {
                const isSafe = sub.percentage >= 75.0;
                return (
                  <div key={sub.subjectCode} className="bg-amber-50/40 border border-amber-100/80 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#FF6B4B] block">{sub.subjectCode}</span>
                        <h4 className="font-jakarta font-bold text-neutral-900 text-sm">{sub.subjectName}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tnum ${
                        isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-neutral-500 pt-1">
                      <span>Attended: <strong className="text-neutral-900 tnum">{sub.attended}</strong> / <span className="tnum">{sub.total}</span></span>
                      <span>Target: 75%</span>
                    </div>

                    <div className="w-full h-2 bg-amber-100/80 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Recorded Lecture History with Edit Action */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-jakarta font-bold text-neutral-900 text-base">Recorded Class Lectures</h3>
                <p className="text-xs text-neutral-500 font-sans">
                  List of recent class lectures logged for this student. Coordinator can edit status with an audit note.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-100 text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="py-3 px-3">DATE & TIME</th>
                    <th className="py-3 px-3">SUBJECT</th>
                    <th className="py-3 px-3">FACULTY</th>
                    <th className="py-3 px-3 text-center">CURRENT STATUS</th>
                    <th className="py-3 px-3">LAST EDIT INFO</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60">
                  {selectedStudent.lectures.map((lec) => (
                    <tr key={lec.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="text-neutral-900 font-bold font-mono tnum block">{lec.date}</span>
                        <span className="text-[10px] text-neutral-400 font-mono tnum">{lec.time}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="text-[#FF6B4B] font-bold font-mono block">{lec.subjectCode}</span>
                        <span className="text-neutral-700 text-[11px] font-sans block">{lec.subjectName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-500">{lec.faculty}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono tnum ${
                          lec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                            : 'bg-rose-100 text-rose-800 border border-rose-200/60'
                        }`}>
                          {lec.status === 'Present' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{lec.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[10px] text-neutral-500">
                        {lec.lastEditedAt ? (
                          <div>
                            <span className="text-neutral-800 font-medium block">Edited {lec.lastEditedAt}</span>
                            <span className="text-neutral-500 italic">"{lec.editReason}"</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Original Record</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleOpenEditModal(selectedStudent.id, lec)}
                          className="bg-orange-50 hover:bg-orange-100 text-[#FF6B4B] border border-orange-200/60 rounded-full px-3.5 py-1 text-xs font-semibold flex items-center space-x-1 ml-auto transition-colors shadow-sm"
                        >
                          <Edit3 className="w-3 h-3 text-[#FF6B4B]" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Edit Lecture Attendance Status ── */}
      {editingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/20 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-amber-100 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 relative overflow-hidden text-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#FF6B4B]" />
                <h3 className="font-jakarta font-bold text-neutral-900 text-base">Edit Attendance Record</h3>
              </div>
              <button
                onClick={() => setEditingLecture(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-neutral-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Lecture Target Details summary */}
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3.5 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                  <span>Subject: <strong className="text-[#FF6B4B]">{editingLecture.lecture.subjectCode}</strong></span>
                  <span>Date: <strong className="text-neutral-900 tnum">{editingLecture.lecture.date}</strong></span>
                </div>
                <p className="font-jakarta font-bold text-neutral-900 text-xs">{editingLecture.lecture.subjectName}</p>
                <p className="text-[10px] text-neutral-500">{editingLecture.lecture.faculty} • {editingLecture.lecture.time}</p>
              </div>

              {reasonError && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-700 flex items-center space-x-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{reasonError}</span>
                </div>
              )}

              {/* Status Radio options */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Select Attendance Status *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('Present')}
                    className={`py-3 px-3 rounded-xl text-center font-bold flex items-center justify-center space-x-2 transition-all ${
                      newStatus === 'Present'
                        ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-stone-50 border border-stone-200 text-neutral-600 hover:bg-stone-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('Absent')}
                    className={`py-3 px-3 rounded-xl text-center font-bold flex items-center justify-center space-x-2 transition-all ${
                      newStatus === 'Absent'
                        ? 'bg-rose-50 border-2 border-rose-500 text-rose-800 shadow-sm'
                        : 'bg-stone-50 border border-stone-200 text-neutral-600 hover:bg-stone-100'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>

              {/* Mandatory Reason Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">
                  Reason / Audit Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={(e) => {
                    setEditReason(e.target.value);
                    if (e.target.value.trim()) setReasonError('');
                  }}
                  placeholder="e.g. Corrected after manual attendance register verification"
                  className="w-full bg-stone-50 border border-amber-200/80 text-neutral-900 rounded-xl p-3 text-xs outline-none focus:border-[#FF6B4B] font-sans transition-colors"
                />
                <span className="text-[10px] text-neutral-400 block">
                  This note will be permanently saved to the coordinator audit history.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setEditingLecture(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-full bg-[#FF6B4B] hover:bg-[#e05638] shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Record & Log Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
