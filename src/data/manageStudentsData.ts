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
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 35, total: 38, percentage: 92.1 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 36, total: 38, percentage: 94.7 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 34, total: 38, percentage: 89.5 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 35, total: 38, percentage: 92.1 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 36, total: 38, percentage: 94.7 }
    ],
    lectures: [
      { id: 'lec-101', date: '2026-09-18', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 512', subjectName: 'Java Programming', faculty: 'Mrs. Meenakshi Manchanda', status: 'Present' },
      { id: 'lec-102', date: '2026-09-18', time: '09:40 AM - 10:40 AM', subjectCode: 'BCA 513', subjectName: 'Computer Graphics', faculty: 'Dr. Rajesh Kumar', status: 'Present' },
      { id: 'lec-103', date: '2026-09-17', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 514', subjectName: 'Software Engineering', faculty: 'Prof. Sunita Sharma', status: 'Present' },
      { id: 'lec-104', date: '2026-09-17', time: '10:50 AM - 11:50 AM', subjectCode: 'BCA 516', subjectName: 'Database Management Systems', faculty: 'Dr. Neha Gupta', status: 'Absent' },
      { id: 'lec-105', date: '2026-09-16', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 515', subjectName: 'Web Technologies', faculty: 'Mr. Amit Verma', status: 'Present' }
    ]
  },
  {
    id: 's2',
    name: 'Priya Sharma',
    rollNumber: '21CS012',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 37, total: 38, percentage: 97.4 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 37, total: 38, percentage: 97.4 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 36, total: 38, percentage: 94.7 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 37, total: 38, percentage: 97.4 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 36, total: 38, percentage: 94.7 }
    ],
    lectures: [
      { id: 'lec-201', date: '2026-09-18', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 512', subjectName: 'Java Programming', faculty: 'Mrs. Meenakshi Manchanda', status: 'Present' },
      { id: 'lec-202', date: '2026-09-18', time: '09:40 AM - 10:40 AM', subjectCode: 'BCA 513', subjectName: 'Computer Graphics', faculty: 'Dr. Rajesh Kumar', status: 'Present' },
      { id: 'lec-203', date: '2026-09-17', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 514', subjectName: 'Software Engineering', faculty: 'Prof. Sunita Sharma', status: 'Present' },
      { id: 'lec-204', date: '2026-09-17', time: '10:50 AM - 11:50 AM', subjectCode: 'BCA 516', subjectName: 'Database Management Systems', faculty: 'Dr. Neha Gupta', status: 'Present' }
    ]
  },
  {
    id: 's3',
    name: 'David Chen',
    rollNumber: '21CS018',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 34, total: 38, percentage: 89.5 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 35, total: 38, percentage: 92.1 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 33, total: 38, percentage: 86.8 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 34, total: 38, percentage: 89.5 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 35, total: 38, percentage: 92.1 }
    ],
    lectures: [
      { id: 'lec-301', date: '2026-09-18', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 512', subjectName: 'Java Programming', faculty: 'Mrs. Meenakshi Manchanda', status: 'Present' },
      { id: 'lec-302', date: '2026-09-18', time: '09:40 AM - 10:40 AM', subjectCode: 'BCA 513', subjectName: 'Computer Graphics', faculty: 'Dr. Rajesh Kumar', status: 'Absent' },
      { id: 'lec-303', date: '2026-09-17', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 514', subjectName: 'Software Engineering', faculty: 'Prof. Sunita Sharma', status: 'Present' }
    ]
  },
  {
    id: 's4',
    name: 'Sarah Jenkins',
    rollNumber: '21CS024',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 31, total: 38, percentage: 81.6 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 32, total: 38, percentage: 84.2 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 30, total: 38, percentage: 78.9 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 31, total: 38, percentage: 81.6 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 32, total: 38, percentage: 84.2 }
    ],
    lectures: [
      { id: 'lec-401', date: '2026-09-18', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 512', subjectName: 'Java Programming', faculty: 'Mrs. Meenakshi Manchanda', status: 'Present' },
      { id: 'lec-402', date: '2026-09-18', time: '09:40 AM - 10:40 AM', subjectCode: 'BCA 513', subjectName: 'Computer Graphics', faculty: 'Dr. Rajesh Kumar', status: 'Absent' },
      { id: 'lec-403', date: '2026-09-17', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 514', subjectName: 'Software Engineering', faculty: 'Prof. Sunita Sharma', status: 'Absent' }
    ]
  },
  {
    id: 's5',
    name: 'Marcus Thorne',
    rollNumber: '21CS031',
    subjects: [
      { subjectCode: 'BCA 512', subjectName: 'Java Programming', attended: 27, total: 38, percentage: 71.1 },
      { subjectCode: 'BCA 513', subjectName: 'Computer Graphics', attended: 28, total: 38, percentage: 73.7 },
      { subjectCode: 'BCA 514', subjectName: 'Software Engineering', attended: 26, total: 38, percentage: 68.4 },
      { subjectCode: 'BCA 515', subjectName: 'Web Technologies', attended: 27, total: 38, percentage: 71.1 },
      { subjectCode: 'BCA 516', subjectName: 'Database Management Systems', attended: 28, total: 38, percentage: 73.7 }
    ],
    lectures: [
      { id: 'lec-501', date: '2026-09-18', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 512', subjectName: 'Java Programming', faculty: 'Mrs. Meenakshi Manchanda', status: 'Absent' },
      { id: 'lec-502', date: '2026-09-18', time: '09:40 AM - 10:40 AM', subjectCode: 'BCA 513', subjectName: 'Computer Graphics', faculty: 'Dr. Rajesh Kumar', status: 'Present' },
      { id: 'lec-503', date: '2026-09-17', time: '08:40 AM - 09:40 AM', subjectCode: 'BCA 514', subjectName: 'Software Engineering', faculty: 'Prof. Sunita Sharma', status: 'Absent' },
      { id: 'lec-504', date: '2026-09-17', time: '10:50 AM - 11:50 AM', subjectCode: 'BCA 516', subjectName: 'Database Management Systems', faculty: 'Dr. Neha Gupta', status: 'Absent' }
    ]
  }
];
