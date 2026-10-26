'use client';

import type { ReactNode } from 'react';
import { ClipboardList, ListChecks, Vote } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared reading width and resilient controls for authored tools and their results. */
export function ContentPage({
  children,
  embedded = false,
}: {
  children: ReactNode;
  embedded?: boolean;
}) {
  const Tag = embedded ? 'article' : 'main';
  return (
    <Tag
      className={cn(
        'mx-auto w-full min-w-0 max-w-2xl space-y-6 break-words text-foreground [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:leading-relaxed [&_select]:w-full [&_select]:min-w-0 [&_select]:rounded-input [&_select]:border [&_select]:border-input [&_select]:bg-background [&_select]:p-3 [&_select]:text-sm [&_button]:max-w-full [&_button]:whitespace-normal [&_button]:h-auto [&_button]:min-h-10 [&_a]:break-words',
        embedded
          ? 'rounded-card border border-border bg-card p-4 sm:p-6'
          : 'px-4 py-6 sm:px-6 sm:py-8'
      )}
    >
      {children}
    </Tag>
  );
}

export function ContentKind({
  kind,
  editing = false,
}: {
  kind: 'Form' | 'List' | 'Poll';
  editing?: boolean;
}) {
  const Icon = { Form: ClipboardList, List: ListChecks, Poll: Vote }[kind];
  return (
    <div className='flex items-center gap-2 text-sm font-semibold text-primary'>
      <Icon className='size-4 shrink-0' aria-hidden='true' />
      {kind}
      {editing && (
        <span className='font-normal text-muted-foreground'>· Editing</span>
      )}
    </div>
  );
}

export function ContentSettings({
  children,
  title = 'Settings & details',
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <details className='rounded-input border border-border bg-bg-sunken/50 p-4 text-sm'>
      <summary className='cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-ring'>
        {title}
      </summary>
      <div className='mt-4 space-y-4 text-muted-foreground [&_label]:text-foreground'>
        {children}
      </div>
    </details>
  );
}

export const contentCanvas =
  'space-y-6 rounded-card border border-border bg-card p-4 sm:p-6';
export const contentTitleField =
  'min-h-16 resize-none border-transparent bg-transparent px-0 font-heading text-2xl font-bold leading-tight shadow-none sm:text-3xl field-sizing-content';
export const contentDescriptionField =
  'min-h-20 resize-y border-transparent bg-transparent px-0 text-base leading-relaxed field-sizing-content';
export const contentChoice =
  'flex min-w-0 items-start gap-3 rounded-input border border-border bg-bg-sunken/50 p-3 text-sm leading-relaxed transition-colors focus-within:ring-2 focus-within:ring-ring has-[:checked]:border-primary has-[:checked]:bg-primary/5';
