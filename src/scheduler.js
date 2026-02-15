import cron from 'node-cron';
import nodemailer from 'nodemailer';
import {
  createOverdueAlerts,
  getSettings,
  getWeekOwnerForWeekStart,
  markWeekOwnerNotificationSent,
  startOfWeekKey,
  toDateKey
} from './db.js';

function localDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function addDays(dateKey, days) {
  const date = localDateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekRange(startKey) {
  const start = localDateFromKey(startKey);
  const end = localDateFromKey(addDays(startKey, 6));
  const startFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const endFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFmt.format(start)} - ${endFmt.format(end)}`;
}

function weekNumberFromDateKey(dateKey) {
  const date = localDateFromKey(dateKey);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
}

function weeklyOwnerReminderMessage({ language, personName, weekNumber, weekRange }) {
  if (language === 'no') {
    return `Hei ${personName}. Du har ukesansvaret for kontoroppgaver i uke ${weekNumber} (${weekRange}).`;
  }

  return `Hi ${personName}. You are responsible for office chores for week ${weekNumber} (${weekRange}).`;
}

function normalizeUrl(value) {
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function hasSmtpSettings(settings) {
  return Boolean(settings.smtp_host && settings.smtp_user && settings.smtp_pass && settings.smtp_from);
}

async function sendViaWebhook({ url, payload }) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function sendViaSmsGateway({ url, payload }) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function sendViaSmtp({ settings, recipientEmail, subject, message, payload }) {
  const transporter = nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number(settings.smtp_port) || 587,
    secure: Number(settings.smtp_secure) === 1,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass
    }
  });

  await transporter.sendMail({
    from: settings.smtp_from,
    to: recipientEmail,
    subject,
    text: message,
    headers: {
      'X-Moradi-Event-Type': payload.type
    }
  });
}

async function dispatchNotification({ settings, type, message, person, payload }) {
  const webhookUrl = normalizeUrl(settings.alert_webhook_url) || normalizeUrl(process.env.ALERT_WEBHOOK_URL);
  const smsGatewayUrl = normalizeUrl(settings.sms_gateway_url);
  const recipientName = person?.name || 'Unassigned person';
  const recipientEmail = person?.email || null;
  const recipientPhone = person?.phone || null;
  const notificationPayload = {
    type,
    message,
    person: {
      id: person?.id || null,
      name: recipientName,
      email: recipientEmail,
      phone: recipientPhone
    },
    ...payload
  };

  let delivered = false;

  if (webhookUrl) {
    await sendViaWebhook({
      url: webhookUrl,
      payload: notificationPayload
    });
    delivered = true;
  }

  if (smsGatewayUrl && recipientPhone) {
    await sendViaSmsGateway({
      url: smsGatewayUrl,
      payload: {
        to: recipientPhone,
        message,
        type,
        context: notificationPayload
      }
    });
    delivered = true;
  }

  if (recipientEmail && hasSmtpSettings(settings)) {
    const subject =
      type === 'week_owner_reminder'
        ? settings.language === 'no'
          ? 'Ukesansvar for kontoroppgaver'
          : 'Weekly office chores responsibility'
        : settings.language === 'no'
          ? 'Frist for oppgave passert'
          : 'Chore deadline missed';

    await sendViaSmtp({
      settings,
      recipientEmail,
      subject,
      message,
      payload: notificationPayload
    });
    delivered = true;
  }

  if (!delivered) {
    console.log(`[ALERT] ${type}: ${message}`);
  }
}

async function runDeadlineAlertScan() {
  const settings = getSettings();
  if (Number(settings.deadline_alerts_enabled) !== 1) {
    return;
  }

  const createdAlerts = createOverdueAlerts({ lookbackDays: 0, language: settings.language });

  for (const alert of createdAlerts) {
    const person = {
      id: alert.person_id || null,
      name: alert.person_name || null,
      email: alert.person_email || null,
      phone: alert.person_phone || null
    };

    try {
      await dispatchNotification({
        settings,
        type: 'deadline_missed',
        message: alert.message,
        person,
        payload: alert
      });
    } catch (error) {
      console.error('Failed to send deadline notification:', error);
    }
  }
}

async function runWeeklyOwnerReminder() {
  const settings = getSettings();
  if (Number(settings.weekly_owner_alert_enabled) !== 1) {
    return;
  }

  const today = toDateKey();
  const weekStart = startOfWeekKey(today);
  const owner = getWeekOwnerForWeekStart(weekStart);

  if (!owner) {
    return;
  }

  const weekNumber = weekNumberFromDateKey(weekStart);
  const weekRange = formatWeekRange(weekStart);
  const message = weeklyOwnerReminderMessage({
    language: settings.language,
    personName: owner.name,
    weekNumber,
    weekRange
  });

  const marked = markWeekOwnerNotificationSent({
    week_start: weekStart,
    person_id: owner.id,
    message
  });
  if (!marked) {
    return;
  }

  try {
    await dispatchNotification({
      settings,
      type: 'week_owner_reminder',
      message,
      person: owner,
      payload: {
        week_start: weekStart,
        week_number: weekNumber,
        week_range: weekRange
      }
    });
  } catch (error) {
    console.error('Failed to send weekly owner reminder:', error);
  }
}

export function startScheduler() {
  const deadlineTask = cron.schedule('* * * * *', async () => {
    try {
      await runDeadlineAlertScan();
    } catch (error) {
      console.error('Deadline alert scheduler failed:', error);
    }
  });

  const weeklyOwnerTask = cron.schedule('0 8 * * 1', async () => {
    try {
      await runWeeklyOwnerReminder();
    } catch (error) {
      console.error('Weekly owner scheduler failed:', error);
    }
  });

  return {
    deadlineTask,
    weeklyOwnerTask
  };
}
