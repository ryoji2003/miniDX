// src/pages/staff/RequestDayOffPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Home, RefreshCw, User, LogOut } from 'lucide-react';
import { Button, Card } from '../../components/ui/Layouts';
import RequestDayOffForm from '../../components/staff/RequestDayOffForm';
import MyRequestedDaysOffList from '../../components/staff/MyRequestedDaysOffList';
import StaffDayOffCalendar from '../../components/staff/StaffDayOffCalendar';
import useDayOffRequests from '../../hooks/useDayOffRequests';
import { useAuth } from '../../contexts/AuthContext';

export default function RequestDayOffPage() {
  const navigate = useNavigate();
  const { staffUser, staffLogout } = useAuth();
  const staffId = staffUser?.staff_id;
  const staffName = staffUser?.staff_name;

  const {
    myRequests,
    calendarData,
    loading,
    submitting,
    error,
    successMessage,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleMonthChange,
    handleRefresh,
  } = useDayOffRequests(staffId);

  const handleLogout = () => {
    staffLogout();
    navigate('/staff/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
              title="トップページに戻る"
            >
              <Home className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-gray-800">休暇申請</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* ログイン中のスタッフ名を表示 */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{staffName}</span>
            </div>

            <Button
              variant="ghost"
              className="p-2"
              onClick={handleRefresh}
              disabled={loading}
              title="更新"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              title="ログアウト"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Success/Error messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-in fade-in slide-in-from-top duration-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && myRequests.length === 0 ? (
          <Card className="p-12 bg-white border-none shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-gray-500">読み込み中...</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Day-off request form */}
            <RequestDayOffForm
              staffId={staffId}
              existingRequests={myRequests}
              onSubmit={handleSubmit}
              loading={submitting}
            />

            {/* My requests list */}
            <MyRequestedDaysOffList
              requests={myRequests}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={submitting}
            />

            {/* Other staff calendar */}
            <StaffDayOffCalendar
              calendarData={calendarData.filter(item => item.staff_id !== staffId)}
              onMonthChange={handleMonthChange}
            />
          </>
        )}
      </main>
    </div>
  );
}
