'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEventHeaderData } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { DateSelectContent } from './components/date-select-content';
import { DateSelectSkeleton } from '@/components/skeletons';

export default function EventDateSelectPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  // Note: In client components, we need to use React state for async params
  const [eventId, setEventId] = useState<string>('');
  const router = useRouter();
  // Skip query when eventId is not yet set
  const eventData = useEventHeaderData(eventId as Id<"events">);

  useEffect(() => {
    // Resolve params on client side
    props.params.then((resolved) => {
      setEventId(resolved.eventId);
    });
  }, [props.params]);

  useEffect(() => {
    if (!eventId || !eventData) return;

    // If event already has a chosen date, redirect to event page
    if (eventData.event?.chosenDateTime) {
      router.push(`/event/${eventId}`);
      return;
    }

    // Check if user should be redirected to availability page
    // Attendees should vote on availability, not choose dates directly
    const userRole = eventData.userMembership?.role;
    const canChooseDate = userRole && ['ORGANIZER', 'MODERATOR'].includes(userRole);

    // Redirect attendees to availability page - they can't choose dates directly
    if (!eventData.event.chosenDateTime && !canChooseDate) {
      router.push(`/event/${eventId}/availability`);
      return;
    }
  }, [eventId, eventData, router]);

  if (!eventId || !eventData) {
    return <DateSelectSkeleton />;
  }

  return <DateSelectContent eventId={eventId as Id<"events">} />;
}
