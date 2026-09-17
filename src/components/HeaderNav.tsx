import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, User, LogOut } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useApp } from '../context/AppContext';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export type ScreenTab = 'dashboard' | 'reconcile' | 'leaderboard' | 'welfare' | 'manage';

const TAB_TO_PATH: Record<ScreenTab, string> = {
  dashboard:   '/dashboard',
  reconcile:   '/reconcile',
  leaderboard: '/leaderboard',
  welfare:     '/welfare',
  manage:      '/manage',
};

const PATH_TO_TAB: Record<string, ScreenTab> = {
  '/dashboard':  'dashboard',
  '/reconcile':  'reconcile',
  '/leaderboard':'leaderboard',
  '/welfare':    'welfare',
  '/manage':     'manage',
};

interface HeaderNavProps {
  onOpenVotingModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onOpenVotingModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole, setUserRole, userProfile, resetOnboarding } = useApp();
  const { resetOnboarding: resetOnboardingContext } = useOnboarding();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeTab: ScreenTab = PATH_TO_TAB[location.pathname] ?? 'dashboard';
  const isCoordinator = userRole === 'coordinator';

  const navItems: { id: ScreenTab; label: string }[] = [
    { id: 'dashboard',   label: 'Dashboard' },
    { id: 'reconcile',   label: 'Reconcile' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'welfare',     label: 'AI Tools' },
    ...(isCoordinator ? [{ id: 'manage' as ScreenTab, label: 'Manage Students' }] : []),
  ];

  const toggleRole = () => {
    const nextRole = isCoordinator ? 'student' : 'coordinator';
    setUserRole(nextRole);
    if (nextRole === 'student' && location.pathname === '/manage') {
      navigate('/dashboard');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("SignOut warning:", err);
    }
    resetOnboarding();
    resetOnboardingContext();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-[#161F30] border-b border-[#233044] sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left: Logo + App Name + Cohort */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-jakarta font-bold text-white text-base tracking-tight">Academic-Sync</span>
          <span className="hidden sm:inline text-[11px] font-mono text-[#64748B] border-l border-[#233044] pl-3 tnum">
            {userProfile.classCode || 'CS-2025-A'}
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-[#0F131D] p-1 rounded border border-[#233044] overflow-x-auto max-w-full">
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

        {/* Right: Role Switcher + GPS dot + Profile Dropdown */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Quick Role Switcher Toggle */}
          <button
            onClick={toggleRole}
            title="Click to toggle between Student and Class Coordinator views"
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors flex items-center space-x-1 border ${
              isCoordinator 
                ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/30' 
                : 'bg-[#6366F1]/20 text-[#6366F1] border-[#6366F1]/40 hover:bg-[#6366F1]/30'
            }`}
          >
            <span>Role: {isCoordinator ? 'Coordinator' : 'Student'}</span>
          </button>

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
            <span className="text-[11px] font-mono text-[#10B981] hidden sm:inline">GPS</span>
          </button>

          {/* Profile avatar with Interactive Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="relative group focus:outline-none"
              title={`${userProfile.fullName || 'Gaurav Bisht'} (${userProfile.rollNumber || '21CS045'})`}
            >
              <div className="w-8 h-8 rounded bg-[#1A2438] border border-[#233044] flex items-center justify-center hover:border-[#3E506B] transition-colors">
                <User className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#161F30]" />
            </button>

            {/* Dropdown Menu Overlay */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 stealth-card p-4 shadow-xl z-50 space-y-3 border border-[#233044] animate-fade-in">
                {/* Profile Header */}
                <div className="flex items-center space-x-3 pb-3 border-b border-[#233044]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold font-jakarta text-sm">
                    {(userProfile.fullName || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-jakarta font-bold text-white text-sm truncate">
                      {userProfile.fullName || 'Gaurav Bisht'}
                    </h4>
                    <p className="text-[11px] font-mono text-[#6BD8CB] truncate">
                      {isCoordinator ? 'Class Coordinator' : (userProfile.rollNumber || '21CS045')}
                    </p>
                    <span className="inline-block text-[9px] font-mono uppercase bg-[#6366F1]/20 text-[#6366F1] px-1.5 py-0.5 rounded mt-1 font-semibold">
                      {userRole === 'coordinator' ? 'Coordinator Badge' : 'Student Account'}
                    </span>
                  </div>
                </div>

                {/* Profile Metadata */}
                <div className="text-[11px] font-mono text-[#94A3B8] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Batch Code:</span>
                    <span className="text-white font-bold tnum">{userProfile.classCode || 'CS-8849'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Active Role:</span>
                    <span className="text-[#10B981] font-semibold uppercase">{userRole}</span>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] rounded text-xs font-mono uppercase font-bold flex items-center justify-center space-x-2 transition-colors mt-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};


