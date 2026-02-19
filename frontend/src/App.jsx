// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/TopPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffManagement from './pages/StaffManagement';
import RequirementsPage from './pages/RequirementsPage';
import ManageRequestDayOffPage from './pages/admin/ManageRequestDayOffPage';
import RequestDayOffPage from './pages/staff/RequestDayOffPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Top page - role selection */}
        <Route path="/" element={<TopPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<StaffManagement />} />
        <Route path="/admin/requirements" element={<RequirementsPage />} />
        <Route path="/admin/day-off-requests" element={<ManageRequestDayOffPage />} />

        {/* Staff routes */}
        <Route path="/staff/request-day-off" element={<RequestDayOffPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;