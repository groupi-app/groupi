'use client';

import { use } from 'react';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import EditEventInfo from '../../edit/components/edit-event-info';
import { SettingsPageTemplate } from '@/components/templates';
import { NewEventFormSkeleton } from '@/components/skeletons';

export default function EventSettingsDetailsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);
  const eventData = useEventHeader(eventId as Id<'events'>);

  const event = eventData?.event;

  return (
    <SettingsPageTemplate
      title='Details'
      description='Edit event title, description, location, and visibility.'
      backHref={`/event/${eventId}/settings`}
      maxWidth='md'
    >
      {!event ? (
        <NewEventFormSkeleton />
      ) : (
        <EditEventInfo
          eventData={{
            eventId: event._id,
            title: event.title,
            description: event.description || '',
            location: event.location || '',
            visibility: event.visibility,
            imageUrl: event.imageUrl,
            imageStorageId: event.imageStorageId,
            imageFocalPoint: event.imageFocalPoint,
          }}
        />
      )}
    </SettingsPageTemplate>
  );
}
