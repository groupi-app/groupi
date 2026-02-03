'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface CreateEventCardProps {
  /** Additional class names */
  className?: string;
}

/**
 * CreateEventCard - Dashed card for creating a new event
 */
export function CreateEventCard({ className }: CreateEventCardProps) {
  return (
    <Link
      href='/create'
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'min-h-[200px] rounded-card border-2 border-dashed border-border',
        'bg-transparent cursor-pointer',
        'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        'transition-all duration-fast ease-bounce',
        'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      <div className='flex items-center justify-center size-12 rounded-full bg-muted'>
        <Icons.plus className='size-6' />
      </div>
      <span className='font-medium'>New Event</span>
    </Link>
  );
}
