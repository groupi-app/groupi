'use client';
import type { ReactNode } from 'react';
import { useConvexAuth } from 'convex/react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { EventToolScope } from '@/features/content';
export default function EventContentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { eventId } = useParams<{ eventId: string }>();
  const path = usePathname();
  if (isLoading) return <p role='status'>Loading…</p>;
  if (!isAuthenticated)
    return (
      <main className='p-6'>
        <Link
          className='text-primary underline'
          href={`/sign-in?redirect=${encodeURIComponent(path)}`}
        >
          Sign in or sign up to open Event content
        </Link>
      </main>
    );
  return (
    <EventToolScope eventId={eventId as Id<'events'>}>
      <div className='mx-auto max-w-4xl'>
        <Link
          className='inline-block p-6 text-primary underline'
          href={`/event/${eventId}`}
        >
          Back to Event
        </Link>
        {children}
      </div>
    </EventToolScope>
  );
}
