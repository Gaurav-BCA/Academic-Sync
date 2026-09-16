import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, User } from 'lucide-react';

export type ScreenTab = 'dashboard' | 'reconcile' | 'leaderboard' | 'welfare';

const TAB_TO_PATH: Record<ScreenTab, string> = {
  dashboard:   '/dashboard',
  reconcile:   '/reconcile',
  leaderboard: '/leaderboard',
  welfare:     '/welfare',
};

const PATH_TO_TAB: Record<string, ScreenTab> = {
  '/dashboard':  'dashboard',
  '/reconcile':  'reconcile',
  '/leaderboard':'leaderboard',
  '/welfare':    'welfare',
};

interface HeaderNavProps {
  onOpenVotingModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onOpenVotingModal }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab: ScreenTab = PATH_TO_TAB[location.pathname] ?? 'dashboard';

  const navItems: { id: ScreenTab; label: string }[] = [
    { id: 'dashboard',   label: 'Dashboard' },
    { id: 'reconcile',   label: 'Reconcile' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'welfare',     label: 'AI Tools' },
  ];

  return (
    <header className="bg-[#161F30] border-b border-[#233044] sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">

        {/* Left: Logo + App Name + Cohort */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-jakarta font-bold text-white text-base tracking-tight">Academic-Sync</span>
          <span className="hidden sm:inline text-[11px] font-mono text-[#64748B] border-l border-[#233044] pl-3 tnum">
            CS-2025-A
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-[#0F131D] p-1 rounded border border-[#233044]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(TAB_TO_PATH[item.id])}
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

        {/* Right: GPS dot (opens modal) + Profile */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Minimal GPS / check-in trigger — green pulse dot */}
          <button
            onClick={onOpenVotingModal}
            title="Open Live Check-In"
            className="flex items-center space-x-1.5 text-[#94A3B8] hover:text-white transition-colors"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
            </span>
            <span className="text-[11px] font-mono text-[#10B981] hidden md:inline">GPS</span>
          </button>

          {/* Profile avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded bg-[#1A2438] border border-[#233044] flex items-center justify-center cursor-pointer hover:border-[#3E506B] transition-colors">
              <User className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#161F30]" />
          </div>
        </div>

      </div>
    </header>
  );
};
