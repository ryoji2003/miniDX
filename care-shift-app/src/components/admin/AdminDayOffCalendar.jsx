// src/components/admin/AdminDayOffCalendar.jsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { Card, Button, cn } from '../ui/Layouts';

// Generate calendar days for a given month
function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  return days;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// Warning threshold for day-off count
const WARNING_THRESHOLD = 2;
const DANGER_THRESHOLD = 3;

// Detail Modal
function DayDetailModal({ date, statistics, calendarData, onClose }) {
  const dateStr = date.toISOString().split('T')[0];
  const dayRequests = calendarData.filter(item => item.request_date === dateStr);
  const stats = statistics.find(s => s.date === dateStr);

  const formatDate = (d) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{formatDate(date)}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Summary */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.total_requests}</p>
              <p className="text-xs text-gray-500">合計</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
              <p className="text-xs text-green-600">承認済み</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_count}</p>
              <p className="text-xs text-yellow-600">承認待ち</p>
            </div>
          </div>
        )}

        {/* Staff list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {dayRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">この日には休暇申請がありません</p>
          ) : (
            dayRequests.map(req => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-800">{req.staff_name}</span>
                {req.status === 'approved' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    承認済み
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    承認待ち
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-4"
          variant="ghost"
        >
          閉じる
        </Button>
      </div>
    </div>
  );
}

export default function AdminDayOffCalendar({
  statistics = [],
  calendarData = [],
  onMonthChange,
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Create statistics lookup
  const statsLookup = useMemo(() => {
    const map = {};
    statistics.forEach(stat => {
      map[stat.date] = stat;
    });
    return map;
  }, [statistics]);

  // Navigate months
  const goToPreviousMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth + 1);
  };

  const goToNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    onMonthChange?.(newYear, newMonth + 1);
  };

  // Format date string for lookup
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get warning level
  const getWarningLevel = (count) => {
    if (count >= DANGER_THRESHOLD) return 'danger';
    if (count >= WARNING_THRESHOLD) return 'warning';
    return 'normal';
  };

  return (
    <Card className="p-6 bg-white border-none shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-800">休暇カレンダー</h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-400 rounded-full" />
            2-3名休暇
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-400 rounded-full" />
            3名以上
          </span>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          className="p-2"
          onClick={goToPreviousMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-medium text-gray-700">
          {currentYear}年 {MONTHS[currentMonth]}
        </h3>
        <Button
          type="button"
          variant="ghost"
          className="p-2"
          onClick={goToNextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-sm font-medium py-2",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500",
              i > 0 && i < 6 && "text-gray-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayObj, index) => {
          const { date, isCurrentMonth } = dayObj;
          const dateKey = formatDateKey(date);
          const stats = statsLookup[dateKey];
          const totalCount = stats?.total_requests || 0;
          const warningLevel = getWarningLevel(totalCount);
          const dayOfWeek = date.getDay();
          const isToday = formatDateKey(today) === dateKey;

          return (
            <button
              key={index}
              onClick={() => stats && setSelectedDate(date)}
              disabled={!stats}
              className={cn(
                "min-h-[80px] p-2 rounded-lg border transition-all text-left",
                !isCurrentMonth && "bg-gray-50 border-transparent",
                isCurrentMonth && "bg-white border-gray-100 hover:border-gray-200",
                isToday && "ring-2 ring-primary/30",
                stats && "cursor-pointer hover:shadow-md",
                warningLevel === 'warning' && "border-yellow-300 bg-yellow-50",
                warningLevel === 'danger' && "border-red-300 bg-red-50"
              )}
            >
              <div
                className={cn(
                  "text-sm mb-2 font-medium",
                  !isCurrentMonth && "text-gray-300",
                  isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                  isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                  isCurrentMonth && dayOfWeek > 0 && dayOfWeek < 6 && "text-gray-700",
                  isToday && "text-primary"
                )}
              >
                {date.getDate()}
              </div>

              {stats && (
                <div className="space-y-1">
                  {/* Count badge */}
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      warningLevel === 'normal' && "bg-gray-100 text-gray-600",
                      warningLevel === 'warning' && "bg-yellow-200 text-yellow-800",
                      warningLevel === 'danger' && "bg-red-200 text-red-800"
                    )}
                  >
                    {warningLevel !== 'normal' && <AlertTriangle className="h-3 w-3" />}
                    {totalCount}名
                  </div>

                  {/* Status breakdown */}
                  <div className="flex gap-1 text-[10px]">
                    {stats.approved_count > 0 && (
                      <span className="text-green-600">承:{stats.approved_count}</span>
                    )}
                    {stats.pending_count > 0 && (
                      <span className="text-yellow-600">待:{stats.pending_count}</span>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3">今月のサマリー</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {statistics.reduce((sum, s) => sum + s.total_requests, 0)}
            </p>
            <p className="text-xs text-gray-500">総申請数</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {statistics.reduce((sum, s) => sum + s.approved_count, 0)}
            </p>
            <p className="text-xs text-green-600">承認済み</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {statistics.reduce((sum, s) => sum + s.pending_count, 0)}
            </p>
            <p className="text-xs text-yellow-600">承認待ち</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {statistics.filter(s => s.total_requests >= DANGER_THRESHOLD).length}
            </p>
            <p className="text-xs text-red-600">要注意日数</p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          statistics={statistics}
          calendarData={calendarData}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </Card>
  );
}
