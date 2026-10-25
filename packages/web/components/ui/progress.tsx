'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/lib/utils';

export function Progress({
  className,
  presentation = 'soft',
  value,
  max = 100,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  presentation?: 'soft';
}) {
  const resolvedMax = Number.isFinite(max) && max > 0 ? max : 100;
  const resolvedValue =
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(resolvedMax, Math.max(0, value))
      : null;

  return (
    <ProgressPrimitive.Root
      value={resolvedValue}
      max={resolvedMax}
      data-slot='progress'
      data-presentation={presentation}
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-pill bg-secondary',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot='progress-indicator'
        className='h-full w-full flex-1 bg-primary transition-all duration-normal ease-bounce'
        style={{
          ...(presentation === 'soft'
            ? { width: `${((resolvedValue ?? 0) / resolvedMax) * 100}%` }
            : {
                transform: `translateX(-${100 - ((resolvedValue ?? 0) / resolvedMax) * 100}%)`,
              }),
        }}
      />
    </ProgressPrimitive.Root>
  );
}
