'use client';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
export function EventMail({ groupId }: { groupId: Id<'groups'> }) {
  const events = useQuery(api.groupAnnouncements.eventMail.staffEvents, {
    groupId,
  });
  const announce = useMutation(api.groupAnnouncements.eventMail.announce);
  const retry = useMutation(api.groupAnnouncements.eventMail.retry);
  const [eventId, setEventId] = useState<Id<'events'> | ''>('');
  const [intent, setIntent] = useState<{
    groupId: Id<'groups'>;
    eventId: Id<'events'>;
    operationId: string;
  } | null>(null);
  const [announcementId, setAnnouncementId] =
    useState<Id<'groupEventAnnouncements'> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const status = useQuery(
    api.groupAnnouncements.eventMail.status,
    announcementId ? { announcementId } : 'skip'
  );
  return (
    <section
      className='rounded-card bg-card p-4 space-y-3'
      aria-label='Event announcement email'
    >
      <h2 className='font-semibold'>Email an Event announcement</h2>
      <p>
        Only current subscribed Group members who may access this Event receive
        email. Publishing an Event does not send mail.
      </p>
      <Label htmlFor='announce-event'>Event you organize</Label>
      <select
        id='announce-event'
        value={eventId}
        disabled={Boolean(intent)}
        onChange={e => setEventId(e.target.value as Id<'events'>)}
      >
        <option value=''>Choose an Event</option>
        {events?.map(event => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
      <Button
        disabled={!eventId || pending || Boolean(announcementId)}
        onClick={async () => {
          if (!eventId) return;
          const next = intent ?? {
            groupId,
            eventId,
            operationId: crypto.randomUUID(),
          };
          setIntent(next);
          setPending(true);
          setError('');
          try {
            setAnnouncementId((await announce(next)).result.announcementId);
          } catch (cause) {
            setError(
              `${cause instanceof Error ? cause.message : 'Outcome unknown.'} Retry this same intent before starting another announcement.`
            );
          } finally {
            setPending(false);
          }
        }}
      >
        {intent
          ? 'Retry same Event announcement'
          : 'Send Event announcement email'}
      </Button>
      {status && (
        <p role='status'>
          {status.processing ? 'Queueing. ' : ''}
          {status.queued} queued; {status.delivered} delivered to provider;{' '}
          {status.failed} failed; {status.suppressed} suppressed.
        </p>
      )}
      {status && status.failed > 0 && announcementId && (
        <Button
          onClick={async () => {
            try {
              await retry({ announcementId });
              setError('');
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : 'Retry unavailable.'
              );
            }
          }}
        >
          Retry failed deliveries
        </Button>
      )}
      {error && <p role='alert'>{error}</p>}
    </section>
  );
}
