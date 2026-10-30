import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({
  className,
  presentation = 'soft',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { presentation?: 'soft' }) {
  return (
    <div
      data-slot='skeleton'
      data-presentation={presentation}
      className={cn(
        'animate-pulse rounded-soft bg-muted',
        presentation === 'soft' && 'motion-reduce:animate-none',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
