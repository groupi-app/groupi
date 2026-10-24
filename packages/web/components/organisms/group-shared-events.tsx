'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  useGroupSharedEvents,
  useWithdrawGroupEventAudience,
} from '@/hooks/convex/use-group-event-audiences';
import { GroupPagination } from './group-pagination';
import { AudienceBoundary } from './audience-boundary';
export function GroupSharedEvents({ groupId }: { groupId: Id<'groups'> }) {
  return (
    <AudienceBoundary key={groupId}>
      <SharedEvents groupId={groupId} />
    </AudienceBoundary>
  );
}
function SharedEvents({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null),
    [busy, setBusy] = useState<Id<'events'> | null>(null),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const events = useGroupSharedEvents({
    groupId,
    paginationOpts: { cursor, numItems: 20 },
  });
  const withdraw = useWithdrawGroupEventAudience();
  return (
    <section
      className='space-y-4'
      aria-labelledby='group-shared-events-heading'
    >
      <h2
        id='group-shared-events-heading'
        className='font-heading text-xl font-semibold'
      >
        Group-shared Events
      </h2>
      <p className='max-w-2xl text-sm leading-relaxed text-muted-foreground'>
        Events shared with this Group.
      </p>
      {events === undefined ? (
        <p role='status'>Loading Group-shared Events…</p>
      ) : (
        <>
          {events.page.length === 0 && <p>No active Events on this page.</p>}
          <ul className='grid gap-4 sm:grid-cols-2'>
            {events.page.map(({ event, canWithdraw }) => (
              <li
                key={event._id}
                className='flex min-w-0 flex-col gap-3 rounded-card border border-border bg-card p-5'
              >
                <h3 className='break-words font-semibold'>{event.title}</h3>
                {event.description && (
                  <p className='whitespace-pre-wrap break-words text-sm text-muted-foreground'>
                    {event.description}
                  </p>
                )}
                <p className='break-words text-sm'>
                  {event.location || 'Location TBD'}
                </p>
                <p className='break-words text-sm text-muted-foreground'>
                  {event.chosenDateTime === null
                    ? 'Date not yet confirmed'
                    : new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: event.timezone,
                      }).format(event.chosenDateTime)}{' '}
                  · {event.timezone}
                </p>
                <Button asChild variant='outline' className='self-start'>
                  <Link
                    href={`/event/${event._id}/preview`}
                    aria-label={`View ${event.title} logistics`}
                  >
                    View logistics
                  </Link>
                </Button>
                {canWithdraw && (
                  <Button
                    variant='outline'
                    className='h-auto min-h-10 max-w-full self-start whitespace-normal text-left'
                    disabled={busy !== null}
                    onClick={async () => {
                      setBusy(event._id);
                      setError('');
                      setMessage('');
                      try {
                        await withdraw({ eventId: event._id, groupId });
                        setMessage(
                          'Group audience withdrawn. Independent Event access and participation remain unchanged.'
                        );
                      } catch (cause) {
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : 'Unable to withdraw this audience. Current Group management or Event Organizer authority is required.'
                        );
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <span className='min-w-0 break-words'>
                      Withdraw {event.title} from Group
                    </span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <GroupPagination
            cursor={cursor}
            onCursor={setCursor}
            page={events}
            label='shared Events'
          />
        </>
      )}
      {message && <p role='status'>{message}</p>}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </section>
  );
}
