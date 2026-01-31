'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Attendees } from './attendees';
import { AttendeeListSkeleton } from '@/components/skeletons';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isOrganizer } from '@/lib/event-permissions';
import { useEventData } from '../../context';

/**
 * Attendees content component - receives data from context
 * - Data is pre-loaded by EventDataProvider in layout
 * - Handles availability redirect logic client-side
 * - No loading state needed for core data - only for redirect check
 */
export function AttendeesContent() {
  const router = useRouter();
  const {
    eventId,
    headerData,
    membersData,
    currentUser,
    availabilityData,
    isLoading,
  } = useEventData();

  // Check if user should be redirected to availability page
  // Redirect if: poll active, not organizer, and hasn't set availability
  useEffect(() => {
    if (headerData && membersData && currentUser && availabilityData) {
      const event = headerData.event;
      const userRole = headerData.userMembership?.role;
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
  }, [headerData, membersData, currentUser, eventId, router, availabilityData]);

  // Loading state - only while core data is loading
  if (isLoading || !headerData || !membersData || !currentUser) {
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
  if (!headerData.userMembership) {
    return (
      <div className='container max-w-4xl py-4'>
        <div className='text-center py-8'>
          <h1 className='text-2xl font-bold text-error'>Event not found</h1>
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
        <Attendees data={membersData} />
      </div>
    </div>
  );
}
