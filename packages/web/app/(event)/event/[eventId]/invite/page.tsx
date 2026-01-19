'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEventHeaderData, useEventAvailabilityData } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { InviteCardList } from '../components/invite-card-list';
import { InvitePageSkeleton } from '@/components/skeletons';
import Link from 'next/link';
import { isOrganizer } from '@/lib/event-permissions';

export default function EventInvitePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    props.params.then(p => setEventId(p.eventId));
  }, [props.params]);

  const eventData = useEventHeaderData(eventId as Id<'events'>);
  const availabilityData = useEventAvailabilityData(eventId as Id<'events'>);

  // Check if user should be redirected to availability page
  // Redirect if: poll active, not organizer, and hasn't set availability
  useEffect(() => {
    if (eventData && availabilityData) {
      const userRole = eventData.userMembership?.role;
      const hasPollActive = !eventData.event.chosenDateTime;
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

        // Redirect if poll is active and user hasn't responded
        if (potentialDateTimes.length > 0 && !hasSetAvailability) {
          router.replace(`/event/${eventId}/availability`);
        }
      }
    }
  }, [eventData, availabilityData, eventId, router]);

  if (!eventId) {
    return <InvitePageSkeleton />;
  }

  // Note: InviteCardList handles authorization checks internally
  // Only ORGANIZER and MODERATOR roles can manage invites

  return (
    <div className='container max-w-5xl py-4'>
      <Link href={`/event/${eventId}`}>
        <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
          <Icons.back />
          <span>Back to Event</span>
        </Button>
      </Link>
      <InviteCardList eventId={eventId} />
    </div>
  );
}
