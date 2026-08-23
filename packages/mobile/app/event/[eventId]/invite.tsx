import { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@groupi/shared/platform';
import {
  useCancelEventInvite,
  useEventInviteSearch,
  useSendEventInvite,
} from '@/hooks/use-event-invites';
import { getPublicInviteUrl } from '@/lib/public-urls';

export default function InviteScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const typedEventId = eventId as Id<'events'>;
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteRole, setInviteRole] = useState<'ATTENDEE' | 'MODERATOR'>(
    'ATTENDEE'
  );
  const [sendingPersonId, setSendingPersonId] = useState<Id<'persons'> | null>(
    null
  );
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const errorColor = String(useCSSVariable('--color-error') ?? 'transparent');

  const invites = useQuery(api.invites.queries.getEventInvites, {
    eventId: typedEventId,
  });
  const eventHeader = useQuery(api.events.queries.getEventHeader, {
    eventId: typedEventId,
  });
  const createInvite = useMutation(api.invites.mutations.createInvite);
  const deleteInvite = useMutation(api.invites.mutations.deleteInvites);
  const { results: friends, debouncedTerm } = useEventInviteSearch(
    typedEventId,
    searchTerm
  );
  const sendEventInvite = useSendEventInvite();
  const cancelEventInvite = useCancelEventInvite();

  const isLoading = invites === undefined;
  const canInviteModerator = eventHeader?.userMembership.role === 'ORGANIZER';

  async function handleCreateInvite() {
    setIsCreating(true);
    try {
      const result = await createInvite({ eventId: typedEventId });
      if (result.invite.token) {
        const url = getPublicInviteUrl(result.invite.token);
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
    const url = getPublicInviteUrl(token);
    try {
      await Share.share({
        message: `Join my event on Groupi! ${url}`,
        url,
      });
    } catch {
      // User cancelled share
    }
  }

  async function handleSendEventInvite(inviteePersonId: Id<'persons'>) {
    setSendingPersonId(inviteePersonId);
    try {
      await sendEventInvite({
        eventId: typedEventId,
        inviteePersonId,
        role: canInviteModerator ? inviteRole : 'ATTENDEE',
      });
    } catch {
      // The hook presents the failure toast.
    } finally {
      setSendingPersonId(null);
    }
  }

  function handleCancelEventInvite(inviteId: Id<'eventInvites'>, name: string) {
    showConfirmDialog({
      title: 'Cancel Invite',
      message: `Cancel the pending invite for ${name}?`,
      confirmLabel: 'Cancel Invite',
      destructive: true,
      onConfirm: async () => {
        try {
          await cancelEventInvite(inviteId);
        } catch {
          // The hook presents the failure toast.
        }
      },
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>Invite</Text>
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color={primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  const inviteList = invites.invites;

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>
          Invite People
        </Text>
      </View>

      <ScrollView contentContainerClassName='px-4 pb-8'>
        <View>
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
                {inviteList.map(invite => (
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
                      {invite.name ? (
                        <Text className='text-sm font-medium text-foreground'>
                          {invite.name}
                        </Text>
                      ) : null}
                      {invite.usesTotal !== undefined ? (
                        <Text className='text-xs text-muted-foreground'>
                          {invite.usesRemaining ?? 0} of {invite.usesTotal} uses
                          remaining
                        </Text>
                      ) : null}
                    </View>
                    <View className='flex-row gap-2'>
                      <Pressable
                        onPress={() => handleShareExisting(invite.token)}
                        accessibilityRole='button'
                        accessibilityLabel='Share invite link'
                        className='p-2'
                      >
                        <Ionicons
                          name='share-outline'
                          size={18}
                          color={primaryColor}
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
                        accessibilityRole='button'
                        accessibilityLabel='Delete invite link'
                        className='p-2'
                      >
                        <Ionicons
                          name='trash-outline'
                          size={18}
                          color={errorColor}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* Invite people directly */}
          <Text className='mb-3 text-base font-semibold text-foreground'>
            Invite by Username
          </Text>
          <Input
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder='Search username'
            accessibilityLabel='Search people by username'
            autoCapitalize='none'
            autoCorrect={false}
            returnKeyType='search'
          />

          {canInviteModerator ? (
            <View className='mt-3 flex-row gap-2'>
              <Pressable
                onPress={() => setInviteRole('ATTENDEE')}
                accessibilityRole='radio'
                accessibilityState={{ checked: inviteRole === 'ATTENDEE' }}
                className={
                  inviteRole === 'ATTENDEE'
                    ? 'flex-1 items-center rounded-button border border-primary bg-primary/10 px-3 py-2'
                    : 'flex-1 items-center rounded-button border border-border px-3 py-2'
                }
              >
                <Text className='text-sm font-medium text-foreground'>
                  Attendee
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInviteRole('MODERATOR')}
                accessibilityRole='radio'
                accessibilityState={{ checked: inviteRole === 'MODERATOR' }}
                className={
                  inviteRole === 'MODERATOR'
                    ? 'flex-1 items-center rounded-button border border-primary bg-primary/10 px-3 py-2'
                    : 'flex-1 items-center rounded-button border border-border px-3 py-2'
                }
              >
                <Text className='text-sm font-medium text-foreground'>
                  Moderator
                </Text>
              </Pressable>
            </View>
          ) : null}

          {debouncedTerm.length < 2 ? (
            <Text className='mt-2 text-sm text-muted-foreground'>
              Enter at least two characters to search.
            </Text>
          ) : friends === undefined ? (
            <ActivityIndicator className='mt-4' color={primaryColor} />
          ) : friends.length === 0 ? (
            <Text className='mt-3 text-sm text-muted-foreground'>
              No eligible users found.
            </Text>
          ) : (
            <View className='mt-3 gap-2'>
              {friends.map(friend => {
                const hasPendingInvite =
                  friend.hasPendingInvite && friend.pendingInviteId;
                return (
                  <View
                    key={friend.personId}
                    className='flex-row items-center gap-3 rounded-card border border-border bg-card p-3'
                  >
                    <Avatar src={friend.image} name={friend.name} size='sm' />
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
                    {hasPendingInvite ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onPress={() =>
                          handleCancelEventInvite(
                            friend.pendingInviteId!,
                            friend.name ?? friend.username ?? 'this user'
                          )
                        }
                        accessibilityLabel={`Cancel invite for ${friend.name ?? friend.username ?? 'user'}`}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        onPress={() => handleSendEventInvite(friend.personId)}
                        size='sm'
                        isLoading={sendingPersonId === friend.personId}
                        loadingText='Sending…'
                        disabled={sendingPersonId !== null}
                        accessibilityLabel={`Invite ${friend.name ?? friend.username ?? 'user'} as ${inviteRole.toLowerCase()}`}
                      >
                        Invite
                      </Button>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
