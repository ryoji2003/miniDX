// src/pages/TopPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, UserCircle } from 'lucide-react';

export default function TopPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* App title */}
      <div className="flex items-center gap-3 mb-10">
        <Calendar className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">CareShift AI</h1>
      </div>

      <p className="text-gray-600 mb-8 text-lg">利用するモードを選択してください</p>

      {/* Role selection cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        {/* Admin card */}
        <Link
          to="/admin"
          className="flex-1 bg-white rounded-xl border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md transition-all p-8 flex flex-col items-center text-center group"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">管理者として利用</h2>
          <p className="text-gray-500">
            シフト管理、スタッフ管理、休暇申請の承認など全ての機能を利用できます
          </p>
        </Link>

        {/* Staff card */}
        <Link
          to="/staff/request-day-off"
          className="flex-1 bg-white rounded-xl border-2 border-gray-200 hover:border-primary shadow-sm hover:shadow-md transition-all p-8 flex flex-col items-center text-center group"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">スタッフとして利用</h2>
          <p className="text-gray-500">
            休暇申請（希望休の提出）を行うことができます
          </p>
        </Link>
      </div>
    </div>
  );
}
