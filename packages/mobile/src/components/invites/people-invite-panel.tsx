import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import type { Id } from 'convex/_generated/dataModel';

import { MemberAvatar } from '@/components/members/member-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { LabeledTextarea } from '@/components/ui/labeled-textarea';
import { Text } from '@/components/ui/text';
import {
  useCancelEventInvite,
  useEventInviteSearch,
  useSendEventInvite,
} from '@/hooks/use-event-invites';
import {
  InvitePanelScrollView,
  InviteSectionIntro,
} from './invite-panel-shell';
import type { EventMembers, Friend, SentInvite } from './invite-types';
import { formatInviteDate } from './invite-utils';

const MAX_PERSONAL_MESSAGE_LENGTH = 280;

interface SelectablePerson {
  personId: Id<'persons'>;
  name: string | null;
  username: string | null;
  image: string | null;
}

export function PeopleInvitePanel({
  eventId,
  canInviteModerator,
  sentInvites,
  friends,
  eventMembers,
}: {
  eventId: Id<'events'>;
  canInviteModerator: boolean;
  sentInvites: SentInvite[] | undefined;
  friends: Friend[] | undefined;
  eventMembers: EventMembers | undefined;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<SelectablePerson>();
  const [role, setRole] = useState<'ATTENDEE' | 'MODERATOR'>('ATTENDEE');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { results, debouncedTerm, isLoading } = useEventInviteSearch(
    eventId,
    searchTerm
  );
  const sendEventInvite = useSendEventInvite();
  const cancelEventInvite = useCancelEventInvite();
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  const pendingInvites = useMemo(
    () => sentInvites?.filter(invite => invite.status === 'PENDING') ?? [],
    [sentInvites]
  );
  const pendingPersonIds = useMemo(
    () => new Set(pendingInvites.map(invite => invite.invitee.personId)),
    [pendingInvites]
  );
  const memberPersonIds = useMemo(
    () =>
      new Set(
        eventMembers?.event.memberships.map(member => member.personId) ?? []
      ),
    [eventMembers]
  );
  const inviteableFriends =
    friends?.filter(
      friend =>
        !memberPersonIds.has(friend.personId) &&
        !pendingPersonIds.has(friend.personId)
    ) ?? [];

  function selectPerson(person: SelectablePerson) {
    setSelectedPerson(person);
    setSearchTerm('');
  }

  function clearSelection() {
    setSelectedPerson(undefined);
    setRole('ATTENDEE');
    setMessage('');
  }

  async function handleSend() {
    if (!selectedPerson || message.length > MAX_PERSONAL_MESSAGE_LENGTH) return;
    setIsSending(true);
    try {
      await sendEventInvite({
        eventId,
        inviteePersonId: selectedPerson.personId,
        role: canInviteModerator ? role : 'ATTENDEE',
        message: message.trim() || undefined,
      });
      clearSelection();
    } catch {
      // The hook presents the failure toast.
    } finally {
      setIsSending(false);
    }
  }

  function confirmCancel(invite: SentInvite) {
    const name =
      invite.invitee.name ?? invite.invitee.username ?? 'this person';
    showConfirmDialog({
      title: 'Cancel Invite',
      message: `Cancel the pending invite for ${name}?`,
      confirmLabel: 'Cancel Invite',
      destructive: true,
      onConfirm: async () => {
        try {
          await cancelEventInvite(invite.inviteId);
        } catch {
          // The hook presents the failure toast.
        }
      },
    });
  }

  return (
    <InvitePanelScrollView>
      <InviteSectionIntro
        icon='person-add-outline'
        title='Invite a Groupi member'
        description='Choose a friend or search by username, then add their role and a personal note.'
      />

      {selectedPerson ? (
        <Card className='gap-4'>
          <View className='flex-row items-center gap-3'>
            <MemberAvatar
              personId={selectedPerson.personId}
              src={selectedPerson.image}
              name={selectedPerson.name ?? selectedPerson.username}
              size='md'
            />
            <View className='flex-1'>
              <Text className='font-semibold text-foreground'>
                {selectedPerson.name ?? selectedPerson.username ?? 'Unknown'}
              </Text>
              {selectedPerson.username ? (
                <Text className='text-sm text-muted-foreground'>
                  @{selectedPerson.username}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={clearSelection}
              accessibilityRole='button'
              accessibilityLabel='Choose someone else'
              className='size-11 items-center justify-center rounded-full active:bg-muted'
            >
              <Ionicons name='close' size={22} color={mutedColor} />
            </Pressable>
          </View>

          {canInviteModerator ? (
            <View className='gap-2'>
              <Text className='text-sm font-medium text-foreground'>
                Invite as
              </Text>
              <View className='flex-row gap-2'>
                {(['ATTENDEE', 'MODERATOR'] as const).map(option => {
                  const selected = role === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setRole(option)}
                      accessibilityRole='radio'
                      accessibilityState={{ checked: selected }}
                      className={
                        selected
                          ? 'min-h-[44px] flex-1 items-center justify-center rounded-button border border-primary bg-primary/10 px-3'
                          : 'min-h-[44px] flex-1 items-center justify-center rounded-button border border-border px-3'
                      }
                    >
                      <Text
                        className={
                          selected
                            ? 'text-sm font-semibold text-primary'
                            : 'text-sm font-medium text-foreground'
                        }
                      >
                        {option === 'ATTENDEE' ? 'Attendee' : 'Moderator'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <LabeledTextarea
            label='Personal message (optional)'
            placeholder='Add a note to the invitation…'
            value={message}
            onChangeText={setMessage}
            maxLength={MAX_PERSONAL_MESSAGE_LENGTH}
            numberOfLines={4}
          />
          <Button
            onPress={handleSend}
            isLoading={isSending}
            loadingText='Sending…'
          >
            <Ionicons name='send-outline' size={18} />
            <Text>Send Invite</Text>
          </Button>
        </Card>
      ) : (
        <>
          {inviteableFriends.length > 0 ? (
            <View className='gap-2'>
              <Text className='text-base font-semibold text-foreground'>
                Your friends
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName='gap-3 pr-4'
              >
                {inviteableFriends.map(friend => (
                  <Pressable
                    key={friend.personId}
                    onPress={() => selectPerson(friend)}
                    accessibilityRole='button'
                    accessibilityLabel={`Invite ${friend.name ?? friend.username ?? 'friend'}`}
                    className='w-24 items-center gap-2 rounded-card border border-border bg-card p-3 active:bg-muted'
                  >
                    <MemberAvatar
                      personId={friend.personId}
                      src={friend.image}
                      name={friend.name ?? friend.username}
                      size='md'
                    />
                    <Text
                      className='text-center text-xs font-medium text-foreground'
                      numberOfLines={2}
                    >
                      {friend.name ?? friend.username ?? 'Friend'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View className='gap-2'>
            <Text className='text-base font-semibold text-foreground'>
              Search by username
            </Text>
            <View className='relative'>
              <View className='absolute left-3 top-0 z-float h-10 justify-center'>
                <Ionicons name='search' size={18} color={mutedColor} />
              </View>
              <Input
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder='Enter at least two characters'
                accessibilityLabel='Search people by username'
                autoCapitalize='none'
                autoCorrect={false}
                returnKeyType='search'
                className='pl-10'
              />
            </View>

            {debouncedTerm.length < 2 ? (
              <Text className='text-sm text-muted-foreground'>
                Search finds eligible Groupi members who are not already in the
                event.
              </Text>
            ) : isLoading && results === undefined ? (
              <View className='flex-row items-center gap-2 py-3'>
                <ActivityIndicator color={primaryColor} />
                <Text className='text-sm text-muted-foreground'>
                  Searching…
                </Text>
              </View>
            ) : results?.length === 0 ? (
              <View className='items-center rounded-card border border-dashed border-border p-6'>
                <Text className='font-medium text-foreground'>
                  No eligible members found
                </Text>
                <Text className='mt-1 text-center text-sm text-muted-foreground'>
                  Check the username or try a different search.
                </Text>
              </View>
            ) : (
              <View className='gap-2'>
                {results?.map(person => (
                  <Pressable
                    key={person.personId}
                    onPress={() => {
                      if (!person.hasPendingInvite) selectPerson(person);
                    }}
                    disabled={person.hasPendingInvite}
                    accessibilityRole='button'
                    accessibilityState={{ disabled: person.hasPendingInvite }}
                    accessibilityLabel={`${person.name ?? person.username ?? 'Member'}${person.hasPendingInvite ? ', invitation pending' : ''}`}
                    className='min-h-[64px] flex-row items-center gap-3 rounded-card border border-border bg-card p-3 active:bg-muted disabled:opacity-60'
                  >
                    <MemberAvatar
                      personId={person.personId}
                      src={person.image}
                      name={person.name ?? person.username}
                      size='sm'
                    />
                    <View className='flex-1'>
                      <Text className='font-medium text-foreground'>
                        {person.name ?? person.username ?? 'Unknown'}
                      </Text>
                      {person.username ? (
                        <Text className='text-sm text-muted-foreground'>
                          @{person.username}
                        </Text>
                      ) : null}
                    </View>
                    {person.hasPendingInvite ? (
                      <Badge variant='warning'>
                        <Text>Pending</Text>
                      </Badge>
                    ) : person.isFriend ? (
                      <Badge variant='secondary'>
                        <Text>Friend</Text>
                      </Badge>
                    ) : (
                      <Ionicons
                        name='chevron-forward'
                        size={18}
                        color={mutedColor}
                      />
                    )}
                  </Pressable>
                ))}
                {isLoading ? (
                  <Text className='text-sm text-muted-foreground'>
                    Finding more matches…
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </>
      )}

      <PendingPeopleInvites invites={pendingInvites} onCancel={confirmCancel} />
    </InvitePanelScrollView>
  );
}

function PendingPeopleInvites({
  invites,
  onCancel,
}: {
  invites: SentInvite[];
  onCancel: (invite: SentInvite) => void;
}) {
  if (invites.length === 0) return null;

  return (
    <View className='gap-2'>
      <View className='flex-row items-center gap-2'>
        <Text className='text-base font-semibold text-foreground'>
          Pending invites
        </Text>
        <Badge variant='secondary'>
          <Text>{invites.length}</Text>
        </Badge>
      </View>
      {invites.map(invite => (
        <Card
          key={invite.inviteId}
          className='flex-row items-center gap-3 py-3'
        >
          <MemberAvatar
            personId={invite.invitee.personId}
            src={invite.invitee.image}
            name={invite.invitee.name ?? invite.invitee.username}
            size='sm'
          />
          <View className='flex-1'>
            <Text className='font-medium text-foreground' numberOfLines={1}>
              {invite.invitee.name ?? invite.invitee.username ?? 'Unknown'}
            </Text>
            <Text className='text-xs text-muted-foreground'>
              {invite.role === 'MODERATOR' ? 'Moderator' : 'Attendee'} · Sent{' '}
              {formatInviteDate(invite.createdAt)}
            </Text>
          </View>
          <Button
            variant='ghost'
            size='sm'
            onPress={() => onCancel(invite)}
            accessibilityLabel={`Cancel invite for ${invite.invitee.name ?? invite.invitee.username ?? 'member'}`}
          >
            Cancel
          </Button>
        </Card>
      ))}
    </View>
  );
}
