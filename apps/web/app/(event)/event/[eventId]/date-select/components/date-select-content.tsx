import { getCachedEventAvailabilityData } from '@groupi/services';
import { DateCardList } from '../../components/date-card-list';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export async function DateSelectContent({ eventId }: { eventId: string }) {
  const [error, availabilityData] =
    await getCachedEventAvailabilityData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
        // eslint-disable-next-line no-fallthrough
      case 'UnauthorizedError':
        return <div>You do not have permission to view this page</div>;
      default:
        return <div>Failed to load date options</div>;
    }
  }

  const { potentialDateTimes } = availabilityData;

  return (
    <div className='container max-w-5xl py-4 flex flex-col'>
      <div className='w-max my-2'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>
              {potentialDateTimes?.[0]?.dateTime
                ? 'Event Date Options'
                : 'Event'}
            </span>
          </Button>
        </Link>
      </div>
      <div>
        <h1 className='font-heading text-4xl my-4'>
          Choose a date/time for your event.
        </h1>
        <DateCardList
          potentialDateTimes={potentialDateTimes}
          userId={availabilityData.userId}
          userRole={
            availabilityData.userRole as 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'
          }
        />
      </div>
    </div>
  );
}
