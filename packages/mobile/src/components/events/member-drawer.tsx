import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlobalUser } from '@/context/global-user-context';
import {
  useAcceptFriendRequest,
  useBlockUser,
  useCancelFriendRequest,
  useFriendshipStatus,
  useRemoveFriend,
  useSendFriendRequest,
  useUnblockUser,
} from '@/hooks/use-friends';
import {
  useBanMember,
  useRemoveMember,
  useUpdateMemberRole,
} from '@/hooks/use-members';
import { useCreateReport } from '@/hooks/use-reports';
import { RoleBadge } from '@/components/molecules';
import { useActionMenu } from '@/components/ui/action-menu';
import { Badge } from '@/components/ui/badge';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { UserAvatar } from '@/components/ui/user-avatar';
import { REPORT_REASON_OPTIONS } from '@/lib/report-options';

type EventRole = 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
type RsvpStatus = 'YES' | 'MAYBE' | 'NO' | 'PENDING';

export interface MemberDrawerTarget {
  personId: Id<'persons'>;
  name?: string | null;
  image?: string | null;
  username?: string | null;
  eventMembership?: {
    membershipId: Id<'memberships'>;
    role: EventRole;
    rsvpStatus?: RsvpStatus;
    rsvpNote?: string;
    viewerRole?: EventRole;
    canManage?: boolean;
  };
}

interface MemberDrawerContextValue {
  showMember: (target: MemberDrawerTarget) => void;
  dismissMember: () => void;
}

const MemberDrawerContext = createContext<MemberDrawerContextValue | null>(
  null
);

const RSVP_CONFIG: Record<
  RsvpStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }
> = {
  YES: { label: 'Going', variant: 'success' },
  MAYBE: { label: 'Maybe', variant: 'warning' },
  NO: { label: "Can't Go", variant: 'error' },
  PENDING: { label: 'Pending', variant: 'secondary' },
};

const MEMBER_DRAWER_SNAP_POINTS = ['65%', '90%'];

export function useMemberDrawer() {
  const context = useContext(MemberDrawerContext);
  if (!context) {
    throw new Error('useMemberDrawer must be used within MemberDrawerProvider');
  }
  return context;
}

export function MemberDrawerProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<MemberDrawerTarget | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasOpenedRef = useRef(false);
  const insets = useSafeAreaInsets();
  const { person: currentPerson } = useGlobalUser();
  const { showActionMenu } = useActionMenu();

  const profile = useQuery(
    api.users.queries.getUserProfile,
    target ? { personId: target.personId } : 'skip'
  );
  const friendship = useFriendshipStatus(target?.personId);

  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const cancelFriendRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const banMember = useBanMember();
  const createReport = useCreateReport();

  const cardColor = String(useCSSVariable('--color-card') ?? 'transparent');
  const borderColor = String(useCSSVariable('--color-border') ?? 'transparent');
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );
  const destructiveColor = String(
    useCSSVariable('--color-destructive') ?? 'transparent'
  );

  const showMember = useCallback((nextTarget: MemberDrawerTarget) => {
    setTarget(nextTarget);
  }, []);

  useEffect(() => {
    if (target) sheetRef.current?.present();
  }, [target]);

  const dismissMember = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const value = useMemo(
    () => ({ showMember, dismissMember }),
    [dismissMember, showMember]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior='close'
      />
    ),
    []
  );

  const runAfterDismiss = useCallback((action: () => void) => {
    sheetRef.current?.dismiss();
    setTimeout(action, 180);
  }, []);

  const handleMoreActions = useCallback(() => {
    if (!target) return;

    runAfterDismiss(() => {
      showActionMenu({
        title: 'Member Actions',
        options: [
          {
            label: 'Report User',
            icon: 'flag-outline',
            showChevron: true,
            onPress: () =>
              showActionMenu({
                title: 'Report Reason',
                options: REPORT_REASON_OPTIONS.map(
                  ({ label, reason, icon }) => ({
                    label,
                    icon,
                    onPress: () =>
                      createReport({
                        targetType: 'USER',
                        targetId: target.personId,
                        reason,
                      }),
                  })
                ),
              }),
          },
          profile?.isBlockedByMe
            ? {
                label: 'Unblock User',
                icon: 'shield-checkmark-outline' as const,
                onPress: () => unblockUser(target.personId),
              }
            : {
                label: 'Block User',
                icon: 'ban-outline' as const,
                destructive: true,
                onPress: () =>
                  showConfirmDialog({
                    title: 'Block User',
                    message:
                      'This person will no longer be able to send you friend requests or event invitations.',
                    confirmLabel: 'Block',
                    destructive: true,
                    onConfirm: () => blockUser(target.personId),
                  }),
              },
        ],
      });
    });
  }, [
    blockUser,
    createReport,
    profile?.isBlockedByMe,
    runAfterDismiss,
    showActionMenu,
    target,
    unblockUser,
  ]);

  const displayName = profile?.user.name ?? target?.name ?? 'Member';
  const displayImage = profile?.user.image ?? target?.image;
  const username = profile?.user.username ?? target?.username;
  const pronouns = profile?.user.pronouns;
  const bio = profile?.user.bio;
  const isCurrentUser = currentPerson?._id === target?.personId;
  const friendshipStatus = friendship?.status ?? 'none';
  const friendshipId = friendship?.friendshipId;
  const eventMembership = target?.eventMembership;
  const canModifyEventMember = Boolean(
    eventMembership?.canManage &&
      !isCurrentUser &&
      eventMembership.role !== 'ORGANIZER'
  );
  const canPromote =
    canModifyEventMember &&
    eventMembership?.viewerRole === 'ORGANIZER' &&
    eventMembership.role === 'ATTENDEE';
  const canDemote =
    canModifyEventMember &&
    eventMembership?.viewerRole === 'ORGANIZER' &&
    eventMembership.role === 'MODERATOR';
  const rsvpConfig = RSVP_CONFIG[eventMembership?.rsvpStatus ?? 'PENDING'];

  return (
    <MemberDrawerContext.Provider value={value}>
      {children}
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing={false}
        snapPoints={MEMBER_DRAWER_SNAP_POINTS}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: cardColor }}
        handleIndicatorStyle={{ backgroundColor: borderColor }}
        onChange={index => {
          if (index >= 0) hasOpenedRef.current = true;
        }}
        onDismiss={() => {
          if (!hasOpenedRef.current) return;
          hasOpenedRef.current = false;
          setTarget(null);
        }}
      >
        <BottomSheetScrollView
          accessible={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {target ? (
            <View>
              <View className='items-center px-5 pb-5 pt-1'>
                <UserAvatar src={displayImage} name={displayName} size='xl' />
                <Text className='mt-3 text-xl font-bold text-foreground'>
                  {displayName}
                </Text>
                {username ? (
                  <Text className='mt-0.5 text-sm text-muted-foreground'>
                    @{username}
                  </Text>
                ) : null}
                {pronouns ? (
                  <Text className='mt-0.5 text-xs text-muted-foreground'>
                    {pronouns}
                  </Text>
                ) : null}
                {profile === undefined ? (
                  <ActivityIndicator
                    className='mt-2'
                    colorClassName='accent-primary'
                    accessibilityLabel='Loading member details'
                  />
                ) : null}
                {bio ? (
                  <Text className='mt-3 text-center text-sm text-muted-foreground'>
                    {bio}
                  </Text>
                ) : null}
                {eventMembership ? (
                  <View className='mt-3 flex-row items-center gap-2'>
                    <RoleBadge role={eventMembership.role} />
                    <Badge variant={rsvpConfig.variant}>
                      <Text className='text-xs font-medium'>
                        {rsvpConfig.label}
                      </Text>
                    </Badge>
                  </View>
                ) : null}
                {eventMembership?.rsvpNote ? (
                  <Text className='mt-2 text-center text-xs italic text-muted-foreground'>
                    “{eventMembership.rsvpNote}”
                  </Text>
                ) : null}
              </View>

              <Separator />
              <DrawerAction
                icon='person-outline'
                label={isCurrentUser ? 'View Your Profile' : 'View Profile'}
                iconColor={mutedColor}
                showChevron
                onPress={() =>
                  runAfterDismiss(() =>
                    router.push(`/profile/${target.personId}`)
                  )
                }
              />

              {!isCurrentUser && !profile?.isBlockedByMe ? (
                <>
                  {(friendshipStatus === 'none' ||
                    friendshipStatus === 'declined') &&
                  profile?.canSendFriendRequest ? (
                    <DrawerAction
                      icon='person-add-outline'
                      label='Add Friend'
                      iconColor={mutedColor}
                      onPress={() =>
                        runAfterDismiss(() =>
                          sendFriendRequest(target.personId)
                        )
                      }
                    />
                  ) : null}
                  {friendshipStatus === 'pending_sent' && friendshipId ? (
                    <DrawerAction
                      icon='time-outline'
                      label='Cancel Friend Request'
                      iconColor={mutedColor}
                      onPress={() =>
                        runAfterDismiss(() =>
                          showConfirmDialog({
                            title: 'Cancel Request',
                            message: 'Cancel your friend request?',
                            confirmLabel: 'Cancel Request',
                            destructive: true,
                            onConfirm: () => cancelFriendRequest(friendshipId),
                          })
                        )
                      }
                    />
                  ) : null}
                  {friendshipStatus === 'pending_received' && friendshipId ? (
                    <DrawerAction
                      icon='checkmark-circle-outline'
                      label='Accept Friend Request'
                      iconColor={mutedColor}
                      onPress={() =>
                        runAfterDismiss(() => acceptFriendRequest(friendshipId))
                      }
                    />
                  ) : null}
                  {friendshipStatus === 'friends' && friendshipId ? (
                    <DrawerAction
                      icon='people-outline'
                      label='Friends'
                      iconColor={mutedColor}
                      onPress={() =>
                        runAfterDismiss(() =>
                          showConfirmDialog({
                            title: 'Remove Friend',
                            message: `Remove ${displayName} from your friends?`,
                            confirmLabel: 'Remove',
                            destructive: true,
                            onConfirm: () => removeFriend(friendshipId),
                          })
                        )
                      }
                    />
                  ) : null}
                </>
              ) : null}

              {canModifyEventMember && eventMembership ? (
                <>
                  <Separator />
                  {canPromote ? (
                    <DrawerAction
                      icon='arrow-up-circle-outline'
                      label='Promote to Moderator'
                      iconColor={mutedColor}
                      onPress={() =>
                        runAfterDismiss(() =>
                          updateMemberRole({
                            membershipId: eventMembership.membershipId,
                            newRole: 'MODERATOR',
                          })
                        )
                      }
                    />
                  ) : null}
                  {canDemote ? (
                    <DrawerAction
                      icon='arrow-down-circle-outline'
                      label='Demote to Attendee'
                      iconColor={mutedColor}
                      onPress={() =>
                        runAfterDismiss(() =>
                          updateMemberRole({
                            membershipId: eventMembership.membershipId,
                            newRole: 'ATTENDEE',
                          })
                        )
                      }
                    />
                  ) : null}
                  <DrawerAction
                    icon='person-remove-outline'
                    label='Remove from Event'
                    iconColor={mutedColor}
                    onPress={() =>
                      runAfterDismiss(() =>
                        showConfirmDialog({
                          title: 'Remove Member',
                          message: `Remove ${displayName} from this event?`,
                          confirmLabel: 'Remove',
                          destructive: true,
                          onConfirm: () =>
                            removeMember({
                              membershipId: eventMembership.membershipId,
                            }),
                        })
                      )
                    }
                  />
                  <DrawerAction
                    icon='ban-outline'
                    label='Ban from Event'
                    iconColor={destructiveColor}
                    destructive
                    onPress={() =>
                      runAfterDismiss(() =>
                        showConfirmDialog({
                          title: 'Ban Member',
                          message: `Ban ${displayName} from this event? They will not be able to rejoin.`,
                          confirmLabel: 'Ban',
                          destructive: true,
                          onConfirm: () =>
                            banMember({
                              membershipId: eventMembership.membershipId,
                            }),
                        })
                      )
                    }
                  />
                </>
              ) : null}

              {!isCurrentUser ? (
                <>
                  <Separator />
                  <DrawerAction
                    icon='ellipsis-horizontal'
                    label='More Actions'
                    iconColor={mutedColor}
                    showChevron
                    onPress={handleMoreActions}
                  />
                </>
              ) : null}
            </View>
          ) : (
            <View />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </MemberDrawerContext.Provider>
  );
}

function DrawerAction({
  icon,
  label,
  iconColor,
  destructive = false,
  showChevron = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor: string;
  destructive?: boolean;
  showChevron?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label}
      className='min-h-[52px] flex-row items-center gap-3 px-5 py-3 active:bg-muted'
    >
      <Ionicons name={icon} size={22} color={iconColor} />
      <Text
        className={
          destructive
            ? 'flex-1 text-base font-medium text-destructive'
            : 'flex-1 text-base text-foreground'
        }
      >
        {label}
      </Text>
      {showChevron ? (
        <Ionicons name='chevron-forward' size={18} color={iconColor} />
      ) : null}
    </Pressable>
  );
}
