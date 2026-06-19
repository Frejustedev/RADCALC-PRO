import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { Permission } from '../lib/roles';
import { LoadingScreen, PendingScreen, ForbiddenScreen, FirebaseNotice } from './AuthScreens';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission }) => {
  const { user, profile, loading, logout, hasPermission } = useAuth();
  const location = useLocation();

  if (!isFirebaseConfigured) return <FirebaseNotice />;
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  if (!profile || !profile.active) return <PendingScreen onLogout={logout} />;
  if (permission && !hasPermission(permission)) return <ForbiddenScreen />;

  return <>{children}</>;
};
