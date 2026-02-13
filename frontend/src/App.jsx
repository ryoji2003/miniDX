// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import StaffManagement from './pages/StaffManagement';
import ConstraintPage from './pages/ConstraintPage';
import RequirementsPage from './pages/RequirementsPage';
import ManageRequestDayOffPage from './pages/admin/ManageRequestDayOffPage';
import RequestDayOffPage from './pages/staff/RequestDayOffPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<StaffManagement />} />
        <Route path="/admin/constraints" element={<ConstraintPage />} />
        <Route path="/admin/requirements" element={<RequirementsPage />} />
        <Route path="/admin/day-off-requests" element={<ManageRequestDayOffPage />} />

        {/* Staff routes */}
        <Route path="/staff/request-day-off" element={<RequestDayOffPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;