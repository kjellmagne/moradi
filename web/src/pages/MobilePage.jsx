import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CalendarDays, Check, ChevronLeft, ChevronRight, ListChecks, Settings2, Sparkles, UserRound } from 'lucide-react';
import {
  addDays,
  api,
  formatWeekRange,
  localDateFromKey,
  startOfWeek,
  todayKey,
  toDateKey,
  weekNumberFromDateKey
} from '@/lib/api';
import { localeForLanguage, normalizeLanguage, tr } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/BottomSheet';
import { useSwipeX } from '@/components/useSwipe';
import { useTheme, THEMES, THEME_COLORS } from '@/lib/theme';

const STORAGE_KEY = 'moradi.mobile.person';

const TEXT = {
  en: {
    title: 'Moradi',
    subtitle: 'Daily checkoff',
    choosePerson: 'Choose person',
    whoAmI: 'Who am I?',
    selectFromList: 'Select from the employee list',
    notSelected: 'Not selected',
    you: 'You',
    chores: 'Chores',
    weeks: 'Week owners',
    settings: 'Settings',
    themeChoice: 'Theme',
    currentPerson: 'Current person',
    changePerson: 'Change person',
    noChores: 'No chores assigned for this day.',
    noChoresHint: 'Enjoy the free time!',
    noWeeks: 'No week owners configured.',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    openCalendar: 'Open calendar',
    pickDate: 'Pick date',
    date: 'Date',
    deadline: 'Deadline',
    deadlineExpired: 'Deadline passed',
    unassigned: 'Unassigned',
    done: 'Done',
    open: 'Open',
    overdue: 'Overdue',
    markDone: 'Mark done',
    undo: 'Undo',
    setPersonFirst: 'Choose person before checkoff.',
    save: 'Save',
    cancel: 'Cancel',
    responsible: 'Responsible',
    weekLabel: 'Week {number}',
    starts: 'Starts {date}',
    doneBy: 'Done by {name}',
    completedCount: 'Done',
    pendingCount: 'Open',
    overdueCount: 'Late',
    swipeHint: 'Swipe right to complete',
    allDone: 'All done!',
    allDoneHint: 'Great work today'
  },
  no: {
    title: 'Moradi',
    subtitle: 'Daglig avkrysning',
    choosePerson: 'Velg person',
    whoAmI: 'Hvem er jeg?',
    selectFromList: 'Velg fra ansattlisten',
    notSelected: 'Ikke valgt',
    you: 'Deg',
    chores: 'Gjøremål',
    weeks: 'Ukeansvar',
    settings: 'Innstillinger',
    themeChoice: 'Tema',
    currentPerson: 'Aktiv person',
    changePerson: 'Endre person',
    noChores: 'Ingen gjøremål denne dagen.',
    noChoresHint: 'Nyt fritiden!',
    noWeeks: 'Ingen ukeansvar satt.',
    previousDay: 'Forrige dag',
    nextDay: 'Neste dag',
    previousMonth: 'Forrige måned',
    nextMonth: 'Neste måned',
    openCalendar: 'Åpne kalender',
    pickDate: 'Velg dato',
    date: 'Dato',
    deadline: 'Frist',
    deadlineExpired: 'Frist utløpt',
    unassigned: 'Ikke tildelt',
    done: 'Fullført',
    open: 'Åpen',
    overdue: 'Forsinket',
    markDone: 'Marker',
    undo: 'Angre',
    setPersonFirst: 'Velg person før avkrysning.',
    save: 'Lagre',
    cancel: 'Avbryt',
    responsible: 'Ansvarlig',
    weekLabel: 'Uke {number}',
    starts: 'Starter {date}',
    doneBy: 'Fullført av {name}',
    completedCount: 'Fullført',
    pendingCount: 'Åpne',
    overdueCount: 'Forsinket',
    swipeHint: 'Sveip for å fullføre',
    allDone: 'Alt fullført!',
    allDoneHint: 'Bra jobba i dag'
  }
};

function choreState(item) {
  if (item.completion) return 'done';
  if (item.overdue) return 'overdue';
  return 'open';
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function MobilePage() {
  const { accessKey = '' } = useParams();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [people, setPeople] = useState([]);
  const [personId, setPersonId] = useState('');
  const [date, setDate] = useState(todayKey());
  const [plan, setPlan] = useState([]);
  const [weekOwners, setWeekOwners] = useState([]);
  const [error, setError] = useState('');
  const [personSheetOpen, setPersonSheetOpen] = useState(false);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const current = localDateFromKey(todayKey());
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const [activeTab, setActiveTab] = useState('chores');
  const [slideDirection, setSlideDirection] = useState('right');

  const locale = localeForLanguage(language);
  const t = (key, vars = {}) => tr(TEXT, language, key, vars);

  const selectedPerson = useMemo(
    () => people.find((person) => String(person.id) === String(personId)) || null,
    [people, personId]
  );

  const summary = useMemo(() => {
    const result = { done: 0, open: 0, overdue: 0, total: 0 };
    for (const item of plan) {
      result.total += 1;
      const state = choreState(item);
      result[state] += 1;
    }
    return result;
  }, [plan]);

  const selectedDateObj = useMemo(() => localDateFromKey(date), [date]);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendarMonth),
    [calendarMonth, locale]
  );

  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, monday.getDate() + index))
    );
  }, [locale]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const weekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < weekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth]);

  async function loadAll() {
    const bootstrap = await api.getMobileBootstrap(accessKey);
    const settings = bootstrap?.settings || {};
    const peopleRows = Array.isArray(bootstrap?.people) ? bootstrap.people : [];
    const normalized = normalizeLanguage(settings.language);
    setLanguage(normalized);
    setPeople(peopleRows);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const firstPerson = peopleRows[0] ? String(peopleRows[0].id) : '';
    const nextPerson = peopleRows.some((p) => String(p.id) === stored) ? stored : firstPerson;
    setPersonId(nextPerson);

    const weekStart = startOfWeek(date);
    const [planRows, ownerRows] = await Promise.all([
      api.getMobilePlan(date, accessKey),
      api.getMobileWeekOwners(weekStart, 8, accessKey)
    ]);
    setPlan(planRows);
    setWeekOwners(ownerRows);
  }

  async function reloadDate(nextDate) {
    const weekStart = startOfWeek(nextDate);
    const [planRows, ownerRows] = await Promise.all([
      api.getMobilePlan(nextDate, accessKey),
      api.getMobileWeekOwners(weekStart, 8, accessKey)
    ]);
    setPlan(planRows);
    setWeekOwners(ownerRows);
  }

  useEffect(() => {
    if (!String(accessKey || '').trim()) {
      setError('Mobile access key missing');
      return;
    }
    loadAll().catch((err) => setError(err.message));
  }, [accessKey]);

  useEffect(() => {
    if (!people.length || !personId) return;
    window.localStorage.setItem(STORAGE_KEY, String(personId));
  }, [personId, people.length]);

  useEffect(() => {
    if (!String(accessKey || '').trim()) {
      return;
    }
    reloadDate(date).catch((err) => setError(err.message));
  }, [date, accessKey]);

  async function toggle(item) {
    setError('');
    const checker = personId || item.responsible_person?.id;
    if (!checker) {
      setError(t('setPersonFirst'));
      setPersonSheetOpen(true);
      return;
    }

    if (item.completion) {
      await api.unmarkMobileDone({ chore_id: item.chore_id, work_date: date }, accessKey);
    } else {
      await api.markMobileDone(
        { chore_id: item.chore_id, work_date: date, completed_by: Number(checker) },
        accessKey
      );
    }

    const rows = await api.getMobilePlan(date, accessKey);
    setPlan(rows);
  }

  function navigateDay(delta) {
    setSlideDirection(delta > 0 ? 'right' : 'left');
    setDate((value) => addDays(value, delta));
  }

  const dateSwipe = useSwipeX({
    onSwipeLeft: () => navigateDay(1),
    onSwipeRight: () => navigateDay(-1)
  });

  function openDatePicker() {
    setCalendarMonth(new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1));
    setCalendarSheetOpen(true);
  }

  function formatDateHeading(dateKey) {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
      localDateFromKey(dateKey)
    );
  }

  function formatShortDate(dateKey) {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
      localDateFromKey(dateKey)
    );
  }

  function shiftCalendarMonth(delta) {
    setCalendarMonth((value) => new Date(value.getFullYear(), value.getMonth() + delta, 1));
  }

  function themeLabel(id) {
    if (language === 'no') {
      if (id === 'ocean') return 'Havblå';
      if (id === 'sunset') return 'Solnedgang';
      return 'Violet';
    }
    if (id === 'ocean') return 'Ocean';
    if (id === 'sunset') return 'Sunset';
    return 'Violet';
  }

  return (
    <div className='mobile-app-shell mx-auto w-full max-w-[430px] pb-[calc(env(safe-area-inset-bottom)+88px)]'>
      <header className='iphone-top-chrome sticky top-0 z-20'>
        <div className='mx-4 flex items-center justify-between gap-2 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)]'>
          <p className='iphone-app-title'>{t('title')}</p>
          <button
            type='button'
            onClick={() => setPersonSheetOpen(true)}
            className='iphone-person-link'
          >
            <p className='iphone-person-subtle truncate'>
              {selectedPerson?.name || t('choosePerson')}
            </p>
          </button>
        </div>

        <div className='iphone-date-rail mx-4 mb-2'>
          <button
            type='button'
            onClick={() => navigateDay(-1)}
            title={t('previousDay')}
            className='iphone-date-nav'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>

          <div className='relative min-w-0 flex-1'>
            <button
              type='button'
              onClick={openDatePicker}
              title={t('openCalendar')}
              className='iphone-date-center'
            >
              <span className='truncate'>{formatDateHeading(date)}</span>
            </button>
          </div>

          <button
            type='button'
            onClick={() => navigateDay(1)}
            title={t('nextDay')}
            className='iphone-date-nav'
          >
            <ChevronRight className='h-5 w-5' />
          </button>
        </div>
      </header>

      {error ? <p className='mx-4 mt-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700'>{error}</p> : null}

      <div
        className='mt-3 px-4'
        onTouchStart={dateSwipe.onTouchStart}
        onTouchEnd={dateSwipe.onTouchEnd}
      >
        {activeTab === 'chores' ? (
          <div key={date} className={slideDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'}>
            {plan.length ? (
              <div className='space-y-3'>
                {summary.total > 0 && summary.done === summary.total ? (
                  <div className='iphone-success-card animate-pop-in'>
                    <Sparkles className='mb-2 h-7 w-7 text-theme-500' />
                    <p className='text-lg font-bold text-slate-900'>{t('allDone')}</p>
                    <p className='text-sm text-slate-500'>{t('allDoneHint')}</p>
                  </div>
                ) : null}

                {plan.map((item, index) => {
                  const state = choreState(item);
                  return (
                    <article
                      key={`${item.chore_id}-${item.work_date}`}
                      className={cn(
                        'iphone-task-card animate-stagger-in',
                        `stagger-${Math.min(index + 1, 10)}`,
                        state === 'done' && 'iphone-task-card-done',
                        state === 'overdue' && 'iphone-task-card-overdue'
                      )}
                    >
                      <div className='flex items-start gap-3'>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2'>
                            <ListChecks className='h-4 w-4 shrink-0 text-slate-500' />
                            <p className={cn('truncate text-[1.02rem] font-semibold text-slate-900', state === 'done' && 'text-slate-500 line-through')}>
                              {item.chore_name}
                            </p>
                          </div>
                          <div className='iphone-task-divider' />
                          <div className='space-y-1.5'>
                            <div className='iphone-task-meta-row'>
                              <UserRound className='h-4 w-4' />
                              <span>{item.responsible_person?.name || t('unassigned')}</span>
                            </div>
                            {item.due_time ? (
                              <div className='iphone-task-meta-row'>
                                {state === 'overdue' ? (
                                  <AlertCircle className='h-4 w-4 shrink-0 text-red-600' />
                                ) : (
                                  <CalendarDays className='h-4 w-4 text-slate-500' />
                                )}
                                <span className={cn(state === 'overdue' && 'font-medium text-red-600')}>
                                  {state === 'overdue' ? t('deadlineExpired') : t('deadline')}: {item.due_time}
                                </span>
                              </div>
                            ) : null}
                            {item.completion?.completed_by_name ? (
                              <span className='iphone-done-tag'>{t('doneBy', { name: item.completion.completed_by_name })}</span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type='button'
                          onClick={() => toggle(item).catch((err) => setError(err.message))}
                          className={cn(
                            'iphone-check-btn',
                            state === 'done'
                              ? 'iphone-check-btn-done'
                              : state === 'overdue'
                                ? 'iphone-check-btn-overdue'
                                : 'iphone-check-btn-open'
                          )}
                        >
                          {state === 'done' ? <Check className='h-6 w-6' /> : <span className='iphone-check-empty' aria-hidden='true' />}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className='empty-state animate-fade-in-up py-16'>
                <CalendarDays className='mb-3 h-12 w-12 text-slate-300' />
                <p className='text-base font-semibold text-slate-500'>{t('noChores')}</p>
                <p className='mt-1 text-sm text-slate-400'>{t('noChoresHint')}</p>
              </div>
            )}
          </div>
        ) : activeTab === 'weeks' ? (
          <div className='animate-fade-in space-y-2.5'>
            {weekOwners.length ? (
              weekOwners.map((row, index) => (
                <article key={row.week_start} className={cn('iphone-week-card animate-stagger-in', `stagger-${Math.min(index + 1, 10)}`)}>
                  <div className='iphone-week-number'>{weekNumberFromDateKey(row.week_start)}</div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-slate-900'>{t('weekLabel', { number: weekNumberFromDateKey(row.week_start) })}</p>
                    <p className='text-xs text-slate-500'>{formatWeekRange(row.week_start, locale)}</p>
                  </div>
                  <span
                    className={cn(
                      'iphone-week-owner',
                      row.person_name ? 'iphone-week-owner-assigned' : 'iphone-week-owner-unassigned'
                    )}
                  >
                    {row.person_name || t('unassigned')}
                  </span>
                </article>
              ))
            ) : (
              <div className='empty-state animate-fade-in-up py-16'>
                <CalendarDays className='mb-3 h-12 w-12 text-slate-300' />
                <p className='text-base font-semibold text-slate-500'>{t('noWeeks')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className='animate-fade-in space-y-3'>
            <section className='iphone-settings-card'>
              <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>{t('currentPerson')}</p>
              <button type='button' className='iphone-setting-row mt-2' onClick={() => setPersonSheetOpen(true)}>
                <div className='person-avatar h-9 w-9 text-xs'>{initials(selectedPerson?.name)}</div>
                <div className='min-w-0 flex-1 text-left'>
                  <p className='truncate text-sm font-semibold text-slate-900'>{selectedPerson?.name || t('choosePerson')}</p>
                </div>
                <span className='text-xs font-medium text-theme-600'>{t('changePerson')}</span>
              </button>
            </section>

            <section className='iphone-settings-card'>
              <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>{t('themeChoice')}</p>
              <div className='iphone-theme-grid mt-2'>
                {THEMES.map((id) => (
                  <button
                    key={id}
                    type='button'
                    onClick={() => setTheme(id)}
                    className={cn('iphone-theme-option', theme === id && 'iphone-theme-option-active')}
                  >
                    <div className='iphone-theme-swatches'>
                      <span style={{ background: THEME_COLORS[id][0] }} />
                      <span style={{ background: THEME_COLORS[id][1] }} />
                    </div>
                    <span>{themeLabel(id)}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <nav className='iphone-tabbar fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2'>
        <div className='iphone-tabbar-inner'>
          <button
            type='button'
            onClick={() => setActiveTab('chores')}
            className={cn('iphone-tab-btn', activeTab === 'chores' ? 'iphone-tab-btn-active' : 'iphone-tab-btn-inactive')}
          >
            <ListChecks className='h-5 w-5' />
            <span>{t('chores')}</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('weeks')}
            className={cn(
              'iphone-tab-btn border-l border-slate-200',
              activeTab === 'weeks' ? 'iphone-tab-btn-active' : 'iphone-tab-btn-inactive'
            )}
          >
            <CalendarDays className='h-5 w-5' />
            <span>{t('weeks')}</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('settings')}
            className={cn(
              'iphone-tab-btn border-l border-slate-200',
              activeTab === 'settings' ? 'iphone-tab-btn-active' : 'iphone-tab-btn-inactive'
            )}
          >
            <Settings2 className='h-5 w-5' />
            <span>{t('settings')}</span>
          </button>
        </div>
      </nav>

      {/* ── Person Bottom Sheet ────────────────────────── */}
      <BottomSheet
        open={personSheetOpen}
        onClose={() => setPersonSheetOpen(false)}
        title={t('choosePerson')}
        description={t('selectFromList')}
        sheetClassName='mx-auto max-w-[430px]'
      >
        <div className='space-y-2 pt-2'>
          {people.length ? (
            people.map((person) => {
              const active = String(person.id) === String(personId);
              return (
                <button
                  key={person.id}
                  type='button'
                  onClick={() => {
                    setPersonId(String(person.id));
                    setPersonSheetOpen(false);
                  }}
                  className={cn(
                    'person-select-btn',
                    active ? 'person-select-btn-active' : 'person-select-btn-inactive'
                  )}
                >
                  <div className={cn(
                    'person-avatar h-10 w-10 shrink-0',
                    active && 'ring-2 ring-theme-400 ring-offset-2'
                  )}>
                    {initials(person.name)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-slate-900'>{person.name}</p>
                    {person.email ? <p className='truncate text-xs text-slate-500'>{person.email}</p> : null}
                  </div>
                  {active ? (
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-theme-500 text-white'>
                      <Check className='h-3.5 w-3.5' />
                    </div>
                  ) : null}
                </button>
              );
            })
          ) : (
            <p className='py-4 text-center text-sm text-slate-500'>{t('notSelected')}</p>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        open={calendarSheetOpen}
        onClose={() => setCalendarSheetOpen(false)}
        title={t('pickDate')}
        sheetClassName='mx-auto max-w-[430px]'
      >
        <div className='iphone-calendar'>
          <div className='iphone-calendar-header'>
            <button
              type='button'
              onClick={() => shiftCalendarMonth(-1)}
              className='iphone-calendar-nav'
              title={t('previousMonth')}
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <p className='iphone-calendar-title'>{monthLabel}</p>
            <button
              type='button'
              onClick={() => shiftCalendarMonth(1)}
              className='iphone-calendar-nav'
              title={t('nextMonth')}
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>

          <div className='iphone-calendar-weekdays'>
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className='iphone-calendar-grid'>
            {calendarCells.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} className='iphone-calendar-empty' />;
              }
              const key = toDateKey(cell);
              const selected = key === date;
              const today = key === todayKey();
              return (
                <button
                  key={key}
                  type='button'
                  onClick={() => {
                    setDate(key);
                    setCalendarSheetOpen(false);
                  }}
                  className={cn(
                    'iphone-calendar-day',
                    selected && 'iphone-calendar-day-selected',
                    today && !selected && 'iphone-calendar-day-today'
                  )}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
