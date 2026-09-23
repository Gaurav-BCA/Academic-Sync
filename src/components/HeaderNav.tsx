import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, User, LogOut } from 'lucide-react';
import { useOnboarding } from '../context/OnboardingContext';
import { useApp } from '../context/AppContext';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

export type ScreenTab = 'dashboard' | 'reconcile' | 'leaderboard' | 'welfare' | 'manage' | 'approvals';

const TAB_TO_PATH: Record<ScreenTab, string> = {
  dashboard:   '/dashboard',
  reconcile:   '/reconcile',
  leaderboard: '/leaderboard',
  welfare:     '/welfare',
  manage:      '/manage',
  approvals:   '/approvals',
};

const PATH_TO_TAB: Record<string, ScreenTab> = {
  '/dashboard':  'dashboard',
  '/reconcile':  'reconcile',
  '/leaderboard':'leaderboard',
  '/welfare':    'welfare',
  '/manage':     'manage',
  '/approvals':  'approvals',
};

interface HeaderNavProps {}

export const HeaderNav: React.FC<HeaderNavProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedBatch, userRole, userProfile, resetOnboarding } = useApp();
  const { isOnboarded, studentProfile, coordinatorProfile, teacherProfile, resetOnboarding: resetOnboardingContext } = useOnboarding();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeTab: ScreenTab = PATH_TO_TAB[location.pathname] ?? 'dashboard';
  const isCoordinator = userRole === 'coordinator';
  const isTeacher = userRole === 'teacher';

  // Dynamic user profile name resolution
  const activeName = (isTeacher ? (teacherProfile?.fullName || userProfile.fullName) : isCoordinator ? coordinatorProfile?.fullName : studentProfile?.fullName) || userProfile.fullName || 'User';
  const activeClassCode = selectedBatch || userProfile.classCode || (isCoordinator ? coordinatorProfile?.classCode : studentProfile?.classCode) || 'CS-4051';

  // Strict Role-Based Navigation items
  const navItems: { id: ScreenTab; label: string }[] = isTeacher
    ? [
        { id: 'dashboard', label: 'Teacher Panel' },
        { id: 'manage',    label: 'Manage Students' },
      ]
    : isCoordinator
    ? [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'manage',    label: 'Manage Students' },
        { id: 'approvals', label: 'Faculty Approvals' },
      ]
    : [
        { id: 'dashboard',   label: 'Dashboard' },
        { id: 'reconcile',   label: 'Reconcile' },
        { id: 'leaderboard', label: 'Leaderboard' },
        { id: 'welfare',     label: 'AI Tools' },
      ];

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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-6xl backdrop-blur-md bg-[#FFF9F2]/90 border border-amber-200/80 shadow-lg rounded-full px-6 py-2.5 transition-all duration-200">
      <header className="max-w-[1240px] mx-auto bg-white/95 backdrop-blur-md border border-amber-200/60 rounded-full px-4 py-2.5 shadow-xl shadow-amber-900/5 transition-all">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">

          {/* Left: Logo + App Name + Cohort Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B4B] to-[#FF5533] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-jakarta font-bold text-neutral-900 text-base tracking-tight">Academic-Sync</span>
            <span className="hidden sm:inline text-[11px] font-mono font-semibold text-amber-900/70 bg-amber-100/60 border border-amber-200 px-2.5 py-0.5 rounded-full tnum uppercase">
              {activeClassCode}
            </span>
          </div>

          {/* Center: Floating Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-amber-50/60 p-1 rounded-full border border-amber-200/50 overflow-x-auto max-w-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(TAB_TO_PATH[item.id])}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-white text-[#FF6B4B] shadow-sm font-bold border border-orange-200/80'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Locked Role Badge + Profile Avatar Dropdown */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Session Locked Role Badge */}
            <div
              title={`Role locked to current session: ${isTeacher ? 'Faculty Member' : isCoordinator ? 'Class Coordinator' : 'Student'}`}
              className={`px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase transition-all flex items-center space-x-1 border shadow-xs ${
                isTeacher
                  ? 'bg-purple-100/80 text-purple-900 border-purple-300'
                  : isCoordinator 
                  ? 'bg-indigo-100/80 text-indigo-800 border-indigo-200' 
                  : 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>ROLE: {isTeacher ? 'TEACHER' : isCoordinator ? 'COORDINATOR' : 'STUDENT'}</span>
            </div>

            {/* Profile Avatar with Interactive Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="relative group focus:outline-none block"
                title={`${activeName} (${isCoordinator ? 'Class Coordinator' : (studentProfile?.rollNumber || userProfile.rollNumber || 'Student ID')})`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-orange-200 flex items-center justify-center text-[#FF6B4B] font-bold text-sm shadow-xs hover:border-[#FF6B4B] transition-colors">
                  {(activeName || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </button>

              {/* Dropdown Menu Overlay */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-amber-200/80 rounded-2xl p-4 shadow-xl shadow-amber-900/10 z-50 space-y-3 animate-fade-in">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-amber-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B4B] to-[#FF5533] flex items-center justify-center text-white font-bold font-jakarta text-base shadow-sm">
                      {(activeName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-jakarta font-bold text-neutral-900 text-sm truncate">
                        {activeName}
                      </h4>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">
                        {isCoordinator 
                          ? (coordinatorProfile?.email || userProfile.email || 'coordinator@inst.edu') 
                          : `Roll: ${studentProfile?.rollNumber || userProfile.rollNumber || '21CS045'}`}
                      </p>
                      <span className="inline-block text-[9px] font-mono uppercase bg-orange-100 text-[#FF6B4B] px-2 py-0.5 rounded-full mt-1 font-bold">
                        {isCoordinator ? 'Coordinator' : 'Student Account'}
                      </span>
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div className="text-[11px] font-mono text-neutral-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Batch Code:</span>
                      <span className="text-neutral-900 font-bold tnum">{activeClassCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Session Role:</span>
                      <span className="text-emerald-700 font-bold uppercase">{userRole}</span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full text-xs font-mono uppercase font-bold flex items-center justify-center space-x-2 transition-colors mt-2 shadow-xs"
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
    </div>
  );
};
