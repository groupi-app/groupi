'use client';

import {
  cn,
  formatRoleBadge,
  formatRoleName,
  getInitialsFromName,
} from '@/lib/utils';
import { MemberListPageData, RoleType } from '@groupi/schema';

type Member = MemberListPageData['event']['memberships'][0];
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
import { useState, useCallback } from 'react';
import { useMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';

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
  user: Member['person']['user'];
  initials: string;
  role: Member['role'];
  member: Member;
  eventDateTime: Date | null;
  canKick: boolean;
  canPromote: boolean;
  setDialogAction: (action: MemberAction) => void;
  setDialogOpen: (open: boolean) => void;
  setProfileDialogOpen: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
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
  canPromote,
  setDialogAction,
  setDialogOpen,
  setProfileDialogOpen,
  align,
}: ActionMenuProps) {
  if (isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onContextMenu={handleContextMenu}
            onClick={handleClick}
            style={{ touchAction: 'manipulation' }}
            className='rounded-full cursor-pointer'
          >
            {children}
          </div>
        </TooltipTrigger>
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
                    <Icons.check className='text-green-500' />
                  )}
                  {member.rsvpStatus === 'MAYBE' && (
                    <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                      ?
                    </span>
                  )}
                  {member.rsvpStatus === 'NO' && (
                    <Icons.close className='text-red-500' />
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
              {(canKick || canPromote) && (
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
                </>
              )}
            </div>
          </DrawerContent>
        </Drawer>
        <TooltipContent>
          <span>{fullName}</span>
        </TooltipContent>
      </Tooltip>
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
                  <Icons.check className='text-green-500' />
                )}
                {member.rsvpStatus === 'MAYBE' && (
                  <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                    ?
                  </span>
                )}
                {member.rsvpStatus === 'NO' && (
                  <Icons.close className='text-red-500' />
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

          {(canKick || canPromote) && <DropdownMenuSeparator />}

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
  userRole: RoleType;
  userId: string;
  itemKey: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
  eventDateTime: Date | null;
}) {
  const user = member.person.user;
  const role = member.role;

  const fullName = user?.name || user?.email || '';
  const initials = getInitialsFromName(user?.name, user?.email);

  componentLogger.debug(
    {
      fullName,
      memberId: member.id,
    },
    'Rendering member icon'
  );

  const isMe = userId === member.person.id;

  const canKick =
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

  const avatarElement = (
    <Avatar>
      <AvatarImage src={user?.image || undefined} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );

  return (
    <motion.div
      variants={item}
      initial='show'
      className={cn(
        'flex items-center rounded-full border-2 border-background hover:border-primary transition-colors z-10',
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
          canPromote={canPromote}
          setDialogAction={setDialogAction}
          setDialogOpen={setDialogOpen}
          setProfileDialogOpen={setProfileDialogOpen}
          align={align}
        >
          {avatarElement}
        </ActionMenu>
        <MemberActionDialog action={dialogAction} member={member} />
        <ProfileViewDialog
          userId={member.person.id}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      </Dialog>
    </motion.div>
  );
}

