// src/api/auth.js
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`;

async function authFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `HTTP error! status: ${response.status}`);
  }
  return data;
}

export async function staffLogin(name, password) {
  return authFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
}

export async function setupPassword(setupToken, newPassword) {
  return authFetch('/auth/setup-password', {
    method: 'POST',
    body: JSON.stringify({ setup_token: setupToken, new_password: newPassword }),
  });
}

export async function adminLogin(username, password) {
  return authFetch('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function resetStaffPassword(staffId) {
  const adminToken = localStorage.getItem('admin_token');
  return authFetch(`/auth/staff/${staffId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
  });
}
