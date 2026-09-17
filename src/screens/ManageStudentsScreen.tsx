import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronLeft, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FileText,
  AlertCircle,
  X,
  History
} from 'lucide-react';
import { 
  StudentDetail, 
  LectureRecord, 
  AuditLogEntry, 
  INITIAL_BATCH_STUDENTS 
} from '../data/manageStudentsData';

const LS_STUDENTS_KEY = 'academicsync_managedStudents';
const LS_AUDIT_KEY = 'academicsync_auditLogs';

export const ManageStudentsScreen: React.FC = () => {
  // Load students from localStorage or fallback to initial data
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
    s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="fixed top-16 right-4 z-50 bg-[#10B981]/90 text-white font-mono text-xs px-4 py-3 rounded shadow-lg border border-[#10B981] flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="stealth-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-wider block tnum">
              CLASS COORDINATOR MANAGEMENT PORTAL • SEM VI-A
            </span>
            <span className="bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40 px-2 py-0.5 text-[9px] rounded font-mono font-bold uppercase">
              COORDINATOR ONLY
            </span>
          </div>
          <h1 className="text-xl font-jakarta font-bold text-white">Class Roster & Student Attendance Management</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-sans">
            Review individual student attendance profiles, edit lecture records, and maintain verified audit trails for your class batch.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAuditLogsView(!showAuditLogsView)}
            className={`btn-stealth px-3.5 py-2 text-xs font-mono flex items-center space-x-2 ${
              showAuditLogsView ? 'border-[#6366F1] text-white bg-[#6366F1]/10' : ''
            }`}
          >
            <History className="w-4 h-4 text-[#6BD8CB]" />
            <span>{showAuditLogsView ? 'View Roster' : `Audit Trail (${auditLogs.length})`}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Overlay View */}
      {showAuditLogsView ? (
        <div className="stealth-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
            <div>
              <h2 className="text-lg font-jakarta font-bold text-white flex items-center space-x-2">
                <History className="w-5 h-5 text-[#6BD8CB]" />
                <span>Coordinator Edit History & Audit Trail</span>
              </h2>
              <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
                Complete record of manual attendance overrides and reasons logged by the Class Coordinator.
              </p>
            </div>
            <button
              onClick={() => setShowAuditLogsView(false)}
              className="btn-stealth px-3 py-1.5 text-xs font-mono"
            >
              Back to Students List
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 space-y-2 font-mono text-xs text-[#64748B]">
              <FileText className="w-8 h-8 mx-auto text-[#233044]" />
              <p>No manual attendance overrides recorded yet.</p>
              <p className="text-[11px]">When you edit a student's lecture record, a permanent audit entry will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#233044] text-[#64748B] text-[10px] uppercase">
                    <th className="py-3 px-2">TIMESTAMP</th>
                    <th className="py-3 px-2">STUDENT</th>
                    <th className="py-3 px-2">SUBJECT & DATE</th>
                    <th className="py-3 px-2">CHANGE</th>
                    <th className="py-3 px-2">REASON / AUDIT NOTE</th>
                    <th className="py-3 px-2 text-right">EDITED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233044]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#161F30]/50 transition-colors">
                      <td className="py-3 px-2 text-[#94A3B8] text-[11px] tnum">{log.timestamp}</td>
                      <td className="py-3 px-2">
                        <span className="text-white font-semibold">{log.studentName}</span>
                        <span className="text-[10px] text-[#64748B] block tnum">{log.rollNumber}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-[#6BD8CB] font-bold">{log.subjectCode}</span>
                        <span className="text-[10px] text-[#94A3B8] block">{log.date}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <span className={log.oldStatus === 'Present' ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                            {log.oldStatus}
                          </span>
                          <span className="text-[#64748B]">→</span>
                          <span className={`font-bold ${log.newStatus === 'Present' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {log.newStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-[#DFE2F1] text-[11px] max-w-xs leading-normal">
                        "{log.reason}"
                      </td>
                      <td className="py-3 px-2 text-right text-[#94A3B8] text-[11px]">
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
            <div className="stealth-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase">ENROLLED BATCH STUDENTS</span>
                <div className="text-2xl font-jakarta font-bold text-white mt-1 tnum">{students.length}</div>
                <span className="text-[11px] text-[#10B981] font-mono mt-0.5 block">Active Cohort Sem VI-A</span>
              </div>
              <div className="w-10 h-10 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#6366F1]">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="stealth-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase">BATCH AVG ATTENDANCE</span>
                <div className="text-2xl font-jakarta font-bold text-white mt-1 tnum">
                  {Math.round(students.reduce((acc, s) => acc + calculateOverallPct(s), 0) / students.length * 10) / 10}%
                </div>
                <span className="text-[11px] text-[#6BD8CB] font-mono mt-0.5 block">Compliant (&gt;75%)</span>
              </div>
              <div className="w-10 h-10 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#10B981]">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="stealth-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase">AUDIT OVERRIDES LOGGED</span>
                <div className="text-2xl font-jakarta font-bold text-white mt-1 tnum">{auditLogs.length}</div>
                <span className="text-[11px] text-[#8B5CF6] font-mono mt-0.5 block">Coordinator Record Log</span>
              </div>
              <div className="w-10 h-10 rounded bg-[#161F30] border border-[#233044] flex items-center justify-center text-[#8B5CF6]">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Roster Search & Table */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-jakarta font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#6366F1]" />
                <span>Class Students List</span>
              </h2>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or roll number..."
                  className="input-stealth w-full pl-9 font-mono text-xs"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#233044] text-[#64748B] text-[10px] uppercase">
                    <th className="py-3 px-3">STUDENT NAME</th>
                    <th className="py-3 px-3">ROLL NUMBER</th>
                    <th className="py-3 px-3 text-center">ENROLLED SUBJECTS</th>
                    <th className="py-3 px-3 text-right">OVERALL ATTENDANCE</th>
                    <th className="py-3 px-3 text-center">STATUS</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233044]">
                  {filteredStudents.map((student) => {
                    const overallPct = calculateOverallPct(student);
                    const isSafe = overallPct >= 75.0;

                    return (
                      <tr 
                        key={student.id}
                        className="hover:bg-[#161F30] transition-colors cursor-pointer"
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded bg-[#161F30] border border-[#233044] text-[#6BD8CB] font-bold text-xs flex items-center justify-center shrink-0">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-jakarta font-semibold text-white text-sm">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#DFE2F1] tnum">{student.rollNumber}</td>
                        <td className="py-3.5 px-3 text-center text-[#94A3B8] tnum">{student.subjects.length} Modules</td>
                        <td className="py-3.5 px-3 text-right font-jakarta font-bold text-white text-sm tnum">
                          {overallPct}%
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tnum ${
                            isSafe 
                              ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' 
                              : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30'
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
                            className="btn-stealth px-3 py-1 text-xs font-mono"
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
              className="btn-stealth px-3 py-1.5 text-xs font-mono flex items-center space-x-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Student Roster</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#233044]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white font-bold text-lg flex items-center justify-center shrink-0">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-xl font-jakarta font-bold text-white">{selectedStudent.name}</h2>
                  <div className="flex items-center space-x-3 text-xs font-mono text-[#94A3B8] mt-0.5">
                    <span>Roll No: <strong className="text-white tnum">{selectedStudent.rollNumber}</strong></span>
                    <span>•</span>
                    <span>Batch: <strong className="text-[#6BD8CB]">CS-2025-A</strong></span>
                  </div>
                </div>
              </div>

              {/* Overall gauge badge */}
              <div className="bg-[#161F30] border border-[#233044] px-4 py-2.5 rounded flex items-center space-x-3 shrink-0">
                <div>
                  <span className="text-[10px] font-mono text-[#64748B] block uppercase">OVERALL COMPLIANCE</span>
                  <span className="text-xl font-jakarta font-bold text-white tnum">
                    {calculateOverallPct(selectedStudent)}%
                  </span>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tnum ${
                  calculateOverallPct(selectedStudent) >= 75
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                    : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                }`}>
                  {calculateOverallPct(selectedStudent) >= 75 ? 'Safe Status' : 'At Risk'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Subject-wise Attendance Breakdown */}
          <div className="stealth-card p-6 space-y-4">
            <h3 className="font-jakarta font-bold text-white text-base">Subject Attendance Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedStudent.subjects.map((sub) => {
                const isSafe = sub.percentage >= 75.0;
                return (
                  <div key={sub.subjectCode} className="bg-[#161F30] border border-[#233044] p-4 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#6BD8CB] font-bold block">{sub.subjectCode}</span>
                        <h4 className="font-jakarta font-semibold text-white text-sm">{sub.subjectName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tnum ${
                        isSafe ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] pt-1">
                      <span>Attended: <strong className="text-white tnum">{sub.attended}</strong> / <span className="tnum">{sub.total}</span></span>
                      <span>Target: 75%</span>
                    </div>

                    <div className="w-full h-1.5 bg-[#0F131D] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isSafe ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
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
                <h3 className="font-jakarta font-bold text-white text-base">Recorded Class Lectures</h3>
                <p className="text-xs text-[#94A3B8] font-sans">
                  List of recent class lectures logged for this student. Coordinator can edit status with an audit note.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#233044] text-[#64748B] text-[10px] uppercase">
                    <th className="py-3 px-2">DATE & TIME</th>
                    <th className="py-3 px-2">SUBJECT</th>
                    <th className="py-3 px-2">FACULTY</th>
                    <th className="py-3 px-2 text-center">CURRENT STATUS</th>
                    <th className="py-3 px-2">LAST EDIT INFO</th>
                    <th className="py-3 px-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#233044]">
                  {selectedStudent.lectures.map((lec) => (
                    <tr key={lec.id} className="hover:bg-[#161F30]/60 transition-colors">
                      <td className="py-3.5 px-2">
                        <span className="text-white font-semibold tnum block">{lec.date}</span>
                        <span className="text-[10px] text-[#64748B] tnum">{lec.time}</span>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="text-[#6BD8CB] font-bold block">{lec.subjectCode}</span>
                        <span className="text-[#DFE2F1] text-[11px] font-sans block">{lec.subjectName}</span>
                      </td>
                      <td className="py-3.5 px-2 text-[#94A3B8]">{lec.faculty}</td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tnum ${
                          lec.status === 'Present'
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                        }`}>
                          {lec.status === 'Present' ? (
                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                          ) : (
                            <XCircle className="w-3 h-3 text-[#EF4444]" />
                          )}
                          <span>{lec.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-[10px] text-[#64748B]">
                        {lec.lastEditedAt ? (
                          <div>
                            <span className="text-[#DFE2F1] block">Edited {lec.lastEditedAt}</span>
                            <span className="text-[#94A3B8] italic">"{lec.editReason}"</span>
                          </div>
                        ) : (
                          <span>Original Record</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => handleOpenEditModal(selectedStudent.id, lec)}
                          className="btn-stealth px-3 py-1 text-xs font-mono flex items-center space-x-1 ml-auto"
                        >
                          <Edit3 className="w-3 h-3 text-[#6366F1]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="stealth-modal max-w-md w-full p-6 space-y-5 relative overflow-hidden text-[#DFE2F1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#233044]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-[#6366F1]" />
                <h3 className="font-jakarta font-bold text-white text-base">Edit Attendance Record</h3>
              </div>
              <button
                onClick={() => setEditingLecture(null)}
                className="text-[#94A3B8] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
              {/* Lecture Target Details summary */}
              <div className="bg-[#161F30] border border-[#233044] rounded p-3 space-y-1">
                <div className="flex justify-between text-[11px] text-[#94A3B8]">
                  <span>Subject: <strong className="text-[#6BD8CB]">{editingLecture.lecture.subjectCode}</strong></span>
                  <span>Date: <strong className="text-white tnum">{editingLecture.lecture.date}</strong></span>
                </div>
                <p className="font-jakarta font-semibold text-white text-xs">{editingLecture.lecture.subjectName}</p>
                <p className="text-[10px] text-[#64748B]">{editingLecture.lecture.faculty} • {editingLecture.lecture.time}</p>
              </div>

              {reasonError && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-2.5 rounded text-xs text-[#EF4444] flex items-center space-x-2 font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reasonError}</span>
                </div>
              )}

              {/* Status Radio options */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase block">Select Attendance Status *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('Present')}
                    className={`py-2.5 px-3 rounded border text-center font-bold flex items-center justify-center space-x-2 transition-colors ${
                      newStatus === 'Present'
                        ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                        : 'bg-[#161F30] border-[#233044] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStatus('Absent')}
                    className={`py-2.5 px-3 rounded border text-center font-bold flex items-center justify-center space-x-2 transition-colors ${
                      newStatus === 'Absent'
                        ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]'
                        : 'bg-[#161F30] border-[#233044] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Absent</span>
                  </button>
                </div>
              </div>

              {/* Mandatory Reason Field */}
              <div className="space-y-1">
                <label className="text-[10px] text-[#94A3B8] uppercase block">
                  Reason / Audit Note <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={editReason}
                  onChange={(e) => {
                    setEditReason(e.target.value);
                    if (e.target.value.trim()) setReasonError('');
                  }}
                  placeholder="e.g. Corrected after manual attendance register verification"
                  className="w-full bg-[#161F30] border border-[#233044] text-white rounded p-3 text-xs outline-none focus:border-[#6366F1] font-sans"
                />
                <span className="text-[10px] text-[#64748B] block">
                  This note will be permanently saved to the coordinator audit history.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#233044]">
                <button
                  type="button"
                  onClick={() => setEditingLecture(null)}
                  className="btn-stealth px-4 py-2 text-xs font-mono"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-xs font-mono uppercase font-semibold flex items-center space-x-1.5"
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
