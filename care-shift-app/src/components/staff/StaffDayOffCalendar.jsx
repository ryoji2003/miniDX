// src/components/staff/StaffDayOffCalendar.jsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Card, Button, cn } from '../ui/Layouts';

// Color palette for staff members (distinct, colorblind-friendly)
const STAFF_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
];

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

export default function StaffDayOffCalendar({ calendarData = [], onMonthChange }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Create staff color mapping
  const staffColorMap = useMemo(() => {
    const uniqueStaffIds = [...new Set(calendarData.map(item => item.staff_id))];
    const map = {};
    uniqueStaffIds.forEach((staffId, index) => {
      map[staffId] = STAFF_COLORS[index % STAFF_COLORS.length];
    });
    return map;
  }, [calendarData]);

  // Group calendar data by date
  const dataByDate = useMemo(() => {
    const map = {};
    calendarData.forEach(item => {
      if (!map[item.request_date]) {
        map[item.request_date] = [];
      }
      map[item.request_date].push(item);
    });
    return map;
  }, [calendarData]);

  // Get unique staff list for legend
  const staffList = useMemo(() => {
    const unique = new Map();
    calendarData.forEach(item => {
      if (!unique.has(item.staff_id)) {
        unique.set(item.staff_id, {
          id: item.staff_id,
          name: item.staff_name,
          color: staffColorMap[item.staff_id],
        });
      }
    });
    return Array.from(unique.values());
  }, [calendarData, staffColorMap]);

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

  return (
    <Card className="p-6 bg-white border-none shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-800">他のスタッフの休暇</h2>
        <span className="text-sm text-gray-500">(承認済みのみ表示)</span>
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

      {/* Staff legend */}
      {staffList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
          {staffList.map(staff => (
            <span
              key={staff.id}
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                staff.color.bg,
                staff.color.text
              )}
            >
              {staff.name}
            </span>
          ))}
        </div>
      )}

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
          const dayRequests = dataByDate[dateKey] || [];
          const dayOfWeek = date.getDay();
          const isToday = formatDateKey(today) === dateKey;
          const hasOverlap = dayRequests.length > 1;

          return (
            <div
              key={index}
              className={cn(
                "min-h-[80px] p-1 rounded-lg border transition-all",
                !isCurrentMonth && "bg-gray-50 border-transparent",
                isCurrentMonth && "bg-white border-gray-100",
                isToday && "ring-2 ring-primary/30",
                hasOverlap && "border-yellow-300 bg-yellow-50/50"
              )}
            >
              <div
                className={cn(
                  "text-sm mb-1 text-right pr-1",
                  !isCurrentMonth && "text-gray-300",
                  isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                  isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                  isCurrentMonth && dayOfWeek > 0 && dayOfWeek < 6 && "text-gray-700",
                  isToday && "font-bold"
                )}
              >
                {date.getDate()}
              </div>

              {/* Day-off requests */}
              <div className="space-y-0.5">
                {dayRequests.slice(0, 3).map((req, i) => {
                  const color = staffColorMap[req.staff_id];
                  return (
                    <div
                      key={req.id}
                      className={cn(
                        "text-xs px-1 py-0.5 rounded truncate",
                        color?.bg,
                        color?.text
                      )}
                      title={req.staff_name}
                    >
                      {req.staff_name}
                    </div>
                  );
                })}
                {dayRequests.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    +{dayRequests.length - 3}名
                  </div>
                )}
              </div>

              {/* Overlap warning indicator */}
              {hasOverlap && (
                <div className="absolute top-1 right-1">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" title="複数名が休暇" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {calendarData.length === 0 && (
        <div className="text-center py-8 text-gray-500 mt-4">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>この月には他のスタッフの承認済み休暇がありません</p>
        </div>
      )}
    </Card>
  );
}
