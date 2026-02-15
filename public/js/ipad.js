import { api, todayKey, escapeHtml } from './api.js';
import { localeForLanguage, normalizeLanguage, setDocumentLanguage, translate } from './i18n.js';

const prevDayBtn = document.getElementById('ipad-prev-day');
const nextDayBtn = document.getElementById('ipad-next-day');
const dayLabelEl = document.getElementById('ipad-day-label');
const statusEl = document.getElementById('ipad-status');
const weekGridEl = document.getElementById('ipad-week-grid');
const userDialog = document.getElementById('ipad-user-dialog');
const userForm = document.getElementById('ipad-user-form');
const userSelect = document.getElementById('ipad-user-select');
const closeUserDialogBtn = document.querySelector('[data-close-user-dialog]');
const titleEl = document.getElementById('ipad-title');
const subtitleEl = document.getElementById('ipad-subtitle');
const weekHeadingEl = document.getElementById('ipad-week-heading');
const userDialogTitleEl = document.getElementById('ipad-user-dialog-title');
const userDialogTextEl = document.getElementById('ipad-user-dialog-text');
const userLabelEl = document.getElementById('ipad-user-label');
const userCancelBtn = document.getElementById('ipad-user-cancel');
const userConfirmBtn = document.getElementById('ipad-user-confirm');

const TEXT = {
  en: {
    title: 'Moradi',
    subtitle: 'Weekly checkoff view for shared office duties',
    weekHeading: 'Week View (Monday - Friday)',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    week: 'Week {week}',
    sourceInstanceOverride: 'Instance override',
    sourceWeekOwner: 'Week owner',
    sourceUnassigned: 'Unassigned',
    noPeopleAvailable: 'No people available',
    chooseName: 'Choose name',
    noPeopleForCheckoff: 'No people available for completion checkoff.',
    noDatesLoaded: 'No dates loaded.',
    noDeadline: 'No deadline',
    noChoresDue: 'No chores due.',
    undoCompletion: 'Undo completion',
    markComplete: 'Mark complete',
    completionRemoved: 'Completion removed.',
    chooseNameToContinue: 'Choose your name to continue.',
    choreMarkedComplete: 'Chore marked complete.',
    failedLoad: 'Failed to load: {error}',
    whoAreYou: 'Who are you?',
    whoAreYouText: 'Choose your name to check off this chore.',
    employee: 'Employee',
    cancel: 'Cancel',
    confirm: 'Confirm'
  },
  no: {
    title: 'Moradi',
    subtitle: 'Ukentlig innsjekk for felles gjøremål på kontoret',
    weekHeading: 'Ukevisning (mandag - fredag)',
    previousWeek: 'Forrige uke',
    nextWeek: 'Neste uke',
    week: 'Uke {week}',
    sourceInstanceOverride: 'Instansoverstyring',
    sourceWeekOwner: 'Ukeansvar',
    sourceUnassigned: 'Ikke tildelt',
    noPeopleAvailable: 'Ingen personer tilgjengelig',
    chooseName: 'Velg navn',
    noPeopleForCheckoff: 'Ingen personer tilgjengelig for innsjekk.',
    noDatesLoaded: 'Ingen datoer lastet.',
    noDeadline: 'Ingen frist',
    noChoresDue: 'Ingen gjøremål forfaller.',
    undoCompletion: 'Angre fullføring',
    markComplete: 'Marker fullført',
    completionRemoved: 'Gjennomføring fjernet.',
    chooseNameToContinue: 'Velg navnet ditt for å fortsette.',
    choreMarkedComplete: 'Gjøremål markert som fullført.',
    failedLoad: 'Kunne ikke laste: {error}',
    whoAreYou: 'Hvem er du?',
    whoAreYouText: 'Velg navnet ditt for å sjekke inn gjøremålet.',
    employee: 'Ansatt',
    cancel: 'Avbryt',
    confirm: 'Bekreft'
  }
};

const state = {
  language: 'en',
  weekStart: startOfWeek(todayKey()),
  people: [],
  weekDates: [],
  weekPlans: new Map(),
  pendingAction: null
};

function localDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, days) {
  const date = localDateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function startOfWeek(dateKey, weekStartsOn = 1) {
  const date = localDateFromKey(dateKey);
  const weekday = date.getDay();
  const shift = (weekday - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - shift);
  return toDateKey(date);
}

function weekdayLabel(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'short' }).format(localDateFromKey(dateKey));
}

function dayNumberLabel(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), { day: '2-digit', month: 'short' }).format(localDateFromKey(dateKey));
}

function formatWeekRange(startKey) {
  const start = localDateFromKey(startKey);
  const end = localDateFromKey(addDays(startKey, 4));
  const startFmt = new Intl.DateTimeFormat(currentLocale(), { month: 'short', day: 'numeric' });
  const endFmt = new Intl.DateTimeFormat(currentLocale(), { month: 'short', day: 'numeric', year: 'numeric' });
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

function t(key, vars = {}) {
  return translate(TEXT, state.language, key, vars);
}

function currentLocale() {
  return localeForLanguage(state.language);
}

function sourceLabel(source) {
  switch (source) {
    case 'instance_override':
      return t('sourceInstanceOverride');
    case 'week_owner':
      return t('sourceWeekOwner');
    default:
      return t('sourceUnassigned');
  }
}

function setStatus(message, isError = false) {
  if (!isError) {
    statusEl.textContent = '';
    return;
  }

  statusEl.textContent = message || '';
  statusEl.style.color = '#b42e2a';
}

function applyLanguage(language) {
  state.language = normalizeLanguage(language);
  setDocumentLanguage(state.language);

  document.title = t('title');
  if (titleEl) titleEl.textContent = t('title');
  if (subtitleEl) subtitleEl.textContent = t('subtitle');
  if (weekHeadingEl) weekHeadingEl.textContent = t('weekHeading');
  if (userDialogTitleEl) userDialogTitleEl.textContent = t('whoAreYou');
  if (userDialogTextEl) userDialogTextEl.textContent = t('whoAreYouText');
  if (userLabelEl) userLabelEl.textContent = t('employee');
  if (userCancelBtn) userCancelBtn.textContent = t('cancel');
  if (userConfirmBtn) userConfirmBtn.textContent = t('confirm');

  prevDayBtn.setAttribute('aria-label', t('previousWeek'));
  prevDayBtn.setAttribute('title', t('previousWeek'));
  nextDayBtn.setAttribute('aria-label', t('nextWeek'));
  nextDayBtn.setAttribute('title', t('nextWeek'));
}

function getMondayToFridayDates(dateKey) {
  const monday = startOfWeek(dateKey);
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));
}

function renderHeaderLabels() {
  const weekNumber = weekNumberFromDateKey(state.weekStart);
  const rangeText = formatWeekRange(state.weekStart);
  dayLabelEl.innerHTML = `
    <span class="ipad-week-number">${escapeHtml(t('week', { week: weekNumber }))}</span>
    <span class="ipad-week-range">${escapeHtml(rangeText)}</span>
  `;
}

function renderUserOptions() {
  if (!state.people.length) {
    userSelect.innerHTML = `<option value="">${escapeHtml(t('noPeopleAvailable'))}</option>`;
    return;
  }

  userSelect.innerHTML = [`<option value="">${escapeHtml(t('chooseName'))}</option>`]
    .concat(
      state.people.map((person) => `<option value="${person.id}">${escapeHtml(person.name)}</option>`)
    )
    .join('');
}

function openUserDialog(action) {
  if (!state.people.length) {
    setStatus(t('noPeopleForCheckoff'), true);
    return;
  }

  state.pendingAction = action;
  renderUserOptions();
  userSelect.value = '';
  if (!userDialog.open) {
    userDialog.showModal();
  }
}

function closeUserDialog() {
  state.pendingAction = null;
  if (userDialog.open) {
    userDialog.close();
  }
}

function renderWeekGrid() {
  if (!state.weekDates.length) {
    weekGridEl.innerHTML = `<p>${escapeHtml(t('noDatesLoaded'))}</p>`;
    return;
  }

  weekGridEl.innerHTML = state.weekDates
    .map((dateKey) => {
      const items = state.weekPlans.get(dateKey) || [];
      const isCurrentWeekday = dateKey === todayKey();

      const listHtml = items.length
        ? items
            .map((item) => {
              const completed = Boolean(item.completion);
              const overdue = !completed && Boolean(item.overdue);
              return `
                <article class="ipad-chore-row ${completed ? 'done' : ''} ${overdue ? 'overdue' : ''}">
                  <button
                    type="button"
                    class="ipad-check-toggle ${completed ? 'checked' : ''}"
                    data-role="toggle-done"
                    data-chore-id="${item.chore_id}"
                    data-work-date="${dateKey}"
                    data-done="${completed ? 1 : 0}"
                    title="${completed ? escapeHtml(t('undoCompletion')) : escapeHtml(t('markComplete'))}"
                    aria-label="${completed ? escapeHtml(t('undoCompletion')) : escapeHtml(t('markComplete'))}"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M9.2 16.4 5.8 13l-1.4 1.4 4.8 4.8L20 8.4 18.6 7l-9.4 9.4z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <div class="ipad-chore-main">
                    <h3>${escapeHtml(item.chore_name)}</h3>
                    <p>${item.due_time ? escapeHtml(item.due_time) : ''}</p>
                    <p class="ipad-chore-owner">${escapeHtml(
                      item.completion?.completed_by_name || item.responsible_person?.name || t('sourceUnassigned')
                    )}</p>
                  </div>
                </article>
              `;
            })
            .join('')
        : `<p class="ipad-day-empty">${escapeHtml(t('noChoresDue'))}</p>`;

      return `
        <section class="ipad-day-column ${isCurrentWeekday ? 'focus' : ''}">
          <header class="ipad-day-head">
            <span class="ipad-day-week">${escapeHtml(weekdayLabel(dateKey))}</span>
            <strong>${escapeHtml(dayNumberLabel(dateKey))}</strong>
          </header>
          <div class="ipad-day-list">${listHtml}</div>
        </section>
      `;
    })
    .join('');
}

async function loadPeople() {
  state.people = await api.getPeople();
}

async function loadWeekPlans() {
  state.weekDates = getMondayToFridayDates(state.weekStart);
  const plans = await Promise.all(state.weekDates.map((dateKey) => api.getPlan(dateKey, { includeBeforeStart: true })));
  state.weekPlans = new Map(state.weekDates.map((dateKey, index) => [dateKey, plans[index] || []]));
}

async function refresh() {
  renderHeaderLabels();
  await Promise.all([loadPeople(), loadWeekPlans()]);
  renderWeekGrid();
}

async function onWeekGridClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button[data-role="toggle-done"]');
  if (!(button instanceof HTMLButtonElement)) return;

  const choreId = Number(button.dataset.choreId);
  const workDate = String(button.dataset.workDate);
  const isDone = button.dataset.done === '1';

  try {
    if (isDone) {
      await api.unmarkDone({ chore_id: choreId, work_date: workDate });
      await loadWeekPlans();
      renderWeekGrid();
      setStatus(t('completionRemoved'));
      return;
    }

    openUserDialog({ choreId, workDate });
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onUserSubmit(event) {
  event.preventDefault();

  if (!state.pendingAction) {
    closeUserDialog();
    return;
  }

  const selectedPerson = Number(userSelect.value);
  if (!selectedPerson) {
    setStatus(t('chooseNameToContinue'), true);
    return;
  }

  try {
    await api.markDone({
      chore_id: state.pendingAction.choreId,
      work_date: state.pendingAction.workDate,
      completed_by: selectedPerson
    });

    closeUserDialog();
    await loadWeekPlans();
    renderWeekGrid();
    setStatus(t('choreMarkedComplete'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

function shiftWeek(weeks) {
  state.weekStart = addDays(state.weekStart, weeks * 7);
  refresh().catch((error) => setStatus(error.message, true));
}

async function init() {
  applyLanguage('en');

  try {
    const settings = await api.getSettings();
    applyLanguage(settings.language);
    await refresh();
  } catch (error) {
    setStatus(t('failedLoad', { error: error.message }), true);
  }

  setInterval(() => {
    refresh().catch(() => {});
  }, 45000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refresh().catch(() => {});
    }
  });

  window.addEventListener('focus', () => {
    refresh().catch(() => {});
  });
}

userForm.addEventListener('submit', onUserSubmit);
closeUserDialogBtn.addEventListener('click', closeUserDialog);
userDialog.addEventListener('cancel', () => {
  state.pendingAction = null;
});

prevDayBtn.addEventListener('click', () => shiftWeek(-1));
nextDayBtn.addEventListener('click', () => shiftWeek(1));
weekGridEl.addEventListener('click', onWeekGridClick);

init();
