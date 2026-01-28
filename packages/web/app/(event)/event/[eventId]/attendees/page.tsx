import { AttendeesPageContent } from './components/attendees-page-content';
import { AttendeeListSkeleton } from '@/components/skeletons/attendee-list-skeleton';
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

/**
 * Attendees Page - Static root for instant skeleton rendering
 * - Page root is static (no async operations) for optimal PPR
 * - All checks and redirects happen inside Suspense boundary
 * - Skeletons show immediately while checks complete
 * - Dynamic content: Cached attendees data + realtime sync
 */
export default function EventAttendeesPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className='container max-w-4xl py-4'>
          {/* Static shell - renders immediately */}
          <div className='w-max'>
            <Button
              variant={'ghost'}
              className='flex items-center gap-1 pl-2'
              disabled
            >
              <Icons.back />
              <span>Back to Event</span>
            </Button>
          </div>
          <div className='py-4'>
            <Skeleton className='h-8 w-32 mb-4' />
            <AttendeeListSkeleton />
          </div>
        </div>
      }
    >
      <AttendeesPageContent params={props.params} />
    </Suspense>
  );
}
