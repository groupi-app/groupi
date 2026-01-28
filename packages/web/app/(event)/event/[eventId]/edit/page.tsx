'use client';

import { EditEventWrapper } from './components/edit-event-wrapper';
import { EventOrganizerOnly } from '@/components/auth/auth-wrappers';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Event Edit Page - Uses Convex authentication components
 * - EventOrganizerOnly wrapper handles auth and organizer/moderator check
 * - Real-time event editing with Convex mutations
 */
export default function EventEditPage(props: {
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
              Only event organizers and moderators can edit this event.
            </p>
            <Link href={`/event/${eventId}`}>
              <Button>Return to Event</Button>
            </Link>
          </div>
        </div>
      }
    >
      <EditEventWrapper eventId={eventId} />
    </EventOrganizerOnly>
  );
}
