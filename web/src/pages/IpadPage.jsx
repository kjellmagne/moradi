import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, Clock3, Palette, UserRound } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
    chooseWho: 'Choose who you are',
    chooseWhoHint: 'Select employee to register completion.',
    employee: 'Employee',
    selectFromList: 'Select from team members',
    confirm: 'Confirm',
    cancel: 'Cancel',
    noDue: 'No chores due',
    unassigned: 'Unassigned',
    done: 'Done',
    open: 'Open',
    overdue: 'Overdue',
    deadline: 'Deadline',
    responsible: 'Responsible',
    doneBy: 'Done by {name}',
    completedCount: 'Completed',
    pendingCount: 'Pending',
    overdueCount: 'Late',
    totalCount: 'Total',
    cycleTheme: 'Change color scheme'
  },
  no: {
    title: 'Moradi',
    subtitle: 'Ukentlig gjennomføringsboard',
    weekView: 'Ukevisning',
    previousWeek: 'Forrige uke',
    nextWeek: 'Neste uke',
    weekLabel: 'Uke {number}',
    chooseWho: 'Velg hvem du er',
    chooseWhoHint: 'Velg ansatt for å registrere fullføring.',
    employee: 'Ansatt',
    selectFromList: 'Velg fra ansatte',
    confirm: 'Bekreft',
    cancel: 'Avbryt',
    noDue: 'Ingen gjøremål',
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
    cycleTheme: 'Bytt fargeskjema'
  }
};

function choreState(item) {
  if (item.completion) return 'done';
  if (item.overdue) return 'overdue';
  return 'open';
}

function statusLabel(item, t) {
  const state = choreState(item);
  if (state === 'done') return t('done');
  if (state === 'overdue') return t('overdue');
  return t('open');
}

export function IpadPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [people, setPeople] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(todayKey()));
  const [weekPlans, setWeekPlans] = useState({});
  const [error, setError] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setUserDialogOpen(true);
  }

  async function confirmCompletion() {
    if (!pendingAction || !selectedPersonId) {
      setUserDialogOpen(false);
      return;
    }

    await api.markDone({
      chore_id: pendingAction.chore_id,
      work_date: pendingAction.work_date,
      completed_by: Number(selectedPersonId)
    });

    setUserDialogOpen(false);
    setPendingAction(null);
    await loadWeekPlan(weekStart);
  }

  function formatDay(dateKey) {
    return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(
      localDateFromKey(dateKey)
    );
  }

  return (
    <div className='ipad-app-shell mx-auto min-h-dvh w-full max-w-[1600px] px-4 pb-6 pt-4'>
      <Card className='moradi-glass-panel rounded-3xl border-white/75'>
        <CardHeader className='space-y-4 p-5'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <p className='text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500'>{t('title')}</p>
              <CardTitle className='mt-1 text-2xl text-slate-900'>{t('subtitle')}</CardTitle>
              <p className='mt-1 text-sm text-slate-600'>{t('weekView')}</p>
            </div>
            <div className='moradi-segmented flex items-center gap-2 rounded-2xl p-2'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => {
                  const index = THEMES.indexOf(theme);
                  setTheme(THEMES[(index + 1) % THEMES.length]);
                }}
                title={t('cycleTheme')}
                className='moradi-soft-button h-10 w-10 rounded-xl border-slate-200/90 bg-white/95'
              >
                <Palette className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                onClick={() => setWeekStart((value) => addDays(value, -7))}
                title={t('previousWeek')}
                className='moradi-soft-button h-10 w-10 rounded-xl border-slate-200/90 bg-white/95'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <div className='moradi-glass-strong min-w-[240px] rounded-xl border-slate-200/90 bg-white/90 px-4 py-2 text-center'>
                <p className='text-base font-semibold text-slate-900'>{t('weekLabel', { number: weekNumberFromDateKey(weekStart) })}</p>
                <p className='text-xs font-normal text-slate-500'>{formatWeekRange(weekStart, locale)}</p>
              </div>
              <Button
                variant='outline'
                size='icon'
                onClick={() => setWeekStart((value) => addDays(value, 7))}
                title={t('nextWeek')}
                className='moradi-soft-button h-10 w-10 rounded-xl border-slate-200/90 bg-white/95'
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-4 gap-2'>
            <div className='moradi-glass-strong rounded-2xl px-3 py-2 text-center'>
              <p className='text-[11px] font-medium uppercase tracking-wide text-slate-500'>{t('totalCount')}</p>
              <p className='text-lg font-semibold text-slate-900'>{summary.total}</p>
            </div>
            <div className='moradi-glass-strong rounded-2xl px-3 py-2 text-center'>
              <p className='text-[11px] font-medium uppercase tracking-wide text-primary/80'>{t('completedCount')}</p>
              <p className='text-lg font-semibold text-primary'>{summary.done}</p>
            </div>
            <div className='moradi-glass-strong rounded-2xl px-3 py-2 text-center'>
              <p className='text-[11px] font-medium uppercase tracking-wide text-slate-500'>{t('pendingCount')}</p>
              <p className='text-lg font-semibold text-slate-900'>{summary.open}</p>
            </div>
            <div className='moradi-glass-strong rounded-2xl px-3 py-2 text-center'>
              <p className='text-[11px] font-medium uppercase tracking-wide text-slate-500'>{t('overdueCount')}</p>
              <p className='text-lg font-semibold text-slate-900'>{summary.overdue}</p>
            </div>
          </div>

          {error ? <p className='px-1 text-sm text-destructive'>{error}</p> : null}
        </CardHeader>
      </Card>

      <Card className='moradi-glass-panel mt-4 rounded-3xl border-white/75'>
        <CardContent className='p-4'>
          <div className='scroll-area-soft overflow-x-auto pb-2'>
            <div className='grid min-w-[1260px] grid-cols-5 gap-3'>
              {days.map((dateKey) => {
                const items = weekPlans[dateKey] || [];
                const isToday = dateKey === todayKey();
                return (
                  <Card
                    key={dateKey}
                    className={cn(
                      'moradi-glass-strong h-full rounded-2xl border-slate-200/90 bg-white/90',
                      isToday && 'employee-today-column'
                    )}
                  >
                    <CardHeader className='border-b border-slate-200/80 px-3 pb-2 pt-3'>
                      <CardTitle className='text-sm text-slate-900'>{formatDay(dateKey)}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2 px-3 pb-3 pt-3'>
                      {items.length ? (
                        items.map((item) => (
                          <div
                            key={`${dateKey}-${item.chore_id}`}
                            className={cn(
                              'rounded-xl border p-2',
                              item.instance_disabled
                                ? 'border-slate-200/80 bg-slate-100/85 opacity-65'
                                : item.completion
                                  ? 'employee-card-done'
                                  : item.overdue
                                    ? 'employee-card-overdue'
                                    : 'border-slate-200/80 bg-white/88'
                            )}
                          >
                            <div className='flex items-start gap-2'>
                              <Button
                                variant='outline'
                                size='icon'
                                className={cn(
                                  'moradi-soft-button h-9 w-9 shrink-0 rounded-xl border-slate-200/90',
                                  item.completion
                                    ? 'employee-check-done'
                                    : item.overdue
                                      ? 'employee-check-overdue'
                                      : 'bg-white/95 text-slate-600'
                                )}
                                onClick={() => toggleItem(item, dateKey).catch((err) => setError(err.message))}
                                disabled={Boolean(item.instance_disabled)}
                              >
                                {item.completion ? <Check className='h-4 w-4' /> : <Circle className='h-4 w-4' />}
                              </Button>
                              <div className='min-w-0 flex-1'>
                                <div className='flex items-start justify-between gap-2'>
                                  <p className={cn('text-sm font-semibold leading-tight text-slate-900', item.completion && 'text-slate-500 line-through')}>
                                    {item.chore_name}
                                  </p>
                                  {!item.instance_disabled ? (
                                    <Badge
                                      variant={choreState(item) === 'done' ? 'default' : choreState(item) === 'overdue' ? 'destructive' : 'secondary'}
                                      className='rounded-full px-2 py-0.5 text-[10px]'
                                    >
                                      {statusLabel(item, t)}
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className='mt-1 flex flex-wrap gap-1.5'>
                                  <Badge variant='secondary' className='rounded-full bg-slate-100/90 text-[10px] text-slate-700'>
                                    {t('responsible')}: {item.responsible_person?.name || t('unassigned')}
                                  </Badge>
                                  {item.due_time ? (
                                    <Badge variant='secondary' className='rounded-full bg-slate-100/90 text-[10px] text-slate-700'>
                                      <Clock3 className='mr-1 h-3.5 w-3.5' />
                                      {t('deadline')}: {item.due_time}
                                    </Badge>
                                  ) : null}
                                </div>
                                {item.completion?.completed_by_name ? (
                                  <p className='mt-1 text-xs text-slate-500'>
                                    {t('doneBy', { name: item.completion.completed_by_name })}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className='rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-center'>
                          <p className='text-sm text-muted-foreground'>{t('noDue')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('chooseWho')}</DialogTitle>
            <DialogDescription>{t('selectFromList')}</DialogDescription>
          </DialogHeader>
          <div className='max-h-[46vh] space-y-2 overflow-auto pr-1'>
            {people.map((person) => {
              const active = String(person.id) === String(selectedPersonId);
              return (
                <button
                  key={person.id}
                  type='button'
                  onClick={() => setSelectedPersonId(String(person.id))}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition',
                    active
                      ? 'border-primary/60 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                      : 'moradi-soft-button border-slate-200/90 bg-white/90 text-slate-700'
                  )}
                >
                  <span className='font-medium'>{person.name}</span>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setUserDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={() => confirmCompletion().catch((err) => setError(err.message))} disabled={!selectedPersonId}>
              <UserRound className='h-4 w-4' />
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
