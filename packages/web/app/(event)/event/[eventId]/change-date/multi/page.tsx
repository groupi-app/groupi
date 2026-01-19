'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { ChangeDateMultiContent } from './components/change-date-multi-content';
import { ChangeDateMultiSkeleton } from '@/components/skeletons';

export default function EventChangeDateMultiPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();

  const eventData = useEventHeader(eventId as Id<'events'>);

  // Check if user should be redirected to availability page
  // Only organizers can choose dates - moderators and attendees must vote
  useEffect(() => {
    if (eventData) {
      const userRole = eventData.userMembership?.role;
      const hasChosenDate = !!eventData.event.chosenDateTime;
      const isUserOrganizer = userRole === 'ORGANIZER';

      // Redirect non-organizers to availability page
      if (!hasChosenDate && !isUserOrganizer) {
        router.replace(`/event/${eventId}/availability`);
      }
    }
  }, [eventData, eventId, router]);

  if (!eventId) {
    return <ChangeDateMultiSkeleton />;
  }

  return <ChangeDateMultiContent eventId={eventId} />;
}
