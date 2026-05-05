'use client';

import { use } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { EditEventMultiDate } from '../../../edit/components/edit-event-multi-date';
import { SettingsPageTemplate } from '@/components/templates';

export default function EventSettingsDateMultiPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);

  return (
    <SettingsPageTemplate
      title='Poll Attendees'
      backHref={`/event/${eventId}/settings/date`}
      maxWidth='md'
    >
      <EditEventMultiDate
        eventId={eventId as Id<'events'>}
        backHref={`/event/${eventId}/settings/date`}
      />
    </SettingsPageTemplate>
  );
}
