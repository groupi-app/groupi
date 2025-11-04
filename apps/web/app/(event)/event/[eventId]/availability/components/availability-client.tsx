'use client';

import { AvailabilityForm } from '../../components/availability-form';
import type { AvailabilityPageData } from '@groupi/schema/data';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { useState } from 'react';

type PotentialDateTime = AvailabilityPageData['potentialDateTimes'][0];

interface AvailabilityClientProps {
  eventId: string;
  userId: string;
  potentialDateTimes: PotentialDateTime[];
}

/**
 * Client component with hybrid caching + realtime
 * - Receives cached initial data from server for fast load
 * - Syncs with realtime availability changes for live updates
 */
export function AvailabilityClient({
  eventId,
  userId,
  potentialDateTimes: initialDates,
}: AvailabilityClientProps) {
  const [potentialDateTimes, setPotentialDateTimes] = useState(initialDates);

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? '-' : '+'
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  // Sync with realtime availability changes
  useRealtimeSync({
    channel: `event-${eventId}-availability`,
    table: 'Availability',
    filter: `eventId=eq.${eventId}`,
    refreshOnChange: true, // Refresh to get updated availability counts
  });

  // Sync with potential date time changes (organizer adding/removing options)
  useRealtimeSync({
    channel: `event-${eventId}-dates`,
    table: 'PotentialDateTime',
    filter: `eventId=eq.${eventId}`,
    onInsert: () => {
      // Refresh to get new date option
    },
    onDelete: payload => {
      // Optimistically remove date option
      setPotentialDateTimes(prev =>
        prev.filter(pdt => pdt.id !== payload.old.id)
      );
    },
    refreshOnChange: true,
  });

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
          Current timezone: {getTimezoneString()}
        </span>
        <AvailabilityForm
          potentialDateTimes={potentialDateTimes}
          userId={userId}
        />
      </div>
    </div>
  );
}
