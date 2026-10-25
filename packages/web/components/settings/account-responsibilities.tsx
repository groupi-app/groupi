'use client';
import { useState } from 'react';
import {
  useAccountRecipients,
  useAccountResponsibilities,
  useAccountReadiness,
  useAccountResolutionActions,
} from '@/hooks/convex/use-account-resolution';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Id } from '@/convex/_generated/dataModel';

export function AccountResponsibilities() {
  const readiness = useAccountReadiness();
  return (
    <section
      aria-label='Resolve account responsibilities'
      className='space-y-4'
    >
      <h2 className='font-semibold'>Resolve your Groups and Events</h2>
      <p role='status' aria-live='polite'>
        {!readiness
          ? 'Checking current ownership…'
          : readiness.canDelete
            ? 'All responsibilities resolved. You may confirm account deletion.'
            : 'Ownership remains unresolved until a transfer is accepted or you explicitly delete the resource.'}
      </p>
      <p className='text-sm text-muted-foreground'>
        Group deletion preserves independent Events. Event transfer preserves
        memberships and RSVP; Friends visibility follows the accepting
        Organizer.
      </p>
      <OwnedResources kind='GROUP' />
      <OwnedResources kind='EVENT' />
    </section>
  );
}
function OwnedResources({ kind }: { kind: 'GROUP' | 'EVENT' }) {
  const { results, status, loadMore } = useAccountResponsibilities(kind);
  return (
    <section
      aria-label={`Owned ${kind === 'GROUP' ? 'Groups' : 'Events'}`}
      className='space-y-3'
    >
      <h3 className='font-semibold'>
        {kind === 'GROUP' ? 'Groups' : 'Events'}
      </h3>
      <p role='status' aria-live='polite'>
        {results.length} unresolved resources loaded
        {status !== 'Exhausted' ? '; more may remain.' : '.'}
      </p>
      {status === 'LoadingFirstPage' && (
        <p role='status'>Loading owned resources…</p>
      )}
      {status === 'Exhausted' && results.length === 0 && (
        <p>No unresolved {kind === 'GROUP' ? 'Groups' : 'Events'}.</p>
      )}
      {results.map(item => (
        <Responsibility key={item.id} item={item} />
      ))}
      {status !== 'Exhausted' && status !== 'LoadingFirstPage' && (
        <Button
          type='button'
          variant='outline'
          disabled={status === 'LoadingMore'}
          onClick={() => loadMore(20)}
        >
          {status === 'LoadingMore'
            ? 'Loading…'
            : `Load more ${kind === 'GROUP' ? 'Groups' : 'Events'}`}
        </Button>
      )}
    </section>
  );
}
function Responsibility({
  item,
}: {
  item: ReturnType<typeof useAccountResponsibilities>['results'][number];
}) {
  const candidates = useAccountRecipients(item.kind, item.id);
  const actions = useAccountResolutionActions();
  const [recipient, setRecipient] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action: 'offer' | 'delete' | 'cancel') {
    setBusy(true);
    setError('');
    try {
      if (item.kind === 'GROUP') {
        const groupId = item.id as Id<'groups'>;
        if (action === 'delete') await actions.deleteGroup({ groupId });
        else if (action === 'offer')
          await actions.offerGroup({
            groupId,
            recipientId: recipient as Id<'persons'>,
          });
        else
          await actions.cancelGroup({
            groupId,
            transferId: item.transferId as Id<'groupTransfers'>,
          });
      } else {
        const eventId = item.id as Id<'events'>;
        if (action === 'delete') await actions.deleteEvent({ eventId });
        else if (action === 'offer')
          await actions.offerEvent({
            eventId,
            recipientId: recipient as Id<'persons'>,
          });
        else
          await actions.cancelEvent({
            eventId,
            transferId: item.transferId as Id<'eventTransfers'>,
          });
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Resolution failed. Retry this action.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article
      aria-label={`${item.title} responsibility`}
      className='space-y-2 rounded-card border p-3'
    >
      <h4 className='font-semibold'>{item.title}</h4>
      <p role='status'>
        {item.status === 'PENDING'
          ? 'Pending acceptance — unresolved. The recipient must accept in their ownership controls.'
          : `${item.status === 'NONE' ? 'Owned' : item.status} — unresolved.`}
      </p>
      {error && (
        <p role='alert' className='text-text-error'>
          {error}
        </p>
      )}
      <Label htmlFor={`recipient-${item.id}`}>Transfer ownership to</Label>
      <select
        id={`recipient-${item.id}`}
        className='w-full rounded-input border bg-background p-2'
        value={recipient}
        onChange={e => setRecipient(e.target.value)}
        disabled={busy || candidates.status === 'LoadingFirstPage'}
      >
        <option value=''>Choose an eligible member</option>
        {candidates.results.map(member => (
          <option key={member.personId} value={member.personId}>
            {member.label}
          </option>
        ))}
      </select>
      {candidates.status === 'Exhausted' && candidates.results.length === 0 && (
        <p>No eligible recipient. You can explicitly delete this resource.</p>
      )}
      {candidates.status === 'CanLoadMore' && (
        <Button
          type='button'
          variant='outline'
          onClick={() => candidates.loadMore(20)}
        >
          Load more recipients
        </Button>
      )}
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          disabled={busy || !recipient.trim() || item.status === 'PENDING'}
          onClick={() => void run('offer')}
        >
          Offer transfer
        </Button>
        {item.status === 'PENDING' && (
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() => void run('cancel')}
          >
            Cancel pending transfer
          </Button>
        )}
        <Button
          type='button'
          variant='destructive'
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          Delete {item.kind === 'GROUP' ? 'Group' : 'Event'}
        </Button>
      </div>
      {confirmDelete && (
        <div
          role='group'
          aria-label={`Confirm deletion of ${item.title}`}
          className='space-y-2'
        >
          <p>
            Permanently delete {item.title} and its data?
            {item.kind === 'GROUP' ? ' Independent Events remain.' : ''}
          </p>
          <Button
            type='button'
            variant='destructive'
            disabled={busy}
            onClick={() => void run('delete')}
          >
            Confirm resource deletion
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() => setConfirmDelete(false)}
          >
            Keep resource
          </Button>
        </div>
      )}
    </article>
  );
}
