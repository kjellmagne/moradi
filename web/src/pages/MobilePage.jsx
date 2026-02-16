import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Clock3, ListChecks, Palette, Sparkles, UserRound } from 'lucide-react';
import {
  addDays,
  api,
  formatWeekRange,
  localDateFromKey,
  startOfWeek,
  todayKey,
  weekNumberFromDateKey
} from '@/lib/api';
import { localeForLanguage, normalizeLanguage, tr } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { BottomSheet } from '@/components/BottomSheet';
import { useSwipeX, useSwipeCard } from '@/components/useSwipe';
import { useTheme, THEMES } from '@/lib/theme';

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
    noChores: 'No chores assigned for this day.',
    noChoresHint: 'Enjoy the free time!',
    noWeeks: 'No week owners configured.',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    openCalendar: 'Open calendar',
    pickDate: 'Pick date',
    date: 'Date',
    deadline: 'Deadline',
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
    noChores: 'Ingen gjøremål denne dagen.',
    noChoresHint: 'Nyt fritiden!',
    noWeeks: 'Ingen ukeansvar satt.',
    previousDay: 'Forrige dag',
    nextDay: 'Neste dag',
    openCalendar: 'Åpne kalender',
    pickDate: 'Velg dato',
    date: 'Dato',
    deadline: 'Frist',
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

function ChoreCard({ item, index, t, onToggle, disabled }) {
  const state = choreState(item);
  const swipe = useSwipeCard({
    onSwipeRight: state !== 'done' ? onToggle : undefined,
    enabled: state !== 'done' && !disabled
  });

  return (
    <div
      ref={swipe.ref}
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
      className={cn(
        'chore-card animate-stagger-in',
        `stagger-${Math.min(index + 1, 10)}`,
        state === 'done' && 'chore-card-done',
        state === 'overdue' && 'chore-card-overdue',
        state === 'open' && 'chore-card-open'
      )}
    >
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            'check-circle h-11 w-11 shrink-0 touch-target',
            state === 'done' && 'check-circle-done',
            state === 'overdue' && 'check-circle-overdue',
            state === 'open' && 'check-circle-open'
          )}
        >
          {state === 'done' ? (
            <Check className='h-5 w-5 animate-check-bounce' />
          ) : (
            <Circle className='h-5 w-5' />
          )}
        </button>

        <div className='min-w-0 flex-1'>
          <p className={cn(
            'text-[15px] font-semibold leading-tight',
            state === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'
          )}>
            {item.chore_name}
          </p>

          <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
            {item.responsible_person ? (
              <span className='inline-flex items-center gap-1 rounded-full bg-theme-100 px-2 py-0.5 text-[11px] font-medium text-theme-700'>
                <UserRound className='h-3 w-3' />
                {item.responsible_person.name}
              </span>
            ) : (
              <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500'>
                {t('unassigned')}
              </span>
            )}
            {item.due_time ? (
              <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600'>
                <Clock3 className='h-3 w-3' />
                {item.due_time}
              </span>
            ) : null}
          </div>

          {item.completion?.completed_by_name ? (
            <p className='mt-1 text-xs text-slate-400'>
              {t('doneBy', { name: item.completion.completed_by_name })}
            </p>
          ) : null}
        </div>

        {state !== 'done' && (
          <div className='shrink-0'>
            <ChevronRight className='h-4 w-4 text-slate-300' />
          </div>
        )}
      </div>
    </div>
  );
}

export function MobilePage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [people, setPeople] = useState([]);
  const [personId, setPersonId] = useState('');
  const [date, setDate] = useState(todayKey());
  const [plan, setPlan] = useState([]);
  const [weekOwners, setWeekOwners] = useState([]);
  const [error, setError] = useState('');
  const [personSheetOpen, setPersonSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chores');
  const [slideDirection, setSlideDirection] = useState('right');
  const dateInputRef = useRef(null);

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

  const progressPercent = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  async function loadAll() {
    const [settings, peopleRows] = await Promise.all([api.getSettings(), api.getPeople()]);
    const normalized = normalizeLanguage(settings.language);
    setLanguage(normalized);
    setPeople(peopleRows);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    const firstPerson = peopleRows[0] ? String(peopleRows[0].id) : '';
    const nextPerson = peopleRows.some((p) => String(p.id) === stored) ? stored : firstPerson;
    setPersonId(nextPerson);

    const weekStart = startOfWeek(date);
    const [planRows, ownerRows] = await Promise.all([api.getPlan(date), api.getWeekOwners(weekStart, 8)]);
    setPlan(planRows);
    setWeekOwners(ownerRows);
  }

  async function reloadDate(nextDate) {
    const weekStart = startOfWeek(nextDate);
    const [planRows, ownerRows] = await Promise.all([api.getPlan(nextDate), api.getWeekOwners(weekStart, 8)]);
    setPlan(planRows);
    setWeekOwners(ownerRows);
  }

  useEffect(() => {
    loadAll().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!people.length || !personId) return;
    window.localStorage.setItem(STORAGE_KEY, String(personId));
  }, [personId, people.length]);

  useEffect(() => {
    reloadDate(date).catch((err) => setError(err.message));
  }, [date]);

  async function toggle(item) {
    setError('');
    const checker = personId || item.responsible_person?.id;
    if (!checker) {
      setError(t('setPersonFirst'));
      setPersonSheetOpen(true);
      return;
    }

    if (item.completion) {
      await api.unmarkDone({ chore_id: item.chore_id, work_date: date });
    } else {
      await api.markDone({ chore_id: item.chore_id, work_date: date, completed_by: Number(checker) });
    }

    const rows = await api.getPlan(date);
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
    if (!dateInputRef.current) return;
    if (typeof dateInputRef.current.showPicker === 'function') {
      dateInputRef.current.showPicker();
      return;
    }
    dateInputRef.current.focus();
  }

  function formatDateLabel(dateKey) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(
      localDateFromKey(dateKey)
    );
  }

  function formatShortDate(dateKey) {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(
      localDateFromKey(dateKey)
    );
  }

  const isToday = date === todayKey();

  return (
    <div className='mobile-app-shell mx-auto w-full max-w-xl pb-6 pt-2'>
      {/* ── Header ────────────────────────────────────── */}
      <div className='sticky top-0 z-20 px-4 pt-2 pb-3'>
        <div className='moradi-glass-panel rounded-3xl p-4'>
          {/* Top row: brand + person + theme */}
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-[0.25em] text-theme-500'>{t('title')}</p>
              <h1 className='mt-0.5 text-lg font-bold text-slate-900'>{t('subtitle')}</h1>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => { const idx = THEMES.indexOf(theme); setTheme(THEMES[(idx + 1) % THEMES.length]); }}
                className='flex h-8 w-8 items-center justify-center rounded-full bg-theme-100 transition-all active:scale-95'
                title='Color scheme'
              >
                <Palette className='h-4 w-4 text-theme-600' />
              </button>
              <button
                type='button'
                onClick={() => setPersonSheetOpen(true)}
                className='flex items-center gap-2 rounded-full bg-theme-100 py-1.5 pl-1.5 pr-3 transition-all duration-200 active:scale-95'
              >
                <div className='person-avatar h-7 w-7 text-xs'>
                  {initials(selectedPerson?.name)}
                </div>
                <span className='text-sm font-semibold text-theme-700'>
                  {selectedPerson?.name?.split(' ')[0] || t('choosePerson')}
                </span>
              </button>
            </div>
          </div>

          {/* Date navigation */}
          <div className='mt-3 flex items-center gap-2'>
            <button
              type='button'
              onClick={() => navigateDay(-1)}
              title={t('previousDay')}
              className='moradi-soft-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'
            >
              <ChevronLeft className='h-4 w-4 text-slate-600' />
            </button>

            <div className='relative min-w-0 flex-1'>
              <button
                type='button'
                onClick={openDatePicker}
                className='w-full rounded-xl bg-white/80 px-3 py-2 text-left shadow-sm transition-all duration-200 active:scale-[0.98]'
                style={{ border: '1px solid var(--theme-card-border)' }}
              >
                <p className='text-[10px] font-semibold uppercase tracking-wider text-theme-400'>
                  {isToday ? '● ' : ''}{t('date')}
                </p>
                <p className='truncate text-sm font-bold text-slate-900'>{formatDateLabel(date)}</p>
              </button>
              <Input
                ref={dateInputRef}
                type='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className='pointer-events-none absolute inset-0 h-full w-full opacity-0'
                aria-label={t('pickDate')}
                tabIndex={-1}
              />
              <button
                type='button'
                variant='ghost'
                title={t('openCalendar')}
                onClick={openDatePicker}
                className='absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-theme-400 transition-colors hover:bg-theme-50'
              >
                <Calendar className='h-4 w-4' />
              </button>
            </div>

            <button
              type='button'
              onClick={() => navigateDay(1)}
              title={t('nextDay')}
              className='moradi-soft-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'
            >
              <ChevronRight className='h-4 w-4 text-slate-600' />
            </button>
          </div>

          {/* Progress bar + stats */}
          <div className='mt-3'>
            <div className='flex items-center justify-between text-xs'>
              <span className='font-semibold text-slate-700'>{progressPercent}%</span>
              <span className='text-slate-400'>{summary.done}/{summary.total}</span>
            </div>
            <div className='progress-bar mt-1'>
              <div
                className='progress-bar-fill progress-bar-fill-primary'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className='mt-2 grid grid-cols-3 gap-2'>
              <div className='stat-pill stat-pill-good'>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-theme-600'>{t('completedCount')}</p>
                <p className='text-xl font-bold text-theme-700'>{summary.done}</p>
              </div>
              <div className='stat-pill stat-pill-default'>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>{t('pendingCount')}</p>
                <p className='text-xl font-bold text-slate-700'>{summary.open}</p>
              </div>
              <div className='stat-pill stat-pill-bad'>
                <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>{t('overdueCount')}</p>
                <p className='text-xl font-bold text-slate-700'>{summary.overdue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? <p className='mx-4 mt-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700'>{error}</p> : null}

      {/* ── Tab Bar ────────────────────────────────────── */}
      <div className='px-4 pt-2'>
        <div className='tab-bar grid grid-cols-2'>
          <button
            type='button'
            onClick={() => setActiveTab('chores')}
            className={cn('tab-bar-item', activeTab === 'chores' ? 'tab-bar-item-active' : 'tab-bar-item-inactive')}
          >
            <ListChecks className='h-4 w-4' />
            {t('chores')}
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('weeks')}
            className={cn('tab-bar-item', activeTab === 'weeks' ? 'tab-bar-item-active' : 'tab-bar-item-inactive')}
          >
            <CalendarDays className='h-4 w-4' />
            {t('weeks')}
          </button>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div
        className='mt-3 px-4'
        onTouchStart={dateSwipe.onTouchStart}
        onTouchEnd={dateSwipe.onTouchEnd}
      >
        {activeTab === 'chores' ? (
          <div key={date} className={slideDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'}>
            {plan.length ? (
              <div className='space-y-2.5'>
                {summary.total > 0 && summary.done === summary.total ? (
                  <div className='moradi-glass-strong animate-pop-in mb-4 flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white/90 px-6 py-6 text-center'>
                    <Sparkles className='mb-2 h-8 w-8 text-theme-500' />
                    <p className='text-lg font-bold text-slate-900'>{t('allDone')}</p>
                    <p className='text-sm text-slate-500'>{t('allDoneHint')}</p>
                  </div>
                ) : null}
                {plan.map((item, index) => (
                  <ChoreCard
                    key={`${item.chore_id}-${item.work_date}`}
                    item={item}
                    index={index}
                    t={t}
                    onToggle={() => toggle(item).catch((err) => setError(err.message))}
                    disabled={false}
                  />
                ))}
              </div>
            ) : (
              <div className='empty-state animate-fade-in-up py-16'>
                <CalendarDays className='mb-3 h-12 w-12 text-slate-300' />
                <p className='text-base font-semibold text-slate-500'>{t('noChores')}</p>
                <p className='mt-1 text-sm text-slate-400'>{t('noChoresHint')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className='animate-fade-in space-y-2.5'>
            {weekOwners.length ? (
              weekOwners.map((row, index) => (
                <div
                  key={row.week_start}
                  className={cn('week-card animate-stagger-in', `stagger-${Math.min(index + 1, 10)}`)}
                >
                  <div className='week-number-badge'>
                    {weekNumberFromDateKey(row.week_start)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-bold text-slate-900'>{formatWeekRange(row.week_start, locale)}</p>
                    <p className='text-xs text-slate-500'>
                      {t('weekLabel', { number: weekNumberFromDateKey(row.week_start) })} · {t('starts', { date: formatShortDate(row.week_start) })}
                    </p>
                  </div>
                  <span className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    row.person_name
                      ? 'bg-theme-100 text-theme-700'
                      : 'bg-slate-100 text-slate-500'
                  )}>
                    {row.person_name || t('unassigned')}
                  </span>
                </div>
              ))
            ) : (
              <div className='empty-state animate-fade-in-up py-16'>
                <CalendarDays className='mb-3 h-12 w-12 text-slate-300' />
                <p className='text-base font-semibold text-slate-500'>{t('noWeeks')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Person Bottom Sheet ────────────────────────── */}
      <BottomSheet
        open={personSheetOpen}
        onClose={() => setPersonSheetOpen(false)}
        title={t('choosePerson')}
        description={t('selectFromList')}
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
    </div>
  );
}
