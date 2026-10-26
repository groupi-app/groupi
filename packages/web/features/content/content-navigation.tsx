'use client';

import Link from 'next/link';

export function ContentNavigation({
  basePath,
  context,
}: {
  basePath: string;
  context: 'event' | 'group';
}) {
  return (
    <nav
      aria-label={`${context === 'event' ? 'Event' : 'Group'} content`}
      className='flex flex-wrap gap-2'
    >
      {['Posts', 'Forms', 'Lists', 'Polls'].map((label, index) => (
        <Link
          key={label}
          href={
            index === 0 && context === 'event'
              ? `${basePath}#posts`
              : `${basePath}/${label.toLowerCase()}`
          }
          className='rounded-button border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring'
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
