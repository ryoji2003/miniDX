// src/pages/ConstraintPage.jsx
import React from 'react';
import AdminLayout from '../components/AdminLayout';
import ConstraintInput from '../components/ConstraintInput';
import { Card } from '../components/ui/Layouts';

export default function ConstraintPage() {
  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">希望休・制約条件</h1>
        <p className="text-gray-600 mt-1">スタッフの希望休や固定シフトなどの制約条件を設定します</p>
      </header>

      <Card className="p-6 bg-white border-none shadow-sm">
        <ConstraintInput />
      </Card>
    </AdminLayout>
  );
}
