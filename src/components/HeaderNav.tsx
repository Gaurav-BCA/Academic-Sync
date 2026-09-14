import React from 'react';
import { Radio, User, ShieldCheck } from 'lucide-react';

export type ScreenTab = 
  | 'overview' 
  | 'timetable' 
  | 'dashboard' 
  | 'reconcile' 
  | 'leaderboard' 
  | 'welfare';

interface HeaderNavProps {
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  onOpenVotingModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenVotingModal,
}) => {
  const navItems: { id: ScreenTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timetable', label: 'Timetable Setup' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reconcile', label: 'Reconcile' },
    { id: 'leaderboard', label: 'Consensus Leaderboard' },
    { id: 'welfare', label: 'AI Student Welfare' },
  ];

  return (
    <header className="bg-[#0D111A] border-b border-gray-800/80 sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Branding & Cohort Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-4 h-4 text-black font-bold animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white text-base">Academia-Sync</span>
            </div>
            <p className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">
              Telemetry & Attendance Consensus Engine
            </p>
          </div>

          <div className="hidden xl:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-full px-3 py-1 ml-4 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Apex Institute of Tech • CS-2025-A</span>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="flex items-center space-x-1 bg-[#121722] p-1 rounded-xl border border-gray-800/60 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Status & Trigger Voting Modal */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenVotingModal}
            className="flex items-center space-x-2 bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 rounded-lg text-xs text-cyan-300 font-mono transition-all hover:bg-cyan-900/40"
            title="Click to trigger Geofenced Quorum Poll Modal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">System Live • GPS Sync 99.4%</span>
            <span className="sm:hidden">Poll Modal</span>
          </button>

          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 text-xs font-bold cursor-pointer">
              <User className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0D111A]"></span>
          </div>
        </div>

      </div>
    </header>
  );
};
