// src/services/api.js
// API service layer for backend communication

const API_BASE_URL = 'http://localhost:8000/api';

// Generic fetch wrapper with error handling
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ========== Staff API ==========

export async function getStaffs() {
  return fetchAPI('/staff');
}

export async function createStaff(staffData) {
  return fetchAPI('/staff', {
    method: 'POST',
    body: JSON.stringify(staffData),
  });
}

export async function updateStaff(staffId, staffData) {
  return fetchAPI(`/staff/${staffId}`, {
    method: 'PUT',
    body: JSON.stringify(staffData),
  });
}

export async function deleteStaff(staffId) {
  return fetchAPI(`/staff/${staffId}`, {
    method: 'DELETE',
  });
}

// ========== Skill API ==========

export async function getSkills() {
  return fetchAPI('/skill');
}

export async function createSkill(skillData) {
  return fetchAPI('/skill', {
    method: 'POST',
    body: JSON.stringify(skillData),
  });
}

// ========== Task API ==========

export async function getTasks() {
  return fetchAPI('/task');
}

export async function createTask(taskData) {
  return fetchAPI('/task', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function deleteTask(taskId) {
  return fetchAPI(`/task/${taskId}`, {
    method: 'DELETE',
  });
}

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

// ========== Helper functions ==========

// Convert backend staff data to frontend format
export function mapStaffToFrontend(backendStaff) {
  const licenseTypeMap = {
    0: [],
    1: ['普通免許'],
    2: ['普通免許', 'ワゴン'],
  };

  const licenses = [...(licenseTypeMap[backendStaff.license_type] || [])];
  if (backendStaff.is_nurse) licenses.push('看護師');

  return {
    id: backendStaff.id,
    name: backendStaff.name,
    role: backendStaff.is_nurse ? '看護師' : (backendStaff.can_only_train ? '訓練専門' : 'スタッフ'),
    avatar: backendStaff.is_nurse ? '👩‍⚕️' : '👤',
    maxHours: backendStaff.work_limit,
    type: backendStaff.is_part_time ? 'PartTime' : 'FullTime',
    licenses: licenses,
    // Keep original backend fields for editing
    _backend: backendStaff,
  };
}

// Convert frontend staff data to backend format
export function mapStaffToBackend(frontendStaff) {
  let licenseType = 0;
  if (frontendStaff.licenses?.includes('ワゴン')) {
    licenseType = 2;
  } else if (frontendStaff.licenses?.includes('普通免許')) {
    licenseType = 1;
  }

  return {
    name: frontendStaff.name,
    work_limit: frontendStaff.maxHours || 20,
    license_type: licenseType,
    is_part_time: frontendStaff.type === 'PartTime',
    can_only_train: frontendStaff.role === '訓練専門',
    is_nurse: frontendStaff.licenses?.includes('看護師') || frontendStaff.role === '看護師',
  };
}
