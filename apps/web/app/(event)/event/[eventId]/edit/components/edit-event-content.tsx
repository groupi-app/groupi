import { getCachedEventHeaderData } from '@groupi/services';
import EditEventInfo from './edit-event-info';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export async function EditEventContent({ eventId }: { eventId: string }) {
  const [error, eventData] = await getCachedEventHeaderData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
        // eslint-disable-next-line no-fallthrough
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>Failed to load event data</div>;
    }
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
          eventId: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
        }}
      />
    </div>
  );
}
