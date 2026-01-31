'use client';

import { DateCardList } from '../../components/date-card-list';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export function DateSelectContent({ eventId }: { eventId: string }) {
  return (
    <div className='container max-w-5xl py-4 flex flex-col'>
      <div className='w-max my-2'>
        <Link data-test='full-post-back' href={`/event/${eventId}`}>
          <Button variant={'ghost'} className='flex items-center gap-1 pl-2'>
            <Icons.back />
            <span>Back to Event</span>
          </Button>
        </Link>
      </div>
      <div>
        <h1 className='font-heading text-4xl my-4'>
          Choose a date/time for your event.
        </h1>
        {/* DateCardList uses context data (pre-fetched at layout level) */}
        <DateCardList />
      </div>
    </div>
  );
}
