import React from 'react';
import { AttendeeCount } from '../components/attendee-count';
import { AttendeeList } from '../components/attendee-list';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { prefetchEventAttendeesPageData } from '@groupi/hooks/server';
import { HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';
import { pageLogger } from '@/lib/logger';

export default async function EventAttendeesPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const params = await props.params;
  const { eventId } = params;

  try {
    // Prefetch event attendees page data
    const dehydratedState = await prefetchEventAttendeesPageData(eventId);

    return (
      <HydrationBoundary state={dehydratedState}>
        <div className='container max-w-4xl py-4'>
          <div className='w-max'>
            <Link data-test='full-post-back' href={`/event/${eventId}`}>
              <Button
                variant={'ghost'}
                className='flex items-center gap-1 pl-2'
              >
                <Icons.back />
                <span>Back to Event</span>
              </Button>
            </Link>
          </div>
          <div className='py-4'>
            <AttendeeCount eventId={eventId} />
            <AttendeeList eventId={eventId} />
          </div>
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    pageLogger.error({ error }, 'Error in event attendees page');
    return (
      <div className='container pt-6'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='mt-2'>An error occurred while loading attendees.</p>
        </div>
      </div>
    );
  }
}
