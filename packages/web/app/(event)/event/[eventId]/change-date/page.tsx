'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { ChangeDateContent } from './components/change-date-content';
import { ChangeDateTypeSkeleton } from '@/components/skeletons';

export default function EventChangeDatePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();
  const eventData = useEventHeader(eventId as Id<'events'>);

  useEffect(() => {
    if (!eventId || !eventData) return;

    // Check if user should be redirected to availability page
    // Only organizers can choose dates - moderators and attendees must vote
    const userRole = eventData.userMembership?.role;
    const isUserOrganizer = userRole === 'ORGANIZER';

    // Redirect non-organizers to availability page - they can't choose dates directly
    if (!eventData.event.chosenDateTime && !isUserOrganizer) {
      router.replace(`/event/${eventId}/availability`);
      return;
    }
  }, [eventId, eventData, router]);

  if (!eventId || !eventData) {
    return <ChangeDateTypeSkeleton />;
  }

  return <ChangeDateContent eventId={eventId} />;
}
