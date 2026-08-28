import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { SettingsScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { MemberAvatar } from '@/components/members/member-avatar';
import { Button } from '@/components/ui/button';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  usePrivacySettings,
  useSavePrivacySettings,
} from '@/hooks/use-settings';
import { useBlockedUsers, useUnblockUser } from '@/hooks/use-friends';

type FriendRequestOption = 'EVERYONE' | 'EVENT_MEMBERS' | 'NO_ONE';
type EventInviteOption = 'EVERYONE' | 'EVENT_MEMBERS' | 'FRIENDS' | 'NO_ONE';

const FRIEND_REQUEST_OPTIONS: {
  value: FriendRequestOption;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'EVERYONE',
    label: 'Everyone',
    description: 'Anyone can send you friend requests',
    icon: 'globe-outline',
  },
  {
    value: 'EVENT_MEMBERS',
    label: 'Event Members',
    description: 'Only people who share an event with you',
    icon: 'people-outline',
  },
  {
    value: 'NO_ONE',
    label: 'No One',
    description: 'Nobody can send you friend requests',
    icon: 'ban-outline',
  },
];

const EVENT_INVITE_OPTIONS: {
  value: EventInviteOption;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'EVERYONE',
    label: 'Everyone',
    description: 'Anyone can invite you to events',
    icon: 'globe-outline',
  },
  {
    value: 'EVENT_MEMBERS',
    label: 'Event Members',
    description: 'Only people who share an event with you',
    icon: 'people-outline',
  },
  {
    value: 'FRIENDS',
    label: 'Friends',
    description: 'Only your friends can invite you',
    icon: 'heart-outline',
  },
  {
    value: 'NO_ONE',
    label: 'No One',
    description: 'Nobody can invite you to events',
    icon: 'ban-outline',
  },
];

export default function PrivacySettingsScreen() {
  const settings = usePrivacySettings();
  const saveSettings = useSavePrivacySettings();
  const blockedUsers = useBlockedUsers();
  const unblockUser = useUnblockUser();

  const [friendRequestsOverride, setFriendRequestsOverride] =
    useState<FriendRequestOption | null>(null);
  const [eventInvitesOverride, setEventInvitesOverride] =
    useState<EventInviteOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );

  const friendRequestsFrom =
    friendRequestsOverride ??
    (settings?.allowFriendRequestsFrom as FriendRequestOption | undefined) ??
    'EVERYONE';
  const eventInvitesFrom =
    eventInvitesOverride ??
    (settings?.allowEventInvitesFrom as EventInviteOption | undefined) ??
    'EVERYONE';

  async function handleSaveFriendRequests(value: FriendRequestOption) {
    if (isSaving) return;
    const previous = friendRequestsOverride;
    setFriendRequestsOverride(value);
    setIsSaving(true);
    const saved = await saveSettings({
      allowFriendRequestsFrom: value,
      allowEventInvitesFrom: eventInvitesFrom,
    });
    if (!saved) setFriendRequestsOverride(previous);
    setIsSaving(false);
  }

  async function handleSaveEventInvites(value: EventInviteOption) {
    if (isSaving) return;
    const previous = eventInvitesOverride;
    setEventInvitesOverride(value);
    setIsSaving(true);
    const saved = await saveSettings({
      allowFriendRequestsFrom: friendRequestsFrom,
      allowEventInvitesFrom: value,
    });
    if (!saved) setEventInvitesOverride(previous);
    setIsSaving(false);
  }

  if (settings === undefined) {
    return (
      <SettingsScreenTemplate title='Privacy'>
        <LoadingState />
      </SettingsScreenTemplate>
    );
  }

  return (
    <SettingsScreenTemplate
      title='Privacy'
      description='Control who can interact with you'
    >
      {/* Friend Requests */}
      <View className='mb-6'>
        <Text className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
          Friend Requests
        </Text>
        <Text className='mb-3 text-sm text-muted-foreground'>
          Who can send you friend requests?
        </Text>
        <View className='rounded-card border border-border overflow-hidden'>
          {FRIEND_REQUEST_OPTIONS.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => void handleSaveFriendRequests(option.value)}
              disabled={isSaving}
              accessibilityRole='radio'
              accessibilityState={{
                checked: friendRequestsFrom === option.value,
                disabled: isSaving,
                busy: isSaving,
              }}
              className={`flex-row items-center justify-between px-4 py-3 ${
                index < FRIEND_REQUEST_OPTIONS.length - 1
                  ? 'border-b border-border'
                  : ''
              }`}
            >
              <View className='h-9 w-9 items-center justify-center rounded-badge bg-muted'>
                <Ionicons name={option.icon} size={18} color={primaryColor} />
              </View>
              <View className='flex-1 px-3'>
                <Text className='text-base font-medium text-foreground'>
                  {option.label}
                </Text>
                <Text className='text-sm text-muted-foreground'>
                  {option.description}
                </Text>
              </View>
              {friendRequestsFrom === option.value ? (
                <Ionicons
                  name='checkmark-circle'
                  size={22}
                  color={primaryColor}
                />
              ) : (
                <View className='h-[22px] w-[22px] rounded-full border-2 border-border' />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Event Invites */}
      <View className='mb-6'>
        <Text className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
          Event Invites
        </Text>
        <Text className='mb-3 text-sm text-muted-foreground'>
          Who can invite you to events?
        </Text>
        <View className='rounded-card border border-border overflow-hidden'>
          {EVENT_INVITE_OPTIONS.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => void handleSaveEventInvites(option.value)}
              disabled={isSaving}
              accessibilityRole='radio'
              accessibilityState={{
                checked: eventInvitesFrom === option.value,
                disabled: isSaving,
                busy: isSaving,
              }}
              className={`flex-row items-center justify-between px-4 py-3 ${
                index < EVENT_INVITE_OPTIONS.length - 1
                  ? 'border-b border-border'
                  : ''
              }`}
            >
              <View className='h-9 w-9 items-center justify-center rounded-badge bg-muted'>
                <Ionicons name={option.icon} size={18} color={primaryColor} />
              </View>
              <View className='flex-1 px-3'>
                <Text className='text-base font-medium text-foreground'>
                  {option.label}
                </Text>
                <Text className='text-sm text-muted-foreground'>
                  {option.description}
                </Text>
              </View>
              {eventInvitesFrom === option.value ? (
                <Ionicons
                  name='checkmark-circle'
                  size={22}
                  color={primaryColor}
                />
              ) : (
                <View className='h-[22px] w-[22px] rounded-full border-2 border-border' />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Blocked Users */}
      <View className='mb-6'>
        <Text className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
          Blocked Users
        </Text>
        {blockedUsers === undefined ? (
          <LoadingState size='small' className='py-6' />
        ) : blockedUsers.length === 0 ? (
          <Text className='text-sm text-muted-foreground'>
            No blocked users
          </Text>
        ) : (
          <View className='rounded-card border border-border overflow-hidden'>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {blockedUsers.map((user: any, index: number) => (
              <View
                key={user.personId}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  index < blockedUsers.length - 1
                    ? 'border-b border-border'
                    : ''
                }`}
              >
                <View className='flex-row items-center gap-3'>
                  <MemberAvatar
                    personId={user.personId}
                    src={user.image}
                    name={user.name}
                    size='sm'
                  />
                  <Text className='text-base font-medium text-foreground'>
                    {user.name ?? 'Unknown'}
                  </Text>
                </View>
                <Button
                  variant='outline'
                  size='sm'
                  onPress={() => {
                    showConfirmDialog({
                      title: 'Unblock User',
                      message: `Unblock ${user.name ?? 'this user'}?`,
                      confirmLabel: 'Unblock',
                      onConfirm: () => unblockUser(user.personId),
                    });
                  }}
                >
                  Unblock
                </Button>
              </View>
            ))}
          </View>
        )}
      </View>
    </SettingsScreenTemplate>
  );
}
