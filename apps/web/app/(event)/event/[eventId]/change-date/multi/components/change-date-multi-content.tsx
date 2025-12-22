import { getCachedEventHeaderData } from '@groupi/services/server';
import { EditEventMultiDate } from '../../../edit/components/edit-event-multi-date';
import { redirect } from 'next/navigation';

export async function ChangeDateMultiContent({ eventId }: { eventId: string }) {
  const [error] = await getCachedEventHeaderData(eventId);

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

  const dates = undefined;

  return (
    <div className='container max-w-4xl'>
      <h1 className='text-4xl font-heading mt-10'>Event Date/Time Options</h1>
      <EditEventMultiDate eventId={eventId} dates={dates} />
    </div>
  );
}
