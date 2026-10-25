'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** The same header geometry for event content and its loading placeholders. */
export function EventHeaderLayout({
  cover,
  title,
  actions,
  metadata,
  description,
  rsvp,
  ...props
}: Omit<ComponentProps<'header'>, 'title'> & {
  cover?: ReactNode;
  title: ReactNode;
  actions: ReactNode;
  metadata: ReactNode;
  description?: ReactNode;
  rsvp?: ReactNode;
}) {
  return (
    <header
      {...props}
      className={cn(
        'flex min-w-0 flex-col md:my-5 max-w-4xl mx-auto gap-3',
        props.className
      )}
    >
      {cover}
      <div className='flex min-w-0 justify-between flex-col-reverse gap-3 md:flex-row'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>{title}</div>
        <div className='shrink-0'>{actions}</div>
      </div>
      <div className='flex min-w-0 flex-col gap-2'>{metadata}</div>
      {description}
      {rsvp}
    </header>
  );
}

export function EventTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        'min-w-0 break-words text-5xl font-heading font-medium',
        className
      )}
      {...props}
    />
  );
}
