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

export const INITIAL_SUBJECTS: SubjectTelemetry[] = [];

export const TIMETABLE_MATRIX: TimetableSlot[] = [];

export const TODAY_SEQUENCE: TodaySequenceItem[] = [];

export const LEADERBOARD_DATA: LeaderboardNode[] = [
  {
    rank: 1,
    name: 'Gaurav Bisht',
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
  }
];

export const RECONCILIATION_LEDS: ReconciliationRecord[] = [];
