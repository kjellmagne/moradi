import { api, todayKey, escapeHtml } from './api.js';
import { localeForLanguage, normalizeLanguage, setDocumentLanguage, translate } from './i18n.js';

const prevDayBtn = document.getElementById('mobile-prev-day');
const nextDayBtn = document.getElementById('mobile-next-day');
const openDatePickerBtn = document.getElementById('mobile-open-date-picker');
const dayLabelEl = document.getElementById('mobile-day-label');
const personWheelEl = document.getElementById('mobile-person-wheel');
const currentPersonEl = document.getElementById('mobile-current-person');
const changePersonBtn = document.getElementById('mobile-change-person');
const statusEl = document.getElementById('mobile-status');
const listEl = document.getElementById('mobile-list');
const weekOwnersEl = document.getElementById('mobile-week-owners');
const userDialog = document.getElementById('mobile-user-dialog');
const userForm = document.getElementById('mobile-user-form');
const dateDialog = document.getElementById('mobile-date-dialog');
const dateForm = document.getElementById('mobile-date-form');
const dateCancelBtn = document.getElementById('mobile-date-cancel');
const dateWheelEl = document.getElementById('mobile-date-wheel');
const tabButtons = Array.from(document.querySelectorAll('[data-screen-target]'));
const screenEls = Array.from(document.querySelectorAll('[data-screen]'));
const titleEl = document.getElementById('mobile-title');
const youAreLabelEl = document.getElementById('mobile-you-are-label');
const choresTabLabelEl = document.getElementById('mobile-tab-chores-label');
const weeksTabLabelEl = document.getElementById('mobile-tab-weeks-label');
const choresHeadingEl = document.getElementById('mobile-chores-heading');
const weeksHeadingEl = document.getElementById('mobile-weeks-heading');
const userDialogTitleEl = document.getElementById('mobile-user-dialog-title');
const userDialogTextEl = document.getElementById('mobile-user-dialog-text');
const userSubmitEl = document.getElementById('mobile-user-submit');
const dateDialogTitleEl = document.getElementById('mobile-date-dialog-title');
const dateDialogTextEl = document.getElementById('mobile-date-dialog-text');
const dateSubmitEl = document.getElementById('mobile-date-submit');

const TEXT = {
  en: {
    title: 'Moradi',
    youAre: 'You are:',
    notSelected: 'Not selected',
    whoAmI: 'Who am I?',
    choresTab: 'Chores',
    weeksTab: 'Weeks',
    choresHeading: "Today's Chores",
    weeksHeading: 'Upcoming Week Owners',
    chooseWho: 'Choose who you are',
    chooseWhoHint: 'Swipe the wheel to your name. This device will remember your selection.',
    continue: 'Continue',
    chooseDate: 'Choose date',
    chooseDateHint: 'Swipe the wheel to select day.',
    cancel: 'Cancel',
    setDate: 'Set date',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    pickDate: 'Pick date',
    screens: 'Mobile screens',
    employeePicker: 'Employee picker',
    datePicker: 'Date picker',
    noOptions: 'No options',
    noPeopleAvailable: 'No people available',
    chooseName: 'Choose name',
    chooseNameToSee: 'Choose your name to see your chores.',
    chooseEmployee: 'Choose employee',
    noChoresAssigned: 'No chores assigned on this day.',
    noDeadline: 'No deadline',
    sourceInstanceOverride: 'Instance override',
    sourceWeekOwner: 'Week owner',
    sourceUnassigned: 'Unassigned',
    undoCompletion: 'Undo completion',
    markComplete: 'Mark complete',
    noWeekOwnersConfigured: 'No week owners configured.',
    week: 'Week {week}',
    starts: 'Starts {date}',
    pleaseChooseName: 'Please choose your name.',
    choreMarkedComplete: 'Chore marked complete.',
    failedLoad: 'Failed to load: {error}'
  },
  no: {
    title: 'Moradi',
    youAre: 'Du er:',
    notSelected: 'Ikke valgt',
    whoAmI: 'Hvem er jeg?',
    choresTab: 'Gjøremål',
    weeksTab: 'Uker',
    choresHeading: 'Dagens gjøremål',
    weeksHeading: 'Kommende ukeansvar',
    chooseWho: 'Velg hvem du er',
    chooseWhoHint: 'Sveip hjulet til navnet ditt. Enheten husker valget ditt.',
    continue: 'Fortsett',
    chooseDate: 'Velg dato',
    chooseDateHint: 'Sveip hjulet for å velge dag.',
    cancel: 'Avbryt',
    setDate: 'Sett dato',
    previousDay: 'Forrige dag',
    nextDay: 'Neste dag',
    pickDate: 'Velg dato',
    screens: 'Mobilskjermer',
    employeePicker: 'Ansattvelger',
    datePicker: 'Datovelger',
    noOptions: 'Ingen valg',
    noPeopleAvailable: 'Ingen personer tilgjengelig',
    chooseName: 'Velg navn',
    chooseNameToSee: 'Velg navnet ditt for å se gjøremålene dine.',
    chooseEmployee: 'Velg ansatt',
    noChoresAssigned: 'Ingen gjøremål tildelt denne dagen.',
    noDeadline: 'Ingen frist',
    sourceInstanceOverride: 'Instansoverstyring',
    sourceWeekOwner: 'Ukeansvar',
    sourceUnassigned: 'Ikke tildelt',
    undoCompletion: 'Angre fullføring',
    markComplete: 'Marker fullført',
    noWeekOwnersConfigured: 'Ingen ukeansvarlige konfigurert.',
    week: 'Uke {week}',
    starts: 'Starter {date}',
    pleaseChooseName: 'Velg navnet ditt.',
    choreMarkedComplete: 'Gjøremål markert som fullført.',
    failedLoad: 'Kunne ikke laste: {error}'
  }
};

const PERSON_STORAGE_KEY = 'chores.mobile.personId';

const state = {
  language: 'en',
  people: [],
  date: todayKey(),
  dateWheelValue: todayKey(),
  personId: null,
  personWheelValue: null,
  plan: [],
  weekOwners: [],
  screen: 'chores'
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

function formatDay(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(localDateFromKey(dateKey));
}

function formatWheelDate(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(localDateFromKey(dateKey));
}

function formatWeekRange(startKey) {
  const start = localDateFromKey(startKey);
  const end = localDateFromKey(addDays(startKey, 6));
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
  if (youAreLabelEl) youAreLabelEl.textContent = t('youAre');
  if (changePersonBtn) changePersonBtn.textContent = t('whoAmI');
  if (choresTabLabelEl) choresTabLabelEl.textContent = t('choresTab');
  if (weeksTabLabelEl) weeksTabLabelEl.textContent = t('weeksTab');
  if (choresHeadingEl) choresHeadingEl.textContent = t('choresHeading');
  if (weeksHeadingEl) weeksHeadingEl.textContent = t('weeksHeading');
  if (userDialogTitleEl) userDialogTitleEl.textContent = t('chooseWho');
  if (userDialogTextEl) userDialogTextEl.textContent = t('chooseWhoHint');
  if (userSubmitEl) userSubmitEl.textContent = t('continue');
  if (dateDialogTitleEl) dateDialogTitleEl.textContent = t('chooseDate');
  if (dateDialogTextEl) dateDialogTextEl.textContent = t('chooseDateHint');
  if (dateCancelBtn) dateCancelBtn.textContent = t('cancel');
  if (dateSubmitEl) dateSubmitEl.textContent = t('setDate');

  prevDayBtn.setAttribute('aria-label', t('previousDay'));
  prevDayBtn.setAttribute('title', t('previousDay'));
  nextDayBtn.setAttribute('aria-label', t('nextDay'));
  nextDayBtn.setAttribute('title', t('nextDay'));
  openDatePickerBtn.setAttribute('title', t('pickDate'));
  document.querySelector('.mobile-tabs')?.setAttribute('aria-label', t('screens'));
  personWheelEl.setAttribute('aria-label', t('employeePicker'));
  dateWheelEl.setAttribute('aria-label', t('datePicker'));
}

function applyPlatformPreset() {
  const ua = window.navigator.userAgent || '';
  const platform = window.navigator.platform || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && Number(window.navigator.maxTouchPoints) > 1);
  const isAndroid = /Android/i.test(ua);

  document.body.classList.remove('platform-ios', 'platform-android');

  if (isAndroid) {
    document.body.classList.add('platform-android');
    return;
  }

  if (isIOS) {
    document.body.classList.add('platform-ios');
    return;
  }

  document.body.classList.add('platform-ios');
}

function setScreen(screen) {
  state.screen = screen;

  for (const screenEl of screenEls) {
    const active = screenEl.getAttribute('data-screen') === screen;
    screenEl.classList.toggle('mobile-screen-hidden', !active);
  }

  for (const tab of tabButtons) {
    const active = tab.getAttribute('data-screen-target') === screen;
    tab.classList.toggle('current', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  }
}

function renderDayLabel() {
  dayLabelEl.textContent = formatDay(state.date);
}

function renderCurrentPerson() {
  const person = state.people.find((entry) => Number(entry.id) === Number(state.personId));
  currentPersonEl.textContent = person?.name || t('notSelected');
}

function getWheelOptions(el) {
  return Array.from(el.querySelectorAll('.mobile-wheel-option'));
}

function setWheelSelection(el, value, { scroll = true, behavior = 'smooth' } = {}) {
  const options = getWheelOptions(el);
  if (!options.length) {
    return null;
  }

  const normalized = String(value);
  let selectedOption = null;

  for (const option of options) {
    const isSelected = option.dataset.value === normalized;
    option.classList.toggle('selected', isSelected);
    option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    if (isSelected) {
      selectedOption = option;
    }
  }

  if (!selectedOption) {
    selectedOption = options[0];
    selectedOption.classList.add('selected');
    selectedOption.setAttribute('aria-selected', 'true');
  }

  if (scroll) {
    const targetTop = selectedOption.offsetTop - (el.clientHeight - selectedOption.offsetHeight) / 2;
    el.scrollTo({ top: Math.max(0, targetTop), behavior });
  }

  return selectedOption.dataset.value;
}

function snapWheelToNearest(el) {
  const options = getWheelOptions(el);
  if (!options.length) {
    return null;
  }

  const center = el.scrollTop + el.clientHeight / 2;
  let closest = options[0];
  let minDistance = Number.POSITIVE_INFINITY;

  for (const option of options) {
    const optionCenter = option.offsetTop + option.offsetHeight / 2;
    const distance = Math.abs(optionCenter - center);
    if (distance < minDistance) {
      minDistance = distance;
      closest = option;
    }
  }

  return setWheelSelection(el, closest.dataset.value, { scroll: true, behavior: 'smooth' });
}

function attachWheelHandlers(el, onSelect) {
  if (!el || el.dataset.bound === '1') {
    return;
  }

  let scrollTimer = null;

  el.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const option = target.closest('.mobile-wheel-option');
    if (!(option instanceof HTMLButtonElement)) return;

    const value = setWheelSelection(el, option.dataset.value, { scroll: true, behavior: 'smooth' });
    if (value != null) {
      onSelect(value, { source: 'click' });
    }
  });

  el.addEventListener('scroll', () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const value = snapWheelToNearest(el);
      if (value != null) {
        onSelect(value, { source: 'scroll' });
      }
    }, 100);
  });

  el.dataset.bound = '1';
}

function renderWheel(el, options, selectedValue) {
  if (!el) return;

  if (!options.length) {
    el.innerHTML = `<div class="mobile-wheel-empty">${escapeHtml(t('noOptions'))}</div>`;
    return;
  }

  el.innerHTML = options
    .map(
      (option) =>
        `<button type="button" class="mobile-wheel-option" data-value="${escapeHtml(option.value)}" aria-selected="false">${escapeHtml(option.label)}</button>`
    )
    .join('');

  const hasSelected = options.some((option) => String(option.value) === String(selectedValue));
  const fallbackValue = hasSelected ? String(selectedValue) : String(options[0].value);

  setWheelSelection(el, fallbackValue, { scroll: false, behavior: 'auto' });
  requestAnimationFrame(() => {
    setWheelSelection(el, fallbackValue, { scroll: true, behavior: 'auto' });
  });
}

function buildPersonWheelOptions() {
  return state.people.map((person) => ({ value: String(person.id), label: person.name }));
}

function buildDateWheelOptions(centerDateKey) {
  const options = [];
  const start = addDays(centerDateKey, -30);

  for (let offset = 0; offset <= 60; offset += 1) {
    const key = addDays(start, offset);
    options.push({ value: key, label: formatWheelDate(key) });
  }

  return options;
}

function renderPersonWheel() {
  const options = buildPersonWheelOptions();
  const preferred = state.personWheelValue ?? (state.personId ? String(state.personId) : options[0]?.value ?? null);

  if (!options.length) {
    state.personWheelValue = null;
    renderWheel(personWheelEl, [], null);
    return;
  }

  state.personWheelValue = String(preferred);
  renderWheel(personWheelEl, options, state.personWheelValue);
}

function renderDateWheel() {
  const options = buildDateWheelOptions(state.date);
  state.dateWheelValue = state.date;
  renderWheel(dateWheelEl, options, state.dateWheelValue);
}

function openUserDialog() {
  if (!userDialog.open) {
    userDialog.showModal();
  }
  renderPersonWheel();
}

function closeUserDialog() {
  if (userDialog.open) {
    userDialog.close();
  }
}

function openDateDialog() {
  if (!dateDialog.open) {
    dateDialog.showModal();
  }
  renderDateWheel();
}

function closeDateDialog() {
  if (dateDialog.open) {
    dateDialog.close();
  }
}

async function applyDateSelection(selectedDate) {
  state.date = selectedDate || state.date;
  closeDateDialog();
  await refresh();
}

function renderPlan() {
  if (!state.personId) {
    listEl.innerHTML = `
      <article class="mobile-empty-state">
        <p>${escapeHtml(t('chooseNameToSee'))}</p>
        <div class="employee-actions">
          <button type="button" data-role="open-user-dialog">${escapeHtml(t('chooseEmployee'))}</button>
        </div>
      </article>
    `;
    return;
  }

  if (!state.plan.length) {
    listEl.innerHTML = `<article class="mobile-empty-state"><p>${escapeHtml(t('noChoresAssigned'))}</p></article>`;
    return;
  }

  listEl.innerHTML = state.plan
    .map((item) => {
      const completed = Boolean(item.completion);
      const overdue = !completed && Boolean(item.overdue);

      return `
        <article class="mobile-chore-row ${completed ? 'done' : ''} ${overdue ? 'overdue' : ''}">
          <button
            type="button"
            class="mobile-check-toggle ${completed ? 'checked' : ''}"
            data-role="toggle-done"
            data-chore-id="${item.chore_id}"
            data-done="${completed ? 1 : 0}"
            aria-label="${completed ? escapeHtml(t('undoCompletion')) : escapeHtml(t('markComplete'))}"
            title="${completed ? escapeHtml(t('undoCompletion')) : escapeHtml(t('markComplete'))}"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9.2 16.4 5.8 13l-1.4 1.4 4.8 4.8L20 8.4 18.6 7l-9.4 9.4z"
                fill="currentColor"
              />
            </svg>
          </button>
          <div class="mobile-chore-main">
            <h3>${escapeHtml(item.chore_name)}</h3>
            <p class="mobile-chore-meta">
              ${item.due_time ? escapeHtml(item.due_time) : ''}
            </p>
            ${item.description ? `<p class="mobile-chore-note">${escapeHtml(item.description)}</p>` : ''}
          </div>
        </article>
      `;
    })
    .join('');
}

function renderWeekOwners() {
  if (!state.weekOwners.length) {
    weekOwnersEl.innerHTML = `<article class="mobile-empty-state"><p>${escapeHtml(t('noWeekOwnersConfigured'))}</p></article>`;
    return;
  }

  weekOwnersEl.innerHTML = state.weekOwners
    .map((row) => {
      const weekNumber = weekNumberFromDateKey(row.week_start);
      const isAssigned = Boolean(row.person_name);
      const ownerLabel = isAssigned
        ? `<span class="week-owner-label">${escapeHtml(row.person_name)}</span>`
        : `<span class="week-owner-label unset">${escapeHtml(t('sourceUnassigned'))}</span>`;

      return `
        <article class="week-owner-item ${isAssigned ? 'assigned' : 'unassigned'}">
          <div class="week-owner-head">
            <span class="week-owner-weekno">${escapeHtml(t('week', { week: weekNumber }))}</span>
            <strong>${escapeHtml(formatWeekRange(row.week_start))}</strong>
          </div>
          <div class="week-owner-meta">
            <p>${escapeHtml(t('starts', { date: row.week_start }))}</p>
            <div>${ownerLabel}</div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function loadPeople() {
  state.people = await api.getPeople();

  const stored = Number(window.localStorage.getItem(PERSON_STORAGE_KEY));

  if (state.personId && !state.people.some((person) => Number(person.id) === Number(state.personId))) {
    state.personId = null;
  }

  if (!state.personId && stored && state.people.some((person) => Number(person.id) === stored)) {
    state.personId = stored;
  }

  if (!state.personId) {
    window.localStorage.removeItem(PERSON_STORAGE_KEY);
  }

  state.personWheelValue = state.personId ? String(state.personId) : null;
  renderCurrentPerson();
}

async function loadPlan() {
  if (!state.personId) {
    state.plan = [];
    renderPlan();
    return;
  }

  state.plan = await api.getMyPlan(state.date, state.personId);
  renderPlan();
}

async function loadWeekOwners() {
  const startWeek = startOfWeek(state.date);
  state.weekOwners = await api.getWeekOwners(startWeek, 8);
  renderWeekOwners();
}

async function refresh() {
  renderDayLabel();
  await loadPeople();
  await Promise.all([loadPlan(), loadWeekOwners()]);
}

async function onToggleDone(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const chooseButton = target.closest('button[data-role="open-user-dialog"]');
  if (chooseButton) {
    openUserDialog();
    return;
  }

  const button = target.closest('button[data-role="toggle-done"]');
  if (!(button instanceof HTMLButtonElement)) return;

  const choreId = Number(button.dataset.choreId);
  const isDone = button.dataset.done === '1';

  if (!state.personId) {
    openUserDialog();
    return;
  }

  try {
    if (isDone) {
      await api.unmarkDone({ chore_id: choreId, work_date: state.date });
    } else {
      await api.markDone({
        chore_id: choreId,
        work_date: state.date,
        completed_by: state.personId
      });
    }

    await loadPlan();
    if (isDone) {
      setStatus('');
    } else {
      setStatus(t('choreMarkedComplete'));
    }
  } catch (error) {
    setStatus(error.message, true);
  }
}

function shiftDay(days) {
  state.date = addDays(state.date, days);
  refresh().catch((error) => setStatus(error.message, true));
}

async function onUserSubmit(event) {
  event.preventDefault();
  const selected = Number(state.personWheelValue) || null;
  if (!selected) {
    setStatus(t('pleaseChooseName'), true);
    return;
  }

  state.personId = selected;
  window.localStorage.setItem(PERSON_STORAGE_KEY, String(selected));
  renderCurrentPerson();
  closeUserDialog();

  try {
    await loadPlan();
    setStatus('');
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onDateSubmit(event) {
  event.preventDefault();
  const selectedDate = state.dateWheelValue || state.date;
  try {
    await applyDateSelection(selectedDate);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function onTabClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const tabButton = target.closest('[data-screen-target]');
  if (!(tabButton instanceof HTMLButtonElement)) return;
  setScreen(tabButton.getAttribute('data-screen-target'));
}

async function init() {
  applyPlatformPreset();
  applyLanguage('en');

  attachWheelHandlers(personWheelEl, (value) => {
    state.personWheelValue = value;
  });

  attachWheelHandlers(dateWheelEl, (value, meta = {}) => {
    state.dateWheelValue = value;
    if (meta.source === 'click' && dateDialog.open) {
      applyDateSelection(value).catch((error) => setStatus(error.message, true));
    }
  });

  setScreen('chores');

  try {
    const settings = await api.getSettings();
    applyLanguage(settings.language);
    await refresh();
    if (!state.personId) {
      openUserDialog();
    }
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
userDialog.addEventListener('cancel', (event) => {
  if (!state.personId) {
    event.preventDefault();
  }
});

dateForm.addEventListener('submit', onDateSubmit);
dateCancelBtn.addEventListener('click', () => {
  closeDateDialog();
});

changePersonBtn.addEventListener('click', () => {
  openUserDialog();
});

openDatePickerBtn.addEventListener('click', () => {
  openDateDialog();
});

prevDayBtn.addEventListener('click', () => shiftDay(-1));
nextDayBtn.addEventListener('click', () => shiftDay(1));
listEl.addEventListener('click', onToggleDone);
tabButtons.forEach((tab) => tab.addEventListener('click', onTabClick));

init();
