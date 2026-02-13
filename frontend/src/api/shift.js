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

// ========== Shift Generation API ==========

export async function generateShift(year, month) {
  return fetchAPI('/generate-shift', {
    method: 'POST',
    body: JSON.stringify({ year, month }),
  });
}
