// src/api/client.js
// Base fetch wrapper with common configuration and error handling

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api`;

function getAuthToken(endpoint) {
  // 管理者エンドポイントには管理者トークンを優先、なければスタッフトークンを使う
  const adminToken = localStorage.getItem('admin_token');
  const staffToken = localStorage.getItem('auth_token');
  if (endpoint.startsWith('/admin') || endpoint.startsWith('/auth/staff/')) {
    return adminToken || staffToken;
  }
  return staffToken || adminToken;
}

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken(endpoint);

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
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
