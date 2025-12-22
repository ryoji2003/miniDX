// src/pages/AdminDashboard.jsx
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import AdminLayout from '../components/AdminLayout'; // レイアウトをインポート
import { Card, Button } from '../components/ui/Layouts';
import { MOCK_SHIFTS, MOCK_STAFFS } from '../mocks/data';
import { Wand2 } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">12月のシフト管理</h1>
        <Button className="bg-gradient-to-r from-primary to-teal-500 shadow-lg hover:shadow-xl transition-all">
          <Wand2 className="mr-2 h-4 w-4" />
          AIでシフトを自動生成
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側：スタッフリスト（簡易表示） */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-700">スタッフ一覧</h2>
          {MOCK_STAFFS.map((staff) => (
            <Card key={staff.id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer bg-white border-none shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                {staff.avatar}
              </div>
              <div>
                <div className="font-bold text-sm text-gray-800">{staff.name}</div>
                <div className="text-xs text-gray-500">{staff.role} • {staff.type}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* 右側：カレンダー */}
        <Card className="lg:col-span-3 p-6 bg-white border-none shadow-sm">
          <FullCalendar
            plugins={[ dayGridPlugin ]}
            initialView="dayGridMonth"
            events={MOCK_SHIFTS}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            height="auto"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}