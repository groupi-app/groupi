'use client';

import { ManageAddonsContent } from './components/manage-addons-content';
import { EventOrganizerOnly } from '@/components/auth/auth-wrappers';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ManageAddonsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);

  return (
    <EventOrganizerOnly
      eventId={eventId}
      fallback={
        <div className='container mx-auto py-8 text-center'>
          <div className='max-w-md mx-auto'>
            <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
            <p className='text-muted-foreground mb-6'>
              Only event organizers and moderators can manage add-ons.
            </p>
            <Link href={`/event/${eventId}`}>
              <Button>Return to Event</Button>
            </Link>
          </div>
        </div>
      }
    >
      <ManageAddonsContent eventId={eventId} />
    </EventOrganizerOnly>
  );
}
