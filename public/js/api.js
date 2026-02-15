async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  getBootstrap: () => request('/api/bootstrap'),
  getPeople: () => request('/api/people'),
  createPerson: (payload) => request('/api/people', { method: 'POST', body: JSON.stringify(payload) }),
  updatePerson: (id, payload) =>
    request(`/api/people/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePerson: (id) => request(`/api/people/${id}`, { method: 'DELETE' }),

  getChores: () => request('/api/chores'),
  createChore: (payload) => request('/api/chores', { method: 'POST', body: JSON.stringify(payload) }),
  updateChore: (id, payload) =>
    request(`/api/chores/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteChore: (id) => request(`/api/chores/${id}`, { method: 'DELETE' }),

  getWeekOwners: (start, weeks = 8) =>
    request(`/api/week-owners?start=${encodeURIComponent(start)}&weeks=${encodeURIComponent(weeks)}`),
  setWeekOwner: (payload) =>
    request('/api/week-owners', { method: 'POST', body: JSON.stringify(payload) }),
  deleteWeekOwner: (payload) =>
    request('/api/week-owners', { method: 'DELETE', body: JSON.stringify(payload) }),

  getPlan: (date, options = {}) =>
    request(
      `/api/plan?date=${date}${options.includeDisabled ? '&include_disabled=1' : ''}${
        options.includeBeforeStart ? '&include_prestart=1' : ''
      }`
    ),
  getMyPlan: (date, personId) => request(`/api/my-plan?date=${date}&person_id=${personId}`),

  getInstanceOverrides: ({ date = null, start = null, end = null } = {}) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    const query = params.toString();
    return request(`/api/instance-overrides${query ? `?${query}` : ''}`);
  },
  setInstanceOverride: (payload) =>
    request('/api/instance-overrides', { method: 'POST', body: JSON.stringify(payload) }),
  deleteInstanceOverride: (payload) =>
    request('/api/instance-overrides', { method: 'DELETE', body: JSON.stringify(payload) }),

  markDone: (payload) => request('/api/completions', { method: 'POST', body: JSON.stringify(payload) }),
  unmarkDone: (payload) => request('/api/completions', { method: 'DELETE', body: JSON.stringify(payload) }),

  getAlerts: (limit = 30) => request(`/api/alerts?limit=${limit}`),
  runAlertScan: () => request('/api/alerts/run', { method: 'POST', body: JSON.stringify({}) }),

  getSummary: (date) => request(`/api/summary?date=${date}`),
  getStats: ({ start = null, end = null, days = null } = {}) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    if (!start && !end && days) {
      params.set('days', String(days));
    }
    const query = params.toString();
    return request(`/api/stats${query ? `?${query}` : ''}`);
  },
  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) })
};

export function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
