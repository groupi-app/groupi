import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface PaperDividerProps extends HTMLAttributes<HTMLDivElement> {
  treatment?: 'solid' | 'perforated';
  orientation?: 'horizontal' | 'vertical';
  /** Decorative seams are hidden from assistive technology by default. */
  decorative?: boolean;
}

/** A paper seam between content regions, not a new container or a torn edge. */
export function PaperDivider({
  treatment = 'solid',
  orientation = 'horizontal',
  decorative = true,
  className,
  ...props
}: PaperDividerProps) {
  return (
    <div
      data-slot='paper-divider'
      data-treatment={treatment}
      data-orientation={orientation}
      role={decorative ? undefined : 'separator'}
      aria-hidden={decorative || undefined}
      aria-orientation={decorative ? undefined : orientation}
      className={cn('paper-divider', className)}
      {...props}
    />
  );
}
