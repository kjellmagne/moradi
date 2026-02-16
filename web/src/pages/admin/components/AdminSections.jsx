import { addDays, formatWeekRange, mondayToFridayDates, startOfWeek, todayKey, weekNumberFromDateKey } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Clock3, Pause, Pencil, Play, Plus, Sparkles, Trash2, UserRound } from 'lucide-react';
import { BoardItem, StatCard } from './AdminShared';

function formatDateNo(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-');
  if (!year || !month || !day) return String(dateKey || '');
  return `${day}-${month}-${year}`;
}

export function OverviewSection({ t, overviewSummary, overviewWeekOwners, overviewPlan, overviewAlerts }) {
  return (
    <div className='grid animate-fade-in gap-5'>
      <div className='grid gap-5 lg:grid-cols-[1.15fr_0.85fr]'>
        <div className='grid gap-5'>
          <Card className='moradi-card'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-bold'>{t('todayGlance')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2 pt-0 md:grid-cols-4'>
              <StatCard label={t('total')} value={overviewSummary?.total || 0} compact />
              <StatCard label={t('completed')} value={overviewSummary?.done || 0} tone='good' compact />
              <StatCard label={t('open')} value={overviewSummary?.open || 0} compact />
              <StatCard label={t('overdue')} value={overviewSummary?.overdue || 0} tone='bad' compact />
            </CardContent>
          </Card>

          <Card className='moradi-card'>
            <CardHeader>
              <CardTitle className='text-base font-bold'>{t('todayChores')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2'>
              {overviewPlan.length ? (
                overviewPlan.map((item) => {
                  const state = item.completion ? 'done' : item.overdue ? 'overdue' : 'open';
                  return (
                    <div
                      key={`${item.chore_id}-${item.work_date}`}
                      className={cn(
                        'rounded-xl border p-3 transition-all duration-200',
                        state === 'done' ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
                          : state === 'overdue' ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50'
                            : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <p className={cn('font-semibold', state === 'done' && 'text-slate-400 line-through')}>{item.chore_name}</p>
                          <p className='text-sm text-slate-500'>{item.description || t('noDescription')}</p>
                        </div>
                        <Badge
                          variant={state === 'done' ? 'default' : state === 'overdue' ? 'destructive' : 'secondary'}
                          className='rounded-full'
                        >
                          {state === 'done' ? t('done') : state === 'overdue' ? t('overdue') : t('open')}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className='text-sm text-slate-500'>{t('noPlan')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className='moradi-card'>
          <CardHeader>
            <CardTitle className='text-base font-bold'>{t('upcomingWeeks')}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {overviewWeekOwners.length ? (
              overviewWeekOwners.map((row) => (
                <div key={row.week_start} className='week-card'>
                  <div className='week-number-badge'>
                    {weekNumberFromDateKey(row.week_start)}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-slate-900'>
                      {t('weekNumber')} {weekNumberFromDateKey(row.week_start)}
                    </p>
                    <p className='text-xs text-slate-500'>
                      {t('from')} {formatDateNo(row.week_start)} · {t('to')} {formatDateNo(addDays(row.week_start, 6))}
                    </p>
                  </div>
                  <span className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    row.person_name ? 'bg-theme-100 text-theme-700' : 'bg-slate-100 text-slate-500'
                  )}>
                    {row.person_name || t('unassigned')}
                  </span>
                </div>
              ))
            ) : (
              <p className='text-sm text-slate-500'>{t('noWeekOwners')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='moradi-card'>
        <CardHeader>
          <CardTitle className='text-base font-bold'>{t('deadlineAlerts')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {overviewAlerts.length ? (
            overviewAlerts.map((alert) => (
              <div key={alert.id} className='rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-sm'>
                <p className='font-semibold text-slate-900'>{alert.chore_name}</p>
                <p className='text-amber-700'>{alert.message}</p>
              </div>
            ))
          ) : (
            <p className='text-sm text-slate-500'>{t('noAlerts')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamSection({ t, people, onCreate, onEdit, onDelete }) {
  return (
    <Card className='moradi-card animate-fade-in'>
      <CardHeader className='flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle className='text-base font-bold'>{t('team')}</CardTitle>
          <CardDescription>{t('sectionTeamSubtitle')}</CardDescription>
        </div>
        <Button onClick={onCreate} className='rounded-xl'>
          <Plus className='h-4 w-4' />
          {t('addMember')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-auto rounded-xl border border-slate-200'>
          <table className='w-full min-w-[640px] text-sm'>
            <thead>
              <tr className='border-b bg-slate-50/80'>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('placeHolderName')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('placeHolderEmail')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('placeHolderPhone')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {people.length ? (
                people.map((row) => (
                  <tr key={row.id} className='border-t transition-colors hover:bg-theme-50/30'>
                    <td className='p-3 font-medium text-slate-900'>{row.name}</td>
                    <td className='p-3 text-slate-600'>{row.email || '-'}</td>
                    <td className='p-3 text-slate-600'>{row.phone || '-'}</td>
                    <td className='p-3'>
                      <div className='flex items-center gap-1'>
                        <Button variant='outline' size='icon' onClick={() => onEdit(row)} title={t('edit')} className='h-8 w-8 rounded-lg'>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={() => onDelete(row)} title={t('delete')} className='h-8 w-8 rounded-lg'>
                          <Trash2 className='h-3.5 w-3.5 text-rose-500' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className='p-6 text-center text-slate-500'>
                    {t('noPeople')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChoresSection({ t, chores, choreSchedule, onCreate, onEdit, onDelete, onToggle }) {
  return (
    <Card className='moradi-card animate-fade-in'>
      <CardHeader className='flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle className='text-base font-bold'>{t('chores')}</CardTitle>
          <CardDescription>{t('sectionChoresSubtitle')}</CardDescription>
        </div>
        <Button onClick={onCreate} className='rounded-xl'>
          <Plus className='h-4 w-4' />
          {t('addChore')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-auto rounded-xl border border-slate-200'>
          <table className='w-full min-w-[840px] text-sm'>
            <thead>
              <tr className='border-b bg-slate-50/80'>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('placeHolderName')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('schedule')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('deadline')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('alerts')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {chores.length ? (
                chores.map((row) => (
                  <tr key={row.id} className='border-t transition-colors hover:bg-theme-50/30'>
                    <td className='p-3'>
                      <p className='font-medium text-slate-900'>{row.name}</p>
                      <p className='text-xs text-slate-500'>{row.description || t('noDescription')}</p>
                    </td>
                    <td className='p-3 text-slate-600'>{choreSchedule(row)}</td>
                    <td className='p-3 text-slate-600'>{row.due_time || t('noDeadline')}</td>
                    <td className='p-3'>
                      <Badge
                        variant={Number(row.alert_enabled) ? 'default' : 'secondary'}
                        className='rounded-full'
                      >
                        {Number(row.alert_enabled) ? t('on') : t('off')}
                      </Badge>
                    </td>
                    <td className='p-3'>
                      <div className='flex items-center gap-1'>
                        <Badge variant={row.active ? 'default' : 'secondary'} className='rounded-full'>
                          {row.active ? t('active') : t('inactive')}
                        </Badge>
                        <Button variant='outline' size='icon' onClick={() => onEdit(row)} className='h-8 w-8 rounded-lg'>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={() => onDelete(row)} className='h-8 w-8 rounded-lg'>
                          <Trash2 className='h-3.5 w-3.5 text-rose-500' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={() => onToggle(row)} className='h-8 w-8 rounded-lg'>
                          {row.active ? <Pause className='h-3.5 w-3.5' /> : <Play className='h-3.5 w-3.5' />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='p-6 text-center text-slate-500'>
                    {t('noChores')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function BoardSection({ t, planDate, setPlanDate, formatDay, boardSummary, boardAttention, boardCompleted, toggleCompletion, locale, padTime }) {
  const progressPercent = boardSummary.total > 0 ? Math.round((boardSummary.done / boardSummary.total) * 100) : 0;

  return (
    <div className='grid animate-fade-in gap-5'>
      <Card className='moradi-card'>
        <CardHeader>
          <CardTitle className='text-base font-bold'>{t('sectionBoardTitle')}</CardTitle>
          <CardDescription>{t('sectionBoardSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-5'>
          <div className='flex flex-wrap items-end gap-3'>
            <Button variant='outline' size='icon' onClick={() => setPlanDate((value) => addDays(value, -1))} className='rounded-xl'>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div className='grid gap-1'>
              <Label className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('date')}</Label>
              <Input type='date' value={planDate} onChange={(event) => setPlanDate(event.target.value)} className='rounded-xl' />
            </div>
            <Button variant='outline' size='icon' onClick={() => setPlanDate((value) => addDays(value, 1))} className='rounded-xl'>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <div className='ml-2'>
              <p className='font-bold text-slate-900'>{formatDay(planDate)}</p>
              <p className='text-sm text-slate-500'>{`#${weekNumberFromDateKey(planDate)} · ${formatWeekRange(startOfWeek(planDate), locale)}`}</p>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-5'>
            <StatCard label={t('total')} value={boardSummary.total} />
            <StatCard label={t('completed')} value={boardSummary.done} tone='good' />
            <StatCard label={t('open')} value={boardSummary.open} />
            <StatCard label={t('overdue')} value={boardSummary.overdue} tone='bad' />
            <StatCard label={t('unassigned')} value={boardSummary.unassigned} tone='warn' />
          </div>

          {boardSummary.total > 0 ? (
            <div>
              <div className='flex items-center justify-between text-xs'>
                <span className='font-semibold text-slate-600'>{progressPercent}% {t('completionRate')}</span>
                <span className='text-slate-400'>{boardSummary.done}/{boardSummary.total}</span>
              </div>
              <div className='progress-bar mt-1'>
                <div
                  className={cn(
                    'progress-bar-fill',
                    progressPercent === 100 ? 'progress-bar-fill-good' : 'progress-bar-fill-primary'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className='grid gap-4 lg:grid-cols-2'>
            <Card className='moradi-card-sub border'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-bold'>{t('open')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {boardAttention.length ? (
                  boardAttention.map((item) => (
                    <BoardItem
                      key={`${item.chore_id}-${item.work_date}`}
                      item={item}
                      t={t}
                      locale={locale}
                      onToggle={() => toggleCompletion(item)}
                      padTime={padTime}
                    />
                  ))
                ) : (
                  <div className='flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-4'>
                    <Sparkles className='h-4 w-4 text-emerald-500' />
                    <p className='text-sm font-medium text-emerald-700'>{t('noPlan')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className='moradi-card-sub border'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-bold'>{t('completed')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                {boardCompleted.length ? (
                  boardCompleted.map((item) => (
                    <BoardItem
                      key={`${item.chore_id}-${item.work_date}`}
                      item={item}
                      t={t}
                      locale={locale}
                      onToggle={() => toggleCompletion(item)}
                      padTime={padTime}
                    />
                  ))
                ) : (
                  <p className='py-4 text-center text-sm text-slate-500'>{t('noData')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ScheduleSection({
  t,
  weekViewStart,
  setWeekViewStart,
  weekViewCount,
  setWeekViewCount,
  weekOwners,
  locale,
  onEditWeekOwner,
  weekPlans,
  formatDay,
  openInstance,
  toggleInstanceDisabled
}) {
  return (
    <div className='grid animate-fade-in gap-5'>
      <Card className='moradi-card'>
        <CardHeader>
          <CardTitle className='text-base font-bold'>{t('weekResponsibility')}</CardTitle>
          <CardDescription>{t('sectionScheduleSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex flex-wrap items-end gap-3'>
            <div className='grid gap-1'>
              <Label className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('startWeek')}</Label>
              <Input type='date' value={weekViewStart} onChange={(e) => setWeekViewStart(startOfWeek(e.target.value))} className='rounded-xl' />
            </div>
            <div className='grid gap-1'>
              <Label className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('weeksShown')}</Label>
              <Tabs value={String(weekViewCount)} onValueChange={(value) => setWeekViewCount(Number(value))} className='w-[220px]'>
                <TabsList className='grid w-full grid-cols-4 rounded-xl'>
                  <TabsTrigger value='4' className='rounded-lg'>4</TabsTrigger>
                  <TabsTrigger value='6' className='rounded-lg'>6</TabsTrigger>
                  <TabsTrigger value='8' className='rounded-lg'>8</TabsTrigger>
                  <TabsTrigger value='12' className='rounded-lg'>12</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className='overflow-auto rounded-xl border border-slate-200'>
            <table className='w-full min-w-[760px] text-sm'>
              <thead>
                <tr className='border-b bg-slate-50/80'>
                  <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('weekNumber')}</th>
                  <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('weekStart')}</th>
                  <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('range')}</th>
                  <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('responsible')}</th>
                  <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {weekOwners.length ? (
                  weekOwners.map((row) => (
                    <tr key={row.week_start} className='border-t transition-colors hover:bg-theme-50/30'>
                      <td className='p-3'>
                        <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg bg-theme-100 text-xs font-bold text-theme-700'>
                          {weekNumberFromDateKey(row.week_start)}
                        </span>
                      </td>
                      <td className='p-3 text-slate-600'>{row.week_start}</td>
                      <td className='p-3 text-slate-600'>{formatWeekRange(row.week_start, locale)}</td>
                      <td className='p-3'>
                        <span className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          row.person_name ? 'bg-theme-100 text-theme-700' : 'bg-slate-100 text-slate-500'
                        )}>
                          {row.person_name || t('unassigned')}
                        </span>
                      </td>
                      <td className='p-3'>
                        <Button variant='outline' size='icon' onClick={() => onEditWeekOwner(row)} className='h-8 w-8 rounded-lg'>
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className='p-6 text-center text-slate-500'>
                      {t('noWeekOwners')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className='moradi-card'>
        <CardHeader>
          <div className='flex flex-wrap items-end justify-between gap-3'>
            <div>
              <CardTitle className='text-base font-bold'>{t('weeklyInstance')}</CardTitle>
              <CardDescription>{formatWeekRange(weekViewStart, locale)}</CardDescription>
            </div>
            <div className='flex items-center gap-1'>
              <Button variant='outline' size='icon' onClick={() => setWeekViewStart((value) => addDays(value, -7))} className='rounded-xl'>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon' onClick={() => setWeekViewStart((value) => addDays(value, 7))} className='rounded-xl'>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='scroll-area-soft overflow-x-auto pb-2'>
            <div className='grid min-w-[1120px] grid-cols-5 gap-3'>
              {mondayToFridayDates(weekViewStart).map((dateKey) => {
                const dayItems = weekPlans[dateKey] || [];
                const isToday = dateKey === todayKey();
                return (
                  <div key={dateKey} className={cn('day-column', isToday && 'day-column-today')}>
                    <div className='border-b border-slate-200/60 px-3 pb-2 pt-3'>
                      <p className={cn('text-sm font-bold', isToday ? 'text-theme-700' : 'text-slate-900')}>
                        {formatDay(dateKey)}
                      </p>
                    </div>
                    <div className='space-y-2 px-2.5 pb-3 pt-2.5'>
                      {dayItems.length ? (
                        dayItems.map((item) => {
                          const state = item.instance_disabled ? 'disabled' : item.completion ? 'done' : item.overdue ? 'overdue' : 'open';
                          return (
                            <div
                              key={`${dateKey}-${item.chore_id}`}
                              className={cn(
                                'rounded-xl border p-2.5 transition-all duration-200',
                                state === 'disabled' ? 'chore-card-disabled'
                                  : state === 'done' ? 'chore-card-done'
                                    : state === 'overdue' ? 'chore-card-overdue'
                                      : 'chore-card-open'
                              )}
                            >
                              <div className='flex items-start justify-between gap-1'>
                                <div className='min-w-0'>
                                  <p className='text-sm font-semibold leading-tight text-slate-900'>{item.chore_name}</p>
                                  <div className='mt-1 flex flex-wrap gap-1'>
                                    {item.responsible_person ? (
                                      <span className='inline-flex items-center gap-0.5 rounded-full bg-theme-100 px-1.5 py-0.5 text-[10px] font-medium text-theme-700'>
                                        <UserRound className='h-2.5 w-2.5' />
                                        {item.responsible_person.name}
                                      </span>
                                    ) : null}
                                    {item.due_time ? (
                                      <span className='inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700'>
                                        <Clock3 className='h-2.5 w-2.5' />
                                        {item.due_time}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <Badge
                                  variant={state === 'done' ? 'default' : state === 'overdue' ? 'destructive' : 'secondary'}
                                  className='shrink-0 rounded-full text-[10px]'
                                >
                                  {state === 'disabled' ? t('disabled')
                                    : state === 'done' ? t('done')
                                      : state === 'overdue' ? t('overdue')
                                        : t('open')}
                                </Badge>
                              </div>
                              <div className='mt-2 flex items-center gap-1'>
                                <Button variant='outline' size='icon' onClick={() => openInstance(item, dateKey)} className='h-7 w-7 rounded-lg'>
                                  <Pencil className='h-3 w-3' />
                                </Button>
                                <Button variant='outline' size='icon' onClick={() => toggleInstanceDisabled(item, dateKey)} className='h-7 w-7 rounded-lg'>
                                  {item.instance_disabled ? <Play className='h-3 w-3' /> : <Pause className='h-3 w-3' />}
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className='py-4 text-center text-xs text-slate-400'>{t('noDue')}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatsSection({ t, statsStart, setStatsStart, statsEnd, setStatsEnd, statsRange, setStatsRange, stats, onRefresh }) {
  return (
    <Card className='moradi-card animate-fade-in'>
      <CardHeader>
        <CardTitle className='text-base font-bold'>{t('leaderboard')}</CardTitle>
        <CardDescription>{t('weeklyMomentum')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='grid gap-1'>
            <Label className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('from')}</Label>
            <Input
              type='date'
              value={statsStart}
              onChange={(e) => {
                setStatsStart(e.target.value);
                setStatsRange('custom');
              }}
              className='rounded-xl'
            />
          </div>
          <div className='grid gap-1'>
            <Label className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('to')}</Label>
            <Input
              type='date'
              value={statsEnd}
              onChange={(e) => {
                setStatsEnd(e.target.value);
                setStatsRange('custom');
              }}
              className='rounded-xl'
            />
          </div>
          <div className='grid gap-1'>
            <Label className='text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('range')}</Label>
            <Tabs
              value={String(statsRange)}
              onValueChange={(value) => {
                setStatsRange(value === 'custom' ? 'custom' : Number(value));
                if (value !== 'custom') {
                  const days = Number(value);
                  setStatsEnd(todayKey());
                  setStatsStart(addDays(todayKey(), -(days - 1)));
                }
              }}
              className='w-[320px]'
            >
              <TabsList className='grid w-full grid-cols-5 rounded-xl'>
                <TabsTrigger value='14' className='rounded-lg'>{t('dayRange', { days: 14 })}</TabsTrigger>
                <TabsTrigger value='30' className='rounded-lg'>{t('dayRange', { days: 30 })}</TabsTrigger>
                <TabsTrigger value='90' className='rounded-lg'>{t('dayRange', { days: 90 })}</TabsTrigger>
                <TabsTrigger value='180' className='rounded-lg'>{t('dayRange', { days: 180 })}</TabsTrigger>
                <TabsTrigger value='custom' className='rounded-lg'>{t('custom')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className='self-end'>
            <Button onClick={onRefresh} className='rounded-xl'>{t('refresh')}</Button>
          </div>
        </div>

        <div className='overflow-auto rounded-xl border border-slate-200'>
          <table className='w-full min-w-[920px] text-sm'>
            <thead>
              <tr className='border-b bg-slate-50/80'>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>#</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('placeHolderName')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('score')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('ownDone')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('assigned')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('ownRate')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('onTime')}</th>
                <th className='p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500'>{t('streak')}</th>
              </tr>
            </thead>
            <tbody>
              {stats?.leaderboard?.length ? (
                stats.leaderboard.map((row) => (
                  <tr key={row.person_id} className='border-t transition-colors hover:bg-theme-50/30'>
                    <td className='p-3'>
                      <span className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                        row.rank === 1 ? 'bg-amber-100 text-amber-700'
                          : row.rank === 2 ? 'bg-slate-200 text-slate-700'
                            : row.rank === 3 ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                      )}>
                        {row.rank}
                      </span>
                    </td>
                    <td className='p-3 font-semibold text-slate-900'>{row.name}</td>
                    <td className='p-3'>
                      <span className='rounded-full bg-theme-100 px-2.5 py-0.5 text-xs font-bold text-theme-700'>{row.score}</span>
                    </td>
                    <td className='p-3 text-slate-600'>{row.self_done}</td>
                    <td className='p-3 text-slate-600'>{row.assigned}</td>
                    <td className='p-3 text-slate-600'>{row.ownership_rate ?? '-'}%</td>
                    <td className='p-3 text-slate-600'>{row.on_time_rate ?? '-'}%</td>
                    <td className='p-3'>
                      <span className='rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700'>{row.current_streak}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className='p-6 text-center text-slate-500'>
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
