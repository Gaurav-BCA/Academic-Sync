import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HeaderNav } from './components/HeaderNav';
import { Footer } from './components/Footer';
import { OverviewGateScreen } from './screens/OverviewGateScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute, OnboardingRoute, StudentRoute, CoordinatorRoute } from './components/ProtectedRoute';

// Lazy loaded secondary route components for bundle optimization
const ReconcileScreen = lazy(() => import('./screens/ReconcileScreen').then(m => ({ default: m.ReconcileScreen })));
const LeaderboardScreen = lazy(() => import('./screens/LeaderboardScreen').then(m => ({ default: m.LeaderboardScreen })));
const AIWelfareScreen = lazy(() => import('./screens/AIWelfareScreen').then(m => ({ default: m.AIWelfareScreen })));
const ManageStudentsScreen = lazy(() => import('./screens/ManageStudentsScreen').then(m => ({ default: m.ManageStudentsScreen })));

// Route Loading Fallback Skeleton Component
function RouteLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-sans text-neutral-600 animate-fade-in">
      <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-[#FF6B4B] animate-spin" />
      <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF6B4B]">Loading Workspace...</span>
    </div>
  );
}

function AppShell() {
  const { isOnboarded } = useOnboarding();

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-neutral-900 flex flex-col justify-between selection:bg-[#FF6B4B] selection:text-white relative overflow-hidden">
      {/* Ambient Pastel Background Blur Blobs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-orange-200/40 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-32 left-1/3 w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none -z-10" />

      {/* Top sticky navigation — only visible after onboarding is complete */}
      {isOnboarded && (
        <HeaderNav />
      )}

      {/* Main container */}
      <main className={`max-w-7xl mx-auto px-4 lg:px-8 w-full flex-grow py-4 ${isOnboarded ? 'pt-24 sm:pt-28' : 'pt-4'}`}>
        <Suspense fallback={<RouteLoadingFallback />}>
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
                  <DashboardScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reconcile"
              element={
                <StudentRoute>
                  <ReconcileScreen />
                </StudentRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <StudentRoute>
                  <LeaderboardScreen />
                </StudentRoute>
              }
            />
            <Route
              path="/welfare"
              element={
                <StudentRoute>
                  <AIWelfareScreen />
                </StudentRoute>
              }
            />
            <Route
              path="/manage"
              element={
                <CoordinatorRoute>
                  <ManageStudentsScreen />
                </CoordinatorRoute>
              }
            />
            <Route
              path="/manage-students"
              element={
                <CoordinatorRoute>
                  <ManageStudentsScreen />
                </CoordinatorRoute>
              }
            />

            {/* Fallback: redirect unknown routes to overview */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

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

