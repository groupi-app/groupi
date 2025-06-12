import EditEventInfo from '@/components/edit-event-info';
import ErrorPage from '@/components/error';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { env } from '@/env.mjs';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import Script from 'next/script';

export default async function Page(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;
  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      memberships: true,
    },
  });

  if (!event) {
    return <ErrorPage message={'Event not found'} />;
  }

  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return <ErrorPage message={'User not found'} />;
  }

  const userMembership = event.memberships.find(
    membership => membership.personId === userId
  );

  if (!userMembership) {
    return <ErrorPage message={'You are not a member of this event.'} />;
  }

  if (userMembership.role !== 'ORGANIZER') {
    return (
      <ErrorPage message={'You do not have permission to edit this event.'} />
    );
  }

  return (
    <>
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
      <Script
        defer
        src={`https://maps.googleapis.com/maps/api/js?key=${env.GOOGLE_API_KEY}&libraries=places&callback=initMap`}
      />
    </>
  );
}
