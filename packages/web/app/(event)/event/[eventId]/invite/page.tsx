'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { InviteCardList } from '../components/invite-card-list';
import { isOrganizer } from '@/lib/event-permissions';
import { FormPageTemplate } from '@/components/templates';
import { useEventData } from '../context';

/**
 * Invite Page - Client-only architecture
 * - Uses use() to unwrap params promise
 * - Uses EventDataProvider context for data (pre-fetched at layout level)
 */
export default function EventInvitePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();

  // Use context data (pre-fetched at layout level)
  const { headerData: eventData, availabilityData } = useEventData();

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

  // Note: InviteCardList handles authorization checks and loading states internally
  // Only ORGANIZER and MODERATOR roles can manage invites

  return (
    <FormPageTemplate
      backHref={`/event/${eventId}`}
      backLabel='Back to Event'
      maxWidth='lg'
    >
      <InviteCardList eventId={eventId as Id<'events'>} />
    </FormPageTemplate>
  );
}
