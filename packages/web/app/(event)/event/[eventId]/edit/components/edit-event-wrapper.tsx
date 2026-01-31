'use client';

import { EditEventContent } from './edit-event-content';
import { NewEventFormSkeleton } from '@/components/skeletons';
import { useEventData } from '../../context';

interface EditEventWrapperProps {
  eventId: string;
}

/**
 * Edit Event Wrapper - Client-only architecture
 * - Uses EventDataProvider context for data (pre-fetched at layout level)
 * - Renders edit content when data is ready
 */
export function EditEventWrapper({ eventId }: EditEventWrapperProps) {
  // Use context data (pre-fetched at layout level)
  const {
    headerData: eventData,
    currentUser,
    isHeaderLoading,
    isCurrentUserLoading,
  } = useEventData();

  // Loading state
  if (isHeaderLoading || isCurrentUserLoading || !eventData || !currentUser) {
    return (
      <div className='container max-w-4xl mt-10'>
        <NewEventFormSkeleton />
      </div>
    );
  }

  return <EditEventContent eventId={eventId} />;
}
