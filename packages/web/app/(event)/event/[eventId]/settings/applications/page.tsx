'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { EventApplications } from '@/components/organisms/event-applications';
export default function ReviewApplicationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  return (
    <main className='p-6 space-y-6'>
      <EventApplications eventId={eventId as Id<'events'>} review />
    </main>
  );
}
