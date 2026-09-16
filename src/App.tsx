import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HeaderNav } from './components/HeaderNav';
import { Footer } from './components/Footer';
import { OverviewGateScreen } from './screens/OverviewGateScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ReconcileScreen } from './screens/ReconcileScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AIWelfareScreen } from './screens/AIWelfareScreen';
import { SmartCheckModal } from './components/modals/SmartCheckModal';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { ProtectedRoute, OnboardingRoute } from './components/ProtectedRoute';

function AppShell() {
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { isOnboarded } = useOnboarding();

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">

      {/* Top sticky navigation — only visible after onboarding is complete */}
      {isOnboarded && (
        <HeaderNav onOpenVotingModal={() => setIsVotingModalOpen(true)} />
      )}

      {/* Main container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 w-full flex-grow py-4">
        <Routes>
          {/* ── Onboarding routes: redirect to /dashboard if already onboarded ── */}
          <Route
            path="/"
            element={
              <OnboardingRoute>
                <OverviewGateScreen />
              </OnboardingRoute>
            }
          />
          {/* /timetable is no longer a standalone page — redirect to /dashboard */}
          <Route path="/timetable" element={<Navigate to="/dashboard" replace />} />

          {/* ── Protected routes: redirect to "/" if not yet onboarded ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardScreen onOpenVotingModal={() => setIsVotingModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reconcile"
            element={
              <ProtectedRoute>
                <ReconcileScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/welfare"
            element={
              <ProtectedRoute>
                <AIWelfareScreen />
              </ProtectedRoute>
            }
          />

          {/* Fallback: redirect unknown routes to overview */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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

export function App() {
  return (
    <OnboardingProvider>
      <AppShell />
    </OnboardingProvider>
  );
}

export default App;
