'use client';

import { AvailabilityForm } from '../../components/availability-form';
import { Id } from '@/convex/_generated/dataModel';
import { useEventAvailability } from '@/hooks/convex';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface AvailabilityProps {
  eventId: string;
}

/**
 * Client component with direct Convex hooks - Client-only pattern
 * - Uses useEventAvailability hook for real-time availability data
 * - Real-time updates via Convex subscriptions
 * - Loading states managed by component
 */
export function Availability({ eventId }: AvailabilityProps) {
  // Use direct Convex hook for real-time availability data
  const availabilityData = useEventAvailability(eventId as Id<'events'>);

  // Loading state - show actual structure with skeleton placeholders
  if (availabilityData === undefined) {
    return (
      <div>
        <div className='my-2'>
          <h2 className='font-heading text-4xl'>When are you around?</h2>
          <p className='text-muted-foreground text-lg'>
            Don&apos;t worry. You can update this later.
          </p>
        </div>
        <div className='py-4 w-full'>
          <span className='text-sm italic text-muted-foreground'>
            Current timezone:{' '}
            <Skeleton className='h-4 w-48 inline-block align-baseline' />
          </span>
          {/* Availability form skeleton */}
          <div className='space-y-3 mt-4'>
            <AvailabilityCardSkeleton />
            <AvailabilityCardSkeleton />
            <AvailabilityCardSkeleton />
            <AvailabilityCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const { potentialDateTimes, userRole, userId } = availabilityData;

  // Business logic validation (migrated from server component)
  if (!potentialDateTimes || potentialDateTimes.length === 0) {
    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold'>No Date Options</h2>
        <p className='mt-2'>Voting is not enabled for this event</p>
      </div>
    );
  }

  if (userRole === 'ORGANIZER') {
    return (
      <div className='text-center py-8'>
        <h2 className='text-xl font-bold'>Access Restricted</h2>
        <p className='mt-2'>Organizers cannot vote on availabilities</p>
      </div>
    );
  }

  // Check if user has any availabilities set - using simpler approach for better type inference
  let hasAvailability = false;
  for (const pdt of potentialDateTimes) {
    for (const avail of pdt.availabilities) {
      if (avail.member?.person?._id === userId) {
        hasAvailability = true;
        break;
      }
    }
    if (hasAvailability) break;
  }

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  return (
    <div>
      {/* Back button if user has already set availability */}
      {hasAvailability && (
        <div className='mb-6'>
          <Link href={`/event/${eventId}`}>
            <Button variant='ghost' className='flex items-center gap-1 pl-2'>
              <Icons.back />
              <span>Back to Event</span>
            </Button>
          </Link>
        </div>
      )}

      <div className='my-2'>
        <h2 className='font-heading text-4xl'>When are you around?</h2>
        <p className='text-muted-foreground text-lg'>
          Don&apos;t worry. You can update this later.
        </p>
      </div>
      <div className='py-4 w-full'>
        <span className='text-sm italic text-muted-foreground'>
          Current timezone: {getTimezoneString()}
        </span>
        <AvailabilityForm
          potentialDateTimes={potentialDateTimes}
          userId={availabilityData.userId}
        />
      </div>
    </div>
  );
}

/**
 * AvailabilityCardSkeleton - Skeleton for a single availability card
 * Matches AvailabilityCard: date, time, yes/maybe/no buttons
 */
function AvailabilityCardSkeleton() {
  return (
    <div className='w-full sm:max-w-md border border-border shadow-floating rounded-md py-4 px-4 bg-card'>
      <div className='flex flex-col sm:flex-row justify-between gap-4 flex-wrap'>
        {/* Date and time */}
        <div className='flex flex-col justify-between'>
          <div>
            <Skeleton className='h-6 w-48 mb-1' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>
        {/* Yes/Maybe/No buttons */}
        <div className='flex items-center gap-2 py-3'>
          <Skeleton className='size-10 rounded-button' />
          <Skeleton className='size-10 rounded-button' />
          <Skeleton className='size-10 rounded-button' />
        </div>
      </div>
    </div>
  );
}
