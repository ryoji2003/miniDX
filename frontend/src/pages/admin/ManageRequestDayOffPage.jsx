// src/pages/admin/ManageRequestDayOffPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw, List, BarChart } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import RequestDayOffApprovalList from '../../components/admin/RequestDayOffApprovalList';
import AdminDayOffCalendar from '../../components/admin/AdminDayOffCalendar';
import { Card, Button, cn } from '../../components/ui/Layouts';
import { getStaffs } from '../../api/staff';
import {
  getAllDayOffRequests,
  approveDayOffRequest,
  rejectDayOffRequest,
  bulkApproveDayOffRequests,
  getAdminDayOffCalendar,
  getDayOffStatistics,
} from '../../api/request';

// Admin name (in production, this would come from auth)
const ADMIN_NAME = '管理者';

export default function ManageRequestDayOffPage() {
  // View mode
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Data states
  const [staffList, setStaffList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [statistics, setStatistics] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Calendar month
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);

  // Fetch staff list
  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const staffs = await getStaffs();
        setStaffList(staffs);
      } catch (err) {
        console.error('Failed to fetch staffs:', err);
      }
    };
    fetchStaffs();
  }, []);

  // Fetch all requests
  const fetchRequests = useCallback(async () => {
    try {
      const data = await getAllDayOffRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('申請データの取得に失敗しました');
    }
  }, []);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      const [calendar, stats] = await Promise.all([
        getAdminDayOffCalendar(calendarYear, calendarMonth),
        getDayOffStatistics(calendarYear, calendarMonth),
      ]);
      setCalendarData(calendar);
      setStatistics(stats);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    }
  }, [calendarYear, calendarMonth]);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchCalendarData()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchRequests, fetchCalendarData]);

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle approve
  const handleApprove = async (requestId) => {
    setActionLoading(true);
    setError(null);

    try {
      await approveDayOffRequest(requestId, ADMIN_NAME);
      showSuccess('申請を承認しました');
      await Promise.all([fetchRequests(), fetchCalendarData()]);
    } catch (err) {
      setError(err.message || '承認に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async (requestId, reason) => {
    setActionLoading(true);
    setError(null);

    try {
      await rejectDayOffRequest(requestId, reason, ADMIN_NAME);
      showSuccess('申請を却下しました');
      await Promise.all([fetchRequests(), fetchCalendarData()]);
    } catch (err) {
      setError(err.message || '却下に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async (requestIds) => {
    setActionLoading(true);
    setError(null);

    try {
      const result = await bulkApproveDayOffRequests(requestIds, ADMIN_NAME);
      showSuccess(`${result.approved_count}件の申請を承認しました`);
      await Promise.all([fetchRequests(), fetchCalendarData()]);
    } catch (err) {
      setError(err.message || '一括承認に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle calendar month change
  const handleMonthChange = (year, month) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchRequests(), fetchCalendarData()]);
    setLoading(false);
  };

  // Count pending requests
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout>
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">休暇申請管理</h1>
            <p className="text-gray-600 mt-1">
              スタッフの休暇申請を確認・承認します
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  {pendingCount}件の承認待ち
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === 'list'
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <List className="h-4 w-4" />
                一覧
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  viewMode === 'calendar'
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Calendar className="h-4 w-4" />
                カレンダー
              </button>
            </div>

            <Button
              variant="ghost"
              className="p-2"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top duration-300">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && requests.length === 0 ? (
        <Card className="p-12 bg-white border-none shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
            <p className="text-gray-500">読み込み中...</p>
          </div>
        </Card>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <RequestDayOffApprovalList
              requests={requests}
              staffList={staffList}
              onApprove={handleApprove}
              onReject={handleReject}
              onBulkApprove={handleBulkApprove}
              loading={actionLoading}
            />
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <AdminDayOffCalendar
              statistics={statistics}
              calendarData={calendarData}
              onMonthChange={handleMonthChange}
            />
          )}
        </>
      )}
    </AdminLayout>
  );
}
