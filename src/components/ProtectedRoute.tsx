import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function AuthLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-sans text-neutral-600 animate-fade-in py-20">
      <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-[#FF6B4B] animate-spin" />
      <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF6B4B]">Validating Portal Role & Credentials...</span>
    </div>
  );
}

/**
 * Wraps any route that requires onboarding to be complete.
 * - If not onboarded: redirect to "/" (Overview/Gate screen).
 * - If onboarded: render children normally.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded, authLoading } = useOnboarding();

  if (authLoading) {
    return <AuthLoadingFallback />;
  }

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Wraps onboarding routes ("/", "/student", "/faculty-login").
 * - If already onboarded: redirect to "/dashboard" to skip re-onboarding.
 * - If not onboarded: render children normally.
 */
export const OnboardingRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded, authLoading } = useOnboarding();

  if (authLoading) {
    return <AuthLoadingFallback />;
  }

  if (isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Wraps routes intended exclusively for students (Reconcile, Leaderboard, AI Tools).
 * Redirects coordinators and teachers to /dashboard.
 */
export const StudentRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded, authLoading } = useOnboarding();
  const { userRole } = useApp();

  if (authLoading) {
    return <AuthLoadingFallback />;
  }

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (userRole === 'coordinator' || userRole === 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Wraps routes intended exclusively for coordinators (Manage Students, Approvals).
 * Redirects students to /dashboard.
 */
export const CoordinatorRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded, authLoading } = useOnboarding();
  const { userRole } = useApp();

  if (authLoading) {
    return <AuthLoadingFallback />;
  }

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (userRole === 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
