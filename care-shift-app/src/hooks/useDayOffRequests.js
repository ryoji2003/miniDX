// src/hooks/useDayOffRequests.js
import { useState, useEffect, useCallback } from 'react';
import { getStaffs } from '../api/staff';
import {
  getStaffDayOffRequests,
  createBulkDayOffRequests,
  updateDayOffRequest,
  deleteDayOffRequest,
  getAllStaffDayOffCalendar,
} from '../api/request';

export default function useDayOffRequests() {
  // Staff selection
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // Data states
  const [myRequests, setMyRequests] = useState([]);
  const [calendarData, setCalendarData] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Current calendar month
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);

  // Fetch staff list on mount
  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const staffs = await getStaffs();
        setStaffList(staffs);
        if (staffs.length > 0) {
          setSelectedStaffId(staffs[0].id);
        }
      } catch (err) {
        setError('スタッフ情報の取得に失敗しました');
      }
    };
    fetchStaffs();
  }, []);

  // Fetch my requests when staff selected
  const fetchMyRequests = useCallback(async () => {
    if (!selectedStaffId) return;

    try {
      const requests = await getStaffDayOffRequests(selectedStaffId);
      setMyRequests(requests);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  }, [selectedStaffId]);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      const data = await getAllStaffDayOffCalendar(calendarYear, calendarMonth);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    }
  }, [calendarYear, calendarMonth]);

  // Fetch data on staff/month change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMyRequests(), fetchCalendarData()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchMyRequests, fetchCalendarData]);

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle form submission
  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError(null);

    try {
      await createBulkDayOffRequests(data);
      showSuccess('休暇申請を送信しました');
      await fetchMyRequests();
    } catch (err) {
      setError(err.message || '申請の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (requestId, data) => {
    setSubmitting(true);
    setError(null);

    try {
      await updateDayOffRequest(requestId, data);
      showSuccess('申請を更新しました');
      await fetchMyRequests();
    } catch (err) {
      setError(err.message || '申請の更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (requestId) => {
    setSubmitting(true);
    setError(null);

    try {
      await deleteDayOffRequest(requestId);
      showSuccess('申請を削除しました');
      await fetchMyRequests();
    } catch (err) {
      setError(err.message || '申請の削除に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle calendar month change
  const handleMonthChange = (year, month) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchMyRequests(), fetchCalendarData()]);
    setLoading(false);
  };

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);

  return {
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
  };
}
