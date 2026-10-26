'use client';
import { EventDeleteCard } from '../components/event-delete-card';
import { use } from 'react';
import { useEventHeader } from '@/hooks/convex';
import { Id } from '@/convex/_generated/dataModel';
import { EventDetailsFields } from '@/features/event-settings/details';
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
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      maxWidth='md'
    >
      {!event ? (
        <NewEventFormSkeleton />
      ) : (
        <div className='space-y-6'>
          <EventDetailsFields />
          {eventData?.userMembership?.role === 'ORGANIZER' && (
            <EventAudienceSettings
              eventId={event._id}
              visibility={event.visibility}
            />
          )}
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
