// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import StaffManagement from './pages/StaffManagement';
import ConstraintPage from './pages/ConstraintPage';
import RequirementsPage from './pages/RequirementsPage';

const UserApp = () => <div className="p-4">ユーザー画面（モバイル）は作成中です</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<StaffManagement />} />
        <Route path="/admin/constraints" element={<ConstraintPage />} />
        <Route path="/admin/requirements" element={<RequirementsPage />} />
        
        <Route path="/user" element={<UserApp />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;