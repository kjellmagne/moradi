import Database from 'better-sqlite3';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.resolve(dataDir, 'chores.db');

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const VALID_LANGUAGES = new Set(['en', 'no']);
const VALID_GAMIFICATION_MODES = new Set(['friendly', 'hardcore']);
const VALID_DEADLINE_ALERT_DELIVERY = new Set(['sms', 'email', 'both']);
const DEFAULT_SETTINGS = Object.freeze({
  language: 'en',
  gamification_mode: 'friendly',
  deadline_alerts_enabled: 1,
  deadline_alert_delivery: 'both',
  weekly_owner_alert_enabled: 1,
  mobile_access_key: '',
  alert_webhook_url: '',
  sms_gateway_url: '',
  sms_gateway_username: '',
  sms_gateway_password: '',
  sms_gateway_message_type: 'sms.automatic',
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: 0,
  smtp_user: '',
  smtp_pass: '',
  smtp_from: ''
});

function pad(value) {
  return String(value).padStart(2, '0');
}

export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

function localDateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function addDaysToDateKey(dateKey, days) {
  const date = localDateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function startOfWeekKey(dateKey = toDateKey(), weekStartsOn = 1) {
  const date = localDateFromKey(dateKey);
  const weekday = date.getDay();
  const shift = (weekday - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - shift);
  return toDateKey(date);
}

function weekNumberFromDateKey(dateKey) {
  const date = localDateFromKey(dateKey);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
}

function dateRangeKeys(startDate, endDate) {
  const keys = [];
  let current = startDate;
  while (current <= endDate) {
    keys.push(current);
    current = addDaysToDateKey(current, 1);
  }
  return keys;
}

function toRate(part, total) {
  if (!total) {
    return null;
  }

  return Math.round((part / total) * 1000) / 10;
}

function daysBetween(startKey, endKey) {
  const start = localDateFromKey(startKey);
  const end = localDateFromKey(endKey);
  const millis = end.getTime() - start.getTime();
  return Math.floor(millis / (1000 * 60 * 60 * 24));
}

function combineDateAndTime(dateKey, timeHHmm) {
  const [hours, minutes] = timeHHmm.split(':').map(Number);
  const date = localDateFromKey(dateKey);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function weekdayFromDateKey(dateKey) {
  return localDateFromKey(dateKey).getDay();
}

function parseWeekdayMask(weekdayMask) {
  if (!weekdayMask) {
    return [];
  }

  return String(weekdayMask)
    .split(',')
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);
}

function isChoreDueOnDate(chore, dateKey, { includeBeforeStart = false } = {}) {
  if (!chore.active) {
    return false;
  }

  const diff = daysBetween(chore.start_date, dateKey);
  if (diff < 0 && !includeBeforeStart) {
    return false;
  }

  const weekdayMask = parseWeekdayMask(chore.weekday_mask);
  if (weekdayMask.length > 0) {
    const weekday = weekdayFromDateKey(dateKey);
    return weekdayMask.includes(weekday);
  }

  return diff % chore.interval_days === 0;
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      email TEXT,
      phone TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS chores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      interval_days INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL,
      due_time TEXT,
      weekday_mask TEXT,
      alert_enabled INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      CHECK(interval_days > 0)
    );

    CREATE TABLE IF NOT EXISTS week_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL UNIQUE,
      person_id INTEGER NOT NULL,
      FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS day_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      person_id INTEGER NOT NULL,
      UNIQUE(chore_id, work_date),
      FOREIGN KEY(chore_id) REFERENCES chores(id) ON DELETE CASCADE,
      FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chore_instance_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      name TEXT,
      description TEXT,
      deadline_mode INTEGER,
      due_time TEXT,
      alert_enabled INTEGER,
      person_id INTEGER,
      disabled INTEGER NOT NULL DEFAULT 0,
      UNIQUE(chore_id, work_date),
      FOREIGN KEY(chore_id) REFERENCES chores(id) ON DELETE CASCADE,
      FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE SET NULL,
      CHECK(deadline_mode IN (0, 1) OR deadline_mode IS NULL),
      CHECK(alert_enabled IN (0, 1) OR alert_enabled IS NULL),
      CHECK(disabled IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      completed_by INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(chore_id, work_date),
      FOREIGN KEY(chore_id) REFERENCES chores(id) ON DELETE CASCADE,
      FOREIGN KEY(completed_by) REFERENCES people(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chore_id INTEGER NOT NULL,
      work_date TEXT NOT NULL,
      person_id INTEGER,
      alert_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(chore_id, work_date, alert_type),
      FOREIGN KEY(chore_id) REFERENCES chores(id) ON DELETE CASCADE,
      FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS weekly_owner_notifications (
      week_start TEXT PRIMARY KEY,
      person_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
    );
  `);

  ensureSchemaMigrations();
  seedDefaultSettingsIfNeeded();
  ensureMobileAccessKey();
  seedIfNeeded();
}

function ensureSchemaMigrations() {
  const choreColumns = db.prepare('PRAGMA table_info(chores)').all().map((item) => item.name);
  if (!choreColumns.includes('weekday_mask')) {
    db.exec('ALTER TABLE chores ADD COLUMN weekday_mask TEXT');
  }
  if (!choreColumns.includes('alert_enabled')) {
    db.exec('ALTER TABLE chores ADD COLUMN alert_enabled INTEGER NOT NULL DEFAULT 1');
  }
  if (!choreColumns.includes('alert_delivery')) {
    db.exec("ALTER TABLE chores ADD COLUMN alert_delivery TEXT NOT NULL DEFAULT 'both'");
  }
  db.exec("UPDATE chores SET alert_delivery = 'both' WHERE alert_delivery IS NULL OR trim(alert_delivery) = ''");
  db.exec('DROP TABLE IF EXISTS weekly_assignments');
}

function normalizeLanguage(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_LANGUAGES.has(normalized) ? normalized : DEFAULT_SETTINGS.language;
}

function normalizeGamificationMode(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_GAMIFICATION_MODES.has(normalized) ? normalized : DEFAULT_SETTINGS.gamification_mode;
}

function normalizeDeadlineAlertDelivery(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_DEADLINE_ALERT_DELIVERY.has(normalized)
    ? normalized
    : DEFAULT_SETTINGS.deadline_alert_delivery;
}

function normalizeChoreAlertDelivery(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_DEADLINE_ALERT_DELIVERY.has(normalized) ? normalized : 'both';
}

function normalizeBoolInt(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback ? 1 : 0;
  }

  if (value === true || value === 1 || value === '1') {
    return 1;
  }

  if (value === false || value === 0 || value === '0') {
    return 0;
  }

  return fallback ? 1 : 0;
}

function normalizePort(value, fallback = 587) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

function normalizeString(value) {
  return String(value || '').trim();
}

function generateMobileAccessKey() {
  return randomBytes(16).toString('hex');
}

function ensureMobileAccessKey() {
  const row = db
    .prepare("SELECT value FROM app_settings WHERE key = 'mobile_access_key'")
    .get();
  const existing = normalizeString(row?.value);
  if (existing) {
    return existing;
  }

  const next = generateMobileAccessKey();
  db.prepare(
    `INSERT INTO app_settings (key, value)
     VALUES ('mobile_access_key', ?)
     ON CONFLICT(key)
     DO UPDATE SET value = excluded.value`
  ).run(next);
  return next;
}

function rawSettingsMap() {
  const rows = db.prepare('SELECT key, value FROM app_settings').all();
  return new Map(rows.map((row) => [row.key, row.value]));
}

function settingsFromMap(map) {
  return {
    language: normalizeLanguage(map.get('language') || DEFAULT_SETTINGS.language),
    gamification_mode: normalizeGamificationMode(map.get('gamification_mode') || DEFAULT_SETTINGS.gamification_mode),
    deadline_alerts_enabled: normalizeBoolInt(
      map.get('deadline_alerts_enabled'),
      DEFAULT_SETTINGS.deadline_alerts_enabled
    ),
    deadline_alert_delivery: normalizeDeadlineAlertDelivery(
      map.get('deadline_alert_delivery') || DEFAULT_SETTINGS.deadline_alert_delivery
    ),
    weekly_owner_alert_enabled: normalizeBoolInt(
      map.get('weekly_owner_alert_enabled'),
      DEFAULT_SETTINGS.weekly_owner_alert_enabled
    ),
    mobile_access_key: normalizeString(map.get('mobile_access_key') || DEFAULT_SETTINGS.mobile_access_key),
    alert_webhook_url: normalizeString(map.get('alert_webhook_url') || DEFAULT_SETTINGS.alert_webhook_url),
    sms_gateway_url: normalizeString(map.get('sms_gateway_url') || DEFAULT_SETTINGS.sms_gateway_url),
    sms_gateway_username: normalizeString(
      map.get('sms_gateway_username') || DEFAULT_SETTINGS.sms_gateway_username
    ),
    sms_gateway_password: normalizeString(
      map.get('sms_gateway_password') || DEFAULT_SETTINGS.sms_gateway_password
    ),
    sms_gateway_message_type: normalizeString(
      map.get('sms_gateway_message_type') || DEFAULT_SETTINGS.sms_gateway_message_type
    ),
    smtp_host: normalizeString(map.get('smtp_host') || DEFAULT_SETTINGS.smtp_host),
    smtp_port: normalizePort(map.get('smtp_port'), DEFAULT_SETTINGS.smtp_port),
    smtp_secure: normalizeBoolInt(map.get('smtp_secure'), DEFAULT_SETTINGS.smtp_secure),
    smtp_user: normalizeString(map.get('smtp_user') || DEFAULT_SETTINGS.smtp_user),
    smtp_pass: normalizeString(map.get('smtp_pass') || DEFAULT_SETTINGS.smtp_pass),
    smtp_from: normalizeString(map.get('smtp_from') || DEFAULT_SETTINGS.smtp_from)
  };
}

export function getSettings() {
  return settingsFromMap(rawSettingsMap());
}

export function updateSettings(patch = {}) {
  const current = getSettings();
  const next = {
    ...current,
    language: normalizeLanguage(Object.prototype.hasOwnProperty.call(patch, 'language') ? patch.language : current.language),
    gamification_mode: Object.prototype.hasOwnProperty.call(patch, 'gamification_mode')
      ? normalizeGamificationMode(patch.gamification_mode)
      : current.gamification_mode,
    deadline_alerts_enabled: Object.prototype.hasOwnProperty.call(patch, 'deadline_alerts_enabled')
      ? normalizeBoolInt(patch.deadline_alerts_enabled, current.deadline_alerts_enabled)
      : current.deadline_alerts_enabled,
    deadline_alert_delivery: Object.prototype.hasOwnProperty.call(patch, 'deadline_alert_delivery')
      ? normalizeDeadlineAlertDelivery(patch.deadline_alert_delivery)
      : current.deadline_alert_delivery,
    weekly_owner_alert_enabled: Object.prototype.hasOwnProperty.call(patch, 'weekly_owner_alert_enabled')
      ? normalizeBoolInt(patch.weekly_owner_alert_enabled, current.weekly_owner_alert_enabled)
      : current.weekly_owner_alert_enabled,
    mobile_access_key: Object.prototype.hasOwnProperty.call(patch, 'mobile_access_key')
      ? normalizeString(patch.mobile_access_key) || current.mobile_access_key
      : current.mobile_access_key,
    alert_webhook_url: Object.prototype.hasOwnProperty.call(patch, 'alert_webhook_url')
      ? normalizeString(patch.alert_webhook_url)
      : current.alert_webhook_url,
    sms_gateway_url: Object.prototype.hasOwnProperty.call(patch, 'sms_gateway_url')
      ? normalizeString(patch.sms_gateway_url)
      : current.sms_gateway_url,
    sms_gateway_username: Object.prototype.hasOwnProperty.call(patch, 'sms_gateway_username')
      ? normalizeString(patch.sms_gateway_username)
      : current.sms_gateway_username,
    sms_gateway_password: Object.prototype.hasOwnProperty.call(patch, 'sms_gateway_password')
      ? normalizeString(patch.sms_gateway_password)
      : current.sms_gateway_password,
    sms_gateway_message_type: Object.prototype.hasOwnProperty.call(patch, 'sms_gateway_message_type')
      ? normalizeString(patch.sms_gateway_message_type)
      : current.sms_gateway_message_type,
    smtp_host: Object.prototype.hasOwnProperty.call(patch, 'smtp_host')
      ? normalizeString(patch.smtp_host)
      : current.smtp_host,
    smtp_port: Object.prototype.hasOwnProperty.call(patch, 'smtp_port')
      ? normalizePort(patch.smtp_port, current.smtp_port)
      : current.smtp_port,
    smtp_secure: Object.prototype.hasOwnProperty.call(patch, 'smtp_secure')
      ? normalizeBoolInt(patch.smtp_secure, current.smtp_secure)
      : current.smtp_secure,
    smtp_user: Object.prototype.hasOwnProperty.call(patch, 'smtp_user')
      ? normalizeString(patch.smtp_user)
      : current.smtp_user,
    smtp_pass: Object.prototype.hasOwnProperty.call(patch, 'smtp_pass')
      ? normalizeString(patch.smtp_pass)
      : current.smtp_pass,
    smtp_from: Object.prototype.hasOwnProperty.call(patch, 'smtp_from')
      ? normalizeString(patch.smtp_from)
      : current.smtp_from
  };

  const upsert = db.prepare(
    `INSERT INTO app_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key)
     DO UPDATE SET value = excluded.value`
  );

  const write = db.transaction(() => {
    Object.entries(next).forEach(([key, value]) => {
      upsert.run(key, String(value ?? ''));
    });
  });
  write();

  return getSettings();
}

function seedDefaultSettingsIfNeeded() {
  const hasRows = db.prepare('SELECT COUNT(*) AS count FROM app_settings').get().count;
  if (hasRows > 0) {
    return;
  }
  updateSettings(DEFAULT_SETTINGS);
}

export function regenerateMobileAccessKey() {
  const next = generateMobileAccessKey();
  db.prepare(
    `INSERT INTO app_settings (key, value)
     VALUES ('mobile_access_key', ?)
     ON CONFLICT(key)
     DO UPDATE SET value = excluded.value`
  ).run(next);

  return getSettings();
}

export function getWeekOwnerForWeekStart(week_start) {
  const normalizedWeekStart = startOfWeekKey(week_start);
  return db
    .prepare(
      `SELECT wo.week_start, p.id, p.name, p.email, p.phone
       FROM week_owners wo
       JOIN people p ON p.id = wo.person_id
       WHERE wo.week_start = ?`
    )
    .get(normalizedWeekStart);
}

export function markWeekOwnerNotificationSent({ week_start, person_id, message }) {
  const normalizedWeekStart = startOfWeekKey(week_start);
  const result = db
    .prepare(
      `INSERT OR IGNORE INTO weekly_owner_notifications (week_start, person_id, message, sent_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(normalizedWeekStart, person_id, message, new Date().toISOString());

  return result.changes > 0;
}

function seedIfNeeded() {
  const peopleCount = db.prepare('SELECT COUNT(*) AS count FROM people').get().count;
  const choreCount = db.prepare('SELECT COUNT(*) AS count FROM chores').get().count;

  if (peopleCount > 0 || choreCount > 0) {
    return;
  }

  const insertPerson = db.prepare(
    'INSERT INTO people (name, email, phone, active) VALUES (?, ?, ?, 1)'
  );

  const alice = insertPerson.run('Alice Jensen', 'alice@office.local', '+47 900 10 100').lastInsertRowid;
  const martin = insertPerson.run('Martin Solberg', 'martin@office.local', '+47 900 10 101').lastInsertRowid;
  insertPerson.run('Priya Sharma', 'priya@office.local', '+47 900 10 102');
  insertPerson.run('Emil Nilsen', 'emil@office.local', '+47 900 10 103');

  const insertChore = db.prepare(
    `INSERT INTO chores (name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, active)
     VALUES (?, ?, ?, ?, ?, NULL, 1, 1)`
  );

  const today = toDateKey();
  insertChore.run(
    'Tidy Lunchroom',
    'Wipe tables, align chairs, and clean counters in lunchroom',
    1,
    today,
    '14:00'
  );
  insertChore.run('Dishwasher Cycle', 'Load at noon and empty after cycle', 1, today, '15:30');
  insertChore.run('Take Out Rubbish', 'Collect and dispose rubbish bags', 1, today, '16:00');
  insertChore.run('Clean Coffee Station', 'Refill, wipe down, and reset coffee area', 2, today, '13:00');
  insertChore.run('Check Fridge', 'Remove expired food and wipe shelves', 7, today, '12:00');

  const insertWeekOwner = db.prepare(
    `INSERT INTO week_owners (week_start, person_id)
     VALUES (?, ?)
     ON CONFLICT(week_start)
     DO UPDATE SET person_id = excluded.person_id`
  );
  const currentWeek = startOfWeekKey(today);
  insertWeekOwner.run(currentWeek, alice);
  insertWeekOwner.run(addDaysToDateKey(currentWeek, 7), martin);
}

export function listPeople({ includeInactive = false } = {}) {
  const selectSql = `
    SELECT
      p.id,
      p.name,
      p.email,
      p.phone,
      p.active,
      (
        EXISTS(SELECT 1 FROM completions c WHERE c.completed_by = p.id) OR
        EXISTS(SELECT 1 FROM alerts a WHERE a.person_id = p.id)
      ) AS has_history
    FROM people p
  `;

  if (includeInactive) {
    return db.prepare(`${selectSql} ORDER BY p.name`).all();
  }

  return db
    .prepare(`${selectSql} WHERE p.active = 1 ORDER BY p.name`)
    .all();
}

export function createPerson({ name, email = null, phone = null }) {
  const result = db
    .prepare('INSERT INTO people (name, email, phone, active) VALUES (?, ?, ?, 1)')
    .run(name, email, phone);

  return db
    .prepare('SELECT id, name, email, phone, active FROM people WHERE id = ?')
    .get(result.lastInsertRowid);
}

export function updatePerson(id, payload) {
  const updates = [];
  const values = [];

  const allowed = ['name', 'email', 'phone', 'active'];
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) {
      continue;
    }

    updates.push(`${key} = ?`);
    if (key === 'active') {
      values.push(payload[key] ? 1 : 0);
    } else {
      values.push(payload[key]);
    }
  }

  if (!updates.length) {
    return db.prepare('SELECT id, name, email, phone, active FROM people WHERE id = ?').get(id);
  }

  values.push(id);
  db.prepare(`UPDATE people SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return db.prepare('SELECT id, name, email, phone, active FROM people WHERE id = ?').get(id);
}

export function deletePerson(id) {
  const person = db.prepare('SELECT id, active FROM people WHERE id = ?').get(id);
  if (!person) {
    throw new Error('person not found');
  }

  const today = toDateKey();
  const currentWeek = startOfWeekKey(today);
  const completionCount =
    db.prepare('SELECT COUNT(*) AS count FROM completions WHERE completed_by = ?').get(id).count || 0;
  const alertCount =
    db.prepare('SELECT COUNT(*) AS count FROM alerts WHERE person_id = ?').get(id).count || 0;
  const pastOverrideCount =
    db
      .prepare('SELECT COUNT(*) AS count FROM day_overrides WHERE person_id = ? AND work_date < ?')
      .get(id, today).count || 0;
  const pastWeekOwnerCount =
    db
      .prepare('SELECT COUNT(*) AS count FROM week_owners WHERE person_id = ? AND week_start < ?')
      .get(id, currentWeek).count || 0;
  const historyRefs = completionCount + alertCount + pastOverrideCount + pastWeekOwnerCount;

  if (historyRefs > 0) {
    const action = db.transaction(() => {
      const weekOwners = db
        .prepare('DELETE FROM week_owners WHERE person_id = ? AND week_start >= ?')
        .run(id, currentWeek).changes;
      const dayOverrides = db
        .prepare('DELETE FROM day_overrides WHERE person_id = ? AND work_date >= ?')
        .run(id, today).changes;
      db.prepare('UPDATE people SET active = 0 WHERE id = ?').run(id);

      return { weekOwners, dayOverrides };
    });

    const removedFromSchedule = action();
    return {
      mode: 'disabled',
      history_refs: historyRefs,
      removed_from_schedule: removedFromSchedule
    };
  }

  const result = db.prepare('DELETE FROM people WHERE id = ?').run(id);
  if (!result.changes) {
    throw new Error('person not found');
  }

  return { mode: 'deleted', history_refs: 0 };
}

export function listChores() {
  return db
    .prepare(
      `SELECT id, name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, alert_delivery, active
       FROM chores
       ORDER BY name`
    )
    .all();
}

export function createChore({
  name,
  description = '',
  interval_days,
  start_date,
  due_time = null,
  weekday_mask = null,
  alert_enabled = 1,
  alert_delivery = 'both',
  active = 1
}) {
  const normalizedAlertDelivery = normalizeChoreAlertDelivery(alert_delivery);
  const result = db
    .prepare(
      `INSERT INTO chores (name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, alert_delivery, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      description,
      interval_days,
      start_date,
      due_time,
      weekday_mask,
      alert_enabled ? 1 : 0,
      normalizedAlertDelivery,
      active ? 1 : 0
    );

  return db
    .prepare(
      `SELECT id, name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, alert_delivery, active
       FROM chores
       WHERE id = ?`
    )
    .get(result.lastInsertRowid);
}

export function updateChore(id, payload) {
  const updates = [];
  const values = [];

  const allowed = [
    'name',
    'description',
    'interval_days',
    'start_date',
    'due_time',
    'weekday_mask',
    'alert_enabled',
    'alert_delivery',
    'active'
  ];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      updates.push(`${key} = ?`);
      if (key === 'active' || key === 'alert_enabled') {
        values.push(payload[key] ? 1 : 0);
      } else if (key === 'alert_delivery') {
        values.push(normalizeChoreAlertDelivery(payload[key]));
      } else {
        values.push(payload[key]);
      }
    }
  }

  if (!updates.length) {
    return db
      .prepare(
        `SELECT id, name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, alert_delivery, active
         FROM chores
         WHERE id = ?`
      )
      .get(id);
  }

  values.push(id);

  db.prepare(`UPDATE chores SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return db
    .prepare(
      `SELECT id, name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, alert_delivery, active
       FROM chores
       WHERE id = ?`
    )
    .get(id);
}

export function deleteChore(id) {
  return db.prepare('DELETE FROM chores WHERE id = ?').run(id);
}

export function getWeekOwnerView({ start_week = startOfWeekKey(), weeks = 8 } = {}) {
  const weekCount = Math.min(Math.max(Number(weeks) || 8, 1), 52);
  const rangeStart = startOfWeekKey(start_week);
  const rangeEnd = addDaysToDateKey(rangeStart, (weekCount - 1) * 7);

  const assignedRows = db
    .prepare(
      `SELECT wo.week_start, wo.person_id, p.name AS person_name
       FROM week_owners wo
       JOIN people p ON p.id = wo.person_id
       WHERE wo.week_start >= ? AND wo.week_start <= ?
       ORDER BY wo.week_start`
    )
    .all(rangeStart, rangeEnd);

  const byWeek = new Map(assignedRows.map((item) => [item.week_start, item]));
  const result = [];

  for (let i = 0; i < weekCount; i += 1) {
    const weekStart = addDaysToDateKey(rangeStart, i * 7);
    const assigned = byWeek.get(weekStart);

    if (assigned) {
      result.push(assigned);
      continue;
    }

    result.push({
      week_start: weekStart,
      person_id: null,
      person_name: null
    });
  }

  return result;
}

export function upsertWeekOwner({ week_start, person_id }) {
  const normalizedWeekStart = startOfWeekKey(week_start);

  db.prepare(
    `INSERT INTO week_owners (week_start, person_id)
     VALUES (?, ?)
     ON CONFLICT(week_start)
     DO UPDATE SET person_id = excluded.person_id`
  ).run(normalizedWeekStart, person_id);

  return db
    .prepare(
      `SELECT wo.week_start, wo.person_id, p.name AS person_name
       FROM week_owners wo
       JOIN people p ON p.id = wo.person_id
       WHERE wo.week_start = ?`
    )
    .get(normalizedWeekStart);
}

export function deleteWeekOwner({ week_start }) {
  const normalizedWeekStart = startOfWeekKey(week_start);
  return db.prepare('DELETE FROM week_owners WHERE week_start = ?').run(normalizedWeekStart);
}

function getWeekOwnerForDate(dateKey) {
  const normalizedWeekStart = startOfWeekKey(dateKey);

  return db
    .prepare(
      `SELECT p.id, p.name, p.email, p.phone
       FROM week_owners wo
       JOIN people p ON p.id = wo.person_id
       WHERE wo.week_start = ?`
    )
    .get(normalizedWeekStart);
}

export function listChoreInstanceOverrides({ dateKey = null, startDate = null, endDate = null } = {}) {
  if (dateKey) {
    return db
      .prepare(
        `SELECT cio.id, cio.chore_id, cio.work_date, cio.name, cio.description, cio.deadline_mode, cio.due_time,
                cio.alert_enabled, cio.person_id, cio.disabled, p.name AS person_name
         FROM chore_instance_overrides cio
         LEFT JOIN people p ON p.id = cio.person_id
         WHERE cio.work_date = ?
         ORDER BY cio.chore_id`
      )
      .all(dateKey);
  }

  if (startDate && endDate) {
    return db
      .prepare(
        `SELECT cio.id, cio.chore_id, cio.work_date, cio.name, cio.description, cio.deadline_mode, cio.due_time,
                cio.alert_enabled, cio.person_id, cio.disabled, p.name AS person_name
         FROM chore_instance_overrides cio
         LEFT JOIN people p ON p.id = cio.person_id
         WHERE cio.work_date BETWEEN ? AND ?
         ORDER BY cio.work_date, cio.chore_id`
      )
      .all(startDate, endDate);
  }

  return db
    .prepare(
      `SELECT cio.id, cio.chore_id, cio.work_date, cio.name, cio.description, cio.deadline_mode, cio.due_time,
              cio.alert_enabled, cio.person_id, cio.disabled, p.name AS person_name
       FROM chore_instance_overrides cio
       LEFT JOIN people p ON p.id = cio.person_id
       ORDER BY cio.work_date DESC, cio.chore_id`
    )
    .all();
}

export function getChoreInstanceOverride({ chore_id, work_date }) {
  return db
    .prepare(
      `SELECT cio.id, cio.chore_id, cio.work_date, cio.name, cio.description, cio.deadline_mode, cio.due_time,
              cio.alert_enabled, cio.person_id, cio.disabled, p.name AS person_name
       FROM chore_instance_overrides cio
       LEFT JOIN people p ON p.id = cio.person_id
       WHERE cio.chore_id = ? AND cio.work_date = ?`
    )
    .get(chore_id, work_date);
}

export function upsertChoreInstanceOverride({
  chore_id,
  work_date,
  name = null,
  description = null,
  deadline_mode = null,
  due_time = null,
  alert_enabled = null,
  person_id = null,
  disabled = 0
}) {
  const normalizedName = typeof name === 'string' && name.trim() ? name.trim() : null;
  const normalizedDescription = typeof description === 'string' && description.trim() ? description.trim() : null;
  const normalizedDeadlineMode =
    deadline_mode === null || deadline_mode === undefined || deadline_mode === ''
      ? null
      : Number.parseInt(deadline_mode, 10);
  const normalizedDueTime = normalizedDeadlineMode === 1 ? due_time || null : null;
  const normalizedAlertEnabled =
    normalizedDeadlineMode === 1 && (alert_enabled === 0 || alert_enabled === 1)
      ? alert_enabled
      : normalizedDeadlineMode === 1 && (alert_enabled === '0' || alert_enabled === '1')
        ? Number.parseInt(alert_enabled, 10)
        : null;
  const normalizedPersonId =
    person_id === null || person_id === undefined || person_id === '' ? null : Number.parseInt(person_id, 10);
  const normalizedDisabled = disabled ? 1 : 0;

  const hasAnyOverride =
    normalizedDisabled === 1 ||
    normalizedName !== null ||
    normalizedDescription !== null ||
    normalizedDeadlineMode !== null ||
    normalizedAlertEnabled !== null ||
    normalizedPersonId !== null;

  if (!hasAnyOverride) {
    db.prepare('DELETE FROM chore_instance_overrides WHERE chore_id = ? AND work_date = ?').run(chore_id, work_date);
    return null;
  }

  db.prepare(
    `INSERT INTO chore_instance_overrides
      (chore_id, work_date, name, description, deadline_mode, due_time, alert_enabled, person_id, disabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(chore_id, work_date)
     DO UPDATE SET
       name = excluded.name,
       description = excluded.description,
       deadline_mode = excluded.deadline_mode,
       due_time = excluded.due_time,
       alert_enabled = excluded.alert_enabled,
       person_id = excluded.person_id,
       disabled = excluded.disabled`
  ).run(
    chore_id,
    work_date,
    normalizedName,
    normalizedDescription,
    normalizedDeadlineMode,
    normalizedDueTime,
    normalizedAlertEnabled,
    normalizedPersonId,
    normalizedDisabled
  );

  return getChoreInstanceOverride({ chore_id, work_date });
}

export function deleteChoreInstanceOverride({ chore_id, work_date }) {
  return db
    .prepare('DELETE FROM chore_instance_overrides WHERE chore_id = ? AND work_date = ?')
    .run(chore_id, work_date);
}

function getPersonById(personId) {
  if (!personId) {
    return null;
  }

  return db
    .prepare(
      `SELECT p.id, p.name, p.email, p.phone
       FROM people p
       WHERE p.id = ?`
    )
    .get(personId);
}

function resolveAssignmentForChore(weekOwner = null, instancePersonId = null) {
  const instancePerson = getPersonById(instancePersonId);
  if (instancePerson) {
    return {
      person: instancePerson,
      source: 'instance_override'
    };
  }

  if (weekOwner) {
    return {
      person: weekOwner,
      source: 'week_owner'
    };
  }

  return {
    person: null,
    source: 'unassigned'
  };
}

function fetchCompletion(choreId, dateKey) {
  return db
    .prepare(
      `SELECT c.id, c.completed_by, c.completed_at, p.name AS completed_by_name
       FROM completions c
       JOIN people p ON p.id = c.completed_by
       WHERE c.chore_id = ? AND c.work_date = ?`
    )
    .get(choreId, dateKey);
}

function isOverdue({ due_time, work_date, completed_at }, now = new Date()) {
  if (!due_time) {
    return false;
  }

  if (completed_at) {
    return false;
  }

  const dueAt = combineDateAndTime(work_date, due_time);
  return now.getTime() > dueAt.getTime();
}

export function getDailyPlan(
  dateKey = toDateKey(),
  { includeDisabled = false, includeBeforeStart = false } = {}
) {
  const chores = db
    .prepare(
      `SELECT id, name, description, interval_days, start_date, due_time, weekday_mask, alert_enabled, alert_delivery, active
       FROM chores
       WHERE active = 1
       ORDER BY name`
    )
    .all();

  const weekOwner = getWeekOwnerForDate(dateKey);
  const plan = [];

  for (const chore of chores) {
    if (!isChoreDueOnDate(chore, dateKey, { includeBeforeStart })) {
      continue;
    }

    const instanceOverride = getChoreInstanceOverride({ chore_id: chore.id, work_date: dateKey });
    const isInstanceDisabled = Boolean(instanceOverride && Number(instanceOverride.disabled) === 1);
    if (isInstanceDisabled && !includeDisabled) {
      continue;
    }

    const overrideName = instanceOverride?.name ? String(instanceOverride.name).trim() : null;
    const overrideDescription = instanceOverride?.description ? String(instanceOverride.description) : null;
    const deadlineMode =
      instanceOverride?.deadline_mode === null || instanceOverride?.deadline_mode === undefined
        ? null
        : Number(instanceOverride.deadline_mode);

    let dueTime = chore.due_time;
    let alertEnabled = Number(chore.alert_enabled) ? 1 : 0;
    const alertDelivery = normalizeChoreAlertDelivery(chore.alert_delivery);

    if (deadlineMode === 0) {
      dueTime = null;
      alertEnabled = 0;
    } else if (deadlineMode === 1) {
      dueTime = instanceOverride?.due_time || null;
      if (instanceOverride?.alert_enabled === 0 || instanceOverride?.alert_enabled === 1) {
        alertEnabled = instanceOverride.alert_enabled;
      }
    }

    const assignment = resolveAssignmentForChore(weekOwner, instanceOverride?.person_id || null);
    const person = assignment.person || null;
    const completion = fetchCompletion(chore.id, dateKey) || null;

    plan.push({
      chore_id: chore.id,
      chore_name: overrideName || chore.name,
      description: overrideDescription ?? chore.description,
      interval_days: chore.interval_days,
      work_date: dateKey,
      due_time: dueTime,
      alert_enabled: alertEnabled,
      alert_delivery: alertDelivery,
      responsible_person: person,
      assignment_source: assignment.source,
      completion,
      overdue: isInstanceDisabled
        ? false
        : isOverdue({ due_time: dueTime, work_date: dateKey, completed_at: completion?.completed_at }),
      instance_disabled: isInstanceDisabled,
      has_instance_override: Boolean(instanceOverride),
      instance_override: instanceOverride
        ? {
            id: instanceOverride.id,
            name: instanceOverride.name,
            description: instanceOverride.description,
            deadline_mode: instanceOverride.deadline_mode,
            due_time: instanceOverride.due_time,
            alert_enabled: instanceOverride.alert_enabled,
            person_id: instanceOverride.person_id,
            person_name: instanceOverride.person_name,
            disabled: instanceOverride.disabled
          }
        : null
    });
  }

  return plan.sort((a, b) => {
    if (a.instance_disabled !== b.instance_disabled) {
      return a.instance_disabled ? 1 : -1;
    }

    if (!a.due_time && !b.due_time) return a.chore_name.localeCompare(b.chore_name);
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time.localeCompare(b.due_time);
  });
}

export function markCompletion({ chore_id, work_date, completed_by }) {
  const completed_at = new Date().toISOString();

  db.prepare(
    `INSERT INTO completions (chore_id, work_date, completed_by, completed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(chore_id, work_date)
     DO UPDATE SET completed_by = excluded.completed_by, completed_at = excluded.completed_at`
  ).run(chore_id, work_date, completed_by, completed_at);

  return fetchCompletion(chore_id, work_date);
}

export function unmarkCompletion({ chore_id, work_date }) {
  return db.prepare('DELETE FROM completions WHERE chore_id = ? AND work_date = ?').run(chore_id, work_date);
}

export function listAlerts({ dateKey = null, limit = 100 } = {}) {
  if (dateKey) {
    return db
      .prepare(
        `SELECT a.id, a.chore_id, a.work_date, a.person_id, a.alert_type, a.message, a.created_at,
                c.name AS chore_name,
                p.name AS person_name
         FROM alerts a
         JOIN chores c ON c.id = a.chore_id
         LEFT JOIN people p ON p.id = a.person_id
         WHERE a.work_date = ?
         ORDER BY a.created_at DESC
         LIMIT ?`
      )
      .all(dateKey, limit);
  }

  return db
    .prepare(
      `SELECT a.id, a.chore_id, a.work_date, a.person_id, a.alert_type, a.message, a.created_at,
              c.name AS chore_name,
              p.name AS person_name
       FROM alerts a
       JOIN chores c ON c.id = a.chore_id
       LEFT JOIN people p ON p.id = a.person_id
       ORDER BY a.created_at DESC
       LIMIT ?`
    )
    .all(limit);
}

function createAlertIfMissing({ chore_id, work_date, person_id, alert_type, message }) {
  const result = db.prepare(
    `INSERT OR IGNORE INTO alerts (chore_id, work_date, person_id, alert_type, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(chore_id, work_date, person_id || null, alert_type, message, new Date().toISOString());

  return result.changes > 0;
}

function deadlineMissedMessage({ choreName, dueTime, personName, language = 'en' }) {
  if (language === 'no') {
    return `${choreName} ble ikke fullfort innen ${dueTime} av ${personName}.`;
  }

  return `${choreName} was not completed before ${dueTime} by ${personName}.`;
}

export function createOverdueAlerts({ lookbackDays = 0, language = 'en' } = {}) {
  const today = new Date();
  const createdAlerts = [];

  for (let i = 0; i <= lookbackDays; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = toDateKey(date);

    const plan = getDailyPlan(dateKey);

    for (const item of plan) {
      if (!item.overdue) {
        continue;
      }

      if (!item.alert_enabled) {
        continue;
      }

      const personName = item.responsible_person?.name || (language === 'no' ? 'Uten ansvarlig' : 'Unassigned person');
      const message = deadlineMissedMessage({
        choreName: item.chore_name,
        dueTime: item.due_time,
        personName,
        language
      });

      const created = createAlertIfMissing({
        chore_id: item.chore_id,
        work_date: item.work_date,
        person_id: item.responsible_person?.id || null,
        alert_type: 'deadline_missed',
        message
      });

      if (created) {
        createdAlerts.push({
          chore_id: item.chore_id,
          chore_name: item.chore_name,
          work_date: item.work_date,
          person_id: item.responsible_person?.id || null,
          person_name: item.responsible_person?.name || null,
          person_email: item.responsible_person?.email || null,
          person_phone: item.responsible_person?.phone || null,
          alert_delivery: item.alert_delivery || 'both',
          alert_type: 'deadline_missed',
          message
        });
      }
    }
  }

  return createdAlerts;
}

export function getPerformanceStats({ start_date, end_date, gamification_mode = 'friendly' }) {
  if (!start_date || !end_date) {
    throw new Error('start_date and end_date are required');
  }

  if (start_date > end_date) {
    throw new Error('start_date must be before or equal to end_date');
  }

  const mode = normalizeGamificationMode(gamification_mode);
  const isHardcore = mode === 'hardcore';
  const POINTS = isHardcore
    ? Object.freeze({
        completion: 10,
        helper: 2,
        onTime: 3,
        late: -4,
        missed: -12,
        streak: 1
      })
    : Object.freeze({
        completion: 10,
        helper: 3,
        onTime: 2,
        late: -1,
        missed: -5,
        streak: 2
      });

  const people = db.prepare('SELECT id, name, active FROM people ORDER BY name').all();
  const dateKeys = dateRangeKeys(start_date, end_date);
  const statsById = new Map(
    people.map((person) => [
      Number(person.id),
      {
        person_id: Number(person.id),
        name: person.name,
        active: Number(person.active) === 1,
        assigned: 0,
        self_done: 0,
        completed: 0,
        helper_completed: 0,
        covered_by_others: 0,
        on_time: 0,
        late: 0,
        missed_open: 0,
        current_streak: 0,
        best_streak: 0,
        streak_bonus: 0,
        points: 0,
        ownership_rate: null,
        on_time_rate: null,
        day_stats: new Map()
      }
    ])
  );

  const weeklyScores = new Map();

  function dayStats(personId, dateKey) {
    const row = statsById.get(personId);
    if (!row) {
      return null;
    }

    const existing = row.day_stats.get(dateKey);
    if (existing) {
      return existing;
    }

    const created = {
      assigned: 0,
      self_done: 0,
      completed: 0,
      missed_open: 0,
      covered_by_others: 0
    };
    row.day_stats.set(dateKey, created);
    return created;
  }

  function addWeeklyScore(personId, dateKey, { points = 0, completed = 0, self_done = 0, helper_completed = 0 } = {}) {
    if (!statsById.has(personId)) {
      return;
    }

    const weekStart = startOfWeekKey(dateKey);
    if (!weeklyScores.has(weekStart)) {
      weeklyScores.set(weekStart, new Map());
    }

    const weekMap = weeklyScores.get(weekStart);
    if (!weekMap.has(personId)) {
      weekMap.set(personId, {
        points: 0,
        completed: 0,
        self_done: 0,
        helper_completed: 0
      });
    }

    const entry = weekMap.get(personId);
    entry.points += points;
    entry.completed += completed;
    entry.self_done += self_done;
    entry.helper_completed += helper_completed;
  }

  for (const dateKey of dateKeys) {
    const plan = getDailyPlan(dateKey);

    for (const item of plan) {
      const responsibleId = Number(item.responsible_person?.id) || null;
      const completionById = Number(item.completion?.completed_by) || null;

      if (responsibleId && statsById.has(responsibleId)) {
        const responsible = statsById.get(responsibleId);
        const responsibleDay = dayStats(responsibleId, dateKey);

        responsible.assigned += 1;
        responsibleDay.assigned += 1;

        if (!item.completion && item.overdue) {
          responsible.missed_open += 1;
          responsibleDay.missed_open += 1;
          responsible.points += POINTS.missed;
          addWeeklyScore(responsibleId, dateKey, { points: POINTS.missed });
        }
      }

      if (!completionById || !statsById.has(completionById)) {
        continue;
      }

      const completer = statsById.get(completionById);
      const completerDay = dayStats(completionById, dateKey);
      let completionPoints = POINTS.completion;
      let helperCompleted = 0;

      completer.completed += 1;
      completerDay.completed += 1;

      if (responsibleId && completionById !== responsibleId) {
        completer.helper_completed += 1;
        helperCompleted = 1;
        completionPoints += POINTS.helper;

        if (statsById.has(responsibleId)) {
          const responsible = statsById.get(responsibleId);
          const responsibleDay = dayStats(responsibleId, dateKey);
          responsible.covered_by_others += 1;
          responsibleDay.covered_by_others += 1;
        }
      }

      if (item.due_time) {
        const dueAt = combineDateAndTime(dateKey, item.due_time);
        const completedAt = new Date(item.completion.completed_at);
        if (completedAt.getTime() <= dueAt.getTime()) {
          completer.on_time += 1;
          completionPoints += POINTS.onTime;
        } else {
          completer.late += 1;
          completionPoints += POINTS.late;
        }
      }

      if (responsibleId && completionById === responsibleId) {
        completer.self_done += 1;
        completerDay.self_done += 1;
      }

      completer.points += completionPoints;
      addWeeklyScore(completionById, dateKey, {
        points: completionPoints,
        completed: 1,
        self_done: responsibleId && completionById === responsibleId ? 1 : 0,
        helper_completed: helperCompleted
      });
    }
  }

  for (const row of statsById.values()) {
    let rolling = 0;
    let best = 0;

    for (const dateKey of dateKeys) {
      const day = row.day_stats.get(dateKey);
      if (!day || day.assigned === 0) {
        continue;
      }

      if (day.self_done > 0) {
        rolling += 1;
      } else {
        rolling = 0;
      }

      if (rolling > best) {
        best = rolling;
      }
    }

    let current = 0;
    for (let index = dateKeys.length - 1; index >= 0; index -= 1) {
      const day = row.day_stats.get(dateKeys[index]);
      if (!day || day.assigned === 0) {
        continue;
      }

      if (day.self_done > 0) {
        current += 1;
      } else {
        break;
      }
    }

    row.current_streak = current;
    row.best_streak = best;
    row.streak_bonus = Math.min(current, 15) * POINTS.streak;
    row.points += row.streak_bonus;
    row.ownership_rate = toRate(row.self_done, row.assigned);
    row.on_time_rate = toRate(row.on_time, row.on_time + row.late);
  }

  const leaderboard = Array.from(statsById.values())
    .filter((row) => row.active || row.assigned > 0 || row.completed > 0 || row.missed_open > 0)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.self_done !== a.self_done) return b.self_done - a.self_done;
      if (b.on_time !== a.on_time) return b.on_time - a.on_time;
      return a.name.localeCompare(b.name);
    })
    .map((row, index) => {
      const rank = index + 1;
      const badges = [];

      if (rank === 1 && row.points > 0) badges.push('mvp');
      if (row.current_streak >= 3) badges.push('streak');
      if (row.assigned >= (isHardcore ? 6 : 4) && row.ownership_rate !== null && row.ownership_rate >= (isHardcore ? 90 : 80)) {
        badges.push('reliable');
      }
      if (row.helper_completed >= (isHardcore ? 5 : 4)) badges.push('helper');
      if (row.assigned >= (isHardcore ? 4 : 6) && ((row.ownership_rate ?? 0) < (isHardcore ? 60 : 45) || row.missed_open >= (isHardcore ? 1 : 3))) {
        badges.push('needs_attention');
      }

      return {
        rank,
        person_id: row.person_id,
        name: row.name,
        active: row.active,
        score: row.points,
        assigned: row.assigned,
        self_done: row.self_done,
        completed: row.completed,
        helper_completed: row.helper_completed,
        covered_by_others: row.covered_by_others,
        on_time: row.on_time,
        late: row.late,
        missed_open: row.missed_open,
        ownership_rate: row.ownership_rate,
        on_time_rate: row.on_time_rate,
        current_streak: row.current_streak,
        best_streak: row.best_streak,
        badges
      };
    });

  const champion = leaderboard.find((row) => row.score > 0) || leaderboard[0] || null;
  const streakStar =
    leaderboard
      .filter((row) => row.current_streak > 0)
      .sort((a, b) => {
        if (b.current_streak !== a.current_streak) return b.current_streak - a.current_streak;
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name);
      })[0] || null;
  const needsAttention = leaderboard.filter((row) => row.badges.includes('needs_attention')).slice(0, 3);

  const weekStarts = [];
  let weekCursor = startOfWeekKey(start_date);
  const lastWeek = startOfWeekKey(end_date);
  while (weekCursor <= lastWeek) {
    weekStarts.push(weekCursor);
    weekCursor = addDaysToDateKey(weekCursor, 7);
  }

  const weekly = weekStarts.map((week_start) => {
    const weekScores = weeklyScores.get(week_start) || new Map();
    const players = Array.from(weekScores.entries())
      .map(([personId, weekRow]) => ({
        person_id: personId,
        name: statsById.get(personId)?.name || `#${personId}`,
        score: weekRow.points,
        completed: weekRow.completed,
        self_done: weekRow.self_done,
        helper_completed: weekRow.helper_completed
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.completed !== a.completed) return b.completed - a.completed;
        return a.name.localeCompare(b.name);
      });

    const top = players[0] || null;

    return {
      week_start,
      week_number: weekNumberFromDateKey(week_start),
      total_completed: players.reduce((sum, player) => sum + Number(player.completed || 0), 0),
      top_person_id: top?.person_id || null,
      top_person_name: top?.name || null,
      top_score: top?.score ?? null,
      players: players.slice(0, 5)
    };
  });

  return {
    range: {
      start_date,
      end_date,
      days: dateKeys.length
    },
    mode,
    leaderboard,
    highlights: {
      champion: champion
        ? {
            person_id: champion.person_id,
            name: champion.name,
            score: champion.score
          }
        : null,
      streak_star: streakStar
        ? {
            person_id: streakStar.person_id,
            name: streakStar.name,
            current_streak: streakStar.current_streak
          }
        : null,
      needs_attention: needsAttention.map((row) => ({
        person_id: row.person_id,
        name: row.name,
        ownership_rate: row.ownership_rate,
        missed_open: row.missed_open
      }))
    },
    weekly
  };
}

export function getSummary(dateKey = toDateKey()) {
  const plan = getDailyPlan(dateKey);
  const total = plan.length;
  const done = plan.filter((item) => item.completion).length;
  const overdue = plan.filter((item) => item.overdue).length;

  return {
    date: dateKey,
    total,
    done,
    open: total - done,
    overdue
  };
}
