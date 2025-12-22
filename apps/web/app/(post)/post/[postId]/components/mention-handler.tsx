'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer';
import { Dialog } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  formatRoleBadge,
  formatRoleName,
  getInitialsFromName,
} from '@/lib/utils';
import {
  MemberAction,
  MemberActionDialog,
} from '@/components/member-action-dialog';
import { ProfileViewDialog } from '@/components/profile-view-dialog';
import { useMobile } from '@/hooks/use-mobile';
import type { PostDetailPageData } from '@groupi/schema/data';
import type { RoleType } from '@groupi/schema';

type Member = PostDetailPageData['post']['event']['memberships'][0];

interface MentionHandlerProps {
  children: React.ReactNode;
  members: Member[];
  userId: string;
  userRole: RoleType;
  eventDateTime: Date | null;
}

export function MentionHandler({
  children,
  members,
  userId,
  userRole,
  eventDateTime,
}: MentionHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [mentionElement, setMentionElement] = useState<HTMLElement | null>(
    null
  );
  const [dialogAction, setDialogAction] = useState<MemberAction>(
    MemberAction.KICK
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const isMobile = useMobile();

  const handleMentionClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mention = target.closest('.mention') as HTMLElement | null;

      if (mention) {
        e.preventDefault();
        e.stopPropagation();

        const personId = mention.getAttribute('data-id');
        if (personId) {
          const member = members.find(m => m.personId === personId);
          if (member) {
            setSelectedMember(member);
            setMentionElement(mention);
            if (isMobile) {
              setSheetOpen(true);
            }
          }
        }
      }
    },
    [members, isMobile]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Make mentions clickable
    const mentions = container.querySelectorAll('.mention');
    mentions.forEach(mention => {
      (mention as HTMLElement).style.cursor = 'pointer';
    });

    container.addEventListener('click', handleMentionClick);

    return () => {
      container.removeEventListener('click', handleMentionClick);
    };
  }, [handleMentionClick]);

  if (!selectedMember || !mentionElement) {
    return <div ref={containerRef}>{children}</div>;
  }

  const user = selectedMember.person.user;
  const fullName = user?.name || user?.email || '';
  const initials = getInitialsFromName(user?.name, user?.email);
  const isMe = userId === selectedMember.person.id;
  const canKick =
    !isMe &&
    ((userRole === 'MODERATOR' && selectedMember.role === 'ATTENDEE') ||
      userRole === 'ORGANIZER');
  const canPromote = !isMe && userRole === 'ORGANIZER';

  const memberMenuContent = (
    <>
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
            {formatRoleBadge(selectedMember.role)}
          </div>
          <span className='text-card-foreground'>
            {formatRoleName(selectedMember.role)}
          </span>
        </div>
      </DropdownMenuLabel>
      {eventDateTime && (
        <DropdownMenuLabel>
          <div className='flex items-center gap-1 text-muted-foreground'>
            <span>RSVP: </span>
            {selectedMember.rsvpStatus === 'YES' && (
              <Icons.check className='text-green-500' />
            )}
            {selectedMember.rsvpStatus === 'MAYBE' && (
              <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                ?
              </span>
            )}
            {selectedMember.rsvpStatus === 'NO' && (
              <Icons.close className='text-red-500' />
            )}
            <span className='text-foreground'>{selectedMember.rsvpStatus}</span>
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
        View Profile
      </DropdownMenuItem>
      {(canKick || canPromote) && <DropdownMenuSeparator />}
      {canPromote && (
        <>
          {selectedMember.role === 'ATTENDEE' && (
            <DropdownMenuItem
              onClick={() => {
                setDialogAction(MemberAction.PROMOTE);
                setDialogOpen(true);
              }}
              className='cursor-pointer'
            >
              <Icons.shield className='size-4 mr-2' />
              Promote
            </DropdownMenuItem>
          )}
          {selectedMember.role === 'MODERATOR' && (
            <DropdownMenuItem
              onClick={() => {
                setDialogAction(MemberAction.DEMOTE);
                setDialogOpen(true);
              }}
              className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
            >
              <Icons.shieldOff className='size-4 mr-2' />
              Demote
            </DropdownMenuItem>
          )}
        </>
      )}
      {canKick && (
        <DropdownMenuItem
          onClick={() => {
            setDialogAction(MemberAction.KICK);
            setDialogOpen(true);
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <Icons.kick className='size-4 mr-2' />
          Kick
        </DropdownMenuItem>
      )}
    </>
  );

  return (
    <>
      <div ref={containerRef}>{children}</div>
      {isMobile ? (
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen} modal={true}>
          <DrawerContent>
            <DrawerHeader className='text-left'>
              <div className='flex items-center gap-3 mb-4'>
                <Avatar>
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <div className='text-base font-medium'>{fullName}</div>
                  <div className='text-sm text-muted-foreground'>
                    {user?.username ? `@${user.username}` : user?.email}
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-1 mb-2'>
                <div>{formatRoleBadge(selectedMember.role)}</div>
                <span>{formatRoleName(selectedMember.role)}</span>
              </div>
              {eventDateTime && (
                <div className='flex items-center gap-1 text-muted-foreground'>
                  <span>RSVP: </span>
                  {selectedMember.rsvpStatus === 'YES' && (
                    <Icons.check className='text-green-500' />
                  )}
                  {selectedMember.rsvpStatus === 'MAYBE' && (
                    <span className='font-semibold w-6 text-xl text-yellow-500 text-center'>
                      ?
                    </span>
                  )}
                  {selectedMember.rsvpStatus === 'NO' && (
                    <Icons.close className='text-red-500' />
                  )}
                  <span className='text-foreground'>
                    {selectedMember.rsvpStatus}
                  </span>
                </div>
              )}
              <div className='flex flex-col gap-2 mt-4'>
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
                    {canPromote && selectedMember.role === 'ATTENDEE' && (
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
                    {canPromote && selectedMember.role === 'MODERATOR' && (
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
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      ) : (
        selectedMember &&
        mentionElement && (
          <DropdownMenu
            open={!!selectedMember}
            onOpenChange={open => {
              if (!open) {
                setSelectedMember(null);
                setMentionElement(null);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <div
                style={{
                  position: 'fixed',
                  left: mentionElement.getBoundingClientRect().left,
                  top: mentionElement.getBoundingClientRect().bottom + 4,
                  width: 1,
                  height: 1,
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-64'>
              {memberMenuContent}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedMember && (
          <MemberActionDialog action={dialogAction} member={selectedMember} />
        )}
      </Dialog>
      {selectedMember && (
        <ProfileViewDialog
          userId={selectedMember.person.id}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
    </>
  );
}
