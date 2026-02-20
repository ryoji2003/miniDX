// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import AdminLayout from '../components/AdminLayout';
import { Card, Button } from '../components/ui/Layouts';
import { getStaffs, mapStaffToFrontend } from '../api/staff';
import { generateShift, getHolidays, getMonthlyRestSetting, upsertMonthlyRestSetting } from '../api/shift';
import { Wand2, Download, Loader2, AlertCircle, CheckCircle, Calendar, Table, Save } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Color mapping for different task types
const TASK_COLORS = {
  '看護': { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  '運転': { backgroundColor: '#22c55e', borderColor: '#16a34a' },
  '送迎': { backgroundColor: '#22c55e', borderColor: '#16a34a' },
  '入浴': { backgroundColor: '#f59e0b', borderColor: '#d97706' },
  'フロ': { backgroundColor: '#f59e0b', borderColor: '#d97706' },
  '特浴': { backgroundColor: '#f97316', borderColor: '#ea580c' },
  '訓練': { backgroundColor: '#a855f7', borderColor: '#9333ea' },
  'リーダー': { backgroundColor: '#ec4899', borderColor: '#db2777' },
  'サブリーダー': { backgroundColor: '#f472b6', borderColor: '#ec4899' },
  '相談': { backgroundColor: '#06b6d4', borderColor: '#0891b2' },
  'default': { backgroundColor: '#6b7280', borderColor: '#4b5563' },
};

function getTaskColor(taskName) {
  for (const [key, colors] of Object.entries(TASK_COLORS)) {
    if (key !== 'default' && taskName.includes(key)) {
      return colors;
    }
  }
  return TASK_COLORS.default;
}

// Convert by_date shift data to FullCalendar events
function convertToCalendarEvents(byDate) {
  const events = [];
  if (!byDate) return events;

  for (const [date, assignments] of Object.entries(byDate)) {
    const taskGroups = {};
    for (const assignment of assignments) {
      if (!taskGroups[assignment.taskName]) {
        taskGroups[assignment.taskName] = [];
      }
      taskGroups[assignment.taskName].push(assignment.staffName);
    }

    for (const [taskName, staffNames] of Object.entries(taskGroups)) {
      const colors = getTaskColor(taskName);
      events.push({
        id: `${date}-${taskName}`,
        title: `${taskName}: ${staffNames.join(', ')}`,
        start: date,
        allDay: true,
        ...colors,
        extendedProps: { taskName, staffNames },
      });
    }
  }

  return events;
}

// Shift table component (縦：職員名、横：日付)
function ShiftTable({ byStaff, days, year, month, holidayDates }) {
  if (!byStaff || byStaff.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        シフトを生成するとここに表形式で表示されます
      </div>
    );
  }

  const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-blue-600 text-white px-3 py-2 text-left min-w-[90px] border border-blue-500">
              氏名 \ 日付
            </th>
            {days.map(d => {
              const date = new Date(year, month - 1, d);
              const weekday = weekdayNames[date.getDay()];
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isHoliday = holidayDates.includes(dateStr);
              const isSunday = date.getDay() === 0;
              const isSaturday = date.getDay() === 6;
              return (
                <th
                  key={d}
                  className={[
                    'px-2 py-1 text-center font-medium border min-w-[56px]',
                    isHoliday ? 'bg-gray-300 text-gray-600' :
                    isSunday ? 'bg-red-100 text-red-700' :
                    isSaturday ? 'bg-blue-100 text-blue-700' :
                    'bg-blue-600 text-white',
                  ].join(' ')}
                >
                  <div>{d}</div>
                  <div className="text-xs">{weekday}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {byStaff.map((staffRow, idx) => (
            <tr key={staffRow.staffId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="sticky left-0 z-10 bg-blue-50 font-semibold px-3 py-1 border border-gray-200 text-gray-800">
                {staffRow.staffName}
              </td>
              {days.map(d => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const taskName = staffRow.shifts[dateStr] || '';
                const isHoliday = holidayDates.includes(dateStr);
                const date = new Date(year, month - 1, d);
                const isSaturday = date.getDay() === 6;
                const isRest = !taskName;

                let bgClass = '';
                if (isHoliday) bgClass = 'bg-gray-200 text-gray-500';
                else if (isRest && isSaturday) bgClass = 'bg-blue-50 text-blue-400';
                else if (isRest) bgClass = 'bg-gray-100 text-gray-400';
                else bgClass = 'text-gray-800';

                return (
                  <td key={d} className={`px-1 py-1 text-center border border-gray-200 text-xs ${bgClass}`}>
                    {isHoliday ? '休館' : isRest ? '休' : taskName}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'table'

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Shift data
  const [byDateData, setByDateData] = useState({});
  const [byStaffData, setByStaffData] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [holidayDates, setHolidayDates] = useState([]);

  // Monthly rest setting
  const [additionalDays, setAdditionalDays] = useState('');
  const [savingRestSetting, setSavingRestSetting] = useState(false);
  const [restSettingSuccess, setRestSettingSuccess] = useState(null);

  useEffect(() => {
    fetchStaffs();
  }, []);

  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    fetchHolidays(y, m);
    fetchRestSetting(y, m);
  }, [currentDate]);

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

  const fetchHolidays = async (y, m) => {
    try {
      const data = await getHolidays(y, m);
      setHolidayDates(data.map(h => h.date));
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    }
  };

  const fetchRestSetting = async (y, m) => {
    try {
      const data = await getMonthlyRestSetting(y, m);
      setAdditionalDays(String(data.additional_days));
    } catch {
      setAdditionalDays('');
    }
  };

  const handleSaveRestSetting = async () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const parsedDays = parseInt(additionalDays, 10);
    if (isNaN(parsedDays) || parsedDays < 0) return;

    try {
      setSavingRestSetting(true);
      setRestSettingSuccess(null);
      await upsertMonthlyRestSetting(y, m, parsedDays);
      setRestSettingSuccess('保存しました');
      setTimeout(() => setRestSettingSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save rest setting:', err);
    } finally {
      setSavingRestSetting(false);
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

        if (result.shift_data) {
          const byDate = result.shift_data.by_date || {};
          const byStaff = result.shift_data.by_staff || [];
          setByDateData(byDate);
          setByStaffData(byStaff);
          setCalendarEvents(convertToCalendarEvents(byDate));
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

  const handleDateChange = async (info) => {
    const newDate = info.view.currentStart;
    setCurrentDate(newDate);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const displayMonth = `${year}年${month}月`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
            {generating ? '生成中...' : 'シフトを生成'}
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
        {/* 左側：月間公休設定 + スタッフリスト */}
        <div className="lg:col-span-1 space-y-4">
          {/* 月間公休設定 */}
          <Card className="p-4 bg-white border-none shadow-sm">
            <h2 className="font-semibold text-gray-700 mb-2">月間公休設定</h2>
            <p className="text-xs text-gray-500 mb-3">
              {displayMonth}の公休数（土曜以外の休日）を設定します。<br />
              休日数 ＝ 土曜日数 ＋ 公休数
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="31"
                value={additionalDays}
                onChange={e => setAdditionalDays(e.target.value)}
                placeholder="公休数"
                className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
              <span className="text-sm text-gray-600">日</span>
              <Button
                onClick={handleSaveRestSetting}
                disabled={savingRestSetting || additionalDays === ''}
                className="text-sm h-8 px-3 ml-auto"
                title="保存"
              >
                {savingRestSetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
            {restSettingSuccess && (
              <p className="text-xs text-green-600 mt-1">{restSettingSuccess}</p>
            )}
          </Card>

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
        </div>

        {/* 右側：カレンダー / シフト表 */}
        <Card className="lg:col-span-3 p-6 bg-white border-none shadow-sm">
          {/* View toggle */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setViewMode('calendar')}
              className={[
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              <Calendar className="h-4 w-4" />
              カレンダー
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={[
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              ].join(' ')}
            >
              <Table className="h-4 w-4" />
              シフト表
            </button>
          </div>

          {viewMode === 'calendar' ? (
            <>
              <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={[
                  ...calendarEvents,
                  ...holidayDates.map((date) => ({
                    id: `holiday-${date}`,
                    start: date,
                    allDay: true,
                    display: 'background',
                    backgroundColor: '#e5e7eb',
                  })),
                ]}
                dayCellContent={(arg) => {
                  const y = arg.date.getFullYear();
                  const m = String(arg.date.getMonth() + 1).padStart(2, '0');
                  const d = String(arg.date.getDate()).padStart(2, '0');
                  const dateStr = `${y}-${m}-${d}`;
                  const isHoliday = holidayDates.includes(dateStr);
                  return (
                    <div className="fc-daygrid-day-number-wrapper">
                      <span>{arg.dayNumberText}</span>
                      {isHoliday && (
                        <span className="ml-1 text-xs text-gray-400 font-normal">休館</span>
                      )}
                    </div>
                  );
                }}
                datesSet={handleDateChange}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth',
                }}
                locale="ja"
                height="auto"
                buttonText={{ today: '今日', month: '月' }}
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
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-gray-600">看護</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-gray-600">運転</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-gray-600">入浴介助</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-gray-600">訓練</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span className="text-gray-600">その他</span></div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p className="font-medium mb-2">使い方:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>左の「月間公休設定」で公休数を入力して保存します</li>
                  <li>サイドバーの「希望休・制約条件」で制約を設定します</li>
                  <li>「シフトを生成」ボタンをクリックします</li>
                  <li>「シフト表」タブで表形式を確認し、Excelをダウンロードします</li>
                </ol>
              </div>
            </>
          ) : (
            <ShiftTable
              byStaff={byStaffData}
              days={days}
              year={year}
              month={month}
              holidayDates={holidayDates}
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
