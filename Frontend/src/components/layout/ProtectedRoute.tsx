import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => !!state.token);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
