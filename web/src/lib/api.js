export async function request(url, options = {}) {
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
  updatePerson: (id, payload) => request(`/api/people/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deletePerson: (id) => request(`/api/people/${id}`, { method: 'DELETE' }),

  getChores: () => request('/api/chores'),
  createChore: (payload) => request('/api/chores', { method: 'POST', body: JSON.stringify(payload) }),
  updateChore: (id, payload) => request(`/api/chores/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteChore: (id) => request(`/api/chores/${id}`, { method: 'DELETE' }),

  getWeekOwners: (start, weeks = 8) =>
    request(`/api/week-owners?start=${encodeURIComponent(start)}&weeks=${encodeURIComponent(weeks)}`),
  setWeekOwner: (payload) => request('/api/week-owners', { method: 'POST', body: JSON.stringify(payload) }),
  deleteWeekOwner: (payload) => request('/api/week-owners', { method: 'DELETE', body: JSON.stringify(payload) }),

  getPlan: (date, options = {}) =>
    request(
      `/api/plan?date=${date}${options.includeDisabled ? '&include_disabled=1' : ''}${
        options.includeBeforeStart ? '&include_prestart=1' : ''
      }`
    ),
  getMyPlan: (date, personId) => request(`/api/my-plan?date=${date}&person_id=${personId}`),

  setInstanceOverride: (payload) => request('/api/instance-overrides', { method: 'POST', body: JSON.stringify(payload) }),
  deleteInstanceOverride: (payload) => request('/api/instance-overrides', { method: 'DELETE', body: JSON.stringify(payload) }),

  markDone: (payload) => request('/api/completions', { method: 'POST', body: JSON.stringify(payload) }),
  unmarkDone: (payload) => request('/api/completions', { method: 'DELETE', body: JSON.stringify(payload) }),

  getAlerts: (limit = 30) => request(`/api/alerts?limit=${limit}`),
  getSummary: (date) => request(`/api/summary?date=${date}`),
  getStats: ({ start = null, end = null, days = null } = {}) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    if (!start && !end && days) params.set('days', String(days));
    const query = params.toString();
    return request(`/api/stats${query ? `?${query}` : ''}`);
  },
  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  testSettingsEmail: (payload) =>
    request('/api/settings/test-email', { method: 'POST', body: JSON.stringify(payload) }),
  testSettingsSms: (payload) =>
    request('/api/settings/test-sms', { method: 'POST', body: JSON.stringify(payload) })
};

export function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey, days) {
  const date = localDateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function startOfWeek(dateKey, weekStartsOn = 1) {
  const date = localDateFromKey(dateKey);
  const weekday = date.getDay();
  const shift = (weekday - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - shift);
  return toDateKey(date);
}

export function mondayToFridayDates(weekStart) {
  return [0, 1, 2, 3, 4].map((offset) => addDays(weekStart, offset));
}

export function weekNumberFromDateKey(dateKey) {
  const date = localDateFromKey(dateKey);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
}

export function formatWeekRange(startKey, locale = 'en-US') {
  const start = localDateFromKey(startKey);
  const end = localDateFromKey(addDays(startKey, 6));
  const startFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  const endFmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFmt.format(start)} - ${endFmt.format(end)}`;
}
