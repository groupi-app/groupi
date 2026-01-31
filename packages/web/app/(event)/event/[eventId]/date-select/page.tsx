'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { DateSelectContent } from './components/date-select-content';
import { DateSelectSkeleton } from '@/components/skeletons';
import { useEventData } from '../context';

/**
 * Date Select Page - Client-only architecture
 * - Uses use() to unwrap params promise
 * - Uses EventDataProvider context for data (pre-fetched at layout level)
 */
export default function EventDateSelectPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const router = useRouter();

  // Use context data (pre-fetched at layout level)
  const { headerData: eventData } = useEventData();

  useEffect(() => {
    if (!eventData) return;

    // If event already has a chosen date, redirect to event page
    if (eventData.event?.chosenDateTime) {
      router.push(`/event/${eventId}`);
      return;
    }

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

  if (!eventData) {
    return <DateSelectSkeleton />;
  }

  return <DateSelectContent eventId={eventId as Id<'events'>} />;
}
