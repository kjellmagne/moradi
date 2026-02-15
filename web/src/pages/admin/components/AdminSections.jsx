import { addDays, formatWeekRange, mondayToFridayDates, startOfWeek, todayKey, weekNumberFromDateKey } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { BoardItem, StatCard } from './AdminShared';

function formatDateNo(dateKey) {
  const [year, month, day] = String(dateKey || '').split('-');
  if (!year || !month || !day) return String(dateKey || '');
  return `${day}-${month}-${year}`;
}

export function OverviewSection({ t, overviewSummary, overviewWeekOwners, overviewPlan, overviewAlerts }) {
  return (
    <div className='grid gap-4'>
      <div className='grid gap-4 lg:grid-cols-[1.15fr_0.85fr]'>
        <div className='grid gap-4'>
          <Card className='moradi-card'>
            <CardHeader className='pb-2'>
              <CardTitle>{t('todayGlance')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2 pt-0 md:grid-cols-4'>
              <StatCard label={t('total')} value={overviewSummary?.total || 0} compact />
              <StatCard label={t('completed')} value={overviewSummary?.done || 0} tone='good' compact />
              <StatCard label={t('open')} value={overviewSummary?.open || 0} compact />
              <StatCard label={t('overdue')} value={overviewSummary?.overdue || 0} tone='warn' compact />
            </CardContent>
          </Card>

          <Card className='moradi-card'>
            <CardHeader>
              <CardTitle>{t('todayChores')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-2'>
              {overviewPlan.length ? (
                overviewPlan.map((item) => (
                  <div key={`${item.chore_id}-${item.work_date}`} className='rounded-xl border border-slate-200 bg-white/95 p-3'>
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <p className='font-medium'>{item.chore_name}</p>
                        <p className='text-sm text-muted-foreground'>{item.description || t('noDescription')}</p>
                      </div>
                      <Badge variant={item.completion ? 'default' : item.overdue ? 'destructive' : 'secondary'}>
                        {item.completion ? t('done') : item.overdue ? t('overdue') : t('open')}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>{t('noPlan')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className='moradi-card'>
          <CardHeader>
            <CardTitle>{t('upcomingWeeks')}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            {overviewWeekOwners.length ? (
              overviewWeekOwners.map((row) => (
                <div key={row.week_start} className='rounded-xl border border-slate-200 bg-white/95 p-2.5 text-sm'>
                  <div className='font-medium'>
                    {t('weekNumber')} {weekNumberFromDateKey(row.week_start)}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {t('from')} {formatDateNo(row.week_start)} · {t('to')} {formatDateNo(addDays(row.week_start, 6))}
                  </div>
                  <div className='mt-1'>
                    {t('responsible')}: <span className='font-medium'>{row.person_name ? row.person_name : t('unassigned')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground'>{t('noWeekOwners')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='moradi-card'>
        <CardHeader>
          <CardTitle>{t('deadlineAlerts')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2'>
          {overviewAlerts.length ? (
            overviewAlerts.map((alert) => (
              <div key={alert.id} className='rounded-xl border border-orange-200 bg-orange-50/85 p-3 text-sm'>
                <p className='font-medium'>{alert.chore_name}</p>
                <p className='text-orange-800'>{alert.message}</p>
              </div>
            ))
          ) : (
            <p className='text-sm text-muted-foreground'>{t('noAlerts')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamSection({ t, people, onCreate, onEdit, onDelete }) {
  return (
    <Card className='moradi-card'>
      <CardHeader className='flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle>{t('team')}</CardTitle>
          <CardDescription>{t('sectionTeamSubtitle')}</CardDescription>
        </div>
        <Button onClick={onCreate}>
          <Plus className='h-4 w-4' />
          {t('addMember')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-auto rounded-xl border border-slate-200 bg-white/95'>
          <table className='w-full min-w-[640px] text-sm'>
            <thead className='bg-slate-50/80'>
              <tr>
                <th className='p-2 text-left font-medium'>{t('placeHolderName')}</th>
                <th className='p-2 text-left font-medium'>{t('placeHolderEmail')}</th>
                <th className='p-2 text-left font-medium'>{t('placeHolderPhone')}</th>
                <th className='p-2 text-left font-medium'>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {people.length ? (
                people.map((row) => (
                  <tr key={row.id} className='border-t'>
                    <td className='p-2'>{row.name}</td>
                    <td className='p-2'>{row.email || '-'}</td>
                    <td className='p-2'>{row.phone || '-'}</td>
                    <td className='p-2'>
                      <div className='flex items-center gap-1'>
                        <Button variant='outline' size='icon' onClick={() => onEdit(row)} title={t('edit')}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={() => onDelete(row)} title={t('delete')}>
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className='p-4 text-muted-foreground'>
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
    <Card className='moradi-card'>
      <CardHeader className='flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle>{t('chores')}</CardTitle>
          <CardDescription>{t('sectionChoresSubtitle')}</CardDescription>
        </div>
        <Button onClick={onCreate}>
          <Plus className='h-4 w-4' />
          {t('addChore')}
        </Button>
      </CardHeader>
      <CardContent>
        <div className='overflow-auto rounded-xl border border-slate-200 bg-white/95'>
          <table className='w-full min-w-[840px] text-sm'>
            <thead className='bg-slate-50/80'>
              <tr>
                <th className='p-2 text-left font-medium'>{t('placeHolderName')}</th>
                <th className='p-2 text-left font-medium'>{t('schedule')}</th>
                <th className='p-2 text-left font-medium'>{t('deadline')}</th>
                <th className='p-2 text-left font-medium'>{t('alerts')}</th>
                <th className='p-2 text-left font-medium'>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {chores.length ? (
                chores.map((row) => (
                  <tr key={row.id} className='border-t'>
                    <td className='p-2'>
                      <p className='font-medium'>{row.name}</p>
                      <p className='text-xs text-muted-foreground'>{row.description || t('noDescription')}</p>
                    </td>
                    <td className='p-2'>{choreSchedule(row)}</td>
                    <td className='p-2'>{row.due_time || t('noDeadline')}</td>
                    <td className='p-2'>
                      <Badge variant={Number(row.alert_enabled) ? 'default' : 'secondary'}>
                        {Number(row.alert_enabled) ? t('on') : t('off')}
                      </Badge>
                    </td>
                    <td className='p-2'>
                      <div className='flex items-center gap-1'>
                        <Badge variant={row.active ? 'default' : 'secondary'}>{row.active ? t('active') : t('inactive')}</Badge>
                        <Button variant='outline' size='icon' onClick={() => onEdit(row)}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={() => onDelete(row)}>
                          <Trash2 className='h-4 w-4 text-red-600' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={() => onToggle(row)}>
                          {row.active ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='p-4 text-muted-foreground'>
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
  return (
    <div className='grid gap-4'>
      <Card className='moradi-card'>
        <CardHeader>
          <CardTitle>{t('sectionBoardTitle')}</CardTitle>
          <CardDescription>{t('sectionBoardSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex flex-wrap items-end gap-2'>
            <Button variant='outline' size='icon' onClick={() => setPlanDate((value) => addDays(value, -1))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div className='grid gap-1'>
              <Label>{t('date')}</Label>
              <Input type='date' value={planDate} onChange={(event) => setPlanDate(event.target.value)} />
            </div>
            <Button variant='outline' size='icon' onClick={() => setPlanDate((value) => addDays(value, 1))}>
              <ChevronRight className='h-4 w-4' />
            </Button>
            <div className='ml-2 text-sm text-muted-foreground'>
              <p className='font-medium text-foreground'>{formatDay(planDate)}</p>
              <p>{`#${weekNumberFromDateKey(planDate)} · ${formatWeekRange(startOfWeek(planDate), locale)}`}</p>
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-5'>
            <StatCard label={t('total')} value={boardSummary.total} />
            <StatCard label={t('completed')} value={boardSummary.done} tone='good' />
            <StatCard label={t('open')} value={boardSummary.open} />
            <StatCard label={t('overdue')} value={boardSummary.overdue} tone='warn' />
            <StatCard label={t('unassigned')} value={boardSummary.unassigned} tone='warn' />
          </div>

          <div className='grid gap-3 lg:grid-cols-2'>
            <Card className='moradi-card-sub'>
              <CardHeader>
                <CardTitle>{t('open')}</CardTitle>
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
                  <p className='text-sm text-muted-foreground'>{t('noPlan')}</p>
                )}
              </CardContent>
            </Card>
            <Card className='moradi-card-sub'>
              <CardHeader>
                <CardTitle>{t('completed')}</CardTitle>
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
                  <p className='text-sm text-muted-foreground'>{t('noData')}</p>
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
    <div className='grid gap-4'>
      <Card className='moradi-card'>
        <CardHeader>
          <CardTitle>{t('weekResponsibility')}</CardTitle>
          <CardDescription>{t('sectionScheduleSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <div className='flex flex-wrap items-end gap-2'>
            <div className='grid gap-1'>
              <Label>{t('startWeek')}</Label>
              <Input type='date' value={weekViewStart} onChange={(e) => setWeekViewStart(startOfWeek(e.target.value))} />
            </div>
            <div className='grid gap-1'>
              <Label>{t('weeksShown')}</Label>
              <Tabs value={String(weekViewCount)} onValueChange={(value) => setWeekViewCount(Number(value))} className='w-[220px]'>
                <TabsList className='grid w-full grid-cols-4'>
                  <TabsTrigger value='4'>4</TabsTrigger>
                  <TabsTrigger value='6'>6</TabsTrigger>
                  <TabsTrigger value='8'>8</TabsTrigger>
                  <TabsTrigger value='12'>12</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className='overflow-auto rounded-xl border border-slate-200 bg-white/95'>
            <table className='w-full min-w-[760px] text-sm'>
              <thead className='bg-slate-50/80'>
                <tr>
                  <th className='p-2 text-left'>{t('weekNumber')}</th>
                  <th className='p-2 text-left'>{t('weekStart')}</th>
                  <th className='p-2 text-left'>{t('range')}</th>
                  <th className='p-2 text-left'>{t('responsible')}</th>
                  <th className='p-2 text-left'>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {weekOwners.length ? (
                  weekOwners.map((row) => (
                    <tr key={row.week_start} className='border-t'>
                      <td className='p-2'>{weekNumberFromDateKey(row.week_start)}</td>
                      <td className='p-2'>{row.week_start}</td>
                      <td className='p-2'>{formatWeekRange(row.week_start, locale)}</td>
                      <td className='p-2'>{row.person_name || t('unassigned')}</td>
                      <td className='p-2'>
                        <Button variant='outline' size='icon' onClick={() => onEditWeekOwner(row)}>
                          <Pencil className='h-4 w-4' />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className='p-4 text-muted-foreground'>
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
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <CardTitle>{t('weeklyInstance')}</CardTitle>
              <CardDescription>{formatWeekRange(weekViewStart, locale)}</CardDescription>
            </div>
            <div className='flex items-center gap-1'>
              <Button variant='outline' size='icon' onClick={() => setWeekViewStart((value) => addDays(value, -7))}>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon' onClick={() => setWeekViewStart((value) => addDays(value, 7))}>
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
                  <Card key={dateKey} className={`${isToday ? 'border-blue-300 bg-blue-50/70' : 'moradi-card-sub'}`}>
                    <CardHeader className='border-b pb-2'>
                      <CardTitle className='text-sm'>{formatDay(dateKey)}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2 pt-3'>
                      {dayItems.length ? (
                        dayItems.map((item) => (
                          <div
                            key={`${dateKey}-${item.chore_id}`}
                            className={`rounded-lg border p-2 ${
                              item.instance_disabled
                                ? 'bg-muted'
                                : item.completion
                                  ? 'border-green-200 bg-green-50'
                                  : item.overdue
                                    ? 'border-orange-200 bg-orange-50'
                                    : 'bg-white'
                            }`}
                          >
                            <div className='flex items-start justify-between gap-1'>
                              <div>
                                <p className='text-sm font-medium leading-tight'>{item.chore_name}</p>
                                <p className='text-xs text-muted-foreground'>
                                  {item.responsible_person?.name || t('unassigned')}
                                  {item.due_time ? ` · ${item.due_time}` : ''}
                                </p>
                              </div>
                              <Badge variant={item.completion ? 'default' : item.overdue ? 'destructive' : 'secondary'}>
                                {item.instance_disabled
                                  ? t('disabled')
                                  : item.completion
                                    ? t('done')
                                    : item.overdue
                                      ? t('overdue')
                                      : t('open')}
                              </Badge>
                            </div>
                            <div className='mt-2 flex items-center gap-1'>
                              <Button variant='outline' size='icon' onClick={() => openInstance(item, dateKey)}>
                                <Pencil className='h-4 w-4' />
                              </Button>
                              <Button variant='outline' size='icon' onClick={() => toggleInstanceDisabled(item, dateKey)}>
                                {item.instance_disabled ? <Play className='h-4 w-4' /> : <Pause className='h-4 w-4' />}
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className='text-sm text-muted-foreground'>{t('noDue')}</p>
                      )}
                    </CardContent>
                  </Card>
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
    <Card className='moradi-card'>
      <CardHeader>
        <CardTitle>{t('leaderboard')}</CardTitle>
        <CardDescription>{t('weeklyMomentum')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex flex-wrap gap-2'>
          <div className='grid gap-1'>
            <Label>{t('from')}</Label>
            <Input
              type='date'
              value={statsStart}
              onChange={(e) => {
                setStatsStart(e.target.value);
                setStatsRange('custom');
              }}
            />
          </div>
          <div className='grid gap-1'>
            <Label>{t('to')}</Label>
            <Input
              type='date'
              value={statsEnd}
              onChange={(e) => {
                setStatsEnd(e.target.value);
                setStatsRange('custom');
              }}
            />
          </div>
          <div className='grid gap-1'>
            <Label>{t('range')}</Label>
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
              <TabsList className='grid w-full grid-cols-5'>
                <TabsTrigger value='14'>{t('dayRange', { days: 14 })}</TabsTrigger>
                <TabsTrigger value='30'>{t('dayRange', { days: 30 })}</TabsTrigger>
                <TabsTrigger value='90'>{t('dayRange', { days: 90 })}</TabsTrigger>
                <TabsTrigger value='180'>{t('dayRange', { days: 180 })}</TabsTrigger>
                <TabsTrigger value='custom'>{t('custom')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className='self-end'>
            <Button onClick={onRefresh}>{t('refresh')}</Button>
          </div>
        </div>

        <div className='overflow-auto rounded-xl border border-slate-200 bg-white/95'>
          <table className='w-full min-w-[920px] text-sm'>
            <thead className='bg-slate-50/80'>
              <tr>
                <th className='p-2 text-left'>#</th>
                <th className='p-2 text-left'>{t('placeHolderName')}</th>
                <th className='p-2 text-left'>{t('score')}</th>
                <th className='p-2 text-left'>{t('ownDone')}</th>
                <th className='p-2 text-left'>{t('assigned')}</th>
                <th className='p-2 text-left'>{t('ownRate')}</th>
                <th className='p-2 text-left'>{t('onTime')}</th>
                <th className='p-2 text-left'>{t('streak')}</th>
              </tr>
            </thead>
            <tbody>
              {stats?.leaderboard?.length ? (
                stats.leaderboard.map((row) => (
                  <tr key={row.person_id} className='border-t'>
                    <td className='p-2'>{row.rank}</td>
                    <td className='p-2'>{row.name}</td>
                    <td className='p-2'>{row.score}</td>
                    <td className='p-2'>{row.self_done}</td>
                    <td className='p-2'>{row.assigned}</td>
                    <td className='p-2'>{row.ownership_rate ?? '-'}%</td>
                    <td className='p-2'>{row.on_time_rate ?? '-'}%</td>
                    <td className='p-2'>{row.current_streak}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className='p-4 text-muted-foreground'>
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
