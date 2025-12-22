// src/pages/StaffManagement.jsx
import React from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card, Button } from '../components/ui/Layouts';
import { MOCK_STAFFS } from '../mocks/data';
import { Plus, Clock, BadgeCheck, Pencil, Trash2 } from 'lucide-react';

export default function StaffManagement() {
  return (
    <AdminLayout>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">スタッフ管理</h1>
          <p className="text-gray-500 text-sm">現在 {MOCK_STAFFS.length} 名のスタッフが登録されています</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          スタッフを追加
        </Button>
      </header>

      <Card className="bg-white overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 text-sm font-semibold text-gray-600">名前 / 役割</th>
                <th className="p-4 text-sm font-semibold text-gray-600">勤務形態</th>
                <th className="p-4 text-sm font-semibold text-gray-600">月間上限 (時間)</th>
                <th className="p-4 text-sm font-semibold text-gray-600">保有資格</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_STAFFS.map((staff) => (
                <tr key={staff.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                  {/* 名前と役割 */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                        {staff.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.role}</div>
                      </div>
                    </div>
                  </td>

                  {/* 勤務形態 */}
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staff.type === 'FullTime' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {staff.type === 'FullTime' ? '常勤' : 'パート'}
                    </span>
                  </td>

                  {/* 月間上限時間 */}
                  <td className="p-4">
                    <div className="flex items-center text-gray-700 font-medium">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                      {staff.maxHours}時間
                    </div>
                  </td>

                  {/* 免許・資格 */}
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {staff.licenses && staff.licenses.map((license, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/5 text-primary border border-primary/10">
                          <BadgeCheck className="w-3 h-3 mr-1" />
                          {license}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* 操作ボタン */}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}