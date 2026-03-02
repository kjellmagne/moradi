import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Settings2,
  UserRound
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useSwipeX } from '@/components/useSwipe';
import { useTheme, THEMES, THEME_COLORS } from '@/lib/theme';

const STORAGE_KEY = 'moradi.ipad.person';

const TEXT = {
  en: {
    title: 'Moradi',
    subtitle: 'Weekly checkoff',
    chores: 'Chores',
    weeks: 'Week owners',
    settings: 'Settings',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    weekLabel: 'Week {number}',
    chooseWho: 'Who completed this?',
    chooseWhoHint: 'Select the person who completed this chore.',
    choosePerson: 'Choose person',
    selectFromList: 'Select from team members',
    currentPerson: 'Current person',
    changePerson: 'Change person',
    themeChoice: 'Theme',
    confirm: 'Confirm',
    noDue: 'No chores due',
    noWeeks: 'No week owners configured.',
    unassigned: 'Unassigned',
    responsible: 'Responsible',
    status: 'Status',
    description: 'Description',
    noDescription: 'No description',
    deadline: 'Deadline',
    deadlineExpired: 'Deadline passed',
    done: 'Done',
    open: 'Open',
    overdue: 'Overdue',
    markDone: 'Mark done',
    undo: 'Undo',
    disabledThisDay: 'Disabled this day',
    doneBy: 'Done by {name}',
    notSelected: 'Not selected'
  },
  no: {
    title: 'Moradi',
    subtitle: 'Ukentlig avkrysning',
    chores: 'Gjøremål',
    weeks: 'Ukeansvar',
    settings: 'Innstillinger',
    previousWeek: 'Forrige uke',
    nextWeek: 'Neste uke',
    weekLabel: 'Uke {number}',
    chooseWho: 'Hvem fullførte dette?',
    chooseWhoHint: 'Velg personen som fullførte gjøremålet.',
    choosePerson: 'Velg person',
    selectFromList: 'Velg fra ansatte',
    currentPerson: 'Aktiv person',
    changePerson: 'Endre person',
    themeChoice: 'Tema',
    confirm: 'Bekreft',
    noDue: 'Ingen gjøremål',
    noWeeks: 'Ingen ukeansvar satt.',
    unassigned: 'Ikke tildelt',
    responsible: 'Ansvarlig',
    status: 'Status',
    description: 'Beskrivelse',
    noDescription: 'Ingen beskrivelse',
    deadline: 'Frist',
    deadlineExpired: 'Frist utløpt',
    done: 'Fullført',
    open: 'Åpen',
    overdue: 'Forsinket',
    markDone: 'Marker',
    undo: 'Angre',
    disabledThisDay: 'Deaktivert denne dagen',
    doneBy: 'Fullført av {name}',
    notSelected: 'Ikke valgt'
  }
};

function choreState(item) {
  if (item.completion) return 'done';
  if (item.overdue) return 'overdue';
  return 'open';
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function IpadPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [people, setPeople] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()));
  const [weekPlans, setWeekPlans] = useState({});
  const [weekOwners, setWeekOwners] = useState([]);
  const [error, setError] = useState('');
  const [personSheetOpen, setPersonSheetOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [slideDirection, setSlideDirection] = useState('right');
  const [activeTab, setActiveTab] = useState('chores');
  const keepTaskDialogOpenRef = useRef(false);

  const locale = localeForLanguage(language);
  const t = (key, vars = {}) => tr(TEXT, language, key, vars);

  const days = useMemo(() => mondayToFridayDates(weekStart), [weekStart]);
  const activeTaskItem = useMemo(() => {
    if (!activeTask) return null;
    const items = weekPlans[activeTask.dateKey] || [];
    return items.find((item) => Number(item.chore_id) === Number(activeTask.chore_id)) || null;
  }, [activeTask, weekPlans]);

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

  async function loadWeekOwners(start) {
    const rows = await api.getWeekOwners(start, 8);
    setWeekOwners(rows);
  }

  useEffect(() => {
    Promise.all([
      loadSettingsAndPeople(),
      loadWeekPlan(weekStart),
      loadWeekOwners(weekStart)
    ]).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    Promise.all([loadWeekPlan(weekStart), loadWeekOwners(weekStart)]).catch((err) =>
      setError(err.message)
    );
  }, [weekStart]);

  useEffect(() => {
    setTaskDialogOpen(false);
    setActiveTask(null);
  }, [weekStart]);

  useEffect(() => {
    if (!selectedPersonId) return;
    window.localStorage.setItem(STORAGE_KEY, String(selectedPersonId));
  }, [selectedPersonId]);

  function preferredPersonIdForItem(item) {
    const assignedId = item?.responsible_person?.id ? String(item.responsible_person.id) : '';
    if (assignedId && people.some((person) => String(person.id) === assignedId)) {
      return assignedId;
    }
    if (selectedPersonId && people.some((person) => String(person.id) === String(selectedPersonId))) {
      return String(selectedPersonId);
    }
    return people[0] ? String(people[0].id) : '';
  }

  function applyCompletionOptimistic({ choreId, dateKey, completedBy }) {
    const completedById = Number(completedBy);
    const completedByName =
      people.find((person) => Number(person.id) === completedById)?.name || '';

    setWeekPlans((prev) => {
      const dayItems = prev[dateKey] || [];
      const nextDayItems = dayItems.map((row) => {
        if (Number(row.chore_id) !== Number(choreId)) {
          return row;
        }
        return {
          ...row,
          completion: {
            ...(row.completion || {}),
            completed_by: completedById,
            completed_by_name: completedByName,
            completed_at: new Date().toISOString()
          },
          overdue: false
        };
      });
      return {
        ...prev,
        [dateKey]: nextDayItems
      };
    });
  }

  async function toggleItem(item, dateKey) {
    setError('');
    if (item.completion) {
      await api.unmarkDone({ chore_id: item.chore_id, work_date: dateKey });
      await loadWeekPlan(weekStart);
      return;
    }

    const preferredPersonId = preferredPersonIdForItem(item);
    if (preferredPersonId && String(preferredPersonId) !== String(selectedPersonId)) {
      setSelectedPersonId(preferredPersonId);
    }
    keepTaskDialogOpenRef.current = true;
    setPendingAction({ chore_id: item.chore_id, work_date: dateKey });
    setPersonSheetOpen(true);
  }

  async function confirmCompletion(personIdOverride) {
    const completedBy = personIdOverride || selectedPersonId;
    if (!pendingAction || !completedBy) {
      setPersonSheetOpen(false);
      return;
    }

    await api.markDone({
      chore_id: pendingAction.chore_id,
      work_date: pendingAction.work_date,
      completed_by: Number(completedBy)
    });

    applyCompletionOptimistic({
      choreId: pendingAction.chore_id,
      dateKey: pendingAction.work_date,
      completedBy
    });

    setPersonSheetOpen(false);
    setPendingAction(null);
    await loadWeekPlan(weekStart);
  }

  function openTaskDetails(item, dateKey) {
    setActiveTask({ chore_id: item.chore_id, dateKey });
    setTaskDialogOpen(true);
  }

  function closeTaskDetails() {
    setTaskDialogOpen(false);
    setActiveTask(null);
  }

  function taskStateLabel(item) {
    if (item.instance_disabled) {
      return t('disabledThisDay');
    }
    const state = choreState(item);
    if (state === 'done') return t('done');
    if (state === 'overdue') return t('overdue');
    return t('open');
  }

  async function toggleActiveTask() {
    if (!activeTask || !activeTaskItem || activeTaskItem.instance_disabled) {
      return;
    }
    const target = activeTaskItem;
    const dateKey = activeTask.dateKey;
    await toggleItem(target, dateKey);
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

  function formatDayLong(dateKey) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
      localDateFromKey(dateKey)
    );
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
    <div className='ipad-app-shell mx-auto min-h-dvh w-full max-w-[1360px] pb-[calc(env(safe-area-inset-bottom)+98px)]'>
      <header className='ipad-top-chrome sticky top-0 z-20'>
        <div className='mx-5 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)]'>
          <div className='ipad-header-panel animate-fade-in'>
            <div className='flex flex-wrap items-end justify-between gap-4'>
              <div>
                <p className='ipad-app-title'>{t('title')}</p>
                <p className='ipad-app-subtitle'>{t('subtitle')}</p>
              </div>
            </div>

            {activeTab !== 'settings' ? (
              <div className='ipad-week-rail'>
                <button
                  type='button'
                  onClick={() => navigateWeek(-1)}
                  title={t('previousWeek')}
                  className='ipad-week-nav'
                >
                  <ChevronLeft className='h-5 w-5' />
                </button>
                <div className='ipad-week-center'>
                  <p className='text-[1.2rem] font-semibold leading-tight text-slate-700'>
                    {t('weekLabel', { number: weekNumberFromDateKey(weekStart) })}
                  </p>
                  <p className='text-xs text-slate-500'>{formatWeekRange(weekStart, locale)}</p>
                </div>
                <button
                  type='button'
                  onClick={() => navigateWeek(1)}
                  title={t('nextWeek')}
                  className='ipad-week-nav'
                >
                  <ChevronRight className='h-5 w-5' />
                </button>
              </div>
            ) : null}

            {error ? (
              <p className='mt-3 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700'>
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className='mt-4 px-4'>
        {activeTab === 'chores' ? (
          <div onTouchStart={weekSwipe.onTouchStart} onTouchEnd={weekSwipe.onTouchEnd}>
            <div className='scroll-area-soft overflow-x-hidden pb-2'>
              <div
                key={weekStart}
                className={cn(
                  'grid grid-cols-5 gap-2 lg:gap-2.5',
                  slideDirection === 'right' ? 'animate-slide-right' : 'animate-slide-left'
                )}
              >
                {days.map((dateKey, dayIndex) => {
                  const items = weekPlans[dateKey] || [];
                  const isToday = dateKey === todayKey();

                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        'animate-stagger-in',
                        `stagger-${dayIndex + 1}`,
                        'ipad-day-column',
                        isToday && 'ipad-day-column-today'
                      )}
                    >
                      <div className='ipad-day-head px-3 pb-2 pt-3'>
                        <div className='flex items-center justify-between'>
                          <p
                            className={cn(
                              'text-sm font-bold',
                              isToday ? 'text-theme-700' : 'text-slate-900'
                            )}
                          >
                            {formatDay(dateKey)}
                          </p>
                          {isToday ? <span className='h-2 w-2 rounded-full bg-theme-500' /> : null}
                        </div>
                      </div>

                      <div className='space-y-2 px-2.5 pb-3 pt-2.5'>
                        {items.length ? (
                          items.map((item, itemIndex) => {
                            const state = choreState(item);
                            return (
                              <div
                                key={`${dateKey}-${item.chore_id}`}
                                className={cn(
                                  'ipad-task-card animate-stagger-in',
                                  `stagger-${Math.min(itemIndex + 1, 10)}`,
                                  item.instance_disabled
                                    ? 'ipad-task-card-disabled'
                                    : state === 'done'
                                      ? 'ipad-task-card-done'
                                      : state === 'overdue'
                                        ? 'ipad-task-card-overdue'
                                        : 'ipad-task-card-open'
                                )}
                              >
                                <div className='flex items-start gap-3'>
                                  <button
                                    type='button'
                                    className={cn(
                                      'ipad-check-btn mt-0.5 shrink-0',
                                      state === 'done' && 'ipad-check-btn-done',
                                      state === 'overdue' && 'ipad-check-btn-overdue',
                                      state === 'open' && 'ipad-check-btn-open',
                                      item.instance_disabled && 'opacity-40'
                                    )}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleItem(item, dateKey).catch((err) => setError(err.message));
                                    }}
                                    disabled={Boolean(item.instance_disabled)}
                                  >
                                    {state === 'done' ? (
                                      <Check className='h-4 w-4 animate-check-bounce' />
                                    ) : (
                                      <span className='ipad-check-empty' aria-hidden='true' />
                                    )}
                                  </button>

                                  <button
                                    type='button'
                                    onClick={() => openTaskDetails(item, dateKey)}
                                    className='min-w-0 flex-1 rounded-xl px-1 py-0.5 text-left transition hover:bg-slate-50'
                                  >
                                    <div className='flex items-center'>
                                      <p
                                        className={cn(
                                          'truncate text-sm font-semibold text-slate-900',
                                          state === 'done' && 'text-slate-500 line-through'
                                        )}
                                      >
                                        {item.chore_name}
                                      </p>
                                    </div>

                                    <div className='mt-1.5 flex items-center gap-1.5'>
                                      <span className='truncate text-xs text-slate-500'>
                                        {item.completion?.completed_by_name
                                          || item.responsible_person?.name
                                          || t('unassigned')}
                                      </span>
                                      {item.due_time ? (
                                        <span
                                          className={cn(
                                            'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                            state === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                          )}
                                        >
                                          {item.due_time}
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
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
        ) : activeTab === 'weeks' ? (
          <div className='animate-fade-in space-y-3'>
            {weekOwners.length ? (
              weekOwners.map((row, index) => (
                <article
                  key={row.week_start}
                  className={cn(
                    'ipad-week-card animate-stagger-in',
                    `stagger-${Math.min(index + 1, 10)}`
                  )}
                >
                  <div className='ipad-week-number'>{weekNumberFromDateKey(row.week_start)}</div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-base font-semibold text-slate-900'>
                      {t('weekLabel', { number: weekNumberFromDateKey(row.week_start) })}
                    </p>
                    <p className='text-sm text-slate-500'>{formatWeekRange(row.week_start, locale)}</p>
                  </div>
                  <span
                    className={cn(
                      'ipad-week-owner',
                      row.person_name
                        ? 'ipad-week-owner-assigned'
                        : 'ipad-week-owner-unassigned'
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
          <div className='animate-fade-in space-y-4'>
            <section className='ipad-settings-card'>
              <p className='ipad-settings-label'>{t('themeChoice')}</p>
              <div className='ipad-theme-grid mt-3'>
                {THEMES.map((id) => (
                  <button
                    key={id}
                    type='button'
                    onClick={() => setTheme(id)}
                    className={cn('ipad-theme-option', theme === id && 'ipad-theme-option-active')}
                  >
                    <div className='ipad-theme-swatches'>
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

      <nav className='ipad-tabbar fixed bottom-0 left-1/2 z-30 w-full max-w-[1360px] -translate-x-1/2'>
        <div className='ipad-tabbar-inner'>
          <button
            type='button'
            onClick={() => setActiveTab('chores')}
            className={cn('ipad-tab-btn', activeTab === 'chores' ? 'ipad-tab-btn-active' : 'ipad-tab-btn-inactive')}
          >
            <ListChecks className='h-5 w-5' />
            <span>{t('chores')}</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('weeks')}
            className={cn(
              'ipad-tab-btn border-l border-slate-200',
              activeTab === 'weeks' ? 'ipad-tab-btn-active' : 'ipad-tab-btn-inactive'
            )}
          >
            <CalendarDays className='h-5 w-5' />
            <span>{t('weeks')}</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('settings')}
            className={cn(
              'ipad-tab-btn border-l border-slate-200',
              activeTab === 'settings' ? 'ipad-tab-btn-active' : 'ipad-tab-btn-inactive'
            )}
          >
            <Settings2 className='h-5 w-5' />
            <span>{t('settings')}</span>
          </button>
        </div>
      </nav>

      <Dialog
        modal={false}
        open={taskDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (personSheetOpen || keepTaskDialogOpenRef.current) {
              keepTaskDialogOpenRef.current = false;
              return;
            }
            closeTaskDetails();
          }
        }}
      >
        <DialogContent className='w-[min(92vw,640px)] max-w-[640px] gap-3 rounded-[1.6rem] p-5'>
          <DialogHeader>
            <DialogTitle className='pr-8 text-base font-semibold text-slate-800'>
              {activeTask?.dateKey ? formatDayLong(activeTask.dateKey) : ''}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>

          {activeTaskItem ? (
            <div className='pt-1'>
              <div className='rounded-2xl border border-slate-200 bg-white px-3 py-3'>
                <div className='flex items-start gap-3'>
                  <button
                    type='button'
                    onClick={() => toggleActiveTask().catch((err) => setError(err.message))}
                    disabled={Boolean(activeTaskItem.instance_disabled)}
                    className={cn(
                      'ipad-detail-check-btn mt-0.5 shrink-0',
                      choreState(activeTaskItem) === 'done' && 'ipad-detail-check-btn-done',
                      activeTaskItem.instance_disabled && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    {choreState(activeTaskItem) === 'done' ? (
                      <Check className='h-5 w-5' />
                    ) : null}
                  </button>

                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <ListChecks className='h-4 w-4 shrink-0 text-slate-500' />
                      <p
                        className={cn(
                          'truncate text-[1.02rem] font-semibold text-slate-900',
                          choreState(activeTaskItem) === 'done' && 'text-slate-500 line-through'
                        )}
                      >
                        {activeTaskItem.chore_name}
                      </p>
                      <span
                        className={cn(
                          'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          activeTaskItem.instance_disabled
                            ? 'bg-slate-200 text-slate-600'
                            : choreState(activeTaskItem) === 'done'
                              ? 'bg-theme-100 text-theme-700'
                              : choreState(activeTaskItem) === 'overdue'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {taskStateLabel(activeTaskItem)}
                      </span>
                    </div>

                    <div className='ipad-task-divider' />

                    <p className='text-sm text-slate-700'>
                      {activeTaskItem.description || t('noDescription')}
                    </p>

                    <div className='mt-2.5 space-y-1.5'>
                      <div className='ipad-task-meta-row'>
                        <UserRound className='h-4 w-4 text-slate-500' />
                        <span>
                          {activeTaskItem.completion?.completed_by_name
                            || activeTaskItem.responsible_person?.name
                            || t('unassigned')}
                        </span>
                      </div>
                      {activeTaskItem.due_time ? (
                        <div className='ipad-task-meta-row'>
                          {choreState(activeTaskItem) === 'overdue' ? (
                            <AlertCircle className='h-4 w-4 shrink-0 text-red-600' />
                          ) : (
                            <CalendarDays className='h-4 w-4 shrink-0 text-slate-500' />
                          )}
                          <span className={cn(choreState(activeTaskItem) === 'overdue' && 'font-medium text-red-600')}>
                            {choreState(activeTaskItem) === 'overdue' ? t('deadlineExpired') : t('deadline')}: {activeTaskItem.due_time}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {activeTaskItem.completion?.completed_by_name ? (
                      <span className='ipad-done-tag'>
                        {t('doneBy', { name: activeTaskItem.completion.completed_by_name })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className='py-4 text-center text-sm text-slate-500'>{t('noDue')}</p>
          )}
        </DialogContent>
      </Dialog>

      <BottomSheet
        open={personSheetOpen}
        onClose={() => {
          setPersonSheetOpen(false);
          setPendingAction(null);
        }}
        title={pendingAction ? t('chooseWho') : t('choosePerson')}
        description={pendingAction ? t('chooseWhoHint') : t('selectFromList')}
        sheetClassName='mx-auto max-w-[560px]'
      >
        <div className='space-y-2 pt-2'>
          {people.length ? (
            people.map((person) => {
              const active = String(person.id) === String(selectedPersonId);
              return (
                <button
                  key={person.id}
                  type='button'
                  onClick={() => {
                    const nextId = String(person.id);
                    setSelectedPersonId(nextId);
                    if (pendingAction) {
                      confirmCompletion(nextId).catch((err) => setError(err.message));
                      return;
                    }
                    setPersonSheetOpen(false);
                  }}
                  className={cn(
                    'person-select-btn',
                    active ? 'person-select-btn-active' : 'person-select-btn-inactive'
                  )}
                >
                  <div
                    className={cn(
                      'person-avatar h-10 w-10 shrink-0',
                      active && 'ring-2 ring-theme-400 ring-offset-2'
                    )}
                  >
                    {initials(person.name)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-slate-900'>{person.name}</p>
                    {person.email ? (
                      <p className='truncate text-xs text-slate-500'>{person.email}</p>
                    ) : null}
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
