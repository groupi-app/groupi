'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HostingBadge, StickerIcon } from '@/components/atoms';
import { Icons } from '@/components/icons';
import { cn, formatDateTimeRangeShort } from '@/lib/utils';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Dialog } from '@/components/ui/dialog';
import { DeleteEventDialog } from '@/app/(event)/event/[eventId]/components/deleteEventDialog';
import { LeaveEventDialog } from '@/app/(event)/event/[eventId]/components/leaveEventDialog';
import { useActionMenu } from '@/hooks/use-action-menu';
import { ActionMenu } from '@/components/ui/action-menu';
import { ActionMenuButton } from '@/components/ui/action-menu-button';
import { Button } from '@/components/ui/button';
import { ContextMenuItem } from '@/components/ui/context-menu';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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

export interface VisualEventCardProps {
  /** Event document */
  event: Doc<'events'> & { imageUrl?: string | null; memberCount?: number };
  /** User's role in this event */
  userRole: string;
  /** Event ID */
  eventId: Id<'events'>;
  /** Organizer data */
  organizer: OrganizerData;
  /** Additional class names */
  className?: string;
}

// Gradient patterns for events without images
// Using semantic color tokens with opacity for decorative fallbacks
const gradientPatterns = [
  'from-primary/20 to-secondary/20',
  'from-accent/30 to-muted/30',
  'from-muted/40 to-card/20',
  'from-secondary/25 to-accent/25',
  'from-card/30 to-primary/15',
];

/**
 * VisualEventCard - Event card with cover image in Partiful style
 */
export function VisualEventCard({
  event,
  userRole,
  eventId,
  organizer,
  className,
}: VisualEventCardProps) {
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

  // Muting state
  const { isMuted, setOptimisticMuted } = useIsEventMutedFromContext(eventId);
  const toggleMute = useToggleEventMute();

  const handleToggleMute = async () => {
    setSheetOpen(false);
    await toggleMute(eventId, isMuted, setOptimisticMuted);
  };

  // Consistent gradient based on event ID
  const gradientIndex =
    eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    gradientPatterns.length;
  const gradientClass = gradientPatterns[gradientIndex];

  // Focal point for image positioning
  const focalX = event.imageFocalPoint?.x ?? 50;
  const focalY = event.imageFocalPoint?.y ?? 50;

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
            className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
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
          className='w-full justify-start hover:bg-destructive hover:text-destructive-foreground'
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
    <div
      className={cn(
        'relative group',
        'transition-all duration-fast ease-bounce',
        'hover:scale-[1.02] active:scale-[0.98]'
      )}
    >
      {/* Action menu button */}
      <ActionMenuButton
        onClick={handleMoreClick}
        onContextMenu={handleContextMenu}
        className='absolute z-float size-8 bg-card/80 backdrop-blur-sm hover:bg-card transition-colors rounded-md top-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100'
        dropdownContent={dropdownContent}
      >
        <Icons.more className='size-4' />
      </ActionMenuButton>

      <Link href={`/event/${eventId}`}>
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-card shadow-raised bg-card cursor-pointer',
            'transition-shadow duration-fast ease-bounce',
            'group-hover:shadow-floating',
            className
          )}
        >
          {/* Cover image area */}
          <div className='relative aspect-[16/9] overflow-hidden'>
            {event.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- Convex storage URLs require native img */
              <img
                src={event.imageUrl}
                alt={event.title}
                className='absolute inset-0 w-full h-full object-cover'
                style={{ objectPosition: `${focalX}% ${focalY}%` }}
              />
            ) : (
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  gradientClass
                )}
              >
                <div className='absolute inset-0 flex items-center justify-center'>
                  <Icons.party className='size-12 text-muted-foreground/30' />
                </div>
              </div>
            )}

            {/* Hosting badge - top left */}
            {isOrganizer && <HostingBadge className='absolute top-3 left-3' />}

            {/* Muted indicator - top left (after hosting badge or alone) */}
            {isMuted && (
              <div
                className={cn(
                  'absolute top-3 bg-card/90 backdrop-blur-sm rounded-full p-1.5 shadow-raised',
                  isOrganizer ? 'left-11' : 'left-3'
                )}
              >
                <Icons.bellOff className='size-3.5 text-muted-foreground' />
              </div>
            )}
          </div>

          {/* Content area */}
          <div className='p-4 flex flex-col gap-2'>
            {/* Title */}
            <h3 className='font-heading text-lg font-medium line-clamp-1'>
              {event.title}
            </h3>

            {/* Description */}
            {event.description && (
              <p className='text-sm text-muted-foreground line-clamp-2'>
                {event.description}
              </p>
            )}

            {/* Date/Time */}
            <div className='flex items-center gap-2 text-sm'>
              <StickerIcon icon={Icons.date} size='xs' color='primary' />
              <span className='text-muted-foreground'>
                {event.chosenDateTime
                  ? formatDateTimeRangeShort(
                      event.chosenDateTime,
                      event.chosenEndDateTime
                    )
                  : 'Date TBD'}
              </span>
            </div>

            {/* Location */}
            {event.location && (
              <div className='flex items-center gap-2 text-sm'>
                <StickerIcon icon={Icons.location} size='xs' color='primary' />
                <span className='text-muted-foreground line-clamp-1'>
                  {event.location}
                </span>
              </div>
            )}

            {/* Organizer */}
            {organizer && (
              <div className='flex items-center gap-2 mt-1'>
                <Avatar className='size-5'>
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
                <span className='text-sm text-muted-foreground line-clamp-1'>
                  {organizer.user.name || organizer.user.email}
                </span>
              </div>
            )}
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
