'use client';

import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { EditEventSingleDate } from '../../../edit/components/edit-event-single-date';
import { ChangeDateSingleSkeleton } from '@/components/skeletons';

export function ChangeDateSingleContent({
  eventId,
}: {
  eventId: string;
}) {
  const eventData = useEventHeader(eventId as Id<"events">);

  if (eventData === undefined) {
    return <ChangeDateSingleSkeleton />;
  }

  if (eventData === null) {
    return <div>Event not found</div>;
  }

  // Check if user is a member
  if (!eventData.userMembership) {
    return <div>You are not a member of this event</div>;
  }

  const { event } = eventData;
  // Convert timestamp to Date for the component
  const datetime = event.chosenDateTime ? new Date(event.chosenDateTime) : undefined;

  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time</h1>
      <EditEventSingleDate eventId={eventId} datetime={datetime} />
    </div>
  );
}
