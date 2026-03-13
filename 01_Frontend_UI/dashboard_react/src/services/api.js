const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function getHeaders(json = true) {
  const token = localStorage.getItem('na_token') || '';
  const headers = { 'Authorization': `Bearer ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  register: async (data) => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.detail || 'Registration failed');
    return resData;
  },

  getMe: async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  // Scans
  uploadScan: async (formData) => {
    const response = await fetch(`${BASE_URL}/api/scan/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('na_token') || ''}` },
      body: formData,
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.detail || 'Upload failed');
    return resData;
  },

  getScanHistory: async (params = {}) => {
    const response = await fetch(`${BASE_URL}/api/scan/history?${new URLSearchParams(params)}`, {
      headers: getHeaders(),
    });
    return response.json();
  },

  getScanDetail: async (scanId) => {
    const response = await fetch(`${BASE_URL}/api/scan/${scanId}`, { headers: getHeaders() });
    return response.json();
  },

  reviewScan: async (scanId, action, diagnosis, notes) => {
    const response = await fetch(`${BASE_URL}/api/scan/${scanId}/review`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action, doctor_diagnosis: diagnosis, doctor_notes: notes }),
    });
    return response.json();
  },

  // Patients
  createPatient: async (data) => {
    const response = await fetch(`${BASE_URL}/api/patients/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.detail || 'Failed to create patient');
    return resData;
  },

  getPatients: async () => {
    const response = await fetch(`${BASE_URL}/api/patients/`, { headers: getHeaders() });
    return response.json();
  },

  getPatient: async (id) => {
    const response = await fetch(`${BASE_URL}/api/patients/${id}`, { headers: getHeaders() });
    return response.json();
  },

  getPatientTimeline: async (id) => {
    const response = await fetch(`${BASE_URL}/api/patients/${id}/timeline`, { headers: getHeaders() });
    return response.json();
  },

  // System
  getSystemStatus: async () => {
    const response = await fetch(`${BASE_URL}/api/debug/status`, { headers: getHeaders() });
    return response.json();
  },
};

export default api;
