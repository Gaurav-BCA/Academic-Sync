import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  Key 
} from 'lucide-react';
import { LEADERBOARD_DATA } from '../data/mockData';
import { useOnboarding } from '../context/OnboardingContext';

export const LeaderboardScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'week' | 'alltime' | 'faculty'>('week');
  const onboardingContext = useOnboarding();
  const studentProfile = onboardingContext?.studentProfile;

  const totalStudents = LEADERBOARD_DATA.length;
  const topCount = Math.min(5, totalStudents);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Rank,Student,RollNumber,ReliabilityScore,Accuracy,CheckIns,Tier\n"
      + LEADERBOARD_DATA.map(e => `${e.rank},${e.name},${e.isCurrentUser && studentProfile?.rollNumber ? studentProfile.rollNumber : e.rollNumber},${e.trustScore},${e.accuracyPct}%,${e.votesCount},${e.tier}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Class_Attendance_Summary_Sem6A.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 py-4">
      
      {/* Top Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stealth-card p-6">
        <div>
          <span className="text-[10px] font-mono text-[#6BD8CB] uppercase tracking-wider block mb-1 tnum">
            ATTENDANCE INTEGRITY & VERIFICATION • Sem VI-A
          </span>
          <h1 className="text-xl font-jakarta font-bold text-white">Class Attendance & Reliability Leaderboard</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-sans">
            Students with consistent attendance check-ins, high presence reliability, and active class participation.
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-[#161F30] p-1 rounded border border-[#233044] shrink-0">
          <button
            onClick={() => setActiveFilter('week')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeFilter === 'week' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            This Cycle (Sem VI-A)
          </button>
          <button
            onClick={() => setActiveFilter('alltime')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeFilter === 'alltime' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setActiveFilter('faculty')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
              activeFilter === 'faculty' ? 'bg-[#1E293B] text-white font-bold' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Verification Ratio
          </button>
        </div>
      </div>

      {/* Verification Rule Notice Banner */}
      <div className="bg-[#161F30] border border-[#233044] rounded p-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#94A3B8]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>
            Attendance reliability is calculated based on verified lecture check-ins, Class Coordinator confirmations, and class participation.
          </span>
        </div>
        <div className="text-[10px] text-[#64748B] shrink-0 tnum">
          Academic Term: 2025-26
        </div>
      </div>

      {/* Main Grid: Leaderboard Table (Left) & Network Standing (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Leaderboard Table */}
        <div className="lg:col-span-8 stealth-card p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#233044] text-[#64748B] text-[10px] uppercase">
                  <th className="py-3 px-2">RANK</th>
                  <th className="py-3 px-2">STUDENT / ROLL NUMBER</th>
                  <th className="py-3 px-2 text-right">RELIABILITY SCORE</th>
                  <th className="py-3 px-2 text-right">ACCURACY %</th>
                  <th className="py-3 px-2 text-right">CHECK-INS</th>
                  <th className="py-3 px-2 text-center">STANDING TIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#233044]">
                {LEADERBOARD_DATA.map((student) => {
                  const displayRollNumber = student.isCurrentUser && studentProfile?.rollNumber 
                    ? studentProfile.rollNumber 
                    : student.rollNumber;
                  const displayName = student.isCurrentUser && studentProfile?.fullName
                    ? studentProfile.fullName
                    : student.name;

                  return (
                    <tr 
                      key={displayRollNumber}
                      className={`transition-colors ${
                        student.isCurrentUser ? 'bg-[#6366F1]/10 font-bold' : 'hover:bg-[#161F30]'
                      }`}
                    >
                      <td className="py-3.5 px-2 font-bold text-[#DFE2F1] tnum">
                        #{String(student.rank).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs tnum ${
                            student.isCurrentUser ? 'bg-[#6366F1] text-white' : 'bg-[#161F30] border border-[#233044] text-[#DFE2F1]'
                          }`}>
                            {displayName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-white text-sm font-jakarta font-semibold">{displayName}</span>
                              {student.isCurrentUser && (
                                <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/40 px-1.5 py-0.2 text-[9px] rounded uppercase font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#64748B] tnum">{displayRollNumber}</span>
                          </div>
                        </div>
                      </td>
                      {/* DEV NOTE: Reliability scores, accuracy percentages, and check-in counts below are sample demonstration data */}
                      <td className="py-3.5 px-2 text-right font-jakarta font-bold text-white text-sm tnum">
                        {student.trustScore.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="text-[#10B981] font-bold text-sm tnum">{student.accuracyPct}%</div>
                        <div className={`text-[10px] tnum ${student.accuracyTrend >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {student.accuracyTrend >= 0 ? `↑ +${student.accuracyTrend}%` : `↓ ${student.accuracyTrend}%`}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-right text-[#DFE2F1] tnum">
                        {student.votesCount}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold tnum ${
                          student.tier.includes('Tier 1')
                            ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/30'
                        }`}>
                          ● {student.tier.includes('Tier 1') ? 'Gold Tier' : 'Silver Tier'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-[#233044] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#94A3B8]">
            <span className="tnum">Showing top {topCount} of {totalStudents} students in Sem VI-A.</span>
            <button
              onClick={handleExportCSV}
              className="btn-stealth px-3 py-1.5 text-xs font-mono flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendance Summary (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Attendance Standing */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Class Attendance Index Card */}
          {/* DEV NOTE: The aggregate class verification index (99.4%) and present ratio (38/46) below are sample placeholder metrics for development */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#64748B] uppercase">CLASS ATTENDANCE INDEX</span>
              <span className="text-[#10B981] font-mono text-xs font-bold tnum">HIGH 99.4% (Sample)</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Circular Gauge */}
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="#1E293B" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="26" stroke="#6BD8CB" strokeWidth="6" strokeDasharray={163} strokeDashoffset={163 * (1 - 0.994)} strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center font-mono">
                  <span className="text-xs font-bold text-white tnum">99.4%</span>
                  <span className="text-[7px] text-[#64748B]">RELIABILITY</span>
                </div>
              </div>

              <div>
                <h4 className="font-jakarta font-semibold text-white text-sm">Class Verification Rate</h4>
                <p className="text-xs text-[#94A3B8] leading-snug mt-1 font-sans">
                  Consistent attendance verification logged across all scheduled lectures.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#161F30] border border-[#233044] p-3 rounded text-center font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#64748B] block">Pending Reviews</span>
                <span className="text-white font-bold text-sm tnum">0</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">Present Ratio (Sample)</span>
                <span className="text-[#6BD8CB] font-bold text-sm tnum">38 / 46</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] font-mono text-[#94A3B8]">
              <span className="font-bold text-[#DFE2F1] uppercase block text-[10px]">VERIFICATION CRITERIA</span>
              <p className="text-[#64748B] leading-relaxed">
                Attendance records are confirmed when verified during class hours via location check-in or Class Coordinator submission.
              </p>
            </div>
          </div>

          {/* Student Account Standing */}
          <div className="stealth-card p-6 space-y-4">
            <div className="flex items-center space-x-2 text-[#6366F1]">
              <Key className="w-4 h-4" />
              <h3 className="font-jakarta font-bold text-white text-sm">Student Attendance Standing</h3>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">
              Your profile <span className="text-white font-mono font-bold">(Roll No: {studentProfile?.rollNumber || '21CS045'})</span> has maintained consistent attendance over 64 consecutive days, maintaining Gold tier standing.
            </p>

            <div className="w-full h-1.5 bg-[#0F131D] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full" style={{ width: '92%' }} />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] pt-1">
              <span className="bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                GOLD TIER VERIFIED
              </span>
              <span className="tnum">EVALUATED WEEKLY</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

