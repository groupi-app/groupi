import {
  cn,
  formatRoleBadge,
  formatRoleName,
  getInitialsFromName,
  formatLastSeen,
  UserStatusType,
} from '@/lib/utils';
import { Doc } from '@/convex/_generated/dataModel';
import { User } from '@/convex/types';
import { componentLogger } from '@/lib/logger';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { MemberAction, MemberActionDialog } from './member-action-dialog';
import { ProfileViewDialog } from './profile-view-dialog';
import { StatusIndicator } from '@/components/atoms';
import { useState, useCallback } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { useMobile } from '@/hooks/use-mobile';
import {
  useFriendActions,
  type FriendshipStatus,
} from '@/hooks/convex/use-friends';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';

// Use Convex generated types - person can be null if the person record is deleted
type Member = Doc<'memberships'> & {
  person:
    | (Doc<'persons'> & {
        user: User;
      })
    | null;
};

const item = {
  hidden: { opacity: 0, x: 15 },
  show: { opacity: 1, x: 0 },
};

type ActionMenuProps = {
  children: React.ReactNode;
  isMobile: boolean;
  handleContextMenu: (e: React.MouseEvent | React.TouchEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  fullName: string;
  user: User | null | undefined;
  initials: string;
  role: Member['role'];
  member: Member;
  eventDateTime: Date | null;
  canKick: boolean;
  canBan: boolean;
  canPromote: boolean;
  isMe: boolean;
  personId: Id<'persons'> | undefined;
  setDialogAction: (action: MemberAction) => void;
  setDialogOpen: (open: boolean) => void;
  setProfileDialogOpen: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  // Friend action props
  friendStatus: FriendshipStatus;
  friendIsLoading: boolean;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void;
  onCancelFriendRequest: () => void;
};

function ActionMenu({
  children,
  isMobile,
  handleContextMenu,
  handleClick,
  sheetOpen,
  setSheetOpen,
  fullName,
  user,
  initials,
  role,
  member,
  eventDateTime,
  canKick,
  canBan,
  canPromote,
  isMe,
  personId,
  setDialogAction,
  setDialogOpen,
  setProfileDialogOpen,
  align,
  friendStatus,
  friendIsLoading,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onCancelFriendRequest,
}: ActionMenuProps) {
  if (isMobile) {
    // No Tooltip wrapper on mobile - just the clickable element and drawer
    return (
      <>
        <div
          onContextMenu={handleContextMenu}
          onClick={handleClick}
          style={{ touchAction: 'manipulation' }}
          className='rounded-full cursor-pointer'
        >
          {children}
        </div>
        <Drawer
          open={sheetOpen}
          onOpenChange={open => {
            // Prevent opening via onOpenChange - only allow via click/contextmenu handler
            if (isMobile && open && !sheetOpen) {
              return;
            }
            // Allow closing
            if (!open) {
              setSheetOpen(false);
            }
          }}
          modal={true}
        >
          <DrawerContent>
            <DrawerHeader className='text-left'>
              <VisuallyHidden>
                <DrawerTitle>Member Info</DrawerTitle>
              </VisuallyHidden>
              <div className='flex items-center gap-3 mb-4'>
                <Avatar className='size-16'>
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className='text-lg'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                  <DrawerTitle className='text-xl'>{fullName}</DrawerTitle>
                  <DrawerDescription>
                    {user?.username ? `@${user.username}` : user?.email}
                  </DrawerDescription>
                  {/* Last seen status */}
                  {(() => {
                    const presence = formatLastSeen(
                      member.person?.lastSeen,
                      member.person?.status as UserStatusType | undefined,
                      member.person?.statusExpiresAt
                    );
                    return (
                      <div className='flex items-center gap-1.5 text-sm mt-1'>
                        <StatusIndicator
                          status={presence.displayStatus}
                          size='sm'
                          showBorder={false}
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
              <div className='flex items-center gap-2 mb-2'>
                <div className='text-card-foreground'>
                  {formatRoleBadge(role)}
                </div>
                <span className='text-card-foreground'>
                  {formatRoleName(role)}
                </span>
              </div>
              {eventDateTime && (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <span>RSVP: </span>
                  {member.rsvpStatus === 'YES' && (
                    <Icons.check className='text-success' />
                  )}
                  {member.rsvpStatus === 'MAYBE' && (
                    <span className='font-semibold w-6 text-xl text-warning text-center'>
                      ?
                    </span>
                  )}
                  {member.rsvpStatus === 'NO' && (
                    <Icons.close className='text-error' />
                  )}
                  <span className='text-foreground'>{member.rsvpStatus}</span>
                </div>
              )}
            </DrawerHeader>
            <div className='flex flex-col gap-2 px-4 pb-4'>
              <Button
                variant='ghost'
                className='w-full justify-start'
                onClick={() => {
                  setSheetOpen(false);
                  setProfileDialogOpen(true);
                }}
              >
                <Icons.account className='size-4 mr-2' />
                View Profile
              </Button>
              {/* Friend action - only show if not self */}
              {!isMe && personId && friendStatus === 'none' && (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {
                    setSheetOpen(false);
                    onSendFriendRequest();
                  }}
                  disabled={friendIsLoading}
                >
                  <Icons.invite className='size-4 mr-2' />
                  Add Friend
                </Button>
              )}
              {!isMe && personId && friendStatus === 'pending_sent' && (
                <Button
                  variant='ghost'
                  className='w-full justify-start text-muted-foreground'
                  onClick={() => {
                    setSheetOpen(false);
                    onCancelFriendRequest();
                  }}
                  disabled={friendIsLoading}
                >
                  <Icons.clock className='size-4 mr-2' />
                  Cancel Request
                </Button>
              )}
              {!isMe && personId && friendStatus === 'pending_received' && (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {
                    setSheetOpen(false);
                    onAcceptFriendRequest();
                  }}
                  disabled={friendIsLoading}
                >
                  <Icons.check className='size-4 mr-2' />
                  Accept Friend Request
                </Button>
              )}
              {!isMe && personId && friendStatus === 'friends' && (
                <Button
                  variant='ghost'
                  className='w-full justify-start text-muted-foreground'
                  disabled
                >
                  <Icons.people className='size-4 mr-2' />
                  Friends
                </Button>
              )}
              {(canKick || canBan || canPromote) && (
                <>
                  {canPromote && (
                    <>
                      {member.role === 'ATTENDEE' && (
                        <Button
                          variant='ghost'
                          className='w-full justify-start'
                          onClick={() => {
                            setDialogAction(MemberAction.PROMOTE);
                            setSheetOpen(false);
                            setDialogOpen(true);
                          }}
                        >
                          <Icons.shield className='size-4 mr-2' />
                          Promote
                        </Button>
                      )}
                      {member.role === 'MODERATOR' && (
                        <Button
                          variant='ghost'
                          className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
                          onClick={() => {
                            setDialogAction(MemberAction.DEMOTE);
                            setSheetOpen(false);
                            setDialogOpen(true);
                          }}
                        >
                          <Icons.shieldOff className='size-4 mr-2' />
                          Demote
                        </Button>
                      )}
                    </>
                  )}
                  {canKick && (
                    <Button
                      variant='ghost'
                      className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
                      onClick={() => {
                        setDialogAction(MemberAction.KICK);
                        setSheetOpen(false);
                        setDialogOpen(true);
                      }}
                    >
                      <Icons.kick className='size-4 mr-2' />
                      Kick
                    </Button>
                  )}
                  {canBan && (
                    <Button
                      variant='ghost'
                      className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
                      onClick={() => {
                        setDialogAction(MemberAction.BAN);
                        setSheetOpen(false);
                        setDialogOpen(true);
                      }}
                    >
                      <Icons.ban className='size-4 mr-2' />
                      Ban
                    </Button>
                  )}
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: return DropdownMenu for click
  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className='rounded-full'>
            {children}
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <DropdownMenuContent align={align}>
          <DropdownMenuLabel>
            <div className='flex flex-col'>
              <span className='text-base text-card-foreground'>{fullName}</span>
              <span className='text-muted-foreground'>
                {user?.username ? `@${user.username}` : user?.email}
              </span>
              {/* Last seen status */}
              {(() => {
                const presence = formatLastSeen(
                  member.person?.lastSeen,
                  member.person?.status as UserStatusType | undefined,
                  member.person?.statusExpiresAt
                );
                return (
                  <div className='flex items-center gap-1.5 text-sm mt-1'>
                    <StatusIndicator
                      status={presence.displayStatus}
                      size='sm'
                      showBorder={false}
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
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            <div className='flex items-center gap-1'>
              <div className='text-card-foreground'>
                {formatRoleBadge(role)}
              </div>
              <span className='text-card-foreground'>
                {formatRoleName(role)}
              </span>
            </div>
          </DropdownMenuLabel>
          {eventDateTime && (
            <DropdownMenuLabel>
              <div className='flex items-center gap-1 text-muted-foreground'>
                <span>RSVP: </span>
                {member.rsvpStatus === 'YES' && (
                  <Icons.check className='text-success' />
                )}
                {member.rsvpStatus === 'MAYBE' && (
                  <span className='font-semibold w-6 text-xl text-warning text-center'>
                    ?
                  </span>
                )}
                {member.rsvpStatus === 'NO' && (
                  <Icons.close className='text-error' />
                )}
                <span className='text-foreground'>{member.rsvpStatus}</span>
              </div>
            </DropdownMenuLabel>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setProfileDialogOpen(true);
            }}
            className='cursor-pointer'
          >
            <Icons.account className='size-4 mr-2' />
            <span>View Profile</span>
          </DropdownMenuItem>

          {/* Friend action - only show if not self */}
          {!isMe && personId && friendStatus === 'none' && (
            <DropdownMenuItem
              onClick={onSendFriendRequest}
              disabled={friendIsLoading}
              className='cursor-pointer'
            >
              <Icons.invite className='size-4 mr-2' />
              <span>Add Friend</span>
            </DropdownMenuItem>
          )}
          {!isMe && personId && friendStatus === 'pending_sent' && (
            <DropdownMenuItem
              onClick={onCancelFriendRequest}
              disabled={friendIsLoading}
              className='cursor-pointer text-muted-foreground'
            >
              <Icons.clock className='size-4 mr-2' />
              <span>Cancel Request</span>
            </DropdownMenuItem>
          )}
          {!isMe && personId && friendStatus === 'pending_received' && (
            <DropdownMenuItem
              onClick={onAcceptFriendRequest}
              disabled={friendIsLoading}
              className='cursor-pointer'
            >
              <Icons.check className='size-4 mr-2' />
              <span>Accept Request</span>
            </DropdownMenuItem>
          )}
          {!isMe && personId && friendStatus === 'friends' && (
            <DropdownMenuItem disabled className='text-muted-foreground'>
              <Icons.people className='size-4 mr-2' />
              <span>Friends</span>
            </DropdownMenuItem>
          )}

          {(canKick || canBan || canPromote) && <DropdownMenuSeparator />}

          {canPromote && (
            <>
              {member.role === 'ATTENDEE' && (
                <DropdownMenuItem
                  onClick={() => {
                    setDialogAction(MemberAction.PROMOTE);
                  }}
                  asChild
                  className='cursor-pointer'
                >
                  <DialogTrigger asChild>
                    <div className='flex items-center gap-1'>
                      <Icons.shield className='size-4' />
                      <span>Promote</span>
                    </div>
                  </DialogTrigger>
                </DropdownMenuItem>
              )}

              {member.role === 'MODERATOR' && (
                <DropdownMenuItem
                  onClick={() => {
                    setDialogAction(MemberAction.DEMOTE);
                  }}
                  asChild
                  className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
                >
                  <DialogTrigger asChild>
                    <div className='flex items-center gap-1'>
                      <Icons.shieldOff className='size-4' />
                      <span>Demote</span>
                    </div>
                  </DialogTrigger>
                </DropdownMenuItem>
              )}
            </>
          )}
          {canKick && (
            <DropdownMenuItem
              onClick={() => {
                setDialogAction(MemberAction.KICK);
              }}
              asChild
              className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
            >
              <DialogTrigger asChild>
                <div className='flex items-center gap-1'>
                  <Icons.kick className='size-4' />
                  <span>Kick</span>
                </div>
              </DialogTrigger>
            </DropdownMenuItem>
          )}
          {canBan && (
            <DropdownMenuItem
              onClick={() => {
                setDialogAction(MemberAction.BAN);
              }}
              asChild
              className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
            >
              <DialogTrigger asChild>
                <div className='flex items-center gap-1'>
                  <Icons.ban className='size-4' />
                  <span>Ban</span>
                </div>
              </DialogTrigger>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>
        <span>{fullName}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export default function MemberIcon({
  member,
  userRole,
  userId,
  itemKey,
  className,
  align,
  eventDateTime,
}: {
  member: Member;
  userRole: string;
  userId: string;
  itemKey: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  eventDateTime: Date | null;
}) {
  const user = member.person?.user;
  const role = member.role;

  const fullName = user?.name || user?.email || '';
  const initials = getInitialsFromName(
    user?.name ?? undefined,
    user?.email ?? undefined
  );

  componentLogger.debug('MemberIcon', 'Rendering member icon', {
    fullName,
    memberId: member._id,
  });

  const isMe = userId === member.person?._id;

  const canKick =
    !isMe &&
    ((userRole === 'MODERATOR' && member.role === 'ATTENDEE') ||
      userRole === 'ORGANIZER');

  // Ban permission: ORGANIZER can ban anyone (except self), MODERATOR can ban ATTENDEE
  const canBan =
    !isMe &&
    ((userRole === 'MODERATOR' && member.role === 'ATTENDEE') ||
      userRole === 'ORGANIZER');

  const canPromote = !isMe && userRole === 'ORGANIZER';

  const [dialogAction, setDialogAction] = useState<MemberAction>(
    MemberAction.KICK
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const isMobile = useMobile();

  // Friend actions
  const personId = member.person?._id as Id<'persons'> | undefined;
  const {
    status: friendStatus,
    isLoading: friendIsLoading,
    sendRequest,
    acceptRequest,
    cancelRequest,
  } = useFriendActions(personId);

  const handleSendFriendRequest = useCallback(async () => {
    await sendRequest();
  }, [sendRequest]);

  const handleAcceptFriendRequest = useCallback(async () => {
    await acceptRequest();
  }, [acceptRequest]);

  const handleCancelFriendRequest = useCallback(async () => {
    await cancelRequest();
  }, [cancelRequest]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isMobile) return;
      e.preventDefault();
      e.stopPropagation();
      setSheetOpen(true);
    },
    [isMobile]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        e.stopPropagation();
        setSheetOpen(true);
      }
    },
    [isMobile]
  );

  // Get online status for avatar indicator
  const presence = formatLastSeen(
    member.person?.lastSeen,
    member.person?.status as UserStatusType | undefined,
    member.person?.statusExpiresAt
  );

  const avatarElement = (
    <div className='relative'>
      <Avatar>
        <AvatarImage src={user?.image || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {/* Status indicator */}
      <StatusIndicator
        status={presence.displayStatus}
        size='md'
        className='absolute bottom-0 right-0'
      />
    </div>
  );

  return (
    <motion.div
      variants={item}
      initial='show'
      className={cn(
        'flex items-center rounded-full border-2 border-background hover:border-primary transition-colors z-lifted cursor-pointer',
        className
      )}
      key={itemKey}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ActionMenu
          isMobile={isMobile}
          handleContextMenu={handleContextMenu}
          handleClick={handleClick}
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          fullName={fullName}
          user={user}
          initials={initials}
          role={role}
          member={member}
          eventDateTime={eventDateTime}
          canKick={canKick}
          canBan={canBan}
          canPromote={canPromote}
          isMe={isMe}
          personId={personId}
          setDialogAction={setDialogAction}
          setDialogOpen={setDialogOpen}
          setProfileDialogOpen={setProfileDialogOpen}
          align={align}
          friendStatus={friendStatus as FriendshipStatus}
          friendIsLoading={friendIsLoading}
          onSendFriendRequest={handleSendFriendRequest}
          onAcceptFriendRequest={handleAcceptFriendRequest}
          onCancelFriendRequest={handleCancelFriendRequest}
        >
          {avatarElement}
        </ActionMenu>
        <MemberActionDialog action={dialogAction} member={member} />
        {member.person?.user && (
          <ProfileViewDialog
            userId={member.person.user._id}
            open={profileDialogOpen}
            onOpenChange={setProfileDialogOpen}
          />
        )}
      </Dialog>
    </motion.div>
  );
}
