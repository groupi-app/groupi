'use client';
import { useState } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useGroupTransfer } from '@/hooks/convex/use-group-transfer';
import { useGroupMembers } from '@/hooks/convex/use-group-invitations';
import { Button } from '@/components/ui/button';
export function GroupOwnershipTransfer({ groupId }: { groupId: Id<'groups'> }) {
  const { status, offer, accept, decline, cancel } = useGroupTransfer(groupId);
  const [cursor, setCursor] = useState<string | null>(null),
    [cursors, setCursors] = useState<(string | null)[]>([]);
  const members = useGroupMembers(status?.canOffer ? groupId : 'skip', {
    numItems: 20,
    cursor,
  });
  const [recipientId, setRecipientId] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (status === undefined)
    return <p role='status'>Loading ownership status…</p>;
  if (!status) return null;
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Ownership action failed.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id='group-ownership'
      aria-labelledby='group-ownership-heading'
      className='rounded-card border border-border p-4 space-y-3'
    >
      <h2 id='group-ownership-heading' className='font-semibold'>
        Group ownership
      </h2>
      <p>{status.explanation}</p>
      <p role='status'>
        {status.status === 'PENDING'
          ? 'Offer pending — the current owner remains responsible until acceptance.'
          : `Transfer status: ${status.status === 'NONE' ? 'No offer' : status.status.toLowerCase()}`}
      </p>
      {status.recipient && (
        <p>
          Recipient:{' '}
          {status.recipient.name || status.recipient.username || 'Group member'}
        </p>
      )}
      {status.canOffer && (
        <>
          <label htmlFor='group-ownership-recipient'>Offer ownership to</label>
          <select
            id='group-ownership-recipient'
            className='w-full rounded-input border border-border bg-background p-2'
            disabled={busy}
            value={recipientId}
            onChange={event => setRecipientId(event.target.value)}
          >
            <option value=''>Choose an admitted member</option>
            {members?.page
              .filter(m => m.role !== 'OWNER')
              .map(m => (
                <option key={m.personId} value={m.personId}>
                  {m.name || m.username || 'Group member'}
                </option>
              ))}
          </select>
          <div className='flex gap-2'>
            {cursors.length > 0 && (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => {
                  setCursor(cursors.at(-1) ?? null);
                  setCursors(cursors.slice(0, -1));
                  setRecipientId('');
                }}
              >
                Previous members
              </Button>
            )}
            {members && !members.isDone && (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => {
                  setCursors([...cursors, cursor]);
                  setCursor(members.continueCursor);
                  setRecipientId('');
                }}
              >
                Next members
              </Button>
            )}
          </div>
          <Button
            disabled={busy || !recipientId}
            onClick={() =>
              void run(() =>
                offer({ groupId, recipientId: recipientId as Id<'persons'> })
              )
            }
          >
            Offer ownership
          </Button>
        </>
      )}
      {status.transferId && (
        <div className='flex gap-2'>
          {status.canAccept && (
            <Button
              disabled={busy}
              onClick={() =>
                void run(() =>
                  accept({ groupId, transferId: status.transferId! })
                )
              }
            >
              Accept ownership
            </Button>
          )}
          {status.canDecline && (
            <Button
              variant='outline'
              disabled={busy}
              onClick={() =>
                void run(() =>
                  decline({ groupId, transferId: status.transferId! })
                )
              }
            >
              Decline ownership
            </Button>
          )}
          {status.canCancel && (
            <Button
              variant='outline'
              disabled={busy}
              onClick={() =>
                void run(() =>
                  cancel({ groupId, transferId: status.transferId! })
                )
              }
            >
              Cancel offer
            </Button>
          )}
        </div>
      )}
      {error && (
        <p role='alert' className='text-error'>
          {error}
        </p>
      )}
    </section>
  );
}
