'use client';

import { useEventChangeDateSingle } from '@groupi/hooks';
import { EditEventSingleDate } from '../../../edit/components/edit-event-single-date';

export function ChangeDateSingleContent({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventChangeDateSingle(eventId);

  if (isLoading || !data) {
    return (
      <div className='container max-w-4xl'>
        <div className='text-center py-8'>
          <div className='text-lg'>Loading...</div>
        </div>
      </div>
    );
  }

  const [error, changeDateData] = data;

  if (error) {
    let errorMessage = 'An error occurred';
    switch (error._tag) {
      case 'NotFoundError':
        errorMessage = 'Event not found';
        break;
      case 'UnauthorizedError':
        errorMessage = 'You are not a member of this event';
        break;
      case 'AuthenticationError':
        errorMessage = 'Please sign in';
        break;
      case 'DatabaseError':
        errorMessage = 'Failed to load event data';
        break;
    }

    return (
      <div className='container max-w-4xl'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>{errorMessage}</p>
        </div>
      </div>
    );
  }

  const { event } = changeDateData;
  const datetime = event.chosenDateTime ?? undefined;

  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time</h1>
      <EditEventSingleDate eventId={eventId} datetime={datetime} />
    </div>
  );
}
