import React, { useState } from 'react';
import { HeaderNav, ScreenTab } from './components/HeaderNav';
import { Footer } from './components/Footer';
import { OverviewGateScreen } from './screens/OverviewGateScreen';
import { TimetableSetupScreen } from './screens/TimetableSetupScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ReconcileScreen } from './screens/ReconcileScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AIWelfareScreen } from './screens/AIWelfareScreen';
import { SmartCheckModal } from './components/modals/SmartCheckModal';

export function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('overview');
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* Top sticky navigation */}
      <HeaderNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenVotingModal={() => setIsVotingModalOpen(true)}
      />

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 w-full flex-grow py-4">
        {activeTab === 'overview' && (
          <OverviewGateScreen 
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToTimetable={() => setActiveTab('timetable')}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableSetupScreen 
            onConfirm={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardScreen 
            onOpenVotingModal={() => setIsVotingModalOpen(true)}
          />
        )}

        {activeTab === 'reconcile' && (
          <ReconcileScreen />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardScreen />
        )}

        {activeTab === 'welfare' && (
          <AIWelfareScreen />
        )}
      </main>

      {/* Geofenced Smart Check Modal Overlay */}
      <SmartCheckModal 
        isOpen={isVotingModalOpen}
        onClose={() => setIsVotingModalOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
