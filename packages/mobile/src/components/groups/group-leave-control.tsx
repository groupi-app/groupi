import { useState } from 'react';
import { router } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLeaveGroup } from '@/hooks/use-group-moderation';

export function GroupLeaveControl({
  groupId,
  canLeave,
}: {
  groupId: Id<'groups'>;
  canLeave: boolean;
}) {
  const leave = useLeaveGroup();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function performLeave() {
    setBusy(true);
    setError('');
    try {
      await leave({ groupId });
      router.replace('/friends');
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not leave Group. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {canLeave ? (
        <Button
          variant='destructive'
          accessibilityLabel='Leave Group'
          disabled={busy}
          accessibilityState={{ disabled: busy, busy }}
          isLoading={busy}
          onPress={() =>
            showConfirmDialog({
              title: 'Leave Group',
              message:
                'Leave this Group? Returning requires a future invitation allowed by the current policy. Your Event memberships remain unchanged.',
              confirmLabel: 'Leave Group',
              destructive: true,
              onConfirm: performLeave,
            })
          }
        >
          Leave Group
        </Button>
      ) : (
        <Text className='text-muted-foreground'>
          The owner cannot leave their Group. Use Delete Group to close it
          permanently.
        </Text>
      )}
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
    </>
  );
}
