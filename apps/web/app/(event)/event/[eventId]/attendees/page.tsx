import React from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCachedEventAttendeesData } from '@groupi/services';
import { redirect } from 'next/navigation';
import { MemberListClient } from '../components/member-list-client';

export default async function EventAttendeesPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  const [error, attendeesData] = await getCachedEventAttendeesData(eventId);

  if (error) {
    switch (error._tag) {
      case 'NotFoundError':
        return <div>Event not found</div>;
      case 'AuthenticationError':
        redirect('/sign-in');
      case 'UnauthorizedError':
        return <div>You are not a member of this event</div>;
      default:
        return <div>An error occurred while loading attendees.</div>;
    }
  }

  const { event, userMembership, userId } = attendeesData;

  return (
    <div className='container max-w-4xl py-4'>
      <div className='w-max'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>Back to Event</span>
          </Button>
        </Link>
      </div>
      <div className='py-4'>
        <h1 className='text-2xl font-bold mb-4'>Attendees</h1>
        <MemberListClient
          eventId={eventId}
          members={event.memberships}
          userId={userId}
          userRole={userMembership.role}
          eventDateTime={event.chosenDateTime}
        />
      </div>
    </div>
  );
}
