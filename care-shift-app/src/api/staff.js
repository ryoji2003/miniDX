// src/api/staff.js
// Staff API functions

import { fetchAPI } from './client';

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
