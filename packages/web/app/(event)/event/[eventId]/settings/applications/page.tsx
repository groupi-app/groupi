'use client';
import { useParams } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { SettingsPageTemplate } from '@/components/templates/settings-page-template';
import { EventApplications } from '@/components/organisms/event-applications';
export default function ReviewApplicationsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  return (
    <SettingsPageTemplate
      title='Applications'
      description='Review requests to join this Event.'
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      className='w-full min-w-0 px-4 sm:px-6 md:max-w-2xl'
    >
      <EventApplications eventId={eventId as Id<'events'>} review />
    </SettingsPageTemplate>
  );
}
