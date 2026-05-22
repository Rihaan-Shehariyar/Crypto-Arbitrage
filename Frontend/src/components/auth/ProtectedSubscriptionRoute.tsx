import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedSubscriptionRouteProps {
  children: React.ReactNode;
}

export function ProtectedSubscriptionRoute({ children }: ProtectedSubscriptionRouteProps) {
  const token = useAuthStore((state) => state.token);
  const subscriptionActive = useAuthStore((state) => state.subscriptionActive);
  const location = useLocation();

  if (!token) {
    // Save the page they were trying to access so we can redirect them back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!subscriptionActive) {
    // Redirect authenticated but unsubscribed users to pricing
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
