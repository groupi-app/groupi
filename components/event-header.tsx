'use client';

import { Icons } from '@/components/icons';
import { useEventHeader } from '@/data/event-hooks';
import { HeaderData } from '@/types';
import Link from 'next/link';
import { DeleteEventDialog } from './deleteEventDialog';
import { EventRSVP } from './event-rsvp';
import { LeaveEventDialog } from './leaveEventDialog';
import { Button } from './ui/button';
import { Dialog, DialogTrigger } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function EventHeader({ eventId }: { eventId: string }) {
  const { data: headerData } = useEventHeader(eventId);
  const {
    title,
    location,
    chosenDateTime,
    description,
    userMembership,
  }: HeaderData = headerData;

  const eventDateStr =
    chosenDateTime != null
      ? chosenDateTime.toLocaleString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  return (
    <Dialog>
      <header className='flex flex-col md:my-5 max-w-4xl mx-auto gap-3'>
        <div className='flex justify-between flex-col-reverse gap-3 md:flex-row'>
          <h1
            data-test='event-title'
            className='text-5xl font-heading font-medium'
          >
            {title}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger className='size-12 hover:bg-accent transition-all rounded-md flex items-center justify-center'>
              <Icons.more className='size-8' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {userMembership.role === 'ORGANIZER' ? (
                <>
                  <Link href={`/event/${eventId}/edit`}>
                    <DropdownMenuItem className='cursor-pointer'>
                      <div className='flex items-center gap-1'>
                        <Icons.edit className='size-4' />
                        <span>Edit Details</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <Link href={`/event/${eventId}/change-date`}>
                    <DropdownMenuItem className='cursor-pointer'>
                      <div className='flex items-center gap-1'>
                        <Icons.date className='size-4' />
                        <span>Change Date</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'>
                    <DialogTrigger className='flex items-center gap-1'>
                      <Icons.delete className='size-4' />
                      <span>Delete Event</span>
                    </DialogTrigger>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'>
                  <DialogTrigger className='flex items-center gap-1'>
                    <Icons.leave className='size-4' />
                    <span>Leave Event</span>
                  </DialogTrigger>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className='flex flex-col gap-2'>
          {location && (
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Icons.location className='size-6 text-primary' />
              <span data-test='event-location'>{location}</span>
            </div>
          )}
          <div className='flex items-center gap-1 text-muted-foreground'>
            <Icons.date className='size-6 text-primary' />
            {eventDateStr != null ? (
              <span data-test='event-datetime'>{eventDateStr}</span>
            ) : userMembership.role === 'ORGANIZER' ? (
              <Link href={`/event/${eventId}/date-select`}>
                <Button
                  className='flex items-center gap-1'
                  variant={'ghost'}
                  size={'sm'}
                >
                  <span>Choose Date/Time</span>
                  <Icons.arrowRight className='size-4' />
                </Button>
              </Link>
            ) : (
              <Link href={`/event/${eventId}/availability`}>
                <Button
                  className='flex items-center gap-1'
                  variant={'ghost'}
                  size={'sm'}
                >
                  <span>Set Availability</span>
                  <Icons.arrowRight className='size-4' />
                </Button>
              </Link>
            )}
          </div>
        </div>
        {description && <p data-test='event-description'>{description}</p>}
        <EventRSVP
          title={title}
          dateTime={chosenDateTime}
          userMembership={userMembership}
        />
      </header>
      {userMembership.role === 'ORGANIZER' ? (
        <DeleteEventDialog id={eventId} />
      ) : (
        <LeaveEventDialog id={eventId} />
      )}
    </Dialog>
  );
}
