'use client';
import type { ReactNode } from 'react';
export function GroupSettingsPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className='space-y-6'>
      <h2 className='font-heading text-2xl font-semibold'>{title}</h2>
      {children}
    </section>
  );
}
