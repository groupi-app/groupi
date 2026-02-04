'use client';

import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { EditEventMultiDate } from '../../../edit/components/edit-event-multi-date';
import { ChangeDateMultiSkeleton } from '@/components/skeletons';

export function ChangeDateMultiContent({ eventId }: { eventId: string }) {
  const eventData = useEventHeader(eventId as Id<'events'>);

  if (!eventData) {
    return <ChangeDateMultiSkeleton />;
  }

  // TODO: Fetch existing potential date times with end times from the backend
  // For now, we start with an empty list since users are creating a new poll
  const initialOptions = undefined;

  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time Options</h1>
      <EditEventMultiDate
        eventId={eventId as Id<'events'>}
        initialOptions={initialOptions}
      />
    </div>
  );
}
