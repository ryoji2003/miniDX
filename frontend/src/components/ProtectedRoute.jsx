// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function StaffProtectedRoute({ children }) {
  const { isStaffLoggedIn } = useAuth();
  if (!isStaffLoggedIn) {
    return <Navigate to="/staff/login" replace />;
  }
  return children;
}

export function AdminProtectedRoute({ children }) {
  const { isAdminLoggedIn } = useAuth();
  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
