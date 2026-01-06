// src/components/ConstraintInput.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from './ui/Layouts';
import { getStaffs, getAbsences, createAbsence, deleteAbsence, mapStaffToFrontend } from '../services/api';
import { CalendarDays, UserX, Trash2, Plus, Loader2 } from 'lucide-react';

export default function ConstraintInput() {
  const [staffs, setStaffs] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffData, absenceData] = await Promise.all([
        getStaffs(),
        getAbsences(),
      ]);
      setStaffs(staffData.map(mapStaffToFrontend));
      setAbsences(absenceData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAbsence = async () => {
    if (!selectedStaff || !selectedDate) return;

    try {
      setSaving(true);
      await createAbsence({
        staff_id: parseInt(selectedStaff),
        date: selectedDate,
      });
      setSelectedStaff('');
      setSelectedDate('');
      fetchData();
    } catch (err) {
      alert('希望休の追加に失敗しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    try {
      await deleteAbsence(absenceId);
      fetchData();
    } catch (err) {
      alert('削除に失敗しました: ' + err.message);
    }
  };

  const getStaffName = (staffId) => {
    const staff = staffs.find((s) => s.id === staffId);
    return staff ? staff.name : `ID: ${staffId}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // Group absences by date
  const groupedAbsences = absences.reduce((acc, absence) => {
    if (!acc[absence.date]) {
      acc[absence.date] = [];
    }
    acc[absence.date].push(absence);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedAbsences).sort();

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
        <UserX className="w-5 h-5 text-primary" />
        希望休・制約条件
      </h2>

      {/* Add new absence form */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <select
          value={selectedStaff}
          onChange={(e) => setSelectedStaff(e.target.value)}
          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">スタッフを選択</option>
          {staffs.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        <Button
          onClick={handleAddAbsence}
          disabled={!selectedStaff || !selectedDate || saving}
          className="whitespace-nowrap"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          追加
        </Button>
      </div>

      {/* Absence list */}
      {sortedDates.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          希望休が登録されていません
        </p>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((date) => (
            <div key={date} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {formatDate(date)}
              </div>
              <div className="flex flex-wrap gap-2">
                {groupedAbsences[date].map((absence) => (
                  <span
                    key={absence.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-sm"
                  >
                    {getStaffName(absence.staff_id)}
                    <button
                      onClick={() => handleDeleteAbsence(absence.id)}
                      className="ml-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
