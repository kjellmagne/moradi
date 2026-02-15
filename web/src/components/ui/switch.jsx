import React from 'react';
import { cn } from '@/lib/utils';

export function Switch({ checked, onCheckedChange, className, ...props }) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors',
        checked ? 'bg-primary border-primary' : 'bg-muted border-border',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
