import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, Clock3, Palette, Sparkles, UserRound } from 'lucide-react';
import {
  addDays,
  api,
  formatWeekRange,
  localDateFromKey,
  mondayToFridayDates,
  startOfWeek,
  todayKey,
  weekNumberFromDateKey
} from '@/lib/api';
import { localeForLanguage, normalizeLanguage, tr } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/BottomSheet';
import { useSwipeX } from '@/components/useSwipe';
import { useTheme, THEMES } from '@/lib/theme';

const STORAGE_KEY = 'moradi.ipad.person';

const TEXT = {
  en: {
    title: 'Moradi',
    subtitle: 'Weekly operations board',
    weekView: 'Week view',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    weekLabel: 'Week {number}',
    chooseWho: 'Who completed this?',
    chooseWhoHint: 'Select the person who completed this chore.',
    employee: 'Employee',
    selectFromList: 'Select from team members',
    confirm: 'Confirm',
    cancel: 'Cancel',
    noDue: 'No chores due',
    noDueHint: 'Nothing scheduled',
    unassigned: 'Unassigned',
    done: 'Done',
    open: 'Open',
    overdue: 'Overdue',
    deadline: 'Deadline',
    responsible: 'Responsible',
    doneBy: 'Done by {name}',
    completedCount: 'Done',
    pendingCount: 'Open',
    overdueCount: 'Late',
    totalCount: 'Total',
    allDone: 'All done!',
    progress: 'Progress'
  },
  no: {
    title: 'Moradi',
    subtitle: 'Ukentlig gjennomføringsboard',
    weekView: 'Ukevisning',
    previousWeek: 'Forrige uke',
    nextWeek: 'Neste uke',
    weekLabel: 'Uke {number}',
    chooseWho: 'Hvem fullførte dette?',
    chooseWhoHint: 'Velg personen som fullførte gjøremålet.',
    employee: 'Ansatt',
    selectFromList: 'Velg fra ansatte',
    confirm: 'Bekreft',
    cancel: 'Avbryt',
    noDue: 'Ingen gjøremål',
    noDueHint: 'Ingenting planlagt',
    unassigned: 'Ikke tildelt',
    done: 'Fullført',
    open: 'Åpen',
    overdue: 'Forsinket',
    deadline: 'Frist',
    responsible: 'Ansvarlig',
    doneBy: 'Fullført av {name}',
    completedCount: 'Fullført',
    pendingCount: 'Åpne',
    overdueCount: 'Forsinket',
    totalCount: 'Totalt',
    allDone: 'Alt fullført!',
    progress: 'Fremgang'
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

export function IpadPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [people, setPeople] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()));
  const [weekPlans, setWeekPlans] = useState({});
  const [error, setError] = useState('');
  const [personSheetOpen, setPersonSheetOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [slideDirection, setSlideDirection] = useState('right');

  const locale = localeForLanguage(language);
  const t = (key, vars = {}) => tr(TEXT, language, key, vars);

  const days = useMemo(() => mondayToFridayDates(weekStart), [weekStart]);

  const summary = useMemo(() => {
    const result = { done: 0, open: 0, overdue: 0, total: 0 };
    for (const dateKey of days) {
      const entries = weekPlans[dateKey] || [];
      for (const item of entries) {
        if (item.instance_disabled) continue;
        result.total += 1;
        const state = choreState(item);
        result[state] += 1;
      }
    }
    return result;
  }, [days, weekPlans]);

  const progressPercent = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  async function loadSettingsAndPeople() {
    const [settings, peopleRows] = await Promise.all([api.getSettings(), api.getPeople()]);
    setLanguage(normalizeLanguage(settings.language));
    setPeople(peopleRows);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const first = peopleRows[0] ? String(peopleRows[0].id) : '';
    const chosen = peopleRows.some((person) => String(person.id) === stored) ? stored : first;
    if (!selectedPersonId) {
      setSelectedPersonId(chosen);
    }
  }

  async function loadWeekPlan(start) {
    const weekDays = mondayToFridayDates(start);
    const plans = await Promise.all(
      weekDays.map((day) => api.getPlan(day, { includeDisabled: true, includeBeforeStart: true }))
    );

    const mapped = {};
    weekDays.forEach((day, index) => {
      mapped[day] = plans[index] || [];
    });
    setWeekPlans(mapped);
  }

  useEffect(() => {
    Promise.all([loadSettingsAndPeople(), loadWeekPlan(weekStart)]).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadWeekPlan(weekStart).catch((err) => setError(err.message));
  }, [weekStart]);

  useEffect(() => {
    if (!selectedPersonId) return;
    window.localStorage.setItem(STORAGE_KEY, String(selectedPersonId));
  }, [selectedPersonId]);

  async function toggleItem(item, dateKey) {
    setError('');
    if (item.completion) {
      await api.unmarkDone({ chore_id: item.chore_id, work_date: dateKey });
      await loadWeekPlan(weekStart);
      return;
    }

    setPendingAction({ chore_id: item.chore_id, work_date: dateKey });
    setPersonSheetOpen(true);
  }

  async function confirmCompletion() {
    if (!pendingAction || !selectedPersonId) {
      setPersonSheetOpen(false);
      return;
    }

    await api.markDone({
      chore_id: pendingAction.chore_id,
      work_date: pendingAction.work_date,
      completed_by: Number(selectedPersonId)
    });

    setPersonSheetOpen(false);
    setPendingAction(null);
    await loadWeekPlan(weekStart);
  }

  function navigateWeek(delta) {
    setSlideDirection(delta > 0 ? 'right' : 'left');
    setWeekStart((value) => addDays(value, delta * 7));
  }

  const weekSwipe = useSwipeX({
    onSwipeLeft: () => navigateWeek(1),
    onSwipeRight: () => navigateWeek(-1)
  });

  function formatDay(dateKey) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(
      localDateFromKey(dateKey)
    );
  }

  return (
    <div className='ipad-app-shell mx-auto min-h-dvh w-full max-w-[1600px] px-5 pb-6 pt-4'>
      {/* ── Header Card ─────────────────────────────── */}
      <div className='moradi-glass-panel animate-fade-in rounded-3xl p-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-[0.25em] text-theme-500'>{t('title')}</p>
            <h1 className='mt-1 text-2xl font-bold text-slate-900'>{t('subtitle')}</h1>
            <p className='mt-0.5 text-sm text-slate-500'>{t('weekView')}</p>
          </div>

          {/* Week navigator + theme */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => { const idx = THEMES.indexOf(theme); setTheme(THEMES[(idx + 1) % THEMES.length]); }}
              className='moradi-soft-button flex h-10 w-10 items-center justify-center rounded-xl'
              title='Color scheme'
            >
              <Palette className='h-4 w-4 text-theme-600' />
            </button>
            <button
              type='button'
              onClick={() => navigateWeek(-1)}
              title={t('previousWeek')}
              className='moradi-soft-button flex h-10 w-10 items-center justify-center rounded-xl'
            >
              <ChevronLeft className='h-4 w-4 text-slate-600' />
            </button>
            <div className='min-w-[260px] rounded-xl bg-white/80 px-4 py-2.5 text-center shadow-sm'
              style={{ border: '1px solid var(--theme-card-border)' }}
            >
              <p className='text-base font-bold text-slate-900'>
                {t('weekLabel', { number: weekNumberFromDateKey(weekStart) })}
              </p>
              <p className='text-xs text-slate-500'>{formatWeekRange(weekStart, locale)}</p>
            </div>
            <button
              type='button'
              onClick={() => navigateWeek(1)}
              title={t('nextWeek')}
              className='moradi-soft-button flex h-10 w-10 items-center justify-center rounded-xl'
            >
              <ChevronRight className='h-4 w-4 text-slate-600' />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className='mt-4 grid grid-cols-5 gap-3'>
          <div className='stat-pill stat-pill-primary'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-theme-600'>{t('totalCount')}</p>
            <p className='text-2xl font-bold text-theme-700'>{summary.total}</p>
          </div>
          <div className='stat-pill stat-pill-good'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-theme-600'>{t('completedCount')}</p>
            <p className='text-2xl font-bold text-theme-700'>{summary.done}</p>
          </div>
          <div className='stat-pill stat-pill-default'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>{t('pendingCount')}</p>
            <p className='text-2xl font-bold text-slate-700'>{summary.open}</p>
          </div>
          <div className='stat-pill stat-pill-bad'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>{t('overdueCount')}</p>
            <p className='text-2xl font-bold text-slate-700'>{summary.overdue}</p>
          </div>
          <div className='stat-pill stat-pill-default'>
            <p className='text-[10px] font-semibold uppercase tracking-wider text-slate-500'>{t('progress')}</p>
            <p className='text-2xl font-bold text-slate-700'>{progressPercent}%</p>
            <div className='progress-bar mt-1.5'>
              <div
                className='progress-bar-fill progress-bar-fill-primary'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {error ? <p className='mt-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700'>{error}</p> : null}
      </div>

      {/* ── Week Grid ───────────────────────────────── */}
      <div
        className='mt-4'
        onTouchStart={weekSwipe.onTouchStart}
        onTouchEnd={weekSwipe.onTouchEnd}
      >
        <div className='scroll-area-soft overflow-x-auto pb-2'>
          <div
            key={weekStart}
            className={cn(
              'grid min-w-[1260px] grid-cols-5 gap-3',
              slideDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'
            )}
          >
            {days.map((dateKey, dayIndex) => {
              const items = weekPlans[dateKey] || [];
              const isToday = dateKey === todayKey();
              const dayActive = items.filter((i) => !i.instance_disabled);
              const dayDone = dayActive.filter((i) => i.completion).length;
              const dayTotal = dayActive.length;
              const dayPercent = dayTotal > 0 ? Math.round((dayDone / dayTotal) * 100) : 0;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'animate-stagger-in',
                    `stagger-${dayIndex + 1}`,
                    'day-column',
                    isToday && 'day-column-today'
                  )}
                >
                  {/* Day header */}
                  <div className='border-b border-slate-200/60 px-3 pb-2 pt-3'>
                    <div className='flex items-center justify-between'>
                      <p className={cn(
                        'text-sm font-bold',
                        isToday ? 'text-theme-700' : 'text-slate-900'
                      )}>
                        {formatDay(dateKey)}
                      </p>
                      {isToday ? (
                        <span className='h-2 w-2 rounded-full bg-theme-500' />
                      ) : null}
                    </div>
                    {dayTotal > 0 ? (
                      <div className='mt-1.5'>
                        <div className='flex items-center justify-between text-[10px]'>
                          <span className='font-medium text-slate-400'>{dayDone}/{dayTotal}</span>
                          {dayPercent === 100 ? (
                            <Sparkles className='h-3 w-3 text-theme-500' />
                          ) : null}
                        </div>
                        <div className='progress-bar mt-0.5'>
                          <div
                            className='progress-bar-fill progress-bar-fill-primary'
                            style={{ width: `${dayPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Day items */}
                  <div className='space-y-2 px-2.5 pb-3 pt-2.5'>
                    {items.length ? (
                      items.map((item, itemIndex) => {
                        const state = choreState(item);
                        return (
                          <div
                            key={`${dateKey}-${item.chore_id}`}
                            className={cn(
                              'animate-stagger-in rounded-xl border p-2.5 transition-all duration-200',
                              `stagger-${Math.min(itemIndex + 1, 10)}`,
                              item.instance_disabled
                                ? 'chore-card-disabled'
                                : state === 'done'
                                  ? 'chore-card-done'
                                  : state === 'overdue'
                                    ? 'chore-card-overdue'
                                    : 'chore-card-open'
                            )}
                          >
                            <div className='flex items-start gap-2'>
                              <button
                                type='button'
                                className={cn(
                                  'check-circle mt-0.5 h-8 w-8 shrink-0',
                                  state === 'done' && 'check-circle-done',
                                  state === 'overdue' && 'check-circle-overdue',
                                  state === 'open' && 'check-circle-open',
                                  item.instance_disabled && 'opacity-40'
                                )}
                                onClick={() => toggleItem(item, dateKey).catch((err) => setError(err.message))}
                                disabled={Boolean(item.instance_disabled)}
                              >
                                {state === 'done' ? (
                                  <Check className='h-4 w-4 animate-check-bounce' />
                                ) : (
                                  <Circle className='h-4 w-4' />
                                )}
                              </button>

                              <div className='min-w-0 flex-1'>
                                <p className={cn(
                                  'text-sm font-semibold leading-tight',
                                  state === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'
                                )}>
                                  {item.chore_name}
                                </p>

                                <div className='mt-1 flex flex-wrap gap-1'>
                                  {item.responsible_person ? (
                                    <span className='inline-flex items-center gap-0.5 rounded-full bg-theme-100 px-1.5 py-0.5 text-[10px] font-medium text-theme-700'>
                                      <UserRound className='h-2.5 w-2.5' />
                                      {item.responsible_person.name}
                                    </span>
                                  ) : null}
                                  {item.due_time ? (
                                    <span className='inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600'>
                                      <Clock3 className='h-2.5 w-2.5' />
                                      {item.due_time}
                                    </span>
                                  ) : null}
                                </div>

                                {item.completion?.completed_by_name ? (
                                  <p className='mt-0.5 text-[10px] text-slate-400'>
                                    {t('doneBy', { name: item.completion.completed_by_name })}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className='flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center'>
                        <p className='text-xs font-medium text-slate-400'>{t('noDue')}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Person Bottom Sheet ────────────────────── */}
      <BottomSheet
        open={personSheetOpen}
        onClose={() => { setPersonSheetOpen(false); setPendingAction(null); }}
        title={t('chooseWho')}
        description={t('chooseWhoHint')}
      >
        <div className='space-y-2 pt-2'>
          {people.map((person) => {
            const active = String(person.id) === String(selectedPersonId);
            return (
              <button
                key={person.id}
                type='button'
                onClick={() => {
                  setSelectedPersonId(String(person.id));
                  confirmCompletion().catch((err) => setError(err.message));
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
                  <span className='text-xs font-medium text-theme-500'>{t('confirm')}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
