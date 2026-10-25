'use client';

import { Component, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useEventLogistics,
  useJoinEvent,
} from '@/hooks/convex/use-event-admission';

class LogisticsBoundary extends Component<
  { children: ReactNode },
  { unavailable: boolean }
> {
  state = { unavailable: false };
  static getDerivedStateFromError() {
    return { unavailable: true };
  }
  render() {
    if (this.state.unavailable)
      return (
        <main className='mx-auto max-w-2xl p-6 space-y-4'>
          <h1 className='text-2xl font-semibold'>Event unavailable</h1>
          <p role='alert'>
            This event is unavailable or you do not have permission to view it.
          </p>
          <Link href='/events' className='text-primary underline'>
            Return to Events
          </Link>
        </main>
      );
    return this.props.children;
  }
}

export function EventLogisticsPreview({ eventId }: { eventId: Id<'events'> }) {
  return (
    <LogisticsBoundary key={eventId}>
      <EventLogisticsContent eventId={eventId} />
    </LogisticsBoundary>
  );
}

function EventLogisticsContent({ eventId }: { eventId: Id<'events'> }) {
  const logistics = useEventLogistics(eventId);
  const join = useJoinEvent();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  if (logistics === undefined)
    return (
      <p role='status' className='p-6'>
        Loading event…
      </p>
    );
  const { event, organizer, entryAction } = logistics;
  const organizerName = organizer?.name || organizer?.username || 'Organizer';
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: event.timezone,
  });
  const formatRange = (start: number, end: number | null) =>
    `${dateFormatter.format(start)}${end !== null ? ` – ${dateFormatter.format(end)}` : ''}`;
  return (
    <main className='mx-auto max-w-2xl p-6 space-y-6'>
      <Link href='/events' className='text-primary underline'>
        Events
      </Link>
      {event.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Dynamic Convex storage image
        <img
          src={event.imageUrl}
          alt=''
          className='w-full aspect-video object-cover rounded-card'
          style={
            event.imageFocalPoint
              ? {
                  objectPosition: `${event.imageFocalPoint.x * 100}% ${event.imageFocalPoint.y * 100}%`,
                }
              : undefined
          }
        />
      )}
      <h1 className='text-3xl font-bold'>{event.title}</h1>
      <div className='flex items-center gap-3'>
        <Avatar>
          <AvatarImage src={organizer?.image ?? undefined} alt='' />
          <AvatarFallback>{organizerName.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm text-muted-foreground'>Organizer</p>
          <p>{organizerName}</p>
        </div>
      </div>
      {event.description && (
        <p className='whitespace-pre-wrap'>{event.description}</p>
      )}
      <section
        className='rounded-card bg-card p-4 space-y-4'
        aria-label='Event logistics'
      >
        <div>
          <h2 className='font-semibold'>Location</h2>
          <p>{event.location || 'Location TBD'}</p>
        </div>
        <div>
          <h2 className='font-semibold'>Dates</h2>
          <p className='text-sm text-muted-foreground'>{event.timezone}</p>
          {event.chosenDateTime !== null ? (
            <p>{formatRange(event.chosenDateTime, event.chosenEndDateTime)}</p>
          ) : event.potentialDateTimeOptions.length ? (
            <>
              <p className='text-sm text-muted-foreground'>
                Potential dates — not yet confirmed
              </p>
              <ul className='space-y-2'>
                {event.potentialDateTimeOptions.map(date => (
                  <li key={date.id}>
                    <p>{formatRange(date.start, date.end)}</p>
                    {date.note && (
                      <p className='text-sm text-muted-foreground'>
                        {date.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Date TBD</p>
          )}
        </div>
      </section>
      <section
        className='rounded-card border border-border p-4 space-y-3'
        aria-label='Event entry'
      >
        {entryAction === 'INVITATION_ONLY' && (
          <>
            <h2 className='font-semibold'>Invitation only</h2>
            <p>You need an invitation to join this event.</p>
          </>
        )}
        {entryAction === 'UNAVAILABLE' && (
          <>
            <h2 className='font-semibold'>Joining unavailable</h2>
            <p>You cannot join this event at this time.</p>
          </>
        )}
        {entryAction === 'SIGN_IN' && (
          <>
            <p>Sign in to check whether you can join this event.</p>
            <Button asChild>
              <Link
                href={`/sign-in?redirect=${encodeURIComponent(`/event/${eventId}/preview`)}`}
              >
                Sign in or sign up
              </Link>
            </Button>
          </>
        )}
        {entryAction === 'MEMBER' && (
          <Button asChild>
            <Link href={`/event/${eventId}`}>Open Event</Link>
          </Button>
        )}
        {entryAction === 'APPLY' && (
          <>
            <p>
              Apply before joining. Approval admits you as an Attendee with a
              Pending RSVP.
            </p>
            <Button asChild>
              <Link href={`/event/${eventId}/apply`}>Apply for approval</Link>
            </Button>
          </>
        )}
        {entryAction === 'JOIN' && (
          <>
            <p>
              Joining leaves your RSVP Pending. Confirm attendance separately
              once a date is chosen.
            </p>
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError('');
                try {
                  await join({ eventId });
                  router.push(`/event/${eventId}`);
                } catch (cause) {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : 'Unable to join this event. Please try again.'
                  );
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? 'Joining…' : 'Join Event'}
            </Button>
          </>
        )}
        {error ? (
          <div className='space-y-2'>
            <p role='alert' className='text-destructive'>
              {error}
            </p>
            <Link
              href='/events?tab=discover'
              className='text-primary underline'
            >
              Return to Discover
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
