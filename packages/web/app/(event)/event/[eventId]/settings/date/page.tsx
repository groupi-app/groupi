'use client';

import { use } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { SettingsPageTemplate } from '@/components/templates';
import Link from 'next/link';

export default function EventSettingsDatePage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(props.params);

  return (
    <SettingsPageTemplate
      title='Date & Time'
      description='Choose a date or poll attendees.'
      backHref={`/event/${eventId}/settings`}
      maxWidth='md'
    >
      <h2 className='font-heading text-3xl mt-4 mb-8'>I would like to...</h2>
      <div className='flex gap-4 justify-center flex-col md:flex-row items-center'>
        <Link
          data-test='single-date-button'
          className='w-full max-w-md'
          href={`/event/${eventId}/settings/date/single`}
        >
          <Button
            size='lg'
            variant='outline'
            className='py-12 text-xl w-full flex items-center justify-center gap-3'
          >
            <Icons.organizer className='size-16 min-w-[4rem]' />
            <span>Choose a date myself</span>
          </Button>
        </Link>
        <Link
          className='w-full max-w-md'
          href={`/event/${eventId}/settings/date/multi`}
        >
          <Button
            size='lg'
            variant='outline'
            className='py-12 text-xl w-full flex items-center justify-center gap-3'
          >
            <Icons.group
              color2='fill-muted-foreground'
              className='size-24 min-w-[4rem]'
            />
            <span>Poll Attendees</span>
          </Button>
        </Link>
      </div>
    </SettingsPageTemplate>
  );
}
