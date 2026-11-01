'use client';
import { use } from 'react';
import { SettingsPageTemplate } from '@/components/templates';
import { EventDateFields } from '@/features/event-settings/dates';
export default function DateSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  return (
    <SettingsPageTemplate
      title='Poll attendees'
      backHref={`/event/${eventId}/settings/date`}
      backLabel='Date settings'
      maxWidth='md'
    >
      <EventDateFields mode='POLL' />
    </SettingsPageTemplate>
  );
}
