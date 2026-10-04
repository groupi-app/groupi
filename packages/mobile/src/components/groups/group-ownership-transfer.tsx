import { useState } from 'react';
import { View } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { useGroupTransfer } from '@/hooks/use-group-transfer';
import { useGroupMembers } from '@/hooks/use-group-invitations';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
export function GroupOwnershipTransfer({ groupId }: { groupId: Id<'groups'> }) {
  const { status, offer, accept, decline, cancel } = useGroupTransfer(groupId);
  const [cursor, setCursor] = useState<string | null>(null),
    [cursors, setCursors] = useState<(string | null)[]>([]);
  const members = useGroupMembers(groupId, { numItems: 20, cursor });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (status === undefined)
    return (
      <Text accessibilityLiveRegion='polite'>Loading ownership status…</Text>
    );
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
    <View className='rounded-card border border-border p-4 gap-3'>
      <Text accessibilityRole='header' className='font-semibold'>
        Group ownership
      </Text>
      <Text>{status.explanation}</Text>
      <Text accessibilityLiveRegion='polite'>
        {status.status === 'PENDING'
          ? 'Offer pending — the current owner remains responsible until acceptance.'
          : `Transfer status: ${status.status === 'NONE' ? 'No offer' : status.status.toLowerCase()}`}
      </Text>
      {status.recipient && (
        <Text>
          Recipient:{' '}
          {status.recipient.name || status.recipient.username || 'Group member'}
        </Text>
      )}
      {status.canOffer && (
        <>
          <Text>Offer ownership to an admitted member:</Text>
          {members?.page
            .filter(m => m.role !== 'OWNER')
            .map(m => (
              <Button
                key={m.personId}
                variant='outline'
                disabled={busy}
                accessibilityLabel={`Offer ownership to ${m.name || m.username || 'Group member'}`}
                onPress={() =>
                  void run(() => offer({ groupId, recipientId: m.personId }))
                }
              >
                Offer ownership to {m.name || m.username || 'Group member'}
              </Button>
            ))}
          {cursors.length > 0 && (
            <Button
              variant='outline'
              disabled={busy}
              onPress={() => {
                setCursor(cursors.at(-1) ?? null);
                setCursors(cursors.slice(0, -1));
              }}
            >
              Previous members
            </Button>
          )}
          {members && !members.isDone && (
            <Button
              variant='outline'
              disabled={busy}
              onPress={() => {
                setCursors([...cursors, cursor]);
                setCursor(members.continueCursor);
              }}
            >
              Next members
            </Button>
          )}
        </>
      )}
      {status.transferId && (
        <>
          {status.canAccept && (
            <Button
              disabled={busy}
              accessibilityLabel='Accept ownership'
              onPress={() =>
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
              accessibilityLabel='Decline ownership'
              onPress={() =>
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
              accessibilityLabel='Cancel offer'
              onPress={() =>
                void run(() =>
                  cancel({ groupId, transferId: status.transferId! })
                )
              }
            >
              Cancel offer
            </Button>
          )}
        </>
      )}
      {error && (
        <Text accessibilityRole='alert' className='text-error'>
          {error}
        </Text>
      )}
    </View>
  );
}
