// src/api/request.js
// Day-off request API functions (staff and admin views)

import { fetchAPI } from './client';

// ========== Staff endpoints ==========

export async function createDayOffRequest(data) {
  return fetchAPI('/staff/requested-days-off', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createBulkDayOffRequests(data) {
  return fetchAPI('/staff/requested-days-off/bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getStaffDayOffRequests(staffId, params = {}) {
  const queryParams = new URLSearchParams({ staff_id: staffId });
  if (params.status) queryParams.append('status', params.status);
  if (params.year) queryParams.append('year', params.year);
  if (params.month) queryParams.append('month', params.month);

  return fetchAPI(`/staff/requested-days-off?${queryParams}`);
}

export async function getDayOffRequestDetail(requestId) {
  return fetchAPI(`/staff/requested-days-off/${requestId}`);
}

export async function updateDayOffRequest(requestId, data) {
  return fetchAPI(`/staff/requested-days-off/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDayOffRequest(requestId) {
  return fetchAPI(`/staff/requested-days-off/${requestId}`, {
    method: 'DELETE',
  });
}

export async function getAllStaffDayOffCalendar(year, month) {
  return fetchAPI(`/staff/requested-days-off/calendar/all?year=${year}&month=${month}`);
}

// ========== Admin endpoints ==========

export async function getAllDayOffRequests(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.staffId) queryParams.append('staff_id', params.staffId);
  if (params.year) queryParams.append('year', params.year);
  if (params.month) queryParams.append('month', params.month);

  const query = queryParams.toString();
  return fetchAPI(`/admin/requested-days-off${query ? '?' + query : ''}`);
}

export async function approveDayOffRequest(requestId, approvedBy) {
  return fetchAPI(`/admin/requested-days-off/${requestId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

export async function rejectDayOffRequest(requestId, rejectionReason, rejectedBy) {
  return fetchAPI(`/admin/requested-days-off/${requestId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ rejection_reason: rejectionReason, rejected_by: rejectedBy }),
  });
}

export async function resetDayOffRequestToPending(requestId) {
  return fetchAPI(`/admin/requested-days-off/${requestId}/pending`, {
    method: 'PUT',
  });
}

export async function bulkApproveDayOffRequests(requestIds, approvedBy) {
  return fetchAPI(`/admin/requested-days-off/bulk-approve?${requestIds.map(id => `request_ids=${id}`).join('&')}`, {
    method: 'PUT',
    body: JSON.stringify({ approved_by: approvedBy }),
  });
}

export async function getAdminDayOffCalendar(year, month, includePending = true) {
  return fetchAPI(`/admin/requested-days-off/calendar?year=${year}&month=${month}&include_pending=${includePending}`);
}

export async function getDayOffStatistics(year, month) {
  return fetchAPI(`/admin/requested-days-off/statistics?year=${year}&month=${month}`);
}
