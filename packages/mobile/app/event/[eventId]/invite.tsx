import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export default function InviteScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [isCreating, setIsCreating] = useState(false);

  const invites = useQuery(api.invites.queries.getEventInvites, { eventId });
  const createInvite = useMutation(api.invites.mutations.createInvite);
  const deleteInvite = useMutation(api.invites.mutations.deleteInvites);

  // Friends available for event invites
  const friends = useQuery(api.eventInvites.queries.searchUsersForEventInvite, {
    eventId,
    searchTerm: '',
  });
  const sendEventInvite = useMutation(
    api.eventInvites.mutations.sendEventInvite
  );

  const isLoading = invites === undefined;

  async function handleCreateInvite() {
    setIsCreating(true);
    try {
      const result = await createInvite({ eventId });
      if (result?.token) {
        const url = `https://groupi.app/invite/${result.token}`;
        await Share.share({
          message: `Join my event on Groupi! ${url}`,
          url,
        });
      }
      toast.success('Invite link created');
    } catch {
      toast.error('Failed to create invite');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleShareExisting(token: string) {
    const url = `https://groupi.app/invite/${token}`;
    try {
      await Share.share({
        message: `Join my event on Groupi! ${url}`,
        url,
      });
    } catch {
      // User cancelled share
    }
  }

  async function handleSendEventInvite(inviteePersonId: string) {
    try {
      await sendEventInvite({ eventId, inviteePersonId, role: 'ATTENDEE' });
      toast.success('Invite sent!');
    } catch {
      toast.error('Failed to send invite');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>Invite</Text>
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </SafeAreaView>
    );
  }

  const inviteList = invites ?? [];

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>
          Invite People
        </Text>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        renderItem={() => null}
        ListHeaderComponent={
          <View className='px-4'>
            {/* Create invite link */}
            <View className='mb-6'>
              <Text className='mb-3 text-base font-semibold text-foreground'>
                Invite Link
              </Text>
              <Button
                onPress={handleCreateInvite}
                isLoading={isCreating}
                loadingText='Creating...'
                variant='outline'
              >
                Create Invite Link
              </Button>

              {/* Existing links */}
              {inviteList.length > 0 ? (
                <View className='mt-3 gap-2'>
                  {inviteList.map(
                    (invite: {
                      _id: string;
                      token: string;
                      uses?: number;
                      maxUses?: number;
                    }) => (
                      <View
                        key={invite._id}
                        className='flex-row items-center justify-between rounded-card border border-border bg-card p-3'
                      >
                        <View className='flex-1'>
                          <Text
                            className='text-sm text-muted-foreground'
                            numberOfLines={1}
                          >
                            ...{invite.token.slice(-8)}
                          </Text>
                          {invite.maxUses ? (
                            <Text className='text-xs text-muted-foreground'>
                              {invite.uses ?? 0}/{invite.maxUses} uses
                            </Text>
                          ) : null}
                        </View>
                        <View className='flex-row gap-2'>
                          <Pressable
                            onPress={() => handleShareExisting(invite.token)}
                            className='p-2'
                          >
                            <Ionicons
                              name='share-outline'
                              size={18}
                              color='#8b00b8'
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              showConfirmDialog({
                                title: 'Delete Invite',
                                message: 'This link will no longer work.',
                                confirmLabel: 'Delete',
                                destructive: true,
                                onConfirm: async () => {
                                  try {
                                    await deleteInvite({
                                      inviteIds: [invite._id],
                                    });
                                    toast.success('Invite deleted');
                                  } catch {
                                    toast.error('Failed to delete invite');
                                  }
                                },
                              });
                            }}
                            className='p-2'
                          >
                            <Ionicons
                              name='trash-outline'
                              size={18}
                              color='#ef4444'
                            />
                          </Pressable>
                        </View>
                      </View>
                    )
                  )}
                </View>
              ) : null}
            </View>

            {/* Invite friends directly */}
            <Text className='mb-3 text-base font-semibold text-foreground'>
              Invite Friends
            </Text>
            {friends === undefined ? (
              <ActivityIndicator />
            ) : friends.length === 0 ? (
              <Text className='text-sm text-muted-foreground'>
                No friends available to invite
              </Text>
            ) : (
              <View className='gap-2'>
                {friends.map(
                  (friend: {
                    personId: string;
                    name: string | null;
                    username: string | null;
                    image: string | null;
                    alreadyInvited?: boolean;
                    alreadyMember?: boolean;
                  }) => {
                    const disabled =
                      friend.alreadyInvited || friend.alreadyMember;
                    return (
                      <View
                        key={friend.personId}
                        className='flex-row items-center gap-3 rounded-card border border-border bg-card p-3'
                      >
                        <Avatar
                          src={friend.image}
                          name={friend.name}
                          size='sm'
                        />
                        <View className='flex-1'>
                          <Text className='text-base font-medium text-foreground'>
                            {friend.name ?? 'Unknown'}
                          </Text>
                          {friend.username ? (
                            <Text className='text-sm text-muted-foreground'>
                              @{friend.username}
                            </Text>
                          ) : null}
                        </View>
                        {disabled ? (
                          <Text className='text-sm text-muted-foreground'>
                            {friend.alreadyMember ? 'Member' : 'Invited'}
                          </Text>
                        ) : (
                          <Pressable
                            onPress={() =>
                              handleSendEventInvite(friend.personId)
                            }
                            className='rounded-button bg-primary px-3 py-1.5'
                          >
                            <Text className='text-sm font-medium text-primary-foreground'>
                              Invite
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  }
                )}
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
