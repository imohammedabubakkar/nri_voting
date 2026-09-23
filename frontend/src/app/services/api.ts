/**
 * API Service for communicating with the Election Portal Backend.
 * Base URL defaults to http://localhost:5000/api (or custom VITE_API_URL).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // System Health
  checkHealth: () => request<{ status: string; service: string }>('/health'),

  // Authentication
  auth: {
    adminLogin: (username: string, password: string) =>
      request<{ success: boolean; token: string; admin: any }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    getAdminProfile: () =>
      request<{ success: boolean; admin: any }>('/auth/admin/me'),
    userLogin: (aadhaar: string) =>
      request<{ success: boolean; token: string; user: any }>('/auth/user/login', {
        method: 'POST',
        body: JSON.stringify({ aadhaar }),
      }),
    getUserProfile: () =>
      request<{ success: boolean; user: any }>('/auth/user/me'),
  },

  // Voter Management
  users: {
    getAll: (params?: { search?: string; state?: string; country?: string; district?: string; currentPlace?: string; constituency?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ success: boolean; count: number; users: any[] }>(`/users${query ? `?${query}` : ''}`);
    },
    checkDuplicate: (field: 'aadhaar' | 'voterId' | 'passport', value: string, excludeId?: string) => {
      const params = new URLSearchParams({ field, value });
      if (excludeId) params.append('excludeId', excludeId);
      return request<{ success: boolean; exists: boolean; message: string }>(`/users/check-duplicate?${params.toString()}`);
    },
    create: (userData: any) =>
      request<{ success: boolean; message: string; user: any }>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getById: (id: string) =>
      request<{ success: boolean; user: any }>(`/users/${id}`),
    update: (id: string, updates: any) =>
      request<{ success: boolean; message: string; user: any }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // Candidate Management
  candidates: {
    getAll: (params?: { electionType?: string; state?: string; district?: string; constituency?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ success: boolean; count: number; candidates: any[] }>(`/candidates${query ? `?${query}` : ''}`);
    },
    getById: (id: string) =>
      request<{ success: boolean; candidate: any }>(`/candidates/${id}`),
    create: (candidateData: any) =>
      request<{ success: boolean; message: string; candidate: any }>('/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateData),
      }),
    update: (id: string, updates: any) =>
      request<{ success: boolean; message: string; candidate: any }>(`/candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/candidates/${id}`, {
        method: 'DELETE',
      }),
  },

  // Election Schedule
  election: {
    getSchedule: () =>
      request<{ success: boolean; schedule: any; liveStatus: string }>('/election/schedule'),
    setSchedule: (scheduleData: any) =>
      request<{ success: boolean; message: string; schedule: any }>('/election/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      }),
    updateStatus: (status: 'scheduled' | 'active' | 'ended') =>
      request<{ success: boolean; message: string; schedule: any }>('/election/schedule/status', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    deleteSchedule: () =>
      request<{ success: boolean; message: string }>('/election/schedule', {
        method: 'DELETE',
      }),
  },

  // Voting & Results
  votes: {
    castVote: (payload: { candidateId: string; electionType: 'assembly' | 'parliament'; userId?: string }) =>
      request<{ success: boolean; message: string; voter: any }>('/votes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getResults: (params?: { electionType?: string; state?: string; district?: string; constituency?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<{ success: boolean; results: any[] }>(`/votes/results${query ? `?${query}` : ''}`);
    },
    getStats: () =>
      request<{ success: boolean; stats: any }>('/votes/stats'),
  },
};
