import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HeaderNav } from './components/HeaderNav';
import { Footer } from './components/Footer';
import { OverviewGateScreen } from './screens/OverviewGateScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ReconcileScreen } from './screens/ReconcileScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AIWelfareScreen } from './screens/AIWelfareScreen';
import { ManageStudentsScreen } from './screens/ManageStudentsScreen';
import { SmartCheckModal } from './components/modals/SmartCheckModal';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { AppProvider, useApp } from './context/AppContext';
import { ProtectedRoute, OnboardingRoute } from './components/ProtectedRoute';

function AppShell() {
  const { isOnboarded } = useOnboarding();
  const { isCheckInModalOpen, openCheckInModal, closeCheckInModal } = useApp();

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-neutral-900 flex flex-col justify-between selection:bg-[#FF6B4B] selection:text-white relative overflow-hidden">
      {/* Ambient Pastel Background Blur Blobs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-orange-200/40 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-32 left-1/3 w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none -z-10" />

      {/* Top sticky navigation — only visible after onboarding is complete */}
      {isOnboarded && (
        <HeaderNav onOpenVotingModal={openCheckInModal} />
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
                <DashboardScreen onOpenVotingModal={openCheckInModal} />
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
          <Route
            path="/manage"
            element={
              <ProtectedRoute>
                <ManageStudentsScreen />
              </ProtectedRoute>
            }
          />

          {/* Fallback: redirect unknown routes to overview */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Geofenced Smart Check Modal Overlay */}
      <SmartCheckModal
        isOpen={isCheckInModalOpen}
        onClose={closeCheckInModal}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <OnboardingProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </OnboardingProvider>
  );
}

export default App;

