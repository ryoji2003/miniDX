// src/components/staff/RequestDayOffForm.jsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Send, X } from 'lucide-react';
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

// Format date to YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Check if date is in the past
function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function RequestDayOffForm({ staffId, existingRequests = [], onSubmit, loading = false }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState('');
  const [selectionStart, setSelectionStart] = useState(null);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Count existing requests for the currently displayed month
  const existingRequestsThisMonth = useMemo(() => {
    return existingRequests.filter(req => {
      const d = new Date(req.request_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [existingRequests, currentYear, currentMonth]);

  // Check if date already has a request
  const hasExistingRequest = (date) => {
    const dateStr = formatDate(date);
    return existingRequests.some(req => req.request_date === dateStr);
  };

  // Check if date is selected
  const isSelected = (date) => {
    return selectedDates.some(d => formatDate(d) === formatDate(date));
  };

  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDates([]);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDates([]);
  };

  // Handle date click - toggle selection or start range
  const handleDateClick = (date, e) => {
    if (isPastDate(date) || hasExistingRequest(date)) return;

    if (e.shiftKey && selectionStart) {
      // Range selection
      const start = selectionStart < date ? selectionStart : date;
      const end = selectionStart < date ? date : selectionStart;
      const range = [];
      const current = new Date(start);

      while (current <= end) {
        if (!isPastDate(current) && !hasExistingRequest(current)) {
          range.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }

      setSelectedDates(prev => {
        const existing = prev.filter(d => !range.some(r => formatDate(r) === formatDate(d)));
        return [...existing, ...range];
      });
      setSelectionStart(null);
    } else {
      // Toggle single date
      if (isSelected(date)) {
        setSelectedDates(prev => prev.filter(d => formatDate(d) !== formatDate(date)));
      } else {
        setSelectedDates(prev => [...prev, new Date(date)]);
      }
      setSelectionStart(date);
    }
  };

  // Remove selected date
  const removeSelectedDate = (date) => {
    setSelectedDates(prev => prev.filter(d => formatDate(d) !== formatDate(date)));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDates.length === 0 || !staffId) return;
    if (isMonthLimitExceeded) return;

    const requestDates = selectedDates.map(d => formatDate(d));
    await onSubmit({
      staff_id: staffId,
      request_dates: requestDates,
      reason: reason.trim() || null,
    });

    // Clear form on success
    setSelectedDates([]);
    setReason('');
  };

  return (
    <Card className="p-6 bg-white border-none shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-800">休暇申請</h2>
        <span className="ml-auto text-sm text-gray-500">
          この月の申請: {existingRequestsThisMonth.length}件
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
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
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700">
                {currentYear}年 {MONTHS[currentMonth]}
              </h3>
              <p className="text-xs text-gray-500">
                申請済み: {existingRequestsThisMonth.length}件
              </p>
            </div>
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
              const dayOfWeek = date.getDay();
              const past = isPastDate(date);
              const existing = hasExistingRequest(date);
              const selected = isSelected(date);
              const disabled = past || existing;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => handleDateClick(date, e)}
                  className={cn(
                    "aspect-square flex items-center justify-center text-sm rounded-lg transition-all",
                    "hover:ring-2 hover:ring-primary/30",
                    !isCurrentMonth && "text-gray-300",
                    isCurrentMonth && !disabled && dayOfWeek === 0 && "text-red-500",
                    isCurrentMonth && !disabled && dayOfWeek === 6 && "text-blue-500",
                    isCurrentMonth && !disabled && dayOfWeek > 0 && dayOfWeek < 6 && "text-gray-700",
                    past && "text-gray-300 cursor-not-allowed hover:ring-0",
                    existing && "bg-gray-100 text-gray-400 cursor-not-allowed hover:ring-0",
                    selected && "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            ヒント: Shiftキーを押しながらクリックで範囲選択できます
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選択した日付 ({selectedDates.length}件)
            </label>
            <div className="min-h-[100px] max-h-[200px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {selectedDates.length === 0 ? (
                <p className="text-gray-400 text-sm">カレンダーから日付を選択してください</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedDates
                    .sort((a, b) => a - b)
                    .map((date) => (
                      <span
                        key={formatDate(date)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                      >
                        {date.getMonth() + 1}/{date.getDate()}
                        <button
                          type="button"
                          onClick={() => removeSelectedDate(date)}
                          className="hover:bg-primary/20 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              理由（任意）
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="休暇の理由を入力してください（任意）"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{reason.length}/500</p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={selectedDates.length === 0 || loading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                送信中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                申請を送信
              </span>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
