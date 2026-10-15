import { useState } from 'react';
import { View } from 'react-native';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGroupMembers } from '@/hooks/use-group-invitations';
import {
  useBanGroupPerson,
  useRemoveGroupMember,
  useSetGroupMemberRole,
} from '@/hooks/use-group-moderation';

type Member = NonNullable<ReturnType<typeof useGroupMembers>>['page'][number];
export function GroupMemberActions({
  groupId,
  member,
}: {
  groupId: Id<'groups'>;
  member: Member;
}) {
  const changeRole = useSetGroupMemberRole();
  const remove = useRemoveGroupMember();
  const ban = useBanGroupPerson();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = member.name ?? member.username ?? 'Groupi user';
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not update Group membership. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }
  function confirm(
    label: string,
    message: string,
    action: () => Promise<unknown>
  ) {
    showConfirmDialog({
      title: label,
      message,
      confirmLabel: label,
      destructive: true,
      onConfirm: () => perform(action),
    });
  }
  const target = { groupId, personId: member.personId };
  return (
    <View className='gap-2'>
      {member.canChangeRole ? (
        <Button
          variant='outline'
          disabled={busy}
          accessibilityState={{ disabled: busy, busy }}
          accessibilityLabel={`${member.role === 'MODERATOR' ? 'Demote' : 'Promote'} ${name}`}
          onPress={() => {
            const role = member.role === 'MODERATOR' ? 'MEMBER' : 'MODERATOR';
            if (role === 'MEMBER')
              confirm(
                'Demote moderator',
                `Make ${name} an ordinary member?`,
                () => changeRole({ ...target, role })
              );
            else void perform(() => changeRole({ ...target, role }));
          }}
        >
          {member.role === 'MODERATOR' ? 'Demote to member' : 'Make moderator'}
        </Button>
      ) : null}
      {member.canRemove ? (
        <Button
          variant='destructive'
          disabled={busy}
          accessibilityState={{ disabled: busy, busy }}
          accessibilityLabel={`Remove ${name}`}
          onPress={() =>
            confirm(
              'Remove member',
              `Remove ${name} from this Group? They may return through a future invitation allowed by the current policy.`,
              () => remove(target)
            )
          }
        >
          Remove member
        </Button>
      ) : null}
      {member.canBan ? (
        <Button
          variant='destructive'
          disabled={busy}
          accessibilityState={{ disabled: busy, busy }}
          accessibilityLabel={`Ban ${name}`}
          onPress={() =>
            confirm(
              'Ban from Group',
              `Ban ${name}? They cannot accept invitations or rejoin until a manager lifts the ban.`,
              () => ban(target)
            )
          }
        >
          Ban from Group
        </Button>
      ) : null}
      {busy ? (
        <Text className='text-muted-foreground'>Updating membership…</Text>
      ) : null}
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
