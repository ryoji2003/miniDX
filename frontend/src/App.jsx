// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StaffProtectedRoute, AdminProtectedRoute } from './components/ProtectedRoute';
import TopPage from './pages/TopPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffManagement from './pages/StaffManagement';
import RequirementsPage from './pages/RequirementsPage';
import ManageRequestDayOffPage from './pages/admin/ManageRequestDayOffPage';
import RequestDayOffPage from './pages/staff/RequestDayOffPage';
import StaffLogin from './pages/StaffLogin';
import StaffPasswordSetup from './pages/StaffPasswordSetup';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* トップページ - モード選択 */}
          <Route path="/" element={<TopPage />} />

          {/* スタッフ認証 */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/setup-password" element={<StaffPasswordSetup />} />

          {/* スタッフ保護ルート */}
          <Route
            path="/staff/request-day-off"
            element={
              <StaffProtectedRoute>
                <RequestDayOffPage />
              </StaffProtectedRoute>
            }
          />

          {/* 管理者ログイン */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* 管理者保護ルート */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <AdminProtectedRoute>
                <StaffManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/requirements"
            element={
              <AdminProtectedRoute>
                <RequirementsPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/day-off-requests"
            element={
              <AdminProtectedRoute>
                <ManageRequestDayOffPage />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
