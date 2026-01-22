// src/components/staff/MyRequestedDaysOffList.jsx
import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Edit2, Trash2, X } from 'lucide-react';
import { Card, Button, cn } from '../ui/Layouts';

// Status badge component
function StatusBadge({ status }) {
  const config = {
    pending: {
      icon: Clock,
      label: '承認待ち',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    approved: {
      icon: CheckCircle,
      label: '承認済み',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      icon: XCircle,
      label: '却下',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const { icon: Icon, label, className } = config[status] || config.pending;

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// Format date for display
function formatDisplayDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}

// Edit Modal Component
function EditModal({ request, onClose, onSave, loading }) {
  const [newDate, setNewDate] = useState(request.request_date);
  const [newReason, setNewReason] = useState(request.reason || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(request.id, {
      request_date: newDate,
      reason: newReason.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">申請を編集</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">理由（任意）</label>
            <textarea
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="休暇の理由を入力してください"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 border border-gray-300"
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ request, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">申請を削除</h3>
        </div>

        <p className="text-gray-600 mb-6">
          {formatDisplayDate(request.request_date)}の休暇申請を削除しますか？<br />
          この操作は取り消せません。
        </p>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 border border-gray-300"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            className="flex-1 bg-red-500 hover:bg-red-600"
            onClick={() => onConfirm(request.id)}
            disabled={loading}
          >
            {loading ? '削除中...' : '削除する'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyRequestedDaysOffList({
  requests = [],
  onEdit,
  onDelete,
  loading = false,
}) {
  const [editingRequest, setEditingRequest] = useState(null);
  const [deletingRequest, setDeletingRequest] = useState(null);

  const handleSave = async (id, data) => {
    await onEdit(id, data);
    setEditingRequest(null);
  };

  const handleDelete = async (id) => {
    await onDelete(id);
    setDeletingRequest(null);
  };

  // Group requests by status
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  if (requests.length === 0) {
    return (
      <Card className="p-6 bg-white border-none shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-800">自分の休暇申請</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>申請がありません</p>
          <p className="text-sm text-gray-400 mt-1">上のカレンダーから日付を選択して申請してください</p>
        </div>
      </Card>
    );
  }

  const renderRequestList = (requestList, title) => {
    if (requestList.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
        <div className="space-y-2">
          {requestList.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-gray-800">
                    {formatDisplayDate(request.request_date)}
                  </p>
                  {request.reason && (
                    <p className="text-sm text-gray-500 mt-1 truncate max-w-[200px]">
                      {request.reason}
                    </p>
                  )}
                  {request.rejection_reason && (
                    <p className="text-sm text-red-500 mt-1">
                      却下理由: {request.rejection_reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={request.status} />

                {request.status === 'pending' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingRequest(request)}
                      className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-primary transition-colors"
                      title="編集"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingRequest(request)}
                      className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-white border-none shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-800">自分の休暇申請</h2>
        <span className="text-sm text-gray-500">({requests.length}件)</span>
      </div>

      {renderRequestList(pendingRequests, '承認待ち')}
      {renderRequestList(approvedRequests, '承認済み')}
      {renderRequestList(rejectedRequests, '却下')}

      {/* Modals */}
      {editingRequest && (
        <EditModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSave={handleSave}
          loading={loading}
        />
      )}

      {deletingRequest && (
        <DeleteConfirmModal
          request={deletingRequest}
          onClose={() => setDeletingRequest(null)}
          onConfirm={handleDelete}
          loading={loading}
        />
      )}
    </Card>
  );
}
