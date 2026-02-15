import { api, todayKey, escapeHtml } from './api.js';

const summaryEl = document.getElementById('summary');
const cardsEl = document.getElementById('plan-cards');
const alertsEl = document.getElementById('alerts');
const rosterTableEl = document.getElementById('roster-table');
const weekOwnerListEl = document.getElementById('week-owner-list');

const dayOrder = [1, 2, 3, 4, 5, 6, 0];

async function loadOverview() {
  const date = todayKey();

  const [summary, plan, alerts, bootstrap] = await Promise.all([
    api.getSummary(date),
    api.getPlan(date),
    api.getAlerts(10),
    api.getBootstrap()
  ]);

  renderSummary(summary);
  renderPlanCards(plan);
  renderAlerts(alerts);
  renderRoster(bootstrap.chores, bootstrap.weekOwners || [], date);
  renderWeekOwners(bootstrap.weekOwners || []);
}

function renderSummary(summary) {
  const items = [
    { label: 'Total chores', value: summary.total },
    { label: 'Completed', value: summary.done },
    { label: 'Open', value: summary.open },
    { label: 'Overdue', value: summary.overdue }
  ];

  summaryEl.innerHTML = items
    .map(
      (item) => `
      <article class="kpi">
        <p>${item.label}</p>
        <div class="value">${item.value}</div>
      </article>
    `
    )
    .join('');
}

function renderPlanCards(plan) {
  if (!plan.length) {
    cardsEl.innerHTML = '<p class="notice">No chores are scheduled for today.</p>';
    return;
  }

  cardsEl.innerHTML = plan
    .map((item) => {
      const classes = ['chore-card'];
      if (item.completion) classes.push('done');
      if (item.overdue) classes.push('overdue');

      return `
        <article class="${classes.join(' ')}">
          <h3>${escapeHtml(item.chore_name)}</h3>
          <p>${escapeHtml(item.description || 'No description')}</p>
          <p><strong>Responsible:</strong> ${escapeHtml(item.responsible_person?.name || 'Not assigned')}</p>
          <p><strong>Deadline:</strong> ${item.due_time ? escapeHtml(item.due_time) : ''}</p>
          <p>
            ${
              item.completion
                ? '<span class="badge ok">Done</span>'
                : item.overdue
                  ? '<span class="badge warn">Overdue</span>'
                  : '<span class="badge">Open</span>'
            }
          </p>
        </article>
      `;
    })
    .join('');
}

function renderAlerts(alerts) {
  if (!alerts.length) {
    alertsEl.innerHTML = '<p class="notice">No alerts have been triggered.</p>';
    return;
  }

  alertsEl.innerHTML = alerts
    .map(
      (alert) => `
      <article class="alert-item">
        <strong>${escapeHtml(alert.chore_name)}</strong>
        <p>${escapeHtml(alert.message)}</p>
        <p class="notice">${escapeHtml(alert.work_date)} at ${new Date(alert.created_at).toLocaleString()}</p>
      </article>
    `
    )
    .join('');
}

function startOfWeek(dateKey, weekStartsOn = 1) {
  const date = localDateFromKey(dateKey);
  const weekday = date.getDay();
  const shift = (weekday - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - shift);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderRoster(chores = [], weekOwners = [], dateKey = todayKey()) {
  if (!rosterTableEl) {
    return;
  }

  if (!chores.length) {
    rosterTableEl.innerHTML = '<tr><td colspan="8" class="notice">No chores configured yet.</td></tr>';
    return;
  }

  const weekStart = startOfWeek(dateKey);
  const currentWeekOwner = weekOwners.find((item) => item.week_start === weekStart) || null;

  rosterTableEl.innerHTML = chores
    .map((chore) => {
      const cells = dayOrder
        .map(() => {
          if (!currentWeekOwner?.person_name) {
            return '<td><span class="badge warn">Unassigned</span></td>';
          }

          return `<td><span class="roster-person">${escapeHtml(currentWeekOwner.person_name)}</span></td>`;
        })
        .join('');

      return `
        <tr>
          <td><strong>${escapeHtml(chore.name)}</strong></td>
          ${cells}
        </tr>
      `;
    })
    .join('');
}

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
  const startFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const endFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startFormatter.format(start)} - ${endFormatter.format(end)}`;
}

function renderWeekOwners(weekOwners) {
  if (!weekOwnerListEl) {
    return;
  }

  if (!weekOwners.length) {
    weekOwnerListEl.innerHTML = '<p class="notice">No week owners configured yet.</p>';
    return;
  }

  weekOwnerListEl.innerHTML = weekOwners
    .map((item) => {
      const ownerHtml = item.person_name
        ? `<span class="badge ok">${escapeHtml(item.person_name)}</span>`
        : '<span class="badge warn">Unassigned</span>';

      return `
        <article class="week-owner-item">
          <strong>${escapeHtml(formatWeekRange(item.week_start))}</strong>
          <div>${ownerHtml}</div>
          <p class="notice">Week starts ${escapeHtml(item.week_start)}</p>
        </article>
      `;
    })
    .join('');
}

async function init() {
  try {
    await loadOverview();
  } catch (error) {
    cardsEl.innerHTML = `<p class="notice">Could not load overview: ${escapeHtml(error.message)}</p>`;
  }
  setInterval(() => {
    loadOverview().catch(() => {});
  }, 60000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadOverview().catch(() => {});
    }
  });

  window.addEventListener('focus', () => {
    loadOverview().catch(() => {});
  });
}

init();
