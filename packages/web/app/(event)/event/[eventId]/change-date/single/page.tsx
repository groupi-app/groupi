'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { ChangeDateSingleContent } from './components/change-date-single-content';
import { ChangeDateSingleSkeleton } from '@/components/skeletons';

export default function EventChangeDateSinglePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();

  const eventData = useEventHeader(eventId as Id<"events">);

  // Check if user should be redirected to availability page
  useEffect(() => {
    if (eventData) {
      const userRole = eventData.userMembership?.role;
      const hasChosenDate = !!eventData.event.chosenDateTime;

      // Only redirect if there's no chosen date and user is a member
      if (!hasChosenDate && userRole && ['ORGANIZER', 'MODERATOR', 'ATTENDEE'].includes(userRole)) {
        router.push(`/event/${eventId}/availability`);
      }
    }
  }, [eventData, eventId, router]);

  if (!eventId) {
    return <ChangeDateSingleSkeleton />;
  }

  return <ChangeDateSingleContent eventId={eventId} />;
}
