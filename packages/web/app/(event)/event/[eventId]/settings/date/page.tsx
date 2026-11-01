'use client';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { SettingsPageTemplate } from '@/components/templates';
import Link from 'next/link';
export default function EventSettingsDatePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  return (
    <SettingsPageTemplate
      title='Date & time'
      backHref={`/event/${eventId}/settings`}
      backLabel='Event settings'
      maxWidth='md'
    >
      <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
        <Button asChild variant='outline'>
          <Link
            data-test='single-date-button'
            href={`/event/${eventId}/settings/date/single`}
          >
            Choose a date
          </Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href={`/event/${eventId}/settings/date/multi`}>
            Poll attendees
          </Link>
        </Button>
      </div>
    </SettingsPageTemplate>
  );
}
