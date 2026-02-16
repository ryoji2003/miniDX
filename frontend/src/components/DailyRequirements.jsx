// src/components/DailyRequirements.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from './ui/Layouts';
import { getTasks } from '../api/task';
import { getRequirements, createOrUpdateRequirement } from '../api/shift';
import { ClipboardList, Save, Loader2, Info } from 'lucide-react';

// Default requirements based on spec
const DEFAULT_REQUIREMENTS = {
  nursing: { min: 1, label: '看護' },
  driving: { min: 6, label: '運転（送迎）' },
  bathing: { min: 6, label: '入浴介助' },
};

export default function DailyRequirements({ selectedMonth }) {
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [taskRequirements, setTaskRequirements] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Set default date to first day of selected month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      setSelectedDate(`${year}-${month}-01`);
    }
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskData, reqData] = await Promise.all([
        getTasks(),
        getRequirements(),
      ]);
      setTasks(taskData);

      // Group requirements by date
      const grouped = reqData.reduce((acc, req) => {
        if (!acc[req.date]) {
          acc[req.date] = {};
        }
        acc[req.date][req.task_id] = req.count;
        return acc;
      }, {});
      setRequirements(grouped);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Load existing requirements for this date
    if (requirements[date]) {
      setTaskRequirements(requirements[date]);
    } else {
      // Set defaults
      setTaskRequirements({});
    }
  };

  const handleRequirementChange = (taskId, value) => {
    setTaskRequirements((prev) => ({
      ...prev,
      [taskId]: value === '' ? '' : parseInt(value),
    }));
  };

  const handleSave = async () => {
    if (!selectedDate) return;

    try {
      setSaving(true);

      // Save each task requirement
      const promises = Object.entries(taskRequirements).map(([taskId, count]) =>
        createOrUpdateRequirement({
          date: selectedDate,
          task_id: parseInt(taskId),
          count: count === '' ? 0 : parseInt(count) || 0,
        })
      );

      await Promise.all(promises);
      fetchData();
      alert('保存しました');
    } catch (err) {
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white border-none shadow-sm">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-none shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        日次要件設定
      </h2>

      {/* Info box */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg mb-4 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">推奨される最低人数:</p>
          <ul className="mt-1 space-y-0.5">
            <li>看護: 1名以上</li>
            <li>運転（送迎）: 6名以上</li>
            <li>入浴介助: 約6名</li>
          </ul>
        </div>
      </div>

      {/* Date selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          日付を選択
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {selectedDate && (
        <>
          <p className="text-sm text-gray-600 mb-3">
            {formatDate(selectedDate)} の要件:
          </p>

          {/* Task requirements */}
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              タスクが登録されていません。先にタスクを登録してください。
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <label className="flex-1 text-sm text-gray-700">
                    {task.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={taskRequirements[task.id] ?? ''}
                    onChange={(e) => handleRequirementChange(task.id, e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                        handleRequirementChange(task.id, '0');
                      }
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-sm text-gray-500">名</span>
                </div>
              ))}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving || tasks.length === 0}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存
          </Button>
        </>
      )}

      {/* Existing requirements summary */}
      {Object.keys(requirements).length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            設定済みの日:
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(requirements)
              .sort()
              .map((date) => (
                <button
                  key={date}
                  onClick={() => handleDateChange(date)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    date === selectedDate
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {new Date(date).getDate()}日
                </button>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
