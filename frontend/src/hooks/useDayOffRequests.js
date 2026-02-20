// src/hooks/useDayOffRequests.js
import { useState, useEffect, useCallback } from 'react';
import {
  getStaffDayOffRequests,
  createBulkDayOffRequests,
  updateDayOffRequest,
  deleteDayOffRequest,
  getAllStaffDayOffCalendar,
} from '../api/request';

export default function useDayOffRequests(staffId) {
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

  // Fetch my requests when staffId is available
  const fetchMyRequests = useCallback(async () => {
    if (!staffId) return;
    try {
      const requests = await getStaffDayOffRequests(staffId);
      setMyRequests(requests);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  }, [staffId]);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    try {
      const data = await getAllStaffDayOffCalendar(calendarYear, calendarMonth);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    }
  }, [calendarYear, calendarMonth]);

  // Fetch data on staffId/month change
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
      await createBulkDayOffRequests({ ...data, staff_id: staffId });
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
      throw err;
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
      showSuccess('申請を取り消しました');
      await fetchMyRequests();
    } catch (err) {
      setError(err.message || '申請の取り消しに失敗しました');
      throw err;
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

  return {
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
