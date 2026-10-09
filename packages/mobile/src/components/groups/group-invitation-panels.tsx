import { useState } from 'react';
import type { Id } from 'convex/_generated/dataModel';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  useMyGroupInvites,
  useMyGroupInviteForGroup,
} from '@/hooks/use-group-invitations';
import { GroupInvitationCard } from './group-invitation-card';
import { GroupPageControls } from './group-page-controls';

export function GroupInviteInbox() {
  const [cursor, setCursor] = useState<string | null>(null);
  const invites = useMyGroupInvites({ numItems: 20, cursor });
  return (
    <View className='gap-4 pt-4'>
      <Text className='text-muted-foreground'>
        Invitations sent to you. Accepting joins the Group only.
      </Text>
      {invites === undefined ? (
        <Text className='text-muted-foreground'>
          Loading Group invitations…
        </Text>
      ) : invites.page.length === 0 ? (
        <Text className='text-muted-foreground'>
          No Group invitations on this page.
        </Text>
      ) : (
        invites.page.map(invite => (
          <GroupInvitationCard key={invite.inviteId} invite={invite} />
        ))
      )}
      <GroupPageControls
        page={invites}
        cursor={cursor}
        onPage={setCursor}
        label='Group invitations'
      />
    </View>
  );
}

export function GroupLandingInvitation({ groupId }: { groupId: Id<'groups'> }) {
  const invite = useMyGroupInviteForGroup(groupId);
  return (
    <View className='gap-3'>
      <Text className='text-muted-foreground'>
        Sharing this link does not invite or join anyone.
      </Text>
      {invite === undefined ? (
        <Text className='text-muted-foreground'>Loading your invitation…</Text>
      ) : invite ? (
        <GroupInvitationCard invite={invite} />
      ) : (
        <Text className='text-muted-foreground'>
          You have no invitation to this Group.
        </Text>
      )}
    </View>
  );
}
