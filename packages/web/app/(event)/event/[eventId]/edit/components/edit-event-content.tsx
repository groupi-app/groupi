'use client';

import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import EditEventInfo from './edit-event-info';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { NewEventFormSkeleton } from '@/components/skeletons';
import Link from 'next/link';

export function EditEventContent({ eventId }: { eventId: string }) {
  const eventData = useEventHeader(eventId as Id<'events'>);

  if (!eventData) {
    return (
      <div className='container max-w-4xl mt-10'>
        <NewEventFormSkeleton />
      </div>
    );
  }

  const { event } = eventData;

  return (
    <div className='container max-w-4xl mt-10'>
      <div className='w-max'>
        <Link href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>{event.title}</span>
          </Button>
        </Link>
      </div>
      <h1 className='text-4xl font-heading my-4'>Edit Event Details</h1>
      <EditEventInfo
        eventData={{
          eventId: event._id,
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          reminderOffset: event.reminderOffset,
          imageUrl: event.imageUrl,
          imageStorageId: event.imageStorageId,
        }}
      />
    </div>
  );
}
