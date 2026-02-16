// src/components/admin/RequestDayOffApprovalList.jsx
import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
} from 'lucide-react';
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
  return `${month}/${day}（${weekday}）`;
}

// Format datetime
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-';
  const date = new Date(dateTimeStr);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Reject Modal Component
function RejectModal({ request, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(request.id, reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">申請を却下</h3>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{request.staff_name}</span> さんの
            <span className="font-medium"> {formatDisplayDate(request.request_date)}</span> の休暇申請
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              却下理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="却下理由を入力してください"
              maxLength={500}
              rows={3}
              required
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
            <Button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600"
              disabled={loading || !reason.trim()}
            >
              {loading ? '処理中...' : '却下する'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RequestDayOffApprovalList({
  requests = [],
  staffList = [],
  onApprove,
  onReject,
  onBulkApprove,
  loading = false,
}) {
  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [staffFilter, setStaffFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal
  const [rejectingRequest, setRejectingRequest] = useState(null);

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (statusFilter && req.status !== statusFilter) return false;
    if (staffFilter && req.staff_id !== Number(staffFilter)) return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      const staffName = (req.staff_name || '').toLowerCase();
      const reason = (req.reason || '').toLowerCase();
      if (!staffName.includes(search) && !reason.includes(search)) return false;
    }
    return true;
  });

  // Sort by request date
  const sortedRequests = [...filteredRequests].sort(
    (a, b) => new Date(a.request_date) - new Date(b.request_date)
  );

  // Pending requests for bulk selection
  const pendingRequests = sortedRequests.filter(r => r.status === 'pending');

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === pendingRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRequests.map(r => r.id));
    }
  };

  // Handle individual selection
  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Handle approve
  const handleApprove = async (requestId) => {
    try {
      await onApprove(requestId);
      setSelectedIds(prev => prev.filter(id => id !== requestId));
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  // Handle reject
  const handleReject = async (requestId, reason) => {
    try {
      await onReject(requestId, reason);
      setRejectingRequest(null);
      setSelectedIds(prev => prev.filter(id => id !== requestId));
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      await onBulkApprove(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk approve failed:', err);
    }
  };

  return (
    <Card className="p-6 bg-white border-none shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">休暇申請一覧</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="検索..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none w-40"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          >
            <option value="">全てのステータス</option>
            <option value="pending">承認待ち</option>
            <option value="approved">承認済み</option>
            <option value="rejected">却下</option>
          </select>

          {/* Staff filter */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          >
            <option value="">全てのスタッフ</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-4">
          <span className="text-sm font-medium text-primary">
            {selectedIds.length}件選択中
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBulkApprove}
              disabled={loading}
              className="text-sm h-8 px-3"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              一括承認
            </Button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 hover:bg-primary/10 rounded"
            >
              <X className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {sortedRequests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Filter className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>該当する申請がありません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {statusFilter === 'pending' && (
                  <th className="text-left py-3 px-2 w-10">
                    <button onClick={handleSelectAll} className="p-1">
                      {selectedIds.length === pendingRequests.length && pendingRequests.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">スタッフ</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">申請日</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">理由</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">ステータス</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">申請日時</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map((request) => (
                <tr
                  key={request.id}
                  className={cn(
                    "border-b border-gray-100 hover:bg-gray-50 transition-colors",
                    selectedIds.includes(request.id) && "bg-primary/5"
                  )}
                >
                  {statusFilter === 'pending' && (
                    <td className="py-3 px-2">
                      {request.status === 'pending' && (
                        <button onClick={() => handleSelect(request.id)} className="p-1">
                          {selectedIds.includes(request.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-2">
                    <span className="font-medium text-gray-800">{request.staff_name}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-gray-700">{formatDisplayDate(request.request_date)}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-gray-500 truncate max-w-[200px] inline-block">
                      {request.reason || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-gray-500">{formatDateTime(request.created_at)}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {request.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={loading}
                          className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                          title="承認"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRejectingRequest(request)}
                          disabled={loading}
                          className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                          title="却下"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {request.status === 'approved' && (
                      <span className="text-xs text-gray-400">
                        {request.approved_by && `承認: ${request.approved_by}`}
                      </span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="text-xs text-red-500" title={request.rejection_reason}>
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        却下済み
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-gray-500">
        <span>
          全 {filteredRequests.length} 件
        </span>
        <span className="text-yellow-600">
          承認待ち: {filteredRequests.filter(r => r.status === 'pending').length} 件
        </span>
        <span className="text-green-600">
          承認済み: {filteredRequests.filter(r => r.status === 'approved').length} 件
        </span>
        <span className="text-red-600">
          却下: {filteredRequests.filter(r => r.status === 'rejected').length} 件
        </span>
      </div>

      {/* Reject Modal */}
      {rejectingRequest && (
        <RejectModal
          request={rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          onConfirm={handleReject}
          loading={loading}
        />
      )}
    </Card>
  );
}
