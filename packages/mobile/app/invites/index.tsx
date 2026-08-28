import { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCSSVariable } from 'uniwind';
import type { Id } from 'convex/_generated/dataModel';

import { DetailScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { Timestamp } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { MemberAvatar } from '@/components/members/member-avatar';
import { Button } from '@/components/ui/button';
import {
  usePendingEventInvites,
  useAcceptEventInvite,
  useDeclineEventInvite,
} from '@/hooks/use-event-invites';

export default function InvitesScreen() {
  const invites = usePendingEventInvites();
  const acceptInvite = useAcceptEventInvite();
  const declineInvite = useDeclineEventInvite();
  const [processingInviteId, setProcessingInviteId] =
    useState<Id<'eventInvites'> | null>(null);
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  async function handleAccept(
    inviteId: Id<'eventInvites'>,
    eventId: Id<'events'>
  ) {
    setProcessingInviteId(inviteId);
    try {
      await acceptInvite(inviteId);
      router.replace(`/event/${eventId}`);
    } catch {
      // The hook presents the failure toast.
    } finally {
      setProcessingInviteId(null);
    }
  }

  async function handleDecline(inviteId: Id<'eventInvites'>) {
    setProcessingInviteId(inviteId);
    try {
      await declineInvite(inviteId);
    } catch {
      // The hook presents the failure toast.
    } finally {
      setProcessingInviteId(null);
    }
  }

  if (invites === undefined) {
    return (
      <DetailScreenTemplate title='Event Invites' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const pendingInvites = invites.filter(
    (invite): invite is NonNullable<typeof invite> => invite !== null
  );

  return (
    <DetailScreenTemplate title='Event Invites' scrollable={false}>
      <FlatList
        data={pendingInvites}
        keyExtractor={item => item.inviteId}
        className='px-4'
        contentContainerStyle={
          pendingInvites.length === 0 ? { flex: 1 } : undefined
        }
        renderItem={({ item }) => (
          <View className='mb-3 rounded-card border border-border bg-card p-4'>
            <View className='flex-row items-start gap-3'>
              <MemberAvatar
                personId={item.inviter.personId}
                src={item.inviter.image}
                name={item.inviter.name}
                size='md'
              />
              <View className='flex-1'>
                <Text className='text-base font-semibold text-foreground'>
                  {item.eventTitle}
                </Text>
                {item.inviter.name ? (
                  <Text className='text-sm text-muted-foreground'>
                    Invited by {item.inviter.name}
                  </Text>
                ) : null}
                {item.eventLocation ? (
                  <View className='mt-1 flex-row items-center gap-1'>
                    <Ionicons
                      name='location-outline'
                      size={12}
                      color={mutedColor}
                    />
                    <Text className='text-xs text-muted-foreground'>
                      {item.eventLocation}
                    </Text>
                  </View>
                ) : null}
                <Text className='mt-1 text-xs text-muted-foreground'>
                  Invited as{' '}
                  {item.role === 'MODERATOR' ? 'moderator' : 'attendee'}
                </Text>
                {item.message ? (
                  <Text className='mt-2 text-sm text-foreground/80'>
                    &ldquo;{item.message}&rdquo;
                  </Text>
                ) : null}
                <Timestamp time={item.createdAt} className='mt-1' />
              </View>
            </View>

            <View className='mt-3 flex-row gap-2'>
              <View className='flex-1'>
                <Button
                  onPress={() => handleAccept(item.inviteId, item.eventId)}
                  size='sm'
                  isLoading={processingInviteId === item.inviteId}
                  loadingText='Accepting…'
                  disabled={processingInviteId !== null}
                  accessibilityLabel={`Accept invite to ${item.eventTitle}`}
                >
                  Accept
                </Button>
              </View>
              <View className='flex-1'>
                <Button
                  variant='outline'
                  onPress={() => handleDecline(item.inviteId)}
                  size='sm'
                  disabled={processingInviteId !== null}
                  accessibilityLabel={`Decline invite to ${item.eventTitle}`}
                >
                  Decline
                </Button>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon='mail-outline'
            title='No pending invites'
            description='Event invitations will appear here'
          />
        }
      />
    </DetailScreenTemplate>
  );
}
