import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import {
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useCancelGroupInvite,
  type useMyGroupInviteForGroup,
} from '@/hooks/use-group-invitations';

type Invitation = NonNullable<ReturnType<typeof useMyGroupInviteForGroup>>;

export function GroupInvitationCard({
  invite,
  manager = false,
}: {
  invite: Invitation;
  manager?: boolean;
}) {
  const accept = useAcceptGroupInvite();
  const decline = useDeclineGroupInvite();
  const cancel = useCancelGroupInvite();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resolvedStatus, setResolvedStatus] = useState<
    Invitation['status'] | null
  >(null);
  const status = resolvedStatus ?? invite.status;

  async function respond(action: 'accept' | 'decline' | 'cancel') {
    setBusy(true);
    setError('');
    try {
      if (action === 'accept') {
        const result = await accept({ inviteId: invite.inviteId });
        setResolvedStatus(result.status);
        router.replace(`/groups/${result.groupId}`);
      } else if (action === 'decline') {
        setResolvedStatus(
          (await decline({ inviteId: invite.inviteId })).status
        );
      } else {
        setResolvedStatus((await cancel({ inviteId: invite.inviteId })).status);
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not update Group invitation. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className='gap-3 rounded-card border border-border bg-card p-4'>
      <Text className='font-semibold text-foreground'>{invite.group.name}</Text>
      <Text className='text-muted-foreground'>
        {manager
          ? `Invited ${invite.invitee.name ?? invite.invitee.username ?? 'Groupi user'}`
          : `Invited by ${invite.inviter.name ?? invite.inviter.username ?? 'a Group manager'}`}
      </Text>
      <Text accessibilityLiveRegion='polite' className='text-muted-foreground'>
        Invitation {status.toLowerCase()}
      </Text>
      {status === 'PENDING' ? (
        manager ? (
          <Button
            variant='outline'
            accessibilityLabel={`Cancel invitation for ${invite.invitee.name ?? invite.invitee.username ?? 'Groupi user'}`}
            onPress={() => respond('cancel')}
            disabled={busy}
          >
            Cancel invitation
          </Button>
        ) : (
          <>
            {!invite.available ? (
              <Text className='text-muted-foreground'>
                This invitation is currently unavailable.
              </Text>
            ) : null}
            <Button
              accessibilityLabel={`Accept invitation to ${invite.group.name}`}
              onPress={() => respond('accept')}
              disabled={busy || !invite.available}
              isLoading={busy}
            >
              Accept
            </Button>
            <Button
              variant='outline'
              accessibilityLabel={`Decline invitation to ${invite.group.name}`}
              onPress={() => respond('decline')}
              disabled={busy}
            >
              Decline
            </Button>
          </>
        )
      ) : null}
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
