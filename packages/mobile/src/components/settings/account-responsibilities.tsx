import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useAccountRecipients,
  useAccountResponsibilities,
  useAccountReadiness,
  useAccountResolutionActions,
} from '@/hooks/use-account-resolution';
import type { Id } from 'convex/_generated/dataModel';
export function AccountResponsibilities() {
  const readiness = useAccountReadiness();
  return (
    <View
      accessibilityLabel='Resolve account responsibilities'
      className='gap-3'
    >
      <Text className='font-semibold'>Resolve your Groups and Events</Text>
      <Text accessibilityLiveRegion='polite'>
        {!readiness
          ? 'Checking current ownership…'
          : readiness.canDelete
            ? 'All responsibilities resolved. You may confirm account deletion.'
            : 'Ownership remains unresolved until a transfer is accepted or you explicitly delete the resource.'}
      </Text>
      <Text>
        Group deletion preserves independent Events. Event transfer preserves
        memberships and RSVP; Friends visibility follows the accepting
        Organizer.
      </Text>
      <OwnedResources kind='GROUP' />
      <OwnedResources kind='EVENT' />
    </View>
  );
}
function OwnedResources({ kind }: { kind: 'GROUP' | 'EVENT' }) {
  const { results, status, loadMore } = useAccountResponsibilities(kind);
  return (
    <View className='gap-3'>
      <Text className='font-semibold'>
        {kind === 'GROUP' ? 'Groups' : 'Events'}
      </Text>
      <Text accessibilityLiveRegion='polite'>
        {results.length} unresolved resources loaded
        {status !== 'Exhausted' ? '; more may remain.' : '.'}
      </Text>
      {status === 'LoadingFirstPage' && (
        <Text accessibilityLiveRegion='polite'>Loading owned resources…</Text>
      )}
      {status === 'Exhausted' && results.length === 0 && (
        <Text>No unresolved {kind === 'GROUP' ? 'Groups' : 'Events'}.</Text>
      )}
      {results.map(item => (
        <Responsibility key={item.id} item={item} />
      ))}
      {status !== 'Exhausted' && status !== 'LoadingFirstPage' && (
        <Button
          variant='outline'
          disabled={status === 'LoadingMore'}
          onPress={() => loadMore(20)}
        >
          {status === 'LoadingMore'
            ? 'Loading…'
            : `Load more ${kind === 'GROUP' ? 'Groups' : 'Events'}`}
        </Button>
      )}
    </View>
  );
}
function Responsibility({
  item,
}: {
  item: ReturnType<typeof useAccountResponsibilities>['results'][number];
}) {
  const candidates = useAccountRecipients(item.kind, item.id);
  const actions = useAccountResolutionActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action: 'offer' | 'delete' | 'cancel', recipient = '') {
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
    <View className='gap-2 rounded-card border border-border p-3'>
      <Text className='font-semibold'>{item.title}</Text>
      <Text accessibilityLiveRegion='polite'>
        {item.status === 'PENDING'
          ? 'Pending acceptance — unresolved. The recipient must accept in their ownership controls.'
          : `${item.status === 'NONE' ? 'Owned' : item.status} — unresolved.`}
      </Text>
      {!!error && (
        <Text accessibilityRole='alert' className='text-text-error'>
          {error}
        </Text>
      )}
      {candidates.status === 'LoadingFirstPage' && (
        <Text accessibilityLiveRegion='polite'>
          Loading eligible recipients…
        </Text>
      )}
      {candidates.results.map(member => (
        <Button
          key={member.personId}
          disabled={busy || item.status === 'PENDING'}
          onPress={() => void run('offer', member.personId)}
        >
          Offer transfer to {member.label}
        </Button>
      ))}
      {candidates.status === 'Exhausted' && candidates.results.length === 0 && (
        <Text>
          No eligible recipient. You can explicitly delete this resource.
        </Text>
      )}
      {candidates.status === 'CanLoadMore' && (
        <Button variant='outline' onPress={() => candidates.loadMore(20)}>
          Load more recipients
        </Button>
      )}
      {item.status === 'PENDING' && (
        <Button
          variant='outline'
          disabled={busy}
          onPress={() => void run('cancel')}
        >
          Cancel pending transfer
        </Button>
      )}
      <Button
        variant='destructive'
        disabled={busy}
        onPress={() => setConfirmDelete(true)}
      >
        Delete {item.kind === 'GROUP' ? 'Group' : 'Event'}
      </Button>
      {confirmDelete && (
        <View className='gap-2'>
          <Text>
            Permanently delete {item.title} and its data?
            {item.kind === 'GROUP' ? ' Independent Events remain.' : ''}
          </Text>
          <Button
            variant='destructive'
            disabled={busy}
            onPress={() => void run('delete')}
          >
            Confirm resource deletion
          </Button>
          <Button
            variant='outline'
            disabled={busy}
            onPress={() => setConfirmDelete(false)}
          >
            Keep resource
          </Button>
        </View>
      )}
    </View>
  );
}
