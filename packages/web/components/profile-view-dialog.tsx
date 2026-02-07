'use client';

import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitialsFromName, formatLastSeen } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useSession } from '@/lib/auth-client';
import { useUserProfile } from '@/hooks/convex/use-users';
import { useMutualEvents } from '@/hooks/convex/use-events';
import { useMutualFriends, MutualFriend } from '@/hooks/convex/use-friends';
import { FriendRequestButton } from '@/components/friend-request-button';
import { InviteToEventPopover } from '@/components/invite-to-event-popover';
import { Id } from '@/convex/_generated/dataModel';
import {
  Users,
  Calendar,
  CalendarPlus,
  ShieldBan,
  UserX,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  useBlockUser,
  useFriendshipStatus,
  useRemoveFriendByPersonId,
} from '@/hooks/convex/use-friends';
import { useActionMenu } from '@/hooks/use-action-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export type ProfileTab = 'profile' | 'mutualEvents' | 'mutualFriends';

interface ProfileViewDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Initial tab to show when dialog opens */
  initialTab?: ProfileTab;
}

export function ProfileViewDialog({
  userId,
  open,
  onOpenChange,
  initialTab = 'profile',
}: ProfileViewDialogProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id as string | undefined;
  const isOwnProfile = currentUserId === userId;

  // Use Convex hooks for real-time data - only fetch when dialog is open
  const profileData = useUserProfile(userId, { enabled: open });
  // Only fetch mutual data when viewing someone else's profile
  const mutualEventsData = useMutualEvents(userId, {
    enabled: open && !isOwnProfile,
  });
  const mutualFriendsData = useMutualFriends(userId, {
    enabled: open && !isOwnProfile,
  });

  // Loading states
  const isLoading = profileData === undefined;
  const isLoadingMutualEvents = mutualEventsData === undefined;
  const isLoadingMutualFriends = mutualFriendsData === undefined;

  // Extract data
  const userProfile = profileData?.user;
  interface MutualEvent {
    id: Id<'events'>;
    title: string;
    location?: string | null;
    chosenDateTime?: number | null;
  }
  const mutualEvents: MutualEvent[] = mutualEventsData || [];
  const mutualFriends: MutualFriend[] = mutualFriendsData || [];
  const mutualEventsCount = mutualEvents.length;
  const mutualFriendsCount = mutualFriends.length;

  const initials = getInitialsFromName(
    userProfile?.name || null,
    userProfile?.email || ''
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px] max-h-[85vh] flex flex-col p-0'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription className='sr-only'>
            View user profile information
          </DialogDescription>
        </DialogHeader>

        {/* Profile Header - Always visible */}
        <div className='px-6 pb-4'>
          {isLoading ? (
            <ProfileHeaderSkeleton />
          ) : !userProfile ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-destructive'>
                Failed to load profile. Please try again.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Profile Picture and Name */}
              <div className='flex items-start gap-4'>
                <Avatar className='h-20 w-20'>
                  <AvatarImage src={userProfile.image || undefined} />
                  <AvatarFallback className='text-lg'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col gap-1 flex-1 min-w-0'>
                  <h3 className='text-xl font-semibold truncate'>
                    {userProfile.name || 'No name'}
                  </h3>
                  <div className='flex items-center gap-1 text-muted-foreground'>
                    <span>@{userProfile.username || 'username'}</span>
                    {userProfile.pronouns && (
                      <>
                        <span>·</span>
                        <span>{userProfile.pronouns}</span>
                      </>
                    )}
                  </div>
                  {/* Last seen status */}
                  {(() => {
                    const presence = formatLastSeen(userProfile.lastSeen);
                    return (
                      <div className='flex items-center gap-1.5 text-sm'>
                        <span
                          className={`size-2 rounded-full ${presence.isOnline ? 'bg-success' : 'bg-muted-foreground/50'}`}
                        />
                        <span
                          className={
                            presence.isOnline
                              ? 'text-success'
                              : 'text-muted-foreground'
                          }
                        >
                          {presence.text}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bio */}
              {userProfile.bio && (
                <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
                  {userProfile.bio}
                </p>
              )}

              {/* Action Buttons - only show if not own profile */}
              {currentUserId && !isOwnProfile && profileData?.personId && (
                <ProfileActions
                  personId={profileData.personId as Id<'persons'>}
                  canSendFriendRequest={
                    profileData.canSendFriendRequest ?? true
                  }
                  canSendEventInvite={profileData.canSendEventInvite ?? true}
                  isBlockedByMe={profileData.isBlockedByMe ?? false}
                />
              )}
            </div>
          )}
        </div>

        {/* Tabs Section - Only show for other users' profiles */}
        {currentUserId && !isOwnProfile && !isLoading && userProfile && (
          <Tabs defaultValue={initialTab} className='flex-1 flex flex-col pb-6'>
            <div className='px-6'>
              <TabsList className='w-full'>
                <TabsTrigger value='mutualFriends' className='flex-1 gap-1.5'>
                  <Users className='size-4' />
                  <span>
                    Mutual Friends
                    {!isLoadingMutualFriends && ` (${mutualFriendsCount})`}
                  </span>
                </TabsTrigger>
                <TabsTrigger value='mutualEvents' className='flex-1 gap-1.5'>
                  <Calendar className='size-4' />
                  <span>
                    Mutual Events
                    {!isLoadingMutualEvents && ` (${mutualEventsCount})`}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='mutualFriends' className='flex-1 mt-0'>
              <ScrollArea className='h-[300px] px-6'>
                {isLoadingMutualFriends ? (
                  <div className='space-y-2 pt-4'>
                    <MutualFriendSkeleton />
                    <MutualFriendSkeleton />
                    <MutualFriendSkeleton />
                  </div>
                ) : mutualFriends.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
                    <Users className='size-12 mb-2 opacity-50' />
                    <p>No mutual friends found.</p>
                  </div>
                ) : (
                  <div className='flex flex-col gap-2 pt-4'>
                    {mutualFriends.map(friend => (
                      <div
                        key={friend.personId}
                        className='flex items-center gap-3 p-3 rounded-card bg-card hover:bg-accent/50 transition-colors'
                      >
                        <Avatar className='size-10'>
                          <AvatarImage src={friend.image || undefined} />
                          <AvatarFallback>
                            {getInitialsFromName(
                              friend.name,
                              friend.username || ''
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <div className='font-medium truncate'>
                            {friend.name || 'Unknown'}
                          </div>
                          {friend.username && (
                            <div className='text-sm text-muted-foreground truncate'>
                              @{friend.username}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value='mutualEvents' className='flex-1 mt-0'>
              <ScrollArea className='h-[300px] px-6'>
                {isLoadingMutualEvents ? (
                  <div className='space-y-2 pt-4'>
                    <MutualEventSkeleton />
                    <MutualEventSkeleton />
                    <MutualEventSkeleton />
                  </div>
                ) : mutualEvents.length === 0 ? (
                  <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
                    <Calendar className='size-12 mb-2 opacity-50' />
                    <p>No mutual events found.</p>
                  </div>
                ) : (
                  <div className='flex flex-col gap-2 pt-4'>
                    {mutualEvents.map(event => (
                      <Link
                        key={event.id}
                        href={`/event/${event.id}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <div className='flex items-center gap-3 border border-border shadow-raised p-3 hover:bg-accent/80 transition-all cursor-pointer rounded-card'>
                          <h3 className='font-heading text-sm shrink-0 min-w-0 flex-1 truncate'>
                            {event.title}
                          </h3>
                          {event.location && (
                            <div className='flex items-center gap-1 shrink-0 min-w-0'>
                              <Icons.location className='size-3 text-primary' />
                              <span className='text-xs text-muted-foreground truncate max-w-[100px]'>
                                {event.location}
                              </span>
                            </div>
                          )}
                          <div className='flex items-center gap-1 shrink-0'>
                            <Icons.date className='size-3 text-primary' />
                            {event.chosenDateTime ? (
                              <span className='text-xs text-muted-foreground whitespace-nowrap'>
                                {new Date(event.chosenDateTime).toLocaleString(
                                  [],
                                  {
                                    weekday: 'short',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                  }
                                )}
                              </span>
                            ) : (
                              <span className='text-xs text-muted-foreground whitespace-nowrap'>
                                TBD
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Add bottom padding for own profile or when no tabs */}
        {(isOwnProfile || isLoading || !userProfile) && (
          <div className='pb-6' />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Discord-style action buttons:
 *   Row 1: [Add Friend / Friends]  [📅 Invite to Event]
 *   Row 2: [Remove Friend]  [Block]   (destructive, ghost)
 */
function ProfileActions({
  personId,
  canSendFriendRequest,
  canSendEventInvite,
  isBlockedByMe,
}: {
  personId: Id<'persons'>;
  canSendFriendRequest: boolean;
  canSendEventInvite: boolean;
  isBlockedByMe: boolean;
}) {
  const blockUser = useBlockUser();
  const removeFriend = useRemoveFriendByPersonId();
  const friendshipStatus = useFriendshipStatus(personId);
  const { sheetOpen, setSheetOpen, handleMoreClick, handleContextMenu } =
    useActionMenu();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const isFriends = friendshipStatus?.status === 'friends';

  const handleBlock = async () => {
    await blockUser(personId);
    setShowBlockDialog(false);
  };

  const handleRemoveFriend = async () => {
    await removeFriend(personId);
    setShowRemoveDialog(false);
  };

  if (isBlockedByMe) {
    return (
      <p className='text-sm text-muted-foreground text-center py-1'>
        You have blocked this user.
      </p>
    );
  }

  // Dropdown content for desktop ⋯ menu
  const dropdownContent = (
    <>
      {isFriends && (
        <DropdownMenuItem
          variant='destructive'
          onClick={() => setShowRemoveDialog(true)}
          className='cursor-pointer'
        >
          <UserX className='size-4 mr-2' />
          Remove Friend
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        variant='destructive'
        onClick={() => setShowBlockDialog(true)}
        className='cursor-pointer'
      >
        <ShieldBan className='size-4 mr-2' />
        Block
      </DropdownMenuItem>
    </>
  );

  // Drawer content for mobile ⋯ menu
  const drawerContent = (
    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
      {isFriends && (
        <Button
          variant='ghost'
          className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
          onClick={() => {
            setSheetOpen(false);
            setShowRemoveDialog(true);
          }}
        >
          <UserX className='size-4 mr-2' />
          Remove Friend
        </Button>
      )}
      <Button
        variant='ghost'
        className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
        onClick={() => {
          setSheetOpen(false);
          setShowBlockDialog(true);
        }}
      >
        <ShieldBan className='size-4 mr-2' />
        Block
      </Button>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className='flex items-center gap-2'>
        {/* Primary: Friend request button */}
        {canSendFriendRequest && <FriendRequestButton personId={personId} />}

        {/* Invite to Event icon button */}
        {canSendEventInvite && (
          <Tooltip>
            <InviteToEventPopover targetPersonId={personId}>
              <TooltipTrigger asChild>
                <Button
                  variant='secondary'
                  size='icon'
                  className='size-10 shrink-0'
                >
                  <CalendarPlus className='size-5' />
                  <span className='sr-only'>Invite to Event</span>
                </Button>
              </TooltipTrigger>
            </InviteToEventPopover>
            <TooltipContent>Invite to Event</TooltipContent>
          </Tooltip>
        )}

        {/* More menu: dropdown on desktop, drawer on mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ActionMenuButton
                onClick={handleMoreClick}
                onContextMenu={handleContextMenu}
                className='size-10'
                dropdownContent={dropdownContent}
              >
                <MoreHorizontal className='size-5' />
              </ActionMenuButton>
            </div>
          </TooltipTrigger>
          <TooltipContent>More</TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile drawer */}
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent>
          <DrawerHeader>
            <VisuallyHidden>
              <DrawerTitle>More Options</DrawerTitle>
            </VisuallyHidden>
          </DrawerHeader>
          {drawerContent}
        </DrawerContent>
      </Drawer>

      {/* Block confirmation */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this user? They will no longer be
              able to send you friend requests or event invites. Any existing
              friendship will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove friend confirmation */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? You can send a new
              friend request later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFriend}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}

// Skeleton components
function ProfileHeaderSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-start gap-4'>
        <Skeleton className='h-20 w-20 rounded-full' />
        <div className='flex flex-col gap-2 flex-1'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-4 w-16' />
        </div>
      </div>
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-10 w-full rounded-button' />
    </div>
  );
}

function MutualEventSkeleton() {
  return (
    <div className='flex items-center gap-3 border border-border p-3 rounded-card'>
      <Skeleton className='h-4 w-32 flex-1' />
      <Skeleton className='h-4 w-20' />
      <Skeleton className='h-4 w-24' />
    </div>
  );
}

function MutualFriendSkeleton() {
  return (
    <div className='flex items-center gap-3 p-3 rounded-card bg-card'>
      <Skeleton className='size-10 rounded-full' />
      <div className='flex-1 space-y-1.5'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-3 w-20' />
      </div>
    </div>
  );
}
