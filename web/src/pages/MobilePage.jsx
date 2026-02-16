import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Clock3, ListChecks, Palette, UserRound } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    weeks: 'Upcoming week owners',
    noChores: 'No chores assigned for this day.',
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
    completedCount: 'Completed',
    pendingCount: 'Pending',
    overdueCount: 'Late',
    cycleTheme: 'Change color scheme'
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
    weeks: 'Kommende ukeansvar',
    noChores: 'Ingen gjøremål denne dagen.',
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
    cycleTheme: 'Bytt fargeskjema'
  }
};

function choreState(item) {
  if (item.completion) return 'done';
  if (item.overdue) return 'overdue';
  return 'open';
}

function statusVariant(state) {
  if (state === 'done') return 'default';
  if (state === 'overdue') return 'destructive';
  return 'secondary';
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
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const dateInputRef = useRef(null);

  const locale = localeForLanguage(language);
  const t = (key, vars = {}) => tr(TEXT, language, key, vars);

  const selectedPerson = useMemo(() => people.find((person) => String(person.id) === String(personId)) || null, [people, personId]);
  const summary = useMemo(() => {
    const result = { done: 0, open: 0, overdue: 0 };
    for (const item of plan) {
      const state = choreState(item);
      result[state] += 1;
    }
    return result;
  }, [plan]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!people.length) return;
    if (!personId) return;
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
      setPersonDialogOpen(true);
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

  return (
    <div className='mobile-app-shell mx-auto min-h-dvh w-full max-w-xl px-3 pb-5 pt-4'>
      <Card className='moradi-glass-panel sticky top-3 z-20 rounded-3xl border-white/75'>
        <CardHeader className='space-y-4 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500'>{t('title')}</p>
              <CardTitle className='mt-1 text-xl text-slate-900'>{t('subtitle')}</CardTitle>
              <p className='mt-1 text-sm text-slate-600'>
                {t('you')}: <strong className='text-slate-900'>{selectedPerson?.name || t('notSelected')}</strong>
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => {
                  const index = THEMES.indexOf(theme);
                  setTheme(THEMES[(index + 1) % THEMES.length]);
                }}
                className='moradi-soft-button h-9 w-9 rounded-full border-slate-200/90 bg-white/85'
                title={t('cycleTheme')}
              >
                <Palette className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPersonDialogOpen(true)}
                className='moradi-soft-button h-9 rounded-full border-slate-200/90 bg-white/85 px-3'
              >
                <UserRound className='h-4 w-4' />
                {t('choosePerson')}
              </Button>
            </div>
          </div>

          <div className='moradi-segmented grid grid-cols-[44px_1fr_44px] items-center gap-2 rounded-2xl p-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setDate((value) => addDays(value, -1))}
              title={t('previousDay')}
              className='moradi-soft-button h-10 w-10 rounded-xl border-slate-200/90 bg-white/95'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>

            <div className='relative min-w-0'>
              <button
                type='button'
                onClick={openDatePicker}
                className='w-full rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
              >
                <p className='text-[11px] font-medium uppercase tracking-wide text-slate-500'>{t('date')}</p>
                <p className='truncate text-sm font-semibold text-slate-900'>{formatDateLabel(date)}</p>
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
              <Button
                type='button'
                variant='ghost'
                size='icon'
                title={t('openCalendar')}
                onClick={openDatePicker}
                className='absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-slate-500 hover:bg-slate-100/85'
              >
                <Calendar className='h-4 w-4' />
              </Button>
            </div>

            <Button
              variant='outline'
              size='icon'
              onClick={() => setDate((value) => addDays(value, 1))}
              title={t('nextDay')}
              className='moradi-soft-button h-10 w-10 rounded-xl border-slate-200/90 bg-white/95'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>

          <div className='grid grid-cols-3 gap-2'>
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
        </CardHeader>
      </Card>

      {error ? <p className='mt-3 px-1 text-sm text-destructive'>{error}</p> : null}

      <Tabs defaultValue='chores' className='mt-4'>
        <TabsList className='moradi-segmented grid h-11 w-full grid-cols-2 rounded-2xl p-1'>
          <TabsTrigger
            value='chores'
            className='rounded-xl data-[state=active]:bg-white/95 data-[state=active]:shadow-sm data-[state=active]:text-slate-900'
          >
            <ListChecks className='mr-1 h-4 w-4' />
            {t('chores')}
          </TabsTrigger>
          <TabsTrigger
            value='weeks'
            className='rounded-xl data-[state=active]:bg-white/95 data-[state=active]:shadow-sm data-[state=active]:text-slate-900'
          >
            <CalendarDays className='mr-1 h-4 w-4' />
            {t('weeks')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='chores' className='space-y-2.5'>
          {plan.length ? (
            plan.map((item) => (
              <Card
                key={`${item.chore_id}-${item.work_date}`}
                className={cn(
                  'moradi-glass-strong rounded-2xl',
                  item.completion
                    ? 'employee-card-done'
                    : item.overdue
                      ? 'employee-card-overdue'
                      : 'border-slate-200/90 bg-white/88'
                )}
              >
                <CardContent className='p-3'>
                  <div className='flex items-center gap-3'>
                    <Button
                      variant='outline'
                      size='icon'
                      className={cn(
                        'moradi-soft-button h-10 w-10 rounded-xl border-slate-200/90',
                        item.completion
                          ? 'employee-check-done'
                          : item.overdue
                            ? 'employee-check-overdue'
                            : 'bg-white/90 text-slate-600'
                      )}
                      onClick={() => toggle(item).catch((err) => setError(err.message))}
                    >
                      {item.completion ? <Check className='h-5 w-5' /> : <Circle className='h-5 w-5' />}
                    </Button>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className={cn('font-semibold text-slate-900', item.completion && 'text-slate-500 line-through')}>
                          {item.chore_name}
                        </p>
                        <Badge variant={statusVariant(choreState(item))} className='rounded-full px-2 py-0.5 text-[11px]'>
                          {choreState(item) === 'done' ? t('done') : choreState(item) === 'overdue' ? t('overdue') : t('open')}
                        </Badge>
                      </div>

                      <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                        <Badge variant='secondary' className='rounded-full bg-slate-100/90 text-[11px] text-slate-700'>
                          {t('responsible')}: {item.responsible_person?.name || t('unassigned')}
                        </Badge>
                        {item.due_time ? (
                          <Badge variant='secondary' className='rounded-full bg-slate-100/90 text-[11px] text-slate-700'>
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
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className='border-slate-200 bg-white/95'>
              <CardContent className='py-6 text-sm text-muted-foreground'>{t('noChores')}</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='weeks' className='space-y-2'>
          {weekOwners.length ? (
            weekOwners.map((row) => (
              <Card key={row.week_start} className='moradi-glass-strong rounded-2xl border-slate-200/90 bg-white/90'>
                <CardContent className='p-3'>
                  <div className='flex items-center gap-3'>
                    <div className='moradi-soft-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-slate-200 bg-white/90 text-sm font-semibold text-slate-700'>
                      {weekNumberFromDateKey(row.week_start)}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold text-slate-900'>{formatWeekRange(row.week_start, locale)}</p>
                      <p className='text-xs text-slate-500'>
                        {t('weekLabel', { number: weekNumberFromDateKey(row.week_start) })} ·{' '}
                        {t('starts', { date: formatShortDate(row.week_start) })}
                      </p>
                    </div>
                    <Badge variant={row.person_name ? 'default' : 'secondary'} className='rounded-full px-2.5 py-1'>
                      {row.person_name || t('unassigned')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className='moradi-glass-strong rounded-2xl border-slate-200/90 bg-white/90'>
              <CardContent className='py-6 text-center text-sm text-muted-foreground'>{t('noWeeks')}</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={personDialogOpen} onOpenChange={setPersonDialogOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('choosePerson')}</DialogTitle>
            <DialogDescription>{t('selectFromList')}</DialogDescription>
          </DialogHeader>
          <div className='max-h-[46vh] space-y-2 overflow-auto pr-1'>
            {people.length ? (
              people.map((person) => {
                const active = String(person.id) === String(personId);
                return (
                  <button
                    key={person.id}
                    type='button'
                    onClick={() => setPersonId(String(person.id))}
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
              })
            ) : (
              <p className='text-sm text-muted-foreground'>{t('notSelected')}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPersonDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={() => setPersonDialogOpen(false)} disabled={!personId}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
