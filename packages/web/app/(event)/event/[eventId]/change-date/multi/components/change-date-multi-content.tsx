'use client';

import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { EditEventMultiDate } from '../../../edit/components/edit-event-multi-date';
import { ChangeDateMultiSkeleton } from '@/components/skeletons';

export function ChangeDateMultiContent({ eventId }: { eventId: string }) {
  const eventData = useEventHeader(eventId as Id<"events">);

  if (!eventData) {
    return <ChangeDateMultiSkeleton />;
  }

  const dates = undefined;

  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time Options</h1>
      <EditEventMultiDate eventId={eventId as Id<"events">} dates={dates} />
    </div>
  );
}
