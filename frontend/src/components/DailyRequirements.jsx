// src/components/DailyRequirements.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from './ui/Layouts';
import { getTasks } from '../api/task';
import { getRequirements, createOrUpdateRequirement } from '../api/shift';
import { ClipboardList, Save, Loader2, Info } from 'lucide-react';

// デフォルト要件の人数設定
const DEFAULT_REQUIREMENTS_MAP = {
  '相談': 1,
  '看護師': 2,
  '訓練': 1,
  '看護': 1,
  '特浴': 1,
  '風呂': 5,
  'リーダー': 1,
  'サブリーダー': 1,
  '運転手': 6,
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
    // デフォルトの日付を、選択された月の最初の日（1日）に設定
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      handleDateChange(`${year}-${month}-01`);
    }
  }, [selectedMonth, tasks]); // tasksのロード完了後にも実行されるよう追加

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskData, reqData] = await Promise.all([
        getTasks(),
        getRequirements(),
      ]);
      setTasks(taskData);

      // 日付ごとに要件をグループ化
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
    
    if (requirements[date]) {
      // すでにDBに設定がある場合はそれを表示
      setTaskRequirements(requirements[date]);
    } else {
      // 設定がない場合はタスク名からキーワードを探してデフォルト値をセット
      const newDefaults = {};
      tasks.forEach(task => {
        const matchKey = Object.keys(DEFAULT_REQUIREMENTS_MAP).find(key => task.name.includes(key));
        newDefaults[task.id] = matchKey ? DEFAULT_REQUIREMENTS_MAP[matchKey] : 0;
      });
      setTaskRequirements(newDefaults);
    }
  };

  const handleRequirementChange = (taskId, value) => {
    setTaskRequirements((prev) => ({
      ...prev,
      [taskId]: value === '' ? '' : parseInt(value),
    }));
  };

  // 【この日のみ保存】
  const handleSave = async () => {
    if (!selectedDate) return;

    try {
      setSaving(true);
      const promises = Object.entries(taskRequirements).map(([taskId, count]) =>
        createOrUpdateRequirement({
          date: selectedDate,
          task_id: parseInt(taskId),
          count: count === '' ? 0 : parseInt(count) || 0,
        })
      );

      await Promise.all(promises);
      await fetchData();
      alert('保存しました');
    } catch (err) {
      alert('保存に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // 【一括保存】その月の全日程に適用
  const handleBulkSave = async () => {
    if (!selectedDate || tasks.length === 0) return;
    
    const [year, month] = selectedDate.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    
    if (!window.confirm(`${month}月の全日程（1日〜${lastDay}日）に現在の設定を適用しますか？`)) return;

    try {
      setSaving(true);
      
      const datesToUpdate = [];
      for (let d = 1; d <= lastDay; d++) {
        datesToUpdate.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      }

      const allPromises = [];
      datesToUpdate.forEach(date => {
        Object.entries(taskRequirements).forEach(([taskId, count]) => {
          allPromises.push(
            createOrUpdateRequirement({
              date: date,
              task_id: parseInt(taskId),
              count: count === '' ? 0 : parseInt(count) || 0,
            })
          );
        });
      });

      await Promise.all(allPromises);
      await fetchData();
      alert(`${month}月の全日程に適用を完了しました`);
    } catch (err) {
      alert('一括保存に失敗しました: ' + err.message);
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

      <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg mb-4 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">設定のヒント:</p>
          <p>日付を選択すると、基本となる人数が自動入力されます。月を通して同じ設定にする場合は「一括適用」が便利です。</p>
        </div>
      </div>

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
          <p className="text-sm text-gray-600 mb-3 font-medium">
            {formatDate(selectedDate)} の要件:
          </p>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              タスクが登録されていません
            </p>
          ) : (
            <div className="space-y-3 mb-6">
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
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-sm text-gray-500 w-6">名</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || tasks.length === 0}
              className="w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              この日のみ保存
            </Button>
            
            <Button
              onClick={handleBulkSave}
              disabled={saving || tasks.length === 0}
              variant="ghost" 
              className="w-full border border-primary text-primary hover:bg-primary/10"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardList className="w-4 h-4 mr-2" />}
              この月の全日に一括適用
            </Button>
          </div>
        </>
      )}

      {Object.keys(requirements).length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            設定済みの日を確認:
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(requirements)
              .filter((date) => selectedDate && date.startsWith(selectedDate.slice(0, 7)))
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