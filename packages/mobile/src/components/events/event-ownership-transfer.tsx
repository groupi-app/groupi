import { useState } from 'react';
import { View } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { createEventTransferHooks } from '@groupi/shared/hooks';
import type { ConvexId } from '@groupi/shared/hooks';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!status) return null;
  const owner = status.organizerId === personId;
  const pending = status.status === 'PENDING';
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
    <View className='rounded-card bg-card p-4 gap-3'>
      <Text accessibilityRole='header'>Event ownership</Text>
      <Text>{status.explanation}</Text>
      <Text accessibilityLiveRegion='polite'>
        {pending
          ? 'Offer pending — current Organizer remains responsible until acceptance.'
          : `Transfer status: ${status.status === 'NONE' ? 'No offer' : status.status.toLowerCase()}`}
      </Text>
      {owner &&
        !pending &&
        members
          .filter(m => m.personId !== personId && m.role !== 'ORGANIZER')
          .map(m => (
            <Button
              key={m.personId}
              disabled={busy}
              accessibilityLabel={`Offer ownership to ${m.user?.name ?? m.user?.username ?? 'Event member'}`}
              onPress={() =>
                run(() => offer({ eventId, recipientId: m.personId }))
              }
            >
              <Text>
                Offer ownership to{' '}
                {m.user?.name ?? m.user?.username ?? 'Event member'}
              </Text>
            </Button>
          ))}
      {pending && status.recipientId === personId && (
        <>
          <Button
            disabled={busy}
            onPress={() =>
              run(() => accept({ eventId, transferId: status.transferId }))
            }
          >
            <Text>Accept ownership</Text>
          </Button>
          <Button
            variant='outline'
            disabled={busy}
            onPress={() =>
              run(() => decline({ eventId, transferId: status.transferId }))
            }
          >
            <Text>Decline offer</Text>
          </Button>
        </>
      )}
      {pending && owner && (
        <Button
          variant='outline'
          disabled={busy}
          onPress={() =>
            run(() => cancel({ eventId, transferId: status.transferId }))
          }
        >
          <Text>Cancel offer</Text>
        </Button>
      )}
      {error && <Text accessibilityRole='alert'>{error}</Text>}
    </View>
  );
}
