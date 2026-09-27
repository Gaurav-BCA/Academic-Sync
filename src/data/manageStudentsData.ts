export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
}

export interface LectureRecord {
  id: string;
  date: string;
  time: string;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  status: 'Present' | 'Absent' | 'No Class Conducted';
  lastEditedAt?: string;
  lastEditedBy?: string;
  editReason?: string;
}

export interface StudentDetail {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  attendancePercentage?: number;
  status?: string;
  subjects: SubjectAttendance[];
  lectures: LectureRecord[];
}

export interface AuditLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  lectureId: string;
  subjectCode: string;
  subjectName: string;
  date: string;
  oldStatus: 'Present' | 'Absent' | 'No Class Conducted';
  newStatus: 'Present' | 'Absent' | 'No Class Conducted';
  reason: string;
  editedBy: string;
  timestamp: string;
}

export const INITIAL_BATCH_STUDENTS: StudentDetail[] = [];
