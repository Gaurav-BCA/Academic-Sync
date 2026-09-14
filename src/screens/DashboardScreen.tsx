import React, { useState } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Radio, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  Award
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
import { INITIAL_SUBJECTS, TODAY_SEQUENCE, SubjectTelemetry } from '../data/mockData';

interface DashboardScreenProps {
  onOpenVotingModal: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onOpenVotingModal }) => {
  const [subjects, setSubjects] = useState<SubjectTelemetry[]>(INITIAL_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('cs601');
  const [skipCount, setSkipCount] = useState<number>(3);

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
    <div className="space-y-6 py-4">
      
      {/* Top Banner Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">SYSTEM RUNTIME: CLUSTER-NODE // ACTIVE_INGESTION</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">POLL_INTERVAL: 450ms</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <span>TELEMETRY CONSENSUS LOCK: 09:14:02 UTC</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <Radio className="w-3 h-3 animate-ping" />
            <span>Online</span>
          </span>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Metric 1: Total Attendance Vector */}
        <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SYSTEM TELEMETRY // METRIC-01</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">Total Attendance Vector</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-extrabold font-mono text-white">81.4%</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                +1.4% EST
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Threshold benchmark: 75.0% (114 / 140 sync units)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 font-semibold">HEALTH STATUS: NOMINAL</span>
            <span className="text-slate-400">CONFIDENCE 99.8%</span>
          </div>
        </div>

        {/* Metric 2: Risk Buffer Allocation */}
        <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>RISK BUFFER ALLOCATION</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase">Permissible Margin</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-extrabold font-mono text-white">5</span>
              <span className="text-sm font-mono text-slate-300">Lectures</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Max safe cuts remaining before danger zone (&lt;75%)
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Recommended tactical buffer:</span>
            <span className="text-cyan-400 font-bold">2 Cycles</span>
          </div>
        </div>

        {/* Metric 3: Next Ingestion */}
        <div className="bg-[#121722] border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>NEXT SCHEDULED INGESTION</span>
            <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
              CS601
            </span>
          </div>
          <div>
            <p className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Starts in 24m 10s</span>
            </p>
            <h3 className="text-lg font-bold text-white mt-1">Distributed Systems</h3>
            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
              <span>📍 LH-302</span>
              <span>•</span>
              <span>👨‍🏫 Dr. R. Sharma</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-400 flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>GPS Beacon Ready</span>
            </span>
            <button 
              onClick={onOpenVotingModal}
              className="bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 px-2.5 py-0.5 rounded text-[10px]"
            >
              AUTO-SYNC ON
            </button>
          </div>
        </div>

      </div>

      {/* Middle Grid: Timeline (Left) & Simulator + Trust Network (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Timeline: Daily Sequence */}
        <div className="lg:col-span-6 bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">SYNC CHRONO STREAM</span>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Daily Sequence</span>
                <span className="text-slate-500 font-normal">• Monday, Oct 27</span>
              </h2>
            </div>
            <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-400">
              🔒 Fully Automated Ledger
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
            {TODAY_SEQUENCE.map((item) => (
              <div key={item.id} className="relative pl-8 space-y-1 group">
                {/* Timeline dot */}
                <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 bg-[#121722] -translate-x-1/2 ${
                  item.status === 'conducted_gps'
                    ? 'border-emerald-400 bg-emerald-400'
                    : item.status === 'conducted_consensus'
                    ? 'border-cyan-400 bg-cyan-400'
                    : item.status === 'awaiting_check'
                    ? 'border-amber-400 bg-amber-400 animate-pulse'
                    : 'border-slate-600'
                }`} />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{item.time} • {item.room}</span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                    item.status === 'conducted_gps' || item.status === 'conducted_consensus'
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                      : item.status === 'awaiting_check'
                      ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {item.statusText}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm">{item.subjectName} ({item.subjectCode})</h4>
                <p className="text-xs text-slate-400">{item.faculty}</p>
                {item.subText && (
                  <p className="text-[11px] font-mono text-slate-500 pt-0.5">{item.subText}</p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center space-x-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Manual Tampering: Status updates are authenticated via peer mesh & geofenced beacons automatically.</span>
          </div>
        </div>

        {/* Right Column: What-If Simulator + Trust Network */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* What-If Predictive Simulator Card */}
          <div className="bg-[#121722] border border-cyan-900/30 rounded-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">PREDICTIVE HEURISTIC MODELING</span>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>"What-If" Simulator</span>
                </h2>
              </div>
            </div>

            {/* Target Module Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400">TARGET ACADEMIC MODULE</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-[#0B0E14] border border-slate-800 text-xs font-mono text-white rounded-xl p-3 outline-none focus:border-cyan-500 transition-colors"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code}) — Current: {sub.percentage}%
                  </option>
                ))}
              </select>
            </div>

            {/* Skip Slider Control */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 uppercase">SKIP NEXT N LECTURES</span>
                <span className="text-cyan-400 font-bold text-sm bg-cyan-950/80 px-3 py-0.5 rounded-lg border border-cyan-800/60">
                  {skipCount} {skipCount === 1 ? 'Lecture' : 'Lectures'}
                </span>
              </div>
              
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={skipCount}
                onChange={(e) => setSkipCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0 (No cut)</span>
                <span>2</span>
                <span>4</span>
                <span>6 (High risk)</span>
              </div>
            </div>

            {/* Recharts Area Curve */}
            <div className="h-32 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProjectedSafe ? "#06B6D4" : "#EF4444"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={isProjectedSafe ? "#06B6D4" : "#EF4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="cuts" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis domain={[60, 100]} tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#1E293B', borderRadius: '8px', fontSize: '11px' }}
                    itemStyle={{ color: '#00F0FF' }}
                  />
                  <ReferenceLine y={75} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: '75% THRESHOLD', fill: '#F59E0B', fontSize: 9 }} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke={isProjectedSafe ? "#00F0FF" : "#EF4444"} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorPct)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Simulator Output Trajectory Badge */}
            <div className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
              isProjectedSafe 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Projected Trajectory</span>
                <span className="font-bold text-sm">
                  {selectedSubject.percentage}% → {projectedPercentage}%
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                isProjectedSafe ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
              }`}>
                {isProjectedSafe ? 'SAFE (Above 75%)' : 'CRITICAL (Below 75%)'}
              </span>
            </div>

            <p className="text-[10px] font-mono text-slate-500">
              💡 Simulation only — calculated locally using live database vectors. Does not write mutations to your genuine ledger.
            </p>
          </div>

          {/* Trust & Consensus Network Card */}
          <div className="bg-[#121722] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">CONSENSUS INTEGRITY POOL</span>
                <h3 className="text-base font-bold text-white">Trust & Consensus Network</h3>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold font-mono text-white">98.2</span>
                <span className="text-slate-500 font-mono text-sm"> / 100</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                📈 +2.4% vs last week
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="bg-purple-950/80 border border-purple-800 text-purple-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                TOP 5% RELIABILITY TIER
              </span>
              <span className="text-slate-400">Weight Multiplier: 1.42x</span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>TOTAL ATTESTATIONS: 382</span>
              <span>DISPUTE RATE: 0.00%</span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Section: Subject Telemetry Units Grid */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">MODULE BREAKDOWN // ACTIVE SEMESTERS</span>
            <h2 className="text-xl font-bold text-white">Subject Telemetry Units</h2>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-lg">Filter: All Courses</span>
            <span className="bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-lg">Sort: Margin ASC</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((sub) => (
            <div 
              key={sub.id}
              className={`bg-[#121722] border rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all hover:border-slate-700 ${
                sub.status === 'critical' 
                  ? 'border-rose-900/50 bg-rose-950/10' 
                  : sub.status === 'warning'
                  ? 'border-amber-900/50 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400">{sub.code}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      sub.status === 'critical' ? 'bg-rose-500' : sub.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`} />
                    <span className="text-[10px] font-mono uppercase text-slate-500">{sub.status}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{sub.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{sub.credits} Credits • {sub.faculty}</p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-3xl font-extrabold text-white">{sub.percentage}%</div>
                  <div className="text-[11px] text-slate-400">{sub.attended} / {sub.total} Attended</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      sub.status === 'critical' ? 'bg-rose-500' : sub.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0%</span>
                  <span>75% Target: {Math.ceil(sub.total * 0.75)}/{sub.total}</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Actionable Note Footer */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                sub.status === 'critical'
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 font-bold'
                  : sub.status === 'warning'
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                <span>{sub.actionableNote}</span>
                <span className="text-[10px] opacity-80">Buffer: {sub.bufferHeadroom}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
