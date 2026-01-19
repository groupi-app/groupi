'use client';

import { EditEventContent } from './edit-event-content';
import { useEventHeader, useCurrentUser } from '@/hooks/convex';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { Id } from '@/convex/_generated/dataModel';

interface EditEventWrapperProps {
  eventId: string;
}

/**
 * Edit Event Wrapper - Client-only architecture
 * - Uses Convex hooks for real-time data
 * - Renders edit content when data is ready
 */
export function EditEventWrapper({ eventId }: EditEventWrapperProps) {
  const eventData = useEventHeader(eventId as Id<"events">);
  const currentUser = useCurrentUser();

  // Loading state
  if (!eventData || !currentUser) {
    return (
      <div className='container max-w-4xl mt-10'>
        <NewEventFormSkeleton />
      </div>
    );
  }

  return <EditEventContent eventId={eventId} />;
}