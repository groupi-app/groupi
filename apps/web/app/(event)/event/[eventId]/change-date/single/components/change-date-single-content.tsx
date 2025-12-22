import { getCachedEventHeaderData } from '@groupi/services/server';
import { EditEventSingleDate } from '../../../edit/components/edit-event-single-date';
import { redirect } from 'next/navigation';

export async function ChangeDateSingleContent({
  eventId,
}: {
  eventId: string;
}) {
  const [error, eventData] = await getCachedEventHeaderData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');

      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Failed to load event data</div>;
    }
  }

  const { event } = eventData;
  const datetime = event.chosenDateTime ?? undefined;

  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time</h1>
      <EditEventSingleDate eventId={eventId} datetime={datetime} />
    </div>
  );
}
