import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useEventMembers, useCanManageEvent } from '@/hooks/use-events';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { BackButton } from '@/components/ui/back-button';
import { EmptyState } from '@/components/ui/empty-state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Member = any;

const ROLE_LABELS: Record<string, string> = {
  ORGANIZER: 'Organizer',
  MODERATOR: 'Moderator',
  ATTENDEE: 'Attendee',
};

const RSVP_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  YES: { icon: 'checkmark-circle', color: '#22c55e' },
  MAYBE: { icon: 'help-circle', color: '#f59e0b' },
  NO: { icon: 'close-circle', color: '#ef4444' },
  PENDING: { icon: 'time', color: '#6366f1' },
};

export default function AttendeesScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const membersData = useEventMembers(eventId as never);
  const permissions = useCanManageEvent(eventId as never);

  const members: Member[] = membersData?.members ?? membersData ?? [];
  const isLoading = membersData === undefined;

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>Members</Text>
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </SafeAreaView>
    );
  }

  // Sort: organizers first
  const roleOrder: Record<string, number> = {
    ORGANIZER: 0,
    MODERATOR: 1,
    ATTENDEE: 2,
  };
  const sorted = [...members].sort(
    (a: Member, b: Member) =>
      (roleOrder[a.membership?.role] ?? 3) -
      (roleOrder[b.membership?.role] ?? 3)
  );

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center justify-between px-4 py-3'>
        <View className='flex-row items-center'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Members ({members.length})
          </Text>
        </View>
        {permissions?.canManage ? (
          <Pressable
            onPress={() => router.push(`/event/${eventId}/invite`)}
            className='flex-row items-center gap-1 rounded-button bg-primary px-3 py-1.5'
          >
            <Ionicons name='person-add' size={16} color='#ffffff' />
            <Text className='text-sm font-medium text-primary-foreground'>
              Invite
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item: Member) => item.person?._id ?? item._id}
        renderItem={({ item }: { item: Member }) => {
          const name = item.user?.name ?? 'Unknown';
          const image = item.user?.image;
          const role = item.membership?.role ?? 'ATTENDEE';
          const rsvpStatus = item.membership?.rsvpStatus ?? 'PENDING';
          const rsvpInfo = RSVP_ICONS[rsvpStatus] ?? RSVP_ICONS.PENDING;

          return (
            <Pressable
              onPress={() => router.push(`/profile/${item.person?._id}`)}
              className='flex-row items-center gap-3 border-b border-border px-4 py-3'
            >
              <Avatar src={image} name={name} size='md' />
              <View className='flex-1'>
                <Text className='text-base font-medium text-foreground'>
                  {name}
                </Text>
                <Text className='text-sm text-muted-foreground'>
                  {ROLE_LABELS[role] ?? role}
                </Text>
              </View>
              <Ionicons name={rsvpInfo.icon} size={20} color={rsvpInfo.color} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon='people-outline'
            title='No members'
            description='Invite people to your event'
          />
        }
        contentContainerStyle={members.length === 0 ? { flex: 1 } : undefined}
      />
    </SafeAreaView>
  );
}
