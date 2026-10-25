import { useState } from 'react';
import { Image, Switch, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGroup } from '@/hooks/use-groups';
import { useFriendSearch } from '@/hooks/use-friends';
import {
  useGroupInvites,
  useSendGroupInvite,
  useUpdateGroupInvitationPolicy,
} from '@/hooks/use-group-invitations';
import { GroupInvitationCard } from '@/components/groups/group-invitation-card';
import { GroupPageControls } from '@/components/groups/group-page-controls';

export default function GroupInvitationsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useGroup(groupId as Id<'groups'>);
  return (
    <DetailScreenTemplate title='Manage Group invitations'>
      {group === undefined ? (
        <Text className='mt-4 text-muted-foreground'>Loading Group…</Text>
      ) : group?.canManageInvitations ? (
        <ManagerInvitations group={group} />
      ) : (
        <Text className='mt-4 text-foreground'>
          You do not have permission to manage invitations for this Group.
        </Text>
      )}
    </DetailScreenTemplate>
  );
}

function ManagerInvitations({
  group,
}: {
  group: NonNullable<ReturnType<typeof useGroup>>;
}) {
  const [cursor, setCursor] = useState<string | null>(null);
  const invites = useGroupInvites(group._id, { numItems: 20, cursor });
  const sendInvite = useSendGroupInvite();
  const updatePolicy = useUpdateGroupInvitationPolicy();
  const [search, setSearch] = useState('');
  const { results, debouncedTerm } = useFriendSearch(
    search,
    group.invitationsEnabled
  );
  const [sending, setSending] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function send(inviteePersonId: Id<'persons'>) {
    setSending(true);
    setError('');
    setSent(false);
    try {
      await sendInvite({ groupId: group._id, inviteePersonId });
      setSent(true);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Recipient unavailable or invitation could not be sent.'
      );
    } finally {
      setSending(false);
    }
  }
  async function policy(invitationsEnabled: boolean) {
    setPolicySaving(true);
    setError('');
    try {
      await updatePolicy({ groupId: group._id, invitationsEnabled });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not update Group invitations.'
      );
    } finally {
      setPolicySaving(false);
    }
  }

  return (
    <View className='gap-4 pt-4'>
      {group.canManageRoles ? (
        <View className='flex-row items-center justify-between gap-3 rounded-card border border-border p-4'>
          <Text className='flex-1 font-semibold text-foreground'>
            Enable Group invitations
          </Text>
          <Switch
            accessibilityLabel='Enable Group invitations'
            value={group.invitationsEnabled}
            disabled={policySaving}
            onValueChange={policy}
          />
        </View>
      ) : null}
      {!group.invitationsEnabled ? (
        <Text className='text-muted-foreground'>
          Group invitations are disabled. Existing invitations cannot be
          accepted while invitations are disabled.
        </Text>
      ) : null}
      <Text className='text-muted-foreground'>
        Invite an existing Groupi user. Sharing the Group link does not invite
        anyone.
      </Text>
      <Input
        accessibilityLabel='Search existing Groupi users'
        placeholder='Search username (at least 3 characters)'
        value={search}
        onChangeText={setSearch}
        autoCapitalize='none'
        autoCorrect={false}
        editable={group.invitationsEnabled && !sending && !policySaving}
      />
      {group.invitationsEnabled && debouncedTerm.length >= 3 ? (
        results === undefined ? (
          <Text className='text-muted-foreground'>Searching…</Text>
        ) : results.length === 0 ? (
          <Text className='text-muted-foreground'>
            No matching users found.
          </Text>
        ) : (
          results.map(person => (
            <View
              key={person.personId}
              className='gap-2 rounded-card border border-border p-4'
            >
              <View className='flex-row items-center gap-3'>
                {person.image ? (
                  <Image
                    source={{ uri: person.image }}
                    accessibilityLabel={`${person.name ?? person.username ?? 'User'} avatar`}
                    className='h-10 w-10 rounded-badge'
                  />
                ) : null}
                <Text className='font-semibold text-foreground'>
                  {person.name ?? person.username ?? 'Groupi user'}
                </Text>
              </View>
              {person.username ? (
                <Text className='text-muted-foreground'>{`@${person.username}`}</Text>
              ) : null}
              <Button
                accessibilityLabel={`Invite ${person.name ?? person.username ?? 'Groupi user'} to ${group.name}`}
                onPress={() => send(person.personId)}
                disabled={sending || policySaving}
                isLoading={sending}
              >
                Send Group invitation
              </Button>
            </View>
          ))
        )
      ) : null}
      {sent ? (
        <Text accessibilityLiveRegion='polite' className='text-success'>
          Invitation sent.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole='alert' className='text-destructive'>
          {error}
        </Text>
      ) : null}
      <Text
        accessibilityRole='header'
        className='text-lg font-semibold text-foreground'
      >
        Invitation state
      </Text>
      {invites === undefined ? (
        <Text className='text-muted-foreground'>Loading invitations…</Text>
      ) : invites.page.length === 0 ? (
        <Text className='text-muted-foreground'>
          No invitations on this page.
        </Text>
      ) : (
        invites.page.map(invite => (
          <GroupInvitationCard key={invite.inviteId} invite={invite} manager />
        ))
      )}
      <GroupPageControls
        page={invites}
        cursor={cursor}
        onPage={setCursor}
        label='sent Group invitations'
      />
    </View>
  );
}
