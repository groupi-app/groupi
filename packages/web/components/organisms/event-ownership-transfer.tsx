'use client';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { createEventTransferHooks } from '@groupi/shared';
import type { ConvexId } from '@groupi/shared';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
const { useEventTransfer } = createEventTransferHooks(api, {
  useQuery,
  useMutation,
});
export function EventOwnershipTransfer({
  eventId,
  personId,
  members,
}: {
  eventId: Id<'events'>;
  personId: Id<'persons'>;
  members: {
    personId: Id<'persons'>;
    role: string;
    user: { name?: string | null; username?: string | null } | null;
  }[];
}) {
  const { status, offer, accept, decline, cancel } = useEventTransfer(
    eventId as ConvexId<'events'>
  );
  const [recipientId, setRecipientId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!status) return null;
  const owner = status.organizerId === personId;
  const pending = status.status === 'PENDING';
  const recipient = status.recipientId === personId;
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ownership action failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-labelledby='event-ownership-heading'
      className='rounded-card bg-card p-4 space-y-3'
    >
      <h2 id='event-ownership-heading' className='font-semibold'>
        Event ownership
      </h2>
      <p>{status.explanation}</p>
      <p role='status'>
        {pending
          ? 'Offer pending — current Organizer remains responsible until acceptance.'
          : `Transfer status: ${status.status === 'NONE' ? 'No offer' : status.status.toLowerCase()}`}
      </p>
      {owner && !pending && (
        <>
          <label htmlFor='ownership-recipient'>Offer ownership to</label>
          <select
            id='ownership-recipient'
            value={recipientId}
            onChange={e => setRecipientId(e.target.value)}
            className='rounded-input border bg-background p-2 w-full'
          >
            <option value=''>Choose an existing member</option>
            {members
              .filter(m => m.personId !== personId && m.role !== 'ORGANIZER')
              .map(m => (
                <option key={m.personId} value={m.personId}>
                  {m.user?.name ?? m.user?.username ?? 'Event member'}
                </option>
              ))}
          </select>
          <Button
            disabled={busy || !recipientId}
            onClick={() => run(() => offer({ eventId, recipientId }))}
          >
            Offer ownership
          </Button>
        </>
      )}
      {pending && recipient && (
        <>
          <Button
            disabled={busy}
            onClick={() =>
              run(() => accept({ eventId, transferId: status.transferId }))
            }
          >
            Accept ownership
          </Button>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() =>
              run(() => decline({ eventId, transferId: status.transferId }))
            }
          >
            Decline offer
          </Button>
        </>
      )}
      {pending && owner && (
        <Button
          variant='outline'
          disabled={busy}
          onClick={() =>
            run(() => cancel({ eventId, transferId: status.transferId }))
          }
        >
          Cancel offer
        </Button>
      )}
      {error && <p role='alert'>{error}</p>}
    </section>
  );
}
