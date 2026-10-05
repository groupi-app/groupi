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
      <h2 id='group-shared-events-heading' className='text-xl font-semibold'>
        Group-shared Events
      </h2>
      <p>
        Upcoming and undated Events shared with this Group. Read their logistics
        without joining, RSVP changes, or access to participant content.
      </p>
      {events === undefined ? (
        <p role='status'>Loading Group-shared Events…</p>
      ) : (
        <>
          {events.page.length === 0 && (
            <p>No upcoming or undated Events on this page.</p>
          )}
          <ul className='space-y-4'>
            {events.page.map(({ event, canWithdraw }) => (
              <li
                key={event._id}
                className='rounded-card border border-border p-4 space-y-3'
              >
                <h3 className='font-semibold'>{event.title}</h3>
                {event.description && <p>{event.description}</p>}
                <p>{event.location || 'Location TBD'}</p>
                <p>
                  {event.chosenDateTime === null
                    ? 'Date not yet confirmed'
                    : new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: event.timezone,
                      }).format(event.chosenDateTime)}{' '}
                  · {event.timezone}
                </p>
                <Button asChild variant='outline'>
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
                    Withdraw {event.title} from Group
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
