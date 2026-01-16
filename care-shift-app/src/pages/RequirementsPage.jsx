// src/pages/RequirementsPage.jsx
import React from 'react';
import AdminLayout from '../components/AdminLayout';
import DailyRequirements from '../components/DailyRequirements';
import { Card } from '../components/ui/Layouts';

export default function RequirementsPage() {
  // Generate current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">日次要件設定</h1>
        <p className="text-gray-600 mt-1">各日に必要なタスクごとの人数を設定します</p>
      </header>

      <Card className="p-6 bg-white border-none shadow-sm">
        <DailyRequirements selectedMonth={currentMonth} />
      </Card>
    </AdminLayout>
  );
}
