'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Attendees } from './attendees';
import { AttendeeListSkeleton } from '@/components/skeletons/attendee-list-skeleton';
import React, { Suspense, use, useEffect } from 'react';
import {
  useEventHeader,
  useEventMembers,
  useCurrentUser,
  useEventAvailabilityData,
} from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { isOrganizer } from '@/lib/event-permissions';

/**
 * Attendees content component - Client-only architecture
 * - Handles availability redirect logic client-side
 * - Uses Convex hooks to check if user needs to set availability
 * - Real-time updates via Convex subscriptions
 */
export function AttendeesContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const eventData = useEventHeader(eventId as Id<'events'>);
  const memberData = useEventMembers(eventId as Id<'events'>);
  const currentUser = useCurrentUser();
  const availabilityData = useEventAvailabilityData(eventId as Id<'events'>);

  // Check if user should be redirected to availability page
  // Redirect if: poll active, not organizer, and hasn't set availability
  useEffect(() => {
    if (eventData && memberData && currentUser && availabilityData) {
      const event = eventData.event;
      const userRole = eventData.userMembership?.role;
      const hasPollActive = !event?.chosenDateTime;
      const isUserOrganizer = userRole && isOrganizer(userRole);

      if (hasPollActive && !isUserOrganizer) {
        const potentialDateTimes = availabilityData.potentialDateTimes || [];
        const userId = availabilityData.userId;

        // Check if user has set availability for at least one date option
        const hasSetAvailability = potentialDateTimes.some(
          (dateTime: {
            availabilities?: Array<{ member?: { person?: { _id: string } } }>;
          }) =>
            dateTime.availabilities?.some(
              (avail: { member?: { person?: { _id: string } } }) =>
                avail.member?.person?._id === userId
            )
        );

        // Redirect to availability page if poll is active and user hasn't responded
        if (potentialDateTimes.length > 0 && !hasSetAvailability) {
          router.replace(`/event/${eventId}/availability`);
        }
      }
    }
  }, [eventData, memberData, currentUser, eventId, router, availabilityData]);

  // Loading state
  if (!eventData || !memberData || !currentUser) {
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
          <AttendeeListSkeleton />
        </div>
      </div>
    );
  }

  // Handle case where event not found (userMembership would be null)
  if (!eventData.userMembership) {
    return (
      <div className='container max-w-4xl py-4'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-red-600'>Event not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className='container max-w-4xl py-4'>
      {/* Static shell - renders immediately */}
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
        <Suspense fallback={<AttendeeListSkeleton />}>
          <Attendees eventId={eventId} />
        </Suspense>
      </div>
    </div>
  );
}
