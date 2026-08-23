import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { LoadingState } from '@/components/molecules';
import { useGlobalUser } from '@/context/global-user-context';
import { useActionMenu } from '@/components/ui/action-menu';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  useFriendshipStatus,
  useMutualFriends,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
  useBlockUser,
  useUnblockUser,
} from '@/hooks/use-friends';
import { useCreateReport } from '@/hooks/use-reports';

export default function ProfileScreen() {
  const { userId: personId } = useLocalSearchParams<{ userId: string }>();
  const typedPersonId = personId as Id<'persons'>;
  const { person: currentPerson } = useGlobalUser();
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  const profile = useQuery(api.users.queries.getUserProfile, {
    personId: typedPersonId,
  });
  const friendshipData = useFriendshipStatus(typedPersonId);
  // getMutualFriends expects a Better Auth userId string, not a personId
  const targetUserId = profile?.user.id;
  const mutualFriends = useMutualFriends(targetUserId);
  const isOwnProfile = currentPerson?._id === personId;
  const mutualEvents = useQuery(
    api.users.queries.fetchMutualEvents,
    !isOwnProfile ? { otherPersonId: typedPersonId } : 'skip'
  );

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const createReport = useCreateReport();
  const { showActionMenu } = useActionMenu();

  const isLoading = profile === undefined;

  function handleMoreActions() {
    showActionMenu({
      title: 'More Actions',
      options: [
        {
          label: 'Report User',
          onPress: () => {
            const reasons = [
              { label: 'Spam', value: 'SPAM' as const },
              { label: 'Harassment', value: 'HARASSMENT' as const },
              { label: 'Hate Speech', value: 'HATE_SPEECH' as const },
              {
                label: 'Inappropriate Content',
                value: 'INAPPROPRIATE_CONTENT' as const,
              },
              { label: 'Impersonation', value: 'IMPERSONATION' as const },
              { label: 'Other', value: 'OTHER' as const },
            ];
            showActionMenu({
              title: 'Report Reason',
              options: reasons.map(r => ({
                label: r.label,
                onPress: () =>
                  createReport({
                    targetType: 'USER',
                    targetId: typedPersonId,
                    reason: r.value,
                  }),
              })),
            });
          },
        },
        profile?.isBlockedByMe
          ? {
              label: 'Unblock User',
              onPress: () => unblockUser(typedPersonId),
            }
          : {
              label: 'Block User',
              destructive: true,
              onPress: () => {
                showConfirmDialog({
                  title: 'Block User',
                  message:
                    "This user will no longer be able to send you friend requests or invite you to events. You will also be removed from each other's friend lists.",
                  confirmLabel: 'Block',
                  destructive: true,
                  onConfirm: () => blockUser(typedPersonId),
                });
              },
            },
      ],
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
        </View>
        <View className='flex-1 items-center justify-center'>
          <Text className='text-base text-muted-foreground'>
            User not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = profile.user?.name ?? 'Unknown';
  const username = profile.user?.username;
  const image = profile.user?.image;
  const pronouns = profile.user.pronouns;
  const bio = profile.user.bio;

  const status = friendshipData?.status ?? 'none';
  const friendshipId = friendshipData?.friendshipId;

  const mutualFriendList = (mutualFriends ?? []).filter(
    (friend): friend is NonNullable<typeof friend> => friend !== null
  );
  const mutualEventList = mutualEvents ?? [];

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center justify-between px-4 py-3'>
        <BackButton />
        {!isOwnProfile ? (
          <Pressable
            onPress={handleMoreActions}
            accessibilityRole='button'
            accessibilityLabel='More profile actions'
            className='p-2'
          >
            <Ionicons name='ellipsis-horizontal' size={20} color={mutedColor} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerClassName='items-center px-6 pb-8'>
        <Avatar src={image} name={name} size='xl' />

        <Text className='mt-4 text-xl font-bold text-foreground'>{name}</Text>
        {username ? (
          <Text className='mt-1 text-base text-muted-foreground'>
            @{username}
          </Text>
        ) : null}
        {pronouns ? (
          <Text className='mt-1 text-sm text-muted-foreground'>{pronouns}</Text>
        ) : null}
        {bio ? (
          <Text className='mt-3 text-center text-base text-muted-foreground'>
            {bio}
          </Text>
        ) : null}

        {/* Friend action buttons */}
        {!isOwnProfile ? (
          <View className='mt-6 w-full gap-2'>
            {profile.isBlockedByMe ? (
              <Button
                variant='outline'
                onPress={() => unblockUser(typedPersonId)}
              >
                Unblock User
              </Button>
            ) : (status === 'none' || status === 'declined') &&
              profile.canSendFriendRequest ? (
              <Button onPress={() => sendRequest(typedPersonId)}>
                Add Friend
              </Button>
            ) : status === 'pending_sent' ? (
              <Button
                variant='outline'
                onPress={() => {
                  if (friendshipId) {
                    showConfirmDialog({
                      title: 'Cancel Request',
                      message: 'Cancel your friend request?',
                      confirmLabel: 'Cancel Request',
                      destructive: true,
                      onConfirm: () => cancelRequest(friendshipId),
                    });
                  }
                }}
              >
                Request Sent
              </Button>
            ) : status === 'pending_received' ? (
              <View className='flex-row gap-2'>
                <Button
                  className='flex-1'
                  onPress={() => {
                    if (friendshipId) acceptRequest(friendshipId);
                  }}
                >
                  Accept Request
                </Button>
                <Button
                  className='flex-1'
                  variant='outline'
                  onPress={() => {
                    if (friendshipId) declineRequest(friendshipId);
                  }}
                >
                  Decline
                </Button>
              </View>
            ) : status === 'friends' ? (
              <Button
                variant='secondary'
                onPress={() => {
                  if (friendshipId) {
                    showConfirmDialog({
                      title: 'Remove Friend',
                      message: `Remove ${name} from your friends?`,
                      confirmLabel: 'Remove',
                      destructive: true,
                      onConfirm: () => removeFriend(friendshipId),
                    });
                  }
                }}
              >
                Friends
              </Button>
            ) : null}
          </View>
        ) : null}

        {/* Mutual Friends */}
        {!isOwnProfile && mutualFriendList.length > 0 ? (
          <View className='mt-6 w-full'>
            <Text className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              Mutual Friends ({mutualFriendList.length})
            </Text>
            <View className='mt-2 gap-2'>
              {mutualFriendList.slice(0, 5).map(friend => (
                <Pressable
                  key={friend.personId}
                  onPress={() => router.push(`/profile/${friend.personId}`)}
                  className='flex-row items-center gap-3 rounded-card border border-border px-3 py-2'
                >
                  <Avatar src={friend.image} name={friend.name} size='sm' />
                  <Text className='text-sm font-medium text-foreground'>
                    {friend.name ?? 'Unknown'}
                  </Text>
                </Pressable>
              ))}
              {mutualFriendList.length > 5 ? (
                <Text className='text-center text-xs text-muted-foreground'>
                  +{mutualFriendList.length - 5} more
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Mutual Events */}
        {!isOwnProfile && mutualEventList.length > 0 ? (
          <View className='mt-6 w-full'>
            <Text className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
              Mutual Events ({mutualEventList.length})
            </Text>
            <View className='mt-2 gap-2'>
              {mutualEventList.slice(0, 5).map(item => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/event/${item.id}`)}
                  className='rounded-card border border-border px-3 py-2'
                >
                  <Text className='text-sm font-medium text-foreground'>
                    {item.title}
                  </Text>
                  {item.location ? (
                    <View className='mt-0.5 flex-row items-center gap-1'>
                      <Ionicons
                        name='location-outline'
                        size={12}
                        color={mutedColor}
                      />
                      <Text className='text-xs text-muted-foreground'>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
              {mutualEventList.length > 5 ? (
                <Text className='text-center text-xs text-muted-foreground'>
                  +{mutualEventList.length - 5} more
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
