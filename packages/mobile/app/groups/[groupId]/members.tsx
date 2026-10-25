import { useState } from 'react';
import { Image, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/button';
import type { Id } from 'convex/_generated/dataModel';
import { DetailScreenTemplate } from '@/components/templates/detail-screen-template';
import { Text } from '@/components/ui/text';
import { useGroup } from '@/hooks/use-groups';
import { useGroupMembers } from '@/hooks/use-group-invitations';
import { GroupMemberActions } from '@/components/groups/group-member-actions';
import { GroupPageControls } from '@/components/groups/group-page-controls';

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const id = groupId as Id<'groups'>;
  const group = useGroup(id);
  return (
    <DetailScreenTemplate title='Group members'>
      {group === undefined ? (
        <Text className='mt-4 text-muted-foreground'>Loading Group…</Text>
      ) : group ? (
        group.joiningQuestionnaire.canAccessMemberContent ||
        group.canManageMembers ? (
          <GroupRoster groupId={id} />
        ) : (
          <View className='gap-3'>
            <Text>
              Complete required onboarding before accessing Group member
              content.
            </Text>
            <Button
              accessibilityLabel='Complete required Group onboarding'
              onPress={() => router.push(`/groups/${id}/questionnaire`)}
            >
              Complete onboarding
            </Button>
          </View>
        )
      ) : (
        <Text className='mt-4 text-foreground'>
          Group membership is required to view members.
        </Text>
      )}
    </DetailScreenTemplate>
  );
}

function GroupRoster({ groupId }: { groupId: Id<'groups'> }) {
  const [cursor, setCursor] = useState<string | null>(null);
  const members = useGroupMembers(groupId, { numItems: 20, cursor });
  const roles = { OWNER: 'Owner', MODERATOR: 'Moderator', MEMBER: 'Member' };
  return (
    <View className='gap-4 pt-4'>
      {members === undefined ? (
        <Text className='text-muted-foreground'>Loading members…</Text>
      ) : members.page.length === 0 ? (
        <Text className='text-muted-foreground'>No members on this page.</Text>
      ) : (
        members.page.map(member => (
          <View
            key={member.personId}
            className='flex-row items-center gap-3 rounded-card border border-border p-4'
          >
            {member.image ? (
              <Image
                source={{ uri: member.image }}
                accessibilityLabel={`${member.name ?? member.username ?? 'Member'} avatar`}
                className='h-10 w-10 rounded-badge'
              />
            ) : null}
            <View className='flex-1 gap-1'>
              <Text className='font-semibold text-foreground'>
                {member.name ?? member.username ?? 'Groupi user'}
              </Text>
              {member.username ? (
                <Text className='text-muted-foreground'>{`@${member.username}`}</Text>
              ) : null}
              <Text className='text-muted-foreground'>
                {roles[member.role]}
              </Text>
              <GroupMemberActions groupId={groupId} member={member} />
            </View>
          </View>
        ))
      )}
      <GroupPageControls
        page={members}
        cursor={cursor}
        onPage={setCursor}
        label='Group members'
      />
    </View>
  );
}
