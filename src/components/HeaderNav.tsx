import React from 'react';
import { Activity, User, ShieldCheck } from 'lucide-react';

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
    { id: 'timetable', label: 'Timetable' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reconcile', label: 'Reconcile' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'welfare', label: 'AI Tools' },
  ];

  return (
    <header className="bg-[#161F30] border-b border-[#233044] sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Branding & Cohort Indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-jakarta font-bold text-white text-base tracking-tight">Academic-Sync</span>
              <span className="text-[10px] font-mono bg-[#1E293B] border border-[#233044] text-[#6BD8CB] px-1.5 py-0.5 rounded uppercase">
                Student Portal
              </span>
            </div>
            <p className="text-[11px] tracking-wide text-[#94A3B8] font-mono">
              Attendance Tracking & Predictive Analytics
            </p>
          </div>

          <div className="hidden xl:flex items-center space-x-2 bg-[#0F131D] border border-[#233044] rounded px-3 py-1 ml-4 text-xs font-mono text-[#DFE2F1]">
            <span className="radar-dot" />
            <span className="tnum">CS-2025-A • Apex Tech</span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-[#0F131D] p-1 rounded border border-[#233044] overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-[#1E293B] text-white border border-[#233044] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#DFE2F1] hover:bg-[#161F30]/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Status Indicator & Poll Trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenVotingModal}
            className="flex items-center space-x-2 bg-[#161F30] border border-[#233044] hover:border-[#6366F1] px-3 py-1.5 rounded text-xs text-[#6BD8CB] font-mono transition-colors"
            title="Click to trigger Geofenced Check Modal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="hidden sm:inline tnum">System Online • GPS Active</span>
            <span className="sm:hidden">Check In</span>
          </button>

          <div className="relative">
            <div className="w-8 h-8 rounded bg-[#1A2438] border border-[#233044] flex items-center justify-center text-[#DFE2F1] text-xs font-semibold cursor-pointer hover:border-[#3E506B]">
              <User className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#161F30]" />
          </div>
        </div>

      </div>
    </header>
  );
};
