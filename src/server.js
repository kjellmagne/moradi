import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initDb,
  listPeople,
  createPerson,
  updatePerson,
  deletePerson,
  listChores,
  createChore,
  updateChore,
  deleteChore,
  getWeekOwnerView,
  upsertWeekOwner,
  deleteWeekOwner,
  startOfWeekKey,
  listChoreInstanceOverrides,
  upsertChoreInstanceOverride,
  deleteChoreInstanceOverride,
  getSettings,
  updateSettings,
  regenerateMobileAccessKey,
  getDailyPlan,
  markCompletion,
  unmarkCompletion,
  listAlerts,
  getSummary,
  toDateKey,
  createOverdueAlerts,
  addDaysToDateKey,
  getPerformanceStats
} from './db.js';
import { sendTestEmail, sendTestSms, startScheduler } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const appIndexPath = path.resolve(publicDir, 'app/index.html');

const app = express();
const port = process.env.PORT || 3000;

initDb();
startScheduler();

app.use(express.json());

function serveApp(req, res) {
  res.sendFile(appIndexPath);
}

function isMobileAccessKeyValid(accessKey) {
  const provided = String(accessKey || '').trim();
  if (!provided) {
    return false;
  }
  const expected = String(getSettings().mobile_access_key || '').trim();
  return Boolean(expected && provided === expected);
}

function mobileAccessKeyFromRequest(req) {
  const headerValue = req.get('x-mobile-access-key');
  if (headerValue && String(headerValue).trim()) {
    return String(headerValue).trim();
  }

  if (req.query?.key && String(req.query.key).trim()) {
    return String(req.query.key).trim();
  }

  if (req.body?.access_key && String(req.body.access_key).trim()) {
    return String(req.body.access_key).trim();
  }

  return '';
}

function requireMobileApiAccess(req, res) {
  const accessKey = mobileAccessKeyFromRequest(req);
  if (!isMobileAccessKeyValid(accessKey)) {
    res.status(403).json({ error: 'mobile access denied' });
    return false;
  }
  return true;
}

function serveMobileWithKey(req, res) {
  const key = String(req.params.accessKey || req.query.key || '').trim();
  if (!isMobileAccessKeyValid(key)) {
    return res.status(403).send('Mobile access denied');
  }
  return serveApp(req, res);
}

app.get('/', (req, res) => {
  res.redirect('/admin/overview');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/admin/overview');
});
app.get('/admin', (req, res) => {
  res.redirect('/admin/overview');
});
app.get('/admin.html', (req, res) => {
  res.redirect('/admin/overview');
});
app.get('/admin/overrides', (req, res) => {
  res.redirect('/admin/schedule');
});
app.get('/admin/:section', (req, res, next) => {
  const section = req.params.section;
  const allowed = new Set(['overview', 'team', 'chores', 'schedule', 'board', 'stats']);
  if (!allowed.has(section)) {
    return next();
  }

  return serveApp(req, res);
});
app.get('/employee/ipad', serveApp);
app.get('/employee/mobile/:accessKey', serveMobileWithKey);
app.get('/employee/mobile', (req, res) => {
  res.status(403).send('Mobile access key required');
});
app.get('/ipad', (req, res) => res.redirect('/employee/ipad'));
app.get('/mobile/:accessKey', (req, res) =>
  res.redirect(`/employee/mobile/${encodeURIComponent(String(req.params.accessKey || '').trim())}`)
);
app.get('/mobile', (req, res) => {
  res.status(403).send('Mobile access key required');
});

app.use(express.static(publicDir));

function asInt(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer`);
  }

  return parsed;
}

function asDateKey(value, fallback = toDateKey()) {
  if (!value) {
    return fallback;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('date must use YYYY-MM-DD format');
  }

  return value;
}

function asTimeOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error('due_time must use HH:MM format');
  }

  return value;
}

function asWeekdayMask(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const raw = Array.isArray(value) ? value : String(value).split(',');
  const weekdays = raw
    .map((part) => Number.parseInt(String(part).trim(), 10))
    .filter((item) => Number.isInteger(item));

  if (!weekdays.length) {
    return null;
  }

  for (const weekday of weekdays) {
    if (weekday < 0 || weekday > 6) {
      throw new Error('weekday_mask values must be between 0 and 6');
    }
  }

  const uniqueSorted = [...new Set(weekdays)].sort((a, b) => a - b);
  return uniqueSorted.join(',');
}

function asAlertDelivery(value, fallback = 'both') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'sms' || normalized === 'email' || normalized === 'both') {
    return normalized;
  }

  throw new Error('alert_delivery must be sms, email, or both');
}

function asBoolInt(value, name) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${name} is required`);
  }

  if (value === true || value === '1' || value === 1) {
    return 1;
  }

  if (value === false || value === '0' || value === 0) {
    return 0;
  }

  throw new Error(`${name} must be 0 or 1`);
}

function asNullableInt(value, name) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return asInt(value, name);
}

app.get('/api/settings', (req, res, next) => {
  try {
    res.json(getSettings());
  } catch (error) {
    next(error);
  }
});

app.get('/api/public/bootstrap', (req, res, next) => {
  try {
    if (!requireMobileApiAccess(req, res)) {
      return;
    }

    const settings = getSettings();
    const people = listPeople()
      .filter((person) => Number(person.active) === 1)
      .map((person) => ({
        id: person.id,
        name: person.name
      }));

    res.json({
      settings: {
        language: settings.language
      },
      people
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/public/week-owners', (req, res, next) => {
  try {
    if (!requireMobileApiAccess(req, res)) {
      return;
    }

    const start = req.query.start ? asDateKey(req.query.start) : startOfWeekKey(toDateKey());
    const weeks = req.query.weeks ? asInt(req.query.weeks, 'weeks') : 8;
    res.json(getWeekOwnerView({ start_week: start, weeks }));
  } catch (error) {
    next(error);
  }
});

app.get('/api/public/plan', (req, res, next) => {
  try {
    if (!requireMobileApiAccess(req, res)) {
      return;
    }

    const dateKey = asDateKey(req.query.date);
    const includeDisabled = req.query.include_disabled
      ? asBoolInt(req.query.include_disabled, 'include_disabled')
      : 0;
    const includePrestart = req.query.include_prestart
      ? asBoolInt(req.query.include_prestart, 'include_prestart')
      : 0;
    res.json(
      getDailyPlan(dateKey, {
        includeDisabled: includeDisabled === 1,
        includeBeforeStart: includePrestart === 1
      })
    );
  } catch (error) {
    next(error);
  }
});

app.post('/api/public/completions', (req, res, next) => {
  try {
    if (!requireMobileApiAccess(req, res)) {
      return;
    }

    const payload = {
      chore_id: asInt(req.body.chore_id, 'chore_id'),
      work_date: asDateKey(req.body.work_date),
      completed_by: asInt(req.body.completed_by, 'completed_by')
    };

    const completion = markCompletion(payload);
    res.status(201).json(completion);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/public/completions', (req, res, next) => {
  try {
    if (!requireMobileApiAccess(req, res)) {
      return;
    }

    const payload = {
      chore_id: asInt(req.body.chore_id, 'chore_id'),
      work_date: asDateKey(req.body.work_date)
    };

    unmarkCompletion(payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put('/api/settings', (req, res, next) => {
  try {
    const settings = updateSettings(req.body || {});
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

app.post('/api/settings/regenerate-mobile-access-key', (req, res, next) => {
  try {
    const settings = regenerateMobileAccessKey();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

function mergedSettingsForTest(settingsPatch = {}) {
  const base = getSettings();
  if (!settingsPatch || typeof settingsPatch !== 'object') {
    return base;
  }
  return {
    ...base,
    ...settingsPatch
  };
}

app.post('/api/settings/test-email', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const settings = mergedSettingsForTest(payload.settings);
    const to = String(payload.to || '').trim();
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || '').trim();
    const result = await sendTestEmail({ settings, to, subject, message });
    res.json({
      ok: true,
      message: `Test email sent to ${result.recipient}`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/settings/test-sms', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const settings = mergedSettingsForTest(payload.settings);
    const to = String(payload.to || '').trim();
    const message = String(payload.message || '').trim();
    const result = await sendTestSms({ settings, to, message });
    res.json({
      ok: true,
      message: `Test SMS sent to ${result.recipient}`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/people', (req, res, next) => {
  try {
    res.json(listPeople());
  } catch (error) {
    next(error);
  }
});

app.post('/api/people', (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const person = createPerson({
      name: String(name).trim(),
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null
    });

    return res.status(201).json(person);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/people/:id', (req, res, next) => {
  try {
    const id = asInt(req.params.id, 'id');
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const value = String(req.body.name || '').trim();
      if (!value) {
        return res.status(400).json({ error: 'name is required' });
      }
      payload.name = value;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      const value = String(req.body.email || '').trim();
      payload.email = value || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
      const value = String(req.body.phone || '').trim();
      payload.phone = value || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'active')) {
      payload.active = asBoolInt(req.body.active, 'active');
    }

    const person = updatePerson(id, payload);
    if (!person) {
      return res.status(404).json({ error: 'person not found' });
    }

    return res.json(person);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/people/:id', (req, res, next) => {
  try {
    const id = asInt(req.params.id, 'id');
    const result = deletePerson(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get('/api/chores', (req, res, next) => {
  try {
    res.json(listChores());
  } catch (error) {
    next(error);
  }
});

app.post('/api/chores', (req, res, next) => {
  try {
    const {
      name,
      description,
      interval_days,
      start_date,
      due_time,
      weekday_mask,
      alert_enabled,
      alert_delivery,
      active
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const chore = createChore({
      name: String(name).trim(),
      description: description ? String(description).trim() : '',
      interval_days: asInt(interval_days, 'interval_days'),
      start_date: asDateKey(start_date),
      due_time: asTimeOrNull(due_time),
      weekday_mask: asWeekdayMask(weekday_mask),
      alert_enabled: alert_enabled === undefined ? 1 : asBoolInt(alert_enabled, 'alert_enabled'),
      alert_delivery: asAlertDelivery(alert_delivery, 'both'),
      active: active === undefined ? 1 : active
    });

    return res.status(201).json(chore);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/chores/:id', (req, res, next) => {
  try {
    const id = asInt(req.params.id, 'id');
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      payload.name = String(req.body.name).trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      payload.description = String(req.body.description || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'interval_days')) {
      payload.interval_days = asInt(req.body.interval_days, 'interval_days');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'start_date')) {
      payload.start_date = asDateKey(req.body.start_date);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'due_time')) {
      payload.due_time = asTimeOrNull(req.body.due_time);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'weekday_mask')) {
      payload.weekday_mask = asWeekdayMask(req.body.weekday_mask);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'alert_enabled')) {
      payload.alert_enabled = asBoolInt(req.body.alert_enabled, 'alert_enabled');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'alert_delivery')) {
      payload.alert_delivery = asAlertDelivery(req.body.alert_delivery, 'both');
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'active')) {
      payload.active = req.body.active ? 1 : 0;
    }

    const chore = updateChore(id, payload);
    res.json(chore);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/chores/:id', (req, res, next) => {
  try {
    const id = asInt(req.params.id, 'id');
    deleteChore(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/week-owners', (req, res, next) => {
  try {
    const start = req.query.start ? asDateKey(req.query.start) : startOfWeekKey(toDateKey());
    const weeks = req.query.weeks ? asInt(req.query.weeks, 'weeks') : 8;
    res.json(getWeekOwnerView({ start_week: start, weeks }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/week-owners', (req, res, next) => {
  try {
    const payload = {
      week_start: asDateKey(req.body.week_start),
      person_id: asInt(req.body.person_id, 'person_id')
    };

    const row = upsertWeekOwner(payload);
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/week-owners', (req, res, next) => {
  try {
    const payload = {
      week_start: asDateKey(req.body.week_start)
    };

    deleteWeekOwner(payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/instance-overrides', (req, res, next) => {
  try {
    const dateKey = req.query.date ? asDateKey(req.query.date) : null;
    const startDate = req.query.start ? asDateKey(req.query.start) : null;
    const endDate = req.query.end ? asDateKey(req.query.end) : null;

    res.json(listChoreInstanceOverrides({ dateKey, startDate, endDate }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/instance-overrides', (req, res, next) => {
  try {
    const deadlineModeRaw = req.body.deadline_mode;
    const deadlineMode =
      deadlineModeRaw === undefined || deadlineModeRaw === null || deadlineModeRaw === ''
        ? null
        : asInt(deadlineModeRaw, 'deadline_mode');

    if (deadlineMode !== null && deadlineMode !== 0 && deadlineMode !== 1) {
      return res.status(400).json({ error: 'deadline_mode must be 0, 1, or null' });
    }

    const payload = {
      chore_id: asInt(req.body.chore_id, 'chore_id'),
      work_date: asDateKey(req.body.work_date),
      name:
        req.body.name === undefined || req.body.name === null
          ? null
          : String(req.body.name).trim() || null,
      description:
        req.body.description === undefined || req.body.description === null
          ? null
          : String(req.body.description).trim() || null,
      deadline_mode: deadlineMode,
      due_time: deadlineMode === 1 ? asTimeOrNull(req.body.due_time) : null,
      alert_enabled:
        deadlineMode === 1 && Object.prototype.hasOwnProperty.call(req.body, 'alert_enabled')
          ? asBoolInt(req.body.alert_enabled, 'alert_enabled')
          : null,
      person_id: asNullableInt(req.body.person_id, 'person_id'),
      disabled: Object.prototype.hasOwnProperty.call(req.body, 'disabled')
        ? asBoolInt(req.body.disabled, 'disabled')
        : 0
    };

    if (deadlineMode === 1 && !payload.due_time) {
      return res.status(400).json({ error: 'due_time is required when deadline_mode is 1' });
    }

    const override = upsertChoreInstanceOverride(payload);
    return res.status(201).json(override);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/instance-overrides', (req, res, next) => {
  try {
    const chore_id = asInt(req.body.chore_id, 'chore_id');
    const work_date = asDateKey(req.body.work_date);
    deleteChoreInstanceOverride({ chore_id, work_date });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/plan', (req, res, next) => {
  try {
    const dateKey = asDateKey(req.query.date);
    const includeDisabled = req.query.include_disabled
      ? asBoolInt(req.query.include_disabled, 'include_disabled')
      : 0;
    const includePrestart = req.query.include_prestart
      ? asBoolInt(req.query.include_prestart, 'include_prestart')
      : 0;
    res.json(
      getDailyPlan(dateKey, {
        includeDisabled: includeDisabled === 1,
        includeBeforeStart: includePrestart === 1
      })
    );
  } catch (error) {
    next(error);
  }
});

app.get('/api/my-plan', (req, res, next) => {
  try {
    const dateKey = asDateKey(req.query.date);
    const personId = asInt(req.query.person_id, 'person_id');
    const plan = getDailyPlan(dateKey).filter(
      (item) => item.responsible_person && item.responsible_person.id === personId
    );

    res.json(plan);
  } catch (error) {
    next(error);
  }
});

app.post('/api/completions', (req, res, next) => {
  try {
    const payload = {
      chore_id: asInt(req.body.chore_id, 'chore_id'),
      work_date: asDateKey(req.body.work_date),
      completed_by: asInt(req.body.completed_by, 'completed_by')
    };

    const completion = markCompletion(payload);
    res.status(201).json(completion);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/completions', (req, res, next) => {
  try {
    const payload = {
      chore_id: asInt(req.body.chore_id, 'chore_id'),
      work_date: asDateKey(req.body.work_date)
    };

    unmarkCompletion(payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/alerts', (req, res, next) => {
  try {
    const dateKey = req.query.date ? asDateKey(req.query.date) : null;
    const limit = req.query.limit ? asInt(req.query.limit, 'limit') : 100;
    res.json(listAlerts({ dateKey, limit }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/alerts/run', (req, res, next) => {
  try {
    const settings = getSettings();
    const createdAlerts = createOverdueAlerts({ lookbackDays: 0, language: settings.language });
    res.status(201).json({ ok: true, created: createdAlerts.length });
  } catch (error) {
    next(error);
  }
});

app.get('/api/summary', (req, res, next) => {
  try {
    const dateKey = asDateKey(req.query.date);
    res.json(getSummary(dateKey));
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats', (req, res, next) => {
  try {
    const today = toDateKey();
    const settings = getSettings();
    let startDate = null;
    let endDate = null;

    if (req.query.start || req.query.end) {
      startDate = req.query.start ? asDateKey(req.query.start) : req.query.end ? asDateKey(req.query.end) : today;
      endDate = req.query.end ? asDateKey(req.query.end) : today;
    } else {
      const daysRaw = req.query.days ? asInt(req.query.days, 'days') : 30;
      const days = Math.min(Math.max(daysRaw, 1), 365);
      endDate = today;
      startDate = addDaysToDateKey(endDate, -(days - 1));
    }

    if (startDate > endDate) {
      return res.status(400).json({ error: 'start must be before or equal to end' });
    }

    res.json(
      getPerformanceStats({
        start_date: startDate,
        end_date: endDate,
        gamification_mode: settings.gamification_mode
      })
    );
  } catch (error) {
    next(error);
  }
});

app.get('/api/bootstrap', (req, res, next) => {
  try {
    const today = toDateKey();
    const currentWeekStart = startOfWeekKey(today);
    res.json({
      date: today,
      people: listPeople(),
      chores: listChores(),
      weekOwners: getWeekOwnerView({ start_week: currentWeekStart, weeks: 8 }),
      alerts: listAlerts({ limit: 30 })
    });
  } catch (error) {
    next(error);
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

app.use((error, req, res, next) => {
  const status = error.message?.includes('UNIQUE constraint') ? 409 : 400;
  res.status(status).json({ error: error.message || 'unknown error' });
});

app.listen(port, () => {
  console.log(`Office chores app is running on http://localhost:${port}`);
});
