import { useMemo, useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import {
  useUpdateMemberRole,
  useRemoveMember,
  useBanMember,
} from '@/hooks/use-members';
import { MemberAvatar } from '@/components/members/member-avatar';
import { BackButton } from '@/components/ui/back-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { RoleBadge } from '@/components/molecules';
import { LoadingState } from '@/components/molecules';
import {
  useActionMenu,
  type ActionMenuOption,
} from '@/components/ui/action-menu';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGlobalUser } from '@/context/global-user-context';
import { canRoleViewAttendeeList } from '@/lib/event-access-policy';

const RSVP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  YES: 'checkmark-circle',
  MAYBE: 'help-circle',
  NO: 'close-circle',
  PENDING: 'time',
};

export default function AttendeesScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const typedEventId = eventId as Id<'events'>;
  const { person: currentPerson } = useGlobalUser();
  const headerData = useQuery(api.events.queries.getEventHeader, {
    eventId: typedEventId,
  });
  const canViewMembers = canRoleViewAttendeeList(
    headerData?.userMembership.role,
    headerData?.permissions.viewAttendeeList
  );
  const membersData = useQuery(
    api.events.queries.getEventAttendeesData,
    canViewMembers ? { eventId: typedEventId } : 'skip'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const successColor = String(
    useCSSVariable('--color-success') ?? 'transparent'
  );
  const warningColor = String(
    useCSSVariable('--color-warning') ?? 'transparent'
  );
  const errorColor = String(useCSSVariable('--color-error') ?? 'transparent');
  const primaryColor = String(
    useCSSVariable('--color-primary') ?? 'transparent'
  );
  const primaryForegroundColor = String(
    useCSSVariable('--color-primary-foreground') ?? 'transparent'
  );

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const banMember = useBanMember();
  const { showActionMenu } = useActionMenu();

  const members = membersData?.event.memberships;
  const isLoading =
    headerData === undefined || (canViewMembers && membersData === undefined);
  const canManage =
    membersData?.userMembership.role === 'ORGANIZER' ||
    membersData?.userMembership.role === 'MODERATOR';
  const sorted = useMemo(() => {
    const roleOrder = { ORGANIZER: 0, MODERATOR: 1, ATTENDEE: 2 } as const;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (members ?? [])
      .filter(member => {
        if (!normalizedSearch) return true;
        const name = member.user?.name?.toLowerCase() ?? '';
        const username = member.user?.username?.toLowerCase() ?? '';
        return (
          name.includes(normalizedSearch) || username.includes(normalizedSearch)
        );
      })
      .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  }, [members, searchTerm]);

  function handleMemberLongPress(member: NonNullable<typeof members>[number]) {
    if (!canManage) return;

    const personId = member.personId;
    const membershipId = member._id;
    const role = member.role;
    const name = member.user?.name ?? 'Member';
    const isCurrentUser = personId === currentPerson?._id;
    const isOrganizer = role === 'ORGANIZER';

    if (isCurrentUser || isOrganizer) return;

    const sheetOptions: ActionMenuOption[] = [];

    if (role === 'ATTENDEE') {
      sheetOptions.push({
        label: 'Promote to Moderator',
        icon: 'arrow-up-circle-outline',
        onPress: () => updateRole({ membershipId, newRole: 'MODERATOR' }),
      });
    }
    if (role === 'MODERATOR') {
      sheetOptions.push({
        label: 'Demote to Attendee',
        icon: 'arrow-down-circle-outline',
        onPress: () => updateRole({ membershipId, newRole: 'ATTENDEE' }),
      });
    }

    sheetOptions.push({
      label: 'Remove from Event',
      icon: 'person-remove-outline',
      destructive: true,
      onPress: () =>
        showConfirmDialog({
          title: 'Remove Member',
          message: `Remove ${name} from this event?`,
          confirmLabel: 'Remove',
          destructive: true,
          onConfirm: () => removeMember({ membershipId }),
        }),
    });

    sheetOptions.push({
      label: 'Ban from Event',
      icon: 'ban-outline',
      destructive: true,
      onPress: () =>
        showConfirmDialog({
          title: 'Ban Member',
          message: `Ban ${name} from this event? They will not be able to rejoin.`,
          confirmLabel: 'Ban',
          destructive: true,
          onConfirm: () => banMember({ membershipId }),
        }),
    });

    showActionMenu({
      title: name,
      options: sheetOptions,
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>Members</Text>
        </View>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!headerData || !canViewMembers) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>Members</Text>
        </View>
        <EmptyState
          icon='lock-closed-outline'
          title='Member list unavailable'
          description='Your role does not have permission to view this event’s attendee list.'
        />
      </SafeAreaView>
    );
  }

  const rsvpColors = {
    YES: successColor,
    MAYBE: warningColor,
    NO: errorColor,
    PENDING: primaryColor,
  };

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center justify-between px-4 py-3'>
        <View className='flex-row items-center'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Members ({members?.length ?? 0})
          </Text>
        </View>
        {canManage ? (
          <Pressable
            onPress={() => router.push(`/event/${eventId}/invite`)}
            accessibilityRole='button'
            accessibilityLabel='Invite people to this event'
            className='flex-row items-center gap-1 rounded-button bg-primary px-3 py-1.5'
          >
            <Ionicons
              name='person-add'
              size={16}
              color={primaryForegroundColor}
            />
            <Text className='text-sm font-medium text-primary-foreground'>
              Invite
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className='px-4 pb-3'>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder='Search members'
          accessibilityLabel='Search event members'
          autoCapitalize='none'
          returnKeyType='search'
        />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const name = item.user?.name ?? 'Unknown';
          const image = item.user?.image;
          const role = item.role;
          const rsvpStatus = item.rsvpStatus;
          const rsvpIcon = RSVP_ICONS[rsvpStatus] ?? RSVP_ICONS.PENDING;
          const rsvpColor = rsvpColors[rsvpStatus] ?? primaryColor;

          return (
            <Pressable
              onPress={() => router.push(`/profile/${item.personId}`)}
              onLongPress={() => handleMemberLongPress(item)}
              accessibilityRole='button'
              accessibilityLabel={`${name}, ${role.toLowerCase()}, RSVP ${rsvpStatus.toLowerCase()}`}
              accessibilityHint={
                canManage &&
                item.personId !== currentPerson?._id &&
                role !== 'ORGANIZER'
                  ? 'Opens profile. Long press to manage this member.'
                  : 'Opens profile.'
              }
              className='flex-row items-center gap-3 border-b border-border px-4 py-3'
            >
              <MemberAvatar
                personId={item.personId}
                src={image}
                name={name}
                size='md'
                eventMembership={{
                  membershipId: item._id,
                  role,
                  rsvpStatus,
                  rsvpNote: item.rsvpNote,
                  viewerRole: membersData?.userMembership.role,
                  canManage,
                }}
              />
              <View className='flex-1'>
                <Text className='text-base font-medium text-foreground'>
                  {name}
                </Text>
                <RoleBadge role={role} className='mt-1 self-start' />
              </View>
              <Ionicons name={rsvpIcon} size={20} color={rsvpColor} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon='people-outline'
            title={searchTerm ? 'No matching members' : 'No members'}
            description={
              searchTerm
                ? 'Try a different name or username'
                : 'Invite people to your event'
            }
          />
        }
        contentContainerStyle={sorted.length === 0 ? { flex: 1 } : undefined}
      />
    </SafeAreaView>
  );
}
