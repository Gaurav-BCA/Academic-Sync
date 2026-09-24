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

export const INITIAL_BATCH_STUDENTS: StudentDetail[] = [
  {
    id: 's1',
    name: 'Alex Rivera',
    rollNumber: '21CS045',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 0, total: 0, percentage: 0 }
    ],
    lectures: []
  },
  {
    id: 's2',
    name: 'Priya Sharma',
    rollNumber: '21CS012',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 0, total: 0, percentage: 0 }
    ],
    lectures: []
  },
  {
    id: 's3',
    name: 'David Chen',
    rollNumber: '21CS018',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 0, total: 0, percentage: 0 }
    ],
    lectures: []
  },
  {
    id: 's4',
    name: 'Sarah Jenkins',
    rollNumber: '21CS024',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 0, total: 0, percentage: 0 }
    ],
    lectures: []
  },
  {
    id: 's5',
    name: 'Marcus Thorne',
    rollNumber: '21CS031',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 0, total: 0, percentage: 0 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 0, total: 0, percentage: 0 }
    ],
    lectures: []
  }
];
