'use client';
import { useRef, useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useEventLifecycle,
  useSetEventLifecycle,
} from '@/hooks/convex/use-event-lifecycle';
export function EventLifecycleSettings({
  eventId,
  role,
}: {
  eventId: Id<'events'>;
  role?: string;
}) {
  return role === 'ORGANIZER' ? (
    <OrganizerLifecycle key={eventId} eventId={eventId} />
  ) : null;
}
function OrganizerLifecycle({ eventId }: { eventId: Id<'events'> }) {
  const state = useEventLifecycle({ eventId });
  const setLifecycle = useSetEventLifecycle();
  const intent = useRef<Parameters<typeof setLifecycle>[0] | null>(null);
  const [retryAction, setRetryAction] = useState<
    'complete' | 'reopen' | 'reschedule' | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  if (!state) return <p role='status'>Loading Event lifecycle…</p>;
  async function run(action: 'complete' | 'reopen' | 'reschedule') {
    if (!state) return;
    if (!intent.current)
      intent.current = {
        eventId,
        action,
        expectedRevision: state.revision,
        operationId: crypto.randomUUID(),
        ...(action === 'reschedule'
          ? {
              startsAt: start ? Date.parse(`${start}Z`) : null,
              endsAt: end ? Date.parse(`${end}Z`) : null,
            }
          : {}),
      };
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const receipt = await setLifecycle(intent.current);
      intent.current = null;
      setRetryAction(null);
      setMessage(
        receipt.result.completed ? 'Event completed.' : 'Event is active.'
      );
    } catch (cause) {
      setRetryAction(action);
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to confirm this request. Retry the same request or reconcile the current status.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className='rounded-card border border-border p-4 space-y-4'
      aria-labelledby='event-lifecycle-heading'
    >
      <h2 id='event-lifecycle-heading' className='text-xl font-semibold'>
        Event completion
      </h2>
      <p role='status'>
        {state.completed ? 'Completed' : 'Active'}. An end time completes the
        Event automatically. A past start without an end stays active.
      </p>
      {state.audienceConflicts?.map(group => (
        <p role='alert' key={group.groupId}>
          Multiple active Events are shared with {group.name}. Complete this
          Event, reschedule it, or withdraw its Group audience below to resolve
          the configuration conflict.
        </p>
      ))}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
      {message && <p role='status'>{message}</p>}
      {retryAction ? (
        <>
          <Button disabled={busy} onClick={() => void run(retryAction)}>
            Retry same request
          </Button>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => {
              intent.current = null;
              setRetryAction(null);
              setError('');
              setMessage(
                'Current status reconciled. Choose a new action if needed.'
              );
            }}
          >
            Reconcile current status
          </Button>
        </>
      ) : (
        <>
          <Button
            disabled={busy}
            onClick={() => void run(state.completed ? 'reopen' : 'complete')}
          >
            {state.completed ? 'Reopen Event' : 'Complete Event'}
          </Button>
          <p>
            To reopen an Event whose end has passed, reschedule it. Dates below
            are in UTC; leave both empty for an undated Event.
          </p>
          <Label htmlFor='lifecycle-start'>New start (UTC)</Label>
          <Input
            id='lifecycle-start'
            type='datetime-local'
            value={start}
            disabled={busy}
            onChange={e => setStart(e.target.value)}
          />
          <Label htmlFor='lifecycle-end'>New end (UTC, optional)</Label>
          <Input
            id='lifecycle-end'
            type='datetime-local'
            value={end}
            disabled={busy}
            onChange={e => setEnd(e.target.value)}
          />
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => void run('reschedule')}
          >
            Reschedule Event
          </Button>
        </>
      )}
    </section>
  );
}
