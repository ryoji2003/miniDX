// src/pages/RequirementsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import DailyRequirements from '../components/DailyRequirements';
import { Card, Button } from '../components/ui/Layouts';
import { getHolidays, createHoliday, deleteHoliday } from '../api/shift';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 曜日ヘッダー
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function HolidayCalendar({ year, month }) {
  const [holidays, setHolidays] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHolidays(year, month);
      setHolidays(new Set(data.map((h) => h.date)));
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // 月の日数とカレンダー先頭の曜日を計算
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=日
  const daysInMonth = new Date(year, month, 0).getDate();

  const toggleHoliday = async (dateStr) => {
    if (holidays.has(dateStr)) {
      try {
        await deleteHoliday(dateStr);
        setHolidays((prev) => {
          const next = new Set(prev);
          next.delete(dateStr);
          return next;
        });
      } catch (err) {
        console.error('Failed to delete holiday:', err);
      }
    } else {
      try {
        await createHoliday(dateStr);
        setHolidays((prev) => new Set([...prev, dateStr]));
      } catch (err) {
        console.error('Failed to create holiday:', err);
      }
    }
  };

  const setAllSundays = async () => {
    const toAdd = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      if (date.getDay() === 0) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (!holidays.has(dateStr)) {
          toAdd.push(dateStr);
        }
      }
    }
    for (const dateStr of toAdd) {
      try {
        await createHoliday(dateStr);
      } catch (err) {
        console.error('Failed to create holiday:', err);
      }
    }
    setHolidays((prev) => new Set([...prev, ...toAdd]));
  };

  // カレンダーセルを構築
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-500">日付をクリックして休日を設定/解除できます</span>
        <Button
          onClick={setAllSundays}
          variant="ghost"
          className="text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          今月の日曜をすべて休日に設定
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-400">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-center text-xs font-semibold py-1 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              {label}
            </div>
          ))}
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isHoliday = holidays.has(dateStr);
            const dow = (idx % 7);
            const isSun = dow === 0;
            const isSat = dow === 6;

            return (
              <button
                key={dateStr}
                onClick={() => toggleHoliday(dateStr)}
                className={`
                  rounded p-1 text-sm text-center transition-colors
                  ${isHoliday
                    ? 'bg-gray-300 text-gray-500 font-semibold'
                    : isSun
                    ? 'hover:bg-red-50 text-red-500'
                    : isSat
                    ? 'hover:bg-blue-50 text-blue-500'
                    : 'hover:bg-gray-100 text-gray-800'
                  }
                `}
                title={isHoliday ? '休日（クリックで解除）' : 'クリックで休日に設定'}
              >
                {day}
                {isHoliday && <div className="text-xs text-gray-400 leading-none">休</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RequirementsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const currentMonth = `${year}-${String(month).padStart(2, '0')}`;

  const goPrev = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">日次要件設定</h1>
        <p className="text-gray-600 mt-1">各日に必要なタスクごとの人数を設定します</p>
      </header>

      {/* 月ナビゲーション */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goPrev} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-800 text-lg">
          {year}年{month}月
        </span>
        <button onClick={goNext} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 施設休日設定カレンダー */}
      <Card className="p-6 bg-white border-none shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">施設休日設定</h2>
        <p className="text-sm text-gray-500 mb-4">
          休日に設定した日はシフト生成時に全スタッフの割り当てが0になります。
        </p>
        <HolidayCalendar year={year} month={month} />
      </Card>

      {/* 日次要件設定 */}
      <Card className="p-6 bg-white border-none shadow-sm">
        <DailyRequirements selectedMonth={currentMonth} />
      </Card>
    </AdminLayout>
  );
}
