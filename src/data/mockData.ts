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
  statusTag?: string;
  statusType?: 'safe' | 'critical' | 'optional';
}

export interface TodaySequenceItem {
  id: string;
  time: string;
  room: string;
  subjectCode: string;
  subjectName: string;
  faculty: string;
  status: 'conducted_gps' | 'conducted' | 'awaiting_check' | 'scheduled' | 'exempted';
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
export const LEADERBOARD_DATA: LeaderboardNode[] = [];
export const RECONCILIATION_LEDS: ReconciliationRecord[] = [];
