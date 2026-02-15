import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Undo2 } from 'lucide-react';

export function StatCard({ label, value, tone = 'default', compact = false }) {
  return (
    <div
      className={`rounded-xl border ${compact ? 'p-2.5' : 'p-3'} ${
        tone === 'good'
          ? 'border-emerald-200 bg-emerald-50/85'
          : tone === 'warn'
            ? 'border-orange-200 bg-orange-50/85'
            : 'border-slate-200 bg-white/90'
      }`}
    >
      <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} uppercase tracking-wider text-muted-foreground`}>{label}</p>
      <p className={`${compact ? 'mt-0.5 text-xl' : 'mt-1 text-2xl'} font-semibold`}>{value}</p>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', InputComponent }) {
  const Input = InputComponent;
  return (
    <div className='grid gap-1'>
      <label className='text-sm font-medium'>{label}</label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function BoardItem({ item, t, locale, onToggle, padTime }) {
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
    <div className='rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm'>
      <div className='flex items-start justify-between gap-2'>
        <div>
          <p className='font-medium'>{item.chore_name}</p>
          <p className='text-sm text-muted-foreground'>{item.description || t('noDescription')}</p>
          <p className='text-xs text-muted-foreground'>
            {t('responsible')}: {item.responsible_person?.name || t('unassigned')}
            {item.due_time ? ` · ${t('deadline')}: ${item.due_time}` : ''}
          </p>
          {completionText ? <p className='text-xs text-muted-foreground'>{completionText}</p> : null}
        </div>
        <div className='flex flex-col items-end gap-1'>
          <Badge variant={item.completion ? 'default' : item.overdue ? 'destructive' : 'secondary'}>
            {item.completion ? t('done') : item.overdue ? t('overdue') : t('open')}
          </Badge>
          <Badge variant='outline'>{sourceLabel}</Badge>
          {!item.responsible_person ? <Badge variant='secondary'>{t('unassigned')}</Badge> : null}
        </div>
      </div>
      <div className='mt-2 flex justify-end'>
        <Button variant='outline' size='icon' onClick={onToggle}>
          {item.completion ? <Undo2 className='h-4 w-4' /> : <Check className='h-4 w-4' />}
        </Button>
      </div>
    </div>
  );
}
