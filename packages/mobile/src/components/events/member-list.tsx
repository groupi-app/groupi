import { View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { SectionHeader } from '@/components/ui/section-header';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MembersData = any;

interface MemberListProps {
  members: MembersData;
  eventId: string;
  canManage: boolean;
}

export function MemberList({ members, eventId, canManage }: MemberListProps) {
  const memberList: {
    person: { _id: string; bio?: string };
    user: { name: string; image?: string };
    membership: { role: string };
  }[] = members?.members ?? members ?? [];

  if (!Array.isArray(memberList) || memberList.length === 0) return null;

  // Sort: organizers first, then moderators, then attendees
  const roleOrder: Record<string, number> = {
    ORGANIZER: 0,
    MODERATOR: 1,
    ATTENDEE: 2,
  };
  const sorted = [...memberList].sort(
    (a, b) =>
      (roleOrder[a.membership.role] ?? 3) - (roleOrder[b.membership.role] ?? 3)
  );

  return (
    <View className='mt-4'>
      <SectionHeader
        title='Members'
        count={memberList.length}
        actionLabel='View All'
        onAction={() => router.push(`/event/${eventId}/attendees`)}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className='px-4'
        contentContainerClassName='gap-3 py-2'
      >
        {sorted.slice(0, 15).map(member => (
          <Pressable
            key={member.person._id}
            onPress={() => router.push(`/profile/${member.person._id}`)}
          >
            <Avatar
              src={member.user?.image}
              name={member.user?.name}
              size='lg'
            />
          </Pressable>
        ))}
        {canManage ? (
          <Pressable
            onPress={() => router.push(`/event/${eventId}/invite`)}
            className='h-14 w-14 items-center justify-center rounded-full border border-dashed border-border'
          >
            <Ionicons name='add' size={24} color='#9ca3af' />
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
