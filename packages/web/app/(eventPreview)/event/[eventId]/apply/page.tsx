'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { EventApplications } from '@/components/organisms/event-applications';
export default function EventApplicationPage() {
  const { eventId } = useParams<{ eventId: string }>();
  return (
    <main className='mx-auto max-w-2xl p-6 space-y-6'>
      <Link
        href={`/event/${eventId}/preview`}
        className='text-primary underline'
      >
        Event details
      </Link>
      <EventApplications eventId={eventId as Id<'events'>} />
    </main>
  );
}
