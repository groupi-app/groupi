import { useCallback, useEffect, useRef } from 'react';
import { View, Pressable } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/ui/user-avatar';
import { RoleBadge } from '@/components/molecules';
import { Badge } from '@/components/ui/badge';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Member = any;

const RSVP_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }
> = {
  YES: { label: 'Going', variant: 'success' },
  MAYBE: { label: 'Maybe', variant: 'warning' },
  NO: { label: "Can't Go", variant: 'error' },
  PENDING: { label: 'Pending', variant: 'secondary' },
};

interface MemberDrawerProps {
  member: Member | null;
  canManage: boolean;
  userRole: string;
  isCurrentUser: boolean;
  onUpdateRole: (args: {
    membershipId: string;
    newRole: 'MODERATOR' | 'ATTENDEE';
  }) => void;
  onRemoveMember: (args: { membershipId: string }) => void;
  onBanMember: (args: { membershipId: string }) => void;
  onDismiss: () => void;
}

export function MemberDrawer({
  member,
  canManage,
  userRole,
  isCurrentUser,
  onUpdateRole,
  onRemoveMember,
  onBanMember,
  onDismiss,
}: MemberDrawerProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const bgColor = (useCSSVariable('--color-card') as string) ?? '#ffffff';
  const borderColor = (useCSSVariable('--color-border') as string) ?? '#e5e7eb';

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleAction = useCallback(
    (action: () => void) => {
      dismiss();
      setTimeout(() => action(), 150);
    },
    [dismiss]
  );

  useEffect(() => {
    if (member) {
      bottomSheetRef.current?.present();
    }
  }, [member]);

  if (!member) {
    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: bgColor }}
        handleIndicatorStyle={{ backgroundColor: borderColor }}
        onDismiss={handleDismiss}
      >
        <BottomSheetView style={{ paddingBottom: 34 }}>
          <View />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }

  const personId = member.person?._id ?? member.personId;
  const membershipId = member._id ?? member.membership?._id;
  const role = member.role ?? member.membership?.role ?? 'ATTENDEE';
  const name = member.user?.name ?? member.person?.user?.name ?? 'Unknown';
  const image = member.user?.image ?? member.person?.user?.image;
  const rsvpStatus =
    member.rsvpStatus ?? member.membership?.rsvpStatus ?? 'PENDING';
  const rsvpConfig = RSVP_CONFIG[rsvpStatus] ?? RSVP_CONFIG.PENDING;

  const isOrganizer = role === 'ORGANIZER';
  const canModify =
    canManage && !isCurrentUser && !isOrganizer && !!membershipId;
  const canPromote = userRole === 'ORGANIZER' && role === 'ATTENDEE';
  const canDemote = userRole === 'ORGANIZER' && role === 'MODERATOR';

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bgColor }}
      handleIndicatorStyle={{ backgroundColor: borderColor }}
      onDismiss={handleDismiss}
    >
      <BottomSheetView style={{ paddingBottom: 34 }}>
        {/* Member info header */}
        <View className='items-center gap-2 px-5 pb-4 pt-1'>
          <UserAvatar src={image} name={name} size='lg' />
          <Text className='text-lg font-semibold'>{name}</Text>
          <View className='flex-row items-center gap-2'>
            <RoleBadge role={role} />
            <Badge variant={rsvpConfig.variant}>
              <Text className='text-xs font-medium text-white'>
                {rsvpConfig.label}
              </Text>
            </Badge>
          </View>
        </View>

        <Separator />

        {/* View Profile */}
        <Pressable
          onPress={() =>
            handleAction(() => router.push(`/profile/${personId}`))
          }
          className='flex-row items-center gap-3 px-5 py-4 active:bg-muted'
        >
          <Ionicons name='person-outline' size={22} color='#6b7280' />
          <Text className='flex-1 text-base text-foreground'>View Profile</Text>
          <Ionicons name='chevron-forward' size={18} color='#9ca3af' />
        </Pressable>

        {/* Management actions */}
        {canModify ? (
          <>
            <Separator />

            {canPromote ? (
              <Pressable
                onPress={() =>
                  handleAction(() =>
                    onUpdateRole({ membershipId, newRole: 'MODERATOR' })
                  )
                }
                className='flex-row items-center gap-3 px-5 py-4 active:bg-muted'
              >
                <Ionicons name='arrow-up-circle' size={22} color='#6b7280' />
                <Text className='flex-1 text-base text-foreground'>
                  Promote to Moderator
                </Text>
              </Pressable>
            ) : null}

            {canDemote ? (
              <Pressable
                onPress={() =>
                  handleAction(() =>
                    onUpdateRole({ membershipId, newRole: 'ATTENDEE' })
                  )
                }
                className='flex-row items-center gap-3 px-5 py-4 active:bg-muted'
              >
                <Ionicons name='arrow-down-circle' size={22} color='#6b7280' />
                <Text className='flex-1 text-base text-foreground'>
                  Demote to Attendee
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() =>
                handleAction(() =>
                  showConfirmDialog({
                    title: 'Remove Member',
                    message: `Remove ${name} from this event?`,
                    confirmLabel: 'Remove',
                    destructive: true,
                    onConfirm: () => onRemoveMember({ membershipId }),
                  })
                )
              }
              className='flex-row items-center gap-3 px-5 py-4 active:bg-muted'
            >
              <Ionicons name='person-remove' size={22} color='#6b7280' />
              <Text className='flex-1 text-base text-foreground'>
                Remove from Event
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                handleAction(() =>
                  showConfirmDialog({
                    title: 'Ban Member',
                    message: `Ban ${name} from this event? They will not be able to rejoin.`,
                    confirmLabel: 'Ban',
                    destructive: true,
                    onConfirm: () => onBanMember({ membershipId }),
                  })
                )
              }
              className='flex-row items-center gap-3 px-5 py-4 active:bg-muted'
            >
              <Ionicons name='ban' size={22} color='#ef4444' />
              <Text className='flex-1 text-base font-medium text-destructive'>
                Ban from Event
              </Text>
            </Pressable>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
