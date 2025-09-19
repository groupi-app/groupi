'use client';

import { useEventEdit } from '@groupi/hooks';
import EditEventInfo from './edit-event-info';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EditEventContent({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventEdit(eventId);

  if (isLoading || !data) {
    return (
      <div className='container max-w-4xl mt-10'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  const [error, pageData] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'EventNotFoundError':
        errorMessage = 'Event not found';
        break;
      case 'EventUserNotMemberError':
        errorMessage = 'You are not a member of this event';
        break;
      case 'UnauthorizedError':
        errorMessage = 'You do not have permission to edit this event';
        break;
      case 'DatabaseError':
        errorMessage = 'Failed to load event data';
        break;
    }

    return (
      <div className='container max-w-4xl mt-10'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const { event } = pageData;

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
          eventId: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
        }}
      />
    </div>
  );
}
