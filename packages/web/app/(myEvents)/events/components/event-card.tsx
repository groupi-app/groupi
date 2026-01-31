'use client';

import { formatDate, formatDateTimeRangeShort } from '@/lib/utils';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeleteEventDialog } from '@/app/(event)/event/[eventId]/components/deleteEventDialog';
import { LeaveEventDialog } from '@/app/(event)/event/[eventId]/components/leaveEventDialog';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import {
  useIsEventMutedFromContext,
  useToggleEventMute,
} from '@/hooks/convex/use-muting';

type OrganizerData = {
  person: Doc<'persons'>;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
} | null;

export function EventCard({
  event,
  userRole,
  eventId,
  organizer,
}: {
  event: Doc<'events'>;
  userRole: string;
  eventId: Id<'events'>;
  organizer: OrganizerData;
}) {
  const {
    _id: id,
    title,
    description,
    location,
    chosenDateTime,
    _creationTime: createdAt,
    _creationTime: updatedAt,
  } = event;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const {
    sheetOpen,
    setSheetOpen,
    handleContextMenu,
    handleClick,
    handleMoreClick,
  } = useActionMenu();
  const isOrganizer = userRole === 'ORGANIZER';

  // Muting state (uses bulk context to avoid per-event queries)
  const { isMuted, setOptimisticMuted } = useIsEventMutedFromContext(eventId);
  const toggleMute = useToggleEventMute();

  const handleToggleMute = async () => {
    setSheetOpen(false);
    await toggleMute(eventId, isMuted, setOptimisticMuted);
  };

  // Drawer content for mobile
  const drawerContent = (
    <div className='flex flex-col gap-2 px-4 pb-4 pt-4'>
      <Button
        variant='ghost'
        className='w-full justify-start'
        onClick={handleToggleMute}
      >
        {isMuted ? (
          <>
            <Icons.bell className='size-4 mr-2' />
            Unmute Event
          </>
        ) : (
          <>
            <Icons.bellOff className='size-4 mr-2' />
            Mute Event
          </>
        )}
      </Button>
      {isOrganizer ? (
        <>
          <Button variant='ghost' className='w-full justify-start' asChild>
            <Link href={`/event/${eventId}/edit`}>
              <Icons.edit className='size-4 mr-2' />
              Edit Details
            </Link>
          </Button>
          <Button variant='ghost' className='w-full justify-start' asChild>
            <Link href={`/event/${eventId}/change-date`}>
              <Icons.date className='size-4 mr-2' />
              Change Date
            </Link>
          </Button>
          <Button
            variant='ghost'
            className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
            onClick={() => {
              setSheetOpen(false);
              setDeleteDialogOpen(true);
            }}
          >
            <Icons.delete className='size-4 mr-2' />
            Delete Event
          </Button>
        </>
      ) : (
        <Button
          variant='ghost'
          className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
          onClick={() => {
            setSheetOpen(false);
            setLeaveDialogOpen(true);
          }}
        >
          <Icons.leave className='size-4 mr-2' />
          Leave Event
        </Button>
      )}
    </div>
  );

  // Context menu content for desktop
  const contextMenuContent = (
    <>
      <ContextMenuItem
        onSelect={e => {
          e.preventDefault();
          handleToggleMute();
        }}
        className='cursor-pointer'
      >
        <div className='flex items-center gap-1'>
          {isMuted ? (
            <>
              <Icons.bell className='size-4' />
              <span>Unmute Event</span>
            </>
          ) : (
            <>
              <Icons.bellOff className='size-4' />
              <span>Mute Event</span>
            </>
          )}
        </div>
      </ContextMenuItem>
      {isOrganizer ? (
        <>
          <ContextMenuItem className='cursor-pointer' asChild>
            <Link href={`/event/${eventId}/edit`}>
              <div className='flex items-center gap-1'>
                <Icons.edit className='size-4' />
                <span>Edit Details</span>
              </div>
            </Link>
          </ContextMenuItem>
          <ContextMenuItem className='cursor-pointer' asChild>
            <Link href={`/event/${eventId}/change-date`}>
              <div className='flex items-center gap-1'>
                <Icons.date className='size-4' />
                <span>Change Date</span>
              </div>
            </Link>
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={e => {
              e.preventDefault();
              setDeleteDialogOpen(true);
            }}
            className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
          >
            <div className='flex items-center gap-1'>
              <Icons.delete className='size-4' />
              <span>Delete Event</span>
            </div>
          </ContextMenuItem>
        </>
      ) : (
        <ContextMenuItem
          onSelect={e => {
            e.preventDefault();
            setLeaveDialogOpen(true);
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <div className='flex items-center gap-1'>
            <Icons.leave className='size-4' />
            <span>Leave Event</span>
          </div>
        </ContextMenuItem>
      )}
    </>
  );

  // Dropdown menu content for desktop action button
  const dropdownContent = (
    <>
      <DropdownMenuItem
        onSelect={e => {
          e.preventDefault();
          handleToggleMute();
        }}
        className='cursor-pointer'
      >
        <div className='flex items-center gap-1'>
          {isMuted ? (
            <>
              <Icons.bell className='size-4' />
              <span>Unmute Event</span>
            </>
          ) : (
            <>
              <Icons.bellOff className='size-4' />
              <span>Mute Event</span>
            </>
          )}
        </div>
      </DropdownMenuItem>
      {isOrganizer ? (
        <>
          <DropdownMenuItem className='cursor-pointer' asChild>
            <Link href={`/event/${eventId}/edit`}>
              <div className='flex items-center gap-1'>
                <Icons.edit className='size-4' />
                <span>Edit Details</span>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className='cursor-pointer' asChild>
            <Link href={`/event/${eventId}/change-date`}>
              <div className='flex items-center gap-1'>
                <Icons.date className='size-4' />
                <span>Change Date</span>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={e => {
              e.preventDefault();
              setDeleteDialogOpen(true);
            }}
            className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
          >
            <div className='flex items-center gap-1'>
              <Icons.delete className='size-4' />
              <span>Delete Event</span>
            </div>
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault();
            setLeaveDialogOpen(true);
          }}
          className='cursor-pointer focus:bg-destructive focus:text-destructive-foreground'
        >
          <div className='flex items-center gap-1'>
            <Icons.leave className='size-4' />
            <span>Leave Event</span>
          </div>
        </DropdownMenuItem>
      )}
    </>
  );

  const cardContent = (
    <div className='relative group'>
      <ActionMenuButton
        onClick={handleMoreClick}
        onContextMenu={handleContextMenu}
        className='absolute z-float size-8 hover:bg-accent transition-all rounded-md top-2 right-2 flex items-center justify-center'
        dropdownContent={dropdownContent}
      >
        <Icons.more className='size-4' />
      </ActionMenuButton>
      <Link href={`/event/${id}`}>
        <div className='flex flex-col gap-2 border border-border shadow-floating p-4 px-6 hover:bg-accent transition-all cursor-pointer rounded-md'>
          <div className='flex flex-col md:flex-row gap-2 md:gap-8'>
            <div className='flex flex-col grow gap-2 md:w-1/2'>
              <div className='flex items-center gap-2'>
                <h1 className='font-heading text-2xl'>{title}</h1>
                {isMuted && (
                  <Icons.bellOff className='size-5 text-muted-foreground' />
                )}
              </div>
              {organizer && (
                <div className='flex items-center gap-2'>
                  <Avatar className='size-6'>
                    <AvatarImage
                      src={organizer.user.image || undefined}
                      alt={organizer.user.name || organizer.user.email}
                    />
                    <AvatarFallback className='text-xs'>
                      {(organizer.user.name || organizer.user.email)
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm text-muted-foreground'>
                    {organizer.user.name || organizer.user.email}
                  </span>
                </div>
              )}
              <p className='text-muted-foreground line-clamp-3'>
                {description}
              </p>
            </div>
            <div className='flex flex-col md:w-1/2 justify-between gap-2'>
              <div className='flex flex-col gap-2'>
                {location && (
                  <div className='flex items-center gap-1 '>
                    <Icons.location className='size-6 text-primary' />
                    <span>{location}</span>
                  </div>
                )}
                <div className='flex items-center gap-1 '>
                  <Icons.date className='size-6 text-primary' />
                  {chosenDateTime != null ? (
                    <span>
                      {formatDateTimeRangeShort(
                        chosenDateTime,
                        event.chosenEndDateTime
                      )}
                    </span>
                  ) : (
                    <span>TBD</span>
                  )}
                </div>
              </div>
              <div className='flex flex-col'>
                <div className='flex items-center gap-1 '>
                  <span className='text-muted-foreground'>
                    Created {formatDate(new Date(createdAt))}
                  </span>
                </div>
                <div className='flex items-center gap-1 '>
                  <span className='text-muted-foreground'>
                    Last activity {formatDate(new Date(updatedAt))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );

  return (
    <>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteEventDialog eventId={eventId} />
      </Dialog>
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <LeaveEventDialog eventId={eventId} />
      </Dialog>
      <ActionMenu
        drawerTitle='Event Options'
        drawerContent={drawerContent}
        contextMenuContent={contextMenuContent}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {cardContent}
      </ActionMenu>
    </>
  );
}
