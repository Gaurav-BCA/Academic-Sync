import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';

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
