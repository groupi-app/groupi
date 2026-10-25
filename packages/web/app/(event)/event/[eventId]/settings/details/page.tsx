'use client';
import { EventDeleteCard } from '../components/event-delete-card';
import { EventLifecycleSettings } from '@/components/organisms/event-lifecycle-settings';

import { use } from 'react';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import EditEventInfo from '../../edit/components/edit-event-info';
import { SettingsPageTemplate } from '@/components/templates';
import { EventAudienceSettings } from '@/components/organisms/event-audience-settings';
import { EventAdmissionSettings } from '@/components/organisms/event-admission-settings';
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
      description='Edit event title, description, location, visibility, and admission.'
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      maxWidth='md'
    >
      {!event ? (
        <NewEventFormSkeleton />
      ) : (
        <div className='space-y-6'>
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
          {eventData?.userMembership?.role === 'ORGANIZER' && (
            <EventAudienceSettings
              eventId={event._id}
              visibility={event.visibility}
            />
          )}
          <EventLifecycleSettings
            eventId={event._id}
            role={eventData?.userMembership?.role}
          />
          <EventAdmissionSettings
            eventId={event._id}
            role={eventData?.userMembership?.role}
          />
          <EventDeleteCard />
        </div>
      )}
    </SettingsPageTemplate>
  );
}
