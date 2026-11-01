'use client';

import { use, type ReactNode } from 'react';
import {
  EventMemberOnly,
  EventOrganizerOnly,
} from '@/components/auth/auth-wrappers';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEventData } from '../context';
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
  const pathname = usePathname();
  const { headerData } = useEventData();
  const role = headerData?.userMembership?.role;
  const canManage = role === 'ORGANIZER' || role === 'MODERATOR';
  const Access =
    pathname === `/event/${eventId}/settings/ownership`
      ? EventMemberOnly
      : EventOrganizerOnly;

  return (
    <Access
      eventId={eventId}
      fallback={
        <div className='container mx-auto py-8 text-center'>
          <div className='max-w-md mx-auto'>
            <h1 className='font-heading text-2xl font-bold mb-4'>
              Access Denied
            </h1>
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
          {canManage && <EventSettingsNav eventId={eventId} />}
        </div>
        {children}
      </div>
    </Access>
  );
}
