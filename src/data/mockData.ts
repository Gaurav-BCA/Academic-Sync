export interface SubjectTelemetry {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: string;
  attended: number;
  total: number;
  percentage: number;
  complianceThreshold: number;
  status: 'safe' | 'warning' | 'critical';
  actionableNote: string;
  bufferHeadroom: number;
}

export interface TimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  time: string;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  room: string;
  type: 'Lecture' | 'Laboratory' | 'Seminar' | 'Free';
  statusTag?: string; // e.g. "Safe: 3 cyc", "Critical: 1 cyc"
  statusType?: 'safe' | 'critical' | 'optional';
}

export interface TodaySequenceItem {
  id: string;
  time: string;
  room: string;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  status: 'conducted_gps' | 'conducted_consensus' | 'awaiting_check' | 'scheduled' | 'exempted';
  statusText: string;
  subText?: string;
}

export interface LeaderboardNode {
  rank: number;
  name: string;
  isCurrentUser?: boolean;
  rollNumber: string;
  trustScore: number;
  accuracyPct: number;
  accuracyTrend: number;
  votesCount: number;
  tier: string;
}

export interface ReconciliationRecord {
  id: string;
  time: string;
  subjectCode: string;
  subjectName: string;
  status: 'immutable' | 'flagged' | 'exempted';
  statusText: string;
  anomalyReason?: string;
}

export const INITIAL_SUBJECTS: SubjectTelemetry[] = [
  {
    id: 'cs601',
    code: 'CS601',
    name: 'Distributed Systems',
    credits: 4,
    faculty: 'Dr. R. Sharma',
    attended: 42,
    total: 50,
    percentage: 84.0,
    complianceThreshold: 75.0,
    status: 'safe',
    actionableNote: 'Can safely miss 3 lectures',
    bufferHeadroom: 3
  },
  {
    id: 'cs602',
    code: 'CS602',
    name: 'Computer Networks',
    credits: 4,
    faculty: 'Prof. K. Venkatesh',
    attended: 39,
    total: 51,
    percentage: 76.5,
    complianceThreshold: 75.0,
    status: 'warning',
    actionableNote: 'Attend next 4 to reach 80% safety margin',
    bufferHeadroom: 1
  },
  {
    id: 'cs609',
    code: 'CS609',
    name: 'Machine Learning & AI',
    credits: 3,
    faculty: 'Dr. P. Narayan',
    attended: 41,
    total: 46,
    percentage: 89.2,
    complianceThreshold: 75.0,
    status: 'safe',
    actionableNote: 'High buffer: 6 safe cuts',
    bufferHeadroom: 6
  },
  {
    id: 'cs604',
    code: 'CS604',
    name: 'Compiler Engineering',
    credits: 4,
    faculty: 'Dr. V. Swaminathan',
    attended: 27,
    total: 38,
    percentage: 71.0,
    complianceThreshold: 75.0,
    status: 'critical',
    actionableNote: 'CRITICAL: Attend next 7 consecutive classes to reach 75%',
    bufferHeadroom: -2
  }
];

export const TIMETABLE_MATRIX: TimetableSlot[] = [
  // Monday
  { id: 'm1', day: 'Mon', time: '09:00 - 10:30 AM', subjectCode: 'CS603', subjectName: 'Distributed Systems', faculty: 'Dr. R. Sharma', room: 'LH-302', type: 'Lecture', statusTag: 'Safe: 3 cyc', statusType: 'safe' },
  { id: 'm2', day: 'Mon', time: '10:45 - 12:45 PM', subjectCode: 'CS609', subjectName: 'Machine Learning Lab', faculty: 'Dr. A. Gupta & TAs', room: 'Cyber Lab 4', type: 'Laboratory', statusTag: 'Critical: 1 cyc', statusType: 'critical' },
  { id: 'm3', day: 'Mon', time: '01:45 - 03:15 PM', subjectCode: 'FREE', subjectName: 'Library Sync Window', faculty: '', room: 'Library', type: 'Free' },
  
  // Tuesday
  { id: 't1', day: 'Tue', time: '09:00 - 10:30 AM', subjectCode: 'CS605', subjectName: 'Computer Architecture', faculty: 'Prof. K. Vance', room: 'LH-104', type: 'Lecture', statusTag: 'Safe: 2 cyc', statusType: 'safe' },
  { id: 't2', day: 'Tue', time: '10:45 - 12:45 PM', subjectCode: 'CS603', subjectName: 'Algorithm Design', faculty: 'Dr. A. Gupta', room: 'LH-302', type: 'Lecture', statusTag: 'Safe: 3 cyc', statusType: 'safe' },
  { id: 't3', day: 'Tue', time: '01:45 - 03:15 PM', subjectCode: 'CS603', subjectName: 'Distributed Systems', faculty: 'Dr. R. Sharma', room: 'LH-302', type: 'Lecture', statusTag: 'Safe: 3 cyc', statusType: 'safe' },

  // Wednesday
  { id: 'w1', day: 'Wed', time: '09:00 - 10:30 AM', subjectCode: 'CS603', subjectName: 'Distributed Systems', faculty: 'Dr. R. Sharma', room: 'LH-302', type: 'Lecture', statusTag: 'Safe: 3 cyc', statusType: 'safe' },
  { id: 'w2', day: 'Wed', time: '10:45 - 12:45 PM', subjectCode: 'CS602', subjectName: 'Networks Lab', faculty: 'Prof. K. Vance', room: 'Telecom Lab 2', type: 'Laboratory', statusTag: 'Critical: 1 cyc', statusType: 'critical' },
  { id: 'w3', day: 'Wed', time: '01:45 - 03:15 PM', subjectCode: 'CS605', subjectName: 'Computer Architecture', faculty: 'Prof. K. Vance', room: 'LH-104', type: 'Lecture', statusTag: 'Safe: 2 cyc', statusType: 'safe' },

  // Thursday
  { id: 'th1', day: 'Thu', time: '09:00 - 10:30 AM', subjectCode: 'CS603', subjectName: 'Algorithm Design', faculty: 'Dr. A. Gupta', room: 'Auditorium B', type: 'Lecture', statusTag: 'Safe: 4 cyc', statusType: 'safe' },
  { id: 'th2', day: 'Thu', time: '10:45 - 12:45 PM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', room: 'LH-201', type: 'Lecture', statusTag: 'Safe: 2 cyc', statusType: 'safe' },
  { id: 'th3', day: 'Thu', time: '01:45 - 03:15 PM', subjectCode: 'CS603', subjectName: 'Distributed Systems', faculty: 'Dr. R. Sharma', room: 'Systems Lab A', type: 'Laboratory', statusTag: 'Safe: 2 cyc', statusType: 'safe' },

  // Friday
  { id: 'f1', day: 'Fri', time: '09:00 - 10:30 AM', subjectCode: 'CS602', subjectName: 'Cloud Computing', faculty: 'Prof. S. Chen', room: 'LH-201', type: 'Lecture', statusTag: 'Safe: 2 cyc', statusType: 'safe' },
  { id: 'f2', day: 'Fri', time: '10:45 - 12:45 PM', subjectCode: 'CS600', subjectName: 'Academic Seminar', faculty: 'Dean Research Group', room: 'Auditorium B', type: 'Seminar', statusTag: 'Optional', statusType: 'optional' },
  { id: 'f3', day: 'Fri', time: '01:45 - 03:15 PM', subjectCode: 'CS603', subjectName: 'Algorithm Design', faculty: 'Dr. A. Gupta', room: 'Auditorium B', type: 'Lecture', statusTag: 'Safe: 4 cyc', statusType: 'safe' },

  // Saturday
  { id: 's1', day: 'Sat', time: '09:00 - 10:30 AM', subjectCode: 'FREE', subjectName: 'Free Study Window', faculty: '', room: 'Library', type: 'Free' },
  { id: 's2', day: 'Sat', time: '10:45 - 12:45 PM', subjectCode: 'CS602', subjectName: 'Cloud Infra Lab', faculty: 'Prof. S. Chen', room: 'Lab Server 1', type: 'Laboratory', statusTag: 'Safe: 2 cyc', statusType: 'safe' },
  { id: 's3', day: 'Sat', time: '01:45 - 03:15 PM', subjectCode: 'FREE', subjectName: 'Open Research Block', faculty: '', room: 'Research Lab', type: 'Free' }
];

export const TODAY_SEQUENCE: TodaySequenceItem[] = [
  {
    id: 'seq1',
    time: '09:00 - 10:00',
    room: 'LH-101',
    subjectCode: 'CS603',
    subjectName: 'Advanced Algorithms',
    faculty: 'Prof. S. Chakrabarti • Graph Partitioning',
    status: 'conducted_gps',
    statusText: 'Conducted • Present (GPS Verified)',
    subText: 'Location Verified • Radius Match'
  },
  {
    id: 'seq2',
    time: '10:15 - 11:15',
    room: 'LH-204',
    subjectCode: 'CS605',
    subjectName: 'Database Internals',
    faculty: 'Dr. A. Mehra • Multi-Version Concurrency',
    status: 'conducted_consensus',
    statusText: 'Conducted • Present (Peer Verified)',
    subText: 'Peer Attendance Confirmed'
  },
  {
    id: 'seq3',
    time: '11:30 - 12:30',
    room: 'LH-302',
    subjectCode: 'CS602',
    subjectName: 'Computer Networks',
    faculty: 'Prof. K. Venkatesh • TCP BBR Congestion',
    status: 'awaiting_check',
    statusText: 'Awaiting class-end check (12:25 PM)',
    subText: 'Presence confirmed during entry (11:31 AM)'
  },
  {
    id: 'seq4',
    time: '02:00 - 04:00',
    room: 'Lab 3',
    subjectCode: 'CS612',
    subjectName: 'Systems Lab',
    faculty: 'Unix Kernel Subsystems Exploration',
    status: 'scheduled',
    statusText: 'Scheduled',
    subText: 'Pending geo-fence broadcast'
  }
];

export const LEADERBOARD_DATA: LeaderboardNode[] = [
  {
    rank: 1,
    name: 'Alex Rivera',
    isCurrentUser: true,
    rollNumber: '21CS045',
    trustScore: 98.2,
    accuracyPct: 99.8,
    accuracyTrend: 0.8,
    votesCount: 142,
    tier: 'Tier 1'
  },
  {
    rank: 2,
    name: 'Priya Sharma',
    rollNumber: '21CS012',
    trustScore: 97.5,
    accuracyPct: 99.1,
    accuracyTrend: 1.2,
    votesCount: 138,
    tier: 'Tier 1'
  },
  {
    rank: 3,
    name: 'David Chen',
    rollNumber: '21CS018',
    trustScore: 96.8,
    accuracyPct: 98.4,
    accuracyTrend: 0.0,
    votesCount: 129,
    tier: 'Tier 1'
  },
  {
    rank: 4,
    name: 'Sarah Jenkins',
    rollNumber: '21CS024',
    trustScore: 94.2,
    accuracyPct: 96.9,
    accuracyTrend: -0.4,
    votesCount: 115,
    tier: 'Tier 2'
  },
  {
    rank: 5,
    name: 'Marcus Thorne',
    rollNumber: '21CS031',
    trustScore: 92.0,
    accuracyPct: 95.0,
    accuracyTrend: 2.1,
    votesCount: 104,
    tier: 'Tier 2'
  }
];

export const RECONCILIATION_LEDS: ReconciliationRecord[] = [
  {
    id: 'rec1',
    time: '09:00 AM UTC',
    subjectCode: 'CS603',
    subjectName: 'Advanced Algorithms',
    status: 'immutable',
    statusText: 'Conducted • Auto-Reconciled (Present)'
  },
  {
    id: 'rec2',
    time: '10:15 AM UTC',
    subjectCode: 'CS605',
    subjectName: 'Database Internals',
    status: 'immutable',
    statusText: 'Conducted • Auto-Reconciled (Present)'
  },
  {
    id: 'rec3',
    time: '11:30 AM UTC',
    subjectCode: 'CS602',
    subjectName: 'Computer Networks',
    status: 'flagged',
    statusText: 'Flagged Mismatch / Proxy / Network Anomaly Detected',
    anomalyReason: 'BLE beacon proximity lost between 11:34 AM and 12:10 PM UTC due to device battery drainage.'
  },
  {
    id: 'rec4',
    time: '02:00 PM UTC',
    subjectCode: 'CS612',
    subjectName: 'Systems Lab',
    status: 'exempted',
    statusText: 'Scheduled Free Period (Teacher on Leave)'
  }
];
