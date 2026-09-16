import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Radio, 
  Sliders, 
  ChevronDown,
  ChevronUp,
  Calendar,
  Grid
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { INITIAL_SUBJECTS, TODAY_SEQUENCE, TIMETABLE_MATRIX, SubjectTelemetry } from '../data/mockData';

interface DashboardScreenProps {
  onOpenVotingModal: () => void;
}

// SVG Circular Donut Attendance Meter Component
const HeroCircularMeter: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 140 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'url(#indigoVioletGradHero)';
  if (percentage < 75) strokeColor = '#EF4444';
  else if (percentage < 85) strokeColor = '#F59E0B';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="indigoVioletGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-jakarta font-bold text-4xl text-white tnum tracking-tight">
          {percentage}%
        </span>
        <span className="text-[10px] font-mono uppercase text-[#10B981] font-semibold tracking-wider">
          Safe Zone
        </span>
      </div>
    </div>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onOpenVotingModal }) => {
  const [subjects] = useState<SubjectTelemetry[]>(INITIAL_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('cs601');
  const [skipCount, setSkipCount] = useState<number>(3);

  // Progressive Disclosure State
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [showAdvancedTools, setShowAdvancedTools] = useState<boolean>(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  // Calculate What-If Projected Percentage
  const currentAttended = selectedSubject.attended;
  const currentTotal = selectedSubject.total;
  const projectedTotal = currentTotal + skipCount;
  const projectedPercentage = Number(((currentAttended / projectedTotal) * 100).toFixed(1));
  const isProjectedSafe = projectedPercentage >= 75.0;

  // Chart data points for What-If projection curve
  const generateChartData = () => {
    const data = [];
    for (let i = 0; i <= 6; i++) {
      const tot = currentTotal + i;
      const pct = Number(((currentAttended / tot) * 100).toFixed(1));
      data.push({
        cuts: `${i} Cuts`,
        percentage: pct,
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-10 py-6 max-w-[1280px] mx-auto">
      
      {/* 1. HERO ATTENDANCE CARD — Dominant Single Metric */}
      <section className="stealth-card p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          {/* Left: Overall Status Headline & Actionable Forecast */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center space-x-2 bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1 rounded text-xs font-mono text-[#10B981]">
              <span className="radar-dot" />
              <span className="tnum font-semibold">ATTENDANCE HEALTH: OPTIMAL</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-jakarta font-bold text-white tracking-tight">
              Overall Attendance: <span className="text-[#10B981] tnum">81.4%</span>
            </h1>

            <p className="text-base text-[#DFE2F1] leading-relaxed max-w-xl font-sans">
              You are comfortably in the safe zone. You have <span className="font-bold text-[#6BD8CB] tnum">5 safe skips</span> remaining across all subjects before reaching the mandatory 75% limit.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono">
              <button
                onClick={onOpenVotingModal}
                className="btn-primary px-4 py-2 text-xs font-mono uppercase flex items-center space-x-2"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Check In To Live Class</span>
              </button>
            </div>
          </div>

          {/* Right: Large Hero Meter */}
          <HeroCircularMeter percentage={81.4} size={150} />

        </div>
      </section>

      {/* 2. TODAY'S SCHEDULE — Simplified Vertical List with Progressive Disclosure */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#233044] pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-xl font-jakarta font-bold text-white">Today's Schedule</h2>
            <span className="text-xs font-mono text-[#94A3B8]">• Monday, Oct 27</span>
          </div>
          <span className="text-xs font-mono text-[#64748B]">4 Classes Scheduled</span>
        </div>

        <div className="space-y-3">
          {TODAY_SEQUENCE.map((item) => {
            const isExpanded = expandedScheduleId === item.id;
            return (
              <div 
                key={item.id}
                className="stealth-card p-4 transition-all hover:border-[#3E506B]"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Class Info */}
                  <div className="flex items-center space-x-4">
                    <div className="text-xs font-mono text-[#94A3B8] w-20 shrink-0 tnum">
                      {item.time.split('-')[0].trim()}
                    </div>
                    <div>
                      <h3 className="font-jakarta font-semibold text-white text-base">
                        {item.subjectName} <span className="text-xs font-mono text-[#94A3B8]">({item.subjectCode})</span>
                      </h3>
                      <p className="text-xs text-[#94A3B8] font-mono">
                        📍 {item.room} • {item.faculty}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill & Expand Details Toggle */}
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-mono px-3 py-1 rounded font-semibold border ${
                      item.status === 'conducted_gps' || item.status === 'conducted_consensus'
                        ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                        : item.status === 'awaiting_check'
                        ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                        : 'bg-[#161F30] border-[#233044] text-[#94A3B8]'
                    }`}>
                      {item.status === 'conducted_gps' || item.status === 'conducted_consensus' 
                        ? 'Conducted' 
                        : item.status === 'awaiting_check' 
                        ? 'Awaiting Check' 
                        : 'Upcoming'}
                    </span>

                    <button
                      onClick={() => setExpandedScheduleId(isExpanded ? null : item.id)}
                      className="text-[#94A3B8] hover:text-white p-1 rounded hover:bg-[#161F30] transition-colors"
                      title="Toggle technical details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progressive Disclosure: Hidden Technical Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#233044] text-xs font-mono text-[#94A3B8] flex flex-wrap items-center justify-between gap-2 bg-[#161F30] p-3 rounded">
                    <div>
                      <span className="text-[#64748B] uppercase block text-[10px]">Verification Engine:</span>
                      <span className="text-[#DFE2F1]">{item.statusText}</span>
                    </div>
                    {item.subText && (
                      <div>
                        <span className="text-[#64748B] uppercase block text-[10px]">Node Metadata:</span>
                        <span className="text-[#6BD8CB] tnum">{item.subText}</span>
                      </div>
                    )}
                    <button
                      onClick={onOpenVotingModal}
                      className="btn-stealth px-2.5 py-1 text-[10px] uppercase font-mono"
                    >
                      Open Live Check Modal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SUBJECT ATTENDANCE CARDS — Clean 2x2 Grid with Progressive Disclosure */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#233044] pb-3">
          <div>
            <h2 className="text-xl font-jakarta font-bold text-white">Subject Attendance</h2>
            <p className="text-xs text-[#94A3B8] font-mono">Current Semester Courses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((sub) => {
            const isCardExpanded = expandedSubjectId === sub.id;
            return (
              <div 
                key={sub.id}
                className={`stealth-card p-5 space-y-4 ${
                  sub.status === 'critical' 
                    ? 'border-[#EF4444]/40' 
                    : sub.status === 'warning'
                    ? 'border-[#F59E0B]/40'
                    : ''
                }`}
              >
                {/* Header: Subject & Big Attendance % */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-[#94A3B8]">{sub.code}</span>
                    <h3 className="text-lg font-jakarta font-bold text-white mt-0.5">{sub.name}</h3>
                  </div>

                  <div className="text-right">
                    <span className={`text-3xl font-jakarta font-bold tnum ${
                      sub.status === 'critical' ? 'text-[#EF4444]' : sub.status === 'warning' ? 'text-[#F59E0B]' : 'text-[#10B981]'
                    }`}>
                      {sub.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#0F131D] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.status === 'critical' 
                          ? 'bg-[#EF4444]' 
                          : sub.status === 'warning' 
                          ? 'bg-[#F59E0B]' 
                          : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Plain Forecast Line */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className={`font-semibold ${
                    sub.status === 'critical' 
                      ? 'text-[#EF4444]' 
                      : sub.status === 'warning' 
                      ? 'text-[#F59E0B]' 
                      : 'text-[#10B981]'
                  }`}>
                    {sub.actionableNote}
                  </span>

                  <button
                    onClick={() => setExpandedSubjectId(isCardExpanded ? null : sub.id)}
                    className="text-[#94A3B8] hover:text-white flex items-center space-x-1 text-[11px] hover:underline"
                  >
                    <span>{isCardExpanded ? 'Hide Details' : 'Details'}</span>
                    {isCardExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Progressive Disclosure: Expanded Technical Card Details */}
                {isCardExpanded && (
                  <div className="pt-3 border-t border-[#233044] text-xs font-mono space-y-2 bg-[#161F30] p-3 rounded">
                    <div className="flex justify-between text-[#DFE2F1]">
                      <span>Classes Attended:</span>
                      <span className="font-bold tnum">{sub.attended} / {sub.total} Total</span>
                    </div>
                    <div className="flex justify-between text-[#DFE2F1]">
                      <span>Course Instructor:</span>
                      <span>{sub.faculty} ({sub.credits} Credits)</span>
                    </div>
                    <div className="flex justify-between text-[#6BD8CB]">
                      <span>Buffer Headroom:</span>
                      <span className="tnum font-bold">{sub.bufferHeadroom}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. COLLAPSIBLE ADVANCED TOOLS & SIMULATORS */}
      <section className="stealth-card p-5 space-y-4">
        <button
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#6366F1]" />
            <div>
              <h2 className="text-lg font-jakarta font-bold text-white">Advanced Tools & Simulators</h2>
              <p className="text-xs text-[#94A3B8] font-mono">What-If Skip Simulator & Quorum Trust Matrix</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 btn-stealth px-3 py-1.5 text-xs font-mono">
            <span>{showAdvancedTools ? 'Collapse Simulators' : 'Expand Simulators'}</span>
            {showAdvancedTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvancedTools && (
          <div className="pt-4 border-t border-[#233044] grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* What-If Simulator Card */}
            <div className="lg:col-span-6 space-y-4 bg-[#161F30] p-5 rounded border border-[#233044]">
              <div className="flex items-center justify-between border-b border-[#233044] pb-2">
                <h3 className="font-jakarta font-bold text-white text-sm">"What-If" Skip Simulator</h3>
                <span className="text-[10px] font-mono text-[#6BD8CB] uppercase">Predictive Model</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-[#94A3B8]">Select Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-stealth w-full font-mono text-xs"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code}) — Current: {sub.percentage}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#94A3B8]">Simulate Skipping</span>
                  <span className="text-[#6BD8CB] font-bold text-xs bg-[#1A2438] border border-[#233044] px-2.5 py-0.5 rounded tnum">
                    {skipCount} {skipCount === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="1"
                  value={skipCount}
                  onChange={(e) => setSkipCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#1A2438] rounded appearance-none cursor-pointer accent-[#6366F1]"
                />
              </div>

              {/* Chart */}
              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPctSim" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProjectedSafe ? "#6366F1" : "#EF4444"} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isProjectedSafe ? "#6366F1" : "#EF4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="cuts" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis domain={[60, 100]} tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '4px', fontSize: '11px', color: '#DFE2F1' }}
                      itemStyle={{ color: '#6BD8CB' }}
                    />
                    <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '75% MIN', fill: '#F59E0B', fontSize: 9 }} />
                    <Area 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke={isProjectedSafe ? "#6366F1" : "#EF4444"} 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorPctSim)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-2.5 rounded border flex items-center justify-between font-mono text-xs ${
                isProjectedSafe 
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
                  : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
              }`}>
                <span>Projected Attendance:</span>
                <span className="font-bold tnum">{selectedSubject.percentage}% → {projectedPercentage}%</span>
              </div>
            </div>

            {/* Trust Network */}
            <div className="lg:col-span-6 space-y-4 bg-[#161F30] p-5 rounded border border-[#233044] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#233044] pb-2">
                  <h3 className="font-jakarta font-bold text-white text-sm">Trust & Quorum Network</h3>
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-jakarta font-bold text-white tnum">98.2</span>
                    <span className="text-[#64748B] font-mono text-xs tnum"> / 100 TRUST SCORE</span>
                  </div>
                  <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded tnum">
                    Top 5% Reliability
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed mt-3 font-sans">
                  Your client node has maintained zero presence discrepancies across 64 consecutive class cycles, providing high consensus weight during group check-ins.
                </p>
              </div>

              <div className="pt-3 border-t border-[#233044] flex items-center justify-between text-xs font-mono text-[#64748B] tnum">
                <span>VERIFIED ATTESTATIONS: 382</span>
                <span>DISPUTES: 0</span>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* 5. FULL WEEKLY TIMETABLE — Collapsible */}
      <TimetableSection />

    </div>
  );
};

// ─── Inline Timetable Section ────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
type Day = typeof DAYS[number];

const DAY_SUBTITLES: Record<Day, string> = {
  Mon: 'Primary Core',
  Tue: 'Deep Execution',
  Wed: 'Systems Sync',
  Thu: 'Neural Pipeline',
  Fri: 'Cloud Infra',
  Sat: 'Synthetics/Colloq',
};

function TimetableSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="stealth-card p-5 space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center space-x-2">
          <Grid className="w-5 h-5 text-[#6366F1]" />
          <div>
            <h2 className="text-lg font-jakarta font-bold text-white">Full Weekly Timetable</h2>
            <p className="text-xs text-[#94A3B8] font-mono">Semester VI • Synchronous Telemetry Matrix</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 btn-stealth px-3 py-1.5 text-xs font-mono">
          <span>{open ? 'Collapse' : 'View Timetable'}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="pt-4 border-t border-[#233044] overflow-x-auto">
          <div className="grid grid-cols-6 gap-3 min-w-[900px]">
            {DAYS.map((day) => (
              <div key={day} className="space-y-3">
                {/* Day header */}
                <div className="stealth-card p-3 text-center">
                  <p className="font-jakarta font-bold text-white text-sm">{day}</p>
                  <p className="text-[10px] font-mono text-[#64748B]">{DAY_SUBTITLES[day]}</p>
                </div>

                {/* Slots */}
                {TIMETABLE_MATRIX.filter((s) => s.day === day).map((slot) => (
                  <div
                    key={slot.id}
                    className={`stealth-card p-3 space-y-2 ${
                      slot.type === 'Laboratory'
                        ? 'border-[#8B5CF6]/40 bg-[#8B5CF6]/5'
                        : slot.type === 'Seminar'
                        ? 'border-[#0D9488]/40 bg-[#0D9488]/5'
                        : slot.type === 'Free'
                        ? 'border-[#233044] bg-[#161F30]/40 opacity-70'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        slot.type === 'Laboratory'
                          ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                          : slot.type === 'Seminar'
                          ? 'bg-[#0D9488]/20 text-[#6BD8CB]'
                          : 'bg-[#161F30] text-[#94A3B8]'
                      }`}>
                        {slot.type}
                      </span>
                      {slot.statusTag && (
                        <span className={`text-[9px] font-mono font-bold ${
                          slot.statusType === 'critical' ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}>
                          {slot.statusTag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-jakarta font-semibold text-white text-xs truncate">{slot.subjectName}</h4>
                      <p className="text-[10px] font-mono text-[#94A3B8] truncate">{slot.faculty || 'Unassigned'}</p>
                    </div>
                    <div className="pt-2 border-t border-[#233044] flex items-center justify-between text-[10px] font-mono text-[#64748B] tnum">
                      <span>📍 {slot.room}</span>
                      <span>{slot.time.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
