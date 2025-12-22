import { getCachedEventHeaderData } from '@groupi/services/server';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export async function ChangeDateContent({ eventId }: { eventId: string }) {
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
    <div className='container max-w-4xl'>
      <div className='w-max my-2'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>{event.title}</span>
          </Button>
        </Link>
      </div>
      <h2 className='font-heading text-4xl mt-10'>I would like to...</h2>
      <div className='flex my-12 gap-4 justify-center flex-col md:flex-row items-center'>
        <Link
          data-test='single-date-button'
          className='w-full max-w-md'
          href={`/event/${eventId}/change-date/single`}
        >
          <Button
            size='lg'
            variant='outline'
            className='py-12 text-xl w-full flex items-center justify-center gap-3'
          >
            <Icons.organizer className='size-16 min-w-[4rem]' />
            <span>Choose a date myself</span>
          </Button>
        </Link>
        <Link
          className='w-full max-w-md'
          href={`/event/${eventId}/change-date/multi`}
        >
          <Button
            size='lg'
            variant='outline'
            className='py-12 text-xl w-full flex items-center justify-center gap-3'
          >
            <Icons.group
              color2='fill-muted-foreground'
              className='size-24 min-w-[4rem]'
            />
            <span>Poll Attendees</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
