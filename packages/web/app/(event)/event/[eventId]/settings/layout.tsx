'use client';

import { use, type ReactNode } from 'react';
import { EventOrganizerOnly } from '@/components/auth/auth-wrappers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventSettingsNav } from './components/event-settings-nav';

interface EventSettingsLayoutProps {
  children: ReactNode;
  params: Promise<{ eventId: string }>;
}

export default function EventSettingsLayout({
  children,
  params,
}: EventSettingsLayoutProps) {
  const { eventId } = use(params);

  return (
    <EventOrganizerOnly
      eventId={eventId}
      fallback={
        <div className='container mx-auto py-8 text-center'>
          <div className='max-w-md mx-auto'>
            <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
            <p className='text-muted-foreground mb-6'>
              Only event organizers and moderators can access event settings.
            </p>
            <Link href={`/event/${eventId}`}>
              <Button>Return to Event</Button>
            </Link>
          </div>
        </div>
      }
    >
      <div className='container min-h-screen relative md:grid md:grid-cols-[175px_1fr]'>
        <div className='hidden md:block'>
          <EventSettingsNav eventId={eventId} />
        </div>
        {children}
      </div>
    </EventOrganizerOnly>
  );
}
