// src/pages/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card, Button } from '../components/ui/Layouts';
import StaffForm from '../components/StaffForm';
import { getStaffs, createStaff, updateStaff, deleteStaff, mapStaffToFrontend } from '../api/staff';
import { Plus, Clock, BadgeCheck, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function StaffManagement() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch staff list on mount
  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStaffs();
      setStaffs(data.map(mapStaffToFrontend));
    } catch (err) {
      setError('スタッフ一覧の取得に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingStaff(null);
    setShowForm(true);
  };

  const handleEditClick = (staff) => {
    setEditingStaff(staff);
    setShowForm(true);
  };

  const handleDeleteClick = (staff) => {
    setDeleteConfirm(staff);
  };

  const handleSave = async (formData) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, formData);
      } else {
        await createStaff(formData);
      }
      setShowForm(false);
      setEditingStaff(null);
      fetchStaffs();
    } catch (err) {
      alert('保存に失敗しました: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStaff(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchStaffs();
    } catch (err) {
      alert('削除に失敗しました: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 text-red-600">
          <AlertCircle className="w-12 h-12 mb-2" />
          <p>{error}</p>
          <Button onClick={fetchStaffs} className="mt-4">
            再試行
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">スタッフ管理</h1>
          <p className="text-gray-500 text-sm">現在 {staffs.length} 名のスタッフが登録されています</p>
        </div>
        <Button onClick={handleAddClick}>
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
              {staffs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    スタッフが登録されていません。「スタッフを追加」ボタンから登録してください。
                  </td>
                </tr>
              ) : (
                staffs.map((staff) => (
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
                        {(!staff.licenses || staff.licenses.length === 0) && (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>

                    {/* 操作ボタン */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEditClick(staff)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(staff)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Staff Form Modal */}
      {showForm && (
        <StaffForm
          staff={editingStaff}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingStaff(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm p-6 bg-white">
            <h3 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h3>
            <p className="text-gray-600 mb-4">
              「{deleteConfirm.name}」を削除してもよろしいですか？
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                削除
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
