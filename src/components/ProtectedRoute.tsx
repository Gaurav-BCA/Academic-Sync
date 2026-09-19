import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires onboarding to be complete.
 * - If not onboarded: redirect to "/" (Overview/Gate screen).
 * - If onboarded: render children normally.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded } = useOnboarding();

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/**
 * Wraps onboarding routes ("/", "/join", "/setup", "/timetable").
 * - If already onboarded: redirect to "/dashboard" to skip re-onboarding.
 * - If not onboarded: render children normally.
 */
export const OnboardingRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded } = useOnboarding();

  if (isOnboarded) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Wraps routes intended exclusively for students (Reconcile, Leaderboard, AI Tools).
 * Redirects coordinators to /dashboard.
 */
export const StudentRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded } = useOnboarding();
  const { userRole } = useApp();

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (userRole === 'coordinator') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Wraps routes intended exclusively for coordinators (Manage Students).
 * Redirects students to /dashboard.
 */
export const CoordinatorRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isOnboarded } = useOnboarding();
  const { userRole } = useApp();

  if (!isOnboarded) {
    return <Navigate to="/" replace />;
  }

  if (userRole === 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
