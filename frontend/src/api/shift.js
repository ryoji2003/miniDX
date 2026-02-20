// src/api/shift.js
// Shift generation, absence, and requirements API functions

import { fetchAPI } from './client';

// ========== Absence Request API (希望休) ==========

export async function getAbsences() {
  return fetchAPI('/absence');
}

export async function createAbsence(absenceData) {
  return fetchAPI('/absence', {
    method: 'POST',
    body: JSON.stringify(absenceData),
  });
}

export async function deleteAbsence(absenceId) {
  return fetchAPI(`/absence/${absenceId}`, {
    method: 'DELETE',
  });
}

// ========== Daily Requirements API ==========

export async function getRequirements() {
  return fetchAPI('/requirements');
}

export async function createOrUpdateRequirement(requirementData) {
  return fetchAPI('/requirements', {
    method: 'POST',
    body: JSON.stringify(requirementData),
  });
}

// ========== Holiday API (施設休日) ==========

export async function getHolidays(year, month) {
  return fetchAPI(`/holidays?year=${year}&month=${month}`);
}

export async function createHoliday(date, description = null) {
  return fetchAPI('/holidays', {
    method: 'POST',
    body: JSON.stringify({ date, description }),
  });
}

export async function deleteHoliday(date) {
  return fetchAPI(`/holidays/${date}`, {
    method: 'DELETE',
  });
}

// ========== Shift Generation API ==========

export async function generateShift(year, month) {
  return fetchAPI('/generate-shift', {
    method: 'POST',
    body: JSON.stringify({ year, month }),
  });
}

// ========== Monthly Rest Day Setting API (月間公休設定) ==========

export async function getMonthlyRestSetting(year, month) {
  return fetchAPI(`/monthly-rest-setting?year=${year}&month=${month}`);
}

export async function upsertMonthlyRestSetting(year, month, additionalDays) {
  return fetchAPI('/monthly-rest-setting', {
    method: 'POST',
    body: JSON.stringify({ year, month, additional_days: additionalDays }),
  });
}
