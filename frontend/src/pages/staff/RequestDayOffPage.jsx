// src/pages/staff/RequestDayOffPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, RefreshCw, User } from 'lucide-react';
import { Button, Card } from '../../components/ui/Layouts';
import RequestDayOffForm from '../../components/staff/RequestDayOffForm';
import MyRequestedDaysOffList from '../../components/staff/MyRequestedDaysOffList';
import StaffDayOffCalendar from '../../components/staff/StaffDayOffCalendar';
import useDayOffRequests from '../../hooks/useDayOffRequests';

export default function RequestDayOffPage() {
  const {
    staffList,
    selectedStaffId,
    setSelectedStaffId,
    selectedStaff,
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
  } = useDayOffRequests();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-gray-800">休暇申請</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Staff selector */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <User className="h-4 w-4 text-gray-500" />
              <select
                value={selectedStaffId || ''}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
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
        {loading && staffList.length === 0 ? (
          <Card className="p-12 bg-white border-none shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p className="text-gray-500">読み込み中...</p>
            </div>
          </Card>
        ) : !selectedStaffId ? (
          <Card className="p-12 bg-white border-none shadow-sm">
            <div className="text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>スタッフを選択してください</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Day-off request form */}
            <RequestDayOffForm
              staffId={selectedStaffId}
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
              calendarData={calendarData.filter(item => item.staff_id !== selectedStaffId)}
              onMonthChange={handleMonthChange}
            />
          </>
        )}
      </main>
    </div>
  );
}
