import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Clock3, Undo2, UserRound } from 'lucide-react';

export function StatCard({ label, value, tone = 'default', compact = false }) {
  const toneClass =
    tone === 'good' ? 'stat-pill-good'
      : tone === 'warn' ? 'stat-pill-warn'
        : tone === 'bad' ? 'stat-pill-bad'
          : tone === 'primary' ? 'stat-pill-primary'
            : 'stat-pill-default';

  return (
    <div className={cn('stat-pill animate-scale-in', toneClass)}>
      <p className={cn(
        'font-semibold uppercase tracking-wider',
        compact ? 'text-[10px]' : 'text-[11px]',
        tone === 'good' ? 'text-emerald-600'
          : tone === 'warn' ? 'text-amber-600'
            : tone === 'bad' ? 'text-rose-600'
              : tone === 'primary' ? 'text-theme-600'
                : 'text-slate-500'
      )}>{label}</p>
      <p className={cn(
        'font-bold',
        compact ? 'mt-0.5 text-xl' : 'mt-1 text-2xl',
        tone === 'good' ? 'text-emerald-700'
          : tone === 'warn' ? 'text-amber-700'
            : tone === 'bad' ? 'text-rose-700'
              : tone === 'primary' ? 'text-theme-700'
                : 'text-slate-800'
      )}>{value}</p>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', InputComponent }) {
  const Input = InputComponent;
  return (
    <div className='grid gap-1.5'>
      <label className='text-sm font-semibold text-slate-700'>{label}</label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function choreState(item) {
  if (item.completion) return 'done';
  if (item.overdue) return 'overdue';
  return 'open';
}

export function BoardItem({ item, t, locale, onToggle, padTime }) {
  const state = choreState(item);

  const sourceLabel =
    item.assignment_source === 'instance_override'
      ? t('sourceOverride')
      : item.assignment_source === 'week_owner'
        ? t('sourceWeekOwner')
        : t('sourceUnassigned');

  const completionText =
    item.completion && item.completion?.completed_at
      ? t('doneByAt', {
          name: item.completion?.completed_by_name || t('unassigned'),
          time: padTime(item.completion?.completed_at, locale)
        })
      : item.completion
        ? t('doneBy', { name: item.completion?.completed_by_name || t('unassigned') })
        : '';

  return (
    <div className={cn(
      'rounded-xl border p-3.5 transition-all duration-200',
      state === 'done' ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
        : state === 'overdue' ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50'
          : 'border-slate-200 bg-white'
    )}
    style={{ boxShadow: '0 2px 8px rgba(var(--theme-shadow), 0.04)' }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <button
            type='button'
            onClick={onToggle}
            className={cn(
              'check-circle mt-0.5 h-9 w-9 shrink-0',
              state === 'done' && 'check-circle-done',
              state === 'overdue' && 'check-circle-overdue',
              state === 'open' && 'check-circle-open'
            )}
          >
            {state === 'done' ? <Check className='h-4 w-4' /> : state === 'overdue' ? <Clock3 className='h-4 w-4' /> : <div className='h-3 w-3 rounded-full border-2 border-current' />}
          </button>

          <div className='min-w-0'>
            <p className={cn(
              'font-semibold',
              state === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'
            )}>{item.chore_name}</p>
            <p className='text-sm text-slate-500'>{item.description || t('noDescription')}</p>

            <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
              {item.responsible_person ? (
                <span className='inline-flex items-center gap-1 rounded-full bg-theme-100 px-2 py-0.5 text-[11px] font-medium text-theme-700'>
                  <UserRound className='h-3 w-3' />
                  {item.responsible_person.name}
                </span>
              ) : (
                <span className='inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500'>
                  {t('unassigned')}
                </span>
              )}
              {item.due_time ? (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  state === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-50 text-amber-700'
                )}>
                  <Clock3 className='h-3 w-3' />
                  {t('deadline')}: {item.due_time}
                </span>
              ) : null}
              <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500'>
                {sourceLabel}
              </span>
            </div>

            {completionText ? <p className='mt-1 text-xs text-emerald-600'>{completionText}</p> : null}
          </div>
        </div>

        <Badge
          variant={state === 'done' ? 'default' : state === 'overdue' ? 'destructive' : 'secondary'}
          className='shrink-0 rounded-full'
        >
          {state === 'done' ? t('done') : state === 'overdue' ? t('overdue') : t('open')}
        </Badge>
      </div>
    </div>
  );
}
