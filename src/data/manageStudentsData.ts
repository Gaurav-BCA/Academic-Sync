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
  status: 'Present' | 'Absent';
  lastEditedAt?: string;
  lastEditedBy?: string;
  editReason?: string;
}

export interface StudentDetail {
  id: string;
  name: string;
  rollNumber: string;
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
  oldStatus: 'Present' | 'Absent';
  newStatus: 'Present' | 'Absent';
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
      { subjectCode: 'CS603', subjectName: 'Advanced Algorithms', attended: 32, total: 34, percentage: 94.1 },
      { subjectCode: 'CS602', subjectName: 'Cloud Computing', attended: 36, total: 38, percentage: 94.7 },
      { subjectCode: 'CS609', subjectName: 'Machine Learning & AI', attended: 43, total: 46, percentage: 93.5 },
      { subjectCode: 'CS604', subjectName: 'Compiler Engineering', attended: 35, total: 38, percentage: 92.1 }
    ],
    lectures: [
      { id: 'lec-101', date: '2026-09-17', time: '09:00 - 10:00 AM', subjectCode: 'CS603', subjectName: 'Advanced Algorithms', faculty: 'Prof. S. Chakrabarti', status: 'Present' },
      { id: 'lec-102', date: '2026-09-16', time: '10:15 - 11:15 AM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', status: 'Present' },
      { id: 'lec-103', date: '2026-09-15', time: '01:45 - 03:15 PM', subjectCode: 'CS609', subjectName: 'Machine Learning & AI', faculty: 'Dr. P. Narayan', status: 'Present' },
      { id: 'lec-104', date: '2026-09-14', time: '11:30 - 12:30 PM', subjectCode: 'CS604', subjectName: 'Compiler Engineering', faculty: 'Dr. V. Swaminathan', status: 'Absent' },
      { id: 'lec-105', date: '2026-09-12', time: '09:00 - 10:00 AM', subjectCode: 'CS603', subjectName: 'Advanced Algorithms', faculty: 'Prof. S. Chakrabarti', status: 'Present' }
    ]
  },
  {
    id: 's2',
    name: 'Priya Sharma',
    rollNumber: '21CS012',
    subjects: [
      { subjectCode: 'CS603', subjectName: 'Advanced Algorithms', attended: 33, total: 34, percentage: 97.1 },
      { subjectCode: 'CS602', subjectName: 'Cloud Computing', attended: 37, total: 38, percentage: 97.4 },
      { subjectCode: 'CS609', subjectName: 'Machine Learning & AI', attended: 44, total: 46, percentage: 95.7 },
      { subjectCode: 'CS604', subjectName: 'Compiler Engineering', attended: 36, total: 38, percentage: 94.7 }
    ],
    lectures: [
      { id: 'lec-201', date: '2026-09-17', time: '09:00 - 10:00 AM', subjectCode: 'CS603', subjectName: 'Advanced Algorithms', faculty: 'Prof. S. Chakrabarti', status: 'Present' },
      { id: 'lec-202', date: '2026-09-16', time: '10:15 - 11:15 AM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', status: 'Present' },
      { id: 'lec-203', date: '2026-09-15', time: '01:45 - 03:15 PM', subjectCode: 'CS609', subjectName: 'Machine Learning & AI', faculty: 'Dr. P. Narayan', status: 'Present' },
      { id: 'lec-204', date: '2026-09-14', time: '11:30 - 12:30 PM', subjectCode: 'CS604', subjectName: 'Compiler Engineering', faculty: 'Dr. V. Swaminathan', status: 'Present' }
    ]
  },
  {
    id: 's3',
    name: 'David Chen',
    rollNumber: '21CS018',
    subjects: [
      { subjectCode: 'CS603', subjectName: 'Advanced Algorithms', attended: 31, total: 34, percentage: 91.2 },
      { subjectCode: 'CS602', subjectName: 'Cloud Computing', attended: 35, total: 38, percentage: 92.1 },
      { subjectCode: 'CS609', subjectName: 'Machine Learning & AI', attended: 42, total: 46, percentage: 91.3 },
      { subjectCode: 'CS604', subjectName: 'Compiler Engineering', attended: 34, total: 38, percentage: 89.5 }
    ],
    lectures: [
      { id: 'lec-301', date: '2026-09-17', time: '09:00 - 10:00 AM', subjectCode: 'CS603', subjectName: 'Advanced Algorithms', faculty: 'Prof. S. Chakrabarti', status: 'Present' },
      { id: 'lec-302', date: '2026-09-16', time: '10:15 - 11:15 AM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', status: 'Absent' },
      { id: 'lec-303', date: '2026-09-15', time: '01:45 - 03:15 PM', subjectCode: 'CS609', subjectName: 'Machine Learning & AI', faculty: 'Dr. P. Narayan', status: 'Present' }
    ]
  },
  {
    id: 's4',
    name: 'Sarah Jenkins',
    rollNumber: '21CS024',
    subjects: [
      { subjectCode: 'CS603', subjectName: 'Advanced Algorithms', attended: 29, total: 34, percentage: 85.3 },
      { subjectCode: 'CS602', subjectName: 'Cloud Computing', attended: 33, total: 38, percentage: 86.8 },
      { subjectCode: 'CS609', subjectName: 'Machine Learning & AI', attended: 39, total: 46, percentage: 84.8 },
      { subjectCode: 'CS604', subjectName: 'Compiler Engineering', attended: 31, total: 38, percentage: 81.6 }
    ],
    lectures: [
      { id: 'lec-401', date: '2026-09-17', time: '09:00 - 10:00 AM', subjectCode: 'CS603', subjectName: 'Advanced Algorithms', faculty: 'Prof. S. Chakrabarti', status: 'Present' },
      { id: 'lec-402', date: '2026-09-16', time: '10:15 - 11:15 AM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', status: 'Absent' },
      { id: 'lec-403', date: '2026-09-15', time: '01:45 - 03:15 PM', subjectCode: 'CS609', subjectName: 'Machine Learning & AI', faculty: 'Dr. P. Narayan', status: 'Absent' }
    ]
  },
  {
    id: 's5',
    name: 'Marcus Thorne',
    rollNumber: '21CS031',
    subjects: [
      { subjectCode: 'CS603', subjectName: 'Advanced Algorithms', attended: 27, total: 34, percentage: 79.4 },
      { subjectCode: 'CS602', subjectName: 'Cloud Computing', attended: 30, total: 38, percentage: 78.9 },
      { subjectCode: 'CS609', subjectName: 'Machine Learning & AI', attended: 36, total: 46, percentage: 78.3 },
      { subjectCode: 'CS604', subjectName: 'Compiler Engineering', attended: 27, total: 38, percentage: 71.0 }
    ],
    lectures: [
      { id: 'lec-501', date: '2026-09-17', time: '09:00 - 10:00 AM', subjectCode: 'CS603', subjectName: 'Advanced Algorithms', faculty: 'Prof. S. Chakrabarti', status: 'Absent' },
      { id: 'lec-502', date: '2026-09-16', time: '10:15 - 11:15 AM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', status: 'Present' },
      { id: 'lec-503', date: '2026-09-15', time: '01:45 - 03:15 PM', subjectCode: 'CS609', subjectName: 'Machine Learning & AI', faculty: 'Dr. P. Narayan', status: 'Absent' },
      { id: 'lec-504', date: '2026-09-14', time: '11:30 - 12:30 PM', subjectCode: 'CS604', subjectName: 'Compiler Engineering', faculty: 'Dr. V. Swaminathan', status: 'Absent' }
    ]
  }
];
