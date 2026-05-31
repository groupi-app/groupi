'use client';

import { use } from 'react';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { EditEventSingleDate } from '../../../edit/components/edit-event-single-date';
import { SettingsPageTemplate } from '@/components/templates';
import { ChangeDateSingleSkeleton } from '@/components/skeletons';

export default function EventSettingsDateSinglePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const eventData = useEventHeader(eventId as Id<'events'>);

  const event = eventData?.event;
  const datetime = event?.chosenDateTime
    ? new Date(event.chosenDateTime)
    : undefined;
  const endDatetime = event?.chosenEndDateTime
    ? new Date(event.chosenEndDateTime)
    : undefined;

  return (
    <SettingsPageTemplate
      title='Choose a Date'
      backHref={`/event/${eventId}/settings/date`}
      maxWidth='md'
    >
      {!event ? (
        <ChangeDateSingleSkeleton />
      ) : (
        <EditEventSingleDate
          eventId={eventId}
          datetime={datetime}
          endDatetime={endDatetime}
          backHref={`/event/${eventId}/settings/date`}
        />
      )}
    </SettingsPageTemplate>
  );
}
