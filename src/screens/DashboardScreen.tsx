import React, { useState } from 'react';
import { 
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
import { TODAY_SEQUENCE, TIMETABLE_MATRIX } from '../data/mockData';
import { useApp } from '../context/AppContext';

interface DashboardScreenProps {
  onOpenVotingModal: () => void;
}

// SVG Circular Donut Attendance Meter Component (Pastel Warm Theme)
const HeroCircularMeter: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 150 }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = 'url(#coralWarmGradHero)';
  if (percentage < 75) strokeColor = '#EF4444';
  else if (percentage < 85) strokeColor = '#F59E0B';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="coralWarmGradHero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B4B" />
            <stop offset="100%" stopColor="#FF5533" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1E5D8"
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
        <span className="font-jakarta font-bold text-4xl text-neutral-900 tnum tracking-tight">
          {percentage}%
        </span>
        <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold mt-1 border border-emerald-200">
          Safe Zone
        </span>
      </div>
    </div>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onOpenVotingModal }) => {
  const { subjects, userProfile, todayTimetable } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('cs601');
  const [skipCount, setSkipCount] = useState<number>(3);

  // Dynamic day calculation for schedule header
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays: Record<string, string> = {
    Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday'
  };
  const currentDayCode = daysOfWeek[new Date().getDay()];
  const currentDayFull = fullDays[currentDayCode] || 'Today';

  // Compute active schedule sequence from Firestore todayTimetable or fallback
  const scheduleItems = (todayTimetable && todayTimetable.length > 0) ? todayTimetable.map((slot: any, idx: number) => ({
    id: slot.id || `slot-${idx}`,
    time: slot.time || '09:00 AM - 10:00 AM',
    room: slot.room || 'LH-302',
    subjectCode: slot.subjectCode || 'CS-601',
    subjectName: slot.subjectName || 'Distributed Systems',
    faculty: slot.faculty || 'Dr. R. Sharma',
    status: idx === 0 ? 'conducted_consensus' : idx === 1 ? 'awaiting_check' : 'scheduled',
    statusText: idx === 0 ? 'Real-Time Consensus Verified' : idx === 1 ? 'Active Geo-Fence Check Window' : 'Scheduled Lecture Window',
    subText: 'Synced with Firestore Batch Schedule'
  })) : TODAY_SEQUENCE;

  // Dynamic overall attendance math
  const totalAttendedAll = subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalClassesAll = subjects.reduce((acc, s) => acc + s.total, 0);
  const overallPercentage = totalClassesAll > 0 ? Number(((totalAttendedAll / totalClassesAll) * 100).toFixed(1)) : 81.4;
  const totalBufferHeadroom = subjects.reduce((acc, s) => acc + Math.max(0, s.bufferHeadroom), 0);

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

  // Attend Streak Simulator State & Calculation
  const [attendStreakCount, setAttendStreakCount] = useState<number>(5);
  const streakTotalAttended = currentAttended + attendStreakCount;
  const streakTotalClasses = currentTotal + attendStreakCount;
  const streakProjectedPercentage = Number(((streakTotalAttended / streakTotalClasses) * 100).toFixed(1));
  const isStreakProjectedSafe = streakProjectedPercentage >= 75.0;

  const generateStreakChartData = () => {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      const att = currentAttended + i;
      const tot = currentTotal + i;
      const pct = Number(((att / tot) * 100).toFixed(1));
      data.push({
        classes: `+${i}`,
        percentage: pct,
      });
    }
    return data;
  };

  const streakChartData = generateStreakChartData();

  return (
    <div className="space-y-8 py-4 max-w-[1280px] mx-auto">
      
      {/* 1. HERO ATTENDANCE CARD — Dominant Single Metric */}
      <section className="stealth-card p-6 md:p-8 border border-amber-100 shadow-xl shadow-amber-900/5 bg-white rounded-3xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          {/* Left: Overall Status Headline & Actionable Forecast */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-mono text-emerald-800">
              <span className="radar-dot" />
              <span className="tnum font-bold">ATTENDANCE HEALTH: {overallPercentage >= 75 ? 'OPTIMAL' : 'WARNING'}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-jakarta font-bold text-neutral-900 tracking-tight">
              Overall Attendance: <span className="text-[#FF6B4B] tnum">{overallPercentage}%</span>
            </h1>

            <p className="text-base text-neutral-600 leading-relaxed max-w-xl font-sans">
              Welcome back, <strong className="text-neutral-900 font-bold">{userProfile.fullName || 'Gaurav Bisht'}</strong> ({userProfile.rollNumber || '21CS045'}). You have <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 tnum">{totalBufferHeadroom} safe skips</span> remaining across all subjects before reaching the mandatory 75% limit.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-mono">
              <button
                onClick={onOpenVotingModal}
                className="btn-primary px-5 py-2.5 text-xs font-mono uppercase flex items-center space-x-2 shadow-md shadow-orange-500/20"
              >
                <Radio className="w-4 h-4" />
                <span>Check In To Live Class</span>
              </button>
            </div>
          </div>

          {/* Right: Large Hero Meter */}
          <HeroCircularMeter percentage={overallPercentage} size={150} />

        </div>
      </section>

      {/* 2. TODAY'S SCHEDULE — Simplified Vertical List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#FF6B4B]" />
            <h2 className="text-xl font-jakarta font-bold text-neutral-900">Today's Schedule</h2>
            <span className="text-xs font-mono text-neutral-500">• {currentDayFull} Schedule</span>
          </div>
          <span className="text-xs font-mono text-neutral-500 font-bold">{scheduleItems.length} Classes Scheduled</span>
        </div>

        <div className="space-y-3">
          {scheduleItems.map((item: any) => {
            const isExpanded = expandedScheduleId === item.id;
            return (
              <div 
                key={item.id}
                className="bg-white border border-amber-100 hover:border-orange-200 rounded-2xl p-4.5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Class Info */}
                  <div className="flex items-center space-x-4">
                    <div className="text-xs font-mono font-bold text-neutral-600 w-24 shrink-0 tnum bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-center">
                      {item.time.split('-')[0].trim()}
                    </div>
                    <div>
                      <h3 className="font-jakarta font-bold text-neutral-900 text-base">
                        {item.subjectName} <span className="text-xs font-mono text-neutral-500 font-semibold">({item.subjectCode})</span>
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">
                        📍 {item.room} • {item.faculty}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill & Expand Details Toggle */}
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
                      item.status === 'conducted_gps' || item.status === 'conducted_consensus'
                        ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                        : item.status === 'awaiting_check'
                        ? 'bg-amber-100 border-amber-200 text-amber-800'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                      {item.status === 'conducted_gps' || item.status === 'conducted_consensus' 
                        ? 'Conducted' 
                        : item.status === 'awaiting_check' 
                        ? 'Awaiting Check' 
                        : 'Upcoming'}
                    </span>

                    <button
                      onClick={() => setExpandedScheduleId(isExpanded ? null : item.id)}
                      className="text-neutral-500 hover:text-neutral-900 p-1.5 rounded-full hover:bg-amber-50 transition-colors"
                      title="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progressive Disclosure: Hidden Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-amber-100 text-xs font-mono text-neutral-600 flex flex-wrap items-center justify-between gap-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                    <div>
                      <span className="text-neutral-500 uppercase block text-[10px] font-bold">Verification Engine:</span>
                      <span className="text-neutral-900 font-semibold">{item.statusText}</span>
                    </div>
                    {item.subText && (
                      <div>
                        <span className="text-neutral-500 uppercase block text-[10px] font-bold">Verification Details:</span>
                        <span className="text-emerald-700 font-bold tnum">{item.subText}</span>
                      </div>
                    )}
                    <button
                      onClick={onOpenVotingModal}
                      className="btn-stealth px-3 py-1 text-[10px] uppercase font-mono shadow-xs"
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

      {/* 3. SUBJECT ATTENDANCE CARDS — Clean 2x2 Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div>
            <h2 className="text-xl font-jakarta font-bold text-neutral-900">Subject Attendance</h2>
            <p className="text-xs text-neutral-500 font-mono">Current Semester Courses</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((sub) => {
            const isCardExpanded = expandedSubjectId === sub.id;
            return (
              <div 
                key={sub.id}
                className={`stealth-card p-6 space-y-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all ${
                  sub.status === 'critical' 
                    ? 'border-rose-300 bg-rose-50/20' 
                    : sub.status === 'warning'
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-amber-100'
                }`}
              >
                {/* Header: Subject & Big Attendance % */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">{sub.code}</span>
                    <h3 className="text-lg font-jakarta font-bold text-neutral-900 mt-1">{sub.name}</h3>
                  </div>

                  <div className="text-right">
                    <span className={`text-3xl font-jakarta font-bold tnum ${
                      sub.status === 'critical' ? 'text-rose-600' : sub.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {sub.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-amber-100/60 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.status === 'critical' 
                          ? 'bg-rose-500' 
                          : sub.status === 'warning' 
                          ? 'bg-amber-500' 
                          : 'bg-gradient-to-r from-[#FF6B4B] to-emerald-500'
                      }`}
                      style={{ width: `${sub.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Plain Forecast Line */}
                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
                    sub.status === 'critical' 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : sub.status === 'warning' 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {sub.actionableNote}
                  </span>

                  <button
                    onClick={() => setExpandedSubjectId(isCardExpanded ? null : sub.id)}
                    className="text-neutral-500 hover:text-neutral-900 flex items-center space-x-1 text-[11px] font-semibold hover:underline"
                  >
                    <span>{isCardExpanded ? 'Hide Details' : 'Details'}</span>
                    {isCardExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Progressive Disclosure: Expanded Technical Card Details */}
                {isCardExpanded && (
                  <div className="pt-3 border-t border-amber-100 text-xs font-mono space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
                    <div className="flex justify-between text-neutral-800">
                      <span>Classes Attended:</span>
                      <span className="font-bold tnum">{sub.attended} / {sub.total} Total</span>
                    </div>
                    <div className="flex justify-between text-neutral-800">
                      <span>Course Instructor:</span>
                      <span>{sub.faculty} ({sub.credits} Credits)</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Buffer Headroom:</span>
                      <span className="tnum">{sub.bufferHeadroom} Skips</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. COLLAPSIBLE ADVANCED TOOLS & SIMULATORS */}
      <section className="stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
        <button
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[#FF6B4B]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-jakarta font-bold text-neutral-900">Advanced Tools & Simulators</h2>
              <p className="text-xs text-neutral-500 font-mono">What-If Skip & Attend Streak Simulators</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 btn-stealth px-4 py-2 text-xs font-mono shadow-xs">
            <span>{showAdvancedTools ? 'Collapse Simulators' : 'Expand Simulators'}</span>
            {showAdvancedTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvancedTools && (
          <div className="pt-4 border-t border-amber-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* What-If Simulator Card */}
            <div className="lg:col-span-6 space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <h3 className="font-jakarta font-bold text-neutral-900 text-sm">"What-If" Skip Simulator</h3>
                <span className="text-[10px] font-mono text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-bold uppercase">Predictive Model</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-600 uppercase font-semibold">Select Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
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
                  <span className="text-neutral-600 font-semibold">Simulate Skipping</span>
                  <span className="text-[#FF6B4B] font-bold text-xs bg-white border border-orange-200 px-3 py-0.5 rounded-full tnum shadow-xs">
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
                  className="w-full h-2 bg-amber-200/70 rounded-full appearance-none cursor-pointer accent-[#FF6B4B]"
                />
              </div>

              {/* Chart */}
              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPctSim" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProjectedSafe ? "#FF6B4B" : "#EF4444"} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={isProjectedSafe ? "#FF6B4B" : "#EF4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="cuts" tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis domain={[60, 100]} tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#FED7AA', borderRadius: '8px', fontSize: '11px', color: '#1C1917' }}
                      itemStyle={{ color: '#FF6B4B' }}
                    />
                    <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '75% MIN', fill: '#D97706', fontSize: 9 }} />
                    <Area 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke={isProjectedSafe ? "#FF6B4B" : "#EF4444"} 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorPctSim)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                isProjectedSafe 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <span className="font-semibold">Projected Attendance:</span>
                <span className="font-bold tnum text-sm">{selectedSubject.percentage}% → {projectedPercentage}%</span>
              </div>
            </div>

            {/* Attend Streak Simulator Card */}
            <div className="lg:col-span-6 space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <h3 className="font-jakarta font-bold text-neutral-900 text-sm">Attend Streak Simulator</h3>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold uppercase">Improvement Model</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-600 uppercase font-semibold">Select Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="input-stealth w-full font-mono text-xs bg-white border-amber-200"
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
                  <span className="text-neutral-600 font-semibold">Simulate Attending</span>
                  <span className="text-emerald-700 font-bold text-xs bg-white border border-emerald-200 px-3 py-0.5 rounded-full tnum shadow-xs">
                    {attendStreakCount} {attendStreakCount === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={attendStreakCount}
                  onChange={(e) => setAttendStreakCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-amber-200/70 rounded-full appearance-none cursor-pointer accent-[#10B981]"
                />
              </div>

              {/* Chart */}
              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={streakChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPctSimStreak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="classes" tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis domain={[50, 100]} tick={{ fill: '#78716C', fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#A7F3D0', borderRadius: '8px', fontSize: '11px', color: '#1C1917' }}
                      itemStyle={{ color: '#10B981' }}
                    />
                    <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '75% MIN', fill: '#D97706', fontSize: 9 }} />
                    <Area 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorPctSimStreak)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                isStreakProjectedSafe 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className="font-semibold">Projected Attendance:</span>
                <span className="font-bold tnum text-sm">{selectedSubject.percentage}% → {streakProjectedPercentage}%</span>
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
    <section className="stealth-card p-6 space-y-4 bg-white border border-amber-100 rounded-3xl shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-jakarta font-bold text-neutral-900">Full Weekly Timetable</h2>
            <p className="text-xs text-neutral-500 font-mono">Semester VI Schedule</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 btn-stealth px-4 py-2 text-xs font-mono shadow-xs">
          <span>{open ? 'Collapse' : 'View Timetable'}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="pt-4 border-t border-amber-100 overflow-x-auto">
          <div className="grid grid-cols-6 gap-3 min-w-[900px]">
            {DAYS.map((day) => (
              <div key={day} className="space-y-3">
                {/* Day header */}
                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center">
                  <p className="font-jakarta font-bold text-neutral-900 text-sm">{day}</p>
                  <p className="text-[10px] font-mono text-neutral-500">{DAY_SUBTITLES[day]}</p>
                </div>

                {/* Slots */}
                {TIMETABLE_MATRIX.filter((s) => s.day === day).map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-xl border space-y-2 transition-all ${
                      slot.type === 'Laboratory'
                        ? 'border-purple-200 bg-purple-50/50 text-purple-900'
                        : slot.type === 'Seminar'
                        ? 'border-teal-200 bg-teal-50/50 text-teal-900'
                        : slot.type === 'Free'
                        ? 'border-neutral-200 bg-neutral-50/60 opacity-70'
                        : 'border-amber-100 bg-white text-neutral-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        slot.type === 'Laboratory'
                          ? 'bg-purple-100 text-purple-800'
                          : slot.type === 'Seminar'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {slot.type}
                      </span>
                      {slot.statusTag && (
                        <span className={`text-[9px] font-mono font-bold ${
                          slot.statusType === 'critical' ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {slot.statusTag}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-jakarta font-bold text-neutral-900 text-xs truncate">{slot.subjectName}</h4>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">{slot.faculty || 'Unassigned'}</p>
                    </div>
                    <div className="pt-2 border-t border-amber-100/60 flex items-center justify-between text-[10px] font-mono text-neutral-500 tnum">
                      <span>📍 {slot.room}</span>
                      <span className="font-semibold text-neutral-700">{slot.time.split(' ')[0]}</span>
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
