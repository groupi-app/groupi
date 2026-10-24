'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className='mx-auto w-full max-w-3xl px-6 py-12 text-foreground'>
      <h1 className='font-heading mb-8 text-4xl font-bold tracking-tight'>
        {title}
      </h1>
      <div className='space-y-8 leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_p+p]:mt-3 [&_a]:underline'>
        {children}
      </div>
      <nav
        aria-label='Help and privacy'
        className='mt-10 flex flex-wrap gap-6 border-t border-border pt-6 text-sm'
      >
        <Link href='/privacy'>Privacy policy</Link>
        <Link href='/support'>Support</Link>
      </nav>
    </article>
  );
}
