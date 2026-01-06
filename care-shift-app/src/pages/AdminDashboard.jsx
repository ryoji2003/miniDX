// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import AdminLayout from '../components/AdminLayout';
import { Card, Button } from '../components/ui/Layouts';
import ConstraintInput from '../components/ConstraintInput';
import DailyRequirements from '../components/DailyRequirements';
import { getStaffs, generateShift, mapStaffToFrontend } from '../services/api';
import { Wand2, Download, Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

// Color mapping for different task types
const TASK_COLORS = {
  '看護': { backgroundColor: '#3b82f6', borderColor: '#2563eb' },      // blue
  '運転': { backgroundColor: '#22c55e', borderColor: '#16a34a' },      // green
  '送迎': { backgroundColor: '#22c55e', borderColor: '#16a34a' },      // green (same as driving)
  '入浴': { backgroundColor: '#f59e0b', borderColor: '#d97706' },      // yellow/amber
  'フロ': { backgroundColor: '#f59e0b', borderColor: '#d97706' },      // yellow/amber
  '特浴': { backgroundColor: '#f97316', borderColor: '#ea580c' },      // orange
  '訓練': { backgroundColor: '#a855f7', borderColor: '#9333ea' },      // purple
  'リーダー': { backgroundColor: '#ec4899', borderColor: '#db2777' },  // pink
  'サブリーダー': { backgroundColor: '#f472b6', borderColor: '#ec4899' }, // light pink
  '相談': { backgroundColor: '#06b6d4', borderColor: '#0891b2' },      // cyan
  'default': { backgroundColor: '#6b7280', borderColor: '#4b5563' },   // gray
};

// Get color for a task based on its name
function getTaskColor(taskName) {
  for (const [key, colors] of Object.entries(TASK_COLORS)) {
    if (key !== 'default' && taskName.includes(key)) {
      return colors;
    }
  }
  return TASK_COLORS.default;
}

// Convert shift data to FullCalendar events
function convertToCalendarEvents(shiftData) {
  const events = [];

  for (const [date, assignments] of Object.entries(shiftData)) {
    // Group by task for cleaner display
    const taskGroups = {};
    for (const assignment of assignments) {
      if (!taskGroups[assignment.taskName]) {
        taskGroups[assignment.taskName] = [];
      }
      taskGroups[assignment.taskName].push(assignment.staffName);
    }

    // Create an event for each task group
    for (const [taskName, staffNames] of Object.entries(taskGroups)) {
      const colors = getTaskColor(taskName);
      events.push({
        id: `${date}-${taskName}`,
        title: `${taskName}: ${staffNames.join(', ')}`,
        start: date,
        allDay: true,
        ...colors,
        extendedProps: {
          taskName,
          staffNames,
        },
      });
    }
  }

  return events;
}

export default function AdminDashboard() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showConstraints, setShowConstraints] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // Calendar events (from generated shifts)
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const data = await getStaffs();
      setStaffs(data.map(mapStaffToFrontend));
    } catch (err) {
      console.error('Failed to fetch staffs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShift = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      setDownloadUrl(null);

      const result = await generateShift(year, month);

      if (result.download_url) {
        setDownloadUrl(API_BASE_URL + result.download_url);
        setSuccess(`${year}年${month}月のシフトを生成しました`);

        // Convert shift data to calendar events
        if (result.shift_data) {
          const calendarEvents = convertToCalendarEvents(result.shift_data);
          setEvents(calendarEvents);
        }
      }
    } catch (err) {
      setError(err.message || 'シフト生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const handleDateChange = (info) => {
    setCurrentDate(info.view.currentStart);
  };

  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const displayMonth = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;

  return (
    <AdminLayout>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{displayMonth}のシフト管理</h1>
        <div className="flex gap-3">
          {downloadUrl && (
            <Button
              onClick={handleDownload}
              variant="ghost"
              className="border border-primary text-primary hover:bg-primary/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Excelダウンロード
            </Button>
          )}
          <Button
            onClick={handleGenerateShift}
            disabled={generating}
            className="bg-gradient-to-r from-primary to-teal-500 shadow-lg hover:shadow-xl transition-all"
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {generating ? '生成中...' : 'AIでシフトを自動生成'}
          </Button>
        </div>
      </header>

      {/* Status messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側：スタッフリスト + 制約入力 */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-700">スタッフ一覧</h2>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {staffs.map((staff) => (
                <Card
                  key={staff.id}
                  className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer bg-white border-none shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                    {staff.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-800">{staff.name}</div>
                    <div className="text-xs text-gray-500">
                      {staff.role} • {staff.type === 'FullTime' ? '常勤' : 'パート'}
                    </div>
                  </div>
                </Card>
              ))}

              {staffs.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  スタッフが登録されていません
                </p>
              )}
            </>
          )}

          {/* Constraint Input Toggle */}
          <div className="pt-4 border-t">
            <button
              onClick={() => setShowConstraints(!showConstraints)}
              className="flex items-center justify-between w-full text-left font-semibold text-gray-700 py-2"
            >
              <span>希望休・制約条件</span>
              {showConstraints ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showConstraints && <ConstraintInput />}
          </div>

          {/* Daily Requirements Toggle */}
          <div className="pt-4 border-t">
            <button
              onClick={() => setShowRequirements(!showRequirements)}
              className="flex items-center justify-between w-full text-left font-semibold text-gray-700 py-2"
            >
              <span>日次要件設定</span>
              {showRequirements ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showRequirements && <DailyRequirements selectedMonth={currentMonth} />}
          </div>
        </div>

        {/* 右側：カレンダー */}
        <Card className="lg:col-span-3 p-6 bg-white border-none shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            datesSet={handleDateChange}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            locale="ja"
            height="auto"
            buttonText={{
              today: '今日',
              month: '月',
            }}
            eventContent={(eventInfo) => (
              <div className="p-1 text-xs overflow-hidden">
                <div className="font-semibold truncate">{eventInfo.event.extendedProps.taskName}</div>
                <div className="truncate opacity-90">
                  {eventInfo.event.extendedProps.staffNames?.join(', ')}
                </div>
              </div>
            )}
            dayMaxEvents={3}
            moreLinkText={(num) => `他${num}件`}
          />

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">看護</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">運転</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">入浴介助</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-600">訓練</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-600">その他</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-2">使い方:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>左側のパネルで「希望休・制約条件」を設定します</li>
              <li>「日次要件設定」で各日に必要な人数を設定します</li>
              <li>「AIでシフトを自動生成」ボタンをクリックします</li>
              <li>生成されたExcelファイルをダウンロードします</li>
            </ol>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
